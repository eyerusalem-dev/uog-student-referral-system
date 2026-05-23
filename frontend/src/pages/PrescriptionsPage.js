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
      <h1>Prescriptions</h1>
      <p style={{ color: '#999', marginBottom: '20px' }}>
        Manage medication requests. Mark as Dispensed or Out of Stock.
      </p>

      {loading ? (
        <p>Loading prescriptions...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', color: '#333', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Medication</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Dose / Frequency / Duration</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Note</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length > 0 ? (
              prescriptions.map((rx) => {
                const created = formatUTC(rx.created_at);
                return (
                  <tr key={rx.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{rx.medication_name}</td>
                    <td style={{ padding: '12px' }}>{rx.dosage || '—'} / {rx.frequency || '—'} / {rx.duration || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{created.date}</div>
                      <small style={{ color: '#666' }}>{created.time}</small>
                    </td>
                    <td style={{ padding: '12px' }}><span style={badgeStyle(rx.status)}>{rx.status}</span></td>
                    <td style={{ padding: '12px' }}>{rx.dispense_note || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      {rx.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdate(rx.id, 'dispensed')} disabled={actionLoading === rx.id} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>
                            Dispense
                          </button>
                          <button onClick={() => handleUpdate(rx.id, 'out_of_stock')} disabled={actionLoading === rx.id} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Out of Stock
                          </button>
                        </>
                      )}
                      {rx.status !== 'pending' && <span style={{ color: '#666', fontSize: '13px' }}>Done</span>}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No prescriptions found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </Layout>
  );
};

export default PrescriptionsPage;