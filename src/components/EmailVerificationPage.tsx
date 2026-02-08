import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Background } from './Background.tsx';
import Toast from './Toast.tsx';
import './EmailVerificationPage.css';

interface LocationState {
  email?: string;
  verificationId?: string;
  expiresAt?: string;
}

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshEmailVerification } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('10:00');
  const [canResend, setCanResend] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get email from location state or user context
    const state = location.state as LocationState;
    const emailFromState = state?.email;
    const emailFromUser = user?.email;
    
    if (emailFromState) {
      setEmail(emailFromState);
    } else if (emailFromUser) {
      setEmail(emailFromUser);
    } else {
      // No email available, redirect to login
      setToast({ message: 'Email address not found. Please login again.', type: 'error' });
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    // Set expiration time (10 minutes from now or from state)
    if (state?.expiresAt) {
      setExpiresAt(new Date(state.expiresAt));
    } else {
      // Default to 10 minutes from now
      const defaultExpiry = new Date();
      defaultExpiry.setMinutes(defaultExpiry.getMinutes() + 10);
      setExpiresAt(defaultExpiry);
    }
  }, [location, user, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('00:00');
        setCanResend(true);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      if (diff < 120000) { // Less than 2 minutes
        // Show warning
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setToast({ message: 'Please enter the complete 6-digit code.', type: 'error' });
      return;
    }

    if (!email) {
      setToast({ message: 'Email address not found.', type: 'error' });
      return;
    }

    setIsVerifying(true);
    setToast(null);

    try {
      const response = await fetch('https://verified-resumes-be-production.up.railway.app/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToast({ message: 'Email verified successfully! Redirecting...', type: 'success' });
        
        // Update user data in localStorage if available
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.email === email || !userData.email) {
          userData.emailVerified = true;
          if (!userData.email) {
            userData.email = email;
          }
          localStorage.setItem('userData', JSON.stringify(userData));
        }

        // Refresh email verification status in AuthContext
        if (refreshEmailVerification) {
          await refreshEmailVerification();
        }

        // Redirect to home after 1.5 seconds
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 1500);
      } else {
        const errorMessage = data.message || data.error || 'Invalid verification code. Please try again.';
        setToast({ message: errorMessage, type: 'error' });
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setToast({ message: 'Failed to verify email. Please try again.', type: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    if (!email) {
      setToast({ message: 'Email address not found.', type: 'error' });
      return;
    }

    setIsResending(true);
    setToast(null);

    try {
      const response = await fetch('https://verified-resumes-be-production.up.railway.app/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToast({ message: 'New verification code sent! Please check your email.', type: 'success' });
        
        // Reset expiration time
        if (data.expiresAt) {
          setExpiresAt(new Date(data.expiresAt));
        } else {
          const newExpiry = new Date();
          newExpiry.setMinutes(newExpiry.getMinutes() + 10);
          setExpiresAt(newExpiry);
        }

        // Clear code inputs
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        // Disable resend for 60 seconds
        setCanResend(false);
        setTimeout(() => {
          setCanResend(true);
        }, 60000);
      } else {
        const errorMessage = data.message || data.error || 'Failed to resend code. Please try again.';
        setToast({ message: errorMessage, type: 'error' });
      }
    } catch (error) {
      console.error('Error resending code:', error);
      setToast({ message: 'Failed to resend code. Please try again.', type: 'error' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="email-verification-page min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <Background />
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <div className="verification-icon">✉️</div>
            <h1 className="verification-title">Verify Your Email</h1>
            <p className="verification-subtitle">
              We've sent a 6-digit verification code to
            </p>
            <p className="verification-email">{email}</p>
            <p className="verification-instruction">
              Please check your inbox and enter the code below.
            </p>
          </div>

          <div className="verification-content">
            {/* Code Input */}
            <div className="code-input-container">
              <label className="code-label">Verification Code</label>
              <div className="code-inputs" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`code-input ${code[index] ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            {expiresAt && (
              <div className="timer-container">
                <span className={`timer ${timeRemaining === '00:00' ? 'expired' : ''}`}>
                  {timeRemaining === '00:00' ? 'Code expired' : `Code expires in: ${timeRemaining}`}
                </span>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying || code.join('').length !== 6 || timeRemaining === '00:00'}
              className="verify-btn"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Code */}
            <div className="resend-section">
              <p className="resend-text">Didn't receive the code?</p>
              <button
                onClick={handleResendCode}
                disabled={isResending || !canResend}
                className="resend-btn"
              >
                {isResending ? 'Sending...' : canResend ? 'Resend Code' : 'Resend available in 60s'}
              </button>
            </div>
          </div>

          {/* Back to Login */}
          <div className="back-to-login">
            <button
              onClick={() => navigate('/')}
              className="back-link"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default EmailVerificationPage;
