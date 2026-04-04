import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0ProviderWithConfig } from './lib/auth0.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { ProfileProvider } from './hooks/useProfile.js'
import { ListingsProvider } from './hooks/useListings.js'
import { MessagesProvider } from './hooks/useMessages.js'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithConfig>
        <AuthProvider>
          <ProfileProvider>
            <ListingsProvider>
              <MessagesProvider>
                <App />
              </MessagesProvider>
            </ListingsProvider>
          </ProfileProvider>
        </AuthProvider>
      </Auth0ProviderWithConfig>
    </BrowserRouter>
  </StrictMode>,
)
