# Game Balance & Progression Plan

## Executive Summary

This document outlines a comprehensive rebalancing of the XP, leveling, and reward systems for Phone Pet Paradise. The changes are based on industry best practices for idle/productivity games and aim to create a satisfying progression curve that keeps players engaged from early game through endgame.

---

## Current Issues Identified

### 1. Conflicting Level Systems
- `xpConstants.ts` uses manual thresholds (0-530 XP for levels 0-12)
- `constants.ts` uses different thresholds (0-18100 XP for levels 1-20)
- This creates confusion and potential bugs

### 2. Linear XP Rewards
- Current: 25 min = 25 XP (1 XP/min ratio)
- Problem: Doesn't incentivize longer sessions effectively
- Sessions of 2+ hours should feel more rewarding

### 3. Steep Late-Game Curve
- Level 20 requires 18,100 XP vs Level 10 requiring 4,100 XP
- Gap grows too fast, making late-game feel grindy

### 4. Coin Economy Imbalance
- 2 coins/minute = 50 coins for 25-min session
- Common items cost 50-150 coins (1-3 sessions)
- Legendary items cost 1500-5000 coins (30-100 sessions)
- Gap is too large for accessibility

### 5. Reward Distribution
- Too many rewards front-loaded (early unlocks)
- Later levels feel empty without meaningful unlocks

---

## Proposed Balance Framework

### Core Design Principles

1. **Satisfying Early Game**: Players should level up quickly in first 5 levels (1-2 sessions each)
2. **Engaging Mid Game**: Levels 6-20 should take 3-5 sessions each, with consistent unlocks
3. **Rewarding Late Game**: Levels 21-50 should feel prestigious but achievable
4. **Multiple Progression Paths**: XP, coins, pets, achievements provide parallel progress
5. **60/40 Rule**: 60% progress from consistent play, 40% from active engagement/bonuses

---

## XP Rewards (Session-Based)

### Current vs Proposed

| Duration | Current XP | Proposed XP | Rationale |
|----------|-----------|-------------|-----------|
| 25 min   | 25        | **30**      | Base session = meaningful progress |
| 30 min   | 35        | **40**      | +33% for 20% more time |
| 45 min   | 55        | **65**      | Pomodoro-and-a-half sweet spot |
| 60 min   | 80        | **100**     | Clean 100 XP milestone for 1hr |
| 90 min   | 125       | **160**     | Deep work bonus |
| 120 min  | 180       | **230**     | 2hr marathon feels rewarding |
| 180 min  | 280       | **360**     | Sub-linear scaling prevents burnout |
| 240 min  | 400       | **480**     | 4hr = significant achievement |
| 300 min  | 550       | **600**     | Diminishing returns at extreme lengths |

### XP Formula
```
Base XP = duration_minutes * 1.2
Bonus XP = floor(duration_minutes / 30) * 5  // +5 XP per 30-min block
Total = Base + Bonus
```

### XP Multiplier Stack
| Source | Multiplier | Notes |
|--------|------------|-------|
| Base | 1.0x | Always applied |
| Perfect Focus (0 blocks) | +0.25x | Reward discipline |
| Good Focus (1-2 blocks) | +0.10x | Encourage improvement |
| Streak (per day, max 20) | +0.05x/day | Max +1.0x at 20-day streak |
| Combo (consecutive sessions) | +0.1x to +1.0x | See combo tiers |
| Double XP Event | +1.0x | Limited time events |
| **Max Possible** | **4.35x** | Theoretical ceiling |

---

## Level Progression Curve

### Design Philosophy
- **Levels 1-5**: Quick wins (1-2 sessions each) - Player learns mechanics
- **Levels 6-15**: Moderate progression (3-4 sessions each) - Core engagement
- **Levels 16-30**: Steady climb (5-7 sessions each) - Mastery phase
- **Levels 31-50**: Prestige grind (8-12 sessions each) - Dedicated players

### Proposed Level Requirements

