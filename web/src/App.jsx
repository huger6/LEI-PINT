import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './features/auth';
import { UserProvider } from './context/UserContext';
import AppRoutes from './routes';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

export default function App() {
	return (
		<HelmetProvider>
			<BrowserRouter>
				<AuthProvider>
					<UserProvider>
						<ErrorBoundary>
							<AppRoutes />
						</ErrorBoundary>
					</UserProvider>
				</AuthProvider>
			</BrowserRouter>
		</HelmetProvider>
	);
}
