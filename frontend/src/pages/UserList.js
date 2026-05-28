import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { getUsers, getDepartments, createUser, updateUser, deleteUser } from '../services/api';

const emptyForm = {
  username: '', password: '', email: '', first_name: '', last_name: '', phone: '', role: 'clinician', department: '', is_active: true,
};

const ROLE_LABELS = {
  admin: 'Admin',
  clinician: 'Clinician',
  intake_team: 'Intake Team',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
};

// Icons
const AlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const AlertCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Form State
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([getUsers(), getDepartments()]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load users or departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let filtered = users;

    if (roleFilter !== 'All') {
      const dbRole = Object.keys(ROLE_LABELS).find(k => ROLE_LABELS[k] === roleFilter);
      if (dbRole) filtered = filtered.filter(u => u.role === dbRole);
    }

    return filtered.filter((user) => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const username = (user.username || '').toLowerCase();
      return username.includes(term) || fullName.includes(term);
    }).sort((a, b) => a.username.localeCompare(b.username));
  }, [users, searchTerm, roleFilter]);

  const activeStaffCount = users.filter(u => u.is_active).length;
  const inactiveStaffCount = users.length - activeStaffCount;

  const resetForm = () => {
    setEditingUserId(null);
    setFormData(emptyForm);
    setError('');
    setIsFormVisible(false);
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setError('');
    // Extract department ID if it's an object, otherwise use as-is
    const departmentId = typeof user.department === 'object' && user.department !== null 
      ? user.department.id 
      : (user.department || '');
    setFormData({
      username: user.username || '',
      password: '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || 'clinician',
      department: departmentId,
      is_active: user.is_active,
    });
    setIsFormVisible(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'role' && value !== 'intake_team') updated.department = '';
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData };
      if (payload.role !== 'intake_team') payload.department = null;
      if (payload.role === 'intake_team' && !payload.department) {
        setError('Intake Team users must have a department.'); setSaving(false); return;
      }
      if (!editingUserId && !payload.password.trim()) {
        setError('Password is required when creating a new user.'); setSaving(false); return;
      }
      if (!payload.phone?.trim()) payload.phone = null;
      if (!payload.email?.trim()) payload.email = "";
      if (editingUserId && !payload.password?.trim()) delete payload.password;
      
      // Debug: Log the payload being sent
      console.log('[DEBUG] Sending user data to API:', payload);
      
      if (editingUserId) await updateUser(editingUserId, payload);
      else await createUser(payload);

      console.log('[DEBUG] User saved successfully!');
      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      const serverError = err.response?.data;
      if (typeof serverError === 'object') {
        const msgs = Object.values(serverError).flat().join(' ');
        setError(msgs || 'An error occurred while saving the user.');
      } else {
        setError('An error occurred while saving the user.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setSaving(true);
      try {
        await deleteUser(editingUserId);
        resetForm();
        await loadData();
      } catch (err) {
        console.error(err);
        setError('Failed to delete user.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteDirect = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        if (editingUserId === id) resetForm();
        await loadData();
      } catch (err) {
        console.error(err);
        alert('Failed to delete user.');
      }
    }
  };

  const getInitials = (user) => {
    if (user.first_name) return `${user.first_name.charAt(0)}${user.last_name?.charAt(0) || ''}`.toUpperCase();
    return user.username ? user.username.charAt(0).toUpperCase() : 'U';
  };

  // Use real data only
  const displayUsers = filteredUsers;

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', color: '#fff', fontWeight: 'bold' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>Manage staff accounts, roles, and permissions</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormVisible(true); }}
          style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          + Add New User
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--card-border)', marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '20px' }}>{editingUserId ? 'Edit User' : 'Create New User'}</h2>
          {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Username *</label>
              <input name="username" value={formData.username} onChange={handleChange} required style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Password {editingUserId ? '(leave blank to keep)' : '*'}</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>First Name</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} pattern="[A-Za-z\s]+" title="Only letters are allowed" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} pattern="[A-Za-z\s]+" title="Only letters are allowed" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="09xxxxxxxx or +2519xxxxxxxx" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Role *</label>
              <select name="role" value={formData.role} onChange={handleChange} required style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }}>
                <option value="admin" style={{color: '#000'}}>Administrator</option>
                <option value="clinician" style={{color: '#000'}}>Clinician</option>
                <option value="intake_team" style={{color: '#000'}}>Intake Team</option>
                <option value="lab_technician" style={{color: '#000'}}>Lab Technician</option>
                <option value="pharmacist" style={{color: '#000'}}>Pharmacist</option>
              </select>
            </div>
            {formData.role === 'intake_team' && (
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Department *</label>
                <select name="department" value={formData.department} onChange={handleChange} required style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }}>
                  <option value="" style={{color: '#000'}}>Select department</option>
                  {departments.map((dept) => <option key={dept.id} value={dept.id} style={{color: '#000'}}>{dept.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#0ea5e9' }} />
              <span style={{ color: '#fff' }}>Active Account</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              {editingUserId && (
                <button type="button" onClick={handleDelete} disabled={saving} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Delete User</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setIsFormVisible(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save User'}</button>
            </div>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ flex: '1', minWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Table Card */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" placeholder="Search by name, username, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '15px' }} />
                </div>
                <button style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '0 24px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                  Advance Filter
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {['New Staff', 'All', 'Admin', 'Clinician', 'Intake Team', 'Lab Technician', 'Pharmacist'].map(role => (
                  <button key={role} onClick={() => setRoleFilter(role)} style={{ 
                    background: roleFilter === role ? '#0ea5e9' : 'rgba(255,255,255,0.05)', 
                    color: roleFilter === role ? '#fff' : 'var(--text-muted)', 
                    border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}>
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 24px', width: '40px' }}><input type="checkbox" style={{ accentColor: '#0ea5e9' }} /></th>
                  {['ID', 'USER', 'ROLE', 'DEPARTMENT', 'STATUS', 'ACTIONS'].map(col => (
                    <th key={col} style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((u, idx) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '24px' }}><input type="checkbox" style={{ accentColor: '#0ea5e9' }} /></td>
                    <td style={{ padding: '24px 12px', color: 'var(--text-muted)', fontSize: '14px' }}>{u._displayId || `USR-00${u.id}`}</td>
                    <td style={{ padding: '24px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: u.color || '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                          {getInitials(u)}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{u.first_name} {u.last_name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '24px 12px', color: 'var(--text-muted)', fontSize: '14px' }}>{ROLE_LABELS[u.role] || u.role}</td>
                    <td style={{ padding: '24px 12px', color: 'var(--text-muted)', fontSize: '14px' }}>{u.department_name || '—'}</td>
                    <td style={{ padding: '24px 12px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: u.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: u.is_active ? '#10b981' : '#f43f5e' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '24px 12px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={() => startEdit(u)} style={{ background: 'transparent', border: 'none', color: '#0ea5e9', fontWeight: '600', cursor: 'pointer', padding: '0' }}>Edit</button>
                        <button onClick={() => handleDeleteDirect(u.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', padding: '0' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Activity Card */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Recent Activity</h3>
              <span style={{ color: '#0ea5e9', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>See All</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ color: 'var(--text-muted)' }}>No recent activity.</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1, background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <UsersIcon />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', lineHeight: 1, marginBottom: '8px' }}>{activeStaffCount || 4}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Active Staff</div>
            </div>
            
            <div style={{ flex: 1, background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ClockIcon />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', lineHeight: 1, marginBottom: '8px' }}>{inactiveStaffCount || 1}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Inactive</div>
            </div>
          </div>

          {/* Staff List */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Staff List</h3>
              <span style={{ color: '#0ea5e9', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>See All</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ color: 'var(--text-muted)' }}>No staff list data available.</div>
            </div>
          </div>

          {/* System Alerts */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>System Alerts</h3>
              <span style={{ color: '#0ea5e9', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>See All</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ color: 'var(--text-muted)' }}>No system alerts.</div>
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
};

export default UserList;