```javascript
// Unified Level Thresholds (50 levels)
LEVEL_THRESHOLDS = [
  0,      // Level 1 (start)
  30,     // Level 2 - 1 session
  70,     // Level 3 - ~1-2 sessions
  120,    // Level 4 - ~2 sessions
  180,    // Level 5 - ~2 sessions (first biome unlock)
  260,    // Level 6
  350,    // Level 7
  460,    // Level 8
  590,    // Level 9
  740,    // Level 10 (second biome unlock)
  920,    // Level 11
  1120,   // Level 12
  1350,   // Level 13
  1610,   // Level 14
  1900,   // Level 15 (third biome unlock)
  2230,   // Level 16
  2600,   // Level 17
  3010,   // Level 18
  3470,   // Level 19
  3980,   // Level 20 (fourth biome unlock)
  4550,   // Level 21
  5180,   // Level 22
  5880,   // Level 23
  6650,   // Level 24
  7500,   // Level 25 (fifth biome unlock)
  8430,   // Level 26
  9450,   // Level 27
  10560,  // Level 28
  11770,  // Level 29
  13090,  // Level 30 (sixth biome unlock)
  14530,  // Level 31
  16100,  // Level 32
  17810,  // Level 33
  19670,  // Level 34
  21700,  // Level 35
  23900,  // Level 36
  26290,  // Level 37
  28880,  // Level 38
  31690,  // Level 39
  34730,  // Level 40 (seventh biome unlock)
  38020,  // Level 41
  41580,  // Level 42
  45430,  // Level 43
  49590,  // Level 44
  54090,  // Level 45
  58950,  // Level 46
  64200,  // Level 47
  69870,  // Level 48
  75990,  // Level 49
  82600,  // Level 50 (MAX - Space biome unlock)
]
```

### Level-Up Formula (for procedural generation after level 50)
```javascript
function getXPForLevel(level) {
  if (level <= 50) return LEVEL_THRESHOLDS[level - 1];
  // Post-50: Linear 10,000 XP per level
  return 82600 + (level - 50) * 10000;
}
```

### Sessions to Level Estimate
| Level Range | Sessions per Level | Cumulative Sessions |
|-------------|-------------------|---------------------|
| 1-5 | 1-2 | 5-8 |
| 6-10 | 2-3 | 15-20 |
| 11-15 | 3-4 | 30-40 |
| 16-20 | 4-5 | 50-65 |
| 21-30 | 5-7 | 100-140 |
| 31-40 | 7-10 | 175-250 |
| 41-50 | 10-12 | 280-380 |

**Total to Max Level**: ~300-400 focus sessions (150-200 hours of focus time)

---

## Coin Economy

### Base Earning Rate
```javascript
COIN_CONFIG = {
  BASE_COINS_PER_MINUTE: 2,          // Keep current

  // Session completion bonuses (NEW)
  SESSION_COMPLETION_BONUS: {
    25: 15,   // +15 coins for completing 25-min session
    30: 20,   // +20 for 30 min
    45: 35,   // +35 for 45 min
    60: 50,   // +50 for 1 hour
    90: 80,   // +80 for 90 min
    120: 120, // +120 for 2 hours
    180: 180, // +180 for 3 hours
  },
}
```

### Coin Sources Summary
| Source | Coins | Frequency |
|--------|-------|-----------|
| 25-min session | 50 base + 15 bonus = **65** | Per session |
| 60-min session | 120 base + 50 bonus = **170** | Per session |
| Daily Login | 20 | Daily |
| Streak bonus | 5 per day (max 100) | Daily |
| Quest completion | 50-200 | 3 daily, 2 weekly |
| Achievement unlock | 50-500 | One-time |
| Boss defeat | 300-4000 | Varies |
| Lucky Wheel | 100-2500 | 1 free/day |
| Level milestone | 400-10000 | Per milestone |

### Shop Pricing Tiers (Rebalanced)
```javascript
PRICE_RANGES = {
  COMMON: { min: 100, max: 250 },      // 2-4 sessions
  UNCOMMON: { min: 250, max: 500 },    // 4-8 sessions
  RARE: { min: 500, max: 1000 },       // 8-15 sessions
  EPIC: { min: 1000, max: 2500 },      // 15-40 sessions
  LEGENDARY: { min: 2500, max: 5000 }, // 40-80 sessions
}
```

### Weekly Coin Budget (Active Player)
| Source | Weekly Coins |
|--------|-------------|
| 21 sessions (3/day avg) | ~1,400 |
| Daily login x7 | 140 |
| Streak bonus (7 days) | 35 |
| Daily quests | 300 |
| Weekly quests | 200 |
| Lucky wheel | 700 (avg) |
| **Total** | **~2,775/week** |

This allows purchasing 1 Epic item every 1-2 weeks, or 1 Legendary item per month for active players.

---

## Unlock Progression

