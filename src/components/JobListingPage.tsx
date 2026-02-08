import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import Header from './Header.tsx';
import { Background } from './Background.tsx';
import './common.css';
import './JobListingPage.css';
import Toast from './Toast.tsx';

type TabType = 'search' | 'saved' | 'applied';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedDate: string;
  description: string;
  salary?: string;
  companyName?: string;
}

interface Comment {
  _id?: string;
  text: string;
  addedBy: string;
  addedByEmail: string;
  addedAt: string;
}

interface AppliedJob {
  _id: string;
  jobId: string;
  applicantEmail: string;
  applicantName: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  jobTitle?: string;
  companyName?: string;
  comments?: Comment[];
}

const JobListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canViewApplicants, companyName, isAdmin, isCompanyMember } = useUserRole();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [allJobs, setAllJobs] = useState<Job[]>([]); // Store all fetched jobs
  const [jobs, setJobs] = useState<Job[]>([]); // Filtered jobs for display
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState<boolean>(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('https://verified-resumes-be-production.up.railway.app/api/jobs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.jobs) {
        // Show ALL jobs to everyone - users can apply to jobs from any company
        // Company filtering only applies to "View Applicants" button visibility
        
        // Sort by posted date (newest first)
        const sortedJobs = [...data.jobs].sort((a: any, b: any) => {
          const dateA = new Date(a.postedDate || 0).getTime();
          const dateB = new Date(b.postedDate || 0).getTime();
          return dateB - dateA;
        });
        
        const transformedJobs: Job[] = sortedJobs.map((job: any) => ({
          id: job.id || Math.random().toString(),
          title: job.role || 'Untitled Position',
          company: job.company || job.companyName || 'Company',
          location: job.location || 'Location',
          type: job.type || job.jobType || 'Full-time',
          postedDate: job.postedDate ? formatDate(job.postedDate) : 'Recently posted',
          description: `${job.aboutJob || ''}\n\nCompany Overview:\n${job.companyOverview || ''}\n\nJob Description:\n${job.jobDescription || ''}\n\nPreferred Qualifications:\n${job.preferredQualifications || ''}\n\nMinimum Qualifications:\n${job.minimumQualifications || ''}`,
          salary: job.salary,
          postedBy: job.postedBy || 'Anonymous',
          companyName: job.companyName || job.company // Store company name for filtering
        }));
        
        setAllJobs(transformedJobs); // Store all jobs
        setJobs(transformedJobs); // Initially show all jobs
        if (transformedJobs.length > 0) {
          setSelectedJob(transformedJobs[0]);
          setHasSearched(true);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job listings';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch applied jobs from API
  const fetchAppliedJobs = async () => {
    if (!user?.email) {
      setAppliedJobs([]);
      return;
    }

    try {
      setIsLoadingApplications(true);
      const response = await fetch(`https://verified-resumes-be-production.up.railway.app/api/applications/my-applications?applicantEmail=${encodeURIComponent(user.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.applications) {
        setAppliedJobs(data.applications || []);
      } else {
        setAppliedJobs([]);
      }
    } catch (err) {
      console.error('Error fetching applied jobs:', err);
      setAppliedJobs([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
  }, [user]);

  // Refresh applied jobs when tab changes to 'applied'
  useEffect(() => {
    if (activeTab === 'applied' && user?.email) {
      fetchAppliedJobs();
    }
  }, [activeTab, user]);

  const tabs: TabType[] = ['search', 'saved', 'applied'];

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

  const isFirstTab = activeTab === 'search';
  const isLastTab = activeTab === 'applied';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If jobs haven't been loaded yet, fetch them first
    if (allJobs.length === 0 && !isLoading) {
      await fetchJobs();
      // After fetching, continue with filtering using the newly fetched jobs
      // Note: fetchJobs will set allJobs and jobs, so we filter from allJobs
    }
    
    // Use allJobs for filtering (contains all fetched jobs)
    const jobsToFilter = allJobs.length > 0 ? allJobs : jobs;
    
    // Filter jobs based on search criteria
    let filteredJobs = jobsToFilter;
    
    if (searchQuery.trim() || location.trim()) {
      filteredJobs = jobsToFilter.filter((job: Job) => {
        const matchesQuery = !searchQuery.trim() || 
          job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = !location.trim() ||
          job.location?.toLowerCase().includes(location.toLowerCase());
        return matchesQuery && matchesLocation;
      });
    }
    
    setJobs(filteredJobs);
    if (filteredJobs.length > 0) {
      setSelectedJob(filteredJobs[0]);
    } else {
      setSelectedJob(null);
    }
    setHasSearched(true);
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
  };

  const handleApply = () => {
    if (selectedJob) {
      navigate(`/apply-job/${selectedJob.id}`);
    }
  };

  const handleSave = () => {
    if (selectedJob) {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      if (!savedJobs.find((j: Job) => j.id === selectedJob.id)) {
        savedJobs.push(selectedJob);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        setToast({ message: `Saved ${selectedJob.title} at ${selectedJob.company}`, type: 'success' });
        setRefreshKey(prev => prev + 1); // Force refresh
      } else {
        setToast({ message: 'Job already saved', type: 'info' });
      }
    }
  };

  return (
    <div className="job-listing-page-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <Background />
      {/* Header */}
      <header className="job-listing-header-wrapper">
        <div className="max-w-[1400px] mx-auto w-full"> 
         <div className="job-listing-header">
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
                className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                <span className="tab-number">1</span>
                <span className="tab-label">Search</span>
              </button>
              <button
                className={`tab ${activeTab === 'saved' ? 'active' : ''} ${activeTab === 'applied' ? 'completed' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                {activeTab === 'applied' ? (
                  <span className="tab-checkmark">✔</span>
                ) : (
                  <span className="tab-number">2</span>
                )}
                <span className="tab-label">Saved</span>
              </button>
              <button
                className={`tab ${activeTab === 'applied' ? 'active' : ''}`}
                onClick={() => setActiveTab('applied')}
              >
                <span className="tab-number">3</span>
                <span className="tab-label">Applied</span>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="job-listing-content-wrapper">
        <div className="job-listing-content">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="search-tab-wrapper">
              {isLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <span>Loading job listings...</span>
                </div>
              ) : error ? (
                <div className="error-state">
                  <div className="empty-state-icon">⚠️</div>
                  <h3 className="empty-state-title">Error Loading Jobs</h3>
                  <p className="empty-state-text">{error}</p>
                  <button className="retry-btn" onClick={fetchJobs}>
                    Retry
                  </button>
                </div>
              ) : !hasSearched ? (
                <div className="tab-content">
                  <h2 className="tab-content-title">Job Search</h2>
                  <p className="tab-content-text">
                    Search for job opportunities that match your skills and preferences.
                  </p>
                  
                  {/* Search Form */}
                  <form onSubmit={handleSearch} className="search-form">
                    <div className="form-group">
                      <label htmlFor="search-query" className="form-label">Job Title or Keywords</label>
                      <input
                        id="search-query"
                        type="text"
                        className="search-input"
                        placeholder="e.g., Software Developer, Data Scientist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="location" className="form-label">Location</label>
                      <input
                        id="location"
                        type="text"
                        className="location-input"
                        placeholder="e.g., Chennai, India"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="search-submit-btn">
                      Search Jobs
                    </button>
                  </form>

                  {/* Empty State */}
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3 className="empty-state-title">Ready to search</h3>
                    <p className="empty-state-text">
                      Enter your search criteria above to find job opportunities.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="jobs-layout">
                  {/* Left Panel - Job List */}
                  <div className="job-list-panel">
                    <div className="panel-header">
                      <h3 className="panel-title">Job Results</h3>
                      <p className="results-count">{jobs.length} jobs found</p>
                    </div>
                    <div className="job-list">
                      {jobs.length === 0 ? (
                        <div className="empty-job-list">
                          <div className="empty-state-icon">🔍</div>
                          <h3 className="empty-state-title">No jobs found</h3>
                          <p className="empty-state-text">
                            Jobs will appear here when API is connected.
                          </p>
                        </div>
                      ) : (
                        jobs.map((job) => (
                          <div
                            key={job.id}
                            className={`job-card ${selectedJob?.id === job.id ? 'selected' : ''}`}
                            onClick={() => handleJobSelect(job)}
                          >
                            <div className="job-card-content">
                              <h4 className="job-title-small">{job.title}</h4>
                              <p className="company-name-small">{job.company}</p>
                              <p className="job-location-small">{job.location}</p>
                              <div className="job-meta-small">
                                <span className="job-type-small">{job.type}</span>
                                <span className="job-date-small">{job.postedDate}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Panel - Job Details */}
                  <div className="job-details-panel">
                    {selectedJob ? (
                      <div className="job-details-content">
                        <div className="job-details-header">
                          <button className="action-btn share-btn" onClick={handleApply}>
                            ↗
                          </button>
                        </div>
                        <h1 className="job-title-large">{selectedJob.title}</h1>
                        <p className="company-name-large">{selectedJob.company}</p>
                        <p className="job-location-large">{selectedJob.location}</p>
                        <div className="job-meta-large">
                          <span>{selectedJob.postedDate}</span>
                          {selectedJob.salary && (
                            <>
                              <span>•</span>
                              <span>{selectedJob.salary}</span>
                            </>
                          )}
                        </div>
                        <div className="job-type-badge">
                          <span className="type-icon">✓</span>
                          <span>{selectedJob.type}</span>
                        </div>
                        <div className="action-buttons">
                          {canViewApplicants && selectedJob.companyName && 
                           companyName && 
                           selectedJob.companyName.trim().toLowerCase() === companyName.trim().toLowerCase() ? (
                            <>
                              <button 
                                className="view-applicants-btn" 
                                onClick={() => navigate(`/applicants/job/${selectedJob.id}`)}
                              >
                                👥 View Applicants
                              </button>
                              <button className="save-btn" onClick={handleSave}>
                                Save
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="apply-btn" onClick={handleApply}>
                                Apply <span>↗</span>
                              </button>
                              <button className="save-btn" onClick={handleSave}>
                                Save
                              </button>
                            </>
                          )}
                        </div>
                        <div className="job-description">
                          <h3>About the job</h3>
                          <div className="job-description-text">
                            {selectedJob.description.split('\n').map((line, index) => {
                              if (!line.trim()) return null;
                              if (line.trim().startsWith('•')) {
                                return <li key={index} className="bullet-point">{line.trim().substring(1).trim()}</li>;
                              }
                              return <p key={index}>{line}</p>;
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-selection">
                        <div className="empty-state-icon">📋</div>
                        <h3 className="empty-state-title">Select a job</h3>
                        <p className="empty-state-text">
                          Click on a job from the list to view its details.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === 'saved' && (
            <div className="saved-tab-wrapper">
              <div className="tab-content">
                <h2 className="tab-content-title">Saved Jobs</h2>
                <p className="tab-content-text">
                  View and manage jobs you've saved for later.
                </p>

                {/* Saved Jobs List */}
                {(() => {
                  const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
                  // Use refreshKey to force re-render when saved jobs change
                  void refreshKey;
                  return savedJobs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">⭐</div>
                      <h3 className="empty-state-title">No saved jobs</h3>
                      <p className="empty-state-text">
                        Jobs you save will appear here for easy access.
                      </p>
                    </div>
                  ) : (
                    <div className="saved-jobs-list">
                      {savedJobs.map((job: Job) => (
                        <div key={job.id} className="saved-job-card">
                          <h3 className="saved-job-title">{job.title}</h3>
                          <p className="saved-job-company">{job.company}</p>
                          <p className="saved-job-location">{job.location}</p>
                          <div className="saved-job-actions">
                            <button 
                              className="apply-btn-small" 
                              onClick={() => navigate(`/apply-job/${job.id}`)}
                            >
                              Apply
                            </button>
                            <button 
                              className="remove-btn-small" 
                              onClick={() => {
                                const updated = savedJobs.filter((j: Job) => j.id !== job.id);
                                localStorage.setItem('savedJobs', JSON.stringify(updated));
                                setRefreshKey(prev => prev + 1); // Force refresh
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Applied Tab */}
          {activeTab === 'applied' && (
            <div className="applied-tab-wrapper">
              <div className="tab-content">
                <h2 className="tab-content-title">Applied Jobs</h2>
                <p className="tab-content-text">
                  Track the status of jobs you've applied to.
                </p>

                {/* Applied Jobs List */}
                {isLoadingApplications ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">⏳</div>
                    <h3 className="empty-state-title">Loading applications...</h3>
                  </div>
                ) : (() => {
                  // Match applied jobs with fetched jobs
                  const matchedAppliedJobs = appliedJobs.map((app: AppliedJob) => {
                    const job = allJobs.find((j: Job) => j.id === app.jobId);
                    return job ? {
                      ...job,
                      applicationDate: app.appliedDate,
                      applicationStatus: app.status,
                      applicationId: app._id
                    } : {
                      id: app.jobId,
                      title: app.jobTitle || 'Unknown Position',
                      company: app.companyName || 'Company',
                      location: 'Unknown',
                      type: 'Unknown',
                      postedDate: 'Unknown',
                      description: '',
                      applicationDate: app.appliedDate,
                      applicationStatus: app.status,
                      applicationId: app._id
                    };
                  });

                  return matchedAppliedJobs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3 className="empty-state-title">No applications yet</h3>
                      <p className="empty-state-text">
                        Applications you submit will be tracked here.
                      </p>
                    </div>
                  ) : (
                    <div className="saved-jobs-list">
                      {matchedAppliedJobs.map((job: any) => {
                        const application = appliedJobs.find((app: AppliedJob) => app._id === job.applicationId);
                        return (
                          <div key={job.applicationId || job.id} className="saved-job-card">
                            <h3 className="saved-job-title">{job.title}</h3>
                            <p className="saved-job-company">{job.company || 'Company'}</p>
                            <p className="saved-job-location">
                              Applied on {job.applicationDate ? new Date(job.applicationDate).toLocaleDateString() : 'Recently'}
                            </p>
                            <div className={`status-badge ${job.applicationStatus === 'accepted' ? 'status-accepted' : job.applicationStatus === 'rejected' ? 'status-rejected' : job.applicationStatus === 'reviewed' ? 'status-reviewed' : job.applicationStatus === 'pending' ? 'status-pending' : ''}`}>
                              {job.applicationStatus ? job.applicationStatus.charAt(0).toUpperCase() + job.applicationStatus.slice(1) : 'Applied'}
                            </div>
                            {/* Comments Section */}
                            {application?.comments && application.comments.length > 0 && (
                              <div className="application-comments-section">
                                <h4 className="comments-section-title">Comments from Recruiter:</h4>
                                <div className="comments-list">
                                  {application.comments.map((comment: Comment, idx: number) => (
                                    <div key={comment._id || idx} className="comment-item">
                                      <div className="comment-header">
                                        <span className="comment-author">{comment.addedBy}</span>
                                        <span className="comment-date">
                                          {comment.addedAt ? new Date(comment.addedAt).toLocaleDateString() : ''}
                                        </span>
                                      </div>
                                      <p className="comment-text">{comment.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
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

export default JobListingPage;
