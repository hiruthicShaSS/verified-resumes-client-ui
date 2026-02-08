import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface UserRoleInfo {
  isAdmin: boolean;
  isCompanyMember: boolean;
  userRole: string | null;
  companyName: string | null;
  isLoading: boolean;
  canViewApplicants: boolean;
  canVerifyApplicants: boolean;
}

export const useUserRole = (): UserRoleInfo => {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({
    isAdmin: false,
    isCompanyMember: false,
    userRole: null,
    companyName: null,
    isLoading: true,
    canViewApplicants: false,
    canVerifyApplicants: false
  });

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.email) {
        setRoleInfo({
          isAdmin: false,
          isCompanyMember: false,
          userRole: null,
          companyName: null,
          isLoading: false,
          canViewApplicants: false,
          canVerifyApplicants: false
        });
        return;
      }

      try {
        const userEmail = user.email.toLowerCase();
        
        // Call backend API to get user role
        const response = await fetch(
          `https://verified-resumes-be-production.up.railway.app/api/users/me/role?email=${encodeURIComponent(userEmail)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch user role: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to get user role');
        }

        // Roles that can view applicants
        const allowedApplicantViewerRoles = [
          'admin',
          'ADMIN',
          'Manager',
          'Recruiter',
          'Talent Acquisition',
          'HR'
        ];

        // Determine role information from API response
        const role = data.role?.toLowerCase() || null;
        const roleOriginal = data.role || null;
        const isUserAdmin = role === 'admin';
        const isUserCompanyMember = role !== null && role !== 'user' && !isUserAdmin;
        
        let canViewApplicants = false;
        let canVerifyApplicants = false;

        if (isUserAdmin) {
          canViewApplicants = true;
          canVerifyApplicants = true;
        } else if (isUserCompanyMember) {
          // For HR/company members, check if their role allows viewing applicants
          const userRoleUpper = roleOriginal?.toUpperCase() || '';
          canViewApplicants = allowedApplicantViewerRoles.some(
            allowedRole => allowedRole.toUpperCase() === userRoleUpper
          );
          // Only Admin and HR can verify applicants (check for exact 'HR' role)
          canVerifyApplicants = role === 'hr' || roleOriginal?.toUpperCase() === 'HR';
        }

        setRoleInfo({
          isAdmin: isUserAdmin,
          isCompanyMember: isUserCompanyMember,
          userRole: data.role || null,
          companyName: data.companyName || null,
          isLoading: false,
          canViewApplicants,
          canVerifyApplicants
        });
      } catch (error) {
        console.error('Error checking user role:', error);
        // Fallback: Set default values on error
        setRoleInfo({
          isAdmin: false,
          isCompanyMember: false,
          userRole: null,
          companyName: null,
          isLoading: false,
          canViewApplicants: false,
          canVerifyApplicants: false
        });
      }
    };

    checkUserRole();
  }, [user]);

  return roleInfo;
};
