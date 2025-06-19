import { Link, useRouteError } from 'react-router-dom';
import Button from '../components/UI/Button';
import '../styles/Pages.css';

const ErrorPage = () => {
  const error = useRouteError();
  
  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="error-title">
          {error?.status === 404 ? 'Page Not Found' : 'Unexpected Error'}
        </h1>
        
        <p className="error-message">
          {error?.status === 404 
            ? "The page you're looking for doesn't exist or has been moved."
            : "Sorry, something went wrong. We're working on fixing it."}
        </p>
        
        {error?.message && (
          <p className="error-detail">
            {error.message}
          </p>
        )}
        
        <div className="error-action">
          <Link to="/">
            <Button fullWidth>
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Technical details for development only */}
      {import.meta.env.MODE === 'development' && error?.stack && (
        <div className="error-debug">
          <h2 className="debug-title">Technical Details</h2>
          <pre className="debug-stack">
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ErrorPage;

