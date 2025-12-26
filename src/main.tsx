import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import './index.css'
import App from './App.tsx'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ConvexProvider client={convex}>
        <ThemeProvider defaultTheme="dark" storageKey="aisac-theme">
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </ConvexProvider>
    </BrowserRouter>
  </StrictMode>,
)
