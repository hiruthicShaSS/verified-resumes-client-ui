import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import AdminRegistrationModal from './AdminRegistrationModal.tsx';
import HRRegistrationModal from './HRRegistrationModal.tsx';
import './common.css';
import './LoginPage.css';
import { SunIcon, MoonIcon } from './Icons.tsx';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showHRModal, setShowHRModal] = useState(false);

  useEffect(() => {
    // Check if user is already logged in via Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/home', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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

      {/* Modern Login Card */}
      <div className="login-card-container">
        <div className="login-card">
          {/* Logo Section */}
          <div className="login-logo-section">
            <div className="login-logo">
              <div className="logo-gradient-circle">
                <span className="logo-text">VR</span>
              </div>
            </div>
            <h1 className="login-title">Verified Resumes</h1>
            <p className="login-subtitle">Welcome back! Sign in to continue</p>
          </div>

          {/* Login Form Section */}
          <div className="login-form-section">
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
                  <span>Continue with Google</span>
                </button>
                {error && (
                  <div className="login-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-message">{error}</span>
                  </div>
                )}
                <div className="registration-links">
                  <button 
                    className="admin-register-link-btn" 
                    onClick={() => setShowAdminModal(true)}
                    type="button"
                  >
                    👑 Register Admin
                  </button>
                  <button 
                    className="hr-register-link-btn" 
                    onClick={() => setShowHRModal(true)}
                    type="button"
                  >
                    👔 Register HR
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>

      {showAdminModal && (
        <AdminRegistrationModal onClose={() => setShowAdminModal(false)} />
      )}
      {showHRModal && (
        <HRRegistrationModal onClose={() => setShowHRModal(false)} />
      )}
    </div>
  );
};

export default LoginPage;

