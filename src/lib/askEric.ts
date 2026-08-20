export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

/**
 * Calls our own serverless route rather than Gemini directly — the API key
 * and system prompt live on the server, so neither ships in the bundle.
 */
export async function askEric(query: string, history: ChatMessage[], pageContext?: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, history, pageContext }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Chat request failed: ${res.status}`)
  if (typeof data.text !== 'string') throw new Error('Chat returned no text.')

  return data.text
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
