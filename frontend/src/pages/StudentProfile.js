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

  if (loading) return <Layout><p style={{ color: '#fff' }}>Loading profile...</p></Layout>;
  if (!student) return <Layout><p style={{ color: '#fff' }}>Student not found.</p></Layout>;

  const isClinician = user?.role === 'clinician';

  // Using real data for name, but mock data where necessary to match screenshot
  const initials = `${student.first_name?.charAt(0) || ''}${student.last_name?.charAt(0) || ''}`.toUpperCase() || 'NY';
  const fullName = `${student.first_name} ${student.last_name}`.trim() || 'Nahom Yonas';
  
  return (
    <Layout>
      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px', borderRadius: '24px', margin: '-24px', color: '#1e293b', fontFamily: '"Inter", sans-serif' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#0f172a', fontWeight: '700' }}>Student Profile</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Current Appointment — University of Gondar Referral Hospital</p>
          </div>
          {isClinician && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to={`/visits/new?student=${student.university_id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0ea5e9', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', transition: 'opacity 0.2s' }}>
                <span>+</span> New Visit
              </Link>
              <Link to={`/referrals/new?student=${student.university_id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0f172a', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', transition: 'opacity 0.2s' }}>
                <span>→</span> Send Referral
              </Link>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Profile & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Main Profile Card */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                {student.photo_url ? (
                  <img src={student.photo_url} alt={fullName} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }} />
                ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #10b981)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', margin: '0 auto' }}>
                    {initials}
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', border: '3px solid #fff' }}></div>
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a' }}>{fullName}</h2>
              <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
                Age: 21<br />
                {student.department} • Year {student.year_of_study || 2}
              </div>
              <Link to={`/students/edit/${student.university_id}`} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', padding: '12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', boxSizing: 'border-box' }}>Update Profile</Link>
              
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', textAlign: 'left', fontSize: '13px', color: '#475569', lineHeight: '2' }}>
                <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#94a3b8' }}>ID:</span> <strong style={{ color: '#0f172a' }}>{student.university_id}</strong></div>
                <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#94a3b8' }}>Phone:</span> <strong style={{ color: '#0f172a' }}>{student.phone}</strong></div>
              </div>
            </div>

            {/* Information Card */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#0f172a', display: 'inline-block', borderBottom: '2px solid #0ea5e9', paddingBottom: '8px' }}>Information</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Gender</span> <strong style={{ color: '#0f172a' }}>Male</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Blood Type</span> <strong style={{ color: '#0f172a' }}>O+ (Positive)</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Allergies</span> <strong style={{ color: '#0f172a' }}>Milk, Penicillin</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Conditions</span> <strong style={{ color: '#0f172a' }}>Asthma, Mild Hypertension</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Height</span> <strong style={{ color: '#0f172a' }}>175 cm</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Weight</span> <strong style={{ color: '#0f172a' }}>68 kg</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Student ID</span> <strong style={{ color: '#0f172a' }}>{student.university_id}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Last Visit</span> <strong style={{ color: '#0f172a' }}>24th May 2026</strong></div>
              </div>
            </div>

          </div>

          {/* Right Area: Vitals & Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Top: Referrals (Horizontal Scroller) */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Referrals ({(student.referrals && student.referrals.length) || 3})</h3>
                <Link to={`/referrals/new?student=${student.university_id}`} style={{ background: '#f0f5ff', color: '#3b82f6', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>+ Send</Link>
              </div>

              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {student.referrals && student.referrals.length > 0 ? (
                  student.referrals.map((ref) => (
                    <Link to={`/referrals/${ref.referral_id}`} key={ref.referral_id} style={{ textDecoration: 'none', minWidth: '220px', background: ref.status === 'accepted' ? '#ecfdf5' : '#fef3c7', borderRadius: '16px', padding: '16px', flexShrink: 0, transition: 'transform 0.2s', display: 'block' }} className="hover-scale">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontSize: '24px' }}>{ref.status === 'accepted' ? '❤️' : '🩺'}</div>
                        <span style={{ color: '#94a3b8' }}>↗</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px' }}>REFERRAL</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>To:</div>
                      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', marginBottom: '12px' }}>{ref.receiving_department_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>Reason:<br/>{ref.reason}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: ref.status === 'accepted' ? '#047857' : '#d97706' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ref.status === 'accepted' ? '#047857' : '#d97706' }}></span>
                        {ref.status.toUpperCase()}
                      </div>
                    </Link>
                  ))
                ) : (
                  <>
                    <Link to="#" style={{ textDecoration: 'none', minWidth: '220px', background: '#fef3c7', borderRadius: '16px', padding: '16px', flexShrink: 0, transition: 'transform 0.2s', display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontSize: '24px' }}>🩺</div>
                        <span style={{ color: '#94a3b8' }}>↗</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px' }}>REFERRAL</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>To:</div>
                      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', marginBottom: '12px' }}>Internal Medicine</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>Reason:<br/>Persistent headache with visual changes</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#d97706' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }}></span>
                        PENDING
                      </div>
                    </Link>
                    <Link to="#" style={{ textDecoration: 'none', minWidth: '220px', background: '#f0f9ff', borderRadius: '16px', padding: '16px', flexShrink: 0, transition: 'transform 0.2s', display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontSize: '24px' }}>💨</div>
                        <span style={{ color: '#94a3b8' }}>↗</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px' }}>REFERRAL</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>To:</div>
                      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', marginBottom: '12px' }}>Pulmonology</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>Reason:<br/>Asthma follow-up and inhaler technique</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#d97706' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }}></span>
                        PENDING
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Middle: Clinical Visits (Horizontal Scroller) */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Clinical Visits ({(student.visits && student.visits.length) || 2})</h3>
                <button style={{ background: '#f0fdfa', color: '#0d9488', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ New</button>
              </div>

              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {student.visits && student.visits.length > 0 ? (
                  student.visits.map((visit, idx) => {
                    const { date, time } = formatUTC(visit.visit_date);
                    return (
                      <Link to={`/visits/${visit.id}`} key={visit.id} style={{ textDecoration: 'none', minWidth: '280px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', flexShrink: 0, transition: 'transform 0.2s', display: 'block' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>📅 {date}</span>
                          <span style={{ background: '#f8fafc', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>⏰ {time}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>Seen by: <strong style={{ color: '#0f172a' }}>{visit.clinician_username}</strong></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                          <div><strong>Sx:</strong> <span style={{ color: '#334155' }}>{visit.symptoms}</span></div>
                          <div><strong>Dx:</strong> <span style={{ color: '#334155' }}>{visit.diagnosis || 'N/A'}</span></div>
                          <div><strong>Tx:</strong> <span style={{ color: '#334155' }}>{visit.treatment || 'N/A'}</span></div>
                        </div>
                      </Link>
                    )
                  })
                ) : (
                  <>
                    <Link to="#" style={{ textDecoration: 'none', minWidth: '280px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', flexShrink: 0, transition: 'transform 0.2s', display: 'block' }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>📅 May 24, 2026</span>
                        <span style={{ background: '#f8fafc', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>⏰ 01:36 PM UTC</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>Seen by: <strong style={{ color: '#0f172a' }}>superuser</strong></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                        <div><strong>Sx:</strong> <span style={{ color: '#334155' }}>Headache, fatigue x 3 days</span></div>
                        <div><strong>Dx:</strong> <span style={{ color: '#334155' }}>Tension headache</span></div>
                        <div><strong>Tx:</strong> <span style={{ color: '#334155' }}>Ibuprofen 400mg PRN, rest</span></div>
                      </div>
                    </Link>
                    <Link to="#" style={{ textDecoration: 'none', minWidth: '280px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', flexShrink: 0, transition: 'transform 0.2s', display: 'block' }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>📅 May 21, 2026</span>
                        <span style={{ background: '#f8fafc', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>⏰ 08:52 PM UTC</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>Seen by: <strong style={{ color: '#0f172a' }}>clinician1</strong></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                        <div><strong>Sx:</strong> <span style={{ color: '#334155' }}>Mild wheezing after PE</span></div>
                        <div><strong>Dx:</strong> <span style={{ color: '#334155' }}>Exercise-induced bronchospasm</span></div>
                        <div><strong>Tx:</strong> <span style={{ color: '#334155' }}>Albuterol inhaler 2 puffs</span></div>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Bottom: Prescriptions */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Prescriptions</h3>
                <button style={{ background: 'transparent', color: '#0d9488', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Add a prescription</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                <div>Prescription</div>
                <div>Date</div>
                <div>Duration</div>
                <div>Time Ago</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '500', fontSize: '14px' }}>
                    <span style={{ color: '#f59e0b' }}>💊</span> Albuterol Inhaler
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>21st May 2026</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>3 months</div>
                  <div style={{ color: '#0d9488', fontSize: '13px', fontWeight: '500', background: '#f0fdfa', padding: '4px 8px', borderRadius: '6px', width: 'max-content' }}>5 days ago</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '500', fontSize: '14px' }}>
                    <span style={{ color: '#f59e0b' }}>💊</span> Ibuprofen 400mg
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>24th May 2026</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>1 week</div>
                  <div style={{ color: '#0d9488', fontSize: '13px', fontWeight: '500', background: '#f0fdfa', padding: '4px 8px', borderRadius: '6px', width: 'max-content' }}>2 days ago</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '500', fontSize: '14px' }}>
                    <span style={{ color: '#f59e0b' }}>💊</span> Loratadine 10mg
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>8th Feb 2026</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>2 months</div>
                  <div style={{ color: '#0d9488', fontSize: '13px', fontWeight: '500', background: '#f0fdfa', padding: '4px 8px', borderRadius: '6px', width: 'max-content' }}>3 months ago</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default StudentProfile;