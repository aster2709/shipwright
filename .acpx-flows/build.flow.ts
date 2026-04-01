/**
 * Shipwright Build Flow — deterministic 12-phase pipeline
 *
 * Drives Claude Code through the full app build lifecycle.
 * Each phase is a separate node. The graph engine guarantees
 * all phases run in order. No skipping, no early stops.
 *
 * Usage:
 *   acpx flow run .acpx-flows/build.flow.ts --input-file .acpx-flows/build-input.json
 */

const MAIN_SESSION = 'shipwright-build'

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

const flow = {
  name: 'shipwright-build',
  run: {
    title: ({ input }: any) => `Build: ${(input.requirement || '').slice(0, 60)}`
  },
  permissions: {
    requiredMode: 'dangerously-skip-permissions',
    requireExplicitGrant: false,
    reason: 'Build pipeline needs full file and shell access'
  },
  startAt: 'requirements',

  nodes: {
    // Phase 1: Requirements (approval gate)
    requirements: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt({ input }: any) {
        return [
          'You are a senior product manager. Read .claude/agents/requirements-analyst.md for your full mandate.',
          '',
          `The user wants to build: ${input.requirement}`,
          '',
          'Ask clarifying questions about: target users, auth model, data model, integrations,',
          'performance requirements, budget constraints, deployment preferences, mobile/responsive needs.',
          '',
          'Then write a complete PRD to docs/PRD.md.',
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

    // Phase 2: Research
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

    // Phase 3: Architecture (approval gate)
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

    // Phase 3 gate: user approval
    approve_architecture: {
      nodeType: 'checkpoint' as const,
      statusDetail: 'Waiting for architecture approval. Review docs/ARCHITECTURE.md and approve to continue.'
    },

    // Phase 4: Design
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

    // Phase 5: Skeleton
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

    // Phase 5 retry on build failure
    skeleton_retry: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 5 * 60_000,
      async prompt({ outputs }: any) {
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

    // Phase 6: Implementation Planning (approval gate)
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

    // Phase 6 gate: user approval
    approve_plan: {
      nodeType: 'checkpoint' as const,
      statusDetail: 'Waiting for implementation plan approval. Review docs/IMPLEMENTATION_PLAN.md and approve.'
    },

    // Phase 7: Backend implementation
    implement_backend: {
      nodeType: 'acp' as const,
      session: 'shipwright-backend',
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

    // Phase 7: Frontend implementation (parallel with backend)
    implement_frontend: {
      nodeType: 'acp' as const,
      session: 'shipwright-frontend',
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

    // Phase 8: Testing
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

    // Phase 9: Review
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

    // Phase 9 fix loop: if critical issues found
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

    // Phase 10: Audit
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

    // Phase 11: Deploy
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

    // Phase 12: QA Testing
    qa_test: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 10 * 60_000,
      async prompt({ outputs }: any) {
        const url = outputs.deploy?.url || 'http://localhost:3000'
        return [
          'You are a QA tester. Read .claude/agents/qa-tester.md for your full mandate.',
          '',
          `Open the deployed app at ${url} using Chrome DevTools MCP.`,
          'Test all user flows like a real user. Check desktop and mobile viewports.',
          'Take screenshots. Check console for errors.',
          'Write docs/QA-REPORT.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "major_issues": 0, "minor_issues": 0, "report_path": "docs/QA-REPORT.md" }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    // Done
    complete: {
      nodeType: 'compute' as const,
      run: ({ outputs }: any) => ({
        status: 'BUILD COMPLETE',
        url: outputs.deploy?.url,
        qa_issues: outputs.qa_test?.major_issues,
        phases_completed: 12
      })
    }
  },

  edges: [
    // Phase 1 → approval
    { from: 'requirements', to: 'approve_prd' },
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

    // Phase 7: parallel implementation
    { from: 'approve_plan', to: 'implement_backend' },
    { from: 'approve_plan', to: 'implement_frontend' },

    // Phase 7 → 8 (join)
    { from: 'implement_backend', to: 'testing' },
    { from: 'implement_frontend', to: 'testing' },

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
    { from: 'fix_review_issues', to: 'review' }, // loop back

    // Phase 10 → 11 → 12
    { from: 'audit', to: 'deploy' },
    { from: 'deploy', to: 'qa_test' },
    { from: 'qa_test', to: 'complete' }
  ]
}

export default flow
