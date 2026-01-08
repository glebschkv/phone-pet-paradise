# ADR-001: State Management with Zustand

## Status
Accepted

## Context

The application requires robust state management for:
- User authentication state
- Game state (coins, XP, streaks, achievements)
- UI state (theme, settings, navigation)
- Offline sync queue

We evaluated several options:
- **Redux** - Industry standard, powerful but verbose
- **React Context** - Built-in, simple but can cause performance issues at scale
- **Zustand** - Lightweight, minimal boilerplate, TypeScript-first
- **Jotai/Recoil** - Atomic state model, good for derived state

## Decision

We chose **Zustand** for client-side state management with **TanStack React Query** for server state.

### Zustand for Client State
- 15 stores organized by domain (auth, coins, XP, shop, etc.)
- Middleware for persistence (localStorage) and devtools
- Selectors for efficient component subscriptions

### React Query for Server State
- Caching and synchronization with Supabase backend
- Automatic refetching and cache invalidation
- Optimistic updates for better UX

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Components                     │
├─────────────────────────────────────────────────┤
│                   Custom Hooks                    │
│  (useCoinSystem, useXPSystem, useAuth, etc.)     │
├─────────────────────────────────────────────────┤
│     Zustand Stores          │    React Query     │
│   (Client State)            │   (Server State)   │
│   - coinStore               │   - useQuery       │
│   - xpStore                 │   - useMutation    │
│   - authStore               │                    │
├─────────────────────────────────────────────────┤
│              localStorage                         │
│           (Offline Persistence)                   │
└─────────────────────────────────────────────────┘
```

## Consequences

### Positive
- **Minimal boilerplate** - Store definitions are concise
- **TypeScript-first** - Excellent type inference
- **Easy testing** - Stores can be reset between tests
- **Good performance** - Fine-grained subscriptions prevent unnecessary re-renders
- **Small bundle size** - ~2KB vs Redux's ~7KB

### Negative
- **Less ecosystem** - Fewer middleware and DevTools compared to Redux
- **Learning curve** - Team members familiar with Redux need adjustment
- **No time-travel debugging** - Redux DevTools integration is limited

### Trade-offs
- We lose some Redux ecosystem benefits but gain simplicity
- The middleware system is sufficient for our persistence needs
- Zustand's simplicity aligns with our "minimal complexity" principle

## Alternatives Considered

### Redux Toolkit
- **Pro**: Industry standard, excellent DevTools, large ecosystem
- **Con**: More boilerplate, larger bundle size, overkill for our needs

### React Context + useReducer
- **Pro**: No external dependencies, built into React
- **Con**: Performance issues with frequent updates, no built-in persistence

### MobX
- **Pro**: Automatic tracking, less boilerplate than Redux
- **Con**: Magic can make debugging harder, less TypeScript-friendly
