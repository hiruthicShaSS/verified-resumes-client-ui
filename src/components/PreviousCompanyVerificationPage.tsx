import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import Header from './Header.tsx';
import { Background } from './Background.tsx';
import Toast from './Toast.tsx';
import './PreviousCompanyVerificationPage.css';

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
  rawResume?: string;
  parsedAt?: string;
}

interface VerificationRequest {
  _id: string;
  applicantName: string;
  applicantEmail: string;
  position?: string;
  duration?: string;
  currentCompany?: string;
  currentDesignation?: string;
  yearsOfExperience?: string;
  resumeUrl?: string;
  resumeText?: string;
  resumeFileName?: string; // Original filename (required for search)
  storageFileName?: string; // Sanitized filename for direct access (optional)
  parsedResume?: ParsedResume | null; // Parsed resume data from backend
  currentCompanyName?: string;
  currentCompanyEmail?: string;
  appliedToCompany?: string;
  appliedToJobTitle?: string;
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
  requestedAt: string;
}

type StatusFilter = 'all' | 'pending' | 'verified';

const PreviousCompanyVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canVerifyApplicants, companyName, isLoading: roleLoading } = useUserRole();
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<VerificationRequest[]>([]);
  const [verifiedVerifications, setVerifiedVerifications] = useState<VerificationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expandedVerification, setExpandedVerification] = useState<string | null>(null);
  const [comment, setComment] = useState<{ [key: string]: string }>({});
  const [isVerifying, setIsVerifying] = useState<{ [key: string]: boolean }>({});
  const [isAddingComment, setIsAddingComment] = useState<{ [key: string]: boolean }>({});
  const [selectedResume, setSelectedResume] = useState<{ verificationId: string; url: string; fileName: string } | null>(null);

  useEffect(() => {
    if (!roleLoading && companyName) {
      if (!canVerifyApplicants) {
        setToast({ 
          message: 'You do not have permission to verify applicants. Only Admin and HR can access this page.', 
          type: 'error' 
        });
        setTimeout(() => navigate('/home'), 2000);
        return;
      }
      
      if (user?.email) {
        loadVerifications();
      }
    }
  }, [user, statusFilter, canVerifyApplicants, roleLoading, companyName]);

  const loadVerifications = async () => {
    if (!user?.email || !companyName) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const statusParam = statusFilter === 'all' ? 'all' : statusFilter;
      
      // Fetch from current company verifications endpoint by company name
      // This shows verifications where applicants filled in current company name during application
      const response = await fetch(
        `https://verified-resumes-be-production.up.railway.app/api/current-company-verifications/by-company-name/${encodeURIComponent(companyName)}?status=${statusParam}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch verifications: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const allVerifications = (data.verifications || []).map((v: any) => ({
          ...v,
          _id: v._id || v.id || v.verificationId // Handle different ID field names
        }));
        const pending = allVerifications.filter((v: VerificationRequest) => !v.verified);
        const verified = allVerifications.filter((v: VerificationRequest) => v.verified);
        
        console.log('Loaded verifications:', {
          total: allVerifications.length,
          pending: pending.length,
          verified: verified.length,
          data: allVerifications
        });
        
        setVerifications(allVerifications);
        setPendingVerifications(pending);
        setVerifiedVerifications(verified);
        
        if (allVerifications.length === 0) {
          setToast({ 
            message: `No verification requests found for ${companyName}. Applicants who fill in "${companyName}" as their current company during application will appear here.`, 
            type: 'info' 
          });
        }
      } else {
        setToast({ message: data.message || data.error || 'Failed to load verification requests.', type: 'error' });
        setVerifications([]);
        setPendingVerifications([]);
        setVerifiedVerifications([]);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      setToast({ message: 'Failed to load verification requests. Please try again.', type: 'error' });
      setVerifications([]);
      setPendingVerifications([]);
      setVerifiedVerifications([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleVerify = async (verificationId: string, verified: boolean) => {
    if (!user?.email) return;

    // Comment is optional - can be empty
    const verificationComment = comment[verificationId] || '';

    setIsVerifying(prev => ({ ...prev, [verificationId]: true }));
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Use current company verification endpoint
      const response = await fetch(
        `https://verified-resumes-be-production.up.railway.app/api/current-company-verifications/${verificationId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verifiedByEmail: user.email,
            verifiedBy: userData.name || user.email,
            verified: verified,
            comment: verificationComment
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({ 
          message: verified 
            ? 'Applicant verified successfully! The verification will be reflected on the applicants page.' 
            : 'Verification removed successfully!', 
          type: 'success' 
        });
        setComment(prev => {
          const newComment = { ...prev };
          delete newComment[verificationId];
          return newComment;
        });
        // Reload verifications - verified items will be filtered out from pending list
        loadVerifications();
      } else {
        setToast({ message: data.message || 'Failed to verify applicant.', type: 'error' });
      }
    } catch (error) {
      console.error('Error verifying applicant:', error);
      setToast({ message: 'Failed to verify applicant. Please try again.', type: 'error' });
    } finally {
      setIsVerifying(prev => ({ ...prev, [verificationId]: false }));
    }
  };

  const handleViewResume = async (verification: VerificationRequest) => {
    if (!user?.email) {
      setToast({ message: 'Authorization required to view resume.', type: 'error' });
      return;
    }

    const resumeFileName = verification.resumeFileName;
    const storageFileName = verification.storageFileName;
    const resumeUrl = verification.resumeUrl;
    const applicantEmail = verification.applicantEmail;

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
          // Open the Firebase Storage URL directly in a new tab
          window.open(downloadURL, '_blank');
          setToast({ message: 'Resume downloaded successfully!', type: 'success' });
          return;
        } else {
          setToast({ message: 'Resume download URL not available.', type: 'error' });
          return;
        }
      } catch (error) {
        console.error('Error downloading resume:', error);
        setToast({ message: 'Failed to download resume. Please try again.', type: 'error' });
        return;
      }
    }
    
    // Fallback to resumeUrl if available
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
      setToast({ message: 'Resume downloaded successfully!', type: 'success' });
      return;
    }

    // No resume available
    setToast({ message: 'Resume filename or URL is missing.', type: 'error' });
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

  // Helper function to find matching company entry from parsedResume.companies
  // Backend should filter, but we do client-side matching as well
  const getMatchingCompany = (verification: VerificationRequest): ParsedCompany | null => {
    if (!verification.parsedResume || !verification.parsedResume.companies || verification.parsedResume.companies.length === 0) {
      return null;
    }

    // If backend already filtered to single entry, use it
    if (verification.parsedResume.companies.length === 1) {
      return verification.parsedResume.companies[0];
    }

    // Otherwise, try to match by company name (case-insensitive, partial match)
    const targetCompanyName = companyName?.toLowerCase().trim();
    if (!targetCompanyName) {
      return verification.parsedResume.companies[0]; // Fallback to first if no company name
    }

    const matchingCompany = verification.parsedResume.companies.find(company => {
      const companyNameLower = company.company.toLowerCase().trim();
      return companyNameLower === targetCompanyName || 
             companyNameLower.includes(targetCompanyName) ||
             targetCompanyName.includes(companyNameLower);
    });

    return matchingCompany || null;
  };

  const getDisplayVerifications = (): VerificationRequest[] => {
    // For pending filter, only show non-verified items
    // For verified filter, show verified items
    // For all, show everything
    switch (statusFilter) {
      case 'pending':
        return pendingVerifications.filter(v => !v.verified);
      case 'verified':
        return verifiedVerifications.filter(v => v.verified);
      default:
        return verifications;
    }
  };

  const displayVerifications = getDisplayVerifications();

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
        <Background />
        <Header showLogout={true} onBack={() => navigate('/home')} />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 dark:text-slate-400 font-medium">Loading verification requests...</span>
        </div>
      </div>
    );
  }

  if (!canVerifyApplicants) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
        <Background />
        <Header showLogout={true} onBack={() => navigate('/home')} />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Denied</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Only Admin and HR can verify applicants. You do not have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="previous-company-page-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <Background />
      <Header showLogout={true} onBack={() => navigate('/home')} />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Company Verifications
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Verify applicants based on company name provided during application. Verification status is shown in the UI based on company name matching.
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-8">
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              onClick={() => setStatusFilter('all')}
            >
              All ({verifications.length})
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({pendingVerifications.filter(v => !v.verified).length})
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'verified'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              onClick={() => setStatusFilter('verified')}
            >
              Verified ({verifiedVerifications.filter(v => v.verified).length})
            </button>
          </div>
        </div>

        {/* Verifications List */}
        {displayVerifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              No verification requests
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {statusFilter === 'pending' 
                ? 'No pending verification requests at this time.'
                : statusFilter === 'verified'
                ? 'No verified applicants yet.'
                : 'No verification requests found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayVerifications.map((verification) => (
              <div 
                key={verification._id} 
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border ${
                  verification.verified 
                    ? 'border-green-500/50 dark:border-green-500/30' 
                    : 'border-slate-200 dark:border-slate-700'
                } p-6 mb-6 transition-all hover:shadow-xl`}
              >
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {verification.applicantName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          verification.verified
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {verification.verified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{verification.applicantEmail}</p>
                      {(verification.position || verification.currentDesignation) && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {verification.currentDesignation ? 'Current Position:' : 'Position:'}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">
                            {verification.currentDesignation || verification.position}
                          </span>
                          {verification.yearsOfExperience && (
                            <>
                              <span className="text-slate-400 dark:text-slate-500">•</span>
                              <span className="text-slate-600 dark:text-slate-400">{verification.yearsOfExperience} years</span>
                            </>
                          )}
                          {verification.duration && !verification.yearsOfExperience && (
                            <>
                              <span className="text-slate-400 dark:text-slate-500">•</span>
                              <span className="text-slate-600 dark:text-slate-400">{verification.duration}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {verification.appliedToCompany ? 'Applied to:' : 'Requested by:'}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                          {verification.appliedToCompany || verification.currentCompanyName}
                        </span>
                        {verification.appliedToJobTitle && (
                          <span className="text-slate-500 dark:text-slate-400"> - {verification.appliedToJobTitle}</span>
                        )}
                        {verification.currentCompanyEmail && (
                          <span className="text-slate-500 dark:text-slate-400"> ({verification.currentCompanyEmail})</span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-500 text-xs mb-3">
                        Requested on: {formatDate(verification.requestedAt)}
                      </p>
                      
                      {/* Company Preview Badge from Parsed Resume */}
                      {(() => {
                        const matchingCompany = getMatchingCompany(verification);
                        if (matchingCompany) {
                          return (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Resume Entry:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-semibold">{matchingCompany.company}</span>
                              <span className="text-slate-400 dark:text-slate-500">•</span>
                              <span className="text-slate-600 dark:text-slate-400">{matchingCompany.position}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Parsed Resume Section - Simplified Display */}
                {!verification.verified && (
                  <div className="parsed-resume-section bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-6">
                    {verification.parsedResume && verification.parsedResume.companies && verification.parsedResume.companies.length > 0 ? (() => {
                      const matchingCompany = getMatchingCompany(verification);
                      
                      if (!matchingCompany) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-amber-600 dark:text-amber-400 font-semibold text-lg mb-2">
                              ⚠️ No matching company entry found
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                              The resume does not contain an entry matching "{companyName}".
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-6">
                          <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            Work Experience at {matchingCompany.company}
                          </h4>
                          
                          {/* Display Single Matching Company Entry */}
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                              {matchingCompany.company}
                            </h5>
                            <div className="space-y-2 mb-4">
                              <p className="text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">Position:</span> {matchingCompany.position}
                              </p>
                              <p className="text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">Duration:</span> {matchingCompany.duration}
                              </p>
                            </div>
                            <div className="company-details">
                              <strong className="text-slate-800 dark:text-slate-200 block mb-2">
                                Achievements/Responsibilities:
                              </strong>
                              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                                {matchingCompany.details.map((detail, detailIndex) => (
                                  <li key={detailIndex}>{detail}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          {/* Display Skills */}
                          {verification.parsedResume.skills && verification.parsedResume.skills.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                              <strong className="text-slate-800 dark:text-slate-200 block mb-3">Skills:</strong>
                              <div className="flex flex-wrap gap-2">
                                {verification.parsedResume.skills.map((skill, index) => (
                                  <span 
                                    key={index} 
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Display Education */}
                          {verification.parsedResume.education && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                              <strong className="text-slate-800 dark:text-slate-200 block mb-2">Education:</strong>
                              <p className="text-slate-600 dark:text-slate-400">{verification.parsedResume.education}</p>
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="text-center py-8">
                        <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg mb-2">
                          📄 No resume details found
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm">
                          Parsed resume data is not available for this verification.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Status */}
                {verification.verified && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Verified by:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {verification.verifiedBy || verification.verifiedByEmail}
                      </span>
                      {verification.verifiedAt && (
                        <span className="text-slate-500 dark:text-slate-500 text-xs">
                          on {formatDate(verification.verifiedAt)}
                        </span>
                      )}
                    </div>
                    {verification.comment && (
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide block mb-2">Comment:</span>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">{verification.comment}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Section */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comments</h4>
                    <button
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1"
                      onClick={() => setExpandedVerification(expandedVerification === verification._id ? null : verification._id)}
                    >
                      {expandedVerification === verification._id ? '▼' : '▶'}
                    </button>
                  </div>
                  
                  {expandedVerification === verification._id && (
                    <div className="space-y-4">
                      {/* Existing Comments */}
                      {(verification.comments && verification.comments.length > 0) || (verification.verified && verification.comment) ? (
                        <div className="space-y-3">
                          {/* Show verification comment if exists */}
                          {verification.verified && verification.comment && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                  {verification.verifiedBy || verification.verifiedByEmail}
                                </span>
                                {verification.verifiedAt && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDate(verification.verifiedAt)}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 text-sm">{verification.comment}</p>
                            </div>
                          )}
                          {/* Show other comments */}
                          {verification.comments && verification.comments.map((commentItem, idx) => (
                            <div key={commentItem._id || idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                  {commentItem.commenterName || commentItem.commenterEmail}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDate(commentItem.commentedAt)}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 text-sm">{commentItem.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic text-center py-4">No comments yet.</p>
                      )}

                      {/* Add Comment Form */}
                      {!verification.verified && (
                        <div className="mt-4 space-y-3">
                          <textarea
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors"
                            placeholder="Add a comment..."
                            value={comment[verification._id] || ''}
                            onChange={(e) => setComment(prev => ({
                              ...prev,
                              [verification._id]: e.target.value
                            }))}
                            rows={3}
                          />
                          <button
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={async () => {
                              if (!comment[verification._id]?.trim()) return;
                              
                              setIsAddingComment(prev => ({ ...prev, [verification._id]: true }));
                              try {
                                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                                const response = await fetch(
                                  `https://verified-resumes-be-production.up.railway.app/api/current-company-verifications/${verification._id}/comments`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      commenterEmail: user.email,
                                      comment: comment[verification._id]
                                    })
                                  }
                                );

                                const data = await response.json();

                                if (data.success) {
                                  setToast({ message: 'Comment added successfully!', type: 'success' });
                                  setComment(prev => {
                                    const newComment = { ...prev };
                                    delete newComment[verification._id];
                                    return newComment;
                                  });
                                  loadVerifications();
                                } else {
                                  setToast({ message: data.message || 'Failed to add comment.', type: 'error' });
                                }
                              } catch (error) {
                                console.error('Error adding comment:', error);
                                setToast({ message: 'Failed to add comment. Please try again.', type: 'error' });
                              } finally {
                                setIsAddingComment(prev => ({ ...prev, [verification._id]: false }));
                              }
                            }}
                            disabled={!comment[verification._id]?.trim() || isAddingComment[verification._id]}
                          >
                            {isAddingComment[verification._id] ? 'Adding...' : 'Add Comment'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Input and Action Buttons */}
                {!verification.verified && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    {/* Comment Input Field */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Comment (Optional)
                      </label>
                      <textarea
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors"
                        placeholder="Add a comment (optional)..."
                        value={comment[verification._id] || ''}
                        onChange={(e) => setComment(prev => ({
                          ...prev,
                          [verification._id]: e.target.value
                        }))}
                        rows={3}
                      />
                    </div>
                    
                    {/* Verify Button */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleVerify(verification._id, true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={isVerifying[verification._id]}
                      >
                        {isVerifying[verification._id] ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <span>✓</span>
                            Verify Applicant
                          </>
                        )}
                      </button>
                      <select
                        className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed opacity-60"
                        value={verification.verified ? 'verified' : 'pending'}
                        disabled
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Modal */}
      {selectedResume && (
        <div className="resume-modal-overlay" onClick={() => setSelectedResume(null)}>
          <div className="resume-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="resume-modal-header">
              <h3>Resume: {selectedResume.fileName}</h3>
              <button className="close-btn" onClick={() => setSelectedResume(null)}>×</button>
            </div>
            <div className="resume-modal-body">
              <iframe
                src={selectedResume.url}
                className="resume-iframe"
                title="Resume Viewer"
              />
            </div>
          </div>
        </div>
      )}

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

export default PreviousCompanyVerificationPage;
