import { AVATAR_SRC } from './Message'

interface Props {
  label?: string
  className?: string
}

// Split out from Message so future "steps" (searching, reading context,
// drafting...) can swap the label/animation independently of the message list.
export default function LLMStates({ label = 'Let me think about that...', className }: Props) {
  return (
    <div className={['llm-states', className].filter(Boolean).join(' ')}>
      <div className="llm-states__avatar" aria-hidden>
        <img src={AVATAR_SRC} alt="" />
      </div>
      <span className="llm-states__label">{label}</span>
    </div>
  )
}
