# Game Progression Balance Plan

## Executive Summary

The current progression system is **too fast** because all rewards were intentionally boosted (comments indicate "doubled" or "more than doubled"). This plan outlines changes to create a more sustainable, engaging progression curve that keeps players motivated long-term.

---

## Current Problems Analysis

### 1. XP Rewards Are Too Generous
**Current values** (src/hooks/useXPSystem.ts:73-83):
| Duration | Current XP | Issue |
|----------|------------|-------|
| 25 min   | 25 XP      | Was doubled |
| 30 min   | 35 XP      | "More than doubled" |
| 45 min   | 55 XP      | Doubled |
| 60 min   | 80 XP      | "More than doubled" |
| 90 min   | 125 XP     | "More than doubled" |
| 120 min  | 180 XP     | "More than doubled" |
| 180 min  | 280 XP     | "More than doubled" |
| 240 min  | 400 XP     | "More than doubled" |
| 300 min  | 550 XP     | "More than doubled" |

### 2. Level Requirements Are Too Low
**Current values** (src/hooks/useXPSystem.ts:88-102):
- Level 1 = 15 XP (1 session of 25 min)
- Level 5 = 125 XP (2-3 sessions)
- Level 10 = 385 XP (5-6 sessions)
- Level 12 = 530 XP

**Problem**: Players reach Level 5 (major unlock milestone) in just 2-3 hours of total focus time.

### 3. Bonus Chances Are Too High
**Current values** (src/hooks/useXPSystem.ts:50-66):
- 5% Jackpot (2.5x) - "increased from 2%"
- 10% Super Lucky (1.75x) - "increased from 5%"
- 20% Lucky (1.5x) - "increased from 13%"
- 65% No bonus - "reduced from 80%"

**Problem**: 35% chance of any bonus means players frequently get extra rewards, accelerating progression.

### 4. Coin Rewards Equally Inflated
**Current values** (src/hooks/useCoinSystem.ts:28-38):
Same pattern as XP - all "more than doubled"

### 5. Subscription Multipliers Stack Too Aggressively
- Premium: 2x
- Premium+: 3x
- Lifetime: 4x
- Combined with coin boosters (2-3x) = up to **12x rewards**

### 6. Streak Bonuses Are Massive
**Current values** (src/hooks/useStreakSystem.ts:19-26):
- 3-day: 50 XP
- 7-day: 100 XP
- 14-day: 200 XP
- 30-day: 500 XP
- 60-day: 1000 XP
- 100-day: 2000 XP

### 7. Battle Pass Rewards Add Even More
**File**: src/data/GamificationData.ts
- Every tier gives free coins/XP
- Every 5th tier: 400 coins
- Every 10th tier: 1000 coins

---

## Recommended Changes

### Phase 1: Core XP/Coin Rebalance

#### 1.1 Reduce Base XP Rewards (40-50% reduction)
**File**: `src/hooks/useXPSystem.ts` lines 73-83

| Duration | Current | Proposed | Rationale |
|----------|---------|----------|-----------|
| 25 min   | 25 XP   | 12 XP    | Minimum viable reward |
| 30 min   | 35 XP   | 18 XP    | Sweet spot for casual sessions |
| 45 min   | 55 XP   | 28 XP    | ~50% reduction |
| 60 min   | 80 XP   | 40 XP    | 50% reduction - 1 hour = meaningful |
| 90 min   | 125 XP  | 65 XP    | Deep work bonus |
| 120 min  | 180 XP  | 95 XP    | ~50% reduction |
| 180 min  | 280 XP  | 150 XP   | Significant but not OP |
| 240 min  | 400 XP  | 210 XP   | Marathon sessions |
| 300 min  | 550 XP  | 280 XP   | Elite sessions |

#### 1.2 Reduce Base Coin Rewards (40-50% reduction)
**File**: `src/hooks/useCoinSystem.ts` lines 28-38

| Duration | Current | Proposed |
|----------|---------|----------|
| 25 min   | 25      | 12 coins |
| 30 min   | 40      | 20 coins |
| 45 min   | 65      | 32 coins |
| 60 min   | 100     | 50 coins |
| 90 min   | 175     | 85 coins |
| 120 min  | 260     | 130 coins |
| 180 min  | 400     | 200 coins |
| 240 min  | 550     | 275 coins |
| 300 min  | 750     | 375 coins |

### Phase 2: Level Requirements Increase

