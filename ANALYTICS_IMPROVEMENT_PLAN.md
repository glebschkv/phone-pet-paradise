# Analytics & Tracking — Detailed Improvement Plan

Comprehensive audit of the analytics page, data tracking layer, timer integration,
and all 20+ visualization components. Below are every bug, architectural issue,
data integrity gap, missing feature, performance concern, and test coverage hole
found — organized by priority.

---

## 1. BUGS (actively broken)

### 1.1 `countup` session type not handled in SessionHistory
**File:** `src/components/analytics/AnalyticsSessionHistory.tsx:22-53`
**Severity:** Medium

`getTypeIcon()`, `getTypeLabel()`, and `getTypeColor()` use switch statements
that handle `pomodoro`, `deep-work`, and `break` — but NOT `countup`.
Countup sessions render with no icon, no label, and no color in the history list.

**Fix:** Add a `countup` case to each switch (e.g., icon: `Hourglass`,
label: "Open Focus", color: `text-cyan-500 bg-cyan-500/10`).

---

### 1.2 `focusQuality` always `'distracted'` for users without app blocking
**Files:** `src/components/focus-timer/hooks/useTimerControls.ts:176-181`,
`src/components/focus-timer/hooks/useTimerLogic.ts:224-230`
**Severity:** High

The focus-quality logic is:
```ts
focusQuality = shieldAttempts === 0 && hasAppsConfigured
  ? 'perfect'
  : shieldAttempts <= 2 && hasAppsConfigured
    ? 'good'
    : 'distracted';
```

When `hasAppsConfigured` is `false`, the result is always `'distracted'` —
even for users who never use app blocking and focused perfectly. This unfairly
tanks their Focus Score quality component (0-25 pts).

**Fix:** When `!hasAppsConfigured`, set `focusQuality` to `undefined` instead
of `'distracted'`. The Focus Score computation already handles undefined quality
with a default middle score (12/25).

---

### 1.3 `handleComplete` records wrong `actualDuration` for countup sessions
**File:** `src/components/focus-timer/hooks/useTimerLogic.ts:232-235`
**Severity:** High

```ts
recordSession(
  state.timerState.sessionType,
  state.timerState.sessionDuration,   // plannedDuration
  state.timerState.sessionDuration,   // actualDuration (SAME!)
  'completed',
  ...
);
```

For countdown sessions this is fine (planned = actual on completion). For
**countup** sessions, `sessionDuration` is `MAX_COUNTUP_DURATION` (21600 =
6 hours), so every completed countup session is recorded as 6 hours actual,
regardless of how long the user actually focused.

**Fix:** For countup, pass `state.timerState.elapsedTime || 0` as
`actualDuration`.

---

### 1.4 Failing test: `completionRate` returns 0 for empty sessions
**File:** `src/test/hooks/useAnalytics.test.ts:488`
**Severity:** Low

Test expects `completionRate` to be `100` when no sessions exist, but the hook
returns `0`. The code at `useAnalytics.ts:502` does:
```ts
if (recentSessions.length === 0) return 0;
```

Either fix the test to expect 0, or change the code to return 100 (arguably more
correct — "you haven't abandoned anything"). Decision needed on which is the
desired behavior.

---

### 1.5 Weekly chart day-label padding produces wrong labels
**File:** `src/components/analytics/AnalyticsWeeklyChart.tsx:29-38`
**Severity:** Low

When padding `chartData` to 7 days, it uses `chartData.length` as the
`DAY_LABELS` index. After the first pad, `chartData.length` changes, so
subsequent pads use the wrong label. Also, it always pads to the front
(`unshift`), but the correct behavior depends on which days are missing.

**Fix:** Build chart data from the actual 7-day date range instead of padding.

---

### 1.6 `hourlyFocus` attributes all session time to the start hour
**File:** `src/hooks/useAnalytics.ts:252-255`
**Severity:** Medium

A 90-minute session starting at 10:45 AM records all 90 minutes under hour 10.
The "Best Focus Hours" feature (`AnalyticsBestHours`) then shows misleading
data — hour 11 gets zero credit despite having 45 minutes of actual focus.

