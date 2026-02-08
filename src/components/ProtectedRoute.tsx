import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, emailVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#000000'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Allow access to verification page even if not verified
  if (location.pathname === '/verify-email') {
    return children;
  }

  // Check email verification status
  // Check from localStorage first (updated by backend API)
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Redirect to verification if email not verified
  // Only check if emailVerified is explicitly false (not null/undefined)
  if (emailVerified === false || (userData.emailVerified === false && emailVerified !== true)) {
    return <Navigate to="/verify-email" state={{ email: user.email }} replace />;
  }

  return children;
};

export default ProtectedRoute;

