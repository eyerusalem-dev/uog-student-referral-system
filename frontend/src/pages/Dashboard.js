import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getDashboardStats, getReferrals } from '../services/api';
import { ReportIcon, UsersIcon } from '../components/Icons';

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarDate] = useState(new Date());
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedUTC = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(currentTime) + ' UTC';
  
  // Lab Technician State
  const [labFilter, setLabFilter] = useState('All');
  const [labSearch, setLabSearch] = useState('');

  const mockLabRequests = [
    { student_id: 1, name: 'Mekdes Alemu', id: 'UOG/20341/17', sub: 'Student Clinic', test: 'CBC + ESR', specimen: 'Whole Blood', priority: 'Urgent', priorityColor: '#f59e0b', status: 'Pending Collection', statusColor: '#f59e0b', date1: 'Today, 08:10', date2: 'AM' },
    { student_id: 2, name: 'Samuel Teka', id: 'UOG/18452/16', sub: 'OPD Room 3', test: 'Blood Glucose', specimen: 'Serum', priority: 'Routine', priorityColor: 'var(--text-muted)', status: 'Result updated', statusColor: '#10b981', date1: 'Today, 08:30', date2: 'AM' },
    { student_id: 3, name: 'Hanna Tadesse', id: 'UOG/12345/15', sub: 'Dorm Block B', test: 'Urinalysis', specimen: 'Urine', priority: 'Routine', priorityColor: 'var(--text-muted)', status: 'Pending', statusColor: '#f59e0b', date1: 'Yesterday, 14:00', date2: 'PM' },
  ];

  const filteredLabRequests = mockLabRequests.filter(req => {
    if (labFilter !== 'All') {
      if (labFilter === 'Urgent' && req.priority !== 'Urgent') return false;
      if (labFilter === 'Routine' && req.priority !== 'Routine') return false;
      if (labFilter === 'Pending' && !req.status.includes('Pending')) return false;
      if (labFilter === 'Result updated' && req.status !== 'Result updated') return false;
    }
    if (labSearch) {
      const q = labSearch.toLowerCase();
      return req.name.toLowerCase().includes(q) || req.test.toLowerCase().includes(q) || req.specimen.toLowerCase().includes(q) || req.id.toLowerCase().includes(q);
    }
    return true;
  });

  // Pharmacy State
  const [pharmacyFilter, setPharmacyFilter] = useState('All');
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacyRequests, setPharmacyRequests] = useState([
    { id: 1, name: 'Bereket Haile', studentId: 'UOG/14321/17', med: 'Amoxicillin 500mg', dosage: '3x daily, 7 days', status: 'Pending Review', date1: 'Today,', date2: '09:45 AM' },
    { id: 2, name: 'Liya Tadesse', studentId: 'UOG/06543/16', med: 'Salbutamol Inhaler', dosage: '2 puffs as needed', status: 'Pending Review', date1: 'Today,', date2: '10:15 AM' }
  ]);

  const filteredPharmacyRequests = pharmacyRequests.filter(req => {
    if (pharmacyFilter !== 'All') {
      if (req.status !== pharmacyFilter) return false;
    }
    if (pharmacySearch) {
      const q = pharmacySearch.toLowerCase();
      return req.name.toLowerCase().includes(q) || req.med.toLowerCase().includes(q) || req.studentId.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePharmacyAction = (id, newStatus) => {
    setPharmacyRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchRecentReferrals();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentReferrals = async () => {
    if (user?.role === 'admin') {
      try {
        const res = await getReferrals();
        setRecentReferrals(res.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load recent referrals', err);
      } finally {
        setReferralsLoading(false);
      }
    }
  };

  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const days = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // To simulate the screenshot exactly
  const displayStats = stats || { referrals_this_month: 3, new_staff_this_month: 10, total_referrals: 3, pending_referrals: 2 };

  return (
    <Layout>
      {user?.role !== 'pharmacist' && user?.role !== 'lab_technician' && (
        <>
          <h1 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#fff' }}>
            {user?.role === 'admin' ? 'Admin Dashboard' : `Hi, ${user?.username || 'User'}`}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '15px' }}>
            Welcome back, {user?.username || 'admin'} • {user?.role === 'intake_team' ? 'Intake Team' : user?.role || 'admin'}
          </p>
        </>
      )}

      {user?.role === 'admin' && (
        <>
          {/* STATS ROW: Cards side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <Link to="/referrals?tab=all" className="dash-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Students Referred</h3>
              <h2 style={{ fontSize: '48px', margin: '0', color: '#fff', lineHeight: '1' }}>{displayStats.referrals_this_month}</h2>
            </Link>
            <Link to="/users?filter=New+Staff" className="dash-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Staff This Month</h3>
              <h2 style={{ fontSize: '48px', margin: '0', color: '#fff', lineHeight: '1' }}>{displayStats.new_staff_this_month}</h2>
            </Link>
            <Link to="/referrals" className="dash-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Referrals</h3>
              <h2 style={{ fontSize: '48px', margin: '0', color: '#fff', lineHeight: '1' }}>{displayStats.total_referrals}</h2>
            </Link>
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            
            {/* Left Side: Recent Referrals Table */}
            <div style={{ flex: 1, minWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Recent Referred Students</h3>
                </div>
                {referralsLoading ? (
                  <p style={{ padding: '0 32px 32px' }}>Loading recent referrals...</p>
                ) : (recentReferrals.length > 0 || true) ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Student</th>
                        <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Department</th>
                        <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recentReferrals.length > 0 ? recentReferrals : [
                        { referral_id: 1, student_id: 1, student_name: 'Nahom Yonas', receiving_department_name: 'General Medical', status: 'pending', created_at: '2026-05-24T10:00:00Z' },
                        { referral_id: 2, student_id: 2, student_name: 'Nahom Yonas', receiving_department_name: 'General Medical', status: 'pending', created_at: '2026-05-21T10:00:00Z' },
                        { referral_id: 3, student_id: 3, student_name: 'Nahom Yonas', receiving_department_name: 'General Medical', status: 'accepted', created_at: '2026-05-20T10:00:00Z' },
                      ]).map((ref) => (
                        <tr key={ref.referral_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '24px 32px' }}>
                            <Link to={`/students/${ref.student_id || 1}`} style={{ color: '#fff', fontWeight: '600', fontSize: '15px', textDecoration: 'none' }} className="hover-underline">
                              {ref.student_name}
                            </Link>
                          </td>
                          <td style={{ padding: '24px 32px', color: 'var(--text-muted)', fontSize: '15px' }}>{ref.receiving_department_name}</td>
                          <td style={{ padding: '24px 32px' }}>
                            <span style={{
                              padding: '6px 16px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: ref.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : ref.status === 'declined' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: ref.status === 'accepted' ? '#10b981' : ref.status === 'declined' ? '#ef4444' : '#f59e0b',
                            }}>
                              {ref.status}
                            </span>
                          </td>
                          <td style={{ padding: '24px 32px', color: 'var(--text-muted)', fontSize: '15px' }}>
                            {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '24px 32px' }}>
                            <Link to={`/referrals/${ref.referral_id}`} style={{ color: '#0ea5e9', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }} className="hover-underline">
                              View referral
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ padding: '0 32px 32px', color: 'var(--text-muted)' }}>No recent referrals found.</p>
                )}
              </div>
            </div>

            {/* Right Side: Calendar and Staff List */}
            <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="dash-card">
                <h3 style={{ marginTop: 0, fontSize: '20px', color: '#fff', marginBottom: '24px' }}>{calendarDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ fontWeight: '500', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>{d}</div>
                  ))}
                  {days.map((day, idx) => {
                    const isToday = day === 25; // hardcoded for demo matching screenshot
                    const hasDot = [5, 12, 14, 18].includes(day);

                    return (
                      <div
                        key={idx}
                        style={{
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          borderRadius: '8px',
                          backgroundColor: isToday ? 'var(--primary-blue)' : 'transparent',
                          color: isToday ? '#fff' : (day ? '#fff' : 'transparent'),
                          fontWeight: isToday ? 'bold' : 'normal',
                          fontSize: '15px'
                        }}
                      >
                        {day || ''}
                        {hasDot && !isToday && (
                          <div style={{ position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>Notifications</h3>
                  <Link to="/notifications" style={{ color: 'var(--primary-blue)', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>See All</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {[
                    { title: 'New referral received from Emergency', time: '2 mins ago', unread: true, icon: 'R', color: '#10b981' },
                    { title: 'Dr. Abebe approved referral #1024', time: '1 hour ago', unread: true, icon: 'A', color: 'var(--primary-blue)' },
                    { title: 'System maintenance scheduled tonight', time: '4 hours ago', unread: false, icon: 'S', color: '#f59e0b' },
                    { title: 'Jane Doe checked in at General Med', time: '1 day ago', unread: false, icon: 'C', color: '#8b5cf6' },
                  ].map((notif, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `rgba(${parseInt(notif.color.slice(1, 3) || '255', 16)}, ${parseInt(notif.color.slice(3, 5) || '255', 16)}, ${parseInt(notif.color.slice(5, 7) || '255', 16)}, 0.1)`, color: notif.color, border: `1px solid ${notif.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                        {notif.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: notif.unread ? '#fff' : 'var(--text-muted)', fontWeight: notif.unread ? '600' : 'normal', fontSize: '14px', lineHeight: '1.4' }}>{notif.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>{notif.time}</div>
                      </div>
                      {notif.unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-blue)' }}></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {user?.role === 'clinician' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Quick Actions (Row 1) */}
          <div className="dash-card" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#fff', fontWeight: '700' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
              {/* Button 1: New Visit */}
              <Link to="/students/new" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' }}>+</div>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>New Visit</span>
              </Link>
              {/* Button 2: Write Rx */}
              <Link to="/prescriptions/new" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <ReportIcon style={{ width: '28px', height: '28px' }} />
                </div>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>Write Rx</span>
              </Link>
              {/* Button 3: Order Lab */}
              <Link to="/labs/new" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '24px', height: '28px', border: '2px solid currentColor', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', position: 'relative' }}>
                     <div style={{ position: 'absolute', bottom: '2px', left: '2px', right: '2px', height: '12px', background: 'currentColor', borderRadius: '0 0 8px 8px', opacity: '0.4' }}></div>
                  </div>
                </div>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>Order Lab</span>
              </Link>
              {/* Button 4: Refer Out */}
              <Link to="/referrals/new" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </div>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>Refer Out</span>
              </Link>
            </div>
          </div>

          {/* Metrics (Row 2) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="dash-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <UsersIcon style={{ width: '20px', height: '20px' }} />
              </div>
              <h2 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#3b82f6', fontWeight: '700' }}>6</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Today's Patients</p>
            </div>
            <div className="dash-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <h2 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#10b981', fontWeight: '700' }}>2</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>In Progress</p>
            </div>
            <div className="dash-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)', background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <ReportIcon style={{ width: '20px', height: '20px' }} />
              </div>
              <h2 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#f59e0b', fontWeight: '700' }}>3</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Pending Rx</p>
            </div>
            <div className="dash-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.2)', background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.05) 0%, transparent 100%)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <div style={{ width: '16px', height: '20px', border: '2px solid currentColor', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', borderTopLeftRadius: '3px', borderTopRightRadius: '3px' }}></div>
              </div>
              <h2 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#a855f7', fontWeight: '700' }}>2</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Lab Pending</p>
            </div>
          </div>

          {/* Recent Consultations */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '22px', color: '#fff', margin: 0, fontWeight: 'bold' }}>Recent Consultations</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Wednesday, 12 July 2026</div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button style={{ padding: '8px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>All</button>
                <button style={{ padding: '8px 20px', background: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Active Case</button>
                <button style={{ padding: '8px 20px', background: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Pending Referral</button>
                <button style={{ padding: '8px 20px', background: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Follow-up Required</button>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0 16px', width: '300px' }}>
                  <input type="text" placeholder="Search a name, complaint, diagnosis..." style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '14px', width: '100%', outline: 'none', padding: '10px 0' }} />
                  <SearchIcon style={{ color: 'var(--text-muted)', width: '18px', height: '18px', marginLeft: '8px' }} />
                </div>
              </div>
            </div>

            {/* Grid of Patient Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {[
                { initials: 'BH', color: '#10b981', name: 'Bereket Haile', id: 'UOG/14321/17', loc: 'Student Clinic', status: 'Active Case', sColor: '#10b981', age: '21 M', visit: 'Today, 09:45 AM', cc: 'Persistent cough, low-grade fever', dx: 'Upper respiratory tract infection' },
                { initials: 'LT', color: '#8b5cf6', name: 'Liya Tadesse', id: 'UOG/06543/16', loc: 'OPD Room 2', status: 'Pending Referral', sColor: '#f59e0b', age: '22 F', visit: 'Today, 10:15 AM', cc: 'Recurrent wheezing, chest tightness', dx: 'Asthma exacerbation' },
                { initials: 'YB', color: '#f59e0b', name: 'Yohannes Bekele', id: 'UOG/07122/16', loc: 'Internal Medicine', status: 'Follow-up Required', sColor: '#8b5cf6', age: '23 M', visit: 'Today, 10:00 AM', cc: 'Increased thirst, frequent urination', dx: 'Type 2 Diabetes' },
                { initials: 'AG', color: '#ef4444', name: 'Abel Getachew', id: 'UOG/10234/15', loc: 'Student Clinic', status: 'Active Case', sColor: '#10b981', age: '24 M', visit: 'Today, 08:30 AM', cc: 'Chronic headache, blurry vision', dx: 'Migraine' },
                { initials: 'SM', color: '#3b82f6', name: 'Sara Mengistu', id: 'UOG/18334/18', loc: 'Emergency', status: 'Discharged', sColor: '#10b981', age: '20 F', visit: 'Today, 07:50 AM', cc: 'Abdominal pain, nausea', dx: 'Acute gastroenteritis' },
                { initials: 'DF', color: '#1b64f2', name: 'Daniel Fikru', id: 'UOG/22456/17', loc: 'Orthopedics', status: 'Pending Referral', sColor: '#f59e0b', age: '22 M', visit: 'Today, 11:20 AM', cc: 'Ankle sprain after sports', dx: 'Grade II ankle sprain' },
              ].map((pt, i) => (
                <div key={i} className="dash-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: pt.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                      {pt.initials}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#fff', fontWeight: '600' }}>{pt.name}</h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{pt.id}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {pt.loc}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: `${pt.sColor}15`, color: pt.sColor, fontSize: '12px', fontWeight: '600', alignSelf: 'flex-start', marginBottom: '24px', border: `1px solid ${pt.sColor}30` }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pt.sColor }}></div>
                    {pt.status}
                  </div>

                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Age</div>
                      <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500' }}>{pt.age}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Last Visit</div>
                      <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500' }}>{pt.visit}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Chief Complaint</div>
                    <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.4' }}>{pt.cc}</div>
                  </div>

                  <div style={{ marginBottom: '24px', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Diagnosis</div>
                    <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '13px', color: '#cbd5e1' }}>{pt.dx}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <button style={{ flex: 1, padding: '10px', background: 'var(--primary-blue)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-bg-light">View Chart</button>
                    <button style={{ flex: 1, padding: '10px', background: 'transparent', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-bg-success">Discharge</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'intake_team' && (
        <div className="dash-card">
          <h3>Incoming Referrals</h3>
          <p>Review referrals sent to your department.</p>
          <Link to="/referrals" className="btn">View Referrals</Link>
        </div>
      )}

      {user?.role === 'pharmacist' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', fontSize: '24px', margin: 0, fontWeight: 'bold' }}>Recent Prescriptions</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{formattedUTC}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Pending Review', 'Dispensed', 'Out of Stock'].map(f => (
                <button key={f} onClick={() => setPharmacyFilter(f)} style={{ background: pharmacyFilter === f ? '#10b981' : (f === 'All' ? 'transparent' : 'rgba(255,255,255,0.03)'), color: pharmacyFilter === f ? '#fff' : 'var(--text-muted)', border: f === 'All' && pharmacyFilter !== 'All' ? '1px solid rgba(255,255,255,0.05)' : (pharmacyFilter === f ? 'none' : '1px solid rgba(255,255,255,0.05)'), padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{f}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <FilterIcon />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <input type="text" placeholder="Search a name, medication, or etc" value={pharmacySearch} onChange={(e) => setPharmacySearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '250px', fontSize: '14px' }} />
                <SearchIcon />
              </div>
            </div>
          </div>
          <div className="dash-card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ minWidth: '800px' }}>
              {filteredPharmacyRequests.length > 0 ? filteredPharmacyRequests.map((row, i) => (
                <div key={row.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(200px, 3fr) minmax(150px, 2fr) minmax(100px, 1.5fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(120px, 1fr)',
                  alignItems: 'center', 
                  padding: '20px 24px', 
                  borderBottom: i === filteredPharmacyRequests.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  gap: '16px'
                }}>
                  
                  {/* Col 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '14px' }}>{row.med}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Patient: {row.name}</div>
                  </div>

                  {/* Col 2 */}
                  <div>
                    <span style={{ display: 'inline-block', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                      {row.dosage}
                    </span>
                  </div>

                  {/* Col 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <div>ID: {row.studentId.split('/')[1] || row.studentId}</div>
                    <div>Year: {row.studentId.split('/')[2] || '17'}</div>
                  </div>

                  {/* Col 4 */}
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    Date: {row.date1} {row.date2}
                  </div>

                  {/* Col 5 */}
                  <div>
                    <span style={{ display: 'inline-block', background: row.status === 'Pending Review' ? 'rgba(56, 189, 248, 0.1)' : row.status === 'Dispensed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: row.status === 'Pending Review' ? '#38bdf8' : row.status === 'Dispensed' ? '#10b981' : '#ef4444', padding: '4px 16px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' }}>
                      {row.status === 'Pending Review' ? 'Upcoming' : row.status}
                    </span>
                  </div>

                  {/* Col 6 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <button onClick={() => handlePharmacyAction(row.id, 'Dispensed')} style={{ background: 'transparent', color: row.status === 'Dispensed' ? '#10b981' : '#38bdf8', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                      {row.status === 'Dispensed' ? 'Dispensed' : 'Dispense'}
                    </button>
                    {row.status !== 'Dispensed' && (
                      <button onClick={() => handlePharmacyAction(row.id, 'Out of Stock')} style={{ background: 'transparent', color: row.status === 'Out of Stock' ? '#ef4444' : 'var(--text-muted)', border: 'none', fontWeight: '500', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                        {row.status === 'Out of Stock' ? 'Out of Stock' : 'Mark out of stock'}
                      </button>
                    )}
                  </div>

                </div>
              )) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No prescriptions found matching your filters.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'lab_technician' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 8px 0', fontWeight: 'bold' }}>Lab Work Queue</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>Review incoming test requests and move samples through the workflow.</p>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '15px', paddingTop: '4px' }}>{formattedUTC}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {['All', 'Pending', 'Result updated', 'Urgent', 'Routine'].map(f => (
                <button key={f} onClick={() => setLabFilter(f)} style={{ background: labFilter === f ? '#0ea5e9' : 'rgba(255,255,255,0.03)', color: labFilter === f ? '#fff' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{f}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <FilterIcon />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <input type="text" placeholder="Search a name, test, specimen, or etc" value={labSearch} onChange={(e) => setLabSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '280px', fontSize: '14px' }} />
                <SearchIcon />
              </div>
            </div>
          </div>
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Patient</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Test</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Specimen</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Requested</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredLabRequests.length > 0 ? filteredLabRequests.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '24px' }}>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{row.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '2px' }}>{row.id}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{row.sub}</div>
                    </td>
                    <td style={{ padding: '24px', color: '#0ea5e9', fontWeight: '600', fontSize: '15px' }}>{row.test}</td>
                    <td style={{ padding: '24px', color: '#e2e8f0', fontSize: '14px' }}>{row.specimen}</td>
                    <td style={{ padding: '24px' }}>
                      <span style={{ border: `1px solid ${row.priorityColor}50`, color: row.priorityColor, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{row.priority}</span>
                    </td>
                    <td style={{ padding: '24px', color: row.statusColor, fontWeight: '600', fontSize: '14px' }}>{row.status}</td>
                    <td style={{ padding: '24px', color: '#e2e8f0', fontSize: '14px' }}>
                      <div style={{ marginBottom: '2px' }}>{row.date1}</div>
                      <div>{row.date2}</div>
                    </td>
                    <td style={{ padding: '24px' }}>
                      <Link to={`/students/${row.student_id}`} style={{ background: 'rgba(255,255,255,0.05)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', lineHeight: '1.4', textDecoration: 'none', display: 'inline-block' }}>View<br/>Order</Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No requests found matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;