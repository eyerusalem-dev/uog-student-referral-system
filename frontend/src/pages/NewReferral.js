import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudent, getDepartments, createReferral, getVisits } from '../services/api';

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
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    student: studentId || '',
    clinical_visit: '',
    receiving_department: '',
    reason: '',
    referral_note: '',
    referral_date: new Date().toISOString().split('T')[0],
    selected_visits: [],
  });

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes] = await Promise.all([
          getDepartments(),
        ]);
        setDepartments(deptsRes.data);

        if (studentId) {
          const [studentRes, visitsRes] = await Promise.all([
            getStudent(studentId),
            getVisits({ student: studentId }),
          ]);
          setStudent(studentRes.data);
          setVisits(visitsRes.data);

          // Auto-select latest visit
          if (visitsRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              selected_visits: [visitsRes.data[0].id],
              clinical_visit: visitsRes.data[0].id,
            }));
          }
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

  // Get selected visit details for preview
  const selectedVisitDetails = useMemo(() => {
    return visits.filter((v) => formData.selected_visits.includes(v.id));
  }, [visits, formData.selected_visits]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVisitToggle = (visitId) => {
    setFormData((prev) => {
      const current = prev.selected_visits;
      const isSelected = current.includes(visitId);
      const updated = isSelected
        ? current.filter((id) => id !== visitId)
        : [...current, visitId];

      return {
        ...prev,
        selected_visits: updated,
        clinical_visit: updated.length > 0 ? updated[0] : '',
      };
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      selected_visits: visits.map((v) => v.id),
      clinical_visit: visits.length > 0 ? visits[0].id : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createReferral(formData);
      navigate(`/students/${studentId}`);
    } catch (err) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Failed to create referral.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontFamily: 'inherit', fontSize: '14px',
    boxSizing: 'border-box',
  };

  const textareaStyle = { ...inputStyle, minHeight: '80px', resize: 'vertical' };
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' };

  if (loading) return <Layout><p>Loading referral form...</p></Layout>;

  return (
    <Layout>
      <h1>Send Referral</h1>
      <p style={{ color: '#999', marginBottom: '24px' }}>
        Refer {student ? `${student.first_name} ${student.last_name}` : 'student'} to a hospital department.
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* LEFT: Referral Form */}
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '12px', color: '#333' }}>

          {/* Student Name + ID on separate lines */}
          {student && (
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{student.first_name} {student.last_name}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>ID: {student.university_id}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{student.department} | Year {student.year_of_study}</div>
            </div>
          )}

      

          {/* Receiving Department */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Receiving Department *</label>
            <select name="receiving_department" value={formData.receiving_department} onChange={handleChange} required style={inputStyle}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.building_location ? `(${d.building_location})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Reason for Referral *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              placeholder="Why is this student being referred?"
              style={textareaStyle}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea
              name="referral_note"
              value={formData.referral_note}
              onChange={handleChange}
              placeholder="Any specific instructions for the receiving doctor..."
              style={textareaStyle}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!formData.reason.trim() || !formData.receiving_department}
              style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Preview Notes
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.reason.trim() || !formData.receiving_department}
              style={{ padding: '10px 20px', background: '#1053ae', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              {submitting ? 'Sending...' : 'Send Referral'}
            </button>
          </div>
        </form>

        {/* RIGHT: Visit Attachments + Preview */}
        <div>

          {/* Visit Attachments */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', color: '#333', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Attach Clinical Visits</h3>
              {visits.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  Select All
                </button>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              Select visits to transfer clinical notes. Select the most recent visit for primary context.
            </p>

            {visits.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {visits.map((visit, index) => (
                  <label
                    key={visit.id}
                    style={{
                      display: 'block', padding: '12px', borderRadius: '8px',
                      border: formData.selected_visits.includes(visit.id) ? '2px solid #1053ae' : '1px solid #e5e7eb',
                      marginBottom: '8px', cursor: 'pointer',
                      background: formData.selected_visits.includes(visit.id) ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={formData.selected_visits.includes(visit.id)}
                        onChange={() => handleVisitToggle(visit.id)}
                        style={{ width: '18px', height: '18px', accentColor: '#1053ae' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', color: '#1053ae', fontWeight: '600' }}>
                          {index === 0 && <span style={{ background: '#1053ae', color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', marginRight: '6px' }}>LATEST</span>}
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>
                          <strong>Sx:</strong> {visit.symptoms.substring(0, 60)}{visit.symptoms.length > 60 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontSize: '14px' }}>No visits found for this student. You can still send a referral without attaching a visit.</p>
            )}
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', color: '#333', border: '2px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f59e0b' }}>Transfer Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999' }}
                >
                  ×
                </button>
              </div>

              {selectedVisitDetails.length > 0 ? (
                selectedVisitDetails.map((visit) => (
                  <div key={visit.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                    <div style={{ color: '#1053ae', fontWeight: '600', marginBottom: '8px' }}>
                      Visit: {new Date(visit.visit_date).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><strong>Symptoms:</strong> {visit.symptoms}</div>
                      <div><strong>Diagnosis:</strong> {visit.diagnosis || 'N/A'}</div>
                      <div><strong>Treatment:</strong> {visit.treatment || 'N/A'}</div>
                      <div><strong>Advice:</strong> {visit.advice || 'N/A'}</div>
                      {visit.lab_used && <div><strong>Lab:</strong> {visit.lab_note}</div>}
                      {visit.pharmacy_used && <div><strong>Medication:</strong> {visit.medication_given}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontSize: '14px' }}>No clinical notes will be transferred. You can still send the referral.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NewReferral;