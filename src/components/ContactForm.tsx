import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  /** Honeypot — hidden from real users; bots that fill it get silently dropped. */
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const canSubmit = !!(name.trim() && email.trim() && message.trim()) && status !== 'sending'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setStatus('sending')
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, company }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus('error')
        setError(data.error ?? 'Could not send that — try again shortly.')
        return
      }

      setStatus('sent')
      setName(''); setEmail(''); setMessage('')
    } catch {
      setStatus('error')
      setError('Network issue — check your connection and try again.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-form__done">
        <p className="contact-form__done-title">Thanks — that's sent.</p>
        <p className="contact-form__done-sub">I'll get back to you at the address you gave.</p>
        <button type="button" className="contact-form__again" onClick={() => setStatus('idle')}>
          Send another
        </button>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <label className="contact-form__field">
        <span className="contact-form__label">Name</span>
        <input
          className="contact-form__input"
          type="text"
          placeholder="Steve Rogers"
          value={name}
          onChange={e => setName(e.target.value)}
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
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>

      <label className="contact-form__field contact-form__field--grow">
        <span className="contact-form__label">Your message</span>
        <textarea
          className="contact-form__input contact-form__input--area"
          placeholder="Your message here"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </label>

      {/* Off-screen rather than display:none — some bots skip hidden inputs. */}
      <div className="contact-form__hp" aria-hidden>
        <label>
          Company
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="contact-form__error" role="alert">{error}</p>}

      <button type="submit" className="contact-form__submit" disabled={!canSubmit}>
        {status === 'sending' ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}
