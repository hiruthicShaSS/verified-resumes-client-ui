import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { User } from 'firebase/auth';
import Toast from './Toast.tsx';
import './ProfileModal.css';

interface ProfileData {
  name: string;
  about: string;
  company: string;
  birthday: string;
}

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
  const { theme } = useTheme();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user.displayName || '',
    about: '',
    company: '',
    birthday: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [timeInApp, setTimeInApp] = useState<string>('');
  const [jobsAppliedCount, setJobsAppliedCount] = useState<number>(0);

  useEffect(() => {
    // Load saved profile data
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfileData({
        name: parsed.name || user.displayName || '',
        about: parsed.about || '',
        company: parsed.company || '',
        birthday: parsed.birthday || ''
      });
    }

    // Calculate time in app
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.loginTime) {
        const loginDate = new Date(parsed.loginTime);
        const now = new Date();
        const diffMs = now.getTime() - loginDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffDays > 0) {
          setTimeInApp(`${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours} hour${diffHours !== 1 ? 's' : ''}`);
        } else if (diffHours > 0) {
          setTimeInApp(`${diffHours} hour${diffHours > 1 ? 's' : ''}, ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
        } else {
          setTimeInApp(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
        }
      }
    }

    // Count jobs applied
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');
    setJobsAppliedCount(applications.length);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    setToast({ message: 'Profile updated successfully!', type: 'success' });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reload saved data
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfileData({
        name: parsed.name || user.displayName || '',
        about: parsed.about || '',
        company: parsed.company || '',
        birthday: parsed.birthday || ''
      });
    }
    setIsEditing(false);
  };

  return (
    <div className={`profile-modal-overlay theme-${theme}`} onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-avatar-section">
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="profile-avatar-large"
              />
            )}
            <p className="profile-email">{user.email}</p>
          </div>

          <div className="profile-form-section">
            <div className="form-group">
              <label className="form-label">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="form-display">{profileData.name || 'Not set'}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">About Yourself</label>
              {isEditing ? (
                <textarea
                  name="about"
                  value={profileData.about}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              ) : (
                <div className="form-display">{profileData.about || 'Not set'}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Company</label>
              {isEditing ? (
                <input
                  type="text"
                  name="company"
                  value={profileData.company}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter company name"
                />
              ) : (
                <div className="form-display">{profileData.company || 'Not set'}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Birthday</label>
              {isEditing ? (
                <input
                  type="date"
                  name="birthday"
                  value={profileData.birthday}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-display">
                  {profileData.birthday 
                    ? new Date(profileData.birthday).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'Not set'}
                </div>
              )}
            </div>
          </div>

          <div className="profile-insights-section">
            <h3 className="insights-title">Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-label">Time in App</div>
                <div className="insight-value">{timeInApp || 'Just started'}</div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Jobs Applied</div>
                <div className="insight-value">{jobsAppliedCount}</div>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="save-btn" onClick={handleSave}>
                  Save
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
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

export default ProfileModal;

