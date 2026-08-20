import { useEffect, useRef, useState } from 'react'
import Message from './Message'
import ContactForm from './ContactForm'
import { askEric, extractUrls, splitIntoMessages, type ChatMessage } from '../lib/askEric'
import dockIcon from '../assets/icons/dock.svg'
import sendActive from '../assets/icons/send-active.svg'
import sendInactive from '../assets/icons/send-inactive.svg'
import cancelPrompt from '../assets/icons/cancel-prompt.svg'
import closeIcon from '../assets/icons/close.svg'

type Tab = 'Chat' | 'Contact'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Extra page/case-study content to ground answers in, if any. */
  pageContext?: string
  /** Fires whenever docked state changes, so the host page can make room. */
  onDockChange?: (docked: boolean) => void
  className?: string
}

const STREAM_MS = 12
/** Beat between consecutive bubbles in a multi-message reply. */
const MESSAGE_GAP_MS = 420
/** Soft character budget per bubble — long answers arrive as a few texts. */
const MESSAGE_SOFT_LIMIT = 40

const ZERO_STATE_MESSAGE = 'Hi, nice to meet you.\nHow can I help you?'
export const PROMPT_STORAGE_KEY = 'prompt-chat-state'
const STORAGE_KEY = PROMPT_STORAGE_KEY

/** Dock state at first paint, so the app shell can reserve the gutter
 *  before the panel mounts instead of snapping a frame later. */
export function loadDockedPreference(): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw).docked === true : false
  } catch {
    return false
  }
}
const DEFAULT_HEIGHT = 360
const MIN_HEIGHT = 240
const MAX_HEIGHT = 640

type StoredState = { tab: Tab; messages: ChatMessage[]; height?: number; docked?: boolean }

function loadStored(): StoredState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { tab: 'Chat', messages: [] }
    const parsed = JSON.parse(raw)
    return {
      tab: parsed.tab === 'Contact' ? 'Contact' : 'Chat',
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      height: typeof parsed.height === 'number' ? parsed.height : undefined,
      docked: parsed.docked === true,
    }
  } catch {
    return { tab: 'Chat', messages: [] }
  }
}

function MessageText({ text }: { text: string }) {
  const urls = extractUrls(text)
  let clean = text
  urls.forEach(u => { clean = clean.replace(u, '') })
  clean = clean.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).join('\n').replace(/\(\s*\)/g, '').trim()

  return (
    <>
      <span style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: clean.replace(/\*([^*]+)\*/g, '<i>$1</i>') }} />
      {urls.length > 0 && (
        <div className="prompt__link-cards">
          {urls.map((url, i) => {
            try {
              const domain = new URL(url).hostname.replace('www.', '')
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="prompt__link-card">
                  <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="prompt__link-favicon" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  <span>{domain}</span>
                </a>
              )
            } catch { return null }
          })}
        </div>
      )}
    </>
  )
}

