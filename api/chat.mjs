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

/** Burst limit per warm instance — light touch, just to blunt hammering. */
const hits = new Map()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 15

function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query, history, pageContext } = req.body ?? {}

  if (!query?.trim()) return res.status(400).json({ error: 'Missing query.' })
  if (query.length > 2000) return res.status(400).json({ error: 'That message is too long.' })

  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Slow down a moment, then try again.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[chat] missing GEMINI_API_KEY')
    return res.status(500).json({ error: 'Chat is not configured.' })
  }

  const systemPrompt = pageContext
    ? `${SYSTEM_PROMPT}\n\nADDITIONAL CONTEXT ABOUT THE PAGE THE USER IS VIEWING (use only if relevant to their question):\n${pageContext}`
    : SYSTEM_PROMPT

  // Only the last few turns — keeps latency and token spend predictable.
  const trimmed = Array.isArray(history) ? history.slice(-10) : []
  const contents = [
    ...trimmed.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: query }] },
  ]

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
            // which truncated replies mid-sentence. This chat wants short
            // conversational answers, not deliberation.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    if (!r.ok) {
      const detail = await r.text()
      console.error('[chat] gemini failed:', r.status, detail)
      return res.status(502).json({ error: "Sorry, I'm having trouble connecting right now." })
    }

    const data = await r.json()
    const candidate = data?.candidates?.[0]
    if (candidate?.finishReason === 'MAX_TOKENS') {
      console.warn('[chat] hit token ceiling', data?.usageMetadata)
    }

    const text = candidate?.content?.parts?.[0]?.text
    if (typeof text !== 'string') {
      console.error('[chat] no text returned, finishReason:', candidate?.finishReason)
      return res.status(502).json({ error: "Sorry, I couldn't come up with a reply to that." })
    }

    return res.status(200).json({ text })
  } catch (err) {
    console.error('[chat] unexpected error:', err)
    return res.status(500).json({ error: 'Something went wrong.' })
  }
}
