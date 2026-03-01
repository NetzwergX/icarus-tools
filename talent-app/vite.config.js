import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import process from 'node:process'

const normalizeBasePath = (value) => {
  if (!value || value === '/') {
    return '/'
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

const resolveGitCommitHash = () => {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 8)
  }

  try {
    return execSync('git rev-parse --short=8 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

const resolveCalculatorVersion = (command) => {
  if (command === 'serve') {
    return `dev-${Date.now()}`
  }

  return resolveGitCommitHash()
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '')
  const calculatorVersion = resolveCalculatorVersion(command)

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH),
    define: {
      'import.meta.env.VITE_CALCULATOR_VERSION': JSON.stringify(calculatorVersion)
    },
    plugins: [react()],
    server: {
      host: '0.0.0.0',
    },
  }
})
