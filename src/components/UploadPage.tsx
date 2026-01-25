import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import Header from './Header.tsx';
import './common.css';
import './UploadPage.css';
import InformationTab from './InformationTab.tsx';
import SummaryTab from './SummaryTab.tsx';
import { UploadIcon, FileIcon, RemoveIcon } from './Icons.tsx';
import Toast from './Toast.tsx';

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

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const newFiles: UploadedFile[] = filesToAdd.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        type: 'PDF',
        size: formatFileSize(file.size),
        isUploading: false,
        progress: 100,
        file: file
      }));
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      
      // Save to localStorage for use in application form
      const filesToSave = updatedFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size
      }));
      localStorage.setItem('uploadedFiles', JSON.stringify(filesToSave));
      
      if (validFiles.length > remainingSlots) {
        setToast({ message: `Only ${remainingSlots} file(s) uploaded. Maximum 3 files allowed.`, type: 'info' });
      }
    }
  };

  const handleRemoveFile = (id: number): void => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(updatedFiles);
    
    // Update localStorage
    const filesToSave = updatedFiles.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size
    }));
    localStorage.setItem('uploadedFiles', JSON.stringify(filesToSave));
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
              <button className="cancel-link" onClick={() => navigate('/home')}>Cancel</button>
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

export default UploadPage;

