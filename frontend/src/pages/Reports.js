import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDashboardStats } from '../services/api';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Layout><p>Loading reports...</p></Layout>;

  return (
    <Layout>
      <h1>Reports (UTC Based)</h1>
      <p style={{ color: '#999', marginBottom: '30px' }}>
        All statistics are calculated using UTC time zone.
      </p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          <div style={cardStyle}>
            <h3>Referrals This Month (UTC)</h3>
            <h2 style={{ fontSize: '52px', color: '#1053ae', margin: '10px 0' }}>
              {stats.referrals_this_month}
            </h2>
            <p style={{ color: '#666' }}>Students referred this calendar month</p>
          </div>

          <div style={cardStyle}>
            <h3>New Staff This Month</h3>
            <h2 style={{ fontSize: '52px', color: '#1053ae', margin: '10px 0' }}>
              {stats.new_staff_this_month}
            </h2>
            <p style={{ color: '#666' }}>New users created this month</p>
          </div>

          <div style={cardStyle}>
            <h3>Total Referrals</h3>
            <h2 style={{ fontSize: '52px', color: '#1053ae', margin: '10px 0' }}>
              {stats.total_referrals}
            </h2>
          </div>

          <div style={cardStyle}>
            <h3>Pending Referrals</h3>
            <h2 style={{ fontSize: '52px', color: '#f59e0b', margin: '10px 0' }}>
              {stats.pending_referrals}
            </h2>
          </div>

          <div style={cardStyle}>
            <h3>Accepted Referrals</h3>
            <h2 style={{ fontSize: '52px', color: '#10b981', margin: '10px 0' }}>
              {stats.accepted_referrals}
            </h2>
          </div>

          <div style={cardStyle}>
            <h3>Declined Referrals</h3>
            <h2 style={{ fontSize: '52px', color: '#ef4444', margin: '10px 0' }}>
              {stats.declined_referrals}
            </h2>
          </div>
        </div>
      )}
    </Layout>
  );
};

const cardStyle = {
  background: 'white',
  padding: '28px',
  borderRadius: '16px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
  textAlign: 'center',
};

export default Reports;