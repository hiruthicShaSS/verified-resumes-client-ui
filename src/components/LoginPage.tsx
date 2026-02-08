import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config.ts';
import NewLandingPage from './NewLandingPage';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in via Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/home', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = () => {
    // Login handled by LoginCard component
  };

  return <NewLandingPage onLogin={handleLogin} />;
};

export default LoginPage;

