import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudent } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Helper function to format Date and Time in UTC
const formatUTC = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  const dateObj = new Date(isoString);
  
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric'
  }).format(dateObj);
  
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: true
  }).format(dateObj);

  return { date, time: `${time} UTC` };
};

const StudentProfile = () => {
  const { universityId } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [universityId]);

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

  if (loading) return <Layout><p>Loading profile...</p></Layout>;
  if (!student) return <Layout><p>Student not found.</p></Layout>;

  const isClinician = user?.role === 'clinician';

  return (
    <Layout>
      {/* Student Header Card */}
      <div style={{
        background: 'white', padding: '24px', borderRadius: '12px',
        marginBottom: '24px', color: '#333',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {student.photo ? (
            <img src={`http://127.0.0.1:8000${student.photo}`} alt="Student" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: '#1053ae', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold'
            }}>
              {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '24px' }}>{student.first_name} {student.last_name}</h1>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>ID: {student.university_id}</p>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>{student.department} | Year {student.year_of_study} | Phone: {student.phone}</p>
          </div>
        </div>

        {isClinician && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/visits/new?student=${student.university_id}`} style={{ padding: '10px 20px', background: '#1053ae', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>New Visit</Link>
            <Link to={`/referrals/new?student=${student.university_id}`} style={{ padding: '10px 20px', background: '#6b7280', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Send Referral</Link>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Visits History */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', color: '#333' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>Clinical Visits ({student.visits?.length || 0})</h2>
          {student.visits && student.visits.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {student.visits.map((visit) => {
                const { date, time } = formatUTC(visit.visit_date);
                return (
                  <li key={visit.id} style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
                    
                    {/* Separate Date and Time Bars */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ background: '#e0e7ff', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        📅 {date}
                      </span>
                      <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        ⏰ {time}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      Seen by: <strong>{visit.clinician_username}</strong>
                    </div>

                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <strong>Sx:</strong> {visit.symptoms}<br />
                      <strong>Dx:</strong> {visit.diagnosis || 'N/A'}<br />
                      <strong>Tx:</strong> {visit.treatment || 'N/A'}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: '#999' }}>No visits recorded.</p>
          )}
        </div>

        {/* Referrals History */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', color: '#333' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>Referrals ({student.referrals?.length || 0})</h2>
          {student.referrals && student.referrals.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {student.referrals.map((ref) => {
                const sentUTC = formatUTC(ref.created_at);
                const respondedUTC = formatUTC(ref.responded_at);
                return (
                  <li key={ref.referral_id} style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      {/* Sent Date and Time Bars */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ background: '#e0e7ff', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                          📤 Sent: {sentUTC.date}
                        </span>
                        <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {sentUTC.time}
                        </span>
                      </div>

                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                        background: ref.status === 'accepted' ? '#d1fae5' : ref.status === 'declined' ? '#fee2e2' : '#fef3c7',
                        color: ref.status === 'accepted' ? '#065f46' : ref.status === 'declined' ? '#991b1b' : '#92400e'
                      }}>
                        {ref.status}
                      </span>
                    </div>

                    {ref.responded_at && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ background: ref.status === 'accepted' ? '#d1fae5' : '#fee2e2', color: ref.status === 'accepted' ? '#065f46' : '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                          📥 Responded: {respondedUTC.date}
                        </span>
                        <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {respondedUTC.time}
                        </span>
                      </div>
                    )}

                    <div style={{ fontSize: '14px', marginTop: '8px' }}>
                      <strong>To:</strong> {ref.receiving_department_name}<br />
                      <strong>Reason:</strong> {ref.reason}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: '#999' }}>No referrals sent.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentProfile;