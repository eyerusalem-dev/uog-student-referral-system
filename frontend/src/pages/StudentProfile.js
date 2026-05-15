import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudent } from '../services/api';

const StudentProfile = () => {
  const { universityId } = useParams();
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

  return (
    <Layout>
      <div className="profile-header">
        <div className="profile-info">
          {student.photo && (
            <img 
              src={`http://127.0.0.1:8000${student.photo}`} 
              alt="Student" 
              className="profile-photo" 
            />
          )}
          <div>
            <h1>{student.first_name} {student.last_name}</h1>
            <p className="muted">ID: {student.university_id} | {student.department} | Year {student.year_of_study}</p>
            <p>Phone: {student.phone} | Emergency: {student.emergency_contact || 'N/A'}</p>
          </div>
        </div>
        <div className="profile-actions">
           <Link to={`/visits/new?student=${student.university_id}`} className="btn-primary">New Visit</Link>
           <Link to={`/referrals/new?student=${student.university_id}`} className="btn-secondary">New Referral</Link>
        </div>
      </div>

      <div className="history-sections">
        {/* Visits History */}
        <div className="history-card">
          <h2>Clinical Visits ({student.visits?.length || 0})</h2>
          {student.visits && student.visits.length > 0 ? (
            <ul className="history-list">
              {student.visits.map((visit) => (
                <li key={visit.id} className="history-item">
                  <div className="history-date">{new Date(visit.visit_date).toLocaleDateString()}</div>
                  <div className="history-content">
                    <strong>Sx:</strong> {visit.symptoms} <br/>
                    <strong>Dx:</strong> {visit.diagnosis} <br/>
                    <small>Treatment: {visit.treatment}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No visits recorded.</p>
          )}
        </div>

        {/* Referrals History */}
        <div className="history-card">
          <h2>Referrals ({student.referrals?.length || 0})</h2>
          {student.referrals && student.referrals.length > 0 ? (
            <ul className="history-list">
              {student.referrals.map((ref) => (
                <li key={ref.referral_id} className="history-item">
                  <div className="history-date">{new Date(ref.created_at).toLocaleDateString()}</div>
                  <div className="history-content">
                    <strong>To:</strong> {ref.receiving_department_name} <br/>
                    <strong>Status:</strong> <span className={`badge ${ref.status}`}>{ref.status}</span> <br/>
                    <small>Note: {ref.referral_note}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No referrals sent.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentProfile;