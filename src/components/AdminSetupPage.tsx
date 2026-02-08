import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Background } from './Background.tsx';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import Toast from './Toast.tsx';
import './common.css';
import './AdminSetupPage.css';

const AdminSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    setupKey: '',
    companyName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.setupKey.trim()) {
      newErrors.setupKey = 'Setup key is required';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await fetch('http://localhost:5000/api/setup/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          setupKey: formData.setupKey.trim(),
          companyName: formData.companyName.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Also create Firestore entry for frontend role checking
        try {
          const emailLower = formData.email.trim().toLowerCase();
          
          // Check if email already exists in Firestore
          const emailsRef = collection(db, 'userEmails');
          const querySnapshot = await getDocs(emailsRef);
          const existingEmail = querySnapshot.docs.find(
            doc => doc.data().email.toLowerCase() === emailLower
          );
          
          if (!existingEmail) {
            // Add admin email to Firestore for role checking
            await addDoc(collection(db, 'userEmails'), {
              email: emailLower,
              role: 'admin',
              companyName: formData.companyName.trim(),
              createdAt: new Date().toISOString(),
              verified: true
            });
          }
        } catch (firestoreError) {
          console.error('Error adding email to Firestore:', firestoreError);
          // Don't fail the whole operation, but log the error
          setToast({ 
            message: 'Admin account created, but there was an issue registering the email. You may need to register manually.', 
            type: 'info' 
          });
          setTimeout(() => {
            navigate('/');
          }, 3000);
          return;
        }
        
        setToast({ 
          message: 'Admin account created successfully! Redirecting to login...', 
          type: 'success' 
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        // Handle different error types
        let errorMessage = 'Failed to create admin account';
        
        if (response.status === 403) {
          errorMessage = 'Admin setup is disabled. An admin account already exists.';
        } else if (response.status === 400) {
          errorMessage = data.message || data.error || 'Invalid setup key or request data';
        } else if (response.status === 409) {
          errorMessage = 'An admin account already exists. Setup is disabled.';
        } else {
          errorMessage = data.message || data.error || errorMessage;
        }
        
        setToast({ message: errorMessage, type: 'error' });
      }
    } catch (error) {
      console.error('Error creating admin account:', error);
      setToast({ 
        message: 'Network error. Please check your connection and try again.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-setup-page-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <Background />
      <div className="admin-setup-container">
        <div className="admin-setup-card">
            <div className="admin-setup-header">
            <div className="setup-icon">🔐</div>
            <h1 className="setup-title">Admin Setup</h1>
            <p className="setup-subtitle">One-time setup per company</p>
            <div className="setup-warning">
              <span className="warning-icon">⚠️</span>
              <span>Each company can create one admin account. Ensure you have the correct setup key.</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-setup-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="admin@company.com"
                disabled={isSubmitting}
                required
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="companyName" className="form-label">
                Company Name *
              </label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`form-input ${errors.companyName ? 'input-error' : ''}`}
                placeholder="e.g., Tech Corp"
                disabled={isSubmitting}
                required
              />
              {errors.companyName && (
                <span className="error-message">{errors.companyName}</span>
              )}
              <small className="form-hint">
                Each company can create one admin account
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter a strong password"
                disabled={isSubmitting}
                required
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
              <small className="form-hint">
                Must be at least 8 characters with uppercase, lowercase, and number
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
                disabled={isSubmitting}
                required
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="setupKey" className="form-label">
                Setup Key *
              </label>
              <input
                id="setupKey"
                type="password"
                name="setupKey"
                value={formData.setupKey}
                onChange={handleInputChange}
                className={`form-input ${errors.setupKey ? 'input-error' : ''}`}
                placeholder="Enter the setup key"
                disabled={isSubmitting}
                required
              />
              {errors.setupKey && (
                <span className="error-message">{errors.setupKey}</span>
              )}
              <small className="form-hint">
                The setup key is required to create an admin account
              </small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Admin...' : 'Create Admin Account'}
              </button>
            </div>
          </form>

          <div className="setup-footer">
            <p className="footer-text">
              Already have an admin account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/')}
              >
                Go to Login
              </button>
            </p>
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

export default AdminSetupPage;
