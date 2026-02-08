import React, { useState } from 'react';
import { Logo } from './Logo';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config.ts';
import { useNavigate } from 'react-router-dom';

interface LoginCardProps {
  onLogin?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check email verification status from backend
      let emailVerified = true; // Default for Firebase users
      
      if (user.email) {
        try {
          const response = await fetch(`http://localhost:5000/api/users/me?email=${encodeURIComponent(user.email)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              emailVerified = data.user.emailVerified === true;
            }
          }
        } catch (apiError) {
          console.error('Error checking email verification:', apiError);
          // Continue with default (verified) if API check fails
        }
      }
      
      // Save user data to localStorage
      const userInfo = {
        name: user.displayName || '',
        email: user.email || '',
        picture: user.photoURL || '',
        uid: user.uid,
        loginTime: new Date().toISOString(),
        emailVerified: emailVerified
      };
      
      localStorage.setItem('userData', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Check if email verification is required
      if (!emailVerified) {
        // Redirect to email verification page
        navigate('/verify-email', { 
          state: { email: user.email },
          replace: true 
        });
      } else {
        // Navigate to dashboard after successful login
        navigate('/home', { replace: true });
      }
      
      if (onLogin) {
        onLogin();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 dark:border-slate-700/50 w-full max-w-md mx-auto flex flex-col items-center relative z-10 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-300">
      
      {/* Glossy Reflection Effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 dark:from-white/5 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="mb-8 relative transform transition-transform hover:scale-110 duration-300">
        <Logo size="lg" showText={false} />
        <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full -z-10"></div>
      </div>

      <div className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Get Started
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Join thousands of companies hiring with confidence.
        </p>
      </div>

      {/* Button Section */}
      <div className="w-full relative z-10">
        <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 dark:shadow-blue-900/40 hover:shadow-blue-900/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="white"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="white"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                            fill="white"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="white"
                        />
                    </svg>
                    <span>Continue with Google</span>
                </>
            )}
        </button>
      </div>

      {/* Footer Section */}
      <div className="mt-8 text-center px-4 relative z-10">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          By signing up, you agree to our <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms</a> and <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
