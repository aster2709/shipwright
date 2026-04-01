# Multi-Agent App Builder

## What This Is

A template for building production applications using Claude Code Agent Teams.
You give it requirements, it orchestrates 15 specialized agents through a 12-phase pipeline,
from PRD to deployed and QA-tested app.

## CRITICAL: Agent Teams Only

When running /build or /feature, ALWAYS use Claude Code Agent Teams (experimental).
NEVER use the Agent tool to spawn subagents for orchestrated workflows.

- Agent Teams = separate Claude Code instances as teammates, each with their own context window
- Subagents = lightweight helpers within the same session — DO NOT use for the pipeline
- Create agent teams with tmux/cmux split panes so all teammates are visible
- Read .claude/agents/team-lead.md for your mandate and completion criteria

## Why This Design

LLMs given one big prompt with 12 steps will skip steps, stop early, and produce undeterministic results.
This boilerplate uses structured orchestration:
- Each phase has a dedicated agent with a focused mandate
- The team lead enforces completion — ALL phases must run
- Approval gates at phases 1, 3, and 6 only — everything else runs autonomously
- Agents communicate through three channels:
  1. Direct messaging — teammates talk to each other for questions and handoffs
  2. Shared task list — work items, dependencies, status tracking
  3. docs/ folder — formal outputs that become the project's source of truth
- The team lead is the heartbeat — actively checks progress, never idles passively

## The 12-Phase Pipeline

1. **Requirements** (gate) → requirements-analyst asks questions, writes docs/PRD.md
2. **Research** → researcher investigates best practices, writes docs/RESEARCH.md
3. **Architecture** (gate) → architect designs system, writes docs/ARCHITECTURE.md
4. **Design** → ui-designer defines visual identity, writes docs/DESIGN.md, scaffolds components
5. **Skeleton** → skeleton-builder creates repo structure that compiles
6. **Implementation Planning** (gate) → implementation-planner breaks work into tasks
7. **Implementation** → backend-implementer + frontend-implementer work in parallel
8. **Testing** → test-engineer writes and runs tests
9. **Review** → reviewer does deep code review, files issues
10. **Audit** → auditor verifies PRD coverage, finds gaps
11. **Deploy** → deployer pushes to platform, monitor verifies
12. **QA Testing** → qa-tester uses Chrome DevTools MCP to test live app like a real user

## Agents (15 total)

| Agent | File | Role |
|---|---|---|
| team-lead | team-lead.md | Orchestrates full pipeline, enforces completion |
| requirements-analyst | requirements-analyst.md | Asks questions, writes PRD |
| researcher | researcher.md | Investigates best practices, cost analysis |
| architect | architect.md | Designs system, API contracts, data model |
| ui-designer | ui-designer.md | Design system, component scaffolding |
| skeleton-builder | skeleton-builder.md | Repo structure, configs, empty modules |
| implementation-planner | implementation-planner.md | Breaks work into parallelizable tasks |
| backend-implementer | backend-implementer.md | API routes, integrations, business logic |
| frontend-implementer | frontend-implementer.md | Pages, components, styling per DESIGN.md |
| test-engineer | test-engineer.md | Unit, integration, component tests |
| reviewer | reviewer.md | Security, performance, correctness review |
| auditor | auditor.md | PRD coverage, gap analysis |
| deployer | deployer.md | Platform deployment, env config |
| monitor | monitor.md | Post-deploy health checks, CI/CD verification |
| qa-tester | qa-tester.md | Live browser testing via Chrome DevTools MCP |

## Skills

| Skill | When |
|---|---|
| /build | Day zero — new app from requirements to deployed |
| /feature | Ongoing — add features to existing codebase |
| /audit | Anytime — gap check against PRD |

## Documentation Contract

All agent outputs saved to docs/:
- docs/PRD.md, docs/RESEARCH.md, docs/ARCHITECTURE.md
- docs/DESIGN.md, docs/IMPLEMENTATION_PLAN.md, docs/QA-REPORT.md

These are the source of truth. The /feature skill reads them for context.

## Conventions

- TypeScript first. 2-space indent, single quotes, no semicolons.
- Tailwind CSS + shadcn/ui + Magic UI for frontend.
- Tests co-located next to code.
- .env.example with comments for every env var.
- API-first: define contracts before implementation.
- Error handling at system boundaries only.
- Feature branches per agent, merged by the lead after review.
- All agents use Opus.

## Post-Build: Skill Learning

After a successful build, the team lead should:
1. Note what worked well and what caused retries or issues
2. Save reusable patterns as skill files in .claude/skills/learnings/
3. Example: "next-groq-streaming.md" — the exact pattern for Next.js + Groq streaming that worked
4. Future builds reference these learnings to avoid rediscovering the same solutions

## Tools This Boilerplate Expects

- Claude Code with Agent Teams enabled (in .claude/settings.json)
- Chrome DevTools MCP — for QA testing live deployments
- 21st.dev Magic components — for UI design inspiration via component_inspiration
- tmux or cmux — for split-pane agent visibility (cmux preferred: cmux.com)
- Honcho plugin — persistent memory across projects (optional but recommended)
