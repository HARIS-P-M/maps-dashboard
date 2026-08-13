// app/api/agents/generate-problem/route.ts
// Problem Generation Agent — creates structured DSA problems tailored to company & topic

import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { jsonrepair } from 'jsonrepair'

export const runtime = 'nodejs'

const PROBLEM_GEN_PROMPT = `You are the Core Problem-Generation Agent for a smart campus placement preparation platform.
Your job is to generate unique, high-quality coding problems tailored to specific company hiring patterns and technical roles.

You MUST output ONLY a valid JSON object — no markdown fences, no introductory text, no trailing commentary.

The JSON output must follow this EXACT schema:
{
  "title": "String name of the problem",
  "problem_statement": "Clear, detailed description of the problem including context and what the user needs to solve.",
  "constraints": "List of performance and input constraints (e.g., 1 <= N <= 10^5) formatted as a single string with newline characters between each constraint.",
  "input_format": "Description of how the input data will be provided to the program.",
  "output_format": "Description of what the program should return or print.",
  "topic": "The DSA topic of this problem",
  "difficulty": "Easy | Medium | Hard",
  "sample_cases": [
    {
      "input": "Sample standard input data",
      "expected_output": "Expected standard output data",
      "explanation": "Step-by-step breakdown explaining why this input produces this output."
    }
  ],
  "judge0_test_cases": [
    {
      "input": "Hidden test case 1 input",
      "output": "Hidden test case 1 expected output"
    },
    {
      "input": "Hidden test case 2 input",
      "output": "Hidden test case 2 expected output"
    },
    {
      "input": "Hidden test case 3 input (edge case)",
      "output": "Hidden test case 3 expected output"
    }
  ],
  "optimal_solution_python": "The complete, fully-functional, optimized Python 3 reference solution as a string."
}

Rules:
- The judge0_test_cases MUST strictly isolate edge cases (empty inputs, negative numbers, maximum constraints, single element arrays, etc.)
- The optimal_solution_python must be correct, complete Python 3 code that reads from stdin and prints to stdout
- Difficulty Easy = O(N) or O(N log N) expected, Medium = requires smart data structures, Hard = DP or complex graph problems
- Make problems realistic to actual company interview rounds
`

export async function POST(req: NextRequest) {
  try {
    const { company = 'General Tech', topic = 'Arrays', difficulty = 'Medium' } = await req.json()

    const userMessage = `Generate a unique, challenging coding problem with these exact parameters:
- Company Target: ${company}
- Topic: ${topic}  
- Difficulty: ${difficulty}

Ensure the problem reflects the type of DSA problems commonly asked by ${company} during campus placements.`

    const raw = await generateText(
      PROBLEM_GEN_PROMPT,
      userMessage,
      [],
      'llama-3.3-70b-versatile', // Use the more capable model for quality problems
      false
    )

    // Extract JSON block
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse generated problem.' }, { status: 500 })
    }

    let sanitized = jsonMatch[0]
    try {
      sanitized = jsonrepair(sanitized)
    } catch {
      // fall through with raw match
    }

    const result = JSON.parse(sanitized)
    return Response.json(result)
  } catch (error) {
    console.error('[Problem Gen Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Problem generation unavailable' },
      { status: 500 }
    )
  }
}
