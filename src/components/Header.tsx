import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { SunIcon, MoonIcon } from './Icons.tsx';
import ProfileModal from './ProfileModal.tsx';
import './Header.css';

interface HeaderProps {
  showLogout?: boolean;
  title?: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showLogout = true, title, onBack }) => {
  const { theme, toggleTheme } = useTheme();
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
      {/* Logout button - absolutely positioned top-left */}
      {showLogout && user && (
        <button 
          className="logout-btn-top-left" 
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
      
      <header className="app-header">
        <div className="header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          {title && <h1 className="header-title">{title}</h1>}
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
          
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
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