**Fix:** Split duration across hours proportionally based on start/end timestamps.

---

## 2. DATA INTEGRITY ISSUES

### 2.1 `useAnalytics` is NOT a singleton — multi-instance state divergence
**File:** `src/hooks/useAnalytics.ts`
**Severity:** Critical

Every component that calls `useAnalytics()` gets its **own independent
`useState`** for sessions, dailyStats, settings, and records. When the timer
completes a session and calls `recordSession()`, the Analytics page (which has
its own hook instance) won't see the update until it re-mounts.

**Current impact:**
- `useTimerLogic.ts` has its own `useAnalytics()` instance (line 37)
- `useTimerControls.ts` has another instance (line 50)
- `Analytics.tsx` has yet another instance (line 97)

These three instances all load from localStorage independently and write back
independently. Rapid successive writes can **overwrite each other's data**.

**Fix:** Convert to a Zustand store (consistent with the rest of the app's
state management — `streakStore`, `xpStore`, `focusStore` all use Zustand).
Or create a single React Context provider wrapping `useAnalytics` at the
app level. Either approach ensures a single source of truth in memory.

---

### 2.2 Stale closure in `recordSession` callback
**File:** `src/hooks/useAnalytics.ts:204-332`
**Severity:** High

`recordSession` captures `sessions`, `dailyStats`, and `records` via closure.
If two sessions are recorded in the same render cycle (unlikely but possible
during fast skip → next session flows), the second call sees stale state and
its data is lost when the first call's state update takes effect.

**Fix:** Use functional state updaters (`setSessions(prev => [...prev, session])`)
or migrate to Zustand where mutations are synchronous.

---

### 2.3 No schema validation on localStorage load
**File:** `src/hooks/useAnalytics.ts:55-76`
**Severity:** Medium

Data is loaded with `storage.get<T>()` which does a raw `JSON.parse` with no
validation. If localStorage data is corrupted (browser extension, manual edit,
schema change between app versions), the hook will silently load bad data and
crash downstream.

The storage layer already supports `storage.getValidated()` with Zod schemas,
but analytics doesn't use it.

**Fix:** Define Zod schemas for `FocusSession[]`, `DailyStats`, `PersonalRecords`,
and `AnalyticsSettings`, then use `storage.getValidatedOrDefault()` on load.

---

### 2.4 `dailyStats` record grows unbounded
**File:** `src/hooks/useAnalytics.ts`
**Severity:** Medium

Sessions are pruned to 90 days (line 82-83), but `dailyStats` is never pruned.
A user active for 2 years would have ~730 entries. Each entry contains
`hourlyFocus` (up to 24 keys) and `categoryTime` (up to 6 keys), so the
localStorage blob grows without bound.

**Fix:** Prune `dailyStats` entries older than 90 days (matching sessions), or
archive old data into monthly summaries.

---

### 2.5 Timezone inconsistency between date and hour calculations
**File:** `src/hooks/useAnalytics.ts:22-28`
**Severity:** Medium

```ts
const getDateString = (ts) => new Date(ts).toISOString().split('T')[0]; // UTC
const getHour = (ts) => new Date(ts).getHours(); // LOCAL TIME
```

A session at 11:30 PM local time (UTC+5) would be attributed to the **next
day** for `dateStr` (UTC) but to hour 23 (local) for `hourlyFocus`. The
session goes into tomorrow's daily stats but today's hourly bucket.

**Fix:** Use `toLocaleDateString` with consistent locale or standardize on
a single timezone approach throughout.

---

### 2.6 `createEmptyDailyStats` missing `categoryTime` field
**File:** `src/types/analytics.ts:152-161`
**Severity:** Low

The factory function doesn't initialize `categoryTime`, so code accessing
`existingStats.categoryTime` can return `undefined`. The hook works around this
with `...(existingStats.categoryTime || {})` but components could break.

**Fix:** Add `categoryTime: {}` to the factory function.

---

## 3. ARCHITECTURE ISSUES

