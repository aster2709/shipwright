# Shipwright

Multi-agent orchestration for building production applications with Claude Code. 15 specialized agents, 12-phase pipeline, from requirements to deployed and QA-tested.

## What It Does

You describe what you want to build. Shipwright orchestrates a team of AI agents that:
- Ask you clarifying questions and write a PRD
- Research modern best practices and cost-optimize the stack
- Design the architecture and visual system
- Build the skeleton, implement backend + frontend in parallel
- Write tests, review code, audit against PRD
- Deploy and QA-test the live app via browser automation

## Quick Start

```bash
gh repo create my-app --template aster2709/shipwright --clone --private
cd my-app
```

### Option A: acpx (recommended — deterministic)

The graph engine drives every phase. No skipping, no idle agents, automatic retries.

```bash
# Edit your requirement
nano .acpx-flows/build-input.json

# Run the pipeline
acpx flow run .acpx-flows/build.flow.ts --input-file .acpx-flows/build-input.json
```

### Option B: Claude Code Skills (flexible, human-in-the-loop)

```bash
claude --dangerously-skip-permissions
# Then: /build a SaaS invoice platform with Stripe integration
```

## Execution Modes

| Mode | Engine | Completion | Best for |
|---|---|---|---|
| acpx flow | Graph engine (deterministic) | Guaranteed — all nodes must complete | Production builds, reliability |
| /build skill | LLM orchestrator (Agent Teams) | Best-effort — LLM may idle or skip | Exploratory work, flexibility |
| /feature skill | LLM orchestrator (Agent Teams) | Best-effort | Quick feature additions |

## Skills (for Agent Teams mode)

| Skill | When |
|---|---|
| `/build` | New app from scratch — full 12-phase pipeline |
| `/feature` | Add features to an existing codebase — 8 phases |
| `/audit` | Gap check against PRD anytime |

## Pipeline

### /build (12 phases)

```
Requirements → Research → Architecture → Design → Skeleton
  (gate)                    (gate)
                                                      ↓
Implementation Planning → Backend + Frontend (parallel)
      (gate)                        ↓
                              Testing → Review → Audit → Deploy → QA
```

### /feature (8 phases)

```
Requirements → Research → Implementation Plan → Implementers → Review → Audit → Deploy → QA
  (gate)                      (gate)
```

## Agents (15)

| Agent | Role |
|---|---|
| team-lead | Orchestrates pipeline, enforces completion, never idles |
| requirements-analyst | Clarifying questions, PRD with budget/deployment constraints |
| researcher | Best practices, cost analysis, technology recommendations |
| architect | System design, API contracts, data model, cost estimates |
| ui-designer | Design system, shadcn/ui + Magic UI scaffolding via 21st.dev |
| skeleton-builder | Repo structure, configs, empty modules that compile |
| implementation-planner | Task breakdown with dependencies and file ownership |
| backend-implementer | API routes, database, integrations, business logic |
| frontend-implementer | Pages, components, styling per DESIGN.md spec |
| test-engineer | Unit, integration, component tests |
| reviewer | Security, performance, correctness review |
| auditor | PRD coverage verification, gap analysis |
| deployer | Platform deployment, env config, cost-aware |
| monitor | Post-deploy health checks, CI/CD verification |
| qa-tester | Live browser testing via Chrome DevTools MCP |

## How Agents Communicate

1. **Direct messaging** — teammates talk to each other for questions and handoffs
2. **Shared task list** — work items with dependencies and status tracking
3. **docs/ folder** — formal outputs that become the project's source of truth

The team lead is the heartbeat — actively checks progress, spawns next phases immediately, never waits passively.

## Documentation

Agents produce these artifacts in `docs/`:

| File | Producer | Contents |
|---|---|---|
| PRD.md | requirements-analyst | Product requirements, user stories, constraints |
| RESEARCH.md | researcher | Technology recommendations with cost analysis |
| ARCHITECTURE.md | architect | System design, API contracts, deployment plan |
| DESIGN.md | ui-designer | Visual design system, component library choices |
| IMPLEMENTATION_PLAN.md | implementation-planner | Tasks with dependencies and file ownership |
| QA-REPORT.md | qa-tester | Browser test results with screenshots |

## Requirements

- Claude Code with Claude Max plan
- [acpx](https://github.com/openclaw/acpx) (`npm install -g acpx@latest`) — deterministic graph execution
- Chrome DevTools MCP — for QA testing

## Recommended

- [cmux](https://cmux.com) or tmux — split-pane agent visibility
- [Honcho](https://honcho.dev) plugin — persistent memory across projects and sessions
- 21st.dev Magic components — UI design inspiration

## Self-Improvement

After successful builds, reusable patterns are saved to `.claude/skills/learnings/`. Future builds reference these to avoid rediscovering the same solutions. The more you build, the better it gets.

## Architecture

```
cmux / tmux                          (observe agents in split panes)
  └── acpx                           (deterministic graph engine — schedules phases)
       └── Claude Code               (agent runtime — executes each node)
            ├── 15 agent definitions  (each owns one phase)
            ├── docs/                 (inter-agent communication via artifacts)
            └── Honcho               (persistent memory across projects)
```

### Why acpx over LLM-as-scheduler?

LLMs used as orchestrators idle between phases, skip steps, and forget to check on teammates.
acpx is a graph engine — when node A completes, node B fires immediately. No forgetting, no idling.
The LLM does what it's good at (reasoning, coding). The graph engine does what it's good at (scheduling, retries, branching).

## License

MIT
