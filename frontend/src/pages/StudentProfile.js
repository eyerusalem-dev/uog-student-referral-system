import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudent, updateReferral } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Ethiopian Time Formatter
const formatEAT = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A', full: 'N/A' };
  const dateObj = new Date(isoString);
  const optionsDate = { timeZone: 'Africa/Addis_Ababa', month: 'short', day: 'numeric', year: 'numeric' };
  const optionsTime = { timeZone: 'Africa/Addis_Ababa', hour: '2-digit', minute: '2-digit', hour12: true };
  const date = new Intl.DateTimeFormat('en-US', optionsDate).format(dateObj);
  const time = new Intl.DateTimeFormat('en-US', optionsTime).format(dateObj);
  return { date, time: `${time} EAT`, full: `${date} at ${time} EAT` };
};

const getRelativeTime = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const isOlderThan24h = (isoString) => {
  if (!isoString) return false;
  return (Date.now() - new Date(isoString).getTime()) > 24 * 60 * 60 * 1000;
};

const EmptyState = ({ message, icon }) => (
  <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '14px', fontWeight: '500' }}>{message}</div>
  </div>
);

const Skeleton = () => (
  <div className="skeleton-container" style={{ padding: '32px' }}>
    <div style={{ height: '40px', width: '30%', background: '#e2e8f0', borderRadius: '8px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
      <div style={{ height: '400px', background: '#e2e8f0', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ height: '200px', background: '#e2e8f0', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '200px', background: '#e2e8f0', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
    <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
  </div>
);

const StudentProfile = () => {
  const { universityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State declarations
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  // State for detail modals
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineNote, setDeclineNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fake audit log call
    console.log(`[AUDIT] Profile viewed by ${user?.username} (${user?.role}) from IP at ${new Date().toISOString()}`);
    fetchStudent();
  }, [universityId, user]);

  const fetchStudent = async () => {
    try {
      const response = await getStudent(universityId);
      setStudent(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReferralAction = async (action) => {
    if (!selectedReferral) return;
    
    setIsSubmitting(true);
    try {
      const updateData = {
        status: action === 'accept' ? 'accepted' : 'declined',
        responded_at: new Date().toISOString()
      };
      
      if (action === 'decline') {
        updateData.response_note = declineNote;
      }
      
      await updateReferral(selectedReferral.id || selectedReferral.referral_id, updateData);
      
      // Update the local state
      setSelectedReferral({
        ...selectedReferral,
        ...updateData
      });
      
      // Refresh student data to get updated referral
      fetchStudent();
      
      setShowDeclineForm(false);
      setDeclineNote('');
    } catch (error) {
      console.error('Error updating referral:', error);
      alert('Failed to update referral status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Layout><Skeleton /></Layout>;
  if (!student) return <Layout><p style={{ color: '#fff' }}>Student not found.</p></Layout>;

  const isClinician = user?.role === 'clinician' || user?.role === 'admin';
  const fullName = `${student.first_name || 'Nahom'} ${student.last_name || 'Yonas'}`.trim();
  const initials = `${student.first_name?.charAt(0) || 'N'}${student.last_name?.charAt(0) || 'Y'}`.toUpperCase();

  const mockVitals = [
    { date: '2026-05-24T10:00:00Z', bp: '120/80', hr: '72 bpm', temp: '36.8 °C', bmi: '22.4', o2: '98%' },
    { date: '2026-05-21T09:00:00Z', bp: '122/82', hr: '75 bpm', temp: '37.1 °C', bmi: '22.4', o2: '97%' }
  ];

  const mockLabs = [
    { id: 'L1', test: 'Complete Blood Count', date: '2026-05-20T08:00:00Z', status: 'Completed', flag: 'Normal' },
    { id: 'L2', test: 'Lipid Panel', date: '2026-05-24T08:00:00Z', status: 'Pending', flag: 'Waiting' }
  ];

  return (
    <Layout>
      <div className="profile-container">
        
        {/* Sticky Header */}
        <div className="sticky-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '700' }}>{fullName}</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '500' }}>ID: {student.university_id || universityId}</p>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search history (Ctrl+F)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export PDF
            </button>
            {isClinician && (
              <>
                <Link to={`/visits/new?student=${universityId}`} className="btn-primary">+ New Visit</Link>
                <Link to={`/referrals/new?student=${universityId}`} className="btn-primary-dark">→ Send Referral</Link>
              </>
            )}
          </div>
        </div>

        {/* Emergency Banner */}
        <div className="emergency-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <div>
            <strong>CRITICAL ALERTS:</strong> Severe Allergy (Penicillin, Peanuts) • Chronic Condition (Asthma)
          </div>
        </div>

        <div className={`layout-grid ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          
          {/* Collapsible Sidebar */}
          {sidebarOpen && (
            <div className="sidebar-snapshot">
              <div className="profile-card">
                <div className="avatar-wrapper">
                  {student.photo_url ? (
                    <img src={student.photo_url} alt={fullName} />
                  ) : (
                    <div className="avatar-fallback">{initials}</div>
                  )}
                  <div className="status-dot"></div>
                </div>
                <h2>{fullName}</h2>
                <div className="demographics">21 yrs • Male • O+</div>
                <Link to={`/students/edit/${universityId}`} className="btn-outline">Update Profile</Link>
              </div>

              <div className="info-card">
                <h3>Academic Context</h3>
                <div className="info-row"><span>Department:</span> <strong>{student.department || 'Computer Science'}</strong></div>
                <div className="info-row"><span>Program:</span> <strong>Undergraduate</strong></div>
                <div className="info-row"><span>Year:</span> <strong>{student.year_of_study || 3}</strong></div>
              </div>

              <div className="info-card">
                <h3>Vitals Summary</h3>
                <div className="info-row"><span>BP:</span> <strong>120/80</strong> <span className="trend up">↑</span></div>
                <div className="info-row"><span>HR:</span> <strong>72 bpm</strong> <span className="trend stable">→</span></div>
                <div className="info-row"><span>Temp:</span> <strong>36.8 °C</strong></div>
                <div className="info-row"><span>BMI:</span> <strong>22.4</strong></div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="main-feed">
            
            <div className="section-header">
              <h3>Clinical History</h3>
              <div className="view-toggle">
                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>Grid</button>
                <button className={viewMode === 'timeline' ? 'active' : ''} onClick={() => setViewMode('timeline')}>Timeline</button>
              </div>
            </div>

            {/* Visits Section */}
            <div className="feed-section">
              <h4 className="section-title"><span className="icon">🩺</span> Encounters</h4>
              <div className={viewMode === 'grid' ? 'card-grid' : 'timeline-list'}>
                {student.visits && student.visits.length > 0 ? (
                  student.visits.map((visit) => {
                    const eat = formatEAT(visit.visit_date);
                    const locked = isOlderThan24h(visit.visit_date);
                    return (
                      <div key={visit.id} className="clinical-card">
                        <div className="card-header">
                          <div className="card-meta">
                            <span className="badge date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {eat.date}</span>
                            <span className="badge time"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {eat.time}</span>
                            {locked && <span className="badge lock" title="Read-only (older than 24h)">🔒</span>}
                          </div>
                            <div className="card-actions">
                            <button title="View Details" onClick={() => navigate(`/visits/${visit.id}/details?student=${universityId}`)}>👁️</button>
                            <button title="Print" onClick={() => navigate(`/visits/${visit.id}/details?student=${universityId}`)}>🖨️</button>
                          </div>
                        </div>
                        <div className="card-provider">Provider: <strong>{visit.clinician_username}</strong></div>
                        <div className="card-body">
                          <div className="data-row"><strong>Symptoms:</strong> <span>{visit.symptoms || 'None reported'}</span></div>
                          <div className="data-row"><strong>Diagnosis:</strong> <span>{visit.diagnosis || 'Pending'}</span></div>
                          <div className="data-row"><strong>Treatment:</strong> <span>{visit.treatment || 'Observation'}</span></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState message="No clinical visits recorded yet." icon="🏥" />
                )}
              </div>
            </div>
            <div className="feed-section">
              <h4 className="section-title"><span className="icon">🩺</span> Encounters</h4>
              <div className={viewMode === 'grid' ? 'card-grid' : 'timeline-list'}>
                {student.visits && student.visits.length > 0 ? (
                  student.visits.map((visit) => {
                    const eat = formatEAT(visit.visit_date);
                    const locked = isOlderThan24h(visit.visit_date);
                    return (
                      <div key={visit.id} className="clinical-card">
                        <div className="card-header">
                          <div className="card-meta">
                            <span className="badge date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {eat.date}</span>
                            <span className="badge time"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {eat.time}</span>
                            {locked && <span className="badge lock" title="Read-only (older than 24h)">🔒</span>}
                          </div>
                          <div className="card-actions">
                            { (user?.role === 'clinician' || user?.role === 'admin') && (
                            <button title="View Details" onClick={() => navigate(`/visits/${visit.id}/details?student=${universityId}`)}>👁️</button>
                          ) }
                            <button title="Print" onClick={() => navigate(`/visits/${visit.id}/details?student=${universityId}`)}>🖨️</button>
                          </div>
                        </div>
                        <div className="card-provider">Provider: <strong>{visit.clinician_username}</strong></div>
                        <div className="card-body">
                          <div className="data-row"><strong>Symptoms:</strong> <span>{visit.symptoms || 'None reported'}</span></div>
                          <div className="data-row"><strong>Diagnosis:</strong> <span>{visit.diagnosis || 'Pending'}</span></div>
                          <div className="data-row"><strong>Treatment:</strong> <span>{visit.treatment || 'Observation'}</span></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState message="No clinical visits recorded yet." icon="🏥" />
                )}
              </div>
            </div>

            {/* Referrals Section */}
            <div className="feed-section">
              <h4 className="section-title"><span className="icon">↗️</span> Referrals</h4>
              <div className="card-grid">
                {student.referrals && student.referrals.length > 0 ? (
                  student.referrals.map((ref) => {
                    const eat = formatEAT(ref.created_at || '2026-05-24T10:00:00Z');
                    const urgencyColor = ref.urgency === 'Critical' ? '#ef4444' : ref.urgency === 'Urgent' ? '#f59e0b' : 'transparent';
                    return (
                      <div key={ref.referral_id} className="clinical-card referral-card" style={{ borderLeft: ref.urgency && ref.urgency !== 'Routine' ? `4px solid ${urgencyColor}` : undefined }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div className="card-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={`status-badge ${ref.status?.toLowerCase() || 'pending'}`}>{ref.status?.toUpperCase() || 'PENDING'}</span>
                            {ref.urgency && ref.urgency !== 'Routine' && (
                              <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: urgencyColor, color: '#fff' }}>{ref.urgency.toUpperCase()}</span>
                            )}
                            <span className="text-muted">{getRelativeTime(ref.created_at || '2026-05-24T10:00:00Z')}</span>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }} title="Click to copy Tracking ID" onClick={() => { navigator.clipboard.writeText(ref.referral_id); alert(`Copied ${ref.referral_id} to clipboard`); }}>
                            {ref.referral_id}
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="data-row"><strong>To:</strong> <span>{ref.receiving_department_name}</span></div>
                          <div className="data-row"><strong>From:</strong> <span>{ref.referred_by_username || 'Clinician'} (Sent {eat.date})</span></div>
                          <div className="data-row"><strong>Reason:</strong> <span>{ref.reason}</span></div>
                          {ref.status !== 'pending' && (
                            <div className="data-row"><strong>Note:</strong> <span>{ref.response_note || 'No notes provided.'}</span></div>
                          )}
                          <button className="btn-link" onClick={() => setSelectedReferral(ref)}>View Details</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState message="No referrals sent." icon="📬" />
                )}
              </div>
            </div>
            <div className="feed-section">
              <h4 className="section-title"><span className="icon">↗️</span> Referrals</h4>
              <div className="card-grid">
                {student.referrals && student.referrals.length > 0 ? (
                  student.referrals.map((ref) => {
                    const eat = formatEAT(ref.created_at || '2026-05-24T10:00:00Z');
                    const urgencyColor = ref.urgency === 'Critical' ? '#ef4444' : ref.urgency === 'Urgent' ? '#f59e0b' : 'transparent';
                    return (
                      <div key={ref.referral_id} className="clinical-card referral-card" style={{ borderLeft: ref.urgency && ref.urgency !== 'Routine' ? `4px solid ${urgencyColor}` : undefined }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div className="card-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={`status-badge ${ref.status?.toLowerCase() || 'pending'}`}>
                              {ref.status?.toUpperCase() || 'PENDING'}
                            </span>
                            {ref.urgency && ref.urgency !== 'Routine' && (
                              <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: urgencyColor, color: '#fff' }}>
                                {ref.urgency.toUpperCase()}
                              </span>
                            )}
                            <span className="text-muted">{getRelativeTime(ref.created_at || '2026-05-24T10:00:00Z')}</span>
                          </div>
                          <div 
                            style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            title="Click to copy Tracking ID"
                            onClick={() => { navigator.clipboard.writeText(ref.referral_id); alert(`Copied ${ref.referral_id} to clipboard`); }}
                          >
                            {ref.referral_id}
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="data-row"><strong>To:</strong> <span>{ref.receiving_department_name}</span></div>
                          <div className="data-row"><strong>From:</strong> <span>{ref.referred_by_username || 'Clinician'} (Sent {eat.date})</span></div>
                          <div className="data-row"><strong>Reason:</strong> <span>{ref.reason}</span></div>
                          {ref.status !== 'pending' && <div className="data-row"><strong>Note:</strong> <span>{ref.response_note || 'No notes provided.'}</span></div>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState message="No referrals sent." icon="📬" />
                )}
              </div>
            </div>

            {/* Prescriptions Section */}
            <div className="feed-section">
              <h4 className="section-title"><span className="icon">💊</span> Active Prescriptions</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Dosage & Freq</th>
                      <th>Prescriber</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Albuterol Inhaler</strong></td>
                      <td>2 puffs QID PRN</td>
                      <td>Dr. Selam T.</td>
                      <td>May 21, 2026</td>
                      <td><span className="status-badge dispensed">Dispensed</span></td>
                      <td><button className="btn-link">Renew</button></td>
                    </tr>
                    <tr>
                      <td><strong>Ibuprofen</strong></td>
                      <td>400mg PO TID</td>
                      <td>Dr. Dawit R.</td>
                      <td>May 24, 2026</td>
                      <td><span className="status-badge pending">Pending</span></td>
                      <td><button className="btn-link">Cancel</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Labs Section */}
            <div className="feed-section">
              <h4 className="section-title"><span className="icon">🔬</span> Labs & Diagnostics</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Requested Date</th>
                      <th>Status</th>
                      <th>Result/Flag</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLabs.map(lab => (
                      <tr key={lab.id}>
                        <td><strong>{lab.test}</strong></td>
                        <td>{formatEAT(lab.date).date}</td>
                        <td><span className={`status-badge ${lab.status.toLowerCase()}`}>{lab.status}</span></td>
                        <td>{lab.flag === 'Normal' ? <span style={{color: '#10b981'}}>Normal</span> : <span style={{color: '#f59e0b'}}>{lab.flag}</span>}</td>
                        <td><button className="btn-link" disabled={lab.status !== 'Completed'}>Download</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className="btn-outline">Load Older Records</button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="privacy-footer">
          <p>Confidential Medical Record • Handled in accordance with Ethiopian Health Data Privacy Guidelines.</p>
          <p>Activity logged for audit purposes. Last synced: {new Date().toLocaleTimeString()} EAT</p>
        </footer>

      </div>

      {/* Detail Modal for Clinical Note */}
      {selectedVisit && (user?.role === 'clinician' || user?.role === 'admin') && (
        <div className="modal-overlay" onClick={() => setSelectedVisit(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Clinical Note Detail</h3>
            <div className="data-row"><strong>Patient:</strong> {fullName} ({student.university_id})</div>
            <div className="data-row"><strong>Date:</strong> {formatEAT(selectedVisit.visit_date).full}</div>
            <div className="data-row"><strong>Symptoms:</strong> {selectedVisit.symptoms || 'None'}</div>
            <div className="data-row"><strong>Diagnosis:</strong> {selectedVisit.diagnosis || 'Pending'}</div>
            <div className="data-row"><strong>Treatment:</strong> {selectedVisit.treatment || 'Observation'}</div>
            <button className="btn-primary" style={{ marginTop: '12px' }} onClick={() => setSelectedVisit(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Enhanced Referral Detail Modal */}
      {selectedReferral && (
        <div className="referral-modal-overlay" onClick={() => setSelectedReferral(null)}>
          <div className="referral-modal-content" onClick={e => e.stopPropagation()}>
            {/* Modal Header with Close Button */}
            <div className="referral-modal-header">
              <div className="referral-modal-title">
                <span className="referral-modal-icon">↗️</span>
                <span>Referral Details</span>
              </div>
              <button className="referral-modal-close" onClick={() => setSelectedReferral(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Urgency Banner */}
            {selectedReferral.urgency === 'Critical' && (
              <div className="urgency-banner critical">
                ⚠️ CRITICAL - Immediate Attention Required
              </div>
            )}
            {selectedReferral.urgency === 'Urgent' && (
              <div className="urgency-banner urgent">
                ⚡ URGENT - Priority Review Needed
              </div>
            )}

            {/* Tracking ID - Most Prominent */}
            <div className="referral-tracking-section">
              <div className="referral-tracking-label">Tracking ID</div>
              <div className="referral-tracking-id">{selectedReferral.referral_id}</div>
              <div className="referral-tracking-meta">
                <span className={`status-badge-large ${selectedReferral.status?.toLowerCase() || 'pending'}`}>
                  {selectedReferral.status?.toUpperCase() || 'PENDING'}
                </span>
                <span className="referral-timestamp">
                  {selectedReferral.created_at ? formatEAT(selectedReferral.created_at).full : 'N/A'}
                </span>
              </div>
            </div>

            {/* Patient & Department Info - 2 Column Grid */}
            <div className="referral-info-grid">
              <div className="referral-info-card">
                <div className="referral-info-label">Patient</div>
                <div className="referral-info-value">{fullName}</div>
                <div className="referral-info-sub">ID: {student.university_id}</div>
              </div>
              <div className="referral-info-card">
                <div className="referral-info-label">Receiving Department</div>
                <div className="referral-info-value">{selectedReferral.receiving_department_name}</div>
                {selectedReferral.urgency && (
                  <div className={`referral-urgency-badge ${selectedReferral.urgency.toLowerCase()}`}>
                    {selectedReferral.urgency.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="referral-info-card">
                <div className="referral-info-label">Referred By</div>
                <div className="referral-info-value">{selectedReferral.referred_by_username || 'Clinician'}</div>
              </div>
              <div className="referral-info-card">
                <div className="referral-info-label">Referral Date</div>
                <div className="referral-info-value">
                  {selectedReferral.created_at ? formatEAT(selectedReferral.created_at).date : 'N/A'}
                </div>
              </div>
            </div>

            {/* Reason for Referral */}
            <div className="referral-section">
              <div className="referral-section-title">Reason for Referral</div>
              <div className="referral-section-content">{selectedReferral.reason || 'No reason provided'}</div>
            </div>

            {/* Attached Clinical Note */}
            {selectedReferral.clinical_note && (
              <div className="referral-section clinical-note-section">
                <div className="referral-section-title">
                  📋 Attached Clinical Note
                </div>
                <div className="clinical-note-grid">
                  <div className="clinical-note-item">
                    <div className="clinical-note-label">Chief Complaint / Symptoms</div>
                    <div className="clinical-note-value">{selectedReferral.clinical_note.symptoms || 'None recorded'}</div>
                  </div>
                  <div className="clinical-note-item">
                    <div className="clinical-note-label">Diagnosis</div>
                    <div className="clinical-note-value">{selectedReferral.clinical_note.diagnosis || 'Pending'}</div>
                  </div>
                  <div className="clinical-note-item">
                    <div className="clinical-note-label">Vital Signs</div>
                    <div className="clinical-note-value">
                      {selectedReferral.clinical_note.vitals ? (
                        <>BP: {selectedReferral.clinical_note.vitals.bp} | HR: {selectedReferral.clinical_note.vitals.hr} | Temp: {selectedReferral.clinical_note.vitals.temp}</>
                      ) : 'Not recorded'}
                    </div>
                  </div>
                  <div className="clinical-note-item">
                    <div className="clinical-note-label">Treatment Given</div>
                    <div className="clinical-note-value">{selectedReferral.clinical_note.treatment || 'None'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Response Section (if already responded) */}
            {selectedReferral.status !== 'pending' && (
              <div className="referral-section response-section">
                <div className="referral-section-title">
                  Response
                </div>
                <div className="response-info">
                  <span className={`response-status ${selectedReferral.status?.toLowerCase()}`}>
                    {selectedReferral.status === 'accepted' ? '✅ ACCEPTED' : '❌ DECLINED'}
                  </span>
                  {selectedReferral.response_note && (
                    <div className="response-note">
                      <strong>Note:</strong> {selectedReferral.response_note}
                    </div>
                  )}
                  {selectedReferral.responded_at && (
                    <div className="response-timestamp">
                      Responded: {formatEAT(selectedReferral.responded_at).full}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons - Only for Intake Team with pending referrals */}
            {selectedReferral.status === 'pending' && (user?.role === 'intake_team' || user?.role === 'admin') && (
              <div className="referral-actions">
                <button 
                  className="btn-accept"
                  onClick={() => handleReferralAction('accept')}
                  disabled={isSubmitting}
                >
                  ✅ Accept Referral
                </button>
                <button 
                  className="btn-decline"
                  onClick={() => setShowDeclineForm(true)}
                  disabled={isSubmitting}
                >
                  ❌ Decline Referral
                </button>
                <button 
                  className="btn-print-referral"
                  onClick={() => window.print()}
                >
                  🖨️ Print Referral
                </button>
              </div>
            )}

            {/* Decline Form Modal */}
            {showDeclineForm && (
              <div className="decline-form-overlay">
                <div className="decline-form-content">
                  <h4>Decline Referral</h4>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                    Please provide a reason for declining this referral:
                  </p>
                  <textarea
                    value={declineNote}
                    onChange={(e) => setDeclineNote(e.target.value)}
                    placeholder="Enter your response note..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    required
                  />
                  <div className="decline-form-actions">
                    <button 
                      className="btn-cancel-decline"
                      onClick={() => { setShowDeclineForm(false); setDeclineNote(''); }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-confirm-decline"
                      onClick={() => handleReferralAction('decline')}
                      disabled={!declineNote.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Confirm Decline'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx="true">{`
        .profile-container {
          background: #f8fafc;
          min-height: 100vh;
          padding: 24px;
          border-radius: 24px;
          margin: -24px;
          color: #0f172a;
          font-family: "Inter", -apple-system, sans-serif;
        }

        .sticky-header {
          position: sticky;
          top: -24px;
          background: rgba(248, 250, 252, 0.95);
          backdrop-filter: blur(12px);
          padding: 24px 0;
          margin-bottom: 24px;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 12px;
          gap: 8px;
        }
        .search-bar input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          width: 200px;
        }

        .btn-primary, .btn-primary-dark, .btn-secondary, .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary { background: #0ea5e9; color: #fff; }
        .btn-primary:hover { background: #0284c7; }
        .btn-primary-dark { background: #0f172a; color: #fff; }
        .btn-primary-dark:hover { background: #1e293b; }
        .btn-secondary { background: #fff; color: #0f172a; border: 1px solid #cbd5e1; }
        .btn-secondary:hover { background: #f1f5f9; }
        .btn-outline { background: transparent; color: #0ea5e9; border: 1px solid #0ea5e9; width: 100%; justify-content: center; }
        .btn-outline:hover { background: #f0f9ff; }
        .btn-link { background: transparent; border: none; color: #0ea5e9; font-weight: 600; cursor: pointer; }
        .btn-link:disabled { color: #94a3b8; cursor: not-allowed; }

        .emergency-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
        }

        .layout-grid {
          display: grid;
          gap: 32px;
          align-items: start;
          transition: all 0.3s;
        }
        .layout-grid.sidebar-open { grid-template-columns: 320px 1fr; }
        .layout-grid.sidebar-closed { grid-template-columns: 1fr; }

        .sidebar-snapshot {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 100px;
        }

        .profile-card, .info-card {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
        }

        .profile-card { text-align: center; }
        .avatar-wrapper { position: relative; display: inline-block; margin-bottom: 16px; }
        .avatar-wrapper img, .avatar-fallback { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
        .avatar-fallback { background: linear-gradient(135deg, #0ea5e9, #10b981); color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; }
        .status-dot { position: absolute; bottom: 4px; right: 4px; width: 16px; height: 16px; border-radius: 50%; background: #10b981; border: 3px solid #fff; }
        .profile-card h2 { margin: 0 0 4px 0; font-size: 20px; }
        .demographics { color: #64748b; font-size: 14px; margin-bottom: 20px; }

        .info-card h3 { margin: 0 0 16px 0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; color: #334155; }
        .info-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 12px; }
        .info-row span { color: #64748b; }
        .info-row strong { color: #0f172a; }
        .trend.up { color: #ef4444; margin-left: 4px; }
        .trend.stable { color: #10b981; margin-left: 4px; }

        .main-feed { display: flex; flex-direction: column; gap: 32px; }

        .section-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
        .section-header h3 { margin: 0; font-size: 18px; }
        .view-toggle { display: flex; background: #e2e8f0; border-radius: 8px; padding: 4px; }
        .view-toggle button { background: transparent; border: none; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
        .view-toggle button.active { background: #fff; color: #0f172a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .feed-section { margin-bottom: 16px; }
        .section-title { margin: 0 0 16px 0; font-size: 16px; color: #475569; display: flex; align-items: center; gap: 8px; }

        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .timeline-list { display: flex; flex-direction: column; gap: 16px; }

        .clinical-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; }
        .clinical-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-color: #cbd5e1; }
        
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .card-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .badge.date { background: #f0f9ff; color: #0369a1; }
        .badge.time { background: #f8fafc; color: #64748b; }
        .badge.lock { background: #f1f5f9; color: #94a3b8; cursor: help; }
        
        .card-actions button { background: transparent; border: none; font-size: 16px; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; }
        .card-actions button:hover { background: #f1f5f9; }

        .card-provider { font-size: 13px; color: #64748b; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
        
        .card-body { display: flex; flex-direction: column; gap: 12px; font-size: 14px; }
        .data-row { display: flex; flex-direction: column; gap: 4px; }
        .data-row strong { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .data-row span { color: #0f172a; line-height: 1.5; }

        .referral-card { border-left: 4px solid #cbd5e1; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-badge.pending { background: #fef3c7; color: #d97706; }
        .status-badge.accepted { background: #ecfdf5; color: #047857; }
        .status-badge.declined { background: #fef2f2; color: #b91c1c; }
        .status-badge.dispensed { background: #ecfdf5; color: #047857; }
        .status-badge.completed { background: #ecfdf5; color: #047857; }
        
        .sla-countdown { margin-top: 12px; font-size: 12px; color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .sla-countdown::before { content: "⏱"; }

        .table-container { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        .data-table th { padding: 16px 20px; background: #f8fafc; color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #f8fafc; }

        .privacy-footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; line-height: 1.6; }

        @media (max-width: 1024px) {
          .layout-grid.sidebar-open { grid-template-columns: 1fr; }
          .sidebar-snapshot { position: static; flex-direction: row; flex-wrap: wrap; }
          .profile-card, .info-card { flex: 1; min-width: 250px; }
        }
        @media (max-width: 768px) {
          .card-grid { grid-template-columns: 1fr; }
          .sidebar-snapshot { flex-direction: column; }
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        /* Enhanced Referral Modal Styles */
        .referral-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }
        .referral-modal-content {
          background: #fff;
          border-radius: 16px;
          padding: 0;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .referral-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 16px 16px 0 0;
        }
        .referral-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .referral-modal-icon {
          font-size: 20px;
        }
        .referral-modal-close {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          color: #64748b;
          transition: all 0.2s;
        }
        .referral-modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        /* Urgency Banners */
        .urgency-banner {
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }
        .urgency-banner.critical {
          background: #fef2f2;
          color: #dc2626;
          border-bottom: 2px solid #fecaca;
        }
        .urgency-banner.urgent {
          background: #fffbeb;
          color: #d97706;
          border-bottom: 2px solid #fde68a;
        }

        /* Tracking Section */
        .referral-tracking-section {
          padding: 24px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .referral-tracking-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .referral-tracking-id {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          font-family: monospace;
          margin-bottom: 12px;
        }
        .referral-tracking-meta {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .status-badge-large {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-badge-large.pending { background: #fef3c7; color: #d97706; }
        .status-badge-large.accepted { background: #ecfdf5; color: #047857; }
        .status-badge-large.declined { background: #fef2f2; color: #dc2626; }
        .referral-timestamp {
          font-size: 13px;
          color: #64748b;
        }

        /* Info Grid */
        .referral-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 20px 24px;
        }
        .referral-info-card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 10px;
        }
        .referral-info-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .referral-info-value {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }
        .referral-info-sub {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }
        .referral-urgency-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }
        .referral-urgency-badge.critical { background: #ef4444; color: #fff; }
        .referral-urgency-badge.urgent { background: #f59e0b; color: #fff; }
        .referral-urgency-badge.routine { background: #94a3b8; color: #fff; }

        /* Sections */
        .referral-section {
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .referral-section-title {
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .referral-section-content {
          font-size: 14px;
          color: #0f172a;
          line-height: 1.6;
        }

        /* Clinical Note Section */
        .clinical-note-section {
          background: #f0f9ff;
        }
        .clinical-note-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .clinical-note-item {
          background: #fff;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #bae6fd;
        }
        .clinical-note-label {
          font-size: 11px;
          font-weight: 600;
          color: #0369a1;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .clinical-note-value {
          font-size: 13px;
          color: #0c4a6e;
        }

        /* Response Section */
        .response-section {
          background: #f8fafc;
        }
        .response-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .response-status {
          font-size: 16px;
          font-weight: 700;
        }
        .response-status.accepted { color: #047857; }
        .response-status.declined { color: #dc2626; }
        .response-note {
          font-size: 14px;
          color: #475569;
          padding: 12px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .response-timestamp {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Action Buttons */
        .referral-actions {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          background: #f8fafc;
          flex-wrap: wrap;
        }
        .btn-accept {
          flex: 1;
          min-width: 120px;
          padding: 14px 20px;
          background: #059669;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-accept:hover:not(:disabled) {
          background: #047857;
          transform: translateY(-1px);
        }
        .btn-decline {
          flex: 1;
          min-width: 120px;
          padding: 14px 20px;
          background: #dc2626;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-decline:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }
        .btn-print-referral {
          flex: 1;
          min-width: 120px;
          padding: 14px 20px;
          background: #fff;
          color: #0f172a;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-print-referral:hover {
          border-color: #0ea5e9;
          color: #0ea5e9;
        }
        .btn-accept:disabled, .btn-decline:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Decline Form Overlay */
        .decline-form-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }
        .decline-form-content {
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
        }
        .decline-form-content h4 {
          margin: 0 0 16px;
          color: #0f172a;
        }
        .decline-form-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .btn-cancel-decline {
          flex: 1;
          padding: 12px;
          background: #f1f5f9;
          color: #475569;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-confirm-decline {
          flex: 1;
          padding: 12px;
          background: #dc2626;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-confirm-decline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .referral-info-grid {
            grid-template-columns: 1fr;
          }
          .clinical-note-grid {
            grid-template-columns: 1fr;
          }
          .referral-actions {
            flex-direction: column;
          }
          .referral-tracking-id {
            font-size: 20px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default StudentProfile;
