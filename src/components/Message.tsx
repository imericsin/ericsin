import type { ReactNode } from 'react'
import LLMStates from './LLMStates'

export type MessageState = 'User' | 'System' | 'Loading'

interface Props {
  state: MessageState
  text?: string
  /** Rich content for the bubble, overriding `text` (e.g. link cards). */
  children?: ReactNode
  /** Hides the avatar so stacked system bubbles only show one. */
  hideAvatar?: boolean
  loadingLabel?: string
  className?: string
}

export const AVATAR_SRC = '/about/avatar.jpg'

// Chat bubbles — user right-aligned in blue, system left-aligned in a light
// fill beside a small avatar. Presentational only; the typewriter reveal is
// driven by the parent feeding in progressively longer `text`.
export default function Message({ state, text, children, hideAvatar, loadingLabel, className }: Props) {
  if (state === 'Loading') {
    return (
      <div className={['message', 'message--loading', className].filter(Boolean).join(' ')}>
        <LLMStates label={loadingLabel} />
      </div>
    )
  }

  const isSystem = state === 'System'

  return (
    <div className={['message', isSystem ? 'message--system' : 'message--user', className].filter(Boolean).join(' ')}>
      {isSystem && (
        <div className={`message__avatar${hideAvatar ? ' message__avatar--hidden' : ''}`} aria-hidden>
          <img src={AVATAR_SRC} alt="" />
        </div>
      )}
      <div className="message__bubble">{children ?? text}</div>
    </div>
  )
}
