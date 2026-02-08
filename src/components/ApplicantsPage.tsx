import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import Header from './Header.tsx';
import { Background } from './Background.tsx';
import Toast from './Toast.tsx';
import './ApplicantsPage.css';

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

interface Comment {
  _id?: string;
  text: string;
  addedBy: string;
  addedByEmail: string;
  addedAt: string;
}

interface PreviousCompanyVerification {
  _id: string;
  previousCompanyName: string;
  previousCompanyEmail: string;
  position: string;
  duration?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedByEmail?: string;
  verifiedAt?: string;
  comment?: string;
}

interface CurrentCompanyVerification {
  _id: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedByEmail?: string;
  verifiedAt?: string;
  comment?: string;
  comments?: Array<{
    _id?: string;
    comment: string;
    commenterEmail: string;
    commenterName?: string;
    commentedAt: string;
  }>;
}

interface Applicant {
  _id: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl?: string;
  resumeFileName?: string; // Original filename (required for search)
  storageFileName?: string; // Sanitized filename for direct access (optional)
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  appliedDate: string;
  jobId: string;
  jobTitle?: string;
  companyName: string;
  parsedResume?: ParsedResume;
  comments?: Comment[];
  verified?: boolean;
  previousCompanyVerifications?: PreviousCompanyVerification[];
  currentCompanyVerification?: CurrentCompanyVerification;
}

const ApplicantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId?: string }>();
  const { user } = useAuth();
  const { canViewApplicants, companyName, isLoading: roleLoading } = useUserRole();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [isAddingComment, setIsAddingComment] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!roleLoading && companyName) {
      if (canViewApplicants) {
        loadApplicants();
      } else {
        setToast({ message: 'You do not have permission to view applicants. Only Admin, Manager, Recruiter, Talent Acquisition, and HR roles can view applicants.', type: 'error' });
        setTimeout(() => navigate('/home'), 2000);
      }
    }
  }, [canViewApplicants, roleLoading, companyName, jobId, user]);

  const loadApplicants = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    if (!companyName) {
      setIsLoading(false);
      setToast({ message: 'Company name not found. Please ensure you are registered with a company.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // If jobId is provided, first verify the job belongs to the user's company
      if (jobId) {
        try {
          const jobResponse = await fetch(`https://verified-resumes-be-production.up.railway.app/api/jobs/${jobId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            if (jobData.success && jobData.job) {
              const jobCompanyName = (jobData.job.companyName || jobData.job.company || '').trim().toLowerCase();
              const userCompanyName = companyName.trim().toLowerCase();
              
              if (jobCompanyName !== userCompanyName) {
                setToast({ 
                  message: 'You do not have permission to view applicants for this job. This job belongs to a different company.', 
                  type: 'error' 
                });
                setTimeout(() => navigate('/home'), 2000);
                setApplicants([]);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (jobError) {
          console.error('Error verifying job ownership:', jobError);
          // Continue anyway - backend will also verify
        }
      }
      
      let url = '';
      
      if (jobId) {
        // Get applications for a specific job - send both companyName and userEmail for authorization
        url = `https://verified-resumes-be-production.up.railway.app/api/applications/job/${jobId}?companyName=${encodeURIComponent(companyName)}&userEmail=${encodeURIComponent(user.email)}`;
      } else {
        // Get all applications for the company - send both companyName and userEmail for authorization
        url = `https://verified-resumes-be-production.up.railway.app/api/applications/company/${encodeURIComponent(companyName)}?userEmail=${encodeURIComponent(user.email)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        // Additional security check: filter out any applicants that don't belong to this company
        const filteredApplicants = (data.applications || []).filter((app: Applicant) => 
          (app.companyName || '').trim().toLowerCase() === companyName.trim().toLowerCase()
        );
        
        // Debug: Log verification data to check if backend is returning all verifications
        filteredApplicants.forEach((app: Applicant) => {
          if (app.previousCompanyVerifications && app.previousCompanyVerifications.length > 0) {
            const verifiedCount = app.previousCompanyVerifications.filter(v => v.verified).length;
            const pendingCount = app.previousCompanyVerifications.filter(v => !v.verified).length;
            console.log(`Applicant ${app.applicantName}: ${verifiedCount} verified, ${pendingCount} pending verifications`);
          }
        });
        
        setApplicants(filteredApplicants);
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

  const handleViewResume = async (applicationId: string, resumeFileName: string, applicantEmail: string, resumeUrl?: string, download: boolean = false) => {
    if (!user?.email || !companyName) {
      setToast({ message: 'Authorization required to view resume.', type: 'error' });
      return;
    }

    // Prefer resumeFileName over resumeUrl when available
    // Backend search endpoint handles both original (resumeFileName) and sanitized (storageFileName) filenames
    // For direct access, prefer storageFileName if available, otherwise use resumeFileName
    if (resumeFileName) {
      if (!applicantEmail) {
        setToast({ message: 'Applicant email is required to view resume.', type: 'error' });
        return;
      }
      
      try {
        // Use storageFileName for direct access if available, otherwise fall back to resumeFileName
        // The backend search endpoint handles both original and sanitized filenames
        const fileNameToUse = resumeFileName; // Backend handles both original and sanitized
        const encodedFileName = encodeURIComponent(fileNameToUse);
        const encodedEmail = encodeURIComponent(applicantEmail);
        
        // Fetch resume info and download URL using the new endpoint
        // Include userEmail query parameter to help backend locate the file
        const response = await fetch(
          `https://verified-resumes-be-production.up.railway.app/api/resumes/${encodedFileName}?userEmail=${encodedEmail}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json().catch(() => ({ message: 'Resume not found' }));
            setToast({ message: errorData.message || 'Resume file not found. It may have been deleted or moved.', type: 'error' });
            return;
          }
          throw new Error(`Failed to fetch resume: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          setToast({ message: data.message || 'Failed to load resume.', type: 'error' });
          return;
        }

        // Use downloadURL or downloadUrl from the API response
        const downloadURL = data.downloadURL || data.downloadUrl;
        if (downloadURL) {
          if (download) {
            // Force download
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = resumeFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setToast({ message: 'Resume downloaded successfully!', type: 'success' });
          } else {
            // Open the Firebase Storage URL directly in a new tab
            window.open(downloadURL, '_blank');
            setToast({ message: 'Resume opened successfully!', type: 'success' });
          }
          return;
        } else {
          setToast({ message: 'Resume download URL not available.', type: 'error' });
          return;
        }
      } catch (error) {
        console.error('Error viewing resume:', error);
        setToast({ message: 'Failed to view resume. Please try again.', type: 'error' });
        return;
      }
    }
    
    // Fallback to resumeUrl if available
    if (resumeUrl) {
      if (download) {
        const link = document.createElement('a');
        link.href = resumeUrl;
        link.download = resumeFileName || 'resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ message: 'Resume downloaded successfully!', type: 'success' });
      } else {
        window.open(resumeUrl, '_blank');
        setToast({ message: 'Resume opened successfully!', type: 'success' });
      }
      return;
    }

    // No resume available
    setToast({ message: 'Resume filename or URL is missing.', type: 'error' });
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    if (!user?.email) return;

    try {
      const response = await fetch(`https://verified-resumes-be-production.up.railway.app/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          userEmail: user.email
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


  const handleAddComment = async (applicationId: string) => {
    if (!user?.email || !newComment[applicationId]?.trim()) return;

    setIsAddingComment(prev => ({ ...prev, [applicationId]: true }));
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const response = await fetch(`https://verified-resumes-be-production.up.railway.app/api/applications/${applicationId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newComment[applicationId],
          userEmail: user.email,
          addedBy: userData.name || user.email,
          addedByEmail: user.email
        })
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'Comment added successfully!', type: 'success' });
        setNewComment(prev => ({ ...prev, [applicationId]: '' }));
        loadApplicants(); // Reload to get updated data
      } else {
        setToast({ message: data.message || 'Failed to add comment.', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setToast({ message: 'Failed to add comment. Please try again.', type: 'error' });
    } finally {
      setIsAddingComment(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const filteredApplicants = useMemo(() => {
    let filtered = applicants;

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by search query (name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(app => 
        app.applicantName.toLowerCase().includes(query) ||
        app.applicantEmail.toLowerCase().includes(query) ||
        (app.jobTitle && app.jobTitle.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [applicants, statusFilter, searchQuery]);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
        <Background />
        <Header showLogout={true} onBack={() => navigate('/home')} />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 dark:text-slate-400 font-medium">Loading applicants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="applicants-page-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300 flex flex-col perspective-container">
      {/* Same background gradients as NewLandingPage */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Gradients for atmosphere */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/20 dark:bg-blue-700/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-[120px]"></div>
      </div>
      <Background />
      <Header showLogout={true} onBack={() => navigate('/home')} />
      
      <div className="applicants-container">
        <div className="applicants-header">
          <h1 className="applicants-title">
            {jobId ? 'Job Applicants' : 'Company Applicants'}
          </h1>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-group">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-group">
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
        </div>

        {/* Applicants Table */}
        {filteredApplicants.length === 0 ? (
          <div className="empty-state">
            <p>No applicants found.</p>
          </div>
        ) : (
          <div className="applicants-table-wrapper">
            <table className="applicants-table">
              <thead>
                <tr>
                  <th className="th-name">Name</th>
                  <th className="th-email">Email</th>
                  <th className="th-job">Job Title</th>
                  <th className="th-date">Applied Date</th>
                  <th className="th-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((applicant) => {
                  const isExpanded = expandedApplicant === applicant._id;
                  return (
                    <React.Fragment key={applicant._id}>
                      <tr 
                        className={`applicant-row ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedApplicant(isExpanded ? null : applicant._id)}
                      >
                        <td className="applicant-name-cell">
                          <div className="applicant-name-content">
                            <span className="expand-indicator">{isExpanded ? '▼' : '▶'}</span>
                            <span className="applicant-name">{applicant.applicantName}</span>
                            {applicant.verified && (
                              <span className="verified-badge-small" title="Verified">✓</span>
                            )}
                          </div>
                        </td>
                        <td className="applicant-email-cell">
                          {applicant.applicantEmail}
                        </td>
                        <td className="applicant-job-cell">
                          {applicant.jobTitle || '-'}
                        </td>
                        <td className="applicant-date-cell">
                          {formatDate(applicant.appliedDate)}
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${getStatusBadgeClass(applicant.status)}`}>
                            {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="applicant-details-row">
                          <td colSpan={5} className="applicant-details-cell">
                            <div className="applicant-details-content">
                              {/* Resume Section */}

                              {/* Resume Section */}
                              {(applicant.resumeFileName || applicant.resumeUrl) && (
                                <div className="resume-section">
                                  <h4 className="section-title">Resume PDF</h4>
                                  <div className="resume-info">
                                    <p className="resume-filename">
                                      <strong>File:</strong> {applicant.resumeFileName || 'resume.pdf'}
                                    </p>
                                  </div>
                                  <div className="resume-actions">
                                    <button
                                      onClick={() => handleViewResume(applicant._id, applicant.resumeFileName || '', applicant.applicantEmail, applicant.resumeUrl, false)}
                                      className="view-resume-btn"
                                      title="View resume PDF in new tab"
                                    >
                                      👁️ View Resume PDF
                                    </button>
                                    <button
                                      onClick={() => handleViewResume(applicant._id, applicant.resumeFileName || '', applicant.applicantEmail, applicant.resumeUrl, true)}
                                      className="download-resume-btn"
                                      title="Download resume PDF"
                                    >
                                      ⬇️ Download Resume PDF
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Previous Company Verifications */}
                              <div className="previous-company-section">
                                <h4 className="section-title">Previous Company Verifications</h4>
                                {applicant.previousCompanyVerifications && applicant.previousCompanyVerifications.length > 0 ? (
                                  applicant.previousCompanyVerifications.map((verification, idx) => {
                                    const isPending = !verification.verified;
                                    return (
                                      <div 
                                        key={verification._id || idx} 
                                        className={`verification-item ${verification.verified ? 'verified-item' : 'pending-item'}`}
                                      >
                                        <div className="verification-header-item">
                                          <div className="verification-company-info">
                                            <span className="company-name-badge">{verification.previousCompanyName}</span>
                                            <span className="position-badge">{verification.position}</span>
                                            {verification.duration && (
                                              <span className="duration-badge">{verification.duration}</span>
                                            )}
                                          </div>
                                          <div className={`verification-status-badge ${verification.verified ? 'verified' : 'pending'}`}>
                                            {verification.verified ? '✓ Verified' : '⏳ Pending Verification'}
                                          </div>
                                        </div>
                                        {verification.verified ? (
                                          <div className="verification-details">
                                            {verification.verifiedBy && (
                                              <p className="verified-by">
                                                Verified by: <strong>{verification.verifiedBy}</strong>
                                                {verification.verifiedAt && (
                                                  <span className="verified-date"> on {formatDate(verification.verifiedAt)}</span>
                                                )}
                                              </p>
                                            )}
                                            {verification.comment && (
                                              <div className="verification-comment-box">
                                                <span className="comment-label">Comment:</span>
                                                <p className="comment-content">{verification.comment}</p>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="verification-details">
                                            <p className="pending-verification-message">
                                              ⏳ Verification request sent to <strong>{verification.previousCompanyName}</strong>. 
                                              Waiting for verification from previous company.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="no-verifications">
                                    <p className="no-verifications-text">No previous company verifications requested yet.</p>
                                  </div>
                                )}
                              </div>

                              {/* Parsed Resume Data - Filtered to Current Company Only */}
                              {applicant.parsedResume && (() => {
                                // Filter to show only the current company's entry
                                const getMatchingCompany = (): ParsedCompany | null => {
                                  if (!applicant.parsedResume?.companies || applicant.parsedResume.companies.length === 0) {
                                    return null;
                                  }

                                  // If backend already filtered to single entry, use it
                                  if (applicant.parsedResume.companies.length === 1) {
                                    return applicant.parsedResume.companies[0];
                                  }

                                  // Otherwise, try to match by company name (case-insensitive, partial match)
                                  const targetCompanyName = companyName?.toLowerCase().trim();
                                  if (!targetCompanyName) {
                                    return null; // Don't show any if no company name
                                  }

                                  const matchingCompany = applicant.parsedResume.companies.find(company => {
                                    const companyNameLower = company.company.toLowerCase().trim();
                                    return companyNameLower === targetCompanyName || 
                                           companyNameLower.includes(targetCompanyName) ||
                                           targetCompanyName.includes(companyNameLower);
                                  });

                                  return matchingCompany || null;
                                };

                                const matchingCompany = getMatchingCompany();

                                if (!matchingCompany) {
                                  return null; // Don't show parsed data if no matching company
                                }

                                return (
                                  <div className="parsed-resume-section">
                                    <h4 className="section-title">Work Experience at {matchingCompany.company}</h4>
                                    
                                    {/* Show Only Matching Company Entry */}
                                    <div className="parsed-companies">
                                      <div className="parsed-company">
                                        <div className="company-header">
                                          <span className="company-name">{matchingCompany.company}</span>
                                          <span className="company-position">{matchingCompany.position}</span>
                                          {matchingCompany.duration && (
                                            <span className="company-duration">{matchingCompany.duration}</span>
                                          )}
                                        </div>
                                        {matchingCompany.details && matchingCompany.details.length > 0 && (
                                          <ul className="company-details">
                                            {matchingCompany.details.map((detail, detailIdx) => (
                                              <li key={detailIdx}>{detail}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    </div>

                                    {/* Skills */}
                                    {applicant.parsedResume.skills && applicant.parsedResume.skills.length > 0 && (
                                      <div className="parsed-skills">
                                        <h5 className="parsed-subtitle">Skills</h5>
                                        <div className="skills-list">
                                          {applicant.parsedResume.skills.map((skill, idx) => (
                                            <span key={idx} className="skill-badge">{skill}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Education */}
                                    {applicant.parsedResume.education && (
                                      <div className="parsed-education">
                                        <h5 className="parsed-subtitle">Education</h5>
                                        <p className="education-text">{applicant.parsedResume.education}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Current Company Verification Comments */}
                              {applicant.currentCompanyVerification && (
                                <div className="verification-comments-section">
                                  <h4 className="section-title">Verification Comments</h4>
                                  {applicant.currentCompanyVerification.verified && applicant.currentCompanyVerification.comment && (
                                    <div className="verification-comment-box">
                                      <div className="comment-header">
                                        <span className="comment-author">{applicant.currentCompanyVerification.verifiedBy || applicant.currentCompanyVerification.verifiedByEmail}</span>
                                        {applicant.currentCompanyVerification.verifiedAt && (
                                          <span className="comment-date">{formatDate(applicant.currentCompanyVerification.verifiedAt)}</span>
                                        )}
                                      </div>
                                      <p className="comment-text">{applicant.currentCompanyVerification.comment}</p>
                                    </div>
                                  )}
                                  {applicant.currentCompanyVerification.comments && applicant.currentCompanyVerification.comments.length > 0 && (
                                    <div className="verification-comments-list">
                                      {applicant.currentCompanyVerification.comments.map((comment, idx) => (
                                        <div key={comment._id || idx} className="comment-item">
                                          <div className="comment-header">
                                            <span className="comment-author">{comment.commenterName || comment.commenterEmail}</span>
                                            <span className="comment-date">{formatDate(comment.commentedAt)}</span>
                                          </div>
                                          <p className="comment-text">{comment.comment}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {(!applicant.currentCompanyVerification.comment && (!applicant.currentCompanyVerification.comments || applicant.currentCompanyVerification.comments.length === 0)) && (
                                    <p className="no-comments">No verification comments yet.</p>
                                  )}
                                </div>
                              )}

                              {/* Cover Letter */}
                              {applicant.coverLetter && (
                                <div className="cover-letter-section">
                                  <h4 className="section-title">Cover Letter</h4>
                                  <p className="cover-letter-text">{applicant.coverLetter}</p>
                                </div>
                              )}

                              {/* Comments Section */}
                              <div className="comments-section">
                                <div className="comments-header">
                                  <h4 className="section-title">Comments</h4>
                                </div>
                                
                                <div className="comments-content">
                                  {/* Existing Comments */}
                                  {applicant.comments && applicant.comments.length > 0 ? (
                                    <div className="comments-list">
                                      {applicant.comments.map((comment, idx) => (
                                        <div key={comment._id || idx} className="comment-item">
                                          <div className="comment-header">
                                            <span className="comment-author">{comment.addedBy}</span>
                                            <span className="comment-date">{formatDate(comment.addedAt)}</span>
                                          </div>
                                          <p className="comment-text">{comment.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="no-comments">No comments yet.</p>
                                  )}

                                  {/* Add Comment Form */}
                                  <div className="add-comment-form">
                                    <textarea
                                      className="comment-input"
                                      placeholder="Add a comment..."
                                      value={newComment[applicant._id] || ''}
                                      onChange={(e) => setNewComment(prev => ({ ...prev, [applicant._id]: e.target.value }))}
                                      rows={3}
                                    />
                                    <button
                                      className="add-comment-btn"
                                      onClick={() => handleAddComment(applicant._id)}
                                      disabled={!newComment[applicant._id]?.trim() || isAddingComment[applicant._id]}
                                    >
                                      {isAddingComment[applicant._id] ? 'Adding...' : 'Add Comment'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="applicant-actions">
                                <div className="action-group">
                                  <label className="action-label">Update Status:</label>
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
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
