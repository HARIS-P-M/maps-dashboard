// app/api/agents/coding/route.ts
// Coding Agent — DSA hints, code review, and test-case evaluation

import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { CODING_AGENT_PROMPT } from '@/lib/agents/agent-prompts'
import { jsonrepair } from 'jsonrepair'
import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'
import { AGENT_MODELS } from '@/lib/agents/model-registry'

export const runtime = 'nodejs'

const BLOCKED_CODE_PATTERNS = [
  /\b(?:os|sys|subprocess|socket|requests|urllib|http|ftplib|shutil|pathlib|ctypes)\b/,
  /\b(?:open|eval|exec|compile|__import__|globals|locals|input)\s*\(/,
  /(?:__class__|__subclasses__|__globals__|__builtins__)/,
]

function validateStudentCode(code: string): void {
  if (typeof code !== 'string' || code.length > 30_000) {
    throw new Error('Submitted code is missing or exceeds the 30,000 character limit.')
  }
  if (BLOCKED_CODE_PATTERNS.some((pattern) => pattern.test(code))) {
    throw new Error('This coding evaluator only supports self-contained algorithm code without system, network, or file access.')
  }
}

// Helper to execute restricted Python code locally with a timeout.
async function runPython(code: string, input: string): Promise<{ stdout: string, stderr: string }> {
  validateStudentCode(code)
  const tmpDir = os.tmpdir()
  const fileName = `maps_temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.py`
  const filePath = path.join(tmpDir, fileName)

  try {
    await writeFile(filePath, code)
    return await new Promise((resolve) => {
      const executionEnv: NodeJS.ProcessEnv = {
        NODE_ENV: process.env.NODE_ENV ?? 'production',
        PATH: process.env.PATH ?? '',
        SystemRoot: process.env.SystemRoot ?? '',
        TEMP: process.env.TEMP ?? tmpDir,
        TMP: process.env.TMP ?? tmpDir,
      }
      const pyProcess = spawn('python', ['-I', filePath], {
        cwd: tmpDir,
        env: executionEnv,
        windowsHide: true,
      })

      let stdout = ''
      let stderr = ''
      let settled = false
      let timeout: NodeJS.Timeout
      const finish = (result: { stdout: string; stderr: string }) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        void unlink(filePath).catch(() => undefined)
        resolve(result)
      }

      timeout = setTimeout(() => {
        pyProcess.kill()
        finish({ stdout, stderr: `${stderr}\nError: Execution Timed Out (Max 3s)` })
      }, 3000)

      pyProcess.on('error', (error) => {
        finish({ stdout, stderr: `${stderr}\nError: Unable to start Python: ${error.message}` })
      })
      pyProcess.stdout.on('data', (data) => {
        stdout += data.toString()
        if (stdout.length > 100_000) {
          pyProcess.kill()
          finish({ stdout: stdout.slice(0, 100_000), stderr: `${stderr}\nError: Output exceeded the 100KB limit` })
        }
      })
      pyProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        if (stderr.length > 100_000) {
          pyProcess.kill()
          finish({ stdout, stderr: `${stderr.slice(0, 100_000)}\nError: Error output exceeded the 100KB limit` })
        }
      })
      pyProcess.on('close', () => finish({ stdout, stderr }))

      if (input) pyProcess.stdin.write(`${input}\n`)
      pyProcess.stdin.end()
    })
  } catch (error) {
    await unlink(filePath).catch(() => undefined)
    throw new Error(`Unable to prepare code execution: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      problemStatement,
      userCode,
      language,
      hintLevel = 1,
      action = 'hint',
      judge0TestCases = [],
      optimalSolutionPython = '',
    } = await req.json()

    if (typeof problemStatement !== 'string' || problemStatement.length > 30_000) {
      return Response.json({ error: 'problemStatement is required' }, { status: 400 })
    }
    if (action !== 'hint' && action !== 'execute') {
      return Response.json({ error: 'action must be hint or execute' }, { status: 400 })
    }
    if (!Array.isArray(judge0TestCases) || judge0TestCases.length > 50) {
      return Response.json({ error: 'At most 50 test cases are allowed.' }, { status: 400 })
    }
    if (
      judge0TestCases.some(
        (testCase: { input?: unknown; output?: unknown }) =>
          typeof testCase.input !== 'string' ||
          typeof testCase.output !== 'string' ||
          testCase.input.length > 10_000 ||
          testCase.output.length > 10_000
      )
    ) {
      return Response.json({ error: 'Each test case input and output must be text of 10,000 characters or less.' }, { status: 400 })
    }

    let userMessage = ''
    let testResults: any[] = []
    let allPassed = false
    let combinedStdout = ''

    if (action === 'hint') {
      userMessage = `
MODE A — Hint/Tutor

Problem:
${problemStatement}

${userCode ? `Student's current code (${language ?? 'Python'}):\n\`\`\`\n${userCode}\n\`\`\`` : 'The student has not written any code yet.'}

Hint level requested: ${hintLevel} (1=conceptual, 2=approach, 3=implementation detail)
Please give a Level ${hintLevel} hint. Do NOT give the full solution.
`
    } else if (action === 'execute') {
      if (!userCode || typeof userCode !== 'string') {
        return Response.json({ error: 'userCode is required for execution.' }, { status: 400 })
      }
      validateStudentCode(userCode)

      // 1. Actually execute the code against all test cases locally
      allPassed = true
      
      for (let i = 0; i < judge0TestCases.length; i++) {
        const tc = judge0TestCases[i]
        const { stdout, stderr } = await runPython(userCode, tc.input)
        
        const actualOutput = stdout.trim() || stderr.trim()
        const expectedOutput = tc.output.trim()
        const passed = actualOutput === expectedOutput
        
        if (!passed) allPassed = false
        
        testResults.push({
          test: i + 1,
          passed,
          output: actualOutput,
          expected: expectedOutput
        })
        
        combinedStdout += `Test ${i + 1}:\nInput:\n${tc.input}\nExpected:\n${expectedOutput}\nActual:\n${actualOutput}\nPassed: ${passed}\n\n`
      }

      // 2. Pass the TRUE execution results to the AI to get qualitative feedback and complexity analysis
      userMessage = `
MODE B — AI Execution Engine (Feedback Generation)

Problem:
${problemStatement}

Student's submitted code (${language ?? 'Python'}):
\`\`\`
${userCode}
\`\`\`

Here are the ACTUAL compiler execution results from running their code against the hidden test cases:
${combinedStdout}

The code overall ${allPassed ? 'PASSED' : 'FAILED'}.
Analyze their code and the execution results above.
1. Estimate Time Complexity (e.g. "O(N)") and Space Complexity (e.g. "O(1)").
2. Provide specific, actionable feedback based on WHY they failed certain tests or HOW they can optimize if they passed.
Do NOT guess whether they passed or failed — use the actual compiler results provided above!
`
    }

    const raw = await generateText(
      CODING_AGENT_PROMPT,
      userMessage,
      [],
      AGENT_MODELS.coding
    )

    // Parse JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json(
        { error: 'Could not parse generated output.' },
        { status: 500 }
      )
    }

    let sanitized = jsonMatch[0]
    try {
      sanitized = jsonrepair(sanitized)
    } catch { /* fall through */ }

    const aiResult = JSON.parse(sanitized)
    
    // If it was an execution, override the AI's hallucinated pass/fail with the true compiler results
    if (action === 'execute') {
      aiResult.passed = allPassed
      aiResult.testResults = testResults
      aiResult.stdout = combinedStdout
    }

    return Response.json(aiResult)
  } catch (error) {
    console.error('[Coding Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Coding agent unavailable' },
      { status: 500 }
    )
  }
}
