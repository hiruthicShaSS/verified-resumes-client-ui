import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import './App.css';
import LandingPage from './components/LandingPage.tsx';
import LoginPage from './components/LoginPage.tsx';
import EmailVerificationPage from './components/EmailVerificationPage.tsx';
import UploadPage from './components/UploadPage.tsx';
import JobListingPage from './components/JobListingPage.tsx';
import PostJobPage from './components/PostJobPage.tsx';
import ApplyJobPage from './components/ApplyJobPage.tsx';
import TeamManagementPage from './components/TeamManagementPage.tsx';
import ApplicantsPage from './components/ApplicantsPage.tsx';
import AdminSetupPage from './components/AdminSetupPage.tsx';
import PreviousCompanyVerificationPage from './components/PreviousCompanyVerificationPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              {/* Hidden admin setup route - not exposed in navigation */}
              <Route path="/setup/admin" element={<AdminSetupPage />} />
              {/* Email verification route - accessible without full auth */}
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route 
                path="/home" 
                element={
                  <ProtectedRoute>
                    <LandingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/job-listings" 
                element={
                  <ProtectedRoute>
                    <JobListingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/post-job" 
                element={
                  <ProtectedRoute>
                    <PostJobPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/apply-job/:jobId" 
                element={
                  <ProtectedRoute>
                    <ApplyJobPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/team" 
                element={
                  <ProtectedRoute>
                    <TeamManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/applicants" 
                element={
                  <ProtectedRoute>
                    <ApplicantsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/applicants/job/:jobId" 
                element={
                  <ProtectedRoute>
                    <ApplicantsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/previous-company/verifications" 
                element={
                  <ProtectedRoute>
                    <PreviousCompanyVerificationPage />
                  </ProtectedRoute>
                } 
              />
              {/* Redirect any unknown routes to login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

