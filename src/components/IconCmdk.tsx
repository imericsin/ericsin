import cmdkGlyph from '../assets/icons/cmdk.svg'

// ⌘K affordance badge. The exported glyph is baked white, so this is meant
// for dark surfaces (the CTA button, the overlay menu).
export default function IconCmdk({ className }: { className?: string }) {
  return (
    <span className={['icon-cmdk', className].filter(Boolean).join(' ')} aria-hidden>
      <img src={cmdkGlyph} alt="" />
    </span>
  )
}
