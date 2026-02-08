import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole.ts';
import Header from './Header.tsx';
import { Background } from './Background.tsx';
import './common.css';
import './PostJobPage.css';
import Toast from './Toast.tsx';

interface JobPostData {
  companyName: string;
  role: string;
  jobType: string;
  aboutJob: string;
  companyOverview: string;
  jobDescription: string;
  preferredQualifications: string;
  minimumQualifications: string;
}

const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { companyName: registeredCompanyName, isLoading: roleLoading } = useUserRole();
  const [formData, setFormData] = useState<JobPostData>({
    companyName: '',
    role: '',
    jobType: 'Full-time',
    aboutJob: '',
    companyOverview: '',
    jobDescription: '',
    preferredQualifications: '',
    minimumQualifications: ''
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-fill company name from registration
  useEffect(() => {
    if (registeredCompanyName && !roleLoading) {
      setFormData(prev => ({
        ...prev,
        companyName: registeredCompanyName
      }));
    }
  }, [registeredCompanyName, roleLoading]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      const response = await fetch('https://verified-resumes-be-production.up.railway.app/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          postedBy: userData.name || userData.email || 'Anonymous',
          postedByEmail: userData.email || ''
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setToast({ message: data.message, type: 'success' });
        setTimeout(() => {
          navigate('/job-listings');
        }, 1500);
      } else {
        setToast({ message: data.message || 'Failed to post job', type: 'error' });
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setToast({ message: 'Failed to post job', type: 'error' });
    }
  };

  const isFormValid = () => {
    return formData.companyName.trim() !== '' &&
           formData.role.trim() !== '' &&
           formData.jobType.trim() !== '' &&
           formData.aboutJob.trim() !== '' &&
           formData.companyOverview.trim() !== '' &&
           formData.jobDescription.trim() !== '' &&
           formData.minimumQualifications.trim() !== '';
  };

  const handleAddBulletPoint = (fieldName: keyof JobPostData) => {
    const currentValue = formData[fieldName];
    const newValue = currentValue + '\n• ';
    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue
    }));
  };

  return (
    <div className="post-job-page-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <Background />
      {/* Header */}
      <header className="post-job-header-wrapper">
        <div className="post-job-header">
          <div className="header-left">
            <button className="cancel-link" onClick={() => navigate('/home')} title="Home">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
          <div className="header-center">
            <h1 className="page-title">Post a Job</h1>
          </div>
          <div className="header-right">
            <Header showLogout={false} />
            <button 
              className="save-btn" 
              onClick={handleSave}
              disabled={!isFormValid()}
            >
              Save & Post
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="post-job-content-wrapper">
        <div className="post-job-content">
          <div className="form-container">
            <div className="form-section">
              <h2 className="section-title">Company Name</h2>
              <input
                type="text"
                name="companyName"
                className="form-input"
                placeholder={roleLoading ? "Loading..." : "Enter your company name..."}
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={!!registeredCompanyName}
                title={registeredCompanyName ? "Company name is set from your registration" : ""}
              />
              {registeredCompanyName && (
                <p className="form-hint" style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Company name is automatically set from your registration
                </p>
              )}
            </div>

            <div className="form-section">
              <h2 className="section-title">Role</h2>
              <input
                type="text"
                name="role"
                className="form-input"
                placeholder="e.g., Software Engineer, Product Manager..."
                value={formData.role}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-section">
              <h2 className="section-title">Job Type</h2>
              <select
                name="jobType"
                className="form-input"
                value={formData.jobType}
                onChange={handleInputChange}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Temporary">Temporary</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">About the Job</h2>
                <button 
                  type="button"
                  className="bullet-btn"
                  onClick={() => handleAddBulletPoint('aboutJob')}
                  title="Add bullet point"
                >
                  • Add Bullet
                </button>
              </div>
              <textarea
                name="aboutJob"
                className="form-textarea"
                placeholder="Describe what this role entails and what makes it exciting... Use • for bullet points"
                value={formData.aboutJob}
                onChange={handleInputChange}
                rows={8}
              />
            </div>

            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">Company Overview</h2>
                <button 
                  type="button"
                  className="bullet-btn"
                  onClick={() => handleAddBulletPoint('companyOverview')}
                  title="Add bullet point"
                >
                  • Add Bullet
                </button>
              </div>
              <textarea
                name="companyOverview"
                className="form-textarea"
                placeholder="Tell candidates about your company, culture, mission, and values... Use • for bullet points"
                value={formData.companyOverview}
                onChange={handleInputChange}
                rows={8}
              />
            </div>

            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">Job Description / Preferred Qualifications</h2>
                <button 
                  type="button"
                  className="bullet-btn"
                  onClick={() => handleAddBulletPoint('jobDescription')}
                  title="Add bullet point"
                >
                  • Add Bullet
                </button>
              </div>
              <textarea
                name="jobDescription"
                className="form-textarea"
                placeholder="Describe the ideal candidate and preferred qualifications... Use • for bullet points"
                value={formData.jobDescription}
                onChange={handleInputChange}
                rows={10}
              />
            </div>

            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">Minimum Qualifications</h2>
                <button 
                  type="button"
                  className="bullet-btn"
                  onClick={() => handleAddBulletPoint('minimumQualifications')}
                  title="Add bullet point"
                >
                  • Add Bullet
                </button>
              </div>
              <textarea
                name="minimumQualifications"
                className="form-textarea"
                placeholder="List the minimum requirements for this position... Use • for bullet points"
                value={formData.minimumQualifications}
                onChange={handleInputChange}
                rows={8}
              />
            </div>

            {/* Bottom Save Button */}
            <div className="form-actions-bottom">
              <button 
                className="save-btn-bottom" 
                onClick={handleSave}
                disabled={!isFormValid()}
              >
                Save & Post
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Toast Notification */}
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

export default PostJobPage;

