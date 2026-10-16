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
import { requireCurrentUser, UnauthorizedError } from '@/lib/auth/current-user'

export const runtime = 'nodejs'

const BLOCKED_CODE_PATTERNS = [
  /^\s*(?:import|from)\s+(?:os|subprocess|socket|requests|urllib|http|ftplib|shutil|pathlib|ctypes)\b/m,
  /\b(?:open|eval|exec|compile|__import__|globals|locals)\s*\(/,
  /(?:__class__|__subclasses__|__globals__|__builtins__)/,
  /\bsys\.(?:exit|path|modules|_getframe|settrace|setprofile)\b/,
]

class CodeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CodeValidationError'
  }
}

function validateStudentCode(code: string): void {
  if (typeof code !== 'string' || code.length > 30_000) {
    throw new CodeValidationError('Submitted code is missing or exceeds the 30,000 character limit.')
  }
  const codeWithoutComments = code
    .split('\n')
    .map((line) => line.replace(/#.*$/, ''))
    .join('\n')
  if (BLOCKED_CODE_PATTERNS.some((pattern) => pattern.test(codeWithoutComments))) {
    throw new CodeValidationError('This coding evaluator only supports self-contained algorithm code without system, network, or file access.')
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
      const interpreters = [
        process.env.PYTHON_EXECUTABLE,
        process.platform === 'win32' ? 'py' : 'python3',
        'python3',
        'python',
      ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
      let interpreterIndex = 0
      let attemptId = 0

      const startProcess = () => {
        const interpreter = interpreters[interpreterIndex]
        if (!interpreter) {
          resolve({
            stdout: '',
            stderr: 'Error: Unable to start Python: no usable Python interpreter was found.',
          })
          return
        }

        const currentAttempt = ++attemptId
        const args = interpreter === 'py' ? ['-3', '-I', filePath] : ['-I', filePath]
        const pyProcess = spawn(interpreter, args, {
          cwd: tmpDir,
          env: executionEnv,
          windowsHide: true,
        })

      let stdout = ''
      let stderr = ''
      let settled = false
      let timeout: NodeJS.Timeout
      const finish = (result: { stdout: string; stderr: string }) => {
        if (currentAttempt !== attemptId) return
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
        if (error.code === 'EACCES' || error.code === 'ENOENT') {
          interpreterIndex += 1
          startProcess()
          return
        }
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
      }

      startProcess()
    })
  } catch (error) {
    await unlink(filePath).catch(() => undefined)
    throw new Error(`Unable to prepare code execution: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireCurrentUser()
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
      try {
        validateStudentCode(userCode)
      } catch (error) {
        if (error instanceof CodeValidationError) {
          return Response.json({ error: error.message }, { status: 400 })
        }
        throw error
      }

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

        console.info(
          `[Coding Evaluator] Test ${i + 1}: ${passed ? 'PASSED' : 'FAILED'} | expected=${JSON.stringify(expectedOutput)} | actual=${JSON.stringify(actualOutput)}`
        )
        
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

    let raw = ''
    try {
      raw = await generateText(
        CODING_AGENT_PROMPT,
        userMessage,
        [],
        AGENT_MODELS.coding
      )
    } catch (error) {
      if (action !== 'execute') throw error
      return Response.json({
        passed: allPassed,
        testResults,
        stdout: combinedStdout,
        timeComplexity: 'Unavailable',
        spaceComplexity: 'Unavailable',
        feedback: 'Execution completed. AI feedback is currently unavailable.',
      })
    }

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
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof CodeValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error('[Coding Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Coding agent unavailable' },
      { status: 500 }
    )
  }
}
