// lib/agents/groq-client.ts
// Groq SDK wrapper — shared by all agent API routes

import Groq from 'groq-sdk'

// Singleton instance
let groqClient: Groq | null = null

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is not set. Add it to .env.local\n' +
        'Get a free key at: https://console.groq.com'
      )
    }
    groqClient = new Groq({ apiKey })
  }
  return groqClient
}

export type AgentMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Generate a non-streaming text response from Groq
 */
export async function generateText(
  systemPrompt: string,
  userMessage: string,
  history: AgentMessage[] = [],
  model = 'llama-3.1-8b-instant',
  jsonMode = false,
  temperature = 0.7
): Promise<string> {
  const groq = getGroqClient()

  const messages: AgentMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ]

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: 4096,   // Increased: coach plans + resume rewrites need headroom
    response_format: jsonMode ? { type: "json_object" } : undefined,
  })

  return completion.choices[0]?.message?.content ?? ''
}

/**
 * Generate a streaming response from Groq — returns a ReadableStream
 */
export async function generateStream(
  systemPrompt: string,
  userMessage: string,
  history: AgentMessage[] = [],
  model = 'llama-3.1-8b-instant'
): Promise<ReadableStream<Uint8Array>> {
  const groq = getGroqClient()

  const messages: AgentMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ]

  const stream = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })
}
