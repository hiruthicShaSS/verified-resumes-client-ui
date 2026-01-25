import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import Header from './Header.tsx';
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
}

const JobListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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

  useEffect(() => {
    // Load posted jobs on mount
    const postedJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
    if (postedJobs.length > 0) {
      const transformedJobs: Job[] = postedJobs.map((job: any) => ({
        id: job.id || Math.random().toString(),
        title: job.role || 'Untitled Position',
        company: job.company || 'Company',
        location: job.location || 'Location',
        type: job.type || 'Full-time',
        postedDate: job.postedDate ? formatDate(job.postedDate) : 'Recently posted',
        description: `${job.aboutJob || ''}\n\nCompany Overview:\n${job.companyOverview || ''}\n\nJob Description:\n${job.jobDescription || ''}\n\nPreferred Qualifications:\n${job.preferredQualifications || ''}\n\nMinimum Qualifications:\n${job.minimumQualifications || ''}`,
        salary: job.salary
      }));
      setJobs(transformedJobs);
      if (transformedJobs.length > 0) {
        setSelectedJob(transformedJobs[0]);
        setHasSearched(true);
      }
    }
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Load posted jobs from localStorage
    const postedJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
    
    // Filter jobs based on search criteria
    let filteredJobs = postedJobs;
    
    if (searchQuery.trim() || location.trim()) {
      filteredJobs = postedJobs.filter((job: any) => {
        const matchesQuery = !searchQuery.trim() || 
          job.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = !location.trim() ||
          job.location?.toLowerCase().includes(location.toLowerCase());
        return matchesQuery && matchesLocation;
      });
    }
    
    // Transform posted jobs to match Job interface
    const transformedJobs: Job[] = filteredJobs.map((job: any) => ({
      id: job.id || Math.random().toString(),
      title: job.role || 'Untitled Position',
      company: job.company || 'Company',
      location: job.location || 'Location',
      type: job.type || 'Full-time',
      postedDate: job.postedDate ? formatDate(job.postedDate) : 'Recently posted',
      description: `${job.aboutJob || ''}\n\nCompany Overview:\n${job.companyOverview || ''}\n\nJob Description:\n${job.jobDescription || ''}\n\nPreferred Qualifications:\n${job.preferredQualifications || ''}\n\nMinimum Qualifications:\n${job.minimumQualifications || ''}`,
      salary: job.salary
    }));
    
    setJobs(transformedJobs);
    if (transformedJobs.length > 0) {
      setSelectedJob(transformedJobs[0]);
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
    <div className={`job-listing-page-wrapper theme-${theme}`}>
      {/* Header */}
      <header className="job-listing-header-wrapper">
        <div className="job-listing-header">
          <div className="header-left">
            <button className="cancel-link" onClick={() => navigate('/home')}>
              Cancel
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
      </header>

      {/* Main Content */}
      <main className="job-listing-content-wrapper">
        <div className="job-listing-content">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="search-tab-wrapper">
              {!hasSearched ? (
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
                          <div className="company-logo-large">
                            {selectedJob.company.substring(0, 2).toUpperCase()}
                          </div>
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
                          <button className="apply-btn" onClick={handleApply}>
                            Apply <span>↗</span>
                          </button>
                          <button className="save-btn" onClick={handleSave}>
                            Save
                          </button>
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
                  // Use refreshKey to force re-render
                  const _ = refreshKey;
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
                {(() => {
                  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
                  const postedJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
                  const appliedJobs = applications.map((app: any) => {
                    const job = postedJobs.find((j: any) => j.id === app.jobId);
                    return job ? { ...job, applicationDate: app.submittedDate } : null;
                  }).filter(Boolean);

                  return appliedJobs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3 className="empty-state-title">No applications yet</h3>
                      <p className="empty-state-text">
                        Applications you submit will be tracked here.
                      </p>
                    </div>
                  ) : (
                    <div className="saved-jobs-list">
                      {appliedJobs.map((job: any) => (
                        <div key={job.id} className="saved-job-card">
                          <h3 className="saved-job-title">{job.role}</h3>
                          <p className="saved-job-company">{job.company || 'Company'}</p>
                          <p className="saved-job-location">Applied on {job.applicationDate ? new Date(job.applicationDate).toLocaleDateString() : 'Recently'}</p>
                          <div className="status-badge">Applied</div>
                        </div>
                      ))}
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