### Pet Unlocks by Level
```javascript
PET_UNLOCK_SCHEDULE = {
  // Starter (immediate)
  0: ['dewdrop-frog'],

  // Early Game (1-5)
  1: ['songbird'],
  2: ['garden-lizard'],
  3: ['wild-horse'],
  4: ['friendly-monster'],
  5: ['desert-camel', 'golden-elk'],

  // Early-Mid (6-10)
  7: ['wise-turtle'],
  8: ['sunset-stallion'],
  9: ['night-bear'],
  10: ['shadow-serpent', 'coral-fish'],

  // Mid Game (11-20)
  12: ['ghost-hare'],
  14: ['night-sprite'],
  16: ['mountain-goat'],
  18: ['snow-owl'],
  20: ['crystal-deer', 'magma-salamander'],

  // Late-Mid (21-30)
  22: ['void-cat'],
  24: ['storm-eagle'],
  26: ['frost-wolf'],
  28: ['thunder-dragon'],
  30: ['phoenix', 'ice-phoenix'],

  // Late Game (31-40)
  32: ['nebula-fox'],
  35: ['cosmic-whale'],
  38: ['star-serpent'],
  40: ['galaxy-guardian'],

  // Endgame (41-50)
  43: ['void-walker'],
  46: ['time-keeper'],
  50: ['universe-spirit'], // Max level exclusive
}
```

### Biome Unlocks (Revised)
```javascript
BIOME_UNLOCK_LEVELS = {
  meadow: 1,    // Starter
  forest: 5,    // Early accomplishment
  beach: 10,    // First major milestone
  mountain: 15, // Mid-game
  desert: 20,   // Significant progress
  arctic: 25,   // Mastery begins
  volcano: 30,  // Advanced
  space: 40,    // Near-endgame
  void: 50,     // Max level exclusive
}
```

### Unlock Cadence Goal
- **Something new every 2-3 levels** (pet, biome, background, or badge)
- **Major celebration every 5 levels** (milestone rewards)
- **Epic unlock every 10 levels** (rare pet + biome)

---

## Streak System (Enhanced)

### Streak Multiplier Curve
```javascript
STREAK_MULTIPLIERS = {
  formula: (days) => Math.min(1 + (days * 0.03), 1.6),
  // Day 1: 1.03x
  // Day 7: 1.21x
  // Day 14: 1.42x
  // Day 20+: 1.60x (capped)
}
```

### Streak Milestone Rewards (Revised)
```javascript
STREAK_MILESTONES = {
  3:   { xp: 75,   coins: 100,  label: 'Getting Started' },
  7:   { xp: 200,  coins: 300,  label: 'Week Warrior' },
  14:  { xp: 400,  coins: 600,  label: 'Fortnight Fighter' },
  30:  { xp: 1000, coins: 1500, label: 'Monthly Master' },
  60:  { xp: 2500, coins: 3500, label: 'Two-Month Titan' },
  100: { xp: 5000, coins: 7500, label: 'Century Champion', badge: 'century-streak' },
  365: { xp: 15000, coins: 20000, label: 'Year of Focus', badge: 'year-streak', pet: 'legendary-time-keeper' },
}
```

---

## Combo System (Session Streaks)

### Combo Tiers
| Combo | Name | XP Multiplier | Coin Bonus | Expiry |
|-------|------|---------------|------------|--------|
| 1 | Starting | 1.0x | +0% | - |
| 2 | Warming Up | 1.1x | +10% | 4 hours |
| 3 | On Fire | 1.2x | +20% | 4 hours |
| 5 | Blazing | 1.35x | +35% | 3 hours |
| 7 | Unstoppable | 1.5x | +50% | 3 hours |
| 10+ | LEGENDARY | 1.75x | +75% | 2 hours |

### Combo Rules
- Combo increments after completing a focus session
- Combo expires if no session starts within expiry window
- Partial sessions (quit early) break combo
- Perfect focus sessions extend expiry by +1 hour

---

## Daily Login Rewards (7-Day Cycle)

```javascript
DAILY_LOGIN_REWARDS = [
  { day: 1, xp: 50,  coins: 30,  label: 'Welcome Back!' },
  { day: 2, xp: 75,  coins: 50,  label: 'Day 2 Bonus' },
  { day: 3, xp: 100, coins: 75,  label: 'Triple Treat' },
  { day: 4, xp: 125, coins: 100, streakFreeze: 1, label: 'Safety Net' },
  { day: 5, xp: 175, coins: 150, label: 'Halfway Hero' },
  { day: 6, xp: 225, coins: 200, label: 'Almost There!' },
  { day: 7, xp: 400, coins: 400, luckyWheel: 1, label: 'Weekly Jackpot!' },
]

// Weekly total: 1,150 XP + 1,005 coins + streak freeze + lucky spin
```

