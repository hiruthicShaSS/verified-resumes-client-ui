import React from 'react';
import './common.css';
import './SummaryTab.css';

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

interface SummaryTabProps {
  uploadedFiles: UploadedFile[];
}

const SummaryTab: React.FC<SummaryTabProps> = ({ uploadedFiles }) => {
  return (
    <div className="summary-tab-wrapper">
      <div className="summary-tab-content">
        <h2 className="tab-content-title">Summary</h2>
        <div className="summary-section">
          <h3 className="summary-subtitle">Uploaded Files</h3>
          {uploadedFiles.length > 0 ? (
            <ul className="summary-list">
              {uploadedFiles.map(file => (
                <li key={file.id} className="summary-item">
                  <span className="summary-file-name">{file.name}</span>
                  <span className="summary-file-size">{file.size}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="summary-empty">No files uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;

