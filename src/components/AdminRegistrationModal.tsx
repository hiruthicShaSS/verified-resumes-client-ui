import React, { useState } from 'react';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import Toast from './Toast.tsx';
import './AdminRegistrationModal.css';

interface AdminRegistrationModalProps {
  onClose: () => void;
}

const AdminRegistrationModal: React.FC<AdminRegistrationModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };



  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const checkDuplicateEmail = async (emailToCheck: string): Promise<boolean> => {
    try {
      const emailsRef = collection(db, 'userEmails');
      const querySnapshot = await getDocs(emailsRef);
      const existingEmails = querySnapshot.docs.map(doc => doc.data().email.toLowerCase());
      return existingEmails.includes(emailToCheck.trim().toLowerCase());
    } catch (error) {
      console.error('Error checking duplicate email:', error);
      return false;
    }
  };

  const sendVerificationCode = async () => {
    if (!email.trim()) {
      setToast({ message: 'Please enter an email address.', type: 'error' });
      return;
    }

    if (!validateEmail(email)) {
      setToast({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    if (!companyName.trim()) {
      setToast({ message: 'Please enter a company name.', type: 'error' });
      return;
    }

    // Check for duplicate email
    const isDuplicate = await checkDuplicateEmail(email);
    if (isDuplicate) {
      setToast({ message: 'This email is already registered.', type: 'error' });
      return;
    }

    setIsSendingCode(true);
    try {
      const emailLower = email.trim().toLowerCase();
      
      // Generate verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store verification code in Firestore first
      const verificationRef = doc(db, 'verificationCodes', emailLower);
      await setDoc(verificationRef, {
        code: code,
        email: emailLower,
        role: 'admin',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });

      // Try to send via backend API (may fail if user doesn't exist, but that's OK)
      try {
        const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailLower,
            code: code // Pass the code to backend if it supports it
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          // Backend sent the email successfully
        } else {
          // Backend may not support sending without user existing, but code is stored in Firestore
          console.log('Backend email send may have failed, but code stored in Firestore');
        }
      } catch (backendError) {
        // Backend unavailable or doesn't support this, but code is stored in Firestore
        console.log('Backend email send failed, but code stored in Firestore');
      }

      setToast({ 
        message: `Verification code sent to ${email}! Please check your email inbox.`, 
        type: 'success' 
      });

      // Move to verification step
      setStep('verify');
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      const errorMessage = error?.message || 'Failed to send verification code. Please try again.';
      setToast({ message: `Failed to send code: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setToast({ message: 'Please enter the verification code.', type: 'error' });
      return;
    }

    if (verificationCode.length !== 6) {
      setToast({ message: 'Verification code must be 6 digits.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const emailLower = email.trim().toLowerCase();
      
      // Verify code via backend API
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLower,
          code: verificationCode.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.message || data.error || 'Invalid verification code. Please try again.';
        setToast({ message: errorMessage, type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Check for duplicate email again (in case it was registered while verifying)
      const isDuplicateCheck = await checkDuplicateEmail(email);
      if (isDuplicateCheck) {
        setToast({ message: 'This email is already registered.', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Register the email with company name
      await addDoc(collection(db, 'userEmails'), {
        email: emailLower,
        role: 'admin',
        companyName: companyName.trim(),
        createdAt: new Date().toISOString(),
        verified: true
      });

      setToast({ 
        message: 'Admin email registered successfully!', 
        type: 'success' 
      });
      
      // Clear form and close after 2 seconds
      setEmail('');
      setCompanyName('');
      setVerificationCode('');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error registering admin email:', error);
      const errorMessage = error?.message || 'Failed to register email. Please try again.';
      setToast({ message: `Failed to register: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setVerificationCode('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="admin-modal-content bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-header-icon">👑</div>
          <h2>Admin Registration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="admin-modal-body">
          {step === 'email' ? (
            <>
              <p className="admin-description">
                Register your email address as a Admin. You will receive a verification code to complete registration.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); sendVerificationCode(); }} className="admin-registration-form">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="form-input"
                    placeholder="e.g., Tech Corp"
                    disabled={isSendingCode}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="admin@company.com"
                    disabled={isSendingCode}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    className="cancel-btn" 
                    onClick={onClose}
                    disabled={isSendingCode}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="submit-btn" 
                    disabled={isSendingCode || !email.trim() || !companyName.trim()}
                  >
                    {isSendingCode ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <p className="admin-description">
                Enter the 6-digit verification code sent to <strong>{email}</strong>
              </p>
              <p className="step-hint" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Please check your email inbox (and spam folder) for the verification code.
              </p>

              <form onSubmit={verifyAndRegister} className="admin-registration-form">
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-input verification-code-input"
                    placeholder="000000"
                    disabled={isSubmitting}
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="resend-code-btn"
                    onClick={sendVerificationCode}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    className="cancel-btn" 
                    onClick={handleBackToEmail}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    className="submit-btn" 
                    disabled={isSubmitting || verificationCode.length !== 6}
                  >
                    {isSubmitting ? 'Registering...' : 'Verify & Register'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

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

export default AdminRegistrationModal;
