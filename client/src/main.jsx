import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

const PWA_VERSION = '2026-07-10-2'

async function resetPwaIfNeeded() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  const versionKey = 'legal-crm-pwa-version'
  const currentVersion = window.localStorage.getItem(versionKey)

  if (currentVersion === PWA_VERSION) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const cacheKeys = await window.caches.keys()
    await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)))
  }

  window.localStorage.setItem(versionKey, PWA_VERSION)
}

resetPwaIfNeeded().finally(() => {
  registerSW({ immediate: true })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
