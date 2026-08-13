// app/api/agents/aptitude/route.ts
// Aptitude Agent — adaptive difficulty based on topic accuracy

import { NextRequest } from 'next/server'
import { generateText } from '../../../../lib/agents/groq-client'
import { APTITUDE_AGENT_PROMPT } from '../../../../lib/agents/agent-prompts'
import { jsonrepair } from 'jsonrepair'

export const runtime = 'nodejs'

const normalizeTopicForMatch = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

const normalizeQuestionText = (s: string) =>
  String(s || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#+\s*/g, '')
    .replace(/[`*_>~-]/g, '')
    .replace(/\$+|\\\[|\\\]|\\\(|\\\)/g, '')
    .replace(/[.,;:()\[\]{}"'\/\\<>?!@#%^&*+=|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const stripCodeFences = (s: string) =>
  String(s || '')
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim()

const extractBalancedObjectCandidates = (s: string) => {
  const candidates: string[] = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') {
      if (depth === 0) start = i
      depth++
      continue
    }

    if (ch === '}') {
      if (depth > 0) depth--
      if (depth === 0 && start !== -1) {
        candidates.push(s.slice(start, i + 1))
        start = -1
      }
    }
  }

  return candidates
}

const sanitizeJsonLikeString = (input: string) => {
  let out = stripCodeFences(input).trim()

  // Trim any leading text before first object and trailing text after last object.
  const firstBrace = out.indexOf('{')
  const lastBrace = out.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    out = out.slice(firstBrace, lastBrace + 1)
  }

  // Quote unquoted keys: { key: -> { "key":
  out = out.replace(/([,{]\s*)([A-Za-z0-9_\-]+)\s*:/g, '$1"$2":')
  // Convert single-quoted keys: {'key': -> {"key":
  out = out.replace(/([,{]\s*)'([^']+?)'\s*:/g, '$1"$2":')

  // Escape lone backslashes that would break JSON (avoid double-escaping existing escapes)
  out = out.replace(/\\(?=[^"\\/bfnrtu])/g, '\\\\')
  // Escape bad \u sequences (not followed by 4 hex digits)
  out = out.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u')

  // Unicode-escape control characters (0x00-0x1F)
  out = out.replace(/[\u0000-\u001F]/g, (c) => {
    const code = c.charCodeAt(0).toString(16).padStart(4, '0')
    return `\\u${code}`
  })

  return out
}

const parseModelJsonObject = (rawText: string): { parsed: any | null; parseError?: string } => {
  const text = stripCodeFences(rawText)
  const direct = sanitizeJsonLikeString(text)

  // 1) Direct parse attempts
  try {
    return { parsed: JSON.parse(direct) }
  } catch {}
  try {
    return { parsed: JSON.parse(jsonrepair(direct)) }
  } catch {}

  // 2) Candidate object slices (balanced braces, string-aware)
  const candidates = extractBalancedObjectCandidates(text)
  for (const candidate of candidates) {
    const sanitized = sanitizeJsonLikeString(candidate)
    try {
      return { parsed: JSON.parse(sanitized) }
    } catch {}

    try {
      const repaired = jsonrepair(sanitized)
      return { parsed: JSON.parse(repaired) }
    } catch {}
  }

  return {
    parsed: null,
    parseError: `Could not parse model output as JSON object. Raw preview: ${text.slice(0, 160)}`,
  }
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Time, Speed & Distance': ['train', 'speed', 'distance', 'time', 'km/h', 'm/s'],
  'Probability': ['probability', 'dice', 'coin', 'event', 'outcome'],
  'Permutations & Combinations': ['arrange', 'arrangement', 'permutation', 'combination', 'select'],
  'Pipes & Cisterns': ['pipe', 'cistern', 'tank', 'fill', 'empty'],
  'Profit & Loss': ['profit', 'loss', 'cost price', 'selling price', 'discount'],
  'Syllogisms': ['all', 'some', 'none', 'conclusion', 'statement'],
  'Blood Relations': ['brother', 'sister', 'father', 'mother', 'uncle', 'aunt'],
  'Number Series': ['series', 'next number', 'pattern', 'sequence'],
  'Seating Arrangement': ['seated', 'arrangement', 'left', 'right', 'row', 'circular'],
  'Reading Comprehension': ['passage', 'according to the passage', 'author', 'paragraph'],
  'Sentence Correction': ['sentence', 'grammatically', 'correction', 'error'],
  'Synonyms & Antonyms': ['synonym', 'antonym', 'opposite', 'similar meaning'],
  'Error Spotting': ['error', 'spot', 'incorrect part', 'identify the error'],
}

const isQuestionAlignedToTopic = (topic: string, question: string) => {
  const normalizedQuestion = normalizeQuestionText(question)
  const topicKeywords = TOPIC_KEYWORDS[topic] || []
  if (topicKeywords.length === 0) return true
  return topicKeywords.some((keyword) => normalizedQuestion.includes(normalizeQuestionText(keyword)))
}

const isLikelyDuplicateQuestion = (a: string, b: string) => {
  const na = normalizeQuestionText(a)
  const nb = normalizeQuestionText(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const shortA = na.slice(0, 140)
  const shortB = nb.slice(0, 140)
  if (shortA && shortB && (shortA === shortB || shortA.includes(shortB) || shortB.includes(shortA))) return true
  return false
}

const buildTopicFallbackQuestion = (topic: string, subtopic?: string | null, recentQuestions: string[] = []) => {
  const bank: Record<string, Array<{ question: string; options: string[]; correctIndex: number; finalAnswer: string; numericSolution: string; keyTakeaway: string }>> = {
    'Time, Speed & Distance': [
      { question: 'A train 180 m long runs at 72 km/h. How many seconds does it take to cross a pole?', options: ['6 s', '9 s', '12 s', '15 s'], correctIndex: 1, finalAnswer: '9 s', numericSolution: 'Speed = 72 x 5/18 = 20 m/s; Time = 180/20 = 9 s', keyTakeaway: 'Convert speed into m/s before applying time = distance/speed.' },
      { question: 'A car covers 240 km in 4 hours. What is its average speed?', options: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'], correctIndex: 2, finalAnswer: '60 km/h', numericSolution: 'Average speed = 240/4 = 60 km/h', keyTakeaway: 'Average speed is total distance divided by total time.' },
    ],
    'Probability': [
      { question: 'A fair die is rolled once. What is the probability of getting a number greater than 4?', options: ['1/6', '1/3', '1/2', '2/3'], correctIndex: 1, finalAnswer: '1/3', numericSolution: 'Favorable outcomes = {5,6} = 2; Total outcomes = 6; Probability = 2/6 = 1/3', keyTakeaway: 'Probability = favorable outcomes / total outcomes.' },
      { question: 'A coin is tossed twice. What is the probability of getting exactly one head?', options: ['1/4', '1/2', '3/4', '1'], correctIndex: 1, finalAnswer: '1/2', numericSolution: 'Sample space: HH, HT, TH, TT; Favorable = HT, TH => 2/4 = 1/2', keyTakeaway: 'List all outcomes for small experiments to avoid mistakes.' },
    ],
    'Permutations & Combinations': [
      { question: 'In how many ways can 4 students be chosen from 9 students?', options: ['84', '96', '126', '144'], correctIndex: 2, finalAnswer: '126', numericSolution: '9C4 = (9x8x7x6)/(4x3x2x1) = 126', keyTakeaway: 'Use combinations when order does not matter.' },
      { question: 'How many 3-letter arrangements can be made from letters A, B, C, D without repetition?', options: ['12', '18', '24', '64'], correctIndex: 2, finalAnswer: '24', numericSolution: '4P3 = 4x3x2 = 24', keyTakeaway: 'Use permutations when order matters.' },
    ],
    'Pipes & Cisterns': [
      { question: 'Pipe A fills a tank in 6 hours and Pipe B fills it in 3 hours. How long together?', options: ['1.5 h', '2 h', '2.5 h', '3 h'], correctIndex: 1, finalAnswer: '2 h', numericSolution: 'Rate A = 1/6, Rate B = 1/3, Total = 1/2 tank/h => time = 2 h', keyTakeaway: 'Add rates, then invert to get time.' },
      { question: 'A pipe fills a tank in 8 hours. What part of the tank does it fill in 2 hours?', options: ['1/8', '1/4', '1/3', '1/2'], correctIndex: 1, finalAnswer: '1/4', numericSolution: 'Rate = 1/8 per hour; in 2 hours filled = 2/8 = 1/4', keyTakeaway: 'Work done = rate x time.' },
    ],
    'Profit & Loss': [
      { question: 'An article bought for Rs. 500 is sold for Rs. 575. Profit percent is?', options: ['10%', '12%', '15%', '20%'], correctIndex: 2, finalAnswer: '15%', numericSolution: 'Profit = 575 - 500 = 75; Profit% = (75/500)x100 = 15%', keyTakeaway: 'Profit percent is always calculated on cost price.' },
      { question: 'An item is sold at 10% loss for Rs. 450. What is its cost price?', options: ['Rs. 480', 'Rs. 500', 'Rs. 540', 'Rs. 550'], correctIndex: 1, finalAnswer: 'Rs. 500', numericSolution: 'SP = 90% of CP => CP = 450/0.9 = 500', keyTakeaway: 'When loss percent is given, SP = CP x (100-loss%)/100.' },
    ],
    'Syllogisms': [
      { question: 'Statements: All pens are books. Some books are tables. Conclusions: I. Some pens are tables. II. Some books are pens. Which is valid?', options: ['Only I', 'Only II', 'Both I and II', 'Neither I nor II'], correctIndex: 1, finalAnswer: 'Only II', numericSolution: 'From "All pens are books", it follows that some books can be pens (if pens exist). No direct link from pens to tables.', keyTakeaway: 'Only conclusions that must follow from statements are valid.' },
      { question: 'Statements: No cat is a dog. Some dogs are pets. Conclusions: I. Some pets are cats. II. Some pets are dogs. Choose the correct option.', options: ['Only I', 'Only II', 'Both I and II', 'Neither I nor II'], correctIndex: 1, finalAnswer: 'Only II', numericSolution: 'Given some dogs are pets, therefore some pets are dogs. No relation places cats among pets.', keyTakeaway: 'Use only given relations; do not assume extra overlap.' },
    ],
    'Blood Relations': [
      { question: 'Pointing to a woman, Ravi said, "She is the daughter of my mother\'s only son." How is the woman related to Ravi?', options: ['Sister', 'Daughter', 'Mother', 'Niece'], correctIndex: 1, finalAnswer: 'Daughter', numericSolution: 'Mother\'s only son = Ravi; daughter of Ravi = Ravi\'s daughter.', keyTakeaway: 'Break the relation chain one link at a time.' },
      { question: 'A is B\'s brother. C is B\'s mother. D is C\'s father. How is D related to A?', options: ['Father', 'Grandfather', 'Uncle', 'Brother'], correctIndex: 1, finalAnswer: 'Grandfather', numericSolution: 'C is mother of A (since A is B\'s brother). D is father of C => D is A\'s grandfather.', keyTakeaway: 'Build a tiny family tree for relation questions.' },
    ],
    'Number Series': [
      { question: 'Find the next number in the series: 2, 6, 12, 20, 30, ?', options: ['36', '40', '42', '44'], correctIndex: 2, finalAnswer: '42', numericSolution: 'Differences are +4, +6, +8, +10; next difference +12 => 30+12 = 42', keyTakeaway: 'Check first-level differences for arithmetic patterns.' },
      { question: 'Find the next number: 3, 9, 27, 81, ?', options: ['162', '216', '243', '324'], correctIndex: 2, finalAnswer: '243', numericSolution: 'Each term is multiplied by 3: 81 x 3 = 243', keyTakeaway: 'Geometric progression often appears in number series.' },
    ],
    'Seating Arrangement': [
      { question: 'Five people A, B, C, D, E sit in a row. A is left of B, C is right of D, and E is at one end. Which can be a valid middle person?', options: ['A only', 'B only', 'C only', 'B or C'], correctIndex: 3, finalAnswer: 'B or C', numericSolution: 'Multiple valid rows satisfy constraints; checking placements shows middle can be B or C.', keyTakeaway: 'Test constraints systematically instead of guessing one arrangement.' },
      { question: 'In a circular arrangement of 4 people, P sits opposite Q. R sits to the immediate right of P. Who is to the immediate left of Q?', options: ['P', 'R', 'Cannot be determined', 'Either P or R'], correctIndex: 1, finalAnswer: 'R', numericSolution: 'If Q is opposite P, then left of Q is the person adjacent on Q\'s left; with R right of P, layout fixes R left of Q.', keyTakeaway: 'For circular seating, fix one person first to remove rotational ambiguity.' },
    ],
    'Reading Comprehension': [
      { question: '### Passage\n\nRemote work improves flexibility but can reduce spontaneous collaboration. Teams that set clear communication norms often maintain productivity.\n\n### Question\n\nAccording to the passage, what helps teams maintain productivity in remote work?', options: ['Longer working hours', 'Clear communication norms', 'Daily office visits', 'Avoiding collaboration tools'], correctIndex: 1, finalAnswer: 'Clear communication norms', numericSolution: 'The passage explicitly states that teams with clear communication norms maintain productivity.', keyTakeaway: 'In RC, prefer directly stated evidence from the passage.' },
      { question: '### Passage\n\nRegular exercise improves cardiovascular health and mood. However, consistency matters more than intensity for long-term benefits.\n\n### Question\n\nWhich idea is best supported by the passage?', options: ['Only intense workouts are useful', 'Exercise helps mood and heart health', 'Exercise has no long-term impact', 'Consistency is unimportant'], correctIndex: 1, finalAnswer: 'Exercise helps mood and heart health', numericSolution: 'Passage directly mentions both cardiovascular and mood benefits.', keyTakeaway: 'Pick the option that most closely paraphrases the passage.' },
    ],
    'Sentence Correction': [
      { question: 'Choose the grammatically correct sentence.', options: ['Neither of the boys have completed their homework.', 'Neither of the boys has completed his homework.', 'Neither of the boys have completed his homework.', 'Neither of the boys has completed their homework.'], correctIndex: 1, finalAnswer: 'Neither of the boys has completed his homework.', numericSolution: 'Subject "Neither" is singular, so use "has".', keyTakeaway: 'Indefinite pronouns like neither/either are singular in formal grammar.' },
      { question: 'Identify the correct sentence.', options: ['She do not like coffee.', 'She does not likes coffee.', 'She does not like coffee.', 'She not does like coffee.'], correctIndex: 2, finalAnswer: 'She does not like coffee.', numericSolution: 'With "does not", main verb stays base form: like.', keyTakeaway: 'After do/does/did, always use base verb.' },
    ],
    'Synonyms & Antonyms': [
      { question: 'Choose the synonym of "abundant".', options: ['Scarce', 'Plentiful', 'Tiny', 'Rigid'], correctIndex: 1, finalAnswer: 'Plentiful', numericSolution: 'Abundant means available in large quantity, i.e., plentiful.', keyTakeaway: 'Synonyms keep meaning similar even if tone differs.' },
      { question: 'Choose the antonym of "optimistic".', options: ['Hopeful', 'Cheerful', 'Pessimistic', 'Confident'], correctIndex: 2, finalAnswer: 'Pessimistic', numericSolution: 'Antonym of optimistic (positive outlook) is pessimistic (negative outlook).', keyTakeaway: 'Antonyms reverse the core meaning of the word.' },
    ],
    'Error Spotting': [
      { question: 'Identify the part with an error: "Each of the players / were given / a medal / after the match."', options: ['Each of the players', 'were given', 'a medal', 'after the match'], correctIndex: 1, finalAnswer: 'were given', numericSolution: 'Subject "Each" is singular; correct verb is "was given".', keyTakeaway: 'With "each/every", use singular verb.' },
      { question: 'Find the incorrect part: "He is one of those students / who works hard / for every exam / throughout the year."', options: ['He is one of those students', 'who works hard', 'for every exam', 'throughout the year'], correctIndex: 1, finalAnswer: 'who works hard', numericSolution: 'Relative clause refers to "students" (plural), so it should be "who work hard".', keyTakeaway: 'Relative pronoun verb agrees with its antecedent.' },
    ],
  }

  const generic = [
    { question: `In ${topic}, a basic concept-check question: if value increases from 20 to 25, what is the percentage increase?`, options: ['20%', '25%', '30%', '35%'], correctIndex: 1, finalAnswer: '25%', numericSolution: 'Increase = 25-20 = 5; % increase = (5/20)x100 = 25%', keyTakeaway: 'Percentage increase is change divided by original value.' },
  ]

  const candidates = bank[topic] || generic
  const seen = recentQuestions.map((rq) => {
    const parts = String(rq).split('::')
    return normalizeQuestionText(parts.length > 1 ? parts.slice(1).join('::') : rq)
  })
  const picked = candidates.find((c) => !seen.some((s) => isLikelyDuplicateQuestion(s, c.question))) || candidates[Math.floor(Math.random() * candidates.length)]

  return {
    question: picked.question,
    options: picked.options,
    correctIndex: picked.correctIndex,
    topic,
    subtopic: subtopic || null,
    id: `fallback-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    keyTakeaway: picked.keyTakeaway,
    steps: [
      { title: 'Step 1: Identify the concept', content: `This is a **${topic}** problem.` },
      { title: 'Step 2: Compute carefully', content: 'Apply the formula with the provided values.' },
    ],
    numericSolution: picked.numericSolution,
    finalAnswer: picked.finalAnswer,
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      topic = 'General Aptitude',
      subtopic,
      // Adaptive difficulty from student context
      topicAccuracy,        // { "Quantitative Aptitude": 60, "Logical Reasoning": 45 }
      recentWrong = [],     // last wrong subtopics, to avoid repeating
      recentQuestions = [], // recently generated question strings to avoid duplicates
    } = await req.json()

    // ── Adaptive Difficulty Logic ────────────────────────────────────────────
    const accuracy = topicAccuracy?.[topic]
    let difficultyInstruction = ''
    let adaptiveNote = ''

    if (accuracy == null || accuracy >= 80) {
      // New topic or doing well → standard/hard
      difficultyInstruction = 'Generate a HARD-level question that tests advanced concepts.'
      adaptiveNote = accuracy >= 80 ? `(Student has ${accuracy}% accuracy — escalate difficulty)` : '(First attempt on this topic)'
    } else if (accuracy >= 50) {
      // Struggling — medium difficulty
      difficultyInstruction = 'Generate a MEDIUM-level question. Focus on concept clarity and approach.'
      adaptiveNote = `(Student has ${accuracy}% accuracy — reinforce core concepts)`
    } else {
      // Weak — foundational question with clear explanation
      difficultyInstruction = 'Generate an EASY-to-MEDIUM question. This student is struggling. Prioritize a clear, step-by-step explainable approach over trick questions.'
      adaptiveNote = `(Student has only ${accuracy}% accuracy — build confidence with a clearly solvable problem)`
    }

    const subtopicFocus = subtopic
      ? `Focus specifically on the subtopic: **${subtopic}**`
      : ''

    const scopedRecentQuestions = Array.isArray(recentQuestions)
      ? recentQuestions.filter((rq: string) => {
          const parts = String(rq).split('::')
          if (parts.length < 2) return true
          const taggedTopic = normalizeTopicForMatch(parts[0])
          return taggedTopic === normalizeTopicForMatch(topic)
        })
      : []

    const avoidParts: string[] = []
    if (recentWrong.length > 0) avoidParts.push(`AVOID repeating these recently tested subtopics: ${recentWrong.join(', ')}`)
    // recentQuestions elements arrive as `${topic}::${questionText}` — include only the question text portion in the instruction
    if (scopedRecentQuestions.length > 0) {
      const recentTexts = scopedRecentQuestions.slice(-10).map((rq: string) => {
        const parts = String(rq).split('::')
        return parts.length > 1 ? parts.slice(1).join('::').trim() : String(rq).trim()
      })
      avoidParts.push(`DO NOT repeat these recently generated questions: ${recentTexts.join(' || ')}`)
    }
    const avoidInstruction = avoidParts.join('\n')

    let userMessage = `Generate a unique, challenging aptitude question for the topic: **${topic}**
${subtopicFocus}

${difficultyInstruction}
${adaptiveNote}

${avoidInstruction}

The question must be fresh, practical, and test real placement exam skills.`
    // Ask model explicitly to avoid paraphrasing existing questions
    userMessage += '\n\nDo NOT paraphrase or lightly reword previously asked questions; produce a substantively different question stem and scenario.'

    // Try multiple attempts if the model repeats a recent question. Keep attempts small to avoid token waste.
    let result: any = null
    const maxAttempts = 5
    const variationSeed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    userMessage += `\n\nVariation seed: ${variationSeed}. Use a different numeric setup and scenario style from prior questions.`
    // Build a system prompt that injects the requested topic/subtopic to strongly influence the model
    const systemPrompt = `${APTITUDE_AGENT_PROMPT}\n\n### SYSTEM INJECTION: The requested topic is: ${topic}. ${subtopic ? `Subtopic: ${subtopic}.` : ''} You MUST include a top-level \"topic\" field equal to \"${topic}\" and ensure the question specifically tests this topic.`
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Request a structured JSON object from the model when possible to avoid fragile text parsing
      let raw: any
      try {
        raw = await generateText(
          systemPrompt,
          userMessage,
          [],
          'llama-3.1-8b-instant',
          true // jsonMode = true -> ask Groq SDK for JSON object response when supported
        )
      } catch (e) {
        console.warn('[Aptitude Agent] generateText error, attempt', attempt, e)
        // transient error (rate limit, network). small backoff and retry.
        const backoffMs = Math.min(30000, (attempt + 1) * 1000)
        await new Promise((res) => setTimeout(res, backoffMs))
        continue
      }

      // If the SDK returned a JSON object already (preferred), use it directly.
      if (typeof raw === 'object' && raw !== null) {
        result = raw
      } else {
        // raw is a string — parse robustly (handles code fences / malformed JSON-like text)
        const text = String(raw)
        const parsed = parseModelJsonObject(text)
        if (parsed.parsed) {
          result = parsed.parsed
        } else {
          console.warn('[Aptitude Agent JSON Parse Warning]', parsed.parseError || 'Unable to parse JSON')
          result = { _raw: text }
        }
      }

      // If result produced a question text, check duplicates
      if (result && result.question && scopedRecentQuestions.length > 0) {
        const found = scopedRecentQuestions.some((rq: string) => {
          const parts = String(rq).split('::')
          const text = parts.length > 1 ? parts.slice(1).join('::').trim() : String(rq).trim()
          return isLikelyDuplicateQuestion(text, String(result.question))
        })
        if (found) {
          // Ask for a different question on next attempt by appending a short instruction
          userMessage += '\n\n(Please provide a different question than the ones listed above.)'
          result = null
          continue
        }
      }

      // Ensure the model returned the requested topic (or a clearly matching topic)
      if (result && typeof result === 'object' && !result._raw) {
        const returnedTopic = normalizeTopicForMatch(result.topic ? String(result.topic) : '')
        const requestedTopic = normalizeTopicForMatch(String(topic || ''))
        // Loose match after normalization: requested topic and returned topic should overlap
        const topicMatches = returnedTopic && (
          returnedTopic.includes(requestedTopic) ||
          requestedTopic.includes(returnedTopic) ||
          returnedTopic.split(/\s+/).some((token) => token.length > 3 && requestedTopic.includes(token))
        )
        const questionAligned = isQuestionAlignedToTopic(String(topic), String(result.question || ''))
        if (!topicMatches && !questionAligned) {
          // Ask model to include/align the topic and produce a question specific to it
          userMessage += `\n\nIMPORTANT: The JSON must include a top-level \"topic\" field equal to \"${topic}\" and the question should specifically test that topic.`
          result = null
          continue
        }
      }

      if (result) break
    }

    if (!result) {
      const fallback = buildTopicFallbackQuestion(String(topic), subtopic || null, scopedRecentQuestions)
      ;(fallback as any)._generatedBy = 'server-topic-fallback'
      return Response.json(fallback, { status: 200 })
    }

    // Final topic guard: if question text still doesn't align, switch to deterministic topic fallback.
    if (!isQuestionAlignedToTopic(String(topic), String(result.question || ''))) {
      const fallback = buildTopicFallbackQuestion(String(topic), subtopic || null, scopedRecentQuestions)
      ;(fallback as any)._generatedBy = 'server-topic-fallback-final-guard'
      result = fallback
    } else {
      result.topic = topic
      result.subtopic = subtopic || null
    }

    // Ensure the response includes an explicit final answer and a plain numeric solution
    // Many models include LaTeX-only math — provide a fallback plain-text numericSolution
    try {
      if (!result.finalAnswer) {
        if (Array.isArray(result.options) && typeof result.correctIndex === 'number') {
          result.finalAnswer = result.options[result.correctIndex]
        } else if (typeof result.keyTakeaway === 'string') {
          // Attempt to extract a numeric answer from the keyTakeaway
          const numMatch = result.keyTakeaway.match(/([-+]?\d+(?:\.\d+)?\s*(?:s|m|km|km\/h|m\/s|sec|s)?)/i)
          if (numMatch) result.finalAnswer = numMatch[0]
        }
      }

      if (!result.numericSolution) {
        // Build a simple plain-text numericSolution from steps by stripping LaTeX markers
        if (Array.isArray(result.steps) && result.steps.length > 0) {
          const cleaned = result.steps.map((st: any, i: number) => {
            const raw = String(st.content || '')
            // strip display math delimiters and common LaTeX commands to produce readable numeric text
            let plain = raw.replace(/\$\$|\$|\\\[|\\\]/g, '')
            // replace common LaTeX fraction \frac{a}{b} -> (a/b)
            plain = plain.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)')
            // remove remaining backslashes
            plain = plain.replace(/\\/g, '')
            // collapse multiple spaces
            plain = plain.replace(/\s+/g, ' ').trim()
            return `${i + 1}. ${plain}`
          }).join('\n')

          result.numericSolution = cleaned
        } else if (result.finalAnswer) {
          result.numericSolution = `Final answer: ${result.finalAnswer}`
        }
      }
    } catch (e) {
      console.warn('Failed to synthesize numericSolution/finalAnswer', e)
    }

    // Attach metadata to help the frontend display adaptive context
    result._adaptive = {
      topic,
      subtopic: subtopic || null,
      accuracy: accuracy ?? null,
      difficultyMode: accuracy == null ? 'standard' : accuracy >= 80 ? 'hard' : accuracy >= 50 ? 'medium' : 'easy',
    }

    return Response.json(result)
  } catch (error) {
    console.error('[Aptitude Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Aptitude agent unavailable' },
      { status: 500 }
    )
  }
}
