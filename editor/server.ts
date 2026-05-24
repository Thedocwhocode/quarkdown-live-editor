import express from 'express'
import { execFile } from 'child_process'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

const app = express()
app.use(express.json({ limit: '2mb' }))

const REPO_ROOT = resolve(import.meta.dirname, '..')
const QUARKDOWN_BIN = join(REPO_ROOT, 'build', 'install', 'quarkdown', 'bin', 'quarkdown')
const GRADLEW = join(REPO_ROOT, 'gradlew')

function quarkdownAvailable(): boolean {
  return existsSync(QUARKDOWN_BIN)
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', quarkdownAvailable: quarkdownAvailable() })
})

interface CompileRequest {
  source: string
  docType?: string
}

interface CompileDiagnostic {
  severity: 'error' | 'warning'
  message: string
  humanMessage: string
}

interface CompileResponse {
  html?: string
  error?: string
  diagnostics?: CompileDiagnostic[]
}

/**
 * Maps raw Quarkdown CLI stderr output to human-readable diagnostics.
 */
function parseCompilerOutput(stderr: string): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = []
  const lines = stderr.split('\n').filter(Boolean)

  for (const line of lines) {
    // Quarkdown prints errors like: [ERROR] FunctionCallException: ...
    if (line.includes('[ERROR]') || line.toLowerCase().includes('error')) {
      const msg = line.replace(/^\[ERROR\]\s*/, '').trim()
      diagnostics.push({
        severity: 'error',
        message: msg,
        humanMessage: translateError(msg),
      })
    } else if (line.includes('[WARN]') || line.toLowerCase().includes('warn')) {
      const msg = line.replace(/^\[WARN\]\s*/, '').trim()
      diagnostics.push({
        severity: 'warning',
        message: msg,
        humanMessage: msg,
      })
    }
  }

  return diagnostics
}

function translateError(raw: string): string {
  if (raw.includes('FunctionNotFound') || raw.includes('UnresolvedReference')) {
    const match = raw.match(/['"`]([^'"`]+)['"`]/)
    return match ? `Function ".${match[1]}" not found. Check spelling or library imports.` : 'Unknown function call.'
  }
  if (raw.includes('InvalidArgumentType')) {
    return 'A parameter received the wrong type. Check your function arguments.'
  }
  if (raw.includes('MissingArgument')) {
    return 'A required parameter is missing from a function call.'
  }
  return raw.length > 120 ? raw.slice(0, 120) + '…' : raw
}

app.post('/api/compile', async (req, res) => {
  const { source } = req.body as CompileRequest

  if (!source || typeof source !== 'string') {
    res.status(400).json({ error: 'source is required' } satisfies CompileResponse)
    return
  }

  const id = randomUUID()
  const tmpDir = join(tmpdir(), 'quarkdown-editor')
  const inputFile = join(tmpDir, `${id}.qd`)
  const outputDir = join(tmpDir, `${id}-out`)

  try {
    await mkdir(tmpDir, { recursive: true })
    await mkdir(outputDir, { recursive: true })
    await writeFile(inputFile, source, 'utf8')

    const result = await runQuarkdown(inputFile, outputDir)

    if (result.error) {
      const diagnostics = parseCompilerOutput(result.stderr)
      const response: CompileResponse = {
        error: result.error,
        diagnostics: diagnostics.length > 0 ? diagnostics : [
          { severity: 'error', message: result.error, humanMessage: translateError(result.error) },
        ],
      }
      res.status(422).json(response)
      return
    }

    res.json({ html: result.html } satisfies CompileResponse)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg } satisfies CompileResponse)
  } finally {
    unlink(inputFile).catch(() => undefined)
  }
})

interface RunResult {
  html?: string
  error?: string
  stderr: string
}

function runQuarkdown(inputFile: string, outputDir: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const args = ['c', inputFile, '--output', outputDir, '--pipe']

    const proc = quarkdownAvailable()
      ? execFile(QUARKDOWN_BIN, args, { timeout: 30_000 }, handler)
      : execFile(GRADLEW, ['run', '--quiet', `--args=c ${inputFile} --output ${outputDir} --pipe`],
          { cwd: REPO_ROOT, timeout: 120_000 }, handler)

    let stderr = ''
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    function handler(error: Error | null, stdout: string) {
      if (error) {
        resolve({ error: error.message, stderr })
        return
      }
      // --pipe sends HTML to stdout
      if (stdout && stdout.trim().startsWith('<')) {
        resolve({ html: stdout, stderr })
        return
      }
      // fallback: look for generated HTML file
      const { execSync } = require('child_process') as typeof import('child_process')
      try {
        const found = execSync(`find "${outputDir}" -name "*.html" | head -1`).toString().trim()
        if (found) {
          const { readFileSync } = require('fs') as typeof import('fs')
          resolve({ html: readFileSync(found, 'utf8'), stderr })
          return
        }
      } catch {
        // ignore
      }
      resolve({ error: 'No output produced', stderr })
    }

    void proc
  })
}

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Quarkdown editor API listening on http://localhost:${PORT}`)
  if (!quarkdownAvailable()) {
    console.warn('  ⚠  Quarkdown binary not found. Run `./gradlew installDist` in the repo root first.')
    console.warn(`     Expected: ${QUARKDOWN_BIN}`)
  }
})
