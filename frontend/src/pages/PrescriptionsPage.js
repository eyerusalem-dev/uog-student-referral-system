import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptions, updatePrescription } from '../services/api';

const formatUTC = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  const dateObj = new Date(isoString);
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: true }).format(dateObj);
  return { date, time: `${time} UTC` };
};

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { user } = useAuth();
  const pollingRef = useRef(null);

  const fetchPrescriptions = async () => {
    try {
      const response = await getPrescriptions();
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling for real-time updates
  useEffect(() => {
    fetchPrescriptions();
    
    // Poll every 5 seconds for new prescriptions (real-time feel)
    pollingRef.current = setInterval(fetchPrescriptions, 5000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleUpdate = async (prescriptionId, newStatus) => {
    // Confirm the status change
    const statusLabel = newStatus === 'dispensed' ? 'Dispensed' : 'Out of Stock';
    if (!window.confirm(`Mark this prescription as "${statusLabel}"?`)) {
      return;
    }

    setActionLoading(prescriptionId);
    try {
      await updatePrescription(prescriptionId, {
        status: newStatus
      });
      fetchPrescriptions();
      
      // Show success notification
      alert(`Prescription marked as "${statusLabel}". The prescribing clinician has been notified.`);
    } catch (error) {
      console.error(error);
      if (error.response?.data?.status) {
        alert(error.response.data.status);
      } else {
        alert('Failed to update prescription');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Filter prescriptions based on search and status
  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = searchQuery === '' || 
      rx.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rx.patient_name && rx.patient_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rx.patient_university_id && rx.patient_university_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || rx.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#fff' }}>Recent Prescriptions</h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '15px' }}>
          Manage medication requests. Select status to update.
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {/* Header with search and filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
              {filteredPrescriptions.filter(r => r.status === 'pending').length} pending prescriptions
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search by medication, patient..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0 8px', fontSize: '13px', width: '200px', color: '#fff' }} 
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['all', 'pending', 'dispensed', 'out_of_stock'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '8px 16px',
                    background: filterStatus === status ? '#3b82f6' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: filterStatus === status ? '#fff' : '#9ca3af',
                    cursor: 'pointer',
                    fontWeight: filterStatus === status ? '600' : '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {status === 'out_of_stock' ? 'Out of Stock' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button 
              onClick={fetchPrescriptions}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'transparent', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '8px', 
                padding: '8px 16px', 
                fontSize: '13px', 
                color: '#9ca3af', 
                cursor: 'pointer', 
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', padding: '20px' }}>Loading prescriptions...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>#</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Patient</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Medication</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Dosage</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Prescribed By</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredPrescriptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).length > 0 ? (
                  [...filteredPrescriptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((rx, i, arr) => {
                    const created = formatUTC(rx.created_at);
                    return (
                      <tr key={rx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#9ca3af' }}>{i + 1}</td>
                        
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            {rx.patient_name || 'N/A'}
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                            ID: {rx.patient_university_id || 'N/A'}
                          </div>
                        </td>
                        
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{rx.medication_name}</div>
                        </td>
                        
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#e2e8f0', fontSize: '13px' }}>
                            {rx.dosage || '—'}
                          </div>
                          {(rx.frequency || rx.duration) && (
                            <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '2px' }}>
                              {rx.frequency && `${rx.frequency}`}
                              {rx.duration && ` • ${rx.duration}`}
                            </div>
                          )}
                        </td>
                        
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#e2e8f0', fontSize: '13px' }}>
                            {rx.clinician_username || 'N/A'}
                          </div>
                        </td>
                        
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '2px' }}>{created.date}</div>
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>{created.time}</div>
                        </td>
                        
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            display: 'inline-block',
                            background: rx.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : rx.status === 'dispensed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: rx.status === 'pending' ? '#f59e0b' : rx.status === 'dispensed' ? '#10b981' : '#ef4444',
                            padding: '4px 16px', 
                            borderRadius: '16px', 
                            fontSize: '12px', 
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {rx.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          {rx.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleUpdate(rx.id, 'dispensed')}
                                disabled={actionLoading === rx.id}
                                style={{
                                  padding: '8px 16px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  borderRadius: '8px',
                                  cursor: actionLoading === rx.id ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {actionLoading === rx.id ? (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
                                    </svg>
                                    ...
                                  </>
                                ) : (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Dispensed
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleUpdate(rx.id, 'out_of_stock')}
                                disabled={actionLoading === rx.id}
                                style={{
                                  padding: '8px 16px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '8px',
                                  cursor: actionLoading === rx.id ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {actionLoading === rx.id ? (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
                                    </svg>
                                    ...
                                  </>
                                ) : (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="12" y1="8" x2="12" y2="12"></line>
                                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    Out of Stock
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                      {searchQuery || filterStatus !== 'all' ? (
                        'No prescriptions match your search criteria.'
                      ) : (
                        'No prescriptions found. New prescriptions will appear here automatically.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
          padding: '8px 12px',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#10b981'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 2s infinite'
          }}></div>
          Auto-refresh enabled • Updates every 5 seconds
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </Layout>
  );
};

export default PrescriptionsPage;