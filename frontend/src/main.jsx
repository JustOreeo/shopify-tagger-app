import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from '@shopify/app-bridge-react'
import './index.css'
import App from './App.jsx'

// Get App Bridge configuration from URL parameters
// Shopify provides 'host' and 'shop' when loading embedded apps
const urlParams = new URLSearchParams(window.location.search)
const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || urlParams.get('apiKey') || ''
const host = urlParams.get('host') || ''

const config = {
  apiKey,
  host,
  forceRedirect: true,
}

// Only wrap with AppProvider if we have the required config (embedded app context)
// Otherwise, render app without App Bridge (for development/testing)
const hasAppBridgeConfig = config.apiKey && config.host

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasAppBridgeConfig ? (
      <AppProvider config={config}>
        <App />
      </AppProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
