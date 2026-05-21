import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudent, createVisit, createLabRequest, createPrescription } from '../services/api';

// UTC Formatter
const formatUTC = (isoString) => {
  if (!isoString) return { date: '', time: '' };
  const dateObj = new Date(isoString);
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: true }).format(dateObj);
  return { date, time: `${time} UTC` };
};

const NewVisit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student');

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Current UTC time for display
  const [currentUTC, setCurrentUTC] = useState(formatUTC(new Date().toISOString()));

  // Visit form data
  const [visitData, setVisitData] = useState({
    student: studentId || '',
    symptoms: '',
    diagnosis: '',
    advice: '',
    treatment: '',
    note: '',
  });

  // Lab requests array
  const [labRequests, setLabRequests] = useState([]);
  
    // Prescriptions array
  const [prescriptions, setPrescriptions] = useState([]);



  useEffect(() => {
    if (studentId) {
      getStudent(studentId).then(res => {
        setStudent(res.data);
        setLoading(false);
      }).catch(() => {
        setError('Failed to load student data');
        setLoading(false);
      });
    } else {
      setError('No student selected');
      setLoading(false);
    }
  }, [studentId]);

  const handleVisitChange = (e) => {
    setVisitData({ ...visitData, [e.target.name]: e.target.value });
  };

  // Lab request handlers
  const addLabRequest = () => {
    setLabRequests([...labRequests, { test_name: '', reason: '' }]);
  };

  const updateLabRequest = (index, field, value) => {
    const updated = [...labRequests];
    updated[index][field] = value;
    setLabRequests(updated);
  };

  const removeLabRequest = (index) => {
    if (labRequests.length > 1) {
      setLabRequests(labRequests.filter((_, i) => i !== index));
    }
  };

  // Prescription handlers
  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medication_name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updatePrescription = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  const removePrescription = (index) => {
    if (prescriptions.length > 1) {
      setPrescriptions(prescriptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 1. Create the visit first
      const visitRes = await createVisit(visitData);
      const visitId = visitRes.data.id;

      // 2. Create lab requests if filled
      const labPromises = labRequests
        .filter(lab => lab.test_name.trim())
        .map(lab => createLabRequest({
          clinical_visit: visitId,
          test_name: lab.test_name,
          reason: lab.reason
        }));
      
      await Promise.all(labPromises);

      // 3. Create prescriptions if filled
      const rxPromises = prescriptions
        .filter(rx => rx.medication_name.trim())
        .map(rx => createPrescription({
          clinical_visit: visitId,
          medication_name: rx.medication_name,
          dosage: rx.dosage,
          frequency: rx.frequency,
          duration: rx.duration
        }));
      
      await Promise.all(rxPromises);

      // Redirect to student profile
      navigate(`/students/${studentId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save visit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><p>Loading...</p></Layout>;

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' };
  const textareaStyle = { ...inputStyle, minHeight: '80px', resize: 'vertical' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' };

  return (
    <Layout>
      <h1>New Clinical Visit</h1>
      
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* Student Info - No dropdown, separate Name and ID */}
        {student && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', color: '#333' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: '#1053ae' }}>Patient Information</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{student.first_name} {student.last_name}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>ID: {student.university_id}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{student.department} | Year {student.year_of_study}</div>
              </div>
              
              {/* Date and Time Bars - UTC */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span style={{ background: '#e0e7ff', color: '#1e40af', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                  📅 {currentUTC.date}
                </span>
                <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  ⏰ {currentUTC.time}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Notes */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px', color: '#333' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1053ae' }}>Clinical Assessment</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Symptoms *</label>
            <textarea name="symptoms" value={visitData.symptoms} onChange={handleVisitChange} required style={textareaStyle} placeholder="Patient complaints..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Diagnosis</label>
              <input name="diagnosis" value={visitData.diagnosis} onChange={handleVisitChange} style={inputStyle} placeholder="Clinical diagnosis" />
            </div>
            <div>
              <label style={labelStyle}>Treatment</label>
              <input name="treatment" value={visitData.treatment} onChange={handleVisitChange} style={inputStyle} placeholder="Treatment plan" />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Advice</label>
            <textarea name="advice" value={visitData.advice} onChange={handleVisitChange} style={textareaStyle} placeholder="Patient advice..." />
          </div>

          <div>
            <label style={labelStyle}>General Notes</label>
            <textarea name="note" value={visitData.note} onChange={handleVisitChange} style={textareaStyle} placeholder="Additional notes..." />
          </div>
        </div>

        {/* Lab Requests Section */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px', color: '#333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1053ae' }}>🧪 Lab Requests</h3>
            <button type="button" onClick={addLabRequest} style={{ padding: '6px 12px', background: '#e0e7ff', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              + Add Test
            </button>
          </div>

          {labRequests.map((lab, index) => (
            <div key={index} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>Test #{index + 1}</span>
                {labRequests.length > 1 && (
                  <button type="button" onClick={() => removeLabRequest(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Test Name *</label>
                  <input value={lab.test_name} onChange={(e) => updateLabRequest(index, 'test_name', e.target.value)} style={inputStyle} placeholder="e.g. CBC, X-Ray" required={index === 0} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Reason/Indication</label>
                  <input value={lab.reason} onChange={(e) => updateLabRequest(index, 'reason', e.target.value)} style={inputStyle} placeholder="Why is this test needed?" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prescriptions Section */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px', color: '#333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1053ae' }}>💊 Medication Requests</h3>
            <button type="button" onClick={addPrescription} style={{ padding: '6px 12px', background: '#e0e7ff', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              + Add Medication
            </button>
          </div>

          {prescriptions.map((rx, index) => (
            <div key={index} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>Medication #{index + 1}</span>
                {prescriptions.length > 1 && (
                  <button type="button" onClick={() => removePrescription(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Medication *</label>
                  <input value={rx.medication_name} onChange={(e) => updatePrescription(index, 'medication_name', e.target.value)} style={inputStyle} placeholder="Drug name" required={index === 0} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Dosage</label>
                  <input value={rx.dosage} onChange={(e) => updatePrescription(index, 'dosage', e.target.value)} style={inputStyle} placeholder="e.g. 500mg" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Frequency</label>
                  <input value={rx.frequency} onChange={(e) => updatePrescription(index, 'frequency', e.target.value)} style={inputStyle} placeholder="e.g. BID" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Duration</label>
                  <input value={rx.duration} onChange={(e) => updatePrescription(index, 'duration', e.target.value)} style={inputStyle} placeholder="e.g. 7 days" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={{ padding: '12px 24px', background: '#1053ae', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            {submitting ? 'Saving Visit...' : 'Save Visit & Send Requests'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default NewVisit;