import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { ClerkProvider } from '@clerk/clerk-react'

// Import your Publishable Key
// client/src/main.jsx
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key') // <--- This stops your app from rendering
}


createRoot(document.getElementById('root')).render(
    <BrowserRouter>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
       <Provider store={store}>
                <App />
            </Provider>
      </ClerkProvider>
            
    </BrowserRouter>,
)