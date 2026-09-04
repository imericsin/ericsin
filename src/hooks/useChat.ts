import { useEffect, useRef, useState } from 'react'
import { askEric, splitIntoMessages, type ChatMessage } from '../lib/askEric'

const STREAM_MS = 12
/** Beat between consecutive bubbles in a multi-message reply. */
const MESSAGE_GAP_MS = 420
/** Soft character budget per bubble — long answers arrive as a few texts. */
const MESSAGE_SOFT_LIMIT = 40

export const ZERO_STATE_MESSAGE = 'Hi, nice to meet you.\nHow can I help you?'
export const CHAT_STORAGE_KEY = 'prompt-chat-state'

function loadStoredMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.messages) ? parsed.messages : []
  } catch {
    return []
  }
}

/**
 * Owns the chat conversation itself — sending, streaming the reply in as a
 * few typed-out bubbles, and persisting history across opens — independent
 * of whatever shell renders it. Extracted from the old PromptComponent so
 * a different UI (CommandPalette's chat mode) can reuse the exact same
 * engine instead of re-implementing streaming/persistence.
 */
export function useChat(pageContext?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages())
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<{ cancelled: boolean } | null>(null)

  const isAwaitingResponse = loading || streaming.length > 0

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages }))
    } catch {
      // sessionStorage unavailable (e.g. private mode) — conversation just
      // won't persist this session, not worth surfacing to the user.
    }
  }, [messages])

  function clearTimers() {
    if (streamTimer.current) { clearInterval(streamTimer.current); streamTimer.current = null }
    if (gapTimer.current) { clearTimeout(gapTimer.current); gapTimer.current = null }
  }

  useEffect(() => clearTimers, [])

  function cancel() {
    clearTimers()
    if (abortRef.current) abortRef.current.cancelled = true
    setLoading(false)
    setStreaming('')
  }

  /** Resets the conversation to zero state — the "Clear Chat History"
   *  action that replaces the "Conversation Starters" label once history
   *  exists (node 3632:108334). Cancels any in-flight response first so a
   *  streaming reply can't land into a just-cleared list. */
  function clear() {
    cancel()
    setMessages([])
  }

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
        setMessages(prev => [...prev, { role: 'model', text: part, time: Date.now() }])
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
    setMessages(prev => [...prev, { role: 'user', text: trimmed, time: Date.now() }])
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
      console.error('[useChat] chat request failed:', err)
      setLoading(false)
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now.", time: Date.now() }])
    }
  }

  return { messages, streaming, loading, isAwaitingResponse, send, cancel, clear }
}
