import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import Header from './Header.tsx';
import './common.css';
import './ApplyJobPage.css';
import { FileIcon } from './Icons.tsx';
import Toast from './Toast.tsx';

interface ApplicationData {
  name: string;
  yearsOfExperience: string;
  isCurrentlyWorking: boolean;
  currentCompany: string;
  currentDesignation: string;
  selectedResumeIndex: number;
}

const ApplyJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<ApplicationData>({
    name: '',
    yearsOfExperience: '',
    isCurrentlyWorking: false,
    currentCompany: '',
    currentDesignation: '',
    selectedResumeIndex: 0
  });
  const [uploadedResumes, setUploadedResumes] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Load uploaded resumes from localStorage
    const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    setUploadedResumes(savedFiles);
    // Set default selected resume to first one if available
    if (savedFiles.length > 0 && formData.selectedResumeIndex >= savedFiles.length) {
      setFormData(prev => ({ ...prev, selectedResumeIndex: 0 }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId) {
      setToast({ message: 'Job ID is missing.', type: 'error' });
      return;
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('jobId', jobId);
      formDataToSend.append('applicantName', formData.name);
      formDataToSend.append('applicantEmail', userData.email || '');
      formDataToSend.append('yearsOfExperience', formData.yearsOfExperience);
      formDataToSend.append('isCurrentlyWorking', formData.isCurrentlyWorking.toString());
      formDataToSend.append('currentCompany', formData.currentCompany || '');
      formDataToSend.append('currentDesignation', formData.currentDesignation || '');
      
      // Handle resume file - must use uploaded resume from profile
      if (uploadedResumes.length === 0) {
        setToast({ message: 'Please upload a resume on your profile first.', type: 'error' });
        return;
      }

      const selectedResume = uploadedResumes[formData.selectedResumeIndex];
      if (!selectedResume) {
        setToast({ message: 'Please select a resume from your profile.', type: 'error' });
        return;
      }

      // Send resume file name - backend will fetch the actual file from user's profile
      formDataToSend.append('resumeFileName', selectedResume.name);

      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: data.message || 'Application submitted successfully!', type: 'success' });
        setTimeout(() => {
          navigate('/job-listings');
        }, 1500);
      } else {
        setToast({ message: data.message || 'Failed to submit application.', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setToast({ message: 'Failed to submit application. Please try again.', type: 'error' });
    }
  };

  const isFormValid = () => {
    return formData.name.trim() !== '' &&
           formData.yearsOfExperience.trim() !== '' &&
           (!formData.isCurrentlyWorking || (formData.currentCompany.trim() !== '' && formData.currentDesignation.trim() !== '')) &&
           uploadedResumes.length > 0;
  };

  return (
    <div className={`apply-job-page-wrapper theme-${theme}`}>
      {/* Header */}
      <header className="apply-job-header-wrapper">
        <div className="apply-job-header">
          <div className="header-left">
            <button className="cancel-link" onClick={() => navigate('/job-listings')}>
              Cancel
            </button>
          </div>
          <div className="header-center">
            <h1 className="page-title">Apply for Job</h1>
          </div>
          <div className="header-right">
            <Header showLogout={false} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="apply-job-content-wrapper">
        <div className="apply-job-content">
          <form onSubmit={handleSubmit} className="application-form">
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="yearsOfExperience" className="form-label">Years of Experience *</label>
                <input
                  id="yearsOfExperience"
                  type="number"
                  name="yearsOfExperience"
                  className="form-input"
                  placeholder="e.g., 3"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Current Employment</h2>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isCurrentlyWorking"
                    checked={formData.isCurrentlyWorking}
                    onChange={handleInputChange}
                  />
                  <span>I am currently working in a company</span>
                </label>
              </div>

              {formData.isCurrentlyWorking && (
                <>
                  <div className="form-group">
                    <label htmlFor="currentCompany" className="form-label">Current Company Name *</label>
                    <input
                      id="currentCompany"
                      type="text"
                      name="currentCompany"
                      className="form-input"
                      placeholder="Enter your current company name"
                      value={formData.currentCompany}
                      onChange={handleInputChange}
                      required={formData.isCurrentlyWorking}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="currentDesignation" className="form-label">Current Designation *</label>
                    <input
                      id="currentDesignation"
                      type="text"
                      name="currentDesignation"
                      className="form-input"
                      placeholder="Enter your current designation"
                      value={formData.currentDesignation}
                      onChange={handleInputChange}
                      required={formData.isCurrentlyWorking}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="form-section">
              <h2 className="section-title">Resume</h2>
              
              {uploadedResumes.length > 0 ? (
                <div className="form-group">
                  <p className="resume-option-label">Select a resume from your profile:</p>
                  <div className="resume-selection-list">
                    {uploadedResumes.map((file, index) => (
                      <label key={index} className={`resume-selection-item ${formData.selectedResumeIndex === index ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="selectedResume"
                          checked={formData.selectedResumeIndex === index}
                          onChange={() => setFormData(prev => ({ ...prev, selectedResumeIndex: index }))}
                        />
                        <div className="resume-selection-content">
                          <FileIcon size={20} />
                          <div className="resume-info">
                            <span className="resume-name">{file.name}</span>
                            {file.size && <span className="resume-size">{file.size}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="resume-note">
                    💡 To update your resume, go to your <button type="button" className="link-button" onClick={() => navigate('/upload')}>profile</button>
                  </p>
                </div>
              ) : (
                <div className="no-resume-message">
                  <div className="no-resume-icon">📄</div>
                  <h3 className="no-resume-title">No Resume Found</h3>
                  <p className="no-resume-text">
                    Please upload a resume on your profile before applying for jobs.
                  </p>
                  <button 
                    type="button"
                    className="go-to-profile-btn"
                    onClick={() => navigate('/upload')}
                  >
                    Go to Profile & Upload Resume
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions-bottom">
              <button 
                type="submit"
                className="submit-btn" 
                disabled={!isFormValid()}
              >
                Submit Application
              </button>
            </div>
          </form>
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

export default ApplyJobPage;

