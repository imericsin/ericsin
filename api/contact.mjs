const RECIPIENT = 'hello@ericsin.com'
const SUBJECT = 'Message from Portfolio Site (ericsin.com)'

/** Simple in-memory rate limit. Serverless instances are short-lived, so this
 *  only catches bursts from one warm instance — real protection is the
 *  honeypot plus Resend's own abuse handling. */
const hits = new Map()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 3

function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, message, company } = req.body ?? {}

  // Honeypot — a real user never sees or fills this field. Return 200 so a
  // bot can't distinguish rejection from success.
  if (company) return res.status(200).json({ ok: true })

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'That email address looks invalid.' })
  }
  if (message.length > 5000 || name.length > 200) {
    return res.status(400).json({ error: 'That message is too long.' })
  }

  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages — try again in a minute.' })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL
  if (!apiKey || !from) {
    console.error('[contact] missing RESEND_API_KEY or CONTACT_FROM_EMAIL')
    return res.status(500).json({ error: 'Contact form is not configured.' })
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [RECIPIENT],
        // So replying in the mail client goes straight back to the sender.
        reply_to: email.trim(),
        subject: SUBJECT,
        html: `
          <p><strong>${escapeHtml(name.trim())}</strong> &lt;${escapeHtml(email.trim())}&gt;</p>
          <p style="white-space:pre-wrap">${escapeHtml(message.trim())}</p>
        `,
      }),
    })

    if (!r.ok) {
      const detail = await r.text()
      console.error('[contact] resend failed:', r.status, detail)
      // TEMP diagnostic — remove once verified in production.
      if (process.env.DEBUG_ERRORS === '1') {
        return res.status(502).json({ error: 'Could not send right now — try again shortly.', debug: { status: r.status, detail: detail.slice(0, 500) } })
      }
      return res.status(502).json({ error: 'Could not send right now — try again shortly.' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[contact] unexpected error:', err)
    return res.status(500).json({ error: 'Something went wrong sending that.' })
  }
}
