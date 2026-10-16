# Why MAPS Uses Groq

MAPS uses Groq because it provides a practical balance of speed, cost, model quality, and integration simplicity for an interactive placement-preparation system.

The implementation is centralized in:

- [`lib/agents/groq-client.ts`](./lib/agents/groq-client.ts)
- [`lib/agents/model-registry.ts`](./lib/agents/model-registry.ts)

## 1. Fast responses

MAPS contains several interactive AI features:

- Resume analysis.
- Coding problem generation.
- Coding evaluation.
- Aptitude question generation.
- Interview evaluation.
- Company research.
- Career coaching.
- Personalized roadmaps.
- ARIA chat.

Students expect quick feedback while practicing. Groq is designed for fast inference, which makes it suitable for real-time chat, question generation, and interview feedback.

A slower provider would make the dashboard feel unresponsive, especially when students practice multiple questions in one session.

## 2. Suitable for a multi-agent architecture

MAPS uses multiple specialized agents instead of one general-purpose AI feature. The model registry assigns models according to the complexity of the task.

| Agent category | MAPS agents | Model tier |
|---|---|---|
| Fast tasks | ARIA chat, coordinator, aptitude generation, interview-question generation | Fast model |
| Complex tasks | Resume analysis, coding evaluation, interview scoring, company research, coaching, problem generation | Reasoning model |

The current default models are:

```text
Fast model:
openai/gpt-oss-20b

Reasoning model:
openai/gpt-oss-120b
```

The assignment is configured centrally:

```ts
export const AGENT_MODELS = {
  chat: GROQ_MODELS.fast,
  aptitude: GROQ_MODELS.fast,
  questionGenerator: GROQ_MODELS.fast,

  resume: GROQ_MODELS.reasoning,
  coding: GROQ_MODELS.reasoning,
  interview: GROQ_MODELS.reasoning,
  company: GROQ_MODELS.reasoning,
  coach: GROQ_MODELS.reasoning,
}
```

This prevents the application from using a more expensive reasoning model for every small request.

## 3. Practical cost

For a final-year project, the AI provider must be practical to develop and demonstrate.

Groq is suitable because:

- It provides accessible API usage.
- It supports free or low-cost development options, depending on the account and model.
- It does not require the project to own GPU hardware.
- Requests are made only when an agent is used.
- Fast and reasoning tiers help control usage.

This is more practical than running a large model locally or using an expensive model for every operation.

## 4. Simple API integration

Groq provides a chat-completion API pattern that is straightforward to integrate through its SDK.

The shared client sends requests in one place:

```ts
const completion = await groq.chat.completions.create({
  model,
  messages,
  temperature,
  max_tokens: 4096,
})
```

This supports:

- System prompts.
- User messages.
- Conversation history.
- Model selection.
- JSON responses.
- Streaming chat responses.

The shared client avoids duplicating provider logic across every agent route.

## 5. Centralized model management

Model IDs are not hardcoded independently in every API route. They are configured through environment variables:

```ts
export const GROQ_MODELS = {
  fast: process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b',
  reasoning: process.env.GROQ_MODEL_REASONING || 'openai/gpt-oss-120b',
}
```

Models can therefore be changed without rewriting the agent routes:

```env
GROQ_MODEL_FAST=your-fast-model
GROQ_MODEL_REASONING=your-reasoning-model
```

This also makes future Groq model migrations easier.

## 6. Structured responses

Several MAPS agents need structured output:

- Resume scores.
- Resume keywords and gaps.
- Interview scores.
- Coding feedback.
- Aptitude questions.
- Roadmap tasks.

The shared client supports JSON mode:

```ts
response_format: jsonMode
  ? { type: "json_object" }
  : undefined
```

This helps the application parse AI responses and display them in the dashboard. The application still parses and validates responses because AI output must not be trusted blindly.

## 7. Why not other providers?

### OpenAI

OpenAI is a strong and valid alternative, but:

- Repeated practice requests can increase costs.
- A different provider configuration would be required.
- It may provide more capability than needed for some short tasks.

OpenAI could be adopted later by replacing or extending the shared AI client.

### Google Gemini

Gemini is a strong alternative, especially for long-context and multimodal tasks. However:

- It would require a separate SDK and request format.
- The current application is built around the Groq chat-completion interface.
- Model behavior and JSON output would need to be retested.

### Anthropic Claude

Claude is strong for reasoning, long documents, and writing quality. However:

- Repeated student practice may cost more.
- It requires a different API integration.
- It may be unnecessary for short aptitude and chat requests.

### Local models

Running a local model could reduce external API dependency, but it would require:

- Powerful hardware.
- More memory.
- Model installation and maintenance.
- Additional deployment complexity.
- Potentially slower inference on ordinary computers.

This would make the project harder to demonstrate reliably.

## 8. Provider portability

Choosing Groq does not permanently lock MAPS to Groq.

Most routes call the shared function:

```ts
generateText(...)
```

The provider implementation is isolated in:

[`lib/agents/groq-client.ts`](./lib/agents/groq-client.ts)

A future provider migration can therefore be handled primarily by replacing or extending the shared client instead of rewriting every agent route.

## 9. Limitations

Groq is appropriate for this project, but it has limitations:

- The application depends on an external provider.
- API availability and rate limits can affect the dashboard.
- Model availability may change.
- AI responses are not guaranteed to be factually perfect.
- AI-generated evaluation scores are estimates, not official recruitment results.
- Production deployment requires rate limiting, usage monitoring, retry handling, and possibly provider fallback.

The API key is loaded server-side:

```ts
const apiKey = process.env.GROQ_API_KEY
```

The key must never be exposed in client-side code or committed to the repository.

## Review-Ready Explanation

The following answer can be used during a project review:

> I selected Groq because MAPS requires fast responses for several interactive AI agents, including chat, aptitude, coding, resume, and interview preparation. Groq provides low-latency inference, practical development costs, and an API that is compatible with the chat-completion pattern used by the application. I separated the agents into fast and reasoning tiers, so lightweight tasks use a faster model while resume analysis, coding evaluation, and interview scoring use a more capable reasoning model. The integration is centralized behind a shared client and model registry, so the system can switch models or providers later without rewriting every agent route.

## Short Summary

```text
Groq was chosen because it provides:

1. Fast inference.
2. Practical cost for a student project.
3. Multiple model tiers.
4. Simple API integration.
5. Structured JSON responses.
6. Streaming support.
7. No local GPU requirement.
8. Centralized model configuration.
9. A future path to provider migration.
```
