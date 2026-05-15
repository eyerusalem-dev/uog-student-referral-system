import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <h1>Dashboard</h1>
      <p className="muted">
        Welcome, {user?.first_name || user?.username}. You are logged in as{' '}
        <strong>{user?.role}</strong>.
      </p>

      {user?.role === 'admin' && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Manage Users</h3>
            <p>Create clinicians and department receiver accounts.</p>
            <Link to="/users">Open Users</Link>
          </div>

          <div className="dashboard-card">
            <h3>Manage Departments</h3>
            <p>Create and update hospital receiving departments.</p>
            <Link to="/departments">Open Departments</Link>
          </div>

          <div className="dashboard-card">
            <h3>View Students</h3>
            <p>View registered students and their visit/referral history.</p>
            <Link to="/students">Open Students</Link>
          </div>

          <div className="dashboard-card">
            <h3>All Referrals</h3>
            <p>Monitor all referrals across the system.</p>
            <Link to="/referrals">Open Referrals</Link>
          </div>
        </div>
      )}

      {user?.role === 'clinician' && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Register Student</h3>
            <p>Add a new student profile before recording visits/referrals.</p>
            <Link to="/students/new">Register Student</Link>
          </div>

          <div className="dashboard-card">
            <h3>Student List</h3>
            <p>Search students and open their health profile.</p>
            <Link to="/students">Open Students</Link>
          </div>

          <div className="dashboard-card">
            <h3>New Visit</h3>
            <p>Record symptoms, diagnosis, treatment, lab and pharmacy usage.</p>
            <Link to="/visits/new">Create Visit</Link>
          </div>

          <div className="dashboard-card">
            <h3>New Referral</h3>
            <p>Send a referral to a hospital department.</p>
            <Link to="/referrals/new">Create Referral</Link>
          </div>
        </div>
      )}

      {user?.role === 'department_receiver' && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Incoming Referrals</h3>
            <p>Review referrals sent to your department.</p>
            <Link to="/referrals">Open Referrals</Link>
          </div>

          <div className="dashboard-card">
            <h3>Your Department</h3>
            <p>{user?.department || 'No department assigned'}</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;