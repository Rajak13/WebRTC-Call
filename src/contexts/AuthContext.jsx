import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        // Set the user if we have a session
        if (sessionData?.session?.user) {
          setUser(sessionData.session.user);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to restore session');
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Initial fetch
    fetchSession();

    // Clean up subscription
    return () => {
      if (authListener && authListener.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, []);

  // Sign in anonymously (only requires email)
  const signIn = async (email, username = null) => {
    try {
      setLoading(true);
      setError(null);

      // In this simple version, we're just storing the email as display name
      // For a real app, you'd implement proper auth
      localStorage.setItem('userEmail', email);
      localStorage.setItem('username', username || email.split('@')[0]);
      
      return true;
    } catch (err) {
      console.error('Error signing in:', err);
      setError('Failed to sign in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('userEmail');
      localStorage.removeItem('username');
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
