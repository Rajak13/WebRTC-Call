import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CallProvider } from './contexts/CallContext';
import CallPage from './pages/CallPage';
import ErrorPage from './pages/ErrorPage';
import HomePage from './pages/HomePage';

// Import CSS files
import './App.css';
import './styles/Layout.css';
import './styles/Pages.css';
import './styles/UI.css';
import './styles/VideoCall.css';

// Create router with routes using Component property
const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage,
    errorElement: <ErrorPage />,
  },
  {
    path: '/call',
    Component: CallPage,
  },
  {
    path: '/call/:roomId',
    Component: CallPage,
  },
]);

function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <RouterProvider router={router} />
      </CallProvider>
    </AuthProvider>
  )
}

export default App