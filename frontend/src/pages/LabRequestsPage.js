import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
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

// Modal Component for entering lab results
const LabResultModal = ({ isOpen, onClose, onSubmit, request, isSubmitting }) => {
  const [resultText, setResultText] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setResultText('');
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = resultText.trim();
    if (!trimmed) {
      setError('Results cannot be empty');
      return;
    }
    onSubmit(request.id, trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Enter Lab Results</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Request Info */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Patient Name</div>
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{request.patient_name || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>University ID</div>
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{request.patient_university_id || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Test Type</div>
              <div style={{ fontSize: '14px', color: '#0ea5e9', fontWeight: '600' }}>{request.test_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Requesting Clinician</div>
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{request.clinician_username || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Results Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#e2e8f0', fontWeight: '600', marginBottom: '8px' }}>
            Lab Results <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            ref={textareaRef}
            value={resultText}
            onChange={(e) => {
              setResultText(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter lab results (e.g., Blood work result - diabetic, CBC: WBC 7.5, RBC 4.8, Platelets 250k...)"
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '16px',
              background: 'rgba(255,255,255,0.05)',
              border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
          {error && (
            <div style={{
              color: '#ef4444',
              fontSize: '13px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}
          <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>
            Press Enter to submit, Shift+Enter for new line
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !resultText.trim()}
            style={{
              padding: '12px 24px',
              background: resultText.trim() ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSubmitting || !resultText.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Complete & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const LabRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { user } = useAuth();
  const pollingRef = useRef(null);

  // Fetch lab requests
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

  // Initial fetch and polling for real-time updates
  useEffect(() => {
    fetchRequests();
    
    // Poll every 5 seconds for new requests (real-time feel)
    pollingRef.current = setInterval(fetchRequests, 5000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Open modal for completing a lab request
  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  // Submit lab results
  const handleComplete = async (requestId, resultText) => {
    setActionLoading(requestId);
    setIsSubmitting(true);
    try {
      await updateLabRequest(requestId, {
        status: 'completed',
        result_note: resultText
      });
      setShowModal(false);
      setSelectedRequest(null);
      fetchRequests(); // Refresh the list
      
      // Show success notification
      alert('Lab results saved successfully! The requesting clinician has been notified.');
    } catch (error) {
      console.error(error);
      if (error.response?.data?.result_note) {
        alert(error.response.data.result_note);
      } else {
        alert('Failed to update lab request');
      }
    } finally {
      setActionLoading(null);
      setIsSubmitting(false);
    }
  };

  // Filter requests based on search and status
  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchQuery === '' || 
      req.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.patient_name && req.patient_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.patient_university_id && req.patient_university_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Lab Work Queue</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
              {filteredRequests.filter(r => r.status === 'pending').length} pending requests
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px' }}>
              <SearchIcon />
              <input 
                type="text" 
                placeholder="Search by test, patient..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0 8px', fontSize: '13px', width: '200px', color: '#fff' }} 
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['all', 'pending', 'completed'].map(status => (
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
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button 
              onClick={fetchRequests}
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

        {/* Table Area */}
        {loading ? (
          <p style={{ padding: '20px', color: '#9ca3af' }}>Loading lab requests...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>#</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Student</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Test Type <SortArrows /></th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Requesting Clinician</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Date Submitted <SortArrows /></th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>Status <SortArrows /></th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req, index) => {
                    const created = formatUTC(req.created_at);
                    const isPending = req.status === 'pending';
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#9ca3af' }}>{index + 1}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            {req.patient_name || 'N/A'}
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                            ID: {req.patient_university_id || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{req.test_name}</div>
                          {req.reason && (
                            <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
                              Reason: {req.reason.length > 40 ? req.reason.substring(0, 40) + '...' : req.reason}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#e2e8f0', fontSize: '13px' }}>
                            {req.clinician_username || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '2px' }}>{created.date}</div>
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>{created.time}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isPending ? '#f59e0b' : '#10b981',
                          }}>
                            {isPending ? 'Pending' : 'Completed'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          {isPending ? (
                            <button
                              onClick={() => handleOpenModal(req)}
                              disabled={actionLoading === req.id}
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(14, 165, 233, 0.15)',
                                color: '#0ea5e9',
                                border: '1px solid rgba(14, 165, 233, 0.3)',
                                borderRadius: '8px',
                                cursor: actionLoading === req.id ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginLeft: 'auto'
                              }}
                            >
                              {actionLoading === req.id ? (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                  Open
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#9ca3af',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                cursor: 'default',
                                fontSize: '13px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginLeft: 'auto'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                      {searchQuery || filterStatus !== 'all' ? (
                        'No lab requests match your search criteria.'
                      ) : (
                        'No lab requests found. New requests will appear here automatically.'
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

      {/* Lab Result Modal */}
      <LabResultModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRequest(null);
        }}
        onSubmit={handleComplete}
        request={selectedRequest}
        isSubmitting={isSubmitting}
      />

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

export default LabRequestsPage;