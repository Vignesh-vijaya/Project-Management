// client/src/main.jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { ClerkProvider } from '@clerk/clerk-react'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// --- SAFETY CHECK ---
// If the key is missing, render a visible error message instead of crashing
if (!PUBLISHABLE_KEY) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: system-ui, sans-serif; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9fafb; padding: 20px; text-align: center;">
        <h1 style="color: #ef4444; margin-bottom: 1rem; font-size: 2rem;">Missing Clerk Key</h1>
        <p style="color: #374151; font-size: 1.1rem; max-width: 500px; margin-bottom: 2rem;">
          The application cannot start because the Clerk Publishable Key is missing.
        </p>
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <p style="margin-bottom: 10px; font-weight: 600;">1. Create a file named <code style="background: #eee; padding: 2px 5px; border-radius: 4px;">.env</code> in your client folder</p>
          <p style="margin-bottom: 10px; font-weight: 600;">2. Add this line to it:</p>
          <code style="display: block; background: #1f2937; color: #a5f3fc; padding: 15px; border-radius: 6px; font-family: monospace; overflow-x: auto;">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </code>
          <p style="margin-top: 15px; font-size: 0.9rem; color: #6b7280;">(Replace pk_test_... with your actual key from Clerk Dashboard)</p>
          <p style="margin-top: 15px; font-weight: 600; color: #2563eb;">3. Restart your terminal (Ctrl+C then npm run dev)</p>
        </div>
      </div>
    `;
  }
  // Stop execution here safely
  throw new Error("Missing Publishable Key");
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