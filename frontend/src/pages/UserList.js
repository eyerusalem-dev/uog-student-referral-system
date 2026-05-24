import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import {
  getUsers,
  getDepartments,
  createUser,
  updateUser,
} from '../services/api';

const emptyForm = {
  username: '',
  password: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: 'clinician',
  department: '',
  is_active: true,
};

const ROLE_LABELS = {
  admin: 'Administrator',
  clinician: 'Clinic Clinician',
  intake_team: 'Intake Team',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);

      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load users or departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return users
      .filter((user) => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const username = (user.username || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const roleLabel = (ROLE_LABELS[user.role] || user.role || '').toLowerCase();

        return (
          username.includes(term) ||
          fullName.includes(term) ||
          email.includes(term) ||
          phone.includes(term) ||
          roleLabel.includes(term)
        );
      })
      .sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();

        if (nameA.trim() && nameB.trim()) {
          return nameA.localeCompare(nameB);
        }

        return a.username.localeCompare(b.username);
      });
  }, [users, searchTerm]);

  const adminCount = users.filter((u) => u.role === 'admin' && u.is_active).length;

  const resetForm = () => {
    setEditingUserId(null);
    setFormData(emptyForm);
    setError('');
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setError('');

    setFormData({
      username: user.username || '',
      password: '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || 'clinician',
      department: user.department || '',
      is_active: user.is_active,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // department only applies to Intake Team
      if (name === 'role' && value !== 'intake_team') {
        updated.department = '';
      }

      return updated;
    });
  };

  const getReadableError = (err) => {
    const data = err.response?.data;

    if (!data) return 'Failed to save user.';

    if (typeof data === 'string') return data;

    if (data.detail) return data.detail;

    // Convert DRF field errors into readable text
    return Object.entries(data)
      .map(([field, messages]) => {
        if (Array.isArray(messages)) {
          return `${field}: ${messages.join(', ')}`;
        }
        return `${field}: ${messages}`;
      })
      .join(' | ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = { ...formData };

      // Backend expects null if no department
      if (payload.role !== 'intake_team') {
        payload.department = null;
      }

      if (payload.role === 'intake_team' && !payload.department) {
        setError('Intake Team users must have a department.');
        setSaving(false);
        return;
      }

      // New user must have password
      if (!editingUserId && !payload.password.trim()) {
        setError('Password is required when creating a new user.');
        setSaving(false);
        return;
      }

      // Editing user: blank password means keep old password
      if (editingUserId && !payload.password.trim()) {
        delete payload.password;
      }

      // Frontend warning for max 3 active admins
      if (
        payload.role === 'admin' &&
        payload.is_active &&
        !editingUserId &&
        adminCount >= 3
      ) {
        setError('You cannot create more than 3 active admin users.');
        setSaving(false);
        return;
      }

      if (editingUserId) {
        await updateUser(editingUserId, payload);
      } else {
        await createUser(payload);
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError(getReadableError(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      await updateUser(user.id, {
        is_active: !user.is_active,
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert(getReadableError(err));
    }
  };

  if (loading) {
    return (
      <Layout>
        <p>Loading users...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>User Management</h1>
          <p style={{ color: '#999', marginTop: '6px' }}>
            Create, edit, activate/deactivate users, and reset passwords.
          </p>
        </div>

        <button onClick={resetForm} style={secondaryButton}>
          New User Form
        </button>
      </div>

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by username, name, email, phone, or role..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={searchInput}
      />

      {/* FORM */}
      <form onSubmit={handleSubmit} style={formCard}>
        <h2 style={{ marginTop: 0 }}>
          {editingUserId ? 'Edit User Profile / Reset Password' : 'Create New User'}
        </h2>

        <div style={formGrid}>
          <div>
            <label style={label}>Username *</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={input}
              required
            />
          </div>

          <div>
            <label style={label}>
              Password {editingUserId ? '(leave blank to keep current password)' : '*'}
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              style={input}
              placeholder={editingUserId ? 'Enter new password only if changing' : ''}
            />
          </div>

          <div>
            <label style={label}>First Name</label>
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              style={input}
            />
          </div>

          <div>
            <label style={label}>Last Name</label>
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              style={input}
            />
          </div>

          <div>
            <label style={label}>Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={input}
            />
          </div>

          <div>
            <label style={label}>Phone</label>
            <input
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              style={input}
              placeholder="+2519XXXXXXXX or 2519XXXXXXXX"
            />
          </div>

          <div>
            <label style={label}>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={input}
              required
            >
              <option value="admin">Administrator</option>
              <option value="clinician">Clinic Clinician</option>
              <option value="intake_team">Intake Team</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
          </div>

          {formData.role === 'intake_team' && (
            <div>
              <label style={label}>Department *</label>
              <select
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                style={input}
                required
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={checkboxRow}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Active Account</span>
          </div>
        </div>

        <div style={formActions}>
          <button type="button" onClick={resetForm} style={secondaryButton}>
            Clear
          </button>

          <button type="submit" disabled={saving} style={primaryButton}>
            {saving
              ? 'Saving...'
              : editingUserId
              ? 'Update User'
              : 'Create User'}
          </button>
        </div>
      </form>

      {/* TABLE */}
      <div style={tableWrap}>
        <table style={table}>
          <thead style={thead}>
            <tr>
              <th style={th}>Username</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Role</th>
              <th style={th}>Department</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} style={tr}>
                  <td style={td}>{user.username}</td>
                  <td style={td}>{user.first_name} {user.last_name}</td>
                  <td style={td}>{user.email || '—'}</td>
                  <td style={td}>{user.phone || '—'}</td>
                  <td style={td}>{ROLE_LABELS[user.role] || user.role}</td>
                  <td style={td}>{user.department_name || '—'}</td>
                  <td style={td}>
                    <span style={{
                      ...statusBadge,
                      background: user.is_active ? '#d1fae5' : '#fee2e2',
                      color: user.is_active ? '#065f46' : '#991b1b',
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={td}>
                    <button onClick={() => startEdit(user)} style={smallButton}>
                      View / Edit
                    </button>

                    <button
                      onClick={() => toggleActive(user)}
                      style={{
                        ...smallButton,
                        background: user.is_active ? '#ef4444' : '#10b981',
                      }}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

/* =========================
   Inline styles
========================= */

const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const searchInput = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: '20px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '15px',
};

const formCard = {
  background: 'white',
  color: '#333',
  padding: '24px',
  borderRadius: '12px',
  marginBottom: '24px',
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const label = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: '600',
};

const input = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontFamily: 'inherit',
};

const checkboxRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginTop: '10px',
  fontWeight: '600',
};

const formActions = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '20px',
};

const primaryButton = {
  padding: '10px 16px',
  background: '#1053ae',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
};

const secondaryButton = {
  padding: '10px 16px',
  background: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
};

const smallButton = {
  padding: '6px 10px',
  marginRight: '8px',
  background: '#1053ae',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
};

const errorBox = {
  background: '#fee2e2',
  color: '#991b1b',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '20px',
};

const tableWrap = {
  background: 'white',
  color: '#333',
  borderRadius: '12px',
  overflow: 'hidden',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thead = {
  background: '#f3f4f6',
};

const th = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: '700',
};

const tr = {
  borderBottom: '1px solid #eee',
};

const td = {
  padding: '12px',
  verticalAlign: 'middle',
};

const statusBadge = {
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: '700',
};

export default UserList;