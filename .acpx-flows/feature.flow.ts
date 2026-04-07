import { defineFlow } from 'acpx/flows'

/**
 * Shipwright Feature Flow — add features to an existing codebase
 *
 * 8-phase deterministic pipeline for feature development.
 *
 * Usage:
 *   acpx flow run .acpx-flows/feature.flow.ts --input-file .acpx-flows/feature-input.json
 */

const MAIN_SESSION = { handle: 'shipwright-feature' }

function exactJson(schema: string[]): string[] {
  return [
    '',
    'RESPONSE FORMAT: Return exactly one JSON object. No markdown, no commentary.',
    'The first character must be `{` and the last must be `}`.',
    ...schema
  ]
}

function readDoc(name: string): string {
  return `Read docs/${name} for context from the original build.`
}

const flow = {
  name: 'shipwright-feature',
  run: {
    title: ({ input }: any) => `Feature: ${(input.feature || '').slice(0, 60)}`
  },
  permissions: {
    requiredMode: 'approve-all',
    requireExplicitGrant: false,
    reason: 'Feature pipeline needs full file and shell access'
  },
  startAt: 'requirements',

  nodes: {
    requirements: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt({ input }: any) {
        return [
          'You are a senior product manager. Read .claude/agents/requirements-analyst.md.',
          readDoc('PRD.md'),
          readDoc('ARCHITECTURE.md'),
          readDoc('DESIGN.md'),
          '',
          `The user wants to add this feature: ${input.feature}`,
          '',
          'Read the existing codebase. Ask clarifying questions.',
          'Write a Feature Spec (scoped to this feature, not a full PRD).',
          'Save to docs/FEATURE-SPEC.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "spec_path": "docs/FEATURE-SPEC.md" }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    approve_spec: {
      nodeType: 'checkpoint' as const,
      statusDetail: 'Review docs/FEATURE-SPEC.md and approve to continue.'
    },

    research: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a senior technical researcher. Read .claude/agents/researcher.md.',
          'Read docs/FEATURE-SPEC.md for the feature requirements.',
          '',
          'Research modern patterns specific to this feature. Identify new dependencies needed.',
          '',
          ...exactJson([
            '{ "status": "complete", "recommendations": [] }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    impl_plan: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are a senior engineering lead. Read .claude/agents/implementation-planner.md.',
          'Read docs/FEATURE-SPEC.md and the existing codebase.',
          '',
          'Break the feature into tasks with dependencies and file ownership.',
          'Split into backend and frontend tracks.',
          '',
          ...exactJson([
            '{ "status": "complete", "task_count": 0, "parallel_batches": 0 }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    approve_plan: {
      nodeType: 'checkpoint' as const,
      statusDetail: 'Review the implementation plan and approve to continue.'
    },

    implement_backend: {
      nodeType: 'acp' as const,
      session: 'feature-backend',
      timeoutMs: 15 * 60_000,
      async prompt() {
        return [
          'You are a senior backend engineer. Read .claude/agents/backend-implementer.md.',
          'Read docs/FEATURE-SPEC.md. Implement backend tasks only.',
          '',
          ...exactJson([
            '{ "status": "complete", "files_modified": [] }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    implement_frontend: {
      nodeType: 'acp' as const,
      session: 'feature-frontend',
      timeoutMs: 15 * 60_000,
      async prompt() {
        return [
          'You are a senior frontend engineer. Read .claude/agents/frontend-implementer.md.',
          'Read docs/FEATURE-SPEC.md and docs/DESIGN.md. Implement frontend tasks only.',
          '',
          ...exactJson([
            '{ "status": "complete", "files_modified": [] }'
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
          'You are a principal engineer. Read .claude/agents/reviewer.md.',
          'Review all changes for this feature. Check security, performance, correctness.',
          '',
          ...exactJson([
            '{ "status": "complete", "approved": true, "critical": 0, "issues": [] }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    fix_issues: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      timeoutMs: 10 * 60_000,
      async prompt({ outputs }: any) {
        return [
          'Fix these review issues:',
          JSON.stringify(outputs.review?.issues || [], null, 2),
          '',
          ...exactJson(['{ "status": "fixed" }'])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    audit: {
      nodeType: 'acp' as const,
      session: MAIN_SESSION,
      async prompt() {
        return [
          'You are an auditor. Read .claude/agents/auditor.md.',
          'Verify the feature spec requirements are fully implemented. Check for gaps.',
          '',
          ...exactJson([
            '{ "status": "complete", "coverage_pct": 0, "approved": true }'
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
          'You are a DevOps engineer. Read .claude/agents/deployer.md.',
          'Create a PR for this feature. Deploy to the target platform. Verify.',
          '',
          ...exactJson([
            '{ "status": "complete", "pr_url": "...", "deploy_url": "..." }'
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
          'You are a ruthless QA engineer. Read .claude/agents/qa-tester.md.',
          'Deep-audit all code changes for this feature.',
          'Trace every new CTA, API route, and state change end-to-end.',
          'Check for regressions in existing functionality.',
          'Write docs/QA-REPORT.md.',
          '',
          ...exactJson([
            '{ "status": "complete", "critical": 0, "major": 0 }'
          ])
        ].join('\n')
      },
      parse: (text: string) => JSON.parse(text)
    },

    complete: {
      nodeType: 'compute' as const,
      run: ({ outputs }: any) => ({
        status: 'FEATURE COMPLETE',
        pr_url: outputs.deploy?.pr_url,
        deploy_url: outputs.deploy?.deploy_url,
        qa_issues: outputs.qa_test?.major_issues
      })
    }
  },

  edges: [
    { from: 'requirements', to: 'approve_spec' },
    { from: 'approve_spec', to: 'research' },
    { from: 'research', to: 'impl_plan' },
    { from: 'impl_plan', to: 'approve_plan' },
    { from: 'approve_plan', to: 'implement_backend' },
    { from: 'approve_plan', to: 'implement_frontend' },
    { from: 'implement_backend', to: 'review' },
    { from: 'implement_frontend', to: 'review' },
    {
      from: 'review',
      switch: {
        on: '$.approved',
        cases: {
          true: 'audit',
          false: 'fix_issues'
        }
      }
    },
    { from: 'fix_issues', to: 'review' },
    { from: 'audit', to: 'deploy' },
    { from: 'deploy', to: 'qa_test' },
    { from: 'qa_test', to: 'complete' }
  ]
}

export default defineFlow(flow)
