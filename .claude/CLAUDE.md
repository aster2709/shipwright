# Project Methodology

This project uses multi-agent orchestration to build applications from requirements.

## CRITICAL: Agent Teams Only

When running /build or /feature, ALWAYS use Claude Code Agent Teams (experimental).
NEVER use the Agent tool to spawn subagents for orchestrated workflows.

Agent Teams = separate Claude Code instances as teammates, each with their own context window.
Subagents = lightweight helpers within the same session. DO NOT use these for the pipeline.

Create agent teams with tmux split panes so all teammates are visible side by side.
Set teammateMode to "tmux" for split-pane display.

## Process

Every build follows this pipeline:
1. **Requirements Analysis** → Complete PRD with no gaps
2. **Research** → Modern best practices, standard patterns, competitive analysis
3. **Architecture** → System design, data model, API contracts, component hierarchy
4. **Design** → Design system, theme, component scaffolding (shadcn/ui, Magic UI)
5. **Skeleton** → Repo structure, configs, empty modules that compile/run
6. **Implementation Planning** → Detailed tasks with dependencies (backend + frontend tracks)
7. **Implementation** → Backend + frontend implementers building in parallel
8. **Testing** → Tests written and passing
9. **Review** → Deep code review
10. **Audit** → Requirements coverage, security, performance
11. **Deploy** → Deployed and verified
12. **QA Testing** → Chrome MCP testing of live deployment, screenshots, bug report

## Conventions

- Feature branches per agent, merged by the lead after review.
- Tests live next to the code they test (co-located).
- Environment variables documented in .env.example with comments.
- API-first design: define contracts before implementation.
- Error handling at system boundaries only — trust internal code.

## Agent Teams

This project is designed for Claude Code Agent Teams.
Use tmux split panes (`"teammateMode": "tmux"`) so all agents are visible.
The lead orchestrates; teammates execute independently.
All agents use Opus.
