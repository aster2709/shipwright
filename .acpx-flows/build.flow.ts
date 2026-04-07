import { defineFlow } from 'acpx/flows'

/**
 * Shipwright Build Flow — deterministic 12-phase pipeline
 *
 * Drives Claude Code through the full app build lifecycle.
 * Each phase is a separate node. The graph engine guarantees
 * all phases run in order. No skipping, no early stops.
 *
 * Phase 1 uses dynamic Q&A: an ACP node generates a question,
 * a prompt node collects the answer, repeated 3 rounds. The LLM
 * decides what to ask based on the requirement and prior answers.
 *
 * Phase 7 uses fork/join for parallel backend + frontend.
 */

const MAIN_SESSION = { handle: 'shipwright-build' }

function exactJson(schema: string[]): string[] {
  return [
    '',
    'RESPONSE FORMAT: Return exactly one JSON object. No markdown, no commentary.',
    'The first character must be `{` and the last must be `}`.',
    ...schema
  ]
}

function readDoc(name: string): string {
  return `Read docs/${name} for context from previous phases.`
}

function gatherContext(outputs: any): string {
  const parts: string[] = []
  for (const key of ['answer_1', 'answer_2', 'answer_3']) {
    if (outputs[key]) parts.push(outputs[key])
  }
  return parts.length > 0 ? `\n\nUser's answers so far:\n${parts.join('\n')}` : ''
}

