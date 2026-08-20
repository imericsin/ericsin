import { useState } from 'react'

const RECIPIENT = 'hello@ericsin.com'
const SUBJECT = 'Message from Portfolio Site (ericsin.com)'

// Composes a mailto: draft rather than posting anywhere — this is a static
// site with no backend, so the user's own mail client is the send path.
export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const canSubmit = name.trim() && email.trim() && message.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const body = `${message.trim()}\n\n—\n${name.trim()}\n${email.trim()}`
    window.location.href =
      `mailto:${RECIPIENT}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label className="contact-form__field">
        <span className="contact-form__label">Name</span>
        <input
          className="contact-form__input"
          type="text"
          placeholder="Steve Rogers"
          value={name}
          onChange={e => { setName(e.target.value); setSent(false) }}
          autoComplete="name"
        />
      </label>

      <label className="contact-form__field">
        <span className="contact-form__label">Email</span>
        <input
          className="contact-form__input"
          type="email"
          placeholder="steve@youremail.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setSent(false) }}
          autoComplete="email"
        />
      </label>

      <label className="contact-form__field contact-form__field--grow">
        <span className="contact-form__label">Your message</span>
        <textarea
          className="contact-form__input contact-form__input--area"
          placeholder="Your message here"
          value={message}
          onChange={e => { setMessage(e.target.value); setSent(false) }}
        />
      </label>

      <button type="submit" className="contact-form__submit" disabled={!canSubmit}>
        {sent ? 'Opening your mail app…' : 'Submit'}
      </button>
    </form>
  )
}
