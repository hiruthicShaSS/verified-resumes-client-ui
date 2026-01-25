import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config.ts';
import './common.css';
import './LoginPage.css';
import { SunIcon, MoonIcon } from './Icons.tsx';

type ThemeType = 'dark' | 'light';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : 'theme-light';
    
    // Check if user is already logged in via Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/home', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [theme, navigate]);

  const toggleTheme = (): void => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save user data to localStorage
      const userInfo = {
        name: user.displayName || '',
        email: user.email || '',
        picture: user.photoURL || '',
        uid: user.uid,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('userData', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Navigate to landing page after successful login
      navigate('/home', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser. Please allow popups and try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-page-wrapper theme-${theme}`}>
      {/* Theme Toggle */}
      <button 
        className="login-theme-toggle" 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </button>

      {/* ID Badge Container */}
      <div className="id-badge-container">
        <div className="id-badge">
          {/* Badge Header */}
          <div className="badge-header">
            <div className="badge-logo">
              <div className="logo-circle">
                <span className="logo-text">VR</span>
              </div>
            </div>
            <div className="badge-title">
              <h1 className="company-name">Verified Resumes</h1>
              <p className="company-tagline">Employee Access Portal</p>
            </div>
          </div>

          {/* Badge Divider */}
          <div className="badge-divider"></div>

          {/* Badge Content */}
          <div className="badge-content">
            <div className="badge-icon-section">
              <div className="badge-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                </svg>
              </div>
            </div>

            <div className="badge-info-section">
              <h2 className="badge-welcome">Welcome</h2>
              <p className="badge-instruction">Sign in with your Google account to access your verified resume portal</p>
            </div>
          </div>

          {/* Badge Footer - Login Button */}
          <div className="badge-footer">
            {isLoading ? (
              <div className="login-loading">
                <div className="spinner"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <button 
                  className="google-sign-in-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
                {error && (
                  <div className="login-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-message">{error}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Badge Bottom Border */}
          <div className="badge-bottom-border"></div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="login-background-pattern"></div>
    </div>
  );
};

export default LoginPage;