### 3.1 Monolithic 1140-line hook
**File:** `src/hooks/useAnalytics.ts`
**Severity:** Medium (maintainability)

The hook handles: data loading, persistence, session recording, daily/weekly/
monthly stat computation, focus score algorithm, insights generation, milestone
tracking, peer benchmark simulation, formatting utilities, and settings
management. This makes it hard to test, reason about, or extend.

**Fix:** Split into focused modules:
- `analyticsStore.ts` — Zustand store for state + persistence
- `useAnalyticsComputed.ts` — Derived values (focus score, insights, etc.)
- `useAnalyticsActions.ts` — recordSession, updateSettings, reset
- `analytics-utils.ts` — formatDuration, date helpers, score algorithms

---

### 3.2 `focusScore.score` in `recordSession` dependency array
**File:** `src/hooks/useAnalytics.ts:332`
**Severity:** Low

`recordSession` depends on `focusScore.score` because it snapshots it into
`dailyStats.focusScore`. This means every time the score changes (which happens
when sessions change), `recordSession` gets a new reference, causing unnecessary
re-renders in every component that uses it.

**Fix:** Read `focusScore.score` via a ref instead of a dependency.

---

### 3.3 `peerBenchmark` is simulated (fake) data
**File:** `src/hooks/useAnalytics.ts:1055-1062`
**Severity:** Medium (trust)

The "Better than X% of focusers" stat uses a sigmoid curve — no real peer data
exists. Users may think they're being compared to real users.

**Fix:** Either (a) remove or clearly label as "estimated", (b) connect to
actual anonymized aggregate data from Supabase backend, or (c) hide behind a
"coming soon" flag.

---

## 4. MISSING FEATURES / DATA GAPS

### 4.1 Weekly goal is defined but never tracked
**Files:** `src/types/analytics.ts:93`, `src/hooks/useAnalytics.ts`
**Priority:** Medium

`AnalyticsSettings.weeklyGoalMinutes` exists (default 600 = 10 hours) and is
configurable in settings, but there's no weekly goal progress ring, no weekly
goal streak, and no weekly goal-met marker in the UI.

**Fix:** Add a `WeeklyGoalRing` component and track weekly goal completion
alongside daily.

---

### 4.2 Session notes/ratings not linked to analytics
**Files:** `src/components/focus-timer/hooks/useSessionNotes.ts`,
`src/types/analytics.ts:37-38`
**Priority:** Medium

`FocusSession` has `rating` and `hasNotes` fields, but `handleSessionNotesSave`
in `useTimerLogic.ts` saves notes to a separate storage key
(`SESSION_NOTES`) — they're never attached to the session record in analytics.

**Fix:** After saving notes, update the corresponding `FocusSession` in the
analytics sessions array with `rating` and `hasNotes = true`.

---

### 4.3 No data export capability
**Priority:** Medium

Users cannot export their analytics data (CSV, JSON, PDF report). For a
wellness/productivity app, data portability is important for trust and
retention.

**Fix:** Add an "Export Data" button in SettingsAnalytics that generates:
- CSV with session history
- JSON with full analytics dump
- Optional PDF weekly/monthly report

---

### 4.4 No date range picker for historical analysis
**Priority:** Low

All views show fixed windows (today, this week, last 30 days). Users can't look
at "last month" or a custom date range.

**Fix:** Add a date range selector to the Analytics container that adjusts the
data window for all child components.

---

### 4.5 Abandoned session time counted as focus time in `dailyStats`
**File:** `src/hooks/useAnalytics.ts:265`
**Priority:** Medium

```ts
totalFocusTime: existingStats.totalFocusTime + (isWorkSession ? safeActual : 0),
```

This adds `safeActual` for ALL work sessions regardless of status. An abandoned
5-minute session inflates daily focus time. The `records.totalFocusTime` has the
same issue (line 291).

**Fix:** Only count `status === 'completed'` or `status === 'skipped'` sessions
toward focus time (or at minimum, require a configurable minimum duration
threshold, e.g., 60 seconds).

---

