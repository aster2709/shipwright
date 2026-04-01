# Claude App Boilerplate

Template repository for building full-scale applications using Claude Code's multi-agent orchestration.

## What's Included

- **12 specialized agent definitions** — team lead, requirements analyst, researcher, architect, skeleton builder, implementation planner, implementer, test engineer, reviewer, auditor, deployer, monitor
- **3 skills** — `/build` (new app from scratch), `/feature` (add features to existing codebase), `/audit` (gap analysis)
- **Project CLAUDE.md** — engineering methodology and conventions
- **Agent Teams enabled** — parallel agents with tmux monitoring

## Usage

1. Create a new repo from this template:
   ```bash
   gh repo create my-app --template aster2709/claude-app-boilerplate --clone --private
   cd my-app
   ```

2. Start Claude Code:
   ```bash
   claude
   ```

3. Build your app:
   ```
   /build a SaaS invoice platform with Stripe integration
   ```

4. Add features later:
   ```
   /feature add Stripe subscription billing for premium accounts
   ```

5. Run a gap check anytime:
   ```
   /audit
   ```

## Skills

| Skill | When to use |
|---|---|
| `/build` | Day zero — new app from requirements to working code |
| `/feature` | Ongoing — add features to an existing codebase |
| `/audit` | Anytime — check for gaps between PRD and implementation |

## Requirements

- Claude Code with Claude Max plan
- tmux (`brew install tmux`)
- Agent Teams enabled (included in .claude/settings.json)

## Agent Pipeline

### /build (new project)

```
Requirements Analyst → Researcher → Architect → Skeleton Builder
    ↓ (approval)                        ↓ (approval)
Implementation Planner → Implementers (parallel) + Test Engineer
    ↓ (approval)                        ↓
                                    Reviewer
```

### /feature (existing codebase)

```
Requirements Analyst → Researcher → Implementation Planner
    ↓ (approval)                        ↓ (approval)
Implementers (parallel) + Test Engineer → Reviewer → Auditor
                                                        ↓
                                            Deployer → Monitor
```

## Agents

| Agent | Role |
|---|---|
| team-lead | Orchestrates the full pipeline, enforces completion criteria |
| requirements-analyst | Asks clarifying questions, writes PRD/feature spec |
| researcher | Investigates modern best practices and patterns |
| architect | Designs system architecture from PRD + research |
| skeleton-builder | Creates repo structure, configs, empty modules |
| implementation-planner | Breaks work into parallelizable tasks |
| implementer | Builds features in isolated git worktrees |
| test-engineer | Writes unit, integration, and component tests |
| reviewer | Deep code review for security, performance, correctness |
| auditor | Verifies implementation matches PRD, finds gaps |
| deployer | Handles deployment to Vercel, Render, Railway, etc. |
| monitor | Post-deployment verification, CI/CD checks, health monitoring |
