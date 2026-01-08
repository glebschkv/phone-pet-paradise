# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting significant decisions made in this project.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](001-state-management.md) | State Management with Zustand | Accepted |
| [ADR-002](002-offline-first-architecture.md) | Offline-First Architecture | Accepted |
| [ADR-003](003-mobile-framework.md) | Mobile Framework Selection | Accepted |
| [ADR-004](004-security-architecture.md) | Security Architecture | Accepted |

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Template

When creating a new ADR, use the following template:

```markdown
# ADR-XXX: Title

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[Describe the issue that motivated this decision]

## Decision
[Describe the change that we're proposing or have agreed to implement]

## Consequences
[Describe the resulting context after applying the decision]

## Alternatives Considered
[List alternatives that were considered but not chosen]
```
