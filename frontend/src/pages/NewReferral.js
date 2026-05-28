import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudent, getDepartments, createReferral, getVisits } from '../services/api';
import Select from 'react-select';

const NewReferral = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student');

  const [student, setStudent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // New States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successTrackingId, setSuccessTrackingId] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const [formData, setFormData] = useState({
    student: studentId || '',
    clinical_visit: '',
    receiving_department: '',
    urgency: 'Routine', // Default
    reason: '',
    referral_note: '',
    referral_date: new Date().toISOString().split('T')[0],
    selected_visits: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes] = await Promise.all([getDepartments()]);
        // Map departments for react-select
        const deptOptions = deptsRes.data.map(d => ({
          value: d.id,
          label: `${d.name} ${d.building_location ? `(${d.building_location})` : ''}`
        }));
        setDepartments(deptOptions);

        if (studentId) {
          const [studentRes, visitsRes] = await Promise.all([
            getStudent(studentId),
            getVisits({ student: studentId }),
          ]);
          setStudent(studentRes.data);
          setVisits(visitsRes.data);

          // Note: Mocking active referrals logic for Duplicate Warning
          // If we had active referrals, we'd check if any match the selected department.
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const selectedVisitDetails = useMemo(() => {
    return visits.filter((v) => formData.selected_visits.includes(v.id));
  }, [visits, formData.selected_visits]);

  // Handle department select logic
  const handleDeptChange = (selectedOption) => {
    setFormData(prev => ({ ...prev, receiving_department: selectedOption ? selectedOption.value : '' }));
    // Mock duplicate check
    if (selectedOption && student?.referrals) {
       const isDuplicate = student.referrals.some(r => r.receiving_department === selectedOption.value && r.status === 'pending');
       setShowDuplicateWarning(isDuplicate);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVisitToggle = (visitId) => {
    setFormData((prev) => {
      const current = prev.selected_visits;
      const isSelected = current.includes(visitId);
      const updated = isSelected ? current.filter((id) => id !== visitId) : [...current, visitId];
      
      let newReason = prev.reason;
      // Smart Auto-Fill: if adding a visit, populate reason with diagnosis
      if (!isSelected) {
        const visit = visits.find(v => v.id === visitId);
        if (visit && visit.diagnosis && !prev.reason.includes(visit.diagnosis)) {
          newReason = prev.reason ? `${prev.reason}\n${visit.diagnosis}` : visit.diagnosis;
        }
      }

      return {
        ...prev,
        selected_visits: updated,
        clinical_visit: updated.length > 0 ? updated[0] : '',
        reason: newReason,
      };
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => {
      const allIds = visits.map(v => v.id);
      return {
        ...prev,
        selected_visits: allIds,
        clinical_visit: visits.length > 0 ? visits[0].id : '',
      }
    });
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError('');
    
    // Simulate generation of Tracking ID since backend might not return it exactly as requested in UI
    const trackingId = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await createReferral(formData);
      setSuccessTrackingId(trackingId);
      setShowConfirmModal(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Permission denied. You must be logged in as an Admin or Clinician to create referrals. Please log in again.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Failed to create referral.');
      }
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading referral form...</div></Layout>;

  // Success Screen
  if (successTrackingId) {
    return (
      <Layout>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', background: '#fff', padding: '48px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '64px', height: '64px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 24px' }}>✓</div>
          <h1 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '24px' }}>Referral Sent Successfully</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>The referral has been securely transmitted to the receiving department.</p>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Tracking ID</div>
             <div style={{ fontSize: '28px', color: '#0f172a', fontWeight: 'bold', letterSpacing: '2px' }}>{successTrackingId}</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => navigate(`/students/${studentId}`)} style={{ padding: '12px 24px', background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back to Profile</button>
            <button onClick={() => window.print()} style={{ padding: '12px 24px', background: '#0ea5e9', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Print Referral</button>
          </div>
        </div>
      </Layout>
    );
  }

  const labelStyle = { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' };
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' };
  const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical' };

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Patient Context Header */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>New Referral</div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Referring: {student ? `${student.first_name} ${student.last_name}` : 'Student'} (ID: {student?.university_id || studentId})</h1>
          </div>
          {student && <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>{student.department} • Year {student.year_of_study || 3}</div>}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

          {/* LEFT: Referral Form */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Receiving Department <span style={{ color: '#ef4444' }}>*</span></label>
              <Select
                options={departments}
                onChange={handleDeptChange}
                placeholder="Search department (e.g. Cardio)..."
                styles={{
                  control: (base) => ({ ...base, padding: '4px', borderRadius: '8px', borderColor: '#cbd5e1' }),
                  menu: (base) => ({ ...base, color: '#0f172a' }),
                  option: (base, state) => ({ ...base, color: '#0f172a', backgroundColor: state.isSelected ? '#0ea5e9' : state.isFocused ? '#f0f9ff' : '#fff' }),
                  singleValue: (base) => ({ ...base, color: '#0f172a' }),
                  input: (base) => ({ ...base, color: '#0f172a' }),
                  placeholder: (base) => ({ ...base, color: '#94a3b8' }),
                }}
              />
              {showDuplicateWarning && (
                <div style={{ marginTop: '8px', color: '#d97706', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', padding: '8px 12px', borderRadius: '6px' }}>
                  <span>⚠️</span> Warning: A referral to this department is already active. Do you want to send another?
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Urgency Level <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['Routine', 'Urgent', 'Critical'].map(level => {
                  const colors = {
                    Routine: { bg: '#fef9c3', border: '#fde047', color: '#a16207' },
                    Urgent: { bg: '#ffedd5', border: '#fdba74', color: '#c2410c' },
                    Critical: { bg: '#fee2e2', border: '#fca5a5', color: '#b91c1c' }
                  };
                  const isSelected = formData.urgency === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgency: level })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
                        background: isSelected ? colors[level].bg : '#f8fafc',
                        border: `2px solid ${isSelected ? colors[level].border : '#e2e8f0'}`,
                        color: isSelected ? colors[level].color : '#64748b',
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Chief Complaint / Reason <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Why is this student being referred? (Auto-fills if you attach a visit)"
                style={textareaStyle}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>Special Instructions</label>
              <textarea
                name="referral_note"
                value={formData.referral_note}
                onChange={handleChange}
                placeholder="Any specific handover details or requested procedures..."
                style={textareaStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{ flex: 1, padding: '14px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={!formData.reason.trim() || !formData.receiving_department}
                style={{ flex: 2, padding: '14px', background: (!formData.reason.trim() || !formData.receiving_department) ? '#94a3b8' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', cursor: (!formData.reason.trim() || !formData.receiving_department) ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', transition: 'background 0.2s' }}
              >
                Send Referral
              </button>
            </div>

          </div>

          {/* RIGHT: Visit Attachments + Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Visit Selection */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Attach Clinical Visits</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Select visits to transfer notes to the receiving team.</p>
                </div>
                {visits.length > 0 && (
                  <button onClick={handleSelectAll} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Select All</button>
                )}
              </div>

              {visits.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                  {visits.map((visit) => {
                    const isSelected = formData.selected_visits.includes(visit.id);
                    return (
                      <label key={visit.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', border: `2px solid ${isSelected ? '#0ea5e9' : '#e2e8f0'}`, background: isSelected ? '#f0f9ff' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => handleVisitToggle(visit.id)} style={{ width: '18px', height: '18px', accentColor: '#0ea5e9', marginTop: '2px' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{new Date(visit.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {visit.diagnosis || 'No Diagnosis'}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>{visit.symptoms.substring(0, 80)}{visit.symptoms.length > 80 ? '...' : ''}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '14px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏥</div>
                  No prior visits found.<br/>You can still send a referral.
                </div>
              )}
            </div>

            {/* Ghost Layout Preview */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>What they will see</h3>
              {selectedVisitDetails.length > 0 ? (
                selectedVisitDetails.map(visit => (
                  <div key={visit.id} style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(203, 213, 225, 0.5)' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{new Date(visit.visit_date).toLocaleDateString()}</span>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{visit.clinician_username}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#64748b', minWidth: '40px' }}>Sx:</strong> <span style={{ color: '#334155' }}>{visit.symptoms}</span></div>
                      {visit.diagnosis && <div style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#64748b', minWidth: '40px' }}>Dx:</strong> <span style={{ color: '#334155' }}>{visit.diagnosis}</span></div>}
                      {visit.treatment && <div style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#64748b', minWidth: '40px' }}>Tx:</strong> <span style={{ color: '#334155' }}>{visit.treatment}</span></div>}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ opacity: 0.5 }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '100px', height: '20px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }}></div>
                    <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ width: '80%', height: '12px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Review & Confirm Modal */}
        {showConfirmModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Review & Confirm</h2>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Please verify the referral details before sending.</p>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Patient</div>
                  <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{student?.first_name} {student?.last_name}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Department</div>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{departments.find(d => d.value === formData.receiving_department)?.label || 'Selected'}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Urgency</div>
                    <div style={{ fontSize: '14px', color: formData.urgency === 'Critical' ? '#ef4444' : formData.urgency === 'Urgent' ? '#f59e0b' : '#10b981', fontWeight: '600' }}>{formData.urgency}</div>
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Chief Complaint</div>
                  <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>{formData.reason}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Attachments</div>
                  <div style={{ fontSize: '14px', color: '#334155' }}>{formData.selected_visits.length} clinical visit notes attached.</div>
                </div>
              </div>
              <div style={{ padding: '24px', display: 'flex', gap: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  style={{ flex: 1, padding: '14px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  style={{ flex: 2, padding: '14px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Sending...
                    </>
                  ) : 'Confirm & Send'}
                </button>
              </div>
            </div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default NewReferral;