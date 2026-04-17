import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { TemaProvider } from './lib/tema.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TemaProvider>
  </StrictMode>
)
