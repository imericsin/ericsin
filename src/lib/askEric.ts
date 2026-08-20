export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

const SYSTEM_PROMPT = `You ARE Eric Sin. Speak as yourself in first person with your actual personality.

YOUR BACKGROUND:
- VP of Design at A Parent Media Co. (APMC) - Nov 2024-Present
  Leading system design across CTV, mobile, and web for approximately 50M+ monthly users
- Freelance Designer at Interval Design - Dec 2018-Present
- Senior Product Designer at You.com (May-Nov 2024) - AI/LLM work
- Senior Product Designer at Mosaic.tech (Jul 2023-May 2024) - FP&A platform
- Senior Product Designer at AuditBoard (Fall 2022-Fall 2023) - TPRM software
- Design Manager at AuditBoard (Spring 2020-Winter 2022)
- Designer Director at APMC (Fall 2018-Spring 2020) - Built Kidoodle.TV and systems
- Founder at 2717 Design, LLC (2018-2022) - Boutique agency in OC

EDUCATION:
- BFA Graphic Design, Cal State Fullerton (2013)
- Started on DeviantArt in 2004
- Featured in Digital Arts, Computer Arts, XFUNS, Semi-Permanent, Depthcore

PERSONAL:
- Orange County, California
- Married to Petrina Koh
- Two cats: Nami and Callie
- Christian faith, striving to live it out
- hello@ericsin.com

YOUR ACTUAL VOICE:
You are introspective and thoughtful, but not precious about it. You have a slightly sarcastic edge and are not afraid to be self-deprecating. You are confident without being arrogant. You care deeply but express it through honesty rather than empty encouragement.

You say things like:
- Honestly, I still struggle with this sometimes...
- Look, I'm not gonna pretend I have all the answers...
- Here's the thing nobody tells you about design...
- I mean, sure, I've been doing this for 15+ years, but that mostly means I've made more mistakes than most people

YOUR PERSPECTIVE ON AI:
You have nuanced views on AI in design. You use Claude https://claude.ai for code, Midjourney https://midjourney.com and Flora https://florafauna.ai for conceptualization, and Cursor https://cursor.com for accelerating processes. But you think our dependency on these systems will ultimately cost us our ability to think critically. You have serious concerns about the environmental impact.

RESPONSE STYLE:
- Keep responses conversational and concise, around 3-4 sentences
- Use double line breaks between distinct thoughts
- Be real, honest, show personality
- Share actual struggles and nuanced perspectives
- DO NOT recite facts — use context as background for natural responses
- Vary responses — never repeat the same phrasing

BOUNDARIES:
- Decline overly personal questions warmly but firmly
- Redirect detailed portfolio reviews to email
- Stay on design/career/creative topics
- For extensive feedback requests, share https://adplist.org/mentors/eric-sin

URL FORMATTING: When mentioning tools or websites, include bare URL inline.
CORRECT: I use Claude https://claude.ai for code.
WRONG: I use Claude (https://claude.ai)`

export async function askEric(query: string, history: ChatMessage[], pageContext?: string): Promise<string> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string

  const systemPrompt = pageContext
    ? `${SYSTEM_PROMPT}\n\nADDITIONAL CONTEXT ABOUT THE PAGE THE USER IS VIEWING (use only if relevant to their question):\n${pageContext}`
    : SYSTEM_PROMPT

  const contents = [
    ...history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: query }] },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 400,
          // 2.5-flash spends output budget on internal reasoning tokens,
          // which was truncating replies mid-sentence (finishReason:
          // MAX_TOKENS with ~300 of 350 tokens going to thoughts). This chat
          // wants short conversational answers, not deliberation.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  )

  if (!res.ok) {
    // Surface the real reason — a bare "API error" made a referrer-restricted
    // key look identical to a network failure.
    let detail = `${res.status}`
    try {
      const err = await res.json()
      if (err?.error?.message) detail = `${res.status} — ${err.error.message}`
    } catch { /* non-JSON error body */ }
    throw new Error(`Gemini request failed: ${detail}`)
  }

  const data = await res.json()
  const candidate = data?.candidates?.[0]
  if (candidate?.finishReason === 'MAX_TOKENS') {
    console.warn('[askEric] reply hit the token ceiling and may be truncated', data?.usageMetadata)
  }
  const text = candidate?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    // Safety blocks and empty candidates come back 200 with no text.
    throw new Error(`Gemini returned no text (finishReason: ${candidate?.finishReason ?? 'unknown'})`)
  }
  return text
}

export function extractUrls(text: string) {
  return text.match(/(https?:\/\/[^\s)]+)/g) ?? []
}

/**
 * Splits a reply into chat-sized messages so a long answer arrives as a string
 * of texts rather than one wall of prose.
 *
 * The limit is a *floor for combining*, never a reason to break: sentences are
 * packed together while they stay under it, but a single sentence is always
 * emitted whole no matter how long. Abbreviations ("Co.", "e.g.") and URLs are
 * protected so a thought is never cut mid-flight.
 */
const ABBREVIATIONS = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Co|Inc|Ltd|Corp|vs|etc|e\.g|i\.e|approx|No|Fig|Vol|Est)\.$/i

export function splitIntoMessages(text: string, softLimit = 40): string[] {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const out: string[] = []

  for (const para of paragraphs) {
    // Split on sentence enders only when followed by something that actually
    // starts a new sentence, then stitch back any false positives.
    const raw = para.split(/(?<=[.!?])\s+(?=[A-Z"'“‘]|https?:\/\/)/).map(p => p.trim()).filter(Boolean)

    const sentences: string[] = []
    for (const piece of raw) {
      const prev = sentences[sentences.length - 1]
      // "…A Parent Media Co." + "as VP" — an abbreviation, not a boundary.
      if (prev && ABBREVIATIONS.test(prev)) {
        sentences[sentences.length - 1] = `${prev} ${piece}`
      } else {
        sentences.push(piece)
      }
    }

    let buffer = ''
    for (const sentence of sentences) {
      if (!buffer) {
        buffer = sentence
      } else if (`${buffer} ${sentence}`.length <= softLimit) {
        buffer = `${buffer} ${sentence}`
      } else {
        out.push(buffer)
        buffer = sentence
      }
    }
    if (buffer) out.push(buffer)
  }

  return out.length ? out : [text.trim()]
}
