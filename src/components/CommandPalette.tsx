import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useChat } from '../hooks/useChat'
import { extractUrls } from '../lib/askEric'
import type { WorkCard } from '../hooks/useWorkIndex'
import { AVATAR_SRC } from './Message'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cards: WorkCard[]
  /** Extra page/case-study content to ground answers in, if any. */
  pageContext?: string
  /** Which mode the dialog opens into — 'chat' for direct chat triggers
   *  (the "Let's Chat" CTA, overlay menu), defaulting to 'search' for
   *  CMD+K. Only read when the dialog transitions from closed to open. */
  initialMode?: 'search' | 'chat'
  /** Fires whenever the mode changes inside the dialog (Tab/Back), so the
   *  host can remember it — CMD+K reopens into whatever mode the user
   *  last left the dialog in, rather than always resetting to search. */
  onModeChange?: (mode: 'search' | 'chat') => void
}

const CONTACT_EMAIL = 'hello@ericsin.com'

const FEATURED = [
  { label: 'Index', to: '/' },
  { label: 'Archives', to: '/archives' },
  { label: 'About', to: '/about' },
]

// Chat zero-state suggested prompts (node 3632:108334) — shown only while
// there's no history yet. Once a message is sent, they're gone for good
// (scrolling back up to the zero-state header shows the header alone, no
// cards) until Clear Chat History empties messages again.
const SUGGESTED_PROMPTS = [
  { text: 'I’d like to discuss a project with you.', tag: 'For Founders' },
  { text: 'Do you offer mentorship?', tag: 'For Designers' },
  { text: 'What do you actually do?', tag: 'For Recruiters' },
]

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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
        <div className="cmdk-chat__link-cards">
          {urls.map((url, i) => {
            try {
              const domain = new URL(url).hostname.replace('www.', '')
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="cmdk-chat__link-card">
                  <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="cmdk-chat__link-favicon" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
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

// CMD+K opens this single dialog, which owns two modes. 'search' is the
// default: cmdk's own list, filtered by the input, with a footer strip
// below it showing the keyboard hints (↑↓ to select, Enter to go, Tab to
// chat). Tab switches straight to 'chat' — same box, no separate overlay/
// panel — WITHOUT submitting whatever's in the search field; the two
// fields are intentionally separate (search's query is not carried into
// chat as a message). A Back control in chat's header returns to search,
// leaving the search field exactly as it was.
//
// Chat mode's actual engine (sending, streaming, persistence) is
// useChat — shared with nothing else now that PromptComponent's outer
// shell (docking, resize, morph animation) has been retired in favor of
// this single dialog owning the whole CMD+K experience.
export default function CommandPalette({ open, onOpenChange, cards, pageContext, initialMode = 'search', onModeChange }: Props) {
  const navigate = useNavigate()
  const [mode, setModeState] = useState<'search' | 'chat'>(initialMode)

  // Wraps setMode so every mode change (Tab, Back, a direct chat trigger's
  // initialMode) is reported upward — App.tsx remembers it as the next
  // initialMode, so CMD+K reopens wherever the user left off instead of
  // always resetting to search.
  function setMode(next: 'search' | 'chat') {
    setModeState(next)
    onModeChange?.(next)
  }

  const [search, setSearch] = useState('')
  const [chatInput, setChatInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const activeQueryRef = useRef<HTMLDivElement>(null)
  const { messages, streaming, loading, isAwaitingResponse, send, cancel, clear } = useChat(pageContext)


  // Every turn has min-height: 100% of the scroll container (see
  // .cmdk-chat__turn in v65.css) — so even a one-line exchange is at
  // least as tall as the visible window, and scrollIntoView always has
  // enough room to bring ANY turn flush with the top, at any time,
  // including after scrolling away and back. No manual height
  // measurement or spacer element needed: percentage-height sizing
  // against the flex container does this for free, and it can't drift
  // out of sync with the real content the way a JS-measured spacer could.
  const messageCount = messages.length
  useEffect(() => {
    activeQueryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [messageCount])

  // Picks up initialMode fresh whenever the dialog transitions from
  // closed to open — this is what lets a direct chat trigger (the CTA)
  // force 'chat' even if the dialog was last left on search, while CMD+K
  // passes back the same paletteMode it was last set to, so plain CMD+K
  // opens preserve wherever the user left off instead.
  const wasOpen = useRef(open)
  useEffect(() => {
    if (open && !wasOpen.current) setModeState(initialMode)
    wasOpen.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Search text and any in-flight response are cleared on close, but the
  // conversation history (useChat's own sessionStorage) and the current
  // mode both persist — closing and reopening the dialog should feel like
  // picking the same session back up, not starting over.
  useEffect(() => {
    if (open) return
    const t = setTimeout(() => {
      setSearch('')
      if (isAwaitingResponse) cancel()
    }, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Fires every time the dialog LANDS on chat mode — Tab from search, the
  // "Let's Chat" CTA, or reopening straight back into a chat session
  // (initialMode picked up above). The conversation itself already
  // persists across closes (useChat's own sessionStorage), but the
  // SCROLL POSITION doesn't unless it's explicitly restored here — so
  // without this, reopening (or tabbing back in) could land wherever the
  // user had scrolled to reading older history, instead of picking back
  // up at the most recent exchange like Raycast does. Instant, not
  // smooth — this is a view becoming visible, not a live response
  // arriving, so it shouldn't animate.
  useEffect(() => {
    if (!open || mode !== 'chat') return
    // Radix's own Dialog focus-trap autofocuses the first focusable
    // element (the back button, since it precedes the textarea in the
    // DOM) via its own effect on mount — that runs after this one and
    // wins the race on a straight reopen into chat mode, so this has to
    // defer a frame to focus the textarea AFTER Radix settles instead of
    // racing it.
    const raf = requestAnimationFrame(() => {
      chatInputRef.current?.focus()
      activeQueryRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
    return () => cancelAnimationFrame(raf)
    // `open` is included so reopening straight back into a persisted chat
    // session also refocuses — `mode` alone doesn't change in that case
    // (it was already 'chat' before close), so this effect wouldn't
    // otherwise re-fire.
  }, [mode, open])
  useEffect(() => {
    if (mode === 'search') inputRef.current?.focus()
  }, [mode])

  function close() {
    if (isAwaitingResponse) cancel()
    onOpenChange(false)
  }

  function go(to: string) {
    close()
    navigate(to)
  }

  function sendSuggestedPrompt(text: string) {
    send(text)
  }

  function openContact() {
    close()
    window.location.href = `mailto:${CONTACT_EMAIL}`
  }

  const trimmedSearch = search.trim()
  const lastUserIndex = messages.map(m => m.role).lastIndexOf('user')

  return (
    <Command.Dialog
      open={open}
      onOpenChange={o => (o ? onOpenChange(true) : close())}
      label="Site search"
      className="cmdk"
      shouldFilter={mode === 'search'}
      onKeyDown={e => {
        if (mode !== 'search') return
        // Tab just switches to chat mode — the search field's contents
        // are NOT sent as a message, chat starts on its own empty input.
        if (e.key === 'Tab') {
          e.preventDefault()
          setMode('chat')
          return
        }
        // cmdk's own Enter-to-select only reads its OWN internal search
        // state, which it stops maintaining once Command.Input is
        // controlled from outside (needed here so the field can be reset
        // on close/mode-switch) — so Enter would silently do nothing
        // without this. Read the currently aria-selected item directly
        // and click it instead.
        if (e.key === 'Enter') {
          const el = e.currentTarget.querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]')
          if (el) {
            e.preventDefault()
            el.click()
          }
        }
      }}
    >
      {mode === 'search' ? (
        <>
          <div className="cmdk__input-row">
            <Command.Input
              ref={inputRef}
              className="cmdk__input"
              placeholder="Search or ask Eric anything..."
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
            <span className="cmdk__ask-hint">
              Ask Eric <kbd className="cmdk__kbd">Tab</kbd>
            </span>
          </div>
          <Command.List className="cmdk__list">
            <Command.Empty className="cmdk__empty">No results.</Command.Empty>

            <Command.Group heading="Go to" className="cmdk__group">
              {FEATURED.map(({ label, to }) => (
                <Command.Item key={to} value={label} onSelect={() => go(to)} className="cmdk__item">
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Case studies only show once the user is actually searching —
                the zero state stays to just the top-level nav so the list
                isn't a wall of every case study on open. */}
            {trimmedSearch && (
              <Command.Group heading="Case Studies" className="cmdk__group">
                {cards.map(card => (
                  <Command.Item
                    key={card.slug}
                    value={`${card.name} ${card.type}`}
                    onSelect={() => go(`/work/${card.slug}`)}
                    className="cmdk__item"
                  >
                    <span className="cmdk__item-name">{card.name}</span>
                    <span className="cmdk__item-meta">{card.type}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Contact" className="cmdk__group">
              <Command.Item value="Contact Email" onSelect={openContact} className="cmdk__item">
                Email {CONTACT_EMAIL}
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer strip — keyboard hints only, not interactive controls
              of its own (arrow keys/Enter are already live via cmdk's own
              root keydown handling; Tab via the onKeyDown above). Layout
              matches Raycast's palette footer: navigate hint on the left,
              the primary action (Go) on the right. */}
          <div className="cmdk__footer">
            <span className="cmdk__footer-hint">
              <kbd className="cmdk__kbd">↑</kbd>
              <kbd className="cmdk__kbd">↓</kbd>
              Navigate
            </span>
            <span className="cmdk__footer-hint cmdk__footer-hint--primary">
              Go
              <kbd className="cmdk__kbd">↵</kbd>
            </span>
          </div>
        </>
      ) : (
        <div className="cmdk-chat">
          {/* Header + input combined into one row (matches Raycast: back
              arrow beside the actual field, no separate title bar) — the
              placeholder alone communicates the mode. */}
          <div className="cmdk-chat__header">
            <button
              type="button"
              className="cmdk-chat__back"
              aria-label="Back to search"
              onClick={() => {
                if (isAwaitingResponse) cancel()
                setMode('search')
              }}
            >
              ←
            </button>
            <textarea
              ref={chatInputRef}
              className="cmdk-chat__input"
              placeholder="Ask a follow-up..."
              rows={1}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  const q = chatInput
                  setChatInput('')
                  send(q)
                  return
                }
                // Backspace on an already-empty field steps back out to
                // search mode — same "delete past the start" convention
                // as address bars, not an accidental trigger while the
                // user is still editing/clearing actual text.
                if (e.key === 'Backspace' && chatInput === '') {
                  e.preventDefault()
                  if (isAwaitingResponse) cancel()
                  setMode('search')
                  return
                }
                // Tab is the same mode-switch shortcut in both directions
                // — it got you into chat from search, so it also takes
                // you back, same as Back/Backspace-on-empty above.
                if (e.key === 'Tab') {
                  e.preventDefault()
                  if (isAwaitingResponse) cancel()
                  setMode('search')
                }
              }}
              disabled={isAwaitingResponse}
            />
            <button
              type="button"
              className="cmdk-chat__send"
              aria-label={isAwaitingResponse ? 'Cancel' : 'Send'}
              onClick={() => {
                if (isAwaitingResponse) { cancel(); return }
                const q = chatInput
                setChatInput('')
                send(q)
              }}
              disabled={!isAwaitingResponse && !chatInput.trim()}
            >
              {isAwaitingResponse ? '×' : '→'}
            </button>
          </div>

          {/* Per Figma node 3632:108465 ("MessageWrapper") — reverted from
              the filled-pill query style back to a plain block: a "You"/
              "Eric" + timestamp label line, then the text below at normal
              weight (no background). The active/latest turn is still the
              only one at full opacity — every earlier turn's whole block
              (both its query AND its reply) fades to 40%, not just the
              reply text as before. The "looks like the only message"
              effect isn't from hiding history — it's scroll position:
              sending a message scrolls the latest turn to the top (see
              the effect above, keyed on activeQueryRef), so older turns
              are pushed out of view above it rather than the log resting
              at the bottom. */}
          <div className="cmdk-chat__messages-wrap">
          <div className="cmdk-chat__messages" ref={messagesRef}>
            {/* Zero-state header (node 3632:108334) — persists at the top
                of the scrollable history for the whole session (scrolling
                up always reveals it), not just before the first message.
                Its label swaps from "Conversation Starters" to a clickable
                "Clear Chat History" once there's history to clear, and the
                suggested-prompt cards themselves only show in true zero
                state (no messages yet). */}
            <div className="cmdk-chat__zero-header">
              <img src={AVATAR_SRC} alt="" className="cmdk-chat__zero-avatar" />
              <div className="cmdk-chat__zero-textstack">
                <p className="cmdk-chat__zero-title">Chat with Eric</p>
                {messages.length === 0 ? (
                  <p className="cmdk-chat__zero-label">Conversation Starters</p>
                ) : (
                  <button type="button" className="cmdk-chat__zero-label cmdk-chat__zero-label--clear" onClick={clear}>
                    Clear Chat History
                  </button>
                )}
              </div>
            </div>
            {messages.length === 0 && (
              <div className="cmdk-chat__suggested-row">
                {SUGGESTED_PROMPTS.map(({ text, tag }) => (
                  <button
                    key={tag}
                    type="button"
                    className="cmdk-chat__suggested"
                    onClick={() => sendSuggestedPrompt(text)}
                  >
                    <span className="cmdk-chat__suggested-text">{text}</span>
                    <span className="cmdk-chat__suggested-tag">{tag}</span>
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => {
              if (m.role !== 'user') return null
              // The last USER message, not the last message overall — the
              // array usually ends on that user turn's own model reply,
              // so comparing straight against messages.length - 1 would
              // never match any user row.
              const isLatest = i === lastUserIndex
              const reply = messages[i + 1]?.role === 'model' ? messages[i + 1] : null
              const answerText = isLatest ? (streaming || (loading ? null : reply?.text)) : reply?.text
              const isLoading = isLatest && loading
              return (
                <div
                  key={i}
                  className={`cmdk-chat__turn${isLatest ? ' cmdk-chat__turn--active' : ''}`}
                >
                  <div
                    ref={isLatest ? activeQueryRef : undefined}
                    className="cmdk-chat__message cmdk-chat__message--user"
                  >
                    <div className="cmdk-chat__message-meta">
                      <span className="cmdk-chat__message-name">You</span>
                      {m.time && <span className="cmdk-chat__message-time">{formatTime(m.time)}</span>}
                    </div>
                    <p className="cmdk-chat__message-text">{m.text}</p>
                  </div>
                  {(isLoading || answerText) && (
                    <div className="cmdk-chat__message">
                      <div className="cmdk-chat__message-meta">
                        <span className="cmdk-chat__message-name">Eric</span>
                        {reply?.time && <span className="cmdk-chat__message-time">{formatTime(reply.time)}</span>}
                      </div>
                      <div className="cmdk-chat__message-text">
                        {isLoading ? (
                          <span className="cmdk-chat__answer-loading">Thinking…</span>
                        ) : (
                          <MessageText text={answerText!} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          </div>

          {/* Footer strip, mirroring search mode's — Esc to close on the
              left, Enter-to-send as the primary action on the right. */}
          <div className="cmdk__footer">
            <span className="cmdk__footer-hint">
              <kbd className="cmdk__kbd">Esc</kbd>
              Close
            </span>
            <span className="cmdk__footer-hint cmdk__footer-hint--primary">
              Send
              <kbd className="cmdk__kbd">↵</kbd>
            </span>
          </div>
        </div>
      )}
    </Command.Dialog>
  )
}
