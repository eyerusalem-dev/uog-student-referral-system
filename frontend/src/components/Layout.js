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

  const initials = user?.first_name
    ? user.first_name.charAt(0).toUpperCase()
    : user?.username
    ? user.username.charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            UOG <span>Hospital</span>
          </div>
        </div>

<nav className="sidebar-nav">
  <Link to="/">Dashboard</Link>

  {(user?.role === 'admin' || user?.role === 'clinician') && (
    <>
      <Link to="/students">Students</Link>
      <Link to="/students/new">Register Student</Link>
      <Link to="/visits/new">New Visit</Link>
    </>
  )}

  <Link to="/referrals">Referrals</Link>

  {user?.role === 'lab_technician' && (
    <Link to="/lab-requests">Lab Requests</Link>
  )}

  {user?.role === 'pharmacist' && (
    <Link to="/prescriptions">Prescriptions</Link>
  )}

  {user?.role === 'admin' && (
    <>
      <Link to="/users">Users</Link>
      <Link to="/departments">Departments</Link>
    </>
  )}
</nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h2>University of Gondar</h2>
            <p>Student Health Referral and Visit Tracking System</p>
          </div>

          <div className="user-profile">
            <div className="user-info">
              <div className="name">{user?.username || 'User'}</div>
              <div className="role">{user?.role || 'Staff'}</div>
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