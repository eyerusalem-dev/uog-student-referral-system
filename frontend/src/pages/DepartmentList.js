import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDepartments, createDepartment, updateDepartment } from '../services/api';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({ name: '', building_location: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDepartment(formData);
      setShowForm(false);
      setFormData({ name: '', building_location: '', description: '' });
      fetchDepartments();
    } catch (err) {
      alert('Failed to create department');
    }
  };

  const toggleActive = async (dept) => {
    try {
      await updateDepartment(dept.id, { is_active: !dept.is_active });
      fetchDepartments();
    } catch (err) {
      alert('Failed to update department');
    }
  };

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Departments</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1053ae', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ New Department'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', color: '#333' }}>
          <h3>Create Department</h3>
          <input placeholder="Department Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle} />
          <input placeholder="Building / Location" value={formData.building_location} onChange={e => setFormData({...formData, building_location: e.target.value})} style={inputStyle} />
          <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={inputStyle} />
          <button type="submit" style={{ padding: '10px 20px', background: '#1053ae', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create Department</button>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', color: '#333', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Location</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: '600' }}>{d.name}</td>
                <td style={{ padding: '12px' }}>{d.building_location || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: d.is_active !== false ? '#d1fae5' : '#fee2e2', color: d.is_active !== false ? '#065f46' : '#991b1b' }}>
                    {d.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => toggleActive(d)} style={{ padding: '6px 12px', background: d.is_active !== false ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {d.is_active !== false ? 'Deactivate' : 'Activate'}
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

export default DepartmentList;