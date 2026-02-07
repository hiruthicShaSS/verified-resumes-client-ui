import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import Header from './Header.tsx';
import Toast from './Toast.tsx';
import './ApplicantsPage.css';

interface Applicant {
  _id: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl?: string;
  resumeFileName?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  appliedDate: string;
  jobId: string;
  jobTitle?: string;
  companyName: string;
}

const ApplicantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId?: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { canViewApplicants, companyName, isLoading: roleLoading } = useUserRole();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!roleLoading) {
      if (canViewApplicants) {
        loadApplicants();
      } else {
        setToast({ message: 'You do not have permission to view applicants. Only Admin, Manager, Recruiter, Talent Acquisition, and HR roles can view applicants.', type: 'error' });
        setTimeout(() => navigate('/home'), 2000);
      }
    }
  }, [canViewApplicants, roleLoading, jobId, user]);

  const loadApplicants = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let url = '';
      
      if (jobId) {
        // Get applications for a specific job
        url = `http://localhost:5000/api/applications/job/${jobId}?companyEmail=${encodeURIComponent(user.email)}`;
      } else {
        // Get all applications for the company
        // Use companyName if available, otherwise extract from email domain
        const companyNameToUse = companyName || (user.email.includes('@') 
          ? user.email.split('@')[1].split('.')[0] 
          : '');
        
        if (!companyNameToUse) {
          setToast({ message: 'Unable to determine company information.', type: 'error' });
          setIsLoading(false);
          return;
        }
        
        url = `http://localhost:5000/api/applications/company/${encodeURIComponent(companyNameToUse)}?companyEmail=${encodeURIComponent(user.email)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setApplicants(data.applications || []);
      } else {
        setToast({ message: data.message || 'Failed to load applicants.', type: 'error' });
        setApplicants([]);
      }
    } catch (error) {
      console.error('Error loading applicants:', error);
      setToast({ message: 'Failed to load applicants. Please try again.', type: 'error' });
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    if (!user?.email) return;

    try {
      const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          companyEmail: user.email
        })
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'Application status updated successfully!', type: 'success' });
        loadApplicants(); // Reload to get updated data
      } else {
        setToast({ message: data.message || 'Failed to update status.', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ message: 'Failed to update status. Please try again.', type: 'error' });
    }
  };

  const filteredApplicants = statusFilter === 'All' 
    ? applicants 
    : applicants.filter(app => app.status === statusFilter);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'status-badge accepted';
      case 'rejected':
        return 'status-badge rejected';
      case 'reviewed':
        return 'status-badge reviewed';
      default:
        return 'status-badge pending';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (roleLoading || isLoading) {
    return (
      <div className={`applicants-page theme-${theme}`}>
        <Header showLogout={true} onBack={() => navigate('/home')} />
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Loading applicants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`applicants-page theme-${theme}`}>
      <Header showLogout={true} onBack={() => navigate('/home')} />
      
      <div className="applicants-container">
        <div className="applicants-header">
          <h1 className="applicants-title">
            {jobId ? 'Job Applicants' : 'Company Applicants'}
          </h1>
          {companyName && (
            <p className="company-name">{companyName}</p>
          )}
        </div>

        {/* Status Filter */}
        <div className="filters-section">
          <label className="filter-label">Filter by Status:</label>
          <select
            className="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Applicants List */}
        {filteredApplicants.length === 0 ? (
          <div className="empty-state">
            <p>No applicants found.</p>
          </div>
        ) : (
          <div className="applicants-list">
            {filteredApplicants.map((applicant) => (
              <div key={applicant._id} className="applicant-card">
                <div className="applicant-header">
                  <div className="applicant-info">
                    <h3 className="applicant-name">{applicant.applicantName}</h3>
                    <p className="applicant-email">{applicant.applicantEmail}</p>
                    {applicant.jobTitle && (
                      <p className="job-title">Applied for: {applicant.jobTitle}</p>
                    )}
                    <p className="applied-date">Applied on: {formatDate(applicant.appliedDate)}</p>
                  </div>
                  <div className={`status-badge ${getStatusBadgeClass(applicant.status)}`}>
                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                  </div>
                </div>

                {/* Resume Section */}
                {applicant.resumeUrl && (
                  <div className="resume-section">
                    <h4 className="section-title">Resume</h4>
                    <div className="resume-actions">
                      <a
                        href={applicant.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-resume-btn"
                      >
                        📄 View Resume ({applicant.resumeFileName || 'resume.pdf'})
                      </a>
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {applicant.coverLetter && (
                  <div className="cover-letter-section">
                    <h4 className="section-title">Cover Letter</h4>
                    <p className="cover-letter-text">{applicant.coverLetter}</p>
                  </div>
                )}

                {/* Status Update Actions */}
                <div className="applicant-actions">
                  <select
                    className="status-select"
                    value={applicant.status}
                    onChange={(e) => updateApplicationStatus(applicant._id, e.target.value as any)}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

export default ApplicantsPage;
