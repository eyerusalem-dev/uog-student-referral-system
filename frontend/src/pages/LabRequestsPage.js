import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getLabRequests, updateLabRequest } from '../services/api';

const formatUTC = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };

  const dateObj = new Date(isoString);

  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);

  return { date, time: `${time} UTC` };
};

const LabRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await getLabRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch lab requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (requestId) => {
    const note = prompt('Enter result note (example: Blood work result - diabetic):');

    if (note === null) return;

    setActionLoading(requestId);

    try {
      await updateLabRequest(requestId, {
        status: 'completed',
        result_note: note || 'Completed'
      });
      fetchRequests();
    } catch (error) {
      console.error(error);
      alert('Failed to update lab request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Layout>
      <h1>Lab Requests</h1>
      <p style={{ color: '#999', marginBottom: '20px' }}>
        All lab requests ordered by most recent date and time.
      </p>

      {loading ? (
        <p>Loading lab requests...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', color: '#333', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Test</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Reason</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Request Time</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Result Note</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((req) => {
                const created = formatUTC(req.created_at);
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{req.test_name}</td>
                    <td style={{ padding: '12px' }}>{req.reason || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{created.date}</div>
                      <small style={{ color: '#666' }}>{created.time}</small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: req.status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: req.status === 'completed' ? '#065f46' : '#92400e',
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{req.result_note || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      {req.status === 'pending' ? (
                        <button
                          onClick={() => handleComplete(req.id)}
                          disabled={actionLoading === req.id}
                          style={{
                            padding: '8px 12px',
                            background: '#1053ae',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          {actionLoading === req.id ? 'Saving...' : 'Mark Completed'}
                        </button>
                      ) : (
                        <span style={{ color: '#666', fontSize: '13px' }}>Done</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No lab requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Layout>
  );
};

export default LabRequestsPage;