import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import 'parse'

window.Parse.initialize(
  "GXcUZUm9QZBpvq6rJYCGH7M8KTtARq082vFiPEmB",
  "DDMq92YF5lycgf51nv3GgatHSgoQvapLpuICJJCV"
);
window.Parse.serverURL = "https://parseapi.back4app.com/"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
