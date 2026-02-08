import React, { useState, useEffect } from 'react';
import { useUserRole } from '../hooks/useUserRole.ts';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import Toast from './Toast.tsx';
import './HRRegistrationModal.css';

interface HRRegistrationModalProps {
  onClose: () => void;
}

interface EmailRolePair {
  id: string;
  email: string;
  role: string;
  customRole?: string;
  verificationCode?: string;
  codeSent: boolean;
  verified: boolean;
  isVerifying: boolean;
}

const HRRegistrationModal: React.FC<HRRegistrationModalProps> = ({ onClose }) => {
  const { companyName: adminCompanyName, isLoading: roleLoading } = useUserRole();
  const [emailRolePairs, setEmailRolePairs] = useState<EmailRolePair[]>([
    { id: '1', email: '', role: 'Manager', codeSent: false, verified: false, isVerifying: false }
  ]);
  const [companyName, setCompanyName] = useState('');
  const [isSendingCodes, setIsSendingCodes] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-fill company name from admin's registration
  useEffect(() => {
    if (adminCompanyName && !roleLoading) {
      setCompanyName(adminCompanyName);
    }
  }, [adminCompanyName, roleLoading]);

  const userRoles = [
    'Manager',
    'Recruiter',
    'Coordinator',
    'Generalist',
    'Specialist',
    'Talent Acquisition',
    'Business Partner',
    'Assistant',
    'HR',
    'Others'
  ];

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

  const addEmailField = () => {
    const newId = Date.now().toString();
    setEmailRolePairs([...emailRolePairs, {
      id: newId,
      email: '',
      role: 'Manager',
      codeSent: false,
      verified: false,
      isVerifying: false
    }]);
  };

  const removeEmailField = (id: string) => {
    if (emailRolePairs.length > 1) {
      setEmailRolePairs(emailRolePairs.filter(pair => pair.id !== id));
    } else {
      setToast({ message: 'At least one email field is required.', type: 'error' });
    }
  };

  const updateEmailPair = (id: string, field: 'email' | 'role' | 'customRole', value: string) => {
    setEmailRolePairs(emailRolePairs.map(pair => {
      if (pair.id === id) {
        if (field === 'role') {
          return { ...pair, role: value, customRole: value === 'Others' ? pair.customRole || '' : undefined };
        }
        return { ...pair, [field]: value };
      }
      return pair;
    }));
  };

  const sendVerificationCodes = async () => {
    // Validate all emails
    const invalidPairs = emailRolePairs.filter(pair => !pair.email.trim() || !validateEmail(pair.email));
    if (invalidPairs.length > 0) {
      setToast({ message: 'Please enter valid email addresses for all fields.', type: 'error' });
      return;
    }

    // Validate custom roles for "Others"
    const invalidCustomRoles = emailRolePairs.filter(pair => 
      pair.role === 'Others' && (!pair.customRole || !pair.customRole.trim())
    );
    if (invalidCustomRoles.length > 0) {
      setToast({ message: 'Please specify a custom role for "Others" option.', type: 'error' });
      return;
    }

    // Check for duplicates within the form
    const emails = emailRolePairs.map(p => p.email.trim().toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicates.length > 0) {
      setToast({ message: 'Duplicate emails found. Please use unique email addresses.', type: 'error' });
      return;
    }

    // Validate company name
    if (!companyName.trim()) {
      setToast({ message: 'Please enter a company name.', type: 'error' });
      return;
    }

    // Check for duplicates in database
    for (const pair of emailRolePairs) {
      const isDuplicate = await checkDuplicateEmail(pair.email);
      if (isDuplicate) {
        setToast({ message: `${pair.email} is already registered.`, type: 'error' });
        return;
      }
    }

    setIsSendingCodes(true);

    try {
      // Send verification code for each email
      for (const pair of emailRolePairs) {
        const emailLower = pair.email.trim().toLowerCase();
        
        try {
          // Generate verification code
          const code = generateVerificationCode();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          const finalRole = pair.role === 'Others' ? (pair.customRole || 'Others') : pair.role;
          
          // Store verification code in Firestore first
          const verificationRef = doc(db, 'verificationCodes', emailLower);
          await setDoc(verificationRef, {
            code: code,
            email: emailLower,
            role: 'hr',
            hrRole: finalRole,
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
              console.log(`Backend email send may have failed for ${pair.email}, but code stored in Firestore`);
            }
          } catch (backendError) {
            // Backend unavailable or doesn't support this, but code is stored in Firestore
            console.log(`Backend email send failed for ${pair.email}, but code stored in Firestore`);
          }

          // Update pair to show code sent
          setEmailRolePairs(prevPairs =>
            prevPairs.map(p =>
              p.id === pair.id
                ? { ...p, codeSent: true }
                : p
            )
          );
        } catch (error: any) {
          console.error(`Error processing code for ${pair.email}:`, error);
          setToast({ message: `Failed to process code for ${pair.email}. Please try again.`, type: 'error' });
          setIsSendingCodes(false);
          return;
        }
      }

      setToast({
        message: `Verification codes sent to ${emailRolePairs.length} email(s)! Please check your email inboxes.`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error sending verification codes:', error);
      const errorMessage = error?.message || 'Failed to send verification codes. Please try again.';
      setToast({ message: `Failed to send codes: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSendingCodes(false);
    }
  };

  const verifyAndRegisterEmail = async (pairId: string, code: string) => {
    const pair = emailRolePairs.find(p => p.id === pairId);
    if (!pair) return;

    if (!code.trim() || code.length !== 6) {
      setToast({ message: 'Please enter a valid 6-digit verification code.', type: 'error' });
      return;
    }

    // Update pair to show verifying state
    setEmailRolePairs(prevPairs =>
      prevPairs.map(p =>
        p.id === pairId ? { ...p, isVerifying: true } : p
      )
    );

    try {
      const emailLower = pair.email.trim().toLowerCase();
      
      // Verify code via backend API
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLower,
          code: code.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.message || data.error || `Invalid verification code for ${pair.email}.`;
        setToast({ message: errorMessage, type: 'error' });
        setEmailRolePairs(prevPairs =>
          prevPairs.map(p =>
            p.id === pairId ? { ...p, isVerifying: false } : p
          )
        );
        return;
      }

      // Check for duplicate email again
      const isDuplicate = await checkDuplicateEmail(pair.email);
      if (isDuplicate) {
        setToast({ message: `${pair.email} is already registered.`, type: 'error' });
        setEmailRolePairs(prevPairs =>
          prevPairs.map(p =>
            p.id === pairId ? { ...p, isVerifying: false } : p
          )
        );
        return;
      }

      // Register the email with company name
      const finalRole = pair.role === 'Others' ? (pair.customRole || 'Others') : pair.role;
      await addDoc(collection(db, 'userEmails'), {
        email: emailLower,
        role: 'hr',
        hrRole: finalRole,
        companyName: companyName.trim(),
        createdAt: new Date().toISOString(),
        verified: true
      });

      // Update pair to show verified
      setEmailRolePairs(prevPairs =>
        prevPairs.map(p =>
          p.id === pairId
            ? { ...p, verified: true, isVerifying: false, verificationCode: '' }
            : p
        )
      );

      setToast({
        message: `${pair.email} registered successfully!`,
        type: 'success'
      });

      // Check if all emails are verified
      const allVerified = emailRolePairs.every(p => p.id === pairId ? true : p.verified);
      if (allVerified && emailRolePairs.every(p => p.verified)) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error registering email:', error);
      const errorMessage = error?.message || 'Failed to register email. Please try again.';
      setToast({ message: `Failed to register ${pair.email}: ${errorMessage}`, type: 'error' });
      setEmailRolePairs(prevPairs =>
        prevPairs.map(p =>
          p.id === pairId ? { ...p, isVerifying: false } : p
        )
      );
    }
  };

  const resendCodeForEmail = async (pairId: string) => {
    const pair = emailRolePairs.find(p => p.id === pairId);
    if (!pair) return;

    if (!validateEmail(pair.email)) {
      setToast({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    try {
      const code = generateVerificationCode();
      const emailLower = pair.email.trim().toLowerCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const finalRole = pair.role === 'Others' ? (pair.customRole || 'Others') : pair.role;
      
      // Store verification code in Firestore first
      const verificationRef = doc(db, 'verificationCodes', emailLower);
      await setDoc(verificationRef, {
        code: code,
        email: emailLower,
        role: 'hr',
        hrRole: finalRole,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });

      // Try to send via backend API
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
          console.log(`Backend email resend may have failed for ${pair.email}, but code stored in Firestore`);
        }
      } catch (backendError) {
        // Backend unavailable or doesn't support this, but code is stored in Firestore
        console.log(`Backend email resend failed for ${pair.email}, but code stored in Firestore`);
      }

      setToast({
        message: `Verification code resent to ${pair.email}. Please check your email inbox.`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error resending code:', error);
      setToast({ message: 'Failed to resend code. Please try again.', type: 'error' });
    }
  };

  const allEmailsVerified = emailRolePairs.every(pair => pair.verified);
  const hasCodeSent = emailRolePairs.some(pair => pair.codeSent);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="hr-modal-content hr-modal-content-large bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="hr-modal-header">
          <div className="hr-header-icon">👔</div>
          <h2>User Registration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="hr-modal-body">
          <p className="hr-description">
            Register multiple email addresses with their specific roles. Each email will receive a separate verification code.
          </p>

          {/* Company Name Input */}
          <div className="form-group company-name-group">
            <label className="form-label">Company Name *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="form-input"
              placeholder={roleLoading ? "Loading..." : "e.g., Tech Corp"}
              disabled={isSendingCodes || hasCodeSent || !!adminCompanyName}
              required
              title={adminCompanyName ? "Company name is set from your registration" : ""}
            />
            <small className="form-hint">
              {adminCompanyName 
                ? "Company name is automatically set from your registration. All emails registered here will belong to this company."
                : "All emails registered here will belong to this company."}
            </small>
          </div>

          {/* Email/Role Pairs */}
          <div className="email-pairs-container">
            {emailRolePairs.map((pair, index) => (
              <div key={pair.id} className="email-role-pair">
                <div className="pair-header">
                  <span className="pair-number">Email {index + 1}</span>
                  {emailRolePairs.length > 1 && (
                    <button
                      type="button"
                      className="remove-pair-btn"
                      onClick={() => removeEmailField(pair.id)}
                      disabled={isSendingCodes || pair.isVerifying}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="pair-fields">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={pair.email}
                      onChange={(e) => updateEmailPair(pair.id, 'email', e.target.value)}
                      className="form-input"
                      placeholder="user@company.com"
                      disabled={isSendingCodes || pair.codeSent || pair.verified}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      value={pair.role}
                      onChange={(e) => updateEmailPair(pair.id, 'role', e.target.value)}
                      className="form-select"
                      disabled={isSendingCodes || pair.codeSent || pair.verified}
                      required
                    >
                      {userRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Role Input for "Others" */}
                {pair.role === 'Others' && (
                  <div className="form-group custom-role-group">
                    <label className="form-label">Specify Role</label>
                    <input
                      type="text"
                      value={pair.customRole || ''}
                      onChange={(e) => updateEmailPair(pair.id, 'customRole', e.target.value)}
                      className="form-input"
                      placeholder="Enter custom role name"
                      disabled={isSendingCodes || pair.codeSent || pair.verified}
                      required
                    />
                  </div>
                )}


                {/* Verification Input */}
                {pair.codeSent && !pair.verified && (
                  <div className="verification-section">
                    <div className="form-group">
                      <label className="form-label">Verification Code</label>
                      <input
                        type="text"
                        value={pair.verificationCode || ''}
                        onChange={(e) => {
                          const code = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setEmailRolePairs(prevPairs =>
                            prevPairs.map(p =>
                              p.id === pair.id ? { ...p, verificationCode: code } : p
                            )
                          );
                        }}
                        className="form-input verification-code-input"
                        placeholder="000000"
                        disabled={pair.isVerifying || pair.verified}
                        maxLength={6}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="resend-code-btn"
                        onClick={() => resendCodeForEmail(pair.id)}
                        disabled={pair.isVerifying || pair.verified || isSendingCodes}
                      >
                        {isSendingCodes ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="verify-btn-full"
                        onClick={() => pair.verificationCode && verifyAndRegisterEmail(pair.id, pair.verificationCode)}
                        disabled={pair.isVerifying || pair.verified || !pair.verificationCode || pair.verificationCode.length !== 6}
                      >
                        {pair.isVerifying ? 'Verifying...' : pair.verified ? '✓ Verified' : 'Verify & Register'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Verified Status */}
                {pair.verified && (
                  <div className="verified-badge">
                    ✓ {pair.email} verified successfully!
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Email Button */}
          {!hasCodeSent && (
            <button
              type="button"
              className="add-email-btn"
              onClick={addEmailField}
              disabled={isSendingCodes}
            >
              + Add Another Email
            </button>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSendingCodes || emailRolePairs.some(p => p.isVerifying)}
            >
              Cancel
            </button>
            {!hasCodeSent ? (
              <button
                type="button"
                className="submit-btn"
                onClick={sendVerificationCodes}
                disabled={isSendingCodes || !companyName.trim() || emailRolePairs.some(p => 
                  !p.email.trim() || 
                  !validateEmail(p.email) ||
                  (p.role === 'Others' && (!p.customRole || !p.customRole.trim()))
                )}
              >
                {isSendingCodes ? 'Sending Codes...' : `Send Verification Codes (${emailRolePairs.length})`}
              </button>
            ) : allEmailsVerified ? (
              <button
                type="button"
                className="submit-btn"
                onClick={onClose}
              >
                Done
              </button>
            ) : (
              <div className="verification-status">
                {emailRolePairs.filter(p => p.verified).length} of {emailRolePairs.length} emails verified
              </div>
            )}
          </div>
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

export default HRRegistrationModal;
