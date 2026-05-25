import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  GridIcon, ReferralsIcon, UsersIcon, UserCogIcon, 
  BuildingIcon, LayersIcon, ReportIcon, SearchIcon, 
  MessageIcon, BellIcon, HelpIcon, SettingsIcon, LogoutIcon
} from './Icons';
import logoImg from '../pages/uog-logo.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.first_name ? user.first_name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'A');

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link to={to} className={`nav-item ${isActive(to) ? 'active' : ''}`}>
      <Icon className="nav-icon" />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <img src={logoImg} alt="University of Gondar Hospital" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.35)' }} />
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavItem to="/" icon={GridIcon} label="Dashboard" />

          {/* Shared Referral Access */}
          {['admin', 'clinician', 'intake_team'].includes(user?.role) && (
            <NavItem to="/referrals" icon={ReferralsIcon} label="Referrals" />
          )}

          {/* Clinician & Admin Tools */}
          {['clinician', 'admin'].includes(user?.role) && (
            <NavItem to="/students" icon={UsersIcon} label="Students" />
          )}

          {/* Admin-only tools */}
          {user?.role === 'admin' && (
            <>
              <NavItem to="/users" icon={UserCogIcon} label="User Management" />
              <NavItem to="/departments" icon={BuildingIcon} label="Departments" />
              <NavItem to="/audit-logs" icon={LayersIcon} label="Audit Log" />
              <NavItem to="/reports" icon={ReportIcon} label="Reports" />
            </>
          )}

          {/* Lab/Pharmacy roles */}
          {user?.role === 'lab_technician' && <NavItem to="/lab-requests" icon={LayersIcon} label="Lab Requests" />}
          {user?.role === 'pharmacist' && <NavItem to="/prescriptions" icon={ReportIcon} label="Prescriptions" />}

          <div className="settings-section" style={{ padding: '0 12px', marginTop: '24px' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginLeft: '20px', fontWeight: '600' }}>Settings</h4>
            <NavItem to="/help" icon={HelpIcon} label="Help & Support" />
            <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
          </div>
        </nav>

        <div className="sidebar-bottom" style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <div style={{ padding: '0 24px', marginBottom: '24px' }}>
            <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', outline: 'none' }}>
              <LogoutIcon style={{ width: '18px', height: '18px' }} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title" style={{ marginLeft: '40px' }}>
            <h2>Hello, {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'} 👋</h2>
            <p>Welcome to your {user?.role?.replace('_', ' ') || 'admin'} dashboard.</p>
          </div>
          
          <div className="topbar-actions">


            <div className="topbar-icons">
              <button className="icon-btn">
                <MessageIcon />
              </button>
              <button className="icon-btn notification-btn">
                <BellIcon />
                <span className="notification-dot"></span>
              </button>
            </div>

            <div className="user-profile">
              <div className="user-avatar" style={{ background: '#10b981' }}>{initials}</div>
              <div className="user-info">
                <div className="name">Dr. {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'} .</div>
                <div className="role">{user?.role?.replace('_', ' ') || 'Administration'}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
};

export default Layout;