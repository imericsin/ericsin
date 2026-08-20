// Dev-only sandbox route for the CMD+K chat prompt (Message/LLMStates/
// PromptComponent). The panel itself is mounted globally in App.tsx as a
// sibling of the app shell, so docking compresses the whole page — nav
// included — rather than overlaying it. Press CMD+K to toggle.
export default function PromptDemo() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f2f2f2' }}>
      <p style={{ font: '13px/1.4 sans-serif', color: '#666' }}>Press ⌘K to toggle, Esc or click outside to close.</p>
      <p style={{ font: '13px/1.4 sans-serif', color: '#999' }}>Use the dock icon to pin it beside the page.</p>
    </div>
  )
}
