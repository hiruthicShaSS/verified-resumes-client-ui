import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.ts';

interface UserRoleInfo {
  isAdmin: boolean;
  isCompanyMember: boolean;
  userRole: string | null;
  companyName: string | null;
  isLoading: boolean;
  canViewApplicants: boolean;
}

export const useUserRole = (): UserRoleInfo => {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({
    isAdmin: false,
    isCompanyMember: false,
    userRole: null,
    companyName: null,
    isLoading: true,
    canViewApplicants: false
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
          canViewApplicants: false
        });
        return;
      }

      try {
        const emailsRef = collection(db, 'userEmails');
        const querySnapshot = await getDocs(emailsRef);
        const userEmail = user.email.toLowerCase();
        
        let isUserAdmin = false;
        let isUserCompanyMember = false;
        let userRole: string | null = null;
        let companyName: string | null = null;
        let canViewApplicants = false;

        // Roles that can view applicants
        const allowedApplicantViewerRoles = [
          'admin',
          'Manager',
          'Recruiter',
          'Talent Acquisition',
          'HR'
        ];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const email = data.email.toLowerCase();
          
          if (email === userEmail) {
            if (data.role === 'admin') {
              isUserAdmin = true;
              userRole = 'admin';
              canViewApplicants = true;
            } else if (data.role === 'hr') {
              isUserCompanyMember = true;
              const hrRole = data.hrRole || 'HR';
              userRole = hrRole;
              
              // Check if the specific HR role is allowed to view applicants
              canViewApplicants = allowedApplicantViewerRoles.includes(hrRole);
            }
            
            // Extract company name from email domain (you can enhance this logic)
            if (email.includes('@')) {
              const domain = email.split('@')[1];
              const domainParts = domain.split('.');
              companyName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
            }
          }
        });

        setRoleInfo({
          isAdmin: isUserAdmin,
          isCompanyMember: isUserCompanyMember,
          userRole,
          companyName,
          isLoading: false,
          canViewApplicants
        });
      } catch (error) {
        console.error('Error checking user role:', error);
        setRoleInfo({
          isAdmin: false,
          isCompanyMember: false,
          userRole: null,
          companyName: null,
          isLoading: false,
          canViewApplicants: false
        });
      }
    };

    checkUserRole();
  }, [user]);

  return roleInfo;
};
