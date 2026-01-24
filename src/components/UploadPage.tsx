import React, { useState, useRef } from 'react';
import './common.css';
import './UploadPage.css';
import InformationTab from './InformationTab.tsx';
import SummaryTab from './SummaryTab.tsx';
import { UploadIcon, FileIcon, RemoveIcon } from './Icons.tsx';

interface UploadedFile {
  id: number;
  name: string;
  type: string;
  size: string;
  isUploading: boolean;
  progress: number;
  timeLeft?: string;
  file: File | null;
}

type TabType = 'informations' | 'upload' | 'summary';
type ThemeType = 'dark' | 'light';

const UploadPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [theme, setTheme] = useState<ThemeType>('dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = (): void => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

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

  const handleFiles = (files: File[]): void => {
    // Check if adding these files would exceed the limit of 3
    const remainingSlots = 3 - uploadedFiles.length;
    if (remainingSlots <= 0) {
      alert('Maximum 3 files allowed. Please remove a file before uploading a new one.');
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
      const newFiles: UploadedFile[] = filesToAdd.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        type: 'PDF',
        size: formatFileSize(file.size),
        isUploading: false,
        progress: 100,
        file: file
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      
      if (validFiles.length > remainingSlots) {
        alert(`Only ${remainingSlots} file(s) uploaded. Maximum 3 files allowed.`);
      }
    }
  };

  const handleRemoveFile = (id: number): void => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  const handleFileClick = (fileItem: UploadedFile): void => {
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
      console.log('File clicked:', fileItem.name);
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
    <div className={`upload-page-wrapper theme-${theme}`}>
      {/* Header */}
      <header className="upload-header-wrapper">
        <div className="upload-header">
            <div className="header-left">
              <button className="cancel-link">Cancel</button>
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
              <button 
                className="theme-toggle-btn" 
                onClick={toggleTheme} 
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
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
                <div 
                  key={file.id} 
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
                ))}
              </div>
            )}
          </div>
        )}

      {/* Summary Tab */}
      {activeTab === 'summary' && <SummaryTab uploadedFiles={uploadedFiles} />}
        </div>
      </main>
    </div>
  );
};

export default UploadPage;

