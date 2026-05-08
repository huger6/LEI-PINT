import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './features/auth';
import { UserProvider } from './context/UserContext';
import AppRoutes from './routes';

export default function App() {
	return (
		<HelmetProvider>
			<BrowserRouter>
				<AuthProvider>
					<UserProvider>
						<AppRoutes />
					</UserProvider>
				</AuthProvider>
			</BrowserRouter>
		</HelmetProvider>
	);
}
