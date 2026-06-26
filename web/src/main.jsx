import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './i18n'
import App from './App.jsx'

// Apply the persisted color theme before first paint (avoids a light flash).
try {
	const theme = localStorage.getItem('theme');
	if (theme) document.documentElement.setAttribute('data-theme', theme);
} catch { /* ignore */ }

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
