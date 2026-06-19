import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './i18n'
import App from './App.jsx'
import { applyColorMode, getColorMode } from './utils/colorMode'

// Apply the saved color mode before first paint to avoid a flash of light theme.
applyColorMode(getColorMode())

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
