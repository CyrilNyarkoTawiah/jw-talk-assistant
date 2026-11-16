import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/base.css'

// static shell so the app shows instantly before JS mounts
document.getElementById('boot')?.remove()

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) { window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {})) }

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
