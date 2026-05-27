import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getEnhancedDashboardStats, getReferrals, getDepartments } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import { ReportIcon, UsersIcon } from '../components/Icons';
import { saveAs } from 'file-saver';

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const PrinterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);
const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
const TrendDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
);
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

// Simple Bar Chart Component
const BarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.length > 0 ? data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '100px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </div>
            <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(item.count / maxValue) * 100}%`, 
                  background: item.color || '#3B82F6',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{item.count}</span>
              </div>
            </div>
          </div>
        )) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', gridColumn: '1 / -1' }}>No data available</p>
        )}
      </div>
    </div>
  );
};

// Simple Donut Chart Component
const DonutChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 160;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let offset = 0;
  const segments = data.map((item, idx) => {
    const percentage = total > 0 ? item.value / total : 0;
    const dashArray = percentage * circumference;
    const dashOffset = circumference - dashArray;
    const segment = { ...item, dashArray, dashOffset, offset: -offset };
    offset += dashArray;
    return segment;
  });

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((segment, idx) => (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.dashArray} ${circumference}`}
              strokeDashoffset={segment.offset}
              style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{total}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Total</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Trend Indicator Component
const TrendIndicator = ({ percentage, direction }) => {
  if (direction === 'neutral' || percentage === 0) {
    return <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No change</span>;
  }
  
  const color = direction === 'up' ? '#10B981' : '#EF4444';
  const Icon = direction === 'up' ? TrendUpIcon : TrendDownIcon;
  
  return (
    <span style={{ fontSize: '12px', color, display: 'flex', alignItems: 'center', gap: '2px' }}>
      <Icon /> {percentage}%
    </span>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon, color, trend, rate, rateLabel }) => {
  return (
    <div className="dash-card" style={{ padding: '24px', borderRadius: '16px', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
        </div>
        {icon && (
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <h2 style={{ margin: '0', fontSize: '48px', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>{value}</h2>
        {trend && (
          <TrendIndicator percentage={trend.percentage} direction={trend.direction} />
        )}
      </div>
      {subtitle && (
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{subtitle}</p>
      )}
      {rate !== undefined && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            padding: '4px 10px', 
            borderRadius: '12px', 
            fontSize: '12px', 
            fontWeight: '600',
            background: rate >= 80 ? 'rgba(16, 185, 129, 0.15)' : rate >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444'
          }}>
            {rateLabel || 'Rate'}: {rate}%
          </span>
        </div>
      )}
    </div>
  );
};

const Report = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time in EAT (East Africa Time - UTC+3)
  const formattedEAT = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Addis_Ababa',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(currentTime) + ' EAT (UTC+3)';

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch departments for filter
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch enhanced dashboard stats
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEnhancedStats();
      fetchRecentReferrals();
    }
  }, [user, dateRange, selectedDepartment, customStartDate, customEndDate]);

  const fetchRecentReferrals = async () => {
    if (user?.role === 'admin') {
      try {
        const res = await getReferrals();
        setRecentReferrals(res.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load recent referrals', err);
      } finally {
        setReferralsLoading(false);
      }
    }
  };

  const fetchEnhancedStats = async () => {
    setLoading(true);
    try {
      const params = { range: dateRange };
      if (dateRange === 'custom') {
        params.start_date = customStartDate;
        params.end_date = customEndDate;
      }
      if (selectedDepartment !== 'all') {
        params.department = selectedDepartment;
      }
      
      const res = await getEnhancedDashboardStats(params);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!stats) return;
    
    const rows = [
      ['Dashboard Report'],
      [`Date Range: ${stats.date_range.start} to ${stats.date_range.end}`],
      [],
      ['Referral Metrics'],
      ['Total Referrals', stats.referrals.total],
      ['Pending', stats.referrals.pending],
      ['Accepted', stats.referrals.accepted],
      ['Declined', stats.referrals.declined],
      ['Acceptance Rate', `${stats.referrals.acceptance_rate}%`],
      [],
      ['Lab Metrics'],
      ['Total Lab Requests', stats.lab.total],
      ['Completed', stats.lab.completed],
      ['Pending', stats.lab.pending],
      ['Completion Rate', `${stats.lab.completion_rate}%`],
      [],
      ['Prescription Metrics'],
      ['Total Prescriptions', stats.prescriptions.total],
      ['Dispensed', stats.prescriptions.dispensed],
      ['Out of Stock', stats.prescriptions.out_of_stock],
      ['Pending', stats.prescriptions.pending],
      ['Fulfillment Rate', `${stats.prescriptions.fulfillment_rate}%`],
      [],
      ['Department Breakdown'],
      ['Department', 'Total', 'Pending', 'Accepted', 'Declined']
    ];
    
    stats.department_breakdown.forEach(dept => {
      rows.push([
        dept.department_name,
        dept.count,
        dept.pending,
        dept.accepted,
        dept.declined
      ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `dashboard_report_${stats.date_range.range_type}.csv`);
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setShowCustomRange(range === 'custom');
  };

  // Format date range display
  const formatDateRangeDisplay = () => {
    if (!stats) return '';
    const start = new Date(stats.date_range.start);
    const end = new Date(stats.date_range.end);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div ref={printRef}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }} className="hover-underline">
                <ArrowLeftIcon /> Back to Dashboard
              </Link>
            </div>
            <h1 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#fff' }}>Admin Report</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>
              Comprehensive analytics and metrics • {formattedEAT}
            </p>
          </div>
        </div>

        {/* Report Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Date Range Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Date:</span>
              <select 
                value={dateRange} 
                onChange={(e) => handleDateRangeChange(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  background: 'var(--card-bg)', 
                  color: '#fff', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {showCustomRange && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    background: 'var(--card-bg)', 
                    color: '#fff', 
                    border: '1px solid var(--card-border)', 
                    borderRadius: '8px', 
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>to</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    background: 'var(--card-bg)', 
                    color: '#fff', 
                    border: '1px solid var(--card-border)', 
                    borderRadius: '8px', 
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Department Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Department:</span>
              <select 
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  background: 'var(--card-bg)', 
                  color: '#fff', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Display */}
            {stats && (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                {formatDateRangeDisplay()}
              </span>
            )}
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={exportToCSV}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px', 
                background: 'var(--card-bg)', 
                color: '#fff', 
                border: '1px solid var(--card-border)', 
                borderRadius: '8px', 
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <DownloadIcon /> Export CSV
            </button>
            <button 
              onClick={handlePrint}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px', 
                background: 'var(--primary-blue)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <PrinterIcon /> Print Report
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading report data...</div>
        ) : stats ? (
          <>
            {/* METRICS CARDS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <MetricCard
                title="Total Referrals"
                value={stats.referrals.total}
                trend={stats.referrals.trends.total}
                color="#3B82F6"
                icon={<ReportIcon />}
              />
              <MetricCard
                title="Pending"
                value={stats.referrals.pending}
                subtitle="Awaiting review"
                trend={stats.referrals.trends.pending}
                color="#F59E0B"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                }
              />
              <MetricCard
                title="Accepted"
                value={stats.referrals.accepted}
                subtitle="Approved referrals"
                trend={stats.referrals.trends.accepted}
                color="#10B981"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                }
              />
              <MetricCard
                title="Declined"
                value={stats.referrals.declined}
                subtitle="Rejected referrals"
                trend={stats.referrals.trends.declined}
                color="#EF4444"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                }
              />
            </div>

            {/* SECOND ROW: Lab, Prescription, Clinical Visits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <MetricCard
                title="Lab Requests"
                value={stats.lab.total}
                rate={stats.lab.completion_rate}
                rateLabel="Completion"
                color="#8B5CF6"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3h6v2H9zM10 5v6l-4 8h12l-4-8V5"/><circle cx="12" cy="15" r="2"/></svg>
                }
              />
              <MetricCard
                title="Prescriptions"
                value={stats.prescriptions.total}
                rate={stats.prescriptions.fulfillment_rate}
                rateLabel="Fulfillment"
                color="#06B6D4"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5v14"/></svg>
                }
              />
              <MetricCard
                title="Clinical Visits"
                value={stats.clinical_visits}
                subtitle="Patient consultations"
                color="#EC4899"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.8 2.3A.3.3 0 0 0 5 2h14a.3.3 0 0 1 .3.3v19.4a.3.3 0 0 1-.3.3H5a.3.3 0 0 1-.3-.3z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                }
              />
            </div>

            {/* THIRD ROW: Additional Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <MetricCard
                title="Students Referred"
                value={stats.referrals.students_referred}
                subtitle="Unique students"
                color="#14B8A6"
                icon={<UsersIcon />}
              />
              {stats.most_active_clinician && (
                <MetricCard
                  title="Most Active Clinician"
                  value={stats.most_active_clinician.referrals}
                  subtitle={stats.most_active_clinician.name}
                  color="#F59E0B"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  }
                />
              )}
              <MetricCard
                title="Active Users"
                value={stats.active_users}
                subtitle="This period"
                color="#6366F1"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                }
              />
              <Link to="/audit-logs" className="dash-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Logs</h3>
                <h2 style={{ fontSize: '48px', margin: '0', color: '#fff', lineHeight: '1' }}>View</h2>
              </Link>
            </div>

            {/* VISUALIZATIONS SECTION */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {/* Bar Chart - Referrals by Department (60% width) */}
              <div className="dash-card" style={{ flex: '1 1 60%', padding: '24px', borderRadius: '16px', minWidth: '400px' }}>
                <BarChart 
                  title="Referrals by Department"
                  data={stats.department_breakdown.map(dept => ({
                    label: dept.department_name,
                    count: dept.count,
                    color: '#3B82F6'
                  }))}
                />
              </div>

              {/* Donut Chart - Status Distribution (40% width) */}
              <div className="dash-card" style={{ flex: '1 1 40%', padding: '24px', borderRadius: '16px', minWidth: '300px' }}>
                <DonutChart
                  title="Referral Status Distribution"
                  data={stats.status_distribution.map(s => ({
                    label: s.status,
                    value: s.count,
                    color: s.color
                  }))}
                />
              </div>
            </div>

            {/* RECENT REFERRALS TABLE */}
            <div className="dash-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
              <div style={{ padding: '24px 32px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Recent Referred Students</h3>
              </div>
              {referralsLoading ? (
                <p style={{ padding: '0 32px 32px', color: 'var(--text-muted)' }}>Loading recent referrals...</p>
              ) : recentReferrals.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Student</th>
                      <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Department</th>
                      <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '16px 32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReferrals.map((ref) => (
                      <tr key={ref.referral_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '24px 32px' }}>
                          <Link to={`/students/${ref.student_id || 1}`} style={{ color: '#fff', fontWeight: '600', fontSize: '15px', textDecoration: 'none' }} className="hover-underline">
                            {ref.student_name}
                          </Link>
                        </td>
                        <td style={{ padding: '24px 32px', color: 'var(--text-muted)', fontSize: '15px' }}>{ref.receiving_department_name}</td>
                        <td style={{ padding: '24px 32px' }}>
                          <span style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: ref.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : ref.status === 'declined' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: ref.status === 'accepted' ? '#10b981' : ref.status === 'declined' ? '#ef4444' : '#f59e0b',
                          }}>
                            {ref.status}
                          </span>
                        </td>
                        <td style={{ padding: '24px 32px', color: 'var(--text-muted)', fontSize: '15px' }}>
                          {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '24px 32px' }}>
                          <Link to={`/referrals/${ref.referral_id}`} style={{ color: '#0ea5e9', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }} className="hover-underline">
                            View referral
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ padding: '0 32px 32px', color: 'var(--text-muted)' }}>No recent referrals found.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default Report;