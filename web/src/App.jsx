import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './features/auth';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';
import { TranslationProvider } from './context/TranslationContext';
import { GdprConsentProvider } from './context/GdprConsentContext';
import AppRoutes from './routes';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Composes all global context providers and renders the application route tree.
export default function App() {
	return (
		<HelmetProvider>
			<BrowserRouter>
				<AuthProvider>
					<UserProvider>
						<LanguageProvider>
							<TranslationProvider>
								<GdprConsentProvider>
									<ErrorBoundary>
										<AppRoutes />
									</ErrorBoundary>
								</GdprConsentProvider>
							</TranslationProvider>
						</LanguageProvider>
					</UserProvider>
				</AuthProvider>
			</BrowserRouter>
		</HelmetProvider>
	);
}
