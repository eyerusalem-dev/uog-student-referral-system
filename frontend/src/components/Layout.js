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

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="sidebar-title">UOG</h2>
        <p className="sidebar-subtitle">Referral System</p>

        <nav className="sidebar-nav">
          <Link to="/">Dashboard</Link>

          {(user?.role === 'admin' || user?.role === 'clinician') && (
            <>
              <Link to="/students">Students</Link>
              <Link to="/students/new">Register Student</Link>
              <Link to="/visits/new">New Visit</Link>
              <Link to="/referrals/new">New Referral</Link>
            </>
          )}

          <Link to="/referrals">Referrals</Link>

          {user?.role === 'admin' && (
            <>
              <Link to="/users">Users</Link>
              <Link to="/departments">Departments</Link>
            </>
          )}
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <strong>University of Gondar</strong>
            <p>Student Health Referral and Visit Tracking System</p>
          </div>

          <div className="user-box">
            <span>{user?.username}</span>
            <small>{user?.role}</small>
          </div>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
};

export default Layout;