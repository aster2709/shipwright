# Project Methodology

This project uses multi-agent orchestration to build applications from requirements.

## Process

Every build follows this pipeline:
1. **Requirements Analysis** → Complete PRD with no gaps
2. **Research** → Modern best practices, standard patterns, competitive analysis
3. **Architecture** → System design, data model, API contracts, component hierarchy
4. **Skeleton** → Repo structure, configs, empty modules that compile/run
5. **Implementation Planning** → Detailed tasks with dependencies
6. **Implementation** → Parallel agents building features in isolated worktrees
7. **Testing** → Tests written alongside implementation
8. **Review** → Deep code review, security audit, performance check

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
