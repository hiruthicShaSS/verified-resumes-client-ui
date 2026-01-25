import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage.tsx';
import LoginPage from './components/LoginPage.tsx';
import UploadPage from './components/UploadPage.tsx';
import JobListingPage from './components/JobListingPage.tsx';
import PostJobPage from './components/PostJobPage.tsx';
import ApplyJobPage from './components/ApplyJobPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
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
          {/* Redirect any unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

