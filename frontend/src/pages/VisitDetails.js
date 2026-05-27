import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudent } from '../services/api';
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

const VisitDetails = () => {
  const { visitId } = useParams();
  const [searchParams] = useSearchParams();
  const universityId = searchParams.get('student');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisitDetails = async () => {
      try {
        const response = await getStudent(universityId);
        setStudent(response.data);
        
        // Find the visit from the student's visits
        if (response.data.visits && response.data.visits.length > 0) {
          const foundVisit = response.data.visits.find(v => v.id === parseInt(visitId) || v.visit_id === visitId);
          if (foundVisit) {
            setVisit(foundVisit);
          }
        }
      } catch (error) {
        console.error('Error loading visit details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVisitDetails();
  }, [visitId, universityId]);

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <p>Loading visit details...</p>
        </div>
      </Layout>
    );
  }

  if (!visit || !student) {
    return (
      <Layout>
        <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
          <p>Visit not found.</p>
          <button 
            onClick={() => navigate(-1)}
            style={{ marginTop: '16px', padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const visitDate = formatEAT(visit.visit_date);
  const isClinician = user?.role === 'clinician' || user?.role === 'admin';

  const handlePrint = () => {
    window.print();
  };

  const sectionStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0',
    printBreakInside: 'avoid'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  };

  const valueStyle = {
    fontSize: '14px',
    color: '#0f172a',
    lineHeight: '1.6'
  };

  return (
    <Layout>
      <div className="visit-details-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        
        {/* Header Actions - Hidden when printing */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link 
              to={`/students/${universityId}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0ea5e9', textDecoration: 'none', fontSize: '14px' }}
            >
              ← Back to Student Profile
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handlePrint}
              style={{ padding: '10px 20px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🖨️ Print Clinical Note
            </button>
            {isClinician && (
              <Link
                to={`/visits/edit/${visitId}?student=${universityId}`}
                style={{ padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ✏️ Edit Visit
              </Link>
            )}
          </div>
        </div>

        {/* Print Header - Only visible when printing */}
        <div className="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>University of Gondar Health Center</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Clinical Visit Report</p>
        </div>

        {/* Patient Info Card */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1053ae', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 Patient Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={labelStyle}>Patient Name</div>
              <div style={valueStyle}>{fullName}</div>
            </div>
            <div>
              <div style={labelStyle}>University ID</div>
              <div style={valueStyle}>{student.university_id}</div>
            </div>
            <div>
              <div style={labelStyle}>Department</div>
              <div style={valueStyle}>{student.department || 'N/A'}</div>
            </div>
            <div>
              <div style={labelStyle}>Year of Study</div>
              <div style={valueStyle}>{student.year_of_study ? `Year ${student.year_of_study}` : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Visit Info Card */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1053ae', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏥 Visit Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={labelStyle}>Visit Date & Time</div>
              <div style={valueStyle}>{visitDate.full}</div>
            </div>
            <div>
              <div style={labelStyle}>Clinician</div>
              <div style={valueStyle}>{visit.clinician_username || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Clinical Assessment */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1053ae', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🩺 Clinical Assessment
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>Symptoms</div>
            <div style={valueStyle}>{visit.symptoms || 'None reported'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={labelStyle}>Diagnosis</div>
              <div style={valueStyle}>{visit.diagnosis || 'Pending'}</div>
            </div>
            <div>
              <div style={labelStyle}>Treatment</div>
              <div style={valueStyle}>{visit.treatment || 'Observation'}</div>
            </div>
          </div>

          {visit.advice && (
            <div style={{ marginBottom: '16px' }}>
              <div style={labelStyle}>Advice</div>
              <div style={valueStyle}>{visit.advice}</div>
            </div>
          )}

          {visit.note && (
            <div>
              <div style={labelStyle}>General Notes</div>
              <div style={valueStyle}>{visit.note}</div>
            </div>
          )}
        </div>

        {/* Lab Requests */}
        {visit.lab_requests && visit.lab_requests.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1053ae', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧪 Lab Requests
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visit.lab_requests.map((lab, index) => (
                <div key={index} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={labelStyle}>Test Name</div>
                      <div style={valueStyle}>{lab.test_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Status</div>
                      <div style={valueStyle}>
                        <span className={`status-badge ${lab.status?.toLowerCase() || 'pending'}`} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: lab.status === 'Completed' ? '#ecfdf5' : '#fef3c7', color: lab.status === 'Completed' ? '#047857' : '#d97706' }}>
                          {lab.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    {lab.result && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={labelStyle}>Result</div>
                        <div style={valueStyle}>{lab.result}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescriptions */}
        {visit.prescriptions && visit.prescriptions.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1053ae', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💊 Prescriptions
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Medication</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Dosage</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Frequency</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {visit.prescriptions.map((rx, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#0f172a' }}>{rx.medication_name || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#0f172a' }}>{rx.dosage || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#0f172a' }}>{rx.frequency || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#0f172a' }}>{rx.duration || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer - Only visible when printing */}
        <div className="print-footer" style={{ display: 'none', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          <p>This is an official medical record of the University of Gondar Health Center.</p>
          <p>Generated on {new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })} EAT</p>
        </div>

      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .visit-details-container, .visit-details-container * {
            visibility: visible;
          }
          .visit-details-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          .print-footer {
            display: block !important;
          }
          button, a {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default VisitDetails;