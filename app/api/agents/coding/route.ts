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

export const runtime = 'nodejs'

// Helper to execute python code locally with a timeout
async function runPython(code: string, input: string): Promise<{ stdout: string, stderr: string }> {
  return new Promise(async (resolve) => {
    const tmpDir = os.tmpdir()
    const fileName = `maps_temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.py`
    const filePath = path.join(tmpDir, fileName)
    
    await writeFile(filePath, code)
    
    const pyProcess = spawn('python', [filePath])
    
    let stdout = ''
    let stderr = ''
    
    const timeout = setTimeout(() => {
      pyProcess.kill()
      stderr += '\nError: Execution Timed Out (Max 3s)'
    }, 3000)
    
    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    pyProcess.on('close', async () => {
      clearTimeout(timeout)
      try { await unlink(filePath) } catch {}
      resolve({ stdout, stderr })
    })
    
    if (input) {
      pyProcess.stdin.write(input + '\n')
    }
    pyProcess.stdin.end()
  })
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

    if (!problemStatement) {
      return Response.json({ error: 'problemStatement is required' }, { status: 400 })
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
      'llama-3.1-8b-instant'
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
