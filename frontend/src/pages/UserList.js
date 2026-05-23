import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getUsers, getDepartments, createUser, updateUser } from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    username: '', password: '', email: '', first_name: '', last_name: '',
    role: 'clinician', department: '', phone: '', is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, dRes] = await Promise.all([getUsers(), getDepartments()]);
      setUsers(uRes.data);
      setDepartments(dRes.data.filter(d => d.is_active !== false));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowForm(false);
      setFormData({ username: '', password: '', email: '', first_name: '', last_name: '', role: 'clinician', department: '', phone: '', is_active: true });
      fetchData();
    } catch (err) {
      alert('Failed to create user');
    }
  };

  const toggleActive = async (user) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      fetchData();
    } catch (err) {
      alert('Failed to update user');
    }
  };

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>User Management</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1053ae', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', color: '#333' }}>
          <h3>Create User</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required style={inputStyle} />
            <input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={inputStyle} />
            <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
            <input placeholder="First Name" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={inputStyle} />
            <input placeholder="Last Name" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={inputStyle} />
            <input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={inputStyle}>
              <option value="admin">Administrator</option>
              <option value="clinician">Clinician</option>
              <option value="department_receiver">Department Receiver</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
            <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} style={inputStyle}>
              <option value="">No Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#1053ae', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create User</button>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', color: '#333', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Username</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Department</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{u.username}</td>
                <td style={{ padding: '12px' }}>{u.first_name} {u.last_name}</td>
                <td style={{ padding: '12px' }}>{u.role}</td>
                <td style={{ padding: '12px' }}>{u.department_name || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: u.is_active ? '#d1fae5' : '#fee2e2', color: u.is_active ? '#065f46' : '#991b1b' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => toggleActive(u)} style={{ padding: '6px 12px', background: u.is_active ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
};

export default UserList;