#### 2.1 Increase Level XP Requirements (2-3x increase)
**File**: `src/hooks/useXPSystem.ts` lines 88-102

| Level | Current | Proposed | Sessions Needed* |
|-------|---------|----------|------------------|
| 0     | 0       | 0        | Start |
| 1     | 15      | 40       | 2-3 sessions |
| 2     | 35      | 90       | 5 sessions |
| 3     | 60      | 150      | 8 sessions |
| 4     | 90      | 220      | 12 sessions |
| 5     | 125     | 300      | 16 sessions (1-2 weeks) |
| 6     | 165     | 400      | 22 sessions |
| 7     | 210     | 520      | 28 sessions |
| 8     | 260     | 660      | 36 sessions |
| 9     | 320     | 820      | 45 sessions |
| 10    | 385     | 1000     | 55 sessions (1 month) |
| 11    | 455     | 1200     | 66 sessions |
| 12    | 530     | 1420     | 78 sessions |

*Based on average 30-min sessions at 18 XP each

#### 2.2 Adjust Level 13+ Scaling
**File**: `src/hooks/useXPSystem.ts` lines 118-135

```javascript
// Proposed changes:
if (i < 20) {
  increment += 15;  // Was 8, increase for levels 13-19
} else if (i < 30) {
  increment += 25;  // Was 12, increase for levels 20-29
} else {
  increment += 35;  // Was 15, increase for legendary tier (30+)
}
```

### Phase 3: Bonus System Rebalance

#### 3.1 Reduce Bonus Probabilities Back to Original
**File**: `src/hooks/useXPSystem.ts` lines 50-66
**File**: `src/hooks/useCoinSystem.ts` lines 47-64

| Tier | Current | Proposed | Multiplier |
|------|---------|----------|------------|
| Jackpot | 5% | 2% | 2.0x (was 2.5x) |
| Super Lucky | 10% | 5% | 1.5x (was 1.75x) |
| Lucky | 20% | 13% | 1.25x (was 1.5x) |
| No bonus | 65% | 80% | 1.0x |

**Total bonus chance**: 35% → 20%

### Phase 4: Streak System Rebalance

#### 4.1 Reduce Streak XP Bonuses (50% reduction)
**File**: `src/hooks/useStreakSystem.ts` lines 19-26

| Milestone | Current | Proposed |
|-----------|---------|----------|
| 3-day     | 50 XP   | 25 XP    |
| 7-day     | 100 XP  | 50 XP    |
| 14-day    | 200 XP  | 100 XP   |
| 30-day    | 500 XP  | 250 XP   |
| 60-day    | 1000 XP | 500 XP   |
| 100-day   | 2000 XP | 1000 XP  |

### Phase 5: Gamification Rewards Rebalance

#### 5.1 Reduce Battle Pass Free Rewards
**File**: `src/data/GamificationData.ts` lines 64-76

| Tier Type | Current | Proposed |
|-----------|---------|----------|
| Every tier | 100 coins | 50 coins |
| Every 3rd tier | 100 XP | 50 XP |
| Every 5th tier | 400 coins | 200 coins |
| Every 10th tier | 1000 coins | 500 coins |

#### 5.2 Reduce Battle Pass Tier XP Requirements
**File**: `src/data/GamificationData.ts` line 54

```javascript
// Current: i * 100 + Math.floor(i / 5) * 50
// Proposed: i * 150 + Math.floor(i / 5) * 75
xpRequired: i * 150 + Math.floor(i / 5) * 75,
```

#### 5.3 Reduce Boss Challenge Rewards (30-40% reduction)
**File**: `src/data/GamificationData.ts` lines 195-293

| Challenge | Current XP/Coins | Proposed XP/Coins |
|-----------|------------------|-------------------|
| Focus Warrior | 300/400 | 180/250 |
| Triple Threat | 200/300 | 120/180 |
| Deep Focus Master | 600/800 | 360/500 |
| Five-Streak | 500/700 | 300/420 |
| Weekly Warrior | 1000/1200 | 600/720 |
| Marathon Runner | 1000/1400 | 600/850 |
| Perfect Day | 1600/2000 | 960/1200 |
| Ultra Endurance | 2000/3000 | 1200/1800 |
| Weekly Legend | 3000/4000 | 1800/2400 |

#### 5.4 Reduce Milestone Rewards (40% reduction)
**File**: `src/data/GamificationData.ts` lines 495-523

