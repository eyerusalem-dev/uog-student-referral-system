import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
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

  useEffect(() => {
    fetchPrescriptions();
  }, []);

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

  const handleUpdate = async (prescriptionId, newStatus) => {
    const note = prompt(`Enter note for "${newStatus}":`);
    if (note === null) return;

    setActionLoading(prescriptionId);
    try {
      await updatePrescription(prescriptionId, {
        status: newStatus,
        dispense_note: note || newStatus
      });
      fetchPrescriptions();
    } catch (error) {
      console.error(error);
      alert('Failed to update prescription');
    } finally {
      setActionLoading(null);
    }
  };

  const badgeStyle = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      dispensed: { bg: '#d1fae5', color: '#065f46' },
      out_of_stock: { bg: '#fee2e2', color: '#991b1b' },
    };
    const s = styles[status] || styles.pending;
    return {
      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
      background: s.bg, color: s.color,
    };
  };

  return (
    <Layout>
      <h1 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#fff' }}>Prescriptions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '15px' }}>
        Manage medication requests. Mark as Dispensed or Out of Stock.
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading prescriptions...</p>
      ) : (
        <div className="dash-card" style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{ minWidth: '800px' }}>
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'minmax(200px, 2fr) minmax(180px, 1.5fr) minmax(150px, 1.5fr) minmax(120px, 1fr) minmax(150px, 1fr) minmax(120px, 1fr)',
              alignItems: 'center', 
              padding: '20px 24px', 
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              <div>Medication</div>
              <div>Dose / Freq / Dur</div>
              <div>Created</div>
              <div>Status</div>
              <div>Note</div>
              <div>Actions</div>
            </div>
            
            {[...prescriptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).length > 0 ? (
              [...prescriptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((rx, i, arr) => {
                const created = formatUTC(rx.created_at);
                return (
                  <div key={rx.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(200px, 2fr) minmax(180px, 1.5fr) minmax(150px, 1.5fr) minmax(120px, 1fr) minmax(150px, 1fr) minmax(120px, 1fr)',
                    alignItems: 'center', 
                    padding: '20px 24px', 
                    borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    gap: '16px'
                  }}>
                    <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '15px' }}>{rx.medication_name}</div>
                    
                    <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                      {rx.dosage || '—'} / {rx.frequency || '—'} / {rx.duration || '—'}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <div>{created.date}</div>
                      <div>{created.time}</div>
                    </div>
                    
                    <div>
                      <span style={{ 
                        display: 'inline-block',
                        background: rx.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : rx.status === 'dispensed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: rx.status === 'pending' ? '#f59e0b' : rx.status === 'dispensed' ? '#10b981' : '#ef4444',
                        padding: '4px 16px', 
                        borderRadius: '16px', 
                        fontSize: '12px', 
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {rx.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {rx.dispense_note || '—'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                          {rx.status === 'pending' ? (
                      <select
                        value={rx.status}
                        onChange={(e) => handleUpdate(rx.id, e.target.value)}
                        disabled={actionLoading === rx.id}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--text-muted)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="pending" style={{ background: '#fef3c7', color: '#92400e' }}>Pending</option>
                        <option value="dispensed" style={{ background: '#d1fae5', color: '#065f46' }}>Dispensed</option>
                        <option value="out_of_stock" style={{ background: '#fee2e2', color: '#991b1b' }}>Out of Stock</option>
                      </select>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Done</span>
                    )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No prescriptions found.</div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PrescriptionsPage;