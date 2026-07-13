import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* import.meta.env.BASE_URL mirrors vite.config.ts's `base` (e.g.
        "/end2end/" on GitHub Pages, "/" locally) so in-app links match
        wherever the build is actually served from. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
