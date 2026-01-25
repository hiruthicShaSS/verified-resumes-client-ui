import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import Header from './Header.tsx';
import './common.css';
import './ApplyJobPage.css';
import { UploadIcon, FileIcon } from './Icons.tsx';
import Toast from './Toast.tsx';

interface ApplicationData {
  name: string;
  yearsOfExperience: string;
  isCurrentlyWorking: boolean;
  currentCompany: string;
  currentDesignation: string;
  resumeFile: File | null;
  useUploadedResume: boolean;
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
    resumeFile: null,
    useUploadedResume: false
  });
  const [uploadedResumes, setUploadedResumes] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Load uploaded resumes from localStorage
    const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    setUploadedResumes(savedFiles);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        resumeFile: e.target.files![0],
        useUploadedResume: false
      }));
    }
  };

  const handleResumeOptionChange = (useUploaded: boolean) => {
    setFormData(prev => ({
      ...prev,
      useUploadedResume: useUploaded,
      resumeFile: useUploaded ? null : prev.resumeFile
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save application
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');
    const newApplication = {
      id: Date.now().toString(),
      jobId: jobId,
      ...formData,
      submittedDate: new Date().toISOString(),
      resumeFileName: formData.useUploadedResume 
        ? uploadedResumes[0]?.name || 'Uploaded Resume'
        : formData.resumeFile?.name || 'No Resume'
    };
    applications.push(newApplication);
    localStorage.setItem('applications', JSON.stringify(applications));
    
    setToast({ message: 'Application submitted successfully!', type: 'success' });
    setTimeout(() => {
      navigate('/job-listings');
    }, 1500);
  };

  const isFormValid = () => {
    return formData.name.trim() !== '' &&
           formData.yearsOfExperience.trim() !== '' &&
           (!formData.isCurrentlyWorking || (formData.currentCompany.trim() !== '' && formData.currentDesignation.trim() !== '')) &&
           (formData.resumeFile !== null || formData.useUploadedResume);
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
                <>
                  <div className="form-group">
                    <p className="resume-option-label">Choose your resume option:</p>
                    <div className="resume-options">
                      <label className="resume-option-card">
                        <input
                          type="radio"
                          name="resumeOption"
                          checked={formData.useUploadedResume}
                          onChange={() => handleResumeOptionChange(true)}
                        />
                        <div className="resume-option-content">
                          <div className="resume-option-header">
                            <FileIcon size={24} />
                            <span className="resume-option-title">Use Uploaded Resume</span>
                          </div>
                          <div className="resume-option-files">
                            {uploadedResumes.map((file, index) => (
                              <div key={index} className="resume-file-item">
                                <FileIcon size={16} />
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </label>
                      
                      <label className="resume-option-card">
                        <input
                          type="radio"
                          name="resumeOption"
                          checked={!formData.useUploadedResume}
                          onChange={() => handleResumeOptionChange(false)}
                        />
                        <div className="resume-option-content">
                          <div className="resume-option-header">
                            <UploadIcon size={24} />
                            <span className="resume-option-title">Upload New Resume</span>
                          </div>
                          <div className="file-upload-area">
                            <input
                              id="resumeFile"
                              type="file"
                              name="resumeFile"
                              accept=".pdf"
                              onChange={handleFileChange}
                              className="file-input"
                              disabled={formData.useUploadedResume}
                              required={!formData.useUploadedResume}
                            />
                            <label htmlFor="resumeFile" className="file-upload-label">
                              <UploadIcon size={24} />
                              <span>Click to upload or drag and drop</span>
                              <span className="file-upload-hint">PDF files only</span>
                            </label>
                            {formData.resumeFile && (
                              <div className="selected-file">
                                <FileIcon size={20} />
                                <span>{formData.resumeFile.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label htmlFor="resumeFile" className="form-label">Upload Resume *</label>
                  <div className="file-upload-area">
                    <input
                      id="resumeFile"
                      type="file"
                      name="resumeFile"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="file-input"
                      required
                    />
                    <label htmlFor="resumeFile" className="file-upload-label">
                      <UploadIcon size={24} />
                      <span>Click to upload or drag and drop</span>
                      <span className="file-upload-hint">PDF files only</span>
                    </label>
                    {formData.resumeFile && (
                      <div className="selected-file">
                        <FileIcon size={20} />
                        <span>{formData.resumeFile.name}</span>
                      </div>
                    )}
                  </div>
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

