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

// Create router with routes and wrap components with their own CallProvider
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <CallProvider>
        <HomePage />
      </CallProvider>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/call',
    element: (
      <CallProvider>
        <CallPage />
      </CallProvider>
    ),
  },
  {
    path: '/call/:roomId',
    element: (
      <CallProvider>
        <CallPage />
      </CallProvider>
    ),
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App