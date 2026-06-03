import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { env } from './utils/env'
import { AppErrorBoundary } from './components/system/AppErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter basename={env.routerBasename}>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
)
