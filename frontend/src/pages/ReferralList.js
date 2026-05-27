import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getReferrals, updateReferral } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const PlugIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-5"></path>
    <path d="M9 8V2"></path>
    <path d="M15 8V2"></path>
    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>
  </svg>
);

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);

const formatDisplayDate = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  const dateObj = new Date(isoString);
  const date = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateObj);
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(dateObj);
  return { date, time };
};

const ReferralList = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await getReferrals();
      setReferrals(response.data);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (referralId, newStatus) => {
    const note = prompt(`Add a note for "${newStatus}":`);
    if (note === null) return;
    setActionLoading(referralId);
    try {
      await updateReferral(referralId, { status: newStatus, response_note: note || 'No note provided' });
      fetchReferrals();
    } catch (error) {
      alert('Failed to update referral.');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate real stats from referrals data
  const stats = {
    accepted: referrals.filter(r => r.status === 'accepted').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    total: referrals.length,
    declined: referrals.filter(r => r.status === 'declined').length
  };



  const badgeStyle = (status) => {
    const s = status.toLowerCase();
    if (s === 'accepted' || s === 'confirmed') {
      return { border: '1px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' };
    }
    if (s === 'pending') {
      return { border: '1px solid #f43f5e', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)' };
    }
    return { border: '1px solid #6b7280', color: '#9ca3af', background: 'rgba(107, 114, 128, 0.1)' };
  };

  const displayReferrals = (referrals.length > 0 ? referrals : []).filter(ref => {
    const term = searchTerm.toLowerCase();
    const name = (ref.student_name || '').toLowerCase();
    const dept = (ref.receiving_department_name || '').toLowerCase();
    const reason = (ref.reason || '').toLowerCase();
    return name.includes(term) || dept.includes(term) || reason.includes(term);
  }).sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));

  return (
    <Layout>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', color: '#fff', fontWeight: 'bold' }}>Referrals</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>Manage student referrals across all departments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Confirmed Referrals */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon />
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>Accepted<br/>Referrals</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>{stats.accepted}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 24px 0', flex: 1 }}>
            Referrals that have been accepted by the receiving department
          </p>
          <div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0}%`, height: '100%', background: '#10b981' }}></div>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>{stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}% of total</div>
          </div>
        </div>

        {/* Pending Referrals */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockIcon />
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>Pending<br/>Referrals</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>{stats.pending}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
            Referrals waiting for intake team response
          </p>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`, height: '100%', background: '#f59e0b' }}></div>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>{stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total</div>
          </div>
        </div>

        {/* Total Referrals */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlugIcon />
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>Total Referrals</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>{stats.total}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 24px 0', flex: 1 }}>
            All referrals across all departments
          </p>
          <div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: '100%', height: '100%', background: '#3b82f6' }}></div>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>100% of referrals</div>
          </div>
        </div>
      </div>

      {/* Recent Referral Documents */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '24px' }}>Recent Referral Documents</h2>
          <span style={{ color: '#0ea5e9', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>See All</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {displayReferrals.slice(0, 6).map((ref, idx) => {
            const themes = [
              { badge: 'Urgent', theme: 'red', action: 'Analyze' },
              { badge: 'Report', theme: 'yellow', action: 'Analyze' },
              { badge: 'Approved', theme: 'green', action: '✓ Approved' },
              { badge: 'Proposal', theme: 'red', action: 'Analyze' },
              { badge: 'Report', theme: 'yellow', action: 'Analyze' },
              { badge: 'Report', theme: 'green', action: 'Analyze' }
            ];
            const docTheme = themes[idx % themes.length];
            const doc = {
              title: ref.student_name,
              department: ref.receiving_department_name,
              summary: ref.reason || 'No reason provided',
              ...docTheme
            };

            const getThemeColors = (t) => {
              if (t === 'red') return { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.2)', text: '#f43f5e' };
              if (t === 'yellow') return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' };
              return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
            };
            const colors = getThemeColors(doc.theme);

            return (
              <div key={idx} className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DocumentIcon />
                    <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{doc.title}</span>
                  </div>
                  <div style={{ background: colors.bg, color: colors.text, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                    {doc.badge}
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>{doc.department}</div>
                
                <div style={{ 
                  background: colors.bg, 
                  border: `1px solid ${colors.border}`, 
                  borderRadius: '12px', 
                  padding: '16px', 
                  marginBottom: '20px',
                  flex: 1
                }}>
                  <div style={{ color: colors.text, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Risk Summary:</div>
                  <div style={{ color: colors.text, fontSize: '14px', lineHeight: '1.4' }}>{doc.summary}</div>
                </div>

                <button 
                  onClick={() => { setSelectedReferral(ref); setShowModal(true); }}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Section */}
      <div>
        {/* Table Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '24px' }}>All<br/>Referrals</h2>
            <div style={{ background: '#1e3a8a', color: '#60a5fa', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>10</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '10px 16px', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              1 July - 20 July 2026
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '10px 16px', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
              All Status
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '10px 16px', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px', width: '250px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search name, department, reason..." style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* The Table */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['NAME', 'DATE', 'TIME', 'DEPARTMENT', 'REASON', 'STATUS'].map((col, idx) => (
                  <th key={idx} style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayReferrals.map((ref) => {
                const { date, time } = formatDisplayDate(ref.created_at);
                return (
                  <tr key={ref.referral_id} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    background: 'transparent',
                    transition: 'background 0.2s'
                  }}>
                    <td style={{ padding: '20px 16px', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                      <div style={{ width: 'max-content' }}>{ref.student_name}</div>
                    </td>
                    <td style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <div style={{ width: 'max-content' }}>{date.replace(' ', '\n')}</div>
                    </td>
                    <td style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <div style={{ width: 'max-content' }}>{time.replace(' ', '\n')}</div>
                    </td>
                    <td style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <div style={{ width: 'max-content' }}>{ref.receiving_department_name}</div>
                    </td>
                    <td style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <div style={{ width: 'max-content' }}>{ref.reason || 'Routine Check-Up'}</div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        ...badgeStyle(ref.status)
                      }}>
                        {ref.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    {/* Detail Modal - Same structure as intake team modal in Dashboard */}
    {showModal && selectedReferral && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
        <div style={{ background: '#1e293b', width: '100%', maxWidth: '700px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
          {/* Modal Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Referral Details</h3>
            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Urgency Banner */}
          {selectedReferral.urgency === 'Critical' && (
            <div style={{ padding: '12px 20px', background: '#fef2f2', color: '#dc2626', fontWeight: '700', textAlign: 'center', fontSize: '14px' }}>
              ⚠️ CRITICAL - Immediate Attention Required
            </div>
          )}
          {selectedReferral.urgency === 'Urgent' && (
            <div style={{ padding: '12px 20px', background: '#fffbeb', color: '#d97706', fontWeight: '700', textAlign: 'center', fontSize: '14px' }}>
              ⚡ URGENT - Priority Review Needed
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {/* Tracking ID */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Tracking ID</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>{selectedReferral.referral_id}</div>
              <div style={{ marginTop: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: selectedReferral.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : selectedReferral.status === 'declined' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: selectedReferral.status === 'accepted' ? '#10b981' : selectedReferral.status === 'declined' ? '#ef4444' : '#f59e0b'
                }}>
                  {selectedReferral.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Patient</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{selectedReferral.student_name}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>ID: {selectedReferral.student_university_id}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Department</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{selectedReferral.receiving_department_name}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Referred By</div>
                <div style={{ fontSize: '14px', color: '#fff' }}>{selectedReferral.referred_by_username || 'Clinician'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                <div style={{ fontSize: '14px', color: '#fff' }}>{new Date(selectedReferral.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Reason for Referral</div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', color: '#e2e8f0', lineHeight: '1.5' }}>
                {selectedReferral.reason || 'No reason provided'}
              </div>
            </div>

            {/* Clinical Note */}
            {selectedReferral.clinical_visit_details && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>📋 Attached Clinical Note</div>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px' }}>
                  {selectedReferral.clinical_visit_details.symptoms && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase' }}>Symptoms:</span>
                      <span style={{ color: '#e2e8f0', marginLeft: '8px' }}>{selectedReferral.clinical_visit_details.symptoms}</span>
                    </div>
                  )}
                  {selectedReferral.clinical_visit_details.diagnosis && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase' }}>Diagnosis:</span>
                      <span style={{ color: '#e2e8f0', marginLeft: '8px' }}>{selectedReferral.clinical_visit_details.diagnosis}</span>
                    </div>
                  )}
                  {selectedReferral.clinical_visit_details.treatment && (
                    <div>
                      <span style={{ fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase' }}>Treatment:</span>
                      <span style={{ color: '#e2e8f0', marginLeft: '8px' }}>{selectedReferral.clinical_visit_details.treatment}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Response */}
            {selectedReferral.response_note && (
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Response</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', color: '#e2e8f0' }}>
                  {selectedReferral.response_note}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ padding: '16px 24px', background: '#0f172a', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            {user?.role === 'intake_team' && selectedReferral.status === 'pending' && (
              <>
                <button onClick={() => { handleStatusChange(selectedReferral.referral_id, 'declined'); setShowModal(false); }} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Decline</button>
                <button onClick={() => { handleStatusChange(selectedReferral.referral_id, 'accepted'); setShowModal(false); }} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Accept</button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </Layout>
  );
};

export default ReferralList;
