---
name: build
description: Full application build from requirements. Orchestrates multi-agent pipeline from PRD to deployment.
disable-model-invocation: true
argument-hint: [describe what you want to build]
---

The user wants to build something from scratch. You are the team lead.
Read .claude/agents/team-lead.md for your mandate and completion criteria.

## CRITICAL: Use Agent Teams, NOT Subagents

You MUST create an agent team for this work. Do NOT use the Agent tool to spawn subagents.
Instead, create an agent team with tmux split panes so the user can watch all agents work side by side.

Each teammate is a separate Claude Code instance with its own context window.
Teammates communicate through the shared task list and direct messaging.

When spawning teammates, reference the agent definitions in .claude/agents/ by name.
All teammates use Opus.

## CRITICAL: Run to Completion

You MUST run ALL phases below. Do NOT stop after review.
"Done" means tested, reviewed, audited, and deploy-ready — not just "code works."
If a phase finds issues, fix them before proceeding to the next phase.

## Phase 1: Requirements (approval gate)

Create an agent team. Spawn a requirements-analyst teammate. Have them ask the user detailed clarifying questions until a complete PRD can be written. Require plan approval before finalizing the PRD. Do NOT proceed until the user approves.

## Phase 2: Research

Once PRD is approved, spawn a researcher teammate to investigate modern best practices, standard patterns, and technology choices relevant to the PRD. Wait for completion.

## Phase 3: Architecture (approval gate)

Spawn an architect teammate. Give them the PRD and research document. Have them design the complete system architecture. Require plan approval. Do NOT proceed until the user approves.

## Phase 4: Design

Spawn a ui-designer teammate. Give them the PRD and architecture document. They will:
- Browse 21st.dev community components via `component_inspiration` for reusable patterns
- Research design inspiration via WebSearch (Dribbble, Awwwards, design blogs)
- Define the complete design system → docs/DESIGN.md
- Scaffold shadcn/ui with custom theme + framer-motion + next-themes
- Output: DESIGN.md + configured component libraries + reference code snippets

The ui-designer uses `component_inspiration` to browse real community components — fast lookups, not slow generation.

## Phase 5: Skeleton

Once design is complete, spawn a skeleton-builder teammate to create the repo structure, configs, and empty modules that compile and run. The skeleton should incorporate the design system setup from Phase 4.

## Phase 6: Implementation Planning (approval gate)

Spawn an implementation-planner teammate to break the architecture into concrete, parallelizable tasks with dependencies. Split tasks into backend and frontend tracks. Present the plan to the user for approval.

## Phase 7: Implementation

Spawn a backend-implementer and a frontend-implementer to work in parallel.
- Backend: API routes, database, integrations, business logic.
- Frontend: Pages, components, styling per DESIGN.md spec. Uses pre-scaffolded shadcn/ui and Magic UI components.
Each implementer works on independent tasks. Add more implementers if the task list demands it.

## Phase 8: Testing

Spawn a test-engineer teammate to write tests for all implemented code. Tests must pass before proceeding.

## Phase 9: Review

Spawn a reviewer teammate for a deep code review. If critical issues are found, assign them back to implementers and wait for fixes.

## Phase 10: Audit

Spawn an auditor teammate to verify:
- All PRD requirements are implemented
- No gaps between planned and built
- Tests cover critical paths
- Security and performance are acceptable

If the auditor finds gaps, loop back to implementation before proceeding.

## Phase 11: Deploy

Spawn a deployer teammate to:
- Check deployment config (ask user if none exists)
- Deploy to the target platform
- Spawn a monitor teammate to verify deployment succeeded
- Report final deployment URLs

## Documentation

All agent outputs MUST be saved to a docs/ folder:
- docs/PRD.md
- docs/RESEARCH.md
- docs/ARCHITECTURE.md
- docs/DESIGN.md
- docs/IMPLEMENTATION_PLAN.md

These documents are the project's source of truth for future /feature work.

## Rules

- ALWAYS use agent teams with tmux split panes, NEVER use the Agent tool for subagents.
- Wait for user approval at phases 1, 3, and 6 ONLY. All other phases run autonomously.
- ALL 11 phases must run. Do NOT stop early.
- All agents use Opus.
- Update the user at phase transitions, not on every action.
- If any agent gets stuck, report to the user immediately.

The user's requirement: $ARGUMENTS