const flow = {
  name: 'shipwright-build',
  run: {
    title: ({ input }: any) => `Build: ${(input.requirement || '').slice(0, 60)}`
  },
  permissions: {
    requiredMode: 'approve-all',
    requireExplicitGrant: false,
    reason: 'Build pipeline needs full file and shell access'
  },
  startAt: 'ask_q1',

  nodes: {
    // ── Phase 1: Dynamic requirements gathering (3 Q&A rounds) ──

    ask_q1: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt({ input }: any) {
        return [
          'You are a senior product manager gathering requirements.',
          `The user wants to build: ${input.requirement}`,
          '',
          'Ask the SINGLE most important clarifying question to understand what to build.',
          'Consider: target users, auth model, core features, data model.',
          'Ask only ONE question. Be specific, not generic.',
          '',
          ...exactJson([
            '{ "question": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    answer_1: {
      nodeType: 'prompt' as const,
      message: async ({ outputs }: any) => outputs.ask_q1?.question || 'Describe your requirements:',
    },

    ask_q2: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt({ input, outputs }: any) {
        return [
          'You are a senior product manager gathering requirements.',
          `The user wants to build: ${input.requirement}`,
          `\nPrevious Q&A:\nQ: ${outputs.ask_q1?.question}\nA: ${outputs.answer_1}`,
          '',
          'Based on what you know so far, ask the NEXT most important clarifying question.',
          'Consider: deployment target, tech preferences, integrations, budget, mobile support.',
          'Ask only ONE question that fills the biggest remaining gap.',
          '',
          ...exactJson([
            '{ "question": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    answer_2: {
      nodeType: 'prompt' as const,
      message: async ({ outputs }: any) => outputs.ask_q2?.question || 'Any other details?',
    },

    ask_q3: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt({ input, outputs }: any) {
        return [
          'You are a senior product manager gathering requirements.',
          `The user wants to build: ${input.requirement}`,
          `\nPrevious Q&A:`,
          `Q: ${outputs.ask_q1?.question}\nA: ${outputs.answer_1}`,
          `Q: ${outputs.ask_q2?.question}\nA: ${outputs.answer_2}`,
          '',
          'Ask ONE final clarifying question about anything still unclear.',
          'Consider: edge cases, auth flows, error handling, scope boundaries.',
          '',
          ...exactJson([
            '{ "question": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    answer_3: {
      nodeType: 'prompt' as const,
      message: async ({ outputs }: any) => outputs.ask_q3?.question || 'Anything else?',
    },

    // Write PRD from all gathered context
    write_prd: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt({ input, outputs }: any) {
        return [
          'You are a senior product manager. Read .claude/agents/requirements-analyst.md for your full mandate.',
          '',
          `The user wants to build: ${input.requirement}`,
          '',
          'Clarifying Q&A:',
          `Q: ${outputs.ask_q1?.question}\nA: ${outputs.answer_1}`,
          `Q: ${outputs.ask_q2?.question}\nA: ${outputs.answer_2}`,
          `Q: ${outputs.ask_q3?.question}\nA: ${outputs.answer_3}`,
          '',
          'Write a complete PRD to docs/PRD.md using all the context above.',
          'Include: overview, personas, user stories, data model, API surface, constraints.',
          '',
          ...exactJson([
            '{ "status": "complete", "prd_path": "docs/PRD.md", "summary": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    // Phase 1 gate: user approval
    approve_prd: {
      nodeType: 'checkpoint' as const,
      statusDetail: 'Waiting for PRD approval. Review docs/PRD.md and approve to continue.'
    },

    // ── Phase 2: Research ──

    research: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a senior technical researcher. Read .claude/agents/researcher.md for your full mandate.',
          readDoc('PRD.md'),
          '',
          'Research modern best practices, standard patterns, and technology choices.',
          'Include cost analysis for hosting options within the stated budget.',
          'Write findings to docs/RESEARCH.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "research_path": "docs/RESEARCH.md", "stack_recommendation": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    // ── Phase 3: Architecture (approval gate) ──

    architecture: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a principal software architect. Read .claude/agents/architect.md for your full mandate.',
          readDoc('PRD.md'),
          readDoc('RESEARCH.md'),
          '',
          'Design the complete system architecture: folder structure, data model, API contracts,',
          'component hierarchy, auth flow, deployment architecture with cost estimate.',
          'Write to docs/ARCHITECTURE.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "architecture_path": "docs/ARCHITECTURE.md", "summary": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    approve_architecture: {
      nodeType: 'checkpoint' as const,
      statusDetail: 'Waiting for architecture approval. Review docs/ARCHITECTURE.md and approve to continue.'
    },

    // ── Phase 4: Design ──

    design: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a senior UI/UX designer. Read .claude/agents/ui-designer.md for your full mandate.',
          readDoc('PRD.md'),
          readDoc('ARCHITECTURE.md'),
          '',
          'Define the design system: colors, typography, spacing, animations.',
          'Scaffold shadcn/ui with custom theme. Install framer-motion and next-themes.',
          'Write docs/DESIGN.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "design_path": "docs/DESIGN.md" }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    // ── Phase 5: Skeleton ──

    skeleton: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 10 * 60_000,
      async prompt() {
        return [
          'You are a senior engineer. Read .claude/agents/skeleton-builder.md for your full mandate.',
          readDoc('ARCHITECTURE.md'),
          readDoc('DESIGN.md'),
          '',
          'Create the complete repo skeleton: folder structure, package.json, configs, empty modules.',
          'Incorporate the design system setup. Verify it compiles with npm install && npm run dev.',
          '',
          ...exactJson([
            '{ "status": "complete", "compiles": true }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    skeleton_retry: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 5 * 60_000,
      async prompt() {
        return [
          'The skeleton build failed. Read the error output and fix the issue.',
          'Run npm install && npm run dev again to verify.',
          '',
          ...exactJson([
            '{ "status": "complete", "compiles": true }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    // ── Phase 6: Implementation Planning (approval gate) ──

    impl_plan: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a senior engineering lead. Read .claude/agents/implementation-planner.md for your full mandate.',
          readDoc('ARCHITECTURE.md'),
          readDoc('DESIGN.md'),
          '',
          'Break the implementation into parallelizable tasks with dependencies and file ownership.',
          'Split into backend and frontend tracks. Write docs/IMPLEMENTATION_PLAN.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "plan_path": "docs/IMPLEMENTATION_PLAN.md", "task_count": 0, "parallel_batches": 0 }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    approve_plan: {
      nodeType: 'checkpoint' as const,
      statusDetail: 'Waiting for implementation plan approval. Review docs/IMPLEMENTATION_PLAN.md and approve.'
    },

    // ── Phase 7: Parallel implementation (fork/join) ──

    implement_backend: {
      nodeType: 'acp' as const,
      session: { handle: 'shipwright-backend' },
      timeoutMs: 20 * 60_000,
      async prompt() {
        return [
          'You are a senior backend engineer. Read .claude/agents/backend-implementer.md for your full mandate.',
          readDoc('ARCHITECTURE.md'),
          readDoc('IMPLEMENTATION_PLAN.md'),
          '',
          'Implement all backend tasks: API routes, database, integrations, business logic.',
          'Write clean production TypeScript. Handle errors at system boundaries only.',
          '',
          ...exactJson([
            '{ "status": "complete", "files_created": [], "files_modified": [] }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    implement_frontend: {
      nodeType: 'acp' as const,
      session: { handle: 'shipwright-frontend' },
      timeoutMs: 20 * 60_000,
      async prompt() {
        return [
          'You are a senior frontend engineer. Read .claude/agents/frontend-implementer.md for your full mandate.',
          readDoc('ARCHITECTURE.md'),
          readDoc('DESIGN.md'),
          readDoc('IMPLEMENTATION_PLAN.md'),
          '',
          'Implement all frontend tasks: pages, components, styling per DESIGN.md.',
          'Use pre-scaffolded shadcn/ui and Magic UI components. Ensure responsive design.',
          '',
          ...exactJson([
            '{ "status": "complete", "files_created": [], "files_modified": [] }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    // ── Phase 8-13: Testing through completion ──

    testing: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 10 * 60_000,
      async prompt() {
        return [
          'You are a senior QA engineer. Read .claude/agents/test-engineer.md for your full mandate.',
          readDoc('PRD.md'),
          readDoc('ARCHITECTURE.md'),
          '',
          'Write tests for all implemented code: unit, integration, component tests.',
          'Run them. All must pass.',
          '',
          ...exactJson([
            '{ "status": "complete", "tests_written": 0, "tests_passing": 0, "coverage": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    review: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a principal engineer. Read .claude/agents/reviewer.md for your full mandate.',
          readDoc('PRD.md'),
          readDoc('ARCHITECTURE.md'),
          '',
          'Deep code review: security, performance, correctness, test coverage, naming.',
          'Rate issues as critical/warning/nit.',
          '',
          ...exactJson([
            '{ "status": "complete", "critical": 0, "warnings": 0, "nits": 0, "approved": true, "issues": [] }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    fix_review_issues: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 10 * 60_000,
      async prompt({ outputs }: any) {
        const issues = outputs.review?.issues || []
        return [
          'The reviewer found critical issues that must be fixed:',
          JSON.stringify(issues, null, 2),
          '',
          'Fix all critical and warning issues. Then confirm.',
          '',
          ...exactJson([
            '{ "status": "fixed", "issues_resolved": 0 }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    audit: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a senior engineering auditor. Read .claude/agents/auditor.md for your full mandate.',
          readDoc('PRD.md'),
          readDoc('ARCHITECTURE.md'),
          '',
          'Verify all PRD requirements are implemented. Check for gaps.',
          'Report coverage score and missing features.',
          '',
          ...exactJson([
            '{ "status": "complete", "coverage_pct": 0, "gaps": [], "approved": true }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    deploy: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 10 * 60_000,
      async prompt() {
        return [
          'You are a senior DevOps engineer. Read .claude/agents/deployer.md for your full mandate.',
          readDoc('ARCHITECTURE.md'),
          '',
          'Deploy the application. Check what CLIs are available (vercel, railway, flyctl).',
          'Set up environment variables. Verify deployment is live.',
          '',
          ...exactJson([
            '{ "status": "complete", "url": "...", "platform": "..." }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    qa_test: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 15 * 60_000,
      async prompt() {
        return [
          'You are a ruthless QA engineer. Read .claude/agents/qa-tester.md for your full mandate.',
          readDoc('PRD.md'),
          readDoc('ARCHITECTURE.md'),
          '',
          'Deep-audit the entire codebase. Read EVERY file in src/. Think adversarially.',
          'Write docs/QA-REPORT.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "critical": 0, "major": 0, "minor": 0, "report_path": "docs/QA-REPORT.md" }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    capture_learnings: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'The build is complete. Reflect on the entire process.',
          'Write a reusable skill file to .claude/skills/learnings/ with a descriptive name.',
          '',
          ...exactJson([
            '{ "status": "complete", "learning_file": "...", "key_patterns": [] }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    complete: {
      nodeType: 'compute' as const,
      run: ({ outputs }: any) => ({
        status: 'BUILD COMPLETE',
        url: outputs.deploy?.url,
        qa_issues: outputs.qa_test?.major_issues,
        learnings: outputs.capture_learnings?.learning_file,
        phases_completed: 13
      })
    }
  },

  edges: [
    // Phase 1: Dynamic Q&A → PRD → approval
    { from: 'ask_q1', to: 'answer_1' },
    { from: 'answer_1', to: 'ask_q2' },
    { from: 'ask_q2', to: 'answer_2' },
    { from: 'answer_2', to: 'ask_q3' },
    { from: 'ask_q3', to: 'answer_3' },
    { from: 'answer_3', to: 'write_prd' },
    { from: 'write_prd', to: 'approve_prd' },
    { from: 'approve_prd', to: 'research' },

    // Phase 2 → 3 → approval
    { from: 'research', to: 'architecture' },
    { from: 'architecture', to: 'approve_architecture' },
    { from: 'approve_architecture', to: 'design' },

    // Phase 4 → 5
    { from: 'design', to: 'skeleton' },

    // Phase 5 retry logic
    {
      from: 'skeleton',
      switch: {
        on: '$.compiles',
        cases: {
          true: 'impl_plan',
          false: 'skeleton_retry'
        }
      }
    },
    { from: 'skeleton_retry', to: 'impl_plan' },

    // Phase 6 → approval
    { from: 'impl_plan', to: 'approve_plan' },

    // Phase 7: parallel implementation (fork/join)
    { from: 'approve_plan', fork: ['implement_backend', 'implement_frontend'], join: 'testing' },

    // Phase 8 → 9
    { from: 'testing', to: 'review' },

    // Phase 9 conditional: fix or continue
    {
      from: 'review',
      switch: {
        on: '$.approved',
        cases: {
          true: 'audit',
          false: 'fix_review_issues'
        }
      }
    },
    { from: 'fix_review_issues', to: 'review' },

    // Phase 10 → 11 → 12 → 13
    { from: 'audit', to: 'deploy' },
    { from: 'deploy', to: 'qa_test' },
    { from: 'qa_test', to: 'capture_learnings' },
    { from: 'capture_learnings', to: 'complete' }
  ]
}

export default defineFlow(flow)
