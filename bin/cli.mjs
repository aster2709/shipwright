#!/usr/bin/env node

import * as p from '@clack/prompts'
import { execSync, spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function checkDep(cmd, name, install) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    p.log.error(`${name} is not installed. Install with: ${install}`)
    return false
  }
}

async function main() {
  p.intro('Shipwright')

  const hasAcpx = checkDep('acpx', 'acpx', 'npm install -g acpx@latest')
  const hasClaude = checkDep('claude', 'Claude Code', 'https://claude.ai/claude-code')

  if (!hasAcpx || !hasClaude) {
    p.outro('Install missing dependencies and try again.')
    process.exit(1)
  }

  const mode = await p.select({
    message: 'What do you want to do?',
    options: [
      { value: 'build', label: 'Build a new app from scratch', hint: '12-phase pipeline' },
      { value: 'feature', label: 'Add a feature to existing app', hint: '8-phase pipeline' },
      { value: 'audit', label: 'Audit against PRD', hint: 'gap analysis' },
    ],
  })

  if (p.isCancel(mode)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  if (mode === 'audit') {
    p.log.info('Launching Claude Code with /audit skill...')
    const child = spawn('claude', ['--dangerously-skip-permissions'], {
      stdio: 'inherit',
      cwd: ROOT,
    })
    child.on('close', (code) => process.exit(code ?? 0))
    return
  }

  const requirement = await p.text({
    message: mode === 'build'
      ? 'What do you want to build?'
      : 'What feature do you want to add?',
    placeholder: mode === 'build'
      ? 'A SaaS invoice platform with Stripe integration and dark mode'
      : 'Add user profile pages with avatar upload and edit functionality',
    validate: (val) => {
      if (!val || val.trim().length < 10) return 'Be more specific (at least 10 characters)'
    },
  })

  if (p.isCancel(requirement)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const flowFile = resolve(ROOT, `.acpx-flows/${mode}.flow.ts`)

  if (!existsSync(flowFile)) {
    p.log.error(`Flow file not found: ${flowFile}`)
    process.exit(1)
  }

  const input = JSON.stringify({ requirement: requirement.trim() })

  p.log.step('Launching pipeline...')
  p.note(
    [
      `Mode:        ${mode}`,
      `Requirement: ${requirement.trim().slice(0, 80)}${requirement.trim().length > 80 ? '...' : ''}`,
      `Flow:        ${mode}.flow.ts`,
      `Engine:      acpx (deterministic)`,
    ].join('\n'),
    'Pipeline config'
  )

  const agentBin = resolve(ROOT, 'node_modules/@agentclientprotocol/claude-agent-acp/dist/index.js')

  const child = spawn(
    'acpx',
    ['--approve-all', '--agent', `node ${agentBin}`, 'flow', 'run', flowFile, '--input-json', input],
    {
      stdio: 'inherit',
      cwd: ROOT,
      env: process.env,
    }
  )

  child.on('close', (code) => {
    if (code === 0) {
      p.outro('Pipeline paused or complete. Check docs/ for artifacts.')
    } else {
      p.log.error(`Pipeline exited with code ${code}`)
    }
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  p.log.error(err.message)
  process.exit(1)
})
