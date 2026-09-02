import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CarritoProvider } from './context/CarritoContext'
import { limpiarTokensLegacy } from './services/session'
import { precargarParametros } from './services/parametros'
import Splash from './components/Splash'
import './index.css'
import App from './App.jsx'

limpiarTokensLegacy()
precargarParametros()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CarritoProvider>
        <App />
        <Splash />
      </CarritoProvider>
    </BrowserRouter>
  </StrictMode>,
)