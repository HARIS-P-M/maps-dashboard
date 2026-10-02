/**
 * Groq model policy for MAPS.
 *
 * Keep model IDs in environment variables so a Groq deprecation or account
 * availability change does not require edits across every API route.
 */
export const GROQ_MODELS = {
  fast: process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b',
  reasoning: process.env.GROQ_MODEL_REASONING || 'openai/gpt-oss-120b',
} as const

export const AGENT_MODELS = {
  chat: GROQ_MODELS.fast,
  orchestrator: GROQ_MODELS.fast,
  aptitude: GROQ_MODELS.fast,
  questionGenerator: GROQ_MODELS.fast,
  resume: GROQ_MODELS.reasoning,
  coding: GROQ_MODELS.reasoning,
  interview: GROQ_MODELS.reasoning,
  company: GROQ_MODELS.reasoning,
  coach: GROQ_MODELS.reasoning,
  problemGenerator: GROQ_MODELS.reasoning,
} as const