// CMD+K-triggered chat prompt. Owns its own open/close wiring (esc, click
// outside, CMD+K toggle) so it can be dropped anywhere without extra
// plumbing — App.tsx isn't touched until this is verified on its own demo
// page. Extended-context (pageContext) is optional and just gets appended
// to the system prompt when present.
export default function PromptComponent({ open, onOpenChange, pageContext, onDockChange, className }: Props) {
  const [tab, setTab] = useState<Tab>(() => loadStored().tab)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStored().messages)
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const [height, setHeight] = useState(() => loadStored().height ?? DEFAULT_HEIGHT)
  const [resizing, setResizing] = useState(false)
  const [docked, setDocked] = useState(() => loadStored().docked ?? false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<{ cancelled: boolean } | null>(null)
  const resizeStart = useRef<{ y: number; height: number } | null>(null)

  const hasStarted = messages.length > 0 || loading || streaming.length > 0
  const isAwaitingResponse = loading || streaming.length > 0

  function close() { onOpenChange(false) }

  // Global: CMD+K toggles open/closed from anywhere, Esc closes when open.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        onOpenChange(!open)
        return
      }
      // Esc closes in both states — it and the close button are the only
      // ways out, so they behave identically whether floating or docked.
      if (e.key === 'Escape' && open) {
        close()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange, docked])

  // Autofocus the input whenever the prompt opens.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Persist the conversation, active tab, and user-set height across
  // close/reopen — an in-progress draft, streaming response, or loading
  // spinner is deliberately NOT persisted, only committed messages, so
  // reopening never shows a half-finished response as if it completed.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ tab, messages, height, docked } satisfies StoredState))
    } catch {
      // sessionStorage unavailable (e.g. private mode) — conversation just
      // won't persist this session, not worth surfacing to the user.
    }
  }, [tab, messages, height, docked])

  useEffect(() => {
    onDockChange?.(docked)
  }, [docked, onDockChange])

  // Top scroll-shadow only shows once the messages list has actually
  // scrolled away from the top — otherwise it'd fade content that isn't
  // there yet.
  useEffect(() => {
    const el = messagesRef.current
    if (!el) { setScrolled(false); return }
    function onScroll() { setScrolled((el!.scrollTop) > 4) }
    onScroll()
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [docked, hasStarted])

  // Drag-to-resize from the top edge. The box is bottom-anchored, so
  // dragging up (negative delta) grows it — clamp between MIN/MAX_HEIGHT
  // and leave room for the fixed bottom offset.
  useEffect(() => {
    if (!resizing) return
    function onMove(e: PointerEvent) {
      if (!resizeStart.current) return
      const delta = resizeStart.current.y - e.clientY
      const maxAvailable = window.innerHeight - 24 - 24
      const next = Math.min(MAX_HEIGHT, maxAvailable, Math.max(MIN_HEIGHT, resizeStart.current.height + delta))
      setHeight(next)
    }
    function onUp() {
      setResizing(false)
      resizeStart.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resizing])

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    resizeStart.current = { y: e.clientY, height }
    setResizing(true)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, loading])

  // On reopen, jump straight to the latest message — smooth-scrolling from
  // the top would animate past the whole history every time.
  useEffect(() => {
    if (!open || tab !== 'Chat') return
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, tab])

  function clearTimers() {
    if (streamTimer.current) { clearInterval(streamTimer.current); streamTimer.current = null }
    if (gapTimer.current) { clearTimeout(gapTimer.current); gapTimer.current = null }
  }

  function cancel() {
    clearTimers()
    if (abortRef.current) abortRef.current.cancelled = true
    setLoading(false)
    setStreaming('')
  }

  useEffect(() => clearTimers, [])

  /**
   * Types one bubble out character by character, commits it, then pauses a
   * beat before the next — so a long answer lands as a short back-and-forth
   * rather than one block appearing at once.
   */
  function playMessages(parts: string[], token: { cancelled: boolean }) {
    let index = 0

    const playNext = () => {
      if (token.cancelled || index >= parts.length) {
        setStreaming('')
        return
      }
      const part = parts[index]
      let i = 0

      streamTimer.current = setInterval(() => {
        if (token.cancelled) { clearTimers(); return }

        if (i < part.length) {
          setStreaming(part.slice(0, i + 1))
          i++
          return
        }

        clearTimers()
        setStreaming('')
        setMessages(prev => [...prev, { role: 'model', text: part }])
        index++

        if (index < parts.length) {
          // Brief pause between bubbles reads as thinking, not lag.
          gapTimer.current = setTimeout(playNext, MESSAGE_GAP_MS)
        }
      }, STREAM_MS)
    }

    playNext()
  }

  async function send(q: string) {
    const trimmed = q.trim()
    if (!trimmed || isAwaitingResponse) return

    const history: ChatMessage[] = messages.map(({ role, text }) => ({ role, text }))
    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    setQuery('')
    setLoading(true)

    const token = { cancelled: false }
    abortRef.current = token

    try {
      const response = await askEric(trimmed, history, pageContext)
      if (token.cancelled) return
      setLoading(false)
      playMessages(splitIntoMessages(response, MESSAGE_SOFT_LIMIT), token)
    } catch (err) {
      if (token.cancelled) return
      console.error('[PromptComponent] chat request failed:', err)
      setLoading(false)
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }])
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuery(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  if (!open) return null

  const sendIcon = isAwaitingResponse ? cancelPrompt : (query.trim() ? sendActive : sendInactive)

  // The panel always opens fully expanded — it's summoned deliberately via
  // CMD+K, so there's no collapsed "tap to start" affordance to earn.

  return (
    <div
      className={[
        'prompt',
        docked ? 'prompt--docked' : 'prompt--expanded',
        resizing ? 'prompt--resizing' : '',
        className,
      ].filter(Boolean).join(' ')}
      ref={dialogRef}
      style={!docked ? { height } : undefined}
    >
      {!docked && (
        <div className="prompt__resize-handle" onPointerDown={startResize} aria-hidden />
      )}
      <div className="prompt__header">
        <div className="prompt__tabs">
          <button
            type="button"
            className={`prompt__tab${tab === 'Chat' ? ' prompt__tab--active' : ''}`}
            onClick={() => setTab('Chat')}
          >
            Chat
          </button>
          <button
            type="button"
            className={`prompt__tab${tab === 'Contact' ? ' prompt__tab--active' : ''}`}
            onClick={() => setTab('Contact')}
          >
            Contact
          </button>
        </div>
        <div className="prompt__controls">
          <button
            type="button"
            className={`prompt__ctrl${docked ? ' prompt__ctrl--active' : ''}`}
            aria-label={docked ? 'Undock' : 'Dock to side panel'}
            aria-pressed={docked}
            onClick={() => setDocked(d => !d)}
          >
            <img src={dockIcon} alt="" aria-hidden />
          </button>
          <button
            type="button"
            className="prompt__ctrl"
            aria-label="Close"
            onClick={close}
          >
            <img src={closeIcon} alt="" aria-hidden />
          </button>
        </div>
      </div>

      {tab === 'Contact' ? (
        <div className="prompt__contact"><ContactForm /></div>
      ) : (
        <>
          <div className={`prompt__messages-wrap${scrolled ? ' prompt__messages-wrap--scrolled' : ''}`}>
            <div className="prompt__messages" ref={messagesRef}>
              {/* Zero state — a greeting from Eric before anything is asked. */}
              {messages.length === 0 && !loading && !streaming && (
                <Message state="System" text={ZERO_STATE_MESSAGE} />
              )}
              {messages.map((m, i) => {
                const isSystem = m.role === 'model'
                // Only the last bubble in a consecutive system run shows the
                // avatar, so a multi-message reply reads as one turn.
                const nextIsSystem = messages[i + 1]?.role === 'model'
                const moreComing = nextIsSystem || (i === messages.length - 1 && (loading || streaming.length > 0))
                return (
                  <Message
                    key={i}
                    state={isSystem ? 'System' : 'User'}
                    hideAvatar={isSystem && moreComing}
                  >
                    {isSystem ? <MessageText text={m.text} /> : m.text}
                  </Message>
                )
              })}
              {loading && <Message state="Loading" />}
              {streaming && (
                <Message state="System">
                  <MessageText text={streaming} />
                </Message>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <div className="prompt__input-row">
            <div className="prompt__input-fill">
              <textarea
                ref={inputRef}
                className="prompt__input"
                placeholder="Ask Eric..."
                rows={1}
                value={query}
                onChange={handleInput}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(query)
                  }
                }}
                disabled={isAwaitingResponse}
              />
              <button
                type="button"
                className="prompt__send"
                aria-label={isAwaitingResponse ? 'Cancel' : 'Send'}
                onClick={() => (isAwaitingResponse ? cancel() : send(query))}
                disabled={!isAwaitingResponse && !query.trim()}
              >
                <img src={sendIcon} alt="" aria-hidden />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
