import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import Toast from './Toast.tsx';
import './EmailManagementModal.css';

export interface UserEmail {
  id?: string;
  email: string;
  role: 'admin' | 'hr';
}

interface EmailManagementModalProps {
  onClose: () => void;
}

const EmailManagementModal: React.FC<EmailManagementModalProps> = ({ onClose }) => {
  const [emails, setEmails] = useState<UserEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'hr'>('hr');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setIsLoading(true);
    try {
      const emailsRef = collection(db, 'userEmails');
      const querySnapshot = await getDocs(emailsRef);
      const emailsData: UserEmail[] = [];
      querySnapshot.forEach((doc) => {
        emailsData.push({ id: doc.id, ...doc.data() } as UserEmail);
      });
      // Sort client-side: admin first, then HR, then by email
      emailsData.sort((a, b) => {
        if (a.role !== b.role) {
          return a.role === 'admin' ? -1 : 1;
        }
        return a.email.localeCompare(b.email);
      });
      setEmails(emailsData);
    } catch (error: any) {
      console.error('Error loading emails:', error);
      const errorMessage = error?.message || 'Failed to load emails. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      setToast({ message: 'Please enter an email address.', type: 'error' });
      return;
    }

    if (!validateEmail(newEmail)) {
      setToast({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    // Check if email already exists
    if (emails.some(e => e.email.toLowerCase() === newEmail.toLowerCase())) {
      setToast({ message: 'This email is already registered.', type: 'error' });
      return;
    }

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'userEmails'), {
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        createdAt: new Date().toISOString()
      });
      
      setToast({ 
        message: `${newRole === 'admin' ? 'Admin' : 'HR'} email added successfully!`, 
        type: 'success' 
      });
      setNewEmail('');
      setNewRole('hr');
      loadEmails();
    } catch (error: any) {
      console.error('Error adding email:', error);
      const errorMessage = error?.message || 'Failed to add email. Please try again.';
      setToast({ message: `Failed to add email: ${errorMessage}`, type: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteEmail = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'userEmails', id));
      setToast({ message: 'Email removed successfully!', type: 'success' });
      loadEmails();
    } catch (error) {
      console.error('Error deleting email:', error);
      setToast({ message: 'Failed to remove email. Please try again.', type: 'error' });
    }
  };

  const getRoleDisplayName = (role: string): string => {
    return role === 'admin' ? 'Admin' : 'HR';
  };

  const adminEmails = emails.filter(e => e.role === 'admin');
  const hrEmails = emails.filter(e => e.role === 'hr');

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="email-modal-content bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="email-modal-header">
          <h2>Manage Admin & HR Emails</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="email-modal-body">
          {/* Add New Email Section */}
          <div className="add-email-section">
            <h3>Add New Email</h3>
            <div className="add-email-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="form-input"
                  placeholder="example@company.com"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'hr')}
                  className="form-select"
                >
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button 
                className="add-email-btn" 
                onClick={handleAddEmail}
                disabled={isAdding || !newEmail.trim()}
              >
                {isAdding ? 'Adding...' : 'Add Email'}
              </button>
            </div>
          </div>

          {/* Emails List Section */}
          <div className="emails-list-section">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>Loading emails...</span>
              </div>
            ) : (
              <>
                {/* Admin Emails */}
                <div className="role-section">
                  <h3 className="role-title">
                    <span className="role-icon">👑</span>
                    Admin Emails
                  </h3>
                  {adminEmails.length === 0 ? (
                    <div className="empty-state">No admin emails registered</div>
                  ) : (
                    <div className="emails-list">
                      {adminEmails.map((email) => (
                        <div key={email.id} className="email-item">
                          <div className="email-info">
                            <span className="email-address">{email.email}</span>
                            <span className="email-role-badge admin-badge">{getRoleDisplayName(email.role)}</span>
                          </div>
                          <button
                            className="delete-email-btn"
                            onClick={() => email.id && handleDeleteEmail(email.id, email.email)}
                            title="Remove email"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Emails */}
                <div className="role-section">
                  <h3 className="role-title">
                    <span className="role-icon">👔</span>
                    User Emails
                  </h3>
                  {hrEmails.length === 0 ? (
                    <div className="empty-state">No User emails registered</div>
                  ) : (
                    <div className="emails-list">
                      {hrEmails.map((email) => (
                        <div key={email.id} className="email-item">
                          <div className="email-info">
                            <span className="email-address">{email.email}</span>
                            <span className="email-role-badge hr-badge">{getRoleDisplayName(email.role)}</span>
                          </div>
                          <button
                            className="delete-email-btn"
                            onClick={() => email.id && handleDeleteEmail(email.id, email.email)}
                            title="Remove email"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="info-section">
            <p className="info-text">
              💡 These emails will receive verification codes when needed. You can add multiple emails for each role.
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

export default EmailManagementModal;

