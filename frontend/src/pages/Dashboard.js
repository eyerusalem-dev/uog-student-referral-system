import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getEnhancedDashboardStats, getReferrals, updateReferral, getVisits, getDepartments } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import { ReportIcon, UsersIcon } from '../components/Icons';
import { saveAs } from 'file-saver';

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
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

// Simple Bar Chart Component
const BarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((item, idx) => (
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
        ))}
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

const Dashboard = () => {
  const { user } = useAuth();
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
    } else {
      setLoading(false);
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

  // Clinician State
  const [todaysConsultations, setTodaysConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(true);

  const isToday = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    return d.getUTCFullYear() === today.getUTCFullYear()
      && d.getUTCMonth() === today.getUTCMonth()
      && d.getUTCDate() === today.getUTCDate();
  };

  useEffect(() => {
    if (user?.role === 'clinician' || user?.role === 'admin') {
      const fetchConsultations = async () => {
        try {
          const [visitRes, referralRes] = await Promise.all([
            getVisits({}),
            getReferrals({})
          ]);
          const visits = visitRes.data.filter(v => v.clinician_username === user.username && isToday(v.created_at));
          const referrals = referralRes.data.filter(r => r.referred_by_username === user.username && isToday(r.created_at));
          const combined = [];
          visits.forEach(v => {
            combined.push({
              type: 'Note',
              studentName: v.student_name,
              studentId: v.student_university_id,
              time: new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              id: v.id
            });
          });
          referrals.forEach(r => {
            combined.push({
              type: 'Referral',
              studentName: r.student_name,
              studentId: r.student_university_id,
              time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              id: r.referral_id
            });
          });
          combined.sort((a, b) => new Date(b.time) - new Date(a.time));
          setTodaysConsultations(combined);
        } catch (e) {
          console.error('Failed to load consultations', e);
        } finally {
          setConsultationsLoading(false);
        }
      };
      fetchConsultations();
    }
  }, [user]);

  const [clinicianSearch, setClinicianSearch] = useState('');
  const [clinicianFilter, setClinicianFilter] = useState('All');

  const mockClinicianPatients = [];

  const filteredClinicianPatients = mockClinicianPatients.filter(pt => {
    const matchesSearch = pt.name.toLowerCase().includes(clinicianSearch.toLowerCase()) || 
                          pt.cc.toLowerCase().includes(clinicianSearch.toLowerCase()) || 
                          pt.dx.toLowerCase().includes(clinicianSearch.toLowerCase()) ||
                          pt.id.toLowerCase().includes(clinicianSearch.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (clinicianFilter === 'All') return true;
    if (clinicianFilter === 'Lab process') return pt.status === 'Waiting for lab';
    if (clinicianFilter === 'Pending referrals') return pt.refStatus === 'Pending';
    return true;
  });

  // Lab Technician State
  const [labFilter, setLabFilter] = useState('All');
  const [labSearch, setLabSearch] = useState('');

  const mockLabRequests = [];

  const filteredLabRequests = mockLabRequests.filter(req => {
    if (labFilter !== 'All') {
      if (labFilter === 'Urgent' && req.priority !== 'Urgent') return false;
      if (labFilter === 'Routine' && req.priority !== 'Routine') return false;
      if (labFilter === 'Pending' && !req.status.includes('Pending')) return false;
      if (labFilter === 'Result updated' && req.status !== 'Result updated') return false;
    }
    if (labSearch) {
      const q = labSearch.toLowerCase();
      return req.name.toLowerCase().includes(q) || req.test.toLowerCase().includes(q) || req.specimen.toLowerCase().includes(q) || req.id.toLowerCase().includes(q);
    }
    return true;
  });

  // Pharmacy State
  const [pharmacyFilter, setPharmacyFilter] = useState('All');
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacyRequests, setPharmacyRequests] = useState([]);

  const filteredPharmacyRequests = pharmacyRequests.filter(req => {
    if (pharmacyFilter !== 'All') {
      if (req.status !== pharmacyFilter) return false;
    }
    if (pharmacySearch) {
      const q = pharmacySearch.toLowerCase();
      return req.name.toLowerCase().includes(q) || req.med.toLowerCase().includes(q) || req.studentId.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePharmacyAction = (id, newStatus) => {
    setPharmacyRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  // Intake Team State
  const [intakeFilter, setIntakeFilter] = useState('All');
  const [intakeSearch, setIntakeSearch] = useState('');
  const [intakeReferrals, setIntakeReferrals] = useState([]);
  const [intakeLoading, setIntakeLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchIntakeReferrals = async () => {
    if (user?.role === 'intake_team') {
      try {
        const res = await getReferrals();
        setIntakeReferrals(res.data);
      } catch (err) {
        console.error('Failed to load referrals', err);
      } finally {
        setIntakeLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchIntakeReferrals();
    const intervalId = setInterval(fetchIntakeReferrals, 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  const filteredIntakeReferrals = intakeReferrals.filter(ref => {
    const q = intakeSearch.toLowerCase();
    const matchesSearch = 
      (ref.student_name && ref.student_name.toLowerCase().includes(q)) ||
      (ref.student_university_id && ref.student_university_id.toLowerCase().includes(q)) ||
      (ref.referral_id && ref.referral_id.toLowerCase().includes(q));
      
    if (!matchesSearch) return false;
    if (intakeFilter === 'All') return true;
    if (intakeFilter === 'Pending') return ref.status === 'pending';
    if (intakeFilter === 'Accepted') return ref.status === 'accepted';
    if (intakeFilter === 'Declined') return ref.status === 'declined';
    return true;
  });

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateReferral(id, { status });
      alert(`Referral ${status} successfully!`);
      setShowModal(false);
      fetchIntakeReferrals();
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    }
  };

  // Calendar state
  const [calendarDate] = useState(new Date());
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const days = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // To simulate the screenshot exactly
  const displayStats = stats || { referrals_this_month: 3, new_staff_this_month: 10, total_referrals: 3, pending_referrals: 2 };

  return (
    <Layout>
      {user?.role !== 'pharmacist' && user?.role !== 'lab_technician' && user?.role !== 'clinician' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#fff' }}>
              {user?.role === 'admin' ? 'Admin Dashboard' : `Hi, ${user?.username || 'User'}`}
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>
              Welcome back, {user?.username || 'admin'} • {user?.role === 'intake_team' ? 'Intake Team' : user?.role || 'admin'}
            </p>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', background: 'var(--card-bg)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            {formattedEAT}
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div ref={printRef}>
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
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard data...</div>
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
      )}

      {/* Clinician Dashboard */}
      {user?.role === 'clinician' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '12px' }}>Today's Consultations</h3>
            {consultationsLoading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : todaysConsultations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No consultations today</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {todaysConsultations.map((c, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span style={{ color: '#f8fafc', fontWeight: '600' }}>{c.studentName}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>ID: {c.studentId}</span>
                      <span style={{ color: '#10b981', marginLeft: '8px' }}>{c.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{c.time}</span>
                      <Link to={`/students/${c.studentId}`} style={{ color: '#0ea5e9', fontWeight: '600', textDecoration: 'none' }}>View</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '22px', color: '#fff', margin: 0, fontWeight: 'bold' }}>Today's Consultations</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{formattedEAT}</div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => setClinicianFilter('All')} style={{ padding: '8px 20px', background: clinicianFilter === 'All' ? '#10b981' : 'var(--card-bg)', color: clinicianFilter === 'All' ? '#fff' : 'var(--text-muted)', border: clinicianFilter === 'All' ? 'none' : '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', fontWeight: clinicianFilter === 'All' ? '600' : '500', cursor: 'pointer' }}>All</button>
                <button onClick={() => setClinicianFilter('Lab process')} style={{ padding: '8px 20px', background: clinicianFilter === 'Lab process' ? '#10b981' : 'var(--card-bg)', color: clinicianFilter === 'Lab process' ? '#fff' : 'var(--text-muted)', border: clinicianFilter === 'Lab process' ? 'none' : '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', fontWeight: clinicianFilter === 'Lab process' ? '600' : '500', cursor: 'pointer' }}>Lab process</button>
                <button onClick={() => setClinicianFilter('Pending referrals')} style={{ padding: '8px 20px', background: clinicianFilter === 'Pending referrals' ? '#10b981' : 'var(--card-bg)', color: clinicianFilter === 'Pending referrals' ? '#fff' : 'var(--text-muted)', border: clinicianFilter === 'Pending referrals' ? 'none' : '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', fontWeight: clinicianFilter === 'Pending referrals' ? '600' : '500', cursor: 'pointer' }}>Pending referrals</button>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0 16px', width: '300px' }}>
                  <input type="text" value={clinicianSearch} onChange={(e) => setClinicianSearch(e.target.value)} placeholder="Search a name, complaint, diagnosis..." style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '14px', width: '100%', outline: 'none', padding: '10px 0' }} />
                  <SearchIcon style={{ color: 'var(--text-muted)', width: '18px', height: '18px', marginLeft: '8px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {filteredClinicianPatients.map((pt, i) => (
                <div key={i} className="dash-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: pt.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                      {pt.initials}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#fff', fontWeight: '600' }}>{pt.name}</h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{pt.id}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: `${pt.sColor}15`, color: pt.sColor, fontSize: '12px', fontWeight: '600', alignSelf: 'flex-start', marginBottom: '24px', border: `1px solid ${pt.sColor}30` }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pt.sColor }}></div>
                    {pt.status}
                  </div>

                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Referral Status</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: pt.refStatus === 'Accepted' ? '#10b981' : '#f59e0b', fontWeight: '500' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pt.refStatus === 'Accepted' ? '#10b981' : '#f59e0b' }}></div>
                        {pt.refStatus}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Last Visit</div>
                      <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500' }}>{pt.visit}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Chief Complaint</div>
                    <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.4' }}>{pt.cc}</div>
                  </div>

                  <div style={{ marginBottom: '24px', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Diagnosis</div>
                    <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '13px', color: '#cbd5e1' }}>{pt.dx}</div>
                  </div>

                  <div style={{ display: 'flex', marginTop: 'auto' }}>
                    <Link to="/referrals" style={{ flex: 1, padding: '10px', background: 'var(--primary-blue)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', textDecoration: 'none', textAlign: 'center', display: 'inline-block' }} className="hover-bg-light">View Chart</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card" style={{ padding: '24px', borderRadius: '16px', position: 'sticky', top: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#fff', fontWeight: '700' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link to="/referrals/new" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>+</div>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>New Visit</span>
              </Link>
              <Link to="/students/new" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UsersIcon style={{ width: '20px', height: '20px' }} />
                </div>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Register a student</span>
              </Link>
              <Link to="/students" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SearchIcon style={{ width: '20px', height: '20px' }} />
                </div>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Students</span>
              </Link>
              <Link to="/referrals/new" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover-card">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </div>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Refer Out</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Intake Team Dashboard */}
      {user?.role === 'intake_team' && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
            {['All', 'Pending', 'Accepted', 'Declined'].map(f => (
              <button 
                key={f} 
                onClick={() => setIntakeFilter(f)} 
                style={{ 
                  background: intakeFilter === f ? '#3b82f6' : 'rgba(255,255,255,0.05)', 
                  color: intakeFilter === f ? '#fff' : '#e2e8f0', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {f}
              </button>
            ))}
            <button 
              onClick={fetchIntakeReferrals} 
              style={{ background: 'transparent', color: '#10b981', border: '1px solid #10b981', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginLeft: 'auto' }}
            >
              Refresh
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-muted)', marginBottom: '32px', width: '100%', maxWidth: '400px' }}>
            <input 
              type="text" 
              placeholder="Search name, ID, tracking ID..." 
              value={intakeSearch} 
              onChange={(e) => setIntakeSearch(e.target.value)} 
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '15px' }} 
            />
            <SearchIcon style={{ color: 'var(--text-muted)', width: '18px', height: '18px', marginLeft: '8px' }} />
          </div>

          {intakeLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading referrals...</p>
          ) : filteredIntakeReferrals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📭</div>
              No pending referrals found matching your criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
              {filteredIntakeReferrals.map((ref) => {
                const initials = ref.student_name ? ref.student_name.split(' ').map(n => n[0]).join('') : '?';
                const borderColor = ref.urgency === 'Critical' ? 'rgba(239, 68, 68, 0.5)' : ref.urgency === 'Urgent' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255,255,255,0.1)';
                
                return (
                  <div 
                    key={ref.referral_id} 
                    className="dash-card" 
                    onClick={() => { setSelectedReferral(ref); setShowModal(true); }}
                    style={{ padding: '24px', position: 'relative', border: `1px solid ${borderColor}`, borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
                  >
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                        {initials}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>{ref.student_name}</h3>
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{ref.student_university_id}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(ref.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px', height: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ref.reason}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{ref.status.toUpperCase()}</span>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: borderColor, color: '#fff' }}>{ref.urgency}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {ref.referral_id}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showModal && selectedReferral && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ background: '#1e293b', width: '100%', maxWidth: '700px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div ref={printRef} style={{ padding: '32px', overflowY: 'auto', background: '#fff', color: '#000' }}>
              <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>University of Gondar Referral Hospital</h2>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>Clinical Referral Transfer</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>{selectedReferral.referral_id}</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>{new Date(selectedReferral.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px' }}>Patient Details</h4>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{selectedReferral.student_name}</p>
                  <p style={{ margin: '0' }}>ID: {selectedReferral.student_university_id}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px' }}>Referral Details</h4>
                  <p style={{ margin: '0 0 4px 0' }}><strong>To:</strong> {selectedReferral.receiving_department_name}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Urgency:</strong> {selectedReferral.urgency}</p>
                  <p style={{ margin: '0' }}><strong>By:</strong> {selectedReferral.referred_by_username}</p>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px' }}>Chief Complaint / Reason</h4>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedReferral.reason}
                </div>
              </div>

              {selectedReferral.clinical_visit_details && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px' }}>Attached Clinical Notes</h4>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <p style={{ margin: '0 0 8px' }}><strong>Symptoms:</strong> {selectedReferral.clinical_visit_details.symptoms}</p>
                    <p style={{ margin: '0 0 8px' }}><strong>Diagnosis:</strong> {selectedReferral.clinical_visit_details.diagnosis}</p>
                    <p style={{ margin: '0' }}><strong>Treatment:</strong> {selectedReferral.clinical_visit_details.treatment}</p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', background: '#0f172a', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
              <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Print PDF</button>
              
              {user?.role === 'intake_team' && selectedReferral.status === 'pending' && (
                <>
                  <button onClick={() => handleUpdateStatus(selectedReferral.referral_id, 'declined')} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Decline</button>
                  <button onClick={() => handleUpdateStatus(selectedReferral.referral_id, 'accepted')} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Accept</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pharmacist Dashboard */}
      {user?.role === 'pharmacist' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', fontSize: '24px', margin: 0, fontWeight: 'bold' }}>Recent Prescriptions</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{formattedEAT}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Pending Review', 'Dispensed', 'Out of Stock'].map(f => (
                <button key={f} onClick={() => setPharmacyFilter(f)} style={{ background: pharmacyFilter === f ? '#10b981' : (f === 'All' ? 'transparent' : 'rgba(255,255,255,0.03)'), color: pharmacyFilter === f ? '#fff' : 'var(--text-muted)', border: f === 'All' && pharmacyFilter !== 'All' ? '1px solid rgba(255,255,255,0.05)' : (pharmacyFilter === f ? 'none' : '1px solid rgba(255,255,255,0.05)'), padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{f}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <FilterIcon />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <input type="text" placeholder="Search a name, medication, or etc" value={pharmacySearch} onChange={(e) => setPharmacySearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '250px', fontSize: '14px' }} />
                <SearchIcon />
              </div>
            </div>
          </div>
          <div className="dash-card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ minWidth: '800px' }}>
              {filteredPharmacyRequests.length > 0 ? filteredPharmacyRequests.map((row, i) => (
                <div key={row.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(200px, 3fr) minmax(150px, 2fr) minmax(100px, 1.5fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(120px, 1fr)',
                  alignItems: 'center', 
                  padding: '20px 24px', 
                  borderBottom: i === filteredPharmacyRequests.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '14px' }}>{row.med}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Patient: {row.name}</div>
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                      {row.dosage}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <div>ID: {row.studentId.split('/')[1] || row.studentId}</div>
                    <div>Year: {row.studentId.split('/')[2] || '17'}</div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    Date: {row.date1} {row.date2}
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', background: row.status === 'Pending Review' ? 'rgba(56, 189, 248, 0.1)' : row.status === 'Dispensed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: row.status === 'Pending Review' ? '#38bdf8' : row.status === 'Dispensed' ? '#10b981' : '#ef4444', padding: '4px 16px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' }}>
                      {row.status === 'Pending Review' ? 'Upcoming' : row.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <button onClick={() => handlePharmacyAction(row.id, 'Dispensed')} style={{ background: 'transparent', color: row.status === 'Dispensed' ? '#10b981' : '#38bdf8', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                      {row.status === 'Dispensed' ? 'Dispensed' : 'Dispense'}
                    </button>
                    {row.status !== 'Dispensed' && (
                      <button onClick={() => handlePharmacyAction(row.id, 'Out of Stock')} style={{ background: 'transparent', color: row.status === 'Out of Stock' ? '#ef4444' : 'var(--text-muted)', border: 'none', fontWeight: '500', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                        {row.status === 'Out of Stock' ? 'Out of Stock' : 'Mark out of stock'}
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No prescriptions found matching your filters.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lab Technician Dashboard */}
      {user?.role === 'lab_technician' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 8px 0', fontWeight: 'bold' }}>Lab Work Queue</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>Review incoming test requests and move samples through the workflow.</p>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '15px', paddingTop: '4px' }}>{formattedEAT}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {['All', 'Pending', 'Result updated', 'Urgent', 'Routine'].map(f => (
                <button key={f} onClick={() => setLabFilter(f)} style={{ background: labFilter === f ? '#0ea5e9' : 'rgba(255,255,255,0.03)', color: labFilter === f ? '#fff' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{f}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <FilterIcon />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <input type="text" placeholder="Search a name, test, specimen, or etc" value={labSearch} onChange={(e) => setLabSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '280px', fontSize: '14px' }} />
                <SearchIcon />
              </div>
            </div>
          </div>
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Patient</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Test</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Specimen</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Requested</th>
                  <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredLabRequests.length > 0 ? filteredLabRequests.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '24px' }}>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{row.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '2px' }}>{row.id}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{row.sub}</div>
                    </td>
                    <td style={{ padding: '24px', color: '#0ea5e9', fontWeight: '600', fontSize: '15px' }}>{row.test}</td>
                    <td style={{ padding: '24px', color: '#e2e8f0', fontSize: '14px' }}>{row.specimen}</td>
                    <td style={{ padding: '24px' }}>
                      <span style={{ border: `1px solid ${row.priorityColor}50`, color: row.priorityColor, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{row.priority}</span>
                    </td>
                    <td style={{ padding: '24px', color: row.statusColor, fontWeight: '600', fontSize: '14px' }}>{row.status}</td>
                    <td style={{ padding: '24px', color: '#e2e8f0', fontSize: '14px' }}>
                      <div style={{ marginBottom: '2px' }}>{row.date1}</div>
                      <div>{row.date2}</div>
                    </td>
                    <td style={{ padding: '24px' }}>
                      <Link to={`/students/${row.student_id}`} style={{ background: 'rgba(255,255,255,0.05)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', lineHeight: '1.4', textDecoration: 'none', display: 'inline-block' }}>View<br/>Order</Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No requests found matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;