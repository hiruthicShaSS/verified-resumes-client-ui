import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import Header from './Header.tsx';
import { Background } from './Background.tsx';
import Toast from './Toast.tsx';
import './TeamManagementPage.css';

interface Member {
  id?: string;
  name: string;
  email: string;
  role: string[];
  createdAt?: string;
}


type TabType = 'members';

const TeamManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, userRole, companyName } = useUserRole();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'email' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadMembers();
  }, [user, companyName]);

  useEffect(() => {
    applyFilters();
  }, [members, searchQuery, roleFilter, sortField, sortDirection]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      if (!companyName) {
        setToast({ message: 'Company name not found. Please ensure you are registered with a company.', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Load from userEmails collection (from registration modals)
      // Filter by company name to only show members from the user's company
      const userEmailsRef = collection(db, 'userEmails');
      const userEmailsSnapshot = await getDocs(userEmailsRef);
      const membersData: Member[] = [];
      
      userEmailsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include members from the same company
        const memberCompanyName = (data.companyName || '').trim().toLowerCase();
        const userCompanyName = companyName.trim().toLowerCase();
        
        if (memberCompanyName === userCompanyName) {
          // Convert userEmails format to Member format
          membersData.push({
            id: doc.id,
            name: data.email.split('@')[0], // Use email prefix as name
            email: data.email,
            role: data.role ? [
              data.role === 'admin' 
                ? 'Admin' 
                : (data.hrRole || 'HR')
            ] : [],
            createdAt: data.createdAt
          });
        }
      });

      // Also load from members collection if it exists
      try {
        const membersRef = collection(db, 'members');
        const membersSnapshot = await getDocs(membersRef);
        const userCompanyName = companyName.trim().toLowerCase();
        
        membersSnapshot.forEach((doc) => {
          const data = doc.data();
          // Only include members from the same company
          const memberCompanyName = (data.companyName || '').trim().toLowerCase();
          
          if (memberCompanyName === userCompanyName) {
            // Check if member already exists (by email)
            const existingIndex = membersData.findIndex(m => m.email === data.email);
            if (existingIndex >= 0) {
              // Merge data
              const existingRole = membersData[existingIndex].role;
              const newRole = data.role 
                ? [data.role === 'admin' ? 'Admin' : (data.hrRole || 'HR')]
                : existingRole;
              membersData[existingIndex] = {
                ...membersData[existingIndex],
                ...data,
                id: doc.id,
                role: newRole
              };
            } else {
              const roleArray = data.role 
                ? [data.role === 'admin' ? 'Admin' : (data.hrRole || 'HR')]
                : [];
              membersData.push({ 
                id: doc.id, 
                ...data,
                role: roleArray
              } as Member);
            }
          }
        });
      } catch (err) {
        // members collection might not exist yet, that's okay
        console.log('Members collection not found, using userEmails only');
      }

      setMembers(membersData);
    } catch (error: any) {
      console.error('Error loading members:', error);
      setToast({ message: 'Failed to load members.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };


  const applyFilters = () => {
    let filtered = [...members];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(query) || 
        member.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'All') {
      filtered = filtered.filter(member => 
        member.role && member.role.includes(roleFilter)
      );
    }

    // Sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField]?.toLowerCase() || '';
        const bValue = b[sortField]?.toLowerCase() || '';
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    setFilteredMembers(filtered);
  };

  const handleSort = (field: 'name' | 'email') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getUniqueRoles = (): string[] => {
    const rolesSet = new Set<string>();
    members.forEach(member => {
      if (member.role) {
        member.role.forEach(role => rolesSet.add(role));
      }
    });
    return Array.from(rolesSet).sort();
  };

  const handleDeleteMember = async (memberId: string, email: string) => {
    if (!isAdmin) {
      setToast({ message: 'Only admins can delete members.', type: 'error' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${email}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'userEmails', memberId));
      setToast({ message: 'Member deleted successfully!', type: 'success' });
      loadMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      setToast({ message: 'Failed to delete member. Please try again.', type: 'error' });
    }
  };


  return (
    <div className="team-management-page-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <Background />
      <Header showLogout={true} onBack={() => navigate('/home')} />
      
      <div className="team-management-container">
        {/* Centered Heading */}
        <h1 className="team-management-heading">Team Management</h1>
        
        {/* Tabs */}
        <div className="tabs-container">
          <button className="tab active">
            MEMBERS
          </button>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">FILTER</label>
              <div className="filter-dropdowns">
                <select
                  className="filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {getUniqueRoles().map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="search-group">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <button className="apply-filter-btn">
              APPLY FILTER
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="table-section">
            <h3 className="table-title">Members</h3>
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>Loading members...</span>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')} className="sortable">
                        NAME
                        {sortField === 'name' && (
                          <span className="sort-icon">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort('email')} className="sortable">
                        EMAIL
                        {sortField === 'email' && (
                          <span className="sort-icon">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th>ROLE</th>
                      {isAdmin && <th>ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 4 : 3} className="empty-row">
                          No members found
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const isCurrentUser = user?.email?.toLowerCase() === member.email.toLowerCase();
                        return (
                          <tr 
                            key={member.id}
                            className={isCurrentUser ? 'current-user-row' : ''}
                          >
                            <td className="name-cell">
                              {member.name}
                              {isCurrentUser && (
                                <span className="you-badge" title="This is you"> (You)</span>
                              )}
                            </td>
                            <td className="email-cell">{member.email}</td>
                            <td className="role-cell">
                              {member.role && member.role.length > 0 ? (
                                <div className="role-badges">
                                  {member.role.map((role, index) => (
                                    <span
                                      key={index}
                                      className={`role-badge ${role.toLowerCase() === 'admin' ? 'admin-badge' : 'role-badge-default'}`}
                                    >
                                      {role}
                                    </span>
                                  ))}
                                  {isCurrentUser && isAdmin && (
                                    <span className="role-badge admin-badge current-user-admin-badge" title="You are an admin">
                                      👑 Admin
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="empty-value">—</span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="actions-cell">
                                {!isCurrentUser && (
                                  <button
                                    className="delete-member-btn"
                                    onClick={() => member.id && handleDeleteMember(member.id, member.email)}
                                    title="Delete member"
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                                {isCurrentUser && (
                                  <span className="current-user-indicator" title="You cannot delete yourself">
                                    —
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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

export default TeamManagementPage;

