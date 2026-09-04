import type { ButtonHTMLAttributes, ReactNode } from 'react'
import arrowIcon from '../assets/icons/arrow-diagonal.svg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  /** Trailing diagonal-arrow icon. Static — no hover motion, so it reads
   *  the same on touch devices as it does on desktop. */
  icon?: boolean
  className?: string
}

/**
 * The site's general-purpose dark CTA — distinct from ChatButton, which is
 * specifically the chat-launcher pill with the avatar and difference-blend
 * hover. Use this anywhere else a primary action button is needed.
 */
export default function Button({ children, icon = true, className, ...rest }: Props) {
  return (
    <button type="button" className={['btn', className].filter(Boolean).join(' ')} {...rest}>
      <span className="btn__label">{children}</span>
      {icon && (
        <span className="btn__icon" aria-hidden>
          <img src={arrowIcon} alt="" />
        </span>
      )}
    </button>
  )
}
