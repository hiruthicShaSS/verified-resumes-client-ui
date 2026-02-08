import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import Header from './Header.tsx';
import { Background } from './Background.tsx';
import './common.css';
import './UploadPage.css';
import InformationTab from './InformationTab.tsx';
import SummaryTab from './SummaryTab.tsx';
import { UploadIcon, FileIcon, RemoveIcon } from './Icons.tsx';
import { Home } from 'lucide-react';
import Toast from './Toast.tsx';

interface ParsedCompany {
  company: string;
  position: string;
  details: string[];
  duration: string;
}

interface ParsedResume {
  companies: ParsedCompany[];
  skills: string[];
  education: string;
}

interface UploadedFile {
  id: number;
  name: string;
  type: string;
  size: string;
  isUploading: boolean;
  progress: number;
  timeLeft?: string;
  file: File | null;
  downloadURL?: string;
  storageFileName?: string; // Full storage path (optional, for future use)
  parsedResume?: ParsedResume | null; // Parsed resume data from backend
}

type TabType = 'informations' | 'upload' | 'summary';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user-specific storage key
  const getStorageKey = (): string => {
    if (!user?.email) return 'uploadedFiles';
    return `uploadedFiles_${user.email.toLowerCase()}`;
  };

  // Load user-specific resumes on mount
  useEffect(() => {
    if (user?.email) {
      const storageKey = getStorageKey();
      const savedFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setUploadedFiles(savedFiles.map((f: any) => ({
        ...f,
        file: null, // File objects can't be stored in localStorage
        downloadURL: f.downloadURL || undefined, // Restore downloadURL from localStorage
        storageFileName: f.storageFileName || undefined, // Restore storageFileName from localStorage
        parsedResume: f.parsedResume || undefined // Restore parsedResume from localStorage
      })));
    }
  }, [user]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files) as File[];
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      handleFiles(files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFiles = async (files: File[]): Promise<void> => {
    // Check if adding these files would exceed the limit of 3
    const remainingSlots = 3 - uploadedFiles.length;
    if (remainingSlots <= 0) {
      setToast({ message: 'Maximum 3 files allowed. Please remove a file before uploading a new one.', type: 'error' });
      return;
    }

    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50 MB
      const isValidFormat = file.name.toLowerCase().endsWith('.pdf');
      return isValidSize && isValidFormat;
    });

    // Limit to remaining slots
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length > 0) {
      // Upload each file to backend and track successful uploads with downloadURL, storageFileName, and parsedResume
      const successfullyUploadedFiles: Array<{ file: File; downloadURL: string; storageFileName?: string; parsedResume?: ParsedResume | null }> = [];
      
      for (const file of filesToAdd) {
        try {
          const formData = new FormData();
          formData.append('resume', file);
          formData.append('resumeFileName', file.name);
          formData.append('userEmail', user?.email || '');

          const response = await fetch('http://localhost:5000/api/resumes/upload', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();

          if (!data.success) {
            setToast({ message: `Failed to upload ${file.name}: ${data.message || 'Unknown error'}`, type: 'error' });
            continue;
          }
          
          // Extract downloadURL, storageFileName, and parsedResume from response
          const downloadURL = data.resume?.downloadURL || data.resume?.downloadUrl;
          const storageFileName = data.resume?.storageFileName;
          const parsedResume = data.resume?.parsedResume || null;
          
          if (!downloadURL) {
            setToast({ message: `Upload succeeded but no download URL received for ${file.name}`, type: 'error' });
            continue;
          }
          
          // Show success message with parsing status
          if (parsedResume) {
            const companiesCount = parsedResume.companies?.length || 0;
            const skillsCount = parsedResume.skills?.length || 0;
            setToast({ 
              message: `✅ ${file.name} uploaded! Found ${companiesCount} company(ies) and ${skillsCount} skill(s).`, 
              type: 'success' 
            });
          } else {
            setToast({ 
              message: `⚠️ ${file.name} uploaded but parsing failed. You can re-parse later.`, 
              type: 'info' 
            });
          }
          
          // Only add to successfully uploaded list if upload succeeded and downloadURL is available
          successfullyUploadedFiles.push({ file, downloadURL, storageFileName, parsedResume });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setToast({ message: `Failed to upload ${file.name}. Please try again.`, type: 'error' });
          continue;
        }
      }

      // Only add successfully uploaded files to state
      if (successfullyUploadedFiles.length > 0) {
        const newFiles: UploadedFile[] = successfullyUploadedFiles.map(({ file, downloadURL, storageFileName, parsedResume }) => ({
          id: Date.now() + Math.random(),
          name: file.name,
          type: 'PDF',
          size: formatFileSize(file.size),
          isUploading: false,
          progress: 100,
          file: file,
          downloadURL: downloadURL,
          storageFileName: storageFileName,
          parsedResume: parsedResume
        }));
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);
        
        // Save to localStorage with user-specific key (including downloadURL, storageFileName, and parsedResume)
        const storageKey = getStorageKey();
        const filesToSave = updatedFiles.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          downloadURL: f.downloadURL,
          storageFileName: f.storageFileName,
          parsedResume: f.parsedResume
        }));
        localStorage.setItem(storageKey, JSON.stringify(filesToSave));
      }
      
      if (validFiles.length > remainingSlots) {
        setToast({ message: `Only ${remainingSlots} file(s) uploaded. Maximum 3 files allowed.`, type: 'info' });
      }
    }
  };

  const handleRemoveFile = (id: number): void => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(updatedFiles);
    
      // Update localStorage with user-specific key (including downloadURL and storageFileName)
      const storageKey = getStorageKey();
      const filesToSave = updatedFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        downloadURL: f.downloadURL,
        storageFileName: f.storageFileName
      }));
      localStorage.setItem(storageKey, JSON.stringify(filesToSave));
  };

  const handleFileClick = (fileItem: UploadedFile): void => {
    // Use downloadURL from Firebase Storage if available (preferred)
    if (fileItem.downloadURL) {
      window.open(fileItem.downloadURL, '_blank');
      return;
    }
    
    // Fallback to local file blob if downloadURL is not available
    if (fileItem.file) {
      // Create a download link for the file
      const url = URL.createObjectURL(fileItem.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileItem.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      console.log('File clicked:', fileItem.name, 'but no downloadURL or file available');
    }
  };

  const tabs: TabType[] = ['informations', 'upload', 'summary'];

  const handleBack = (): void => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleNext = (): void => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const isFirstTab = activeTab === 'informations';
  const isLastTab = activeTab === 'summary';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <Background />
      <div className="upload-page-wrapper">
      {/* Header */}
      <header className="relative z-10">
        <div className="upload-header">
            <div className="header-left">
              <button className="cancel-link" onClick={() => navigate('/home')} title="Home">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
            <div className="header-center">
              <div className="tabs-container">
                <button
                  className={`tab ${activeTab === 'informations' ? 'active' : ''} ${activeTab === 'upload' || activeTab === 'summary' ? 'completed' : ''}`}
                  onClick={() => setActiveTab('informations')}
                >
                  {activeTab === 'upload' || activeTab === 'summary' ? (
                    <span className="tab-checkmark">✔</span>
                  ) : (
                    <span className="tab-number">1</span>
                  )}
                  <span className="tab-label">Informations</span>
                </button>
                <button
                  className={`tab ${activeTab === 'upload' ? 'active' : ''} ${activeTab === 'summary' ? 'completed' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  {activeTab === 'summary' ? (
                    <span className="tab-checkmark">✔</span>
                  ) : (
                    <span className="tab-number">2</span>
                  )}
                  <span className="tab-label">Upload file</span>
                </button>
                <button
                  className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('summary')}
                >
                  <span className="tab-number">3</span>
                  <span className="tab-label">Summary</span>
                </button>
              </div>
            </div>
            <div className="header-right">
              <Header showLogout={false} />
              <button 
                className="btn-back" 
                onClick={handleBack}
                disabled={isFirstTab}
              >
                Back
              </button>
              <button 
                className="btn-next" 
                onClick={handleNext}
                disabled={isLastTab}
              >
                Next
              </button>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="upload-content-wrapper">
        <div className="upload-content">
        {/* Informations Tab */}
        {activeTab === 'informations' && <InformationTab />}

        {/* Upload File Tab */}
        {activeTab === 'upload' && (
          <div className="upload-tab-wrapper">
            {/* Upload Area - Centered */}
            <div className="upload-area-container">
              <div
                className="upload-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">
                  <UploadIcon size={48} />
                </div>
                <h2 className="upload-title">Drag and drop your files here or click to upload</h2>
                <p className="upload-info">Maximum file size: 50 MB</p>
                <p className="upload-info">Supported format: .PDF</p>
                <p className="upload-info">Maximum files: 3</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* File Management Section - Only show when files are uploaded */}
            {uploadedFiles.length > 0 && (
              <div className="file-section">
                <h3 className="file-section-title">File Uploaded</h3>
                
                {/* Uploaded Files */}
                {uploadedFiles.map(file => (
                <div key={file.id}>
                  <div 
                    className="file-item clickable"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="file-icon">
                      <FileIcon size={24} />
                    </div>
                    <div className="file-details">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        <span className="file-type">{file.type}</span>
                        <span className="file-size">{file.size}</span>
                        {file.parsedResume && (
                          <span className="parsed-badge">✓ Parsed</span>
                        )}
                      </div>
                      {file.isUploading && (
                        <div className="file-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${file.progress}%` }}></div>
                          </div>
                          <span className="progress-text">{file.timeLeft}</span>
                        </div>
                      )}
                    </div>
                    <button
                      className="file-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file.id);
                      }}
                    >
                      <RemoveIcon size={16} />
                    </button>
                  </div>
                  
                  {/* Parsed Resume Preview */}
                  {file.parsedResume && (
                    <div className="parsed-resume-preview">
                      <h4 className="preview-title">📄 Parsed Resume Preview</h4>
                      {file.parsedResume.companies && file.parsedResume.companies.length > 0 && (
                        <div className="preview-companies">
                          <strong>Companies Found: {file.parsedResume.companies.length}</strong>
                          <ul>
                            {file.parsedResume.companies.slice(0, 3).map((company, idx) => (
                              <li key={idx}>
                                <strong>{company.company}</strong> - {company.position} ({company.duration})
                              </li>
                            ))}
                            {file.parsedResume.companies.length > 3 && (
                              <li>... and {file.parsedResume.companies.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                      {file.parsedResume.skills && file.parsedResume.skills.length > 0 && (
                        <div className="preview-skills">
                          <strong>Skills:</strong> {file.parsedResume.skills.slice(0, 10).join(', ')}
                          {file.parsedResume.skills.length > 10 && ` ... and ${file.parsedResume.skills.length - 10} more`}
                        </div>
                      )}
                      {file.parsedResume.education && (
                        <div className="preview-education">
                          <strong>Education:</strong> {file.parsedResume.education}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Summary Tab */}
      {activeTab === 'summary' && <SummaryTab uploadedFiles={uploadedFiles} />}
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
    </div>
  );
};

export default UploadPage;

