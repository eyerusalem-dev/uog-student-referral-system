import React, { useState } from 'react';
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

  const [showNotifications, setShowNotifications] = useState(false);

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
            {user?.role !== 'admin' && (
              <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 16px', width: '250px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <SearchIcon style={{ color: 'var(--text-muted)', marginRight: '8px', width: '18px', height: '18px' }} />
                <input type="text" placeholder="Search..." style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '14px', width: '100%' }} />
              </div>
            )}

            <div className="topbar-icons">
              {user?.role !== 'admin' && (
                <button className="icon-btn">
                  <MessageIcon />
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <button className="icon-btn notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                  <BellIcon />
                  <span className="notification-dot" style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
                </button>
                {showNotifications && user?.role === 'admin' && (
                  <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', width: '320px', padding: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>Contact Admin Requests</h4>
                      <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>4 New</span>
                    </div>
                    {[
                      { name: 'Dr. Tadesse', message: 'I am unable to login, please reset my password.', time: '10 mins ago' },
                      { name: 'Guest User', message: 'Can I register for an account here?', time: '1 hour ago' },
                      { name: 'Admin Staff', message: 'Need access to the new referral module.', time: '3 hours ago' },
                      { name: 'Nurse Aster', message: 'My dashboard is not showing recent patients.', time: '1 day ago' },
                    ].map((n, i) => (
                      <div key={i} style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '12px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>{n.name}</span>
                          <span style={{ color: '#0ea5e9', fontSize: '11px' }}>{n.time}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.4' }}>"{n.message}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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