import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDepartments, createDepartment } from '../services/api';

// Icons
const HouseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
);

const demoDepartments = [
  {
    id: 1, name: 'General Medical', initials: 'GM', color: '#10b981', staffCount: 3,
    staff: [
      { name: 'Dr. Abebe Kebede', role: 'Intake Team Lead', initials: 'AK', status: 'Available', statusColor: '#10b981' },
      { name: 'Nurse Marta Alemu', role: 'Intake Team', initials: 'MA', status: 'Busy', statusColor: '#f59e0b' }
    ],
    pending: 8, total: 80, lastActive: '15 mins ago'
  },
  {
    id: 2, name: 'Cardiology', initials: 'CA', color: '#3b82f6', staffCount: 2,
    staff: [
      { name: 'Dr. Olivia Martinez', role: 'Intake Team Lead', initials: 'OM', status: 'Available', statusColor: '#10b981' },
      { name: 'Dr. Petra W.', role: 'Intake Team', initials: 'PW', status: 'Offline', statusColor: '#6b7280' }
    ],
    pending: 9, total: 98, lastActive: '25 mins ago'
  },
  {
    id: 3, name: 'Pediatrics', initials: 'PE', color: '#f97316', staffCount: 3,
    staff: [
      { name: 'Dr. Damian Sanchez', role: 'Intake Team Lead', initials: 'DS', status: 'Busy', statusColor: '#f59e0b' },
      { name: 'Nurse Hanna', role: 'Intake Team', initials: 'H', status: 'Available', statusColor: '#10b981' }
    ],
    pending: 6, total: 72, lastActive: '2 hours ago'
  },
  {
    id: 4, name: 'Dermatology', initials: 'DE', color: '#f43f5e', staffCount: 1,
    staff: [
      { name: 'Dr. Chloe Harrington', role: 'Intake Team Lead', initials: 'CH', status: 'Available', statusColor: '#10b981' }
    ],
    pending: 4, total: 67, lastActive: '1 hour ago'
  },
  {
    id: 5, name: 'Orthopedics', initials: 'OR', color: '#a855f7', staffCount: 2,
    staff: [
      { name: 'Dr. Emily Smith', role: 'Intake Team Lead', initials: 'ES', status: 'Available', statusColor: '#10b981' },
      { name: 'Dr. Luke H.', role: 'Intake Team', initials: 'LH', status: 'Busy', statusColor: '#f59e0b' }
    ],
    pending: 9, total: 98, lastActive: '25 mins ago'
  },
  {
    id: 6, name: 'Neurology', initials: 'NE', color: '#0ea5e9', staffCount: 2,
    staff: [
      { name: 'Dr. Andrew Peterson', role: 'Intake Team Lead', initials: 'AP', status: 'Offline', statusColor: '#6b7280' },
      { name: 'Nurse Queen L.', role: 'Intake Team', initials: 'QL', status: 'Available', statusColor: '#10b981' }
    ],
    pending: 6, total: 72, lastActive: '2 hours ago'
  }
];

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Merge real data with demo visuals if needed, or just display demo for exact mockup match
  const displayDepartments = demoDepartments;

  return (
    <Layout>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', color: '#fff', fontWeight: 'bold' }}>Departments</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>Manage hospital departments and intake team assignments</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '14px', minWidth: '260px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search department or staff..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', fontSize: '14px', cursor: 'pointer', minWidth: '100px', justifyContent: 'space-between' }}>
            All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            + Add Department
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--card-border)', marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '20px' }}>Create Department</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Department Name</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Building / Location</label>
              <input value={formData.building_location} onChange={e => setFormData({...formData, building_location: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Create Department</button>
          </div>
        </form>
      )}

      {/* METRICS ROW */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HouseIcon />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>6</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Total Departments</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '200px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UsersIcon />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>8</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Active Staff</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '200px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClockIcon />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>54</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Pending Referrals</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '200px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>606</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Total Referrals</div>
          </div>
        </div>
      </div>

      {/* DEPARTMENTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {displayDepartments.map(dept => (
          <div key={dept.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: dept.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                  {dept.initials}
                </div>
                <div style={{ paddingTop: '4px' }}>
                  <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>{dept.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{dept.staffCount} staff member{dept.staffCount !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div style={{ cursor: 'pointer' }}><MoreIcon /></div>
            </div>

            {/* Staff List */}
            <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {dept.staff.map((s, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px' }}>
                      {s.initials}
                    </div>
                    <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: s.statusColor, border: '2px solid var(--card-bg)' }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{s.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{s.role}</div>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: `1px solid ${s.statusColor}40`, color: s.statusColor }}>
                    {s.status}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Stats */}
            <div style={{ marginTop: '24px', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>{dept.pending}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>PENDING</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#0ea5e9', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>{dept.total}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>TOTAL</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', paddingTop: '4px' }}>{dept.lastActive}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>LAST ACTIVE</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  View Details
                </button>
                <button style={{ flex: 1, background: '#0ea5e9', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                  Manage Staff
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </Layout>
  );
};

export default DepartmentList;