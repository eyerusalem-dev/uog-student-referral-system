import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getReferrals, updateReferral } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const formatUTC = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  const dateObj = new Date(isoString);
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: true }).format(dateObj);
  return { date, time: `${time} UTC` };
};

const ReferralList = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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

  const badgeStyle = (status) => ({
    padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
    background: status === 'accepted' ? '#d1fae5' : status === 'declined' ? '#fee2e2' : '#fef3c7',
    color: status === 'accepted' ? '#065f46' : status === 'declined' ? '#991b1b' : '#92400e',
  });

  return (
    <Layout>
      <h1>Referrals</h1>

      {loading ? (
        <p>Loading referrals...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', color: '#333', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Ref ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Department</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Timestamp (Sent)</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              {user?.role === 'department_receiver' && <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {referrals.length > 0 ? (
              referrals.map((ref) => {
                const sentUTC = formatUTC(ref.created_at);
                const respondedUTC = formatUTC(ref.responded_at);
                
                return (
                  <React.Fragment key={ref.referral_id}>
                    <tr style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === ref.referral_id ? null : ref.referral_id)}>
                      <td style={{ padding: '12px' }}>{ref.referral_id}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{ref.student_name}</td>
                      <td style={{ padding: '12px' }}>{ref.receiving_department_name}</td>
                      
                      {/* NEW: Distinct Date and Time in Table */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>{sentUTC.date}</span>
                          <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                            {sentUTC.time}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={badgeStyle(ref.status)}>{ref.status}</span>
                          {ref.responded_at && (
                            <span style={{ fontSize: '10px', color: '#666' }}>
                              Responded: {respondedUTC.date}
                            </span>
                          )}
                        </div>
                      </td>

                      {user?.role === 'department_receiver' && ref.status === 'pending' && (
                        <td style={{ padding: '12px' }}>
                          <button onClick={() => handleStatusChange(ref.referral_id, 'accepted')} disabled={actionLoading === ref.referral_id} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Accept</button>
                          <button onClick={() => handleStatusChange(ref.referral_id, 'declined')} disabled={actionLoading === ref.referral_id} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Decline</button>
                        </td>
                      )}
                      {user?.role === 'department_receiver' && ref.status !== 'pending' && (
                        <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{ref.response_note || 'No note'}</td>
                      )}
                    </tr>
                    
                    {/* Expanded Clinical Notes */}
                    {expandedId === ref.referral_id && ref.clinical_visit_details && (
                      <tr style={{ background: '#f9fafb' }}>
                        <td colSpan="7" style={{ padding: '20px', color: '#333' }}>
                          <h4 style={{ margin: '0 0 10px', color: '#1053ae' }}>Transferred Clinical Notes:</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                            <div><strong>Symptoms:</strong> {ref.clinical_visit_details.symptoms}</div>
                            <div><strong>Diagnosis:</strong> {ref.clinical_visit_details.diagnosis || 'N/A'}</div>
                            <div><strong>Treatment:</strong> {ref.clinical_visit_details.treatment || 'N/A'}</div>
                            <div><strong>Advice:</strong> {ref.clinical_visit_details.advice || 'N/A'}</div>
                            {ref.clinical_visit_details.lab_used && <div><strong>Lab Note:</strong> {ref.clinical_visit_details.lab_note}</div>}
                            {ref.clinical_visit_details.pharmacy_used && <div><strong>Medication:</strong> {ref.clinical_visit_details.medication_given}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No referrals found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Layout>
  );
};

export default ReferralList;