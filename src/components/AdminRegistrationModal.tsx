import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import Toast from './Toast.tsx';
import './AdminRegistrationModal.css';

interface AdminRegistrationModalProps {
  onClose: () => void;
}

const AdminRegistrationModal: React.FC<AdminRegistrationModalProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
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

    // Check for duplicate email
    const isDuplicate = await checkDuplicateEmail(email);
    if (isDuplicate) {
      setToast({ message: 'This email is already registered.', type: 'error' });
      return;
    }

    setIsSendingCode(true);
    try {
      const code = generateVerificationCode();
      const emailLower = email.trim().toLowerCase();
      
      // Store verification code in Firestore with expiration (10 minutes)
      const verificationRef = doc(db, 'verificationCodes', emailLower);
      await setDoc(verificationRef, {
        code: code,
        email: emailLower,
        role: 'admin',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

      // Store code in state to display prominently
      // TODO: In production, integrate email service (SendGrid, AWS SES, Firebase Extensions) to send code via email
      setToast({ 
        message: `Verification code generated! Please check the code below.`, 
        type: 'info' 
      });

      // Store code temporarily to show it prominently
      (window as any).__tempVerificationCode = code;
      (window as any).__tempVerificationEmail = emailLower;

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
      
      // Check verification code
      const verificationRef = doc(db, 'verificationCodes', emailLower);
      const verificationDoc = await getDoc(verificationRef);
      
      if (!verificationDoc.exists()) {
        setToast({ message: 'Verification code expired or invalid. Please request a new one.', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      const verificationData = verificationDoc.data();
      const now = new Date();
      const expiresAt = new Date(verificationData.expiresAt);

      if (now > expiresAt) {
        setToast({ message: 'Verification code has expired. Please request a new one.', type: 'error' });
        await deleteDoc(verificationRef);
        setIsSubmitting(false);
        return;
      }

      if (verificationData.code !== verificationCode.trim()) {
        setToast({ message: 'Invalid verification code. Please try again.', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Check for duplicate email again (in case it was registered while verifying)
      const isDuplicate = await checkDuplicateEmail(email);
      if (isDuplicate) {
        setToast({ message: 'This email is already registered.', type: 'error' });
        await deleteDoc(verificationRef);
        setIsSubmitting(false);
        return;
      }

      // Register the email
      await addDoc(collection(db, 'userEmails'), {
        email: emailLower,
        role: 'admin',
        createdAt: new Date().toISOString(),
        verified: true
      });

      // Delete verification code
      await deleteDoc(verificationRef);

      setToast({ 
        message: 'Admin email registered successfully!', 
        type: 'success' 
      });
      
      // Clear form and close after 2 seconds
      setEmail('');
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
    <div className={`admin-modal-overlay theme-${theme}`} onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
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
                  <label className="form-label">Email Address</label>
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
                    disabled={isSendingCode || !email.trim()}
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

              {/* Display Verification Code Prominently */}
              {(window as any).__tempVerificationCode && (window as any).__tempVerificationEmail === email.trim().toLowerCase() && (
                <div className="verification-code-display">
                  <p className="code-label">Your Verification Code:</p>
                  <div className="code-box">
                    {(window as any).__tempVerificationCode}
                  </div>
                  <p className="code-note">⚠️ Note: Email service not configured. Code shown here for testing.</p>
                </div>
              )}

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
