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

const SortArrows = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: '4px', verticalAlign: 'middle', opacity: 0.5 }}><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

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
      // Sort from latest to oldest
      const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRequests(sorted);
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
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Lab Requests</h1>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px' }}>
              <SearchIcon />
              <input type="text" placeholder="Search" style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0 8px', fontSize: '13px', width: '160px', color: '#fff' }} />
              <button style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>✕</button>
            </div>

            {/* Filter Button */}
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '500' }}>
              <FilterIcon /> Filter
            </button>

            {/* Sort Button */}
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '500' }}>
              <SortArrows /> Sort by <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            {/* Add New Button */}
            <button style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              + Add New Request
            </button>
          </div>
        </div>

        {/* Table Area */}
        {loading ? (
          <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading lab requests...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>#</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Test Title <SortArrows /></th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Category <SortArrows /></th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Request Time <SortArrows /></th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Status <SortArrows /></th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((req, index) => {
                    const created = formatUTC(req.created_at);
                    const isActive = req.status === 'completed';
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{req.test_name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Reason: {req.reason || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                            Laboratory
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '2px' }}>{created.date}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{created.time}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isActive ? '#10b981' : '#f59e0b',
                          }}>
                            {isActive ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          {req.status === 'pending' ? (
                            <button
                              onClick={() => handleComplete(req.id)}
                              disabled={actionLoading === req.id}
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(14, 165, 233, 0.1)',
                                color: '#0ea5e9',
                                border: '1px solid rgba(14, 165, 233, 0.2)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {actionLoading === req.id ? '...' : 'Complete'}
                            </button>
                          ) : (
                            <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              •••
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                      No lab requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LabRequestsPage;