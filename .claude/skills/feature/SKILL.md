---
name: feature
description: End-to-end feature development on an existing codebase. From requirements to deployment.
disable-model-invocation: true
argument-hint: [describe the feature you want to build]
---

The user wants to add a feature to an existing codebase. You are the technical lead orchestrating the full lifecycle.

## Phase 1: Requirements Discovery

Spawn a requirements-analyst teammate. Have them:
- Read the existing codebase to understand current state
- Ask the user detailed clarifying questions about the feature
- Produce a Feature Spec (not a full PRD — scoped to this feature)
- Include: user flows, data model changes, API changes, UI changes
- Require plan approval before proceeding

## Phase 2: Research

Spawn a researcher teammate. Have them:
- Research modern patterns specific to this feature's domain
- Check how similar features are implemented in production apps
- Identify any new dependencies needed
- Output a Research Brief

## Phase 3: Implementation Plan

Spawn an implementation-planner teammate. Have them:
- Read the existing codebase structure
- Read the feature spec and research brief
- Break the feature into tasks with dependencies and file ownership
- Include database migrations, API endpoints, UI components, tests
- Require plan approval before proceeding

## Phase 4: Implementation

Spawn implementer teammates (2-3) to work in parallel on independent tasks using git worktrees. Spawn a test-engineer teammate to write tests alongside.

## Phase 5: Review

Spawn a reviewer teammate to do a deep review of all changes. If critical issues are found, assign them back to implementers.

## Phase 6: Audit

Spawn an auditor teammate to verify:
- Feature spec requirements are fully implemented
- No gaps between what was planned and what was built
- Tests cover the critical paths
- No regressions in existing functionality

## Phase 7: PR & Deploy

Create a PR with a clear description of the feature. Spawn a deployer teammate to:
- Check deployment config exists (ask user if not)
- Deploy to staging/production
- Spawn a monitor teammate to verify deployment succeeded

## Rules

- Wait for user approval after Phase 1 and Phase 3.
- Each agent focuses on ONE job — no overlap.
- All agents use Opus.
- Report at phase transitions.
- If the auditor finds gaps, loop back to implementation before deploying.
- Create a single feature branch for all work.

The user's feature request: $ARGUMENTS
