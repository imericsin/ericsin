import { useState } from 'react'
import PromptComponent from '../demos/PromptComponent.archived'

// Dev-only sandbox route for the retired chat panel (see
// src/demos/PromptComponent.archived.tsx) — kept viewable for reference/a
// future visual component repo, not part of the live CMD+K experience
// anymore (that's CommandPalette, mounted globally in App.tsx).
export default function PromptDemo() {
  const [open, setOpen] = useState(true)

  return (
    <div className="prompt-archived-demo" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f2f2f2' }}>
      <p style={{ font: '13px/1.4 sans-serif', color: '#666' }}>Archived panel — click below or use the dock icon to pin it.</p>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ font: '13px/1.4 sans-serif', padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
      >
        {open ? 'Close' : 'Open'} panel
      </button>
      <PromptComponent open={open} onOpenChange={setOpen} />
    </div>
  )
}
