import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
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

  return (
    <Layout>
      <h1>Dashboard</h1>
      <p style={{ color: '#999', marginBottom: '30px' }}>
        Welcome back, {user?.first_name || user?.username} • {user?.role === 'intake_team' ? 'Intake Team' : user?.role}
      </p>

      {user?.role === 'admin' && (
        <>
          {loading ? (
            <p>Loading statistics...</p>
          ) : stats ? (
            <div className="dashboard-grid">
              <div className="dash-card">
                <h3>Students Referred This Month (UTC)</h3>
                <h2 style={{ fontSize: '42px', margin: '10px 0', color: '#1053ae' }}>
                  {stats.referrals_this_month}
                </h2>
                <p style={{ color: '#666' }}>Based on UTC month boundary</p>
              </div>

              <div className="dash-card">
                <h3>New Staff This Month</h3>
                <h2 style={{ fontSize: '42px', margin: '10px 0', color: '#1053ae' }}>
                  {stats.new_staff_this_month}
                </h2>
              </div>

              <div className="dash-card">
                <h3>Total Referrals</h3>
                <h2 style={{ fontSize: '42px', margin: '10px 0', color: '#1053ae' }}>
                  {stats.total_referrals}
                </h2>
              </div>

              <div className="dash-card">
                <h3>Pending Referrals</h3>
                <h2 style={{ fontSize: '42px', margin: '10px 0', color: '#f59e0b' }}>
                  {stats.pending_referrals}
                </h2>
              </div>
            </div>
          ) : (
            <p>Could not load statistics.</p>
          )}

          <div style={{ marginTop: '30px' }}>
            <Link
              to="/reports"
              style={{
                padding: '12px 24px',
                background: '#1053ae',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              View Full Reports →
            </Link>
          </div>
        </>
      )}

      {/* Other roles keep their previous dashboard cards */}
      {user?.role === 'clinician' && (
        <div className="dashboard-grid">
          <div className="dash-card">
            <h3>Register Student</h3>
            <p>Add a new student profile before recording visits or referrals.</p>
            <Link to="/students/new" className="btn">Register Student</Link>
          </div>

          <div className="dash-card">
            <h3>Student Directory</h3>
            <p>Search and view student medical history.</p>
            <Link to="/students" className="btn">Open Directory</Link>
          </div>

          <div className="dash-card">
            <h3>New Visit</h3>
            <p>Record symptoms, diagnosis, lab and pharmacy usage.</p>
            <Link to="/visits/new" className="btn">New Visit</Link>
          </div>

          <div className="dash-card">
            <h3>New Referral</h3>
            <p>Refer a student to a hospital department.</p>
            <Link to="/referrals/new" className="btn">New Referral</Link>
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
    </Layout>
  );
};

export default Dashboard;