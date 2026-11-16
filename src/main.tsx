import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// static shell so the app shows instantly before JS mounts
document.getElementById('boot')?.remove()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
