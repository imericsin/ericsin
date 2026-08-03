import { useEffect, useState } from 'react'

const TIME_ZONE = 'America/Los_Angeles'
export const LOCATION = 'Anaheim, CA, USA'

/**
 * Eric's local time, formatted as "9:45 AM PST — AUG 3, 2026".
 *
 * Always renders in America/Los_Angeles regardless of the visitor's own
 * timezone, so someone abroad can tell whether he's within working hours.
 * The zone abbreviation comes from the formatter rather than a hardcoded
 * string so it follows daylight saving (PST vs PDT) on its own.
 */
function format(now: Date): string {
  const time = now.toLocaleTimeString('en-US', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })

  const date = now
    .toLocaleDateString('en-US', {
      timeZone: TIME_ZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase()

  return `${time} — ${date}`
}

export function useLocalTime() {
  const [stamp, setStamp] = useState(() => format(new Date()))

  useEffect(() => {
    function update() {
      setStamp(format(new Date()))
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  return { stamp, location: LOCATION }
}
