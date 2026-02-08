import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean | null; // null = not checked, true/false = checked
  logout: () => Promise<void>;
  refreshEmailVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  const checkEmailVerification = async (userEmail: string) => {
    try {
      // Check email verification status from backend
      const response = await fetch(`https://verified-resumes-be-production.up.railway.app/api/users/me?email=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setEmailVerified(data.user.emailVerified === true);
          // Update localStorage
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          userData.emailVerified = data.user.emailVerified === true;
          localStorage.setItem('userData', JSON.stringify(userData));
          return;
        }
      }
    } catch (error) {
      console.error('Error checking email verification:', error);
    }

    // Fallback: Check from localStorage or assume Firebase users are verified
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.emailVerified !== undefined) {
      setEmailVerified(userData.emailVerified === true);
    } else {
      // Firebase Auth users are typically verified
      setEmailVerified(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Update localStorage with current user data
        const userInfo = {
          name: user.displayName || '',
          email: user.email || '',
          picture: user.photoURL || '',
          uid: user.uid,
          loginTime: new Date().toISOString(),
          emailVerified: user.emailVerified !== false // Firebase users are typically verified
        };
        localStorage.setItem('userData', JSON.stringify(userInfo));
        localStorage.setItem('isAuthenticated', 'true');

        // Check email verification status from backend
        if (user.email) {
          await checkEmailVerification(user.email);
        }
      } else {
        localStorage.removeItem('userData');
        localStorage.removeItem('isAuthenticated');
        setEmailVerified(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshEmailVerification = async () => {
    if (user?.email) {
      await checkEmailVerification(user.email);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userData');
      localStorage.removeItem('isAuthenticated');
      setEmailVerified(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified, logout, refreshEmailVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