| Milestone | Current XP/Coins | Proposed XP/Coins |
|-----------|------------------|-------------------|
| Level 5 | 200/400 | 100/200 |
| Level 10 | 500/1000 | 300/600 |
| Level 20 | 1000/2000 | 600/1200 |
| Level 30 | 2000/4000 | 1200/2400 |
| Level 50 | 5000/10000 | 3000/6000 |

### Phase 6: Shop Economy Rebalance

#### 6.1 Reduce Coin Pack Values OR Increase Item Prices
**Option A**: Reduce coin pack amounts by 30%
**Option B**: Increase shop item prices by 30%

Recommendation: **Option A** - reduces inflation while keeping items feel valuable

**File**: `src/data/ShopData.ts` lines 321-370

| Pack | Current | Proposed |
|------|---------|----------|
| Starter | 500 | 350 coins |
| Value | 1500+100 | 1000+75 coins |
| Premium | 5000+500 | 3500+350 coins |
| Mega | 15000+2500 | 10000+1750 coins |

### Phase 7: Combo System Rebalance

#### 7.1 Reduce Combo Multipliers
**File**: `src/data/GamificationData.ts` lines 446-453

| Sessions | Current | Proposed |
|----------|---------|----------|
| 1 | 1.0x | 1.0x |
| 2+ | 1.1x | 1.05x |
| 3+ | 1.25x | 1.1x |
| 5+ | 1.5x | 1.2x |
| 7+ | 1.75x | 1.3x |
| 10+ | 2.0x | 1.5x |

### Phase 8: Lucky Wheel Rebalance

#### 8.1 Reduce Lucky Wheel Prizes
**File**: `src/data/GamificationData.ts` lines 407-418

| Prize | Current | Proposed |
|-------|---------|----------|
| coins-100 | 100 | 50 coins |
| coins-200 | 200 | 100 coins |
| xp-50 | 50 | 25 XP |
| xp-100 | 100 | 50 XP |
| coins-500 | 500 | 250 coins |
| Jackpot | 2500 | 1000 coins |

---

## Implementation Order

### Priority 1 (Critical - Do First)
1. Reduce XP rewards (Phase 1.1)
2. Increase level requirements (Phase 2.1 & 2.2)
3. Reduce bonus probabilities (Phase 3.1)

### Priority 2 (Important)
4. Reduce coin rewards (Phase 1.2)
5. Reduce streak bonuses (Phase 4.1)
6. Reduce boss challenge rewards (Phase 5.3)

### Priority 3 (Polish)
7. Reduce battle pass rewards (Phase 5.1 & 5.2)
8. Reduce milestone rewards (Phase 5.4)
9. Reduce combo multipliers (Phase 7.1)
10. Reduce lucky wheel prizes (Phase 8.1)

### Priority 4 (Economy)
11. Rebalance shop economy (Phase 6.1)

---

## Expected Outcomes After Changes

### Progression Timeline (Free User, 30-min sessions)
| Milestone | Current | After Rebalance |
|-----------|---------|-----------------|
| Level 1 | 1 session | 2-3 sessions |
| Level 5 | 4-5 sessions | 15-17 sessions (~2 weeks) |
| Level 10 | 10-12 sessions | 50-55 sessions (~1 month) |
| Level 20 | ~25 sessions | ~120 sessions (~3 months) |
| Level 50 | ~60 sessions | ~400 sessions (~1 year) |

### Economy Impact
- Coins earned per hour: ~100 → ~50 (50% reduction)
- Time to afford 2000 coin item: ~20 hours → ~40 hours
- Battle pass tier progression: ~50% slower

---

## Files to Modify

1. `src/hooks/useXPSystem.ts` - XP rewards, level requirements, bonus chances
2. `src/hooks/useCoinSystem.ts` - Coin rewards, bonus chances
3. `src/hooks/useStreakSystem.ts` - Streak XP bonuses
4. `src/data/GamificationData.ts` - Battle pass, boss challenges, milestones, combos, lucky wheel
5. `src/data/ShopData.ts` - Coin pack values (optional)

---

## Testing Recommendations

1. **Unit tests**: Verify XP/coin calculations with new values
2. **Progression simulation**: Run 100 simulated sessions, verify level curve
3. **Economy audit**: Verify shop items remain achievable within reasonable time
4. **Player feedback**: Consider A/B testing with subset of users

---

## Rollback Plan

Keep original values commented in code for quick rollback if player retention drops significantly.
