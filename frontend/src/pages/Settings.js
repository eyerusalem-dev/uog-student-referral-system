import React from 'react';
import Layout from '../components/Layout';

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const EyeIcon = ({ show }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
    {show ? (
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7.73 0-11-8.81-11-8.81a18.65 18.65 0 0 1 4.83-5.44M9.9 4.24A9.12 9.12 0 0 1 12 4c7.73 0 11 8.81 11 8.81a18.65 18.65 0 0 1-2.63 4.75"></path>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </>
    )}
  </svg>
);

const LogoutArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const Settings = () => {
  return (
    <Layout>
      <style>{`
        @media (max-width: 768px) {
          .settings-container { padding: 16px !important; }
          .settings-card { padding: 20px !important; }
        }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', margin: '0 0 32px 0' }}>Settings</h1>

        {/* Change Password Card */}
        <div className="settings-card" style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--card-border)',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
              <LockIcon />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', margin: 0 }}>Change Password</h2>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="current-password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  id="current-password"
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '44px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <EyeIcon show={false} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="new-password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  id="new-password"
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '44px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <EyeIcon show={false} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  id="confirm-password"
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '44px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <EyeIcon show={false} />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                Must be at least 8 characters
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {}}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              >
                Update Password
              </button>
              {/* TODO: Attach password update handler */}
            </div>
          </form>
        </div>

        {/* Log Out Card */}
        <div className="settings-card" style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--card-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
              <LogoutArrowIcon />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', margin: 0 }}>Log Out</h2>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.6' }}>
            Sign out of your account securely. This will clear your session and return you to the login page.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {}}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              Log Out
            </button>
            {/* TODO: Attach logout handler */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;