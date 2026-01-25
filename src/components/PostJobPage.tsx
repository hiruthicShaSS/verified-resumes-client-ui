import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import Header from './Header.tsx';
import './common.css';
import './PostJobPage.css';
import Toast from './Toast.tsx';

interface JobPostData {
  companyName: string;
  role: string;
  aboutJob: string;
  companyOverview: string;
  jobDescription: string;
  preferredQualifications: string;
  minimumQualifications: string;
}

const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<JobPostData>({
    companyName: '',
    role: '',
    aboutJob: '',
    companyOverview: '',
    jobDescription: '',
    preferredQualifications: '',
    minimumQualifications: ''
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Get current user info
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Save to localStorage - jobs are visible to ALL users
    const existingJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
    const newJob = {
      id: Date.now().toString(),
      ...formData,
      postedDate: new Date().toISOString(),
      company: formData.companyName || 'Company',
      location: 'Location', // This would come from form
      type: 'Full-time', // This would come from form
      postedBy: userData.name || userData.email || 'Anonymous', // Track who posted it
      postedByEmail: userData.email || ''
    };
    existingJobs.push(newJob);
    localStorage.setItem('postedJobs', JSON.stringify(existingJobs));
    
    setToast({ message: 'Job posted successfully! It will be visible to all users.', type: 'success' });
    setTimeout(() => {
      navigate('/job-listings');
    }, 1500);
  };

  const isFormValid = () => {
    return formData.companyName.trim() !== '' &&
           formData.role.trim() !== '' &&
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
    <div className={`post-job-page-wrapper theme-${theme}`}>
      {/* Header */}
      <header className="post-job-header-wrapper">
        <div className="post-job-header">
          <div className="header-left">
            <button className="cancel-link" onClick={() => navigate('/home')}>
              Cancel
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
                placeholder="Enter your company name..."
                value={formData.companyName}
                onChange={handleInputChange}
              />
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

