import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { askEric, extractUrls, type ChatMessage as Message } from '../lib/askEric'

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
