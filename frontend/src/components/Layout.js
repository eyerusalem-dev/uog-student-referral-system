import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.first_name ? user.first_name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'U');

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">UOG <span>Hospital</span></div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/">Dashboard</Link>

          {/* Clinician-only tools */}
          {user?.role === 'clinician' && (
            <>
              <Link to="/students">Students</Link>
              <Link to="/students/new">Register Student</Link>
              <Link to="/visits/new">New Visit</Link>
            </>
          )}

          {/* Shared Referral Access */}
          <Link to="/referrals">Referrals</Link>

          {/* Lab/Pharmacy roles */}
          {user?.role === 'lab_technician' && <Link to="/lab-requests">Lab Requests</Link>}
          {user?.role === 'pharmacist' && <Link to="/prescriptions">Prescriptions</Link>}

          {/* Admin-only tools */}
          {user?.role === 'admin' && (
            <>
              <Link to="/students">Students</Link>
              <Link to="/users">User Management</Link>
              <Link to="/departments">Departments</Link>
              <Link to="/audit-logs">Audit Log</Link>
            </>
          )}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h2>University of Gondar</h2>
            <p>Student Health Referral System</p>
          </div>
          <div className="user-profile">
            <div className="user-info">
              <div className="name">{user?.username || 'User'}</div>
              <div className="role">{user?.role?.replace('_', ' ')}</div>
            </div>
            <div className="user-avatar">{initials}</div>
          </div>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
};

export default Layout;