---

## Quest Rewards (Balanced)

### Daily Quests (Pick 3 from pool)
```javascript
DAILY_QUEST_POOL = [
  { id: 'focus-30', desc: 'Complete a 30-min+ session', xp: 75, coins: 50 },
  { id: 'focus-60', desc: 'Complete a 60-min+ session', xp: 150, coins: 100 },
  { id: 'pet-interact', desc: 'Interact with your pet 3 times', xp: 50, coins: 40 },
  { id: 'perfect-focus', desc: 'Complete a session with perfect focus', xp: 100, coins: 75 },
  { id: 'two-sessions', desc: 'Complete 2 focus sessions', xp: 100, coins: 60 },
  { id: 'bond-pet', desc: 'Increase pet bond by 1 level', xp: 125, coins: 80 },
]
```

### Weekly Quests (2 active at once)
```javascript
WEEKLY_QUEST_POOL = [
  { id: 'focus-5h', desc: 'Focus for 5 hours total', xp: 500, coins: 400 },
  { id: 'focus-10h', desc: 'Focus for 10 hours total', xp: 1200, coins: 1000 },
  { id: 'streak-7', desc: 'Maintain 7-day streak', xp: 750, coins: 600 },
  { id: 'sessions-15', desc: 'Complete 15 sessions', xp: 800, coins: 650 },
  { id: 'perfect-5', desc: '5 perfect focus sessions', xp: 600, coins: 500 },
  { id: 'unlock-pet', desc: 'Unlock a new pet', xp: 400, coins: 300 },
]
```

---

## Battle Pass Balancing

### XP Per Tier Adjustment
```javascript
BATTLE_PASS_CONFIG = {
  XP_PER_TIER: 400,        // Down from 500 (more accessible)
  TOTAL_TIERS: 50,
  SEASON_DURATION_DAYS: 90,

  // Daily XP goal to complete: 400 * 50 / 90 = ~222 XP/day
  // This equals roughly 2 focus sessions + quests
}
```

### Free Tier Reward Distribution
- Every tier: 50 coins
- Every 3rd tier: +50 XP
- Every 5th tier: +100 coins (total 150)
- Every 10th tier: +200 coins + cosmetic

### Premium Tier Highlights
- Tier 10: Exclusive badge
- Tier 20: Season background
- Tier 30: Epic pet
- Tier 40: Exclusive badge + 1000 coins
- Tier 50: Legendary season pet + title

---

## Summary: Key Changes

### XP System
1. Boost base XP by ~20% across all session lengths
2. Unify level thresholds to single source of truth
3. Smoother exponential curve (1.12-1.15x per level)
4. Guaranteed level-up every 2-3 sessions early game

### Coin Economy
1. Add session completion bonuses
2. Increase daily login coins
3. Rebalance shop prices for better accessibility
4. Average player can afford Epic item in 1-2 weeks

### Rewards Distribution
1. Spread pet unlocks evenly (something every 2-3 levels)
2. Major milestones at every 5 levels
3. Biome unlocks every 5-10 levels
4. Exclusive content at levels 30, 40, 50

### Engagement Systems
1. Reduce combo expiry windows (creates urgency)
2. Add daily login bonus escalation
3. Enhanced streak rewards
4. Battle pass is achievable with 2 sessions/day

---

## Implementation Priority

1. **High Priority**: Unify level thresholds (fix conflicting systems)
2. **High Priority**: Update XP rewards for sessions
3. **Medium Priority**: Add session completion coin bonuses
4. **Medium Priority**: Redistribute pet unlocks
5. **Low Priority**: Tune combo system
6. **Low Priority**: Adjust battle pass XP requirements

---

## Appendix: Formulas Reference

```javascript
// XP for session
sessionXP = Math.floor(duration * 1.2) + Math.floor(duration / 30) * 5;

// Level from XP
function getLevelFromXP(xp) {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

// Streak multiplier
streakMultiplier = Math.min(1 + (days * 0.03), 1.6);

// Coins for session
sessionCoins = (duration * 2) + SESSION_COMPLETION_BONUS[duration] + focusBonus;

// XP to next level
xpToNext = THRESHOLDS[currentLevel] - currentXP;
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: Game Balance Team*