### 4.6 No "streak freeze" integration in analytics goal streak
**File:** `src/hooks/useAnalytics.ts:109-128`
**Priority:** Low

`calculateGoalStreak` breaks on any day without goal met. But the app has
"streak freeze" items (visible in `AnalyticsStreakAlert`). The streak
calculation doesn't account for freeze days, creating inconsistency.

**Fix:** Cross-reference streak freeze usage from `streakStore` when calculating
the analytics goal streak.

---

## 5. PERFORMANCE ISSUES

### 5.1 Expensive recomputations on every session change
**File:** `src/hooks/useAnalytics.ts`
**Priority:** Medium

The following `useMemo` values all depend on `sessions` (the full array):
- `focusScore` — iterates all 90-day sessions, computes stats
- `focusQualityStats` — iterates sessions, sorts, groups by week
- `completionTrend` — iterates sessions 4 times (once per week)
- `completionRate` — iterates sessions
- `insights` — calls multiple computations, accesses most computed values

After recording a single session, ALL of these recompute. With 90 days of data
(potentially hundreds of sessions), this could cause frame drops on low-end
mobile devices.

**Fix:** Use selector-based memoization (Zustand selectors or `reselect`), or
pre-compute incremental updates in `recordSession` rather than recomputing from
scratch.

---

### 5.2 `thisWeekStats` and `lastWeekStats` iterate sessions redundantly
**File:** `src/hooks/useAnalytics.ts:377-384, 428-435`
**Priority:** Low

Both memos iterate the full `sessions` array to find sessions matching each
date — an O(sessions × 7) operation done twice. Sessions are already indexed
by day in `dailyStats`, making the session iteration unnecessary.

**Fix:** Compute `averageSessionLength` from `dailyStats` aggregates instead of
re-iterating the session array.

---

### 5.3 `migrateKey` called on every `storage.get`
**File:** `src/lib/storage-keys.ts:193-196`
**Priority:** Low

Every call to `storage.get()` runs `migrateKey()`, which scans
`LEGACY_KEY_MAP` for matching legacy keys and attempts `localStorage.getItem`
for each. This is ~2 legacy key lookups per analytics read, happening on every
mount.

**Fix:** Add a "migration completed" flag to localStorage. Once migration runs
once, skip on subsequent reads.

---

## 6. TEST COVERAGE GAPS

### 6.1 Missing test suites
**File:** `src/test/hooks/useAnalytics.test.ts`

The existing test file covers basic CRUD operations but is missing tests for:

| Feature | Lines | Status |
|---------|-------|--------|
| `focusScore` computation | 134-201 | No tests |
| `focusQualityStats` | 558-608 | No tests |
| `completionTrend` | 613-650 | No tests |
| `milestones` | 655-724 | No tests |
| `currentMonthStats` | 729-791 | No tests |
| `insights` generation | 796-987 | No tests |
| `focusScoreHistory` | 1035-1050 | No tests |
| `peerBenchmark` | 1055-1062 | No tests |
| `premiumTeasers` | 992-1030 | No tests |
| `calculateGoalStreak` | 109-128 | Weak coverage |
| Edge cases (midnight, timezone) | various | No tests |
| Session pruning (90-day cutoff) | 79-88 | No tests |
| Concurrent `recordSession` calls | 204-332 | No tests |

**Fix:** Add test suites for each computed value, edge cases, and race conditions.

---

### 6.2 No integration tests for timer → analytics flow
**Priority:** Medium

There are no tests verifying that:
- Timer completion correctly calls `recordSession` with the right arguments
- Countup vs countdown sessions produce correct analytics records
- Abandoned/skipped sessions are recorded with correct status
- Focus quality is determined correctly based on shield attempts

**Fix:** Add integration tests that simulate timer flows and verify analytics
state.

---

### 6.3 No component-level tests for analytics visualizations
**Priority:** Low

None of the 20 analytics components have render tests. Edge cases like:
- Zero data states
- Extremely large values (overflow)
- Missing optional fields (e.g., no `categoryTime`)
- Dark mode color contrast

are untested.

---

