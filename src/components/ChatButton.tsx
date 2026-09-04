import { useRef } from 'react'
import { usePrompt } from '../lib/promptContext'

export const CHAT_BUTTON_AVATAR = '/about/avatar-96.jpg'

interface Props {
  label?: string
  className?: string
}

/**
 * Pill CTA that opens the chat panel.
 *
 * Layer stack (see .chat-btn__* in v65.css), back to front:
 *  1. .chat-btn__clip — a separate, clipped layer holding only the fill
 *     circle. Its own border-radius + overflow:hidden keeps the circle's
 *     antialiased edge entirely inside the button's shape.
 *  2. .chat-btn__border — an inset:0 layer painted strictly *after* the
 *     clip layer, holding only the stroke. Because it's a distinct paint on
 *     top rather than a border coexisting with the clipped fill underneath,
 *     the stroke is always crisp — there's no shared edge pixel where fill
 *     and border antialiasing could blend into a visible seam.
 *  3. avatar + label — label carries mix-blend-mode: difference itself, so
 *     it inverts automatically wherever the fill passes underneath it; no
 *     second label copy or crossfade needed.
 *
 * The fill expands from whichever edge the cursor entered/exited on (see
 * updateOrigin) — the only thing here that still needs JS, since CSS alone
 * can't know the cursor's position. Everything else is pure CSS :hover.
 */
export default function ChatButton({ label = "Let's Chat", className }: Props) {
  const { open } = usePrompt()
  const btnRef = useRef<HTMLButtonElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  function updateOrigin(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = btnRef.current!.getBoundingClientRect()
    fillRef.current!.style.left = `${e.clientX - rect.left}px`
    fillRef.current!.style.top = `${e.clientY - rect.top}px`
  }

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={label}
      className={['chat-btn', className].filter(Boolean).join(' ')}
      onClick={() => open()}
      onMouseEnter={updateOrigin}
      onMouseLeave={updateOrigin}
    >
      <span className="chat-btn__clip" aria-hidden>
        <span ref={fillRef} className="chat-btn__fill" />
      </span>
      <span className="chat-btn__border" aria-hidden />
      <span className="chat-btn__avatar" aria-hidden>
        <img src={CHAT_BUTTON_AVATAR} alt="" />
      </span>
      <span className="chat-btn__label" aria-hidden>{label}</span>
    </button>
  )
}
