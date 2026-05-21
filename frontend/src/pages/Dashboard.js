import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>
          Welcome back, {user?.first_name || user?.username}!
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>
          Here is what's happening with the system today.
        </p>
      </div>

      {/* ADMIN DASHBOARD */}
      {user?.role === 'admin' && (
        <div className="dashboard-grid">
          <div className="dash-card">
            <h3>Manage Users</h3>
            <p>Create and manage clinicians and department receiver accounts.</p>
            <Link to="/users" className="btn">Open Users</Link>
          </div>

          <div className="dash-card">
            <h3>Departments</h3>
            <p>Configure hospital receiving departments and locations.</p>
            <Link to="/departments" className="btn">Open Departments</Link>
          </div>

          <div className="dash-card">
            <h3>Student Records</h3>
            <p>View all registered students and their medical history.</p>
            <Link to="/students" className="btn">View Students</Link>
          </div>

          <div className="dash-card">
            <h3>All Referrals</h3>
            <p>Monitor all referral activities across the system.</p>
            <Link to="/referrals" className="btn">View Referrals</Link>
          </div>
        </div>
      )}

      {/* CLINICIAN DASHBOARD */}
      {user?.role === 'clinician' && (
        <div className="dashboard-grid">
          <div className="dash-card">
            <h3>Register Student</h3>
            <p>Add a new student profile to the system before recording visits.</p>
            <Link to="/students/new" className="btn">Register New</Link>
          </div>

          <div className="dash-card">
            <h3>Student Directory</h3>
            <p>Search students and open their health profiles.</p>
            <Link to="/students" className="btn">Open Directory</Link>
          </div>

          <div className="dash-card">
            <h3>Record Visit</h3>
            <p>Log symptoms, diagnosis, treatment, and lab/pharmacy usage.</p>
            <Link to="/visits/new" className="btn">New Visit</Link>
          </div>

          <div className="dash-card">
            <h3>Send Referral</h3>
            <p>Refer a student to a specialized hospital department.</p>
            <Link to="/referrals/new" className="btn">Create Referral</Link>
          </div>
        </div>
      )}

      {/* DEPARTMENT RECEIVER DASHBOARD */}
      {user?.role === 'department_receiver' && (
        <div className="dashboard-grid">
          <div className="dash-card">
            <h3>Incoming Referrals</h3>
            <p>Review and process referrals sent to your department.</p>
            <Link to="/referrals" className="btn">View Referrals</Link>
          </div>

          <div className="dash-card">
            <h3>Your Department</h3>
            <p>You are assigned to: <strong>{user?.department_name || 'General Medical'}</strong></p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;