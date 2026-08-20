import { createContext, useContext } from 'react'

interface PromptControls {
  open: () => void
  toggle: () => void
}

// Lets anything on the page (the CTA, the overlay menu) open the chat without
// prop-drilling through every layer between it and App.
export const PromptContext = createContext<PromptControls>({
  open: () => {},
  toggle: () => {},
})

export const usePrompt = () => useContext(PromptContext)
