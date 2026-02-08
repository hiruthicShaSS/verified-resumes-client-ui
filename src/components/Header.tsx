import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import ProfileModal from './ProfileModal.tsx';
import './Header.css';

interface HeaderProps {
  showLogout?: boolean;
  title?: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showLogout = true, title, onBack }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack} title="Home">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          )}
          {title && <h1 className="header-title">{title}</h1>}
          {showLogout && user && (
            <button 
              className="logout-btn-header" 
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
        
        <div className="header-right">
          {user && showLogout && (
            <div 
              className="user-info" 
              onClick={() => setShowProfileModal(true)}
              title="View Profile"
            >
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="user-avatar"
                />
              )}
              <span className="user-name">{user.displayName || user.email}</span>
            </div>
          )}
        </div>
      </header>
      
      {showProfileModal && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
};

export default Header;