## 7. UI/UX ISSUES

### 7.1 Weekly chart doesn't show actual day-of-week alignment
**File:** `src/components/analytics/AnalyticsWeeklyChart.tsx`
**Priority:** Low

The chart shows 7 bars labeled Mon-Sun, but the data comes from
`getDailyStatsRange(7)` which returns the last 7 calendar days. If today is
Wednesday, the chart shows Thu-Wed data but labels it Mon-Sun.

**Fix:** Align the data with the actual current week (Monday through today),
leaving future days empty.

---

### 7.2 Heatmap month labels can overlap on narrow screens
**File:** `src/components/analytics/AnalyticsHeatmap.tsx:88-100`
**Priority:** Low

Month labels are positioned with absolute pixel margins. On narrow screens or
when 3 months are close together, labels overlap.

**Fix:** Use flexbox-based positioning or only show every other month label on
narrow viewports.

---

### 7.3 Session history max height cuts off content abruptly
**File:** `src/components/analytics/AnalyticsSessionHistory.tsx:90`
**Priority:** Low

`max-h-64 overflow-y-auto` creates a small scroll area (16rem). On mobile this
shows ~4-5 sessions before scrolling. No visual indicator that more content
exists below.

**Fix:** Add a fade gradient at the bottom, or use "Show more" pagination.

---

### 7.4 `InlineUpgradePrompt` text hardcoded with `text-amber-700`
**File:** `src/components/analytics/Analytics.tsx:61`
**Priority:** Low

The amber-700 text color assumes a light background. In dark mode, this text
would likely have poor contrast.

**Fix:** Use conditional dark-mode classes: `text-amber-700 dark:text-amber-300`.

---

## 8. IMPLEMENTATION PRIORITY

### Phase 1 — Critical bugs (immediate)
1. Fix `handleComplete` recording wrong `actualDuration` for countup (1.3)
2. Fix `focusQuality` always 'distracted' without app blocking (1.2)
3. Add `countup` to SessionHistory switch cases (1.1)

### Phase 2 — Data integrity (high priority)
4. Migrate `useAnalytics` to Zustand store or Context singleton (2.1)
5. Fix stale closure in `recordSession` (2.2)
6. Add Zod validation on localStorage load (2.3)
7. Fix timezone inconsistency (2.5)
8. Prune `dailyStats` to 90 days (2.4)

### Phase 3 — Data accuracy
9. Fix hourlyFocus multi-hour attribution (1.6)
10. Fix abandoned session time inflation (4.5)
11. Fix weekly chart day alignment (7.1, 1.5)
12. Link session notes/ratings to analytics records (4.2)
13. Fix `createEmptyDailyStats` missing categoryTime (2.6)

### Phase 4 — Architecture & performance
14. Split monolithic hook into focused modules (3.1)
15. Optimize recomputation with incremental updates (5.1)
16. Reduce redundant session iteration in weekly stats (5.2)
17. Decouple `focusScore.score` from `recordSession` dependency (3.2)

### Phase 5 — Features & polish
18. Implement weekly goal tracking (4.1)
19. Add data export (CSV/JSON) (4.3)
20. Address peerBenchmark transparency (3.3)
21. Integrate streak freezes into goal streak calc (4.6)
22. Add date range picker (4.4)

### Phase 6 — Testing
23. Add tests for all computed values (focusScore, insights, etc.) (6.1)
24. Add timer→analytics integration tests (6.2)
25. Fix failing completionRate test (1.4)
26. Add component render tests (6.3)

---

## Summary

| Category | Count |
|----------|-------|
| Active Bugs | 6 |
| Data Integrity Issues | 6 |
| Architecture Issues | 3 |
| Missing Features | 6 |
| Performance Issues | 3 |
| Test Coverage Gaps | 3 areas |
| UI/UX Issues | 4 |
| **Total Items** | **31** |

The most impactful changes are the countup `actualDuration` bug (1.3), the
unfair focus quality penalty (1.2), and the multi-instance state divergence
(2.1). These three alone would significantly improve data accuracy and user
trust in the analytics.
