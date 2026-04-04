import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0ProviderWithConfig } from './lib/auth0.js'
import { AuthProvider } from './hooks/useAuth.js'
import { ListingsProvider } from './hooks/useListings.js'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithConfig>
        <AuthProvider>
          <ListingsProvider>
            <App />
          </ListingsProvider>
        </AuthProvider>
      </Auth0ProviderWithConfig>
    </BrowserRouter>
  </StrictMode>,
)
