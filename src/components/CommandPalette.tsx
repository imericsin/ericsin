import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const pages = [
  { label: 'About',    href: '/' },
  { label: 'Work',     href: '/work' },
  { label: 'Feed',     href: '/feed' },
  { label: 'Thoughts', href: '/thoughts' },
]

interface Message {
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

async function askEric(query: string, history: Message[]): Promise<string> {
  const API_KEY = 'AIzaSyAap2rtGl2uCSlKMOdqz7Jj_bIM9I_1ypw'

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
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.9, maxOutputTokens: 350 },
      }),
    }
  )

  if (!res.ok) throw new Error('API error')
  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}

function extractUrls(text: string) {
  return text.match(/(https?:\/\/[^\s)]+)/g) ?? []
}

function MessageContent({ text }: { text: string }) {
  const urls = extractUrls(text)
  let clean = text
  urls.forEach(u => { clean = clean.replace(u, '') })
  clean = clean.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).join('\n').replace(/\(\s*\)/g, '').trim()

  return (
    <div className="cmdk-chat-text">
      <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: clean.replace(/\*([^*]+)\*/g, '<i>$1</i>') }} />
      {urls.map((url, i) => {
        try {
          const domain = new URL(url).hostname.replace('www.', '')
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="cmdk-link-card">
              <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="cmdk-link-favicon" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              <span className="cmdk-link-domain">{domain}</span>
            </a>
          )
        } catch { return null }
      })}
    </div>
  )
}

export default function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'search' | 'chat'>('search')
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setQuery('')
        setMode('search')
        setMessages([])
        setStreaming('')
        setLoading(false)
      }, 200)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  function close() { onOpenChange(false) }

  function goTo(href: string) {
    close()
    navigate(href)
  }

  async function ask(q: string) {
    if (!q.trim() || loading) return
    const userMsg: Message = { role: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      const response = await askEric(q, messages)
      setLoading(false)
      // simulate streaming char by char
      let i = 0
      const interval = setInterval(() => {
        if (i < response.length) {
          setStreaming(response.slice(0, i + 1))
          i++
        } else {
          clearInterval(interval)
          setStreaming('')
          setMessages(prev => [...prev, { role: 'model', text: response }])
        }
      }, 12)
    } catch {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }])
    }
  }

  function handleAsk() {
    const q = query.trim()
    if (!q) return
    setMode('chat')
    ask(q)
  }

  const showAskItem = query.trim().length > 0 && mode === 'search'

  if (!open) return null

  return createPortal(
    <div className="cmdk-overlay" onClick={close}>
      <div className="cmdk-dialog" onClick={e => e.stopPropagation()}>

        {mode === 'search' ? (
          <Command shouldFilter>
            <Command.Input
              ref={inputRef}
              placeholder="Search or ask Eric anything..."
              value={query}
              onValueChange={setQuery}
              onKeyDown={e => {
                if (e.key === 'Escape') close()
              }}
              autoFocus
            />
            <Command.List>
              <Command.Empty>
                {showAskItem ? null : <span>No results.</span>}
              </Command.Empty>

              <Command.Group heading="Navigate">
                {pages.map(p => (
                  <Command.Item key={p.href} value={p.label} onSelect={() => goTo(p.href)}>
                    {p.label}
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Contact">
                <Command.Item value="Email" onSelect={() => { close(); window.location.href = 'mailto:hello@ericsin.com' }}>
                  Email — hello@ericsin.com
                </Command.Item>
              </Command.Group>

              {showAskItem && (
                <Command.Group heading="Ask">
                  <Command.Item value={`ask:${query}`} onSelect={handleAsk} className="cmdk-ask-item">
                    <span>{query}</span>
                    <span className="cmdk-ask-badge">Ask</span>
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
          </Command>
        ) : (
          <div className="cmdk-chat">
            <div className="cmdk-chat-header">
              <button className="cmdk-back" onClick={() => { setMode('search'); setMessages([]); setQuery('') }}>
                ← Back
              </button>
              <span>Ask Eric</span>
            </div>

            <div className="cmdk-chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`cmdk-msg cmdk-msg--${m.role}`}>
                  {m.role === 'model' ? (
                    <MessageContent text={m.text} />
                  ) : (
                    <span>{m.text}</span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="cmdk-msg cmdk-msg--model">
                  <span className="cmdk-typing">
                    <span /><span /><span />
                  </span>
                </div>
              )}
              {streaming && (
                <div className="cmdk-msg cmdk-msg--model">
                  <MessageContent text={streaming} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="cmdk-chat-input-row">
              <input
                className="cmdk-chat-input"
                placeholder="Ask a follow-up..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(query) }
                  if (e.key === 'Escape') close()
                }}
                disabled={loading}
                autoFocus
              />
              <button className="cmdk-send" onClick={() => ask(query)} disabled={!query.trim() || loading}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
