# Claude App Boilerplate

Template repository for building full-scale applications using Claude Code's multi-agent orchestration.

## What's Included

- **8 specialized agent definitions** — requirements analyst, researcher, architect, skeleton builder, implementation planner, implementer, test engineer, reviewer
- **`/build` skill** — one-command orchestration that runs the full pipeline from requirements to review
- **Project CLAUDE.md** — engineering methodology and conventions
- **Agent Teams enabled** — parallel agents with tmux monitoring

## Usage

1. Create a new repo from this template:
   ```bash
   gh repo create my-app --template your-username/claude-app-boilerplate --clone
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

4. The orchestrator will:
   - Ask you clarifying questions (PRD phase)
   - Research best practices
   - Design the architecture (requires your approval)
   - Create the repo skeleton
   - Plan the implementation (requires your approval)
   - Build features in parallel with multiple agents
   - Run a deep code review

## Requirements

- Claude Code with Claude Max plan
- tmux (`brew install tmux`)
- Agent Teams enabled (included in .claude/settings.json)

## Agent Pipeline

```
Requirements Analyst → Researcher → Architect → Skeleton Builder
    ↓ (approval)                        ↓ (approval)
Implementation Planner → Implementers (parallel) + Test Engineer
    ↓ (approval)                        ↓
                                    Reviewer
```
