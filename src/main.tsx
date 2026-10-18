import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'
// v6.5 reskin overrides — scoped under html.v65 (see index.html), imported
// last so it wins the cascade without editing globals.css in place. Removing
// this import (and the .v65 class) fully reverts to the old look.
import './styles/v65.css'
// v7 home (edge-to-edge) — scoped under html.v7-home, toggled by HomeV7.
import './styles/v7.css'
import './styles/v8.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
