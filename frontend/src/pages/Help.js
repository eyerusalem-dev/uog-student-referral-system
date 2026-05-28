import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getFaqs, submitSupportTicket, getSystemStatus } from '../services/api';

// FAQ Data organized by role
const faqData = {
  all: [
    {
      id: 'all-1',
      question: 'How do I reset my password?',
      answer: 'To reset your password, click on "Forgot Password" on the login page. You will receive an email with instructions to create a new password. Alternatively, contact IT support for assistance.',
    },
    {
      id: 'all-2',
      question: 'What browsers are supported?',
      answer: 'The system is optimized for modern browsers: Chrome 90+, Firefox 88+, Edge 90+, and Safari 14+. For the best experience, we recommend using the latest version of Chrome or Edge.',
    },
    {
      id: 'all-3',
      question: 'How do I contact IT support?',
      answer: 'You can reach IT support via email at support@uog.edu.et, call +251-58-220-0375, or use the contact form on this page. Office hours: Monday-Friday, 8:00 AM - 5:00 PM EAT.',
    },
    {
      id: 'all-4',
      question: 'Is my data secure?',
      answer: 'Yes, all data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. The system complies with Ethiopian Health Data Privacy Guidelines and uses role-based access control to ensure data security.',
    },
    {
      id: 'all-5',
      question: 'Can I access the system offline?',
      answer: 'No, the system requires an active internet connection to function. All data is stored securely on our servers and accessed through the web interface.',
    },
  ],
  clinician: [
    {
      id: 'clinician-1',
      question: 'How do I register a new student?',
      answer: 'Navigate to Students > Register New Student. Fill in the required fields: University ID (format: GUR-YYYY-XX), first name, last name, gender, department, year of study, phone number, and dorm number. Click "Register Student" to save.',
    },
    {
      id: 'clinician-2',
      question: 'How do I create a clinical note?',
      answer: 'From a student\'s profile, click "+ New Visit". Fill in symptoms, diagnosis, and treatment fields. The system will automatically record the timestamp and your username as the provider. Click "Save Visit" to complete.',
    },
    {
      id: 'clinician-3',
      question: 'How do I send a referral?',
      answer: 'From a student\'s profile, click "→ Send Referral". Select the receiving department, set urgency level (Routine/Urgent/Critical), and provide a reason. You can attach clinical notes. Click "Submit Referral" to send.',
    },
    {
      id: 'clinician-4',
      question: 'Can I edit a locked clinical note?',
      answer: 'No, clinical notes are automatically locked after 24 hours to maintain data integrity. If you need to make corrections to a locked note, contact an administrator who can unlock it with proper audit trail.',
    },
    {
      id: 'clinician-5',
      question: 'How do I request lab tests?',
      answer: 'Lab requests are created within the clinical note workflow. When creating a new visit, scroll to the "Lab Requests" section and add the required tests. Specify test names and any special instructions.',
    },
  ],
  intake_team: [
    {
      id: 'intake-1',
      question: 'How do I view pending referrals?',
      answer: 'Pending referrals appear in your Dashboard under "Referral Queue". You can also navigate to Referrals and filter by status "Pending". Each referral shows the student name, urgency, and time received.',
    },
    {
      id: 'intake-2',
      question: 'How do I accept/decline a referral?',
      answer: 'Click on the referral to view details. At the bottom, click "Accept Referral" or "Decline Referral". When declining, you must provide a reason in the text box. The referring clinician will be notified of your decision.',
    },
    {
      id: 'intake-3',
      question: 'What does "Urgent" mean?',
      answer: 'Urgency levels indicate priority: Routine (respond within 48 hours), Urgent (respond within 4 hours), Critical (respond immediately). These timeframes are tracked and reported to administration.',
    },
    {
      id: 'intake-4',
      question: 'Can I reassign a referral?',
      answer: 'Direct reassignment is not available. If a referral was sent to the wrong department, decline it with a note explaining the correct department, or contact an administrator to transfer it.',
    },
  ],
  lab_technician: [
    {
      id: 'lab-1',
      question: 'How do I view lab requests?',
      answer: 'Lab requests appear in your Dashboard under "Lab Work Queue". You can also go to Lab Requests page and filter by status. Each request shows the patient, requested tests, and priority.',
    },
    {
      id: 'lab-2',
      question: 'How do I enter lab results?',
      answer: 'Click on a pending lab request. Enter results in the provided fields, following the specified format (e.g., numeric values with units). Mark the status as "Completed" when finished. All changes are logged.',
    },
    {
      id: 'lab-3',
      question: 'Can I edit completed results?',
      answer: 'No, completed lab results cannot be edited to maintain data integrity. If there\'s an error, contact the requesting clinician who can order a new test or note the correction in the patient\'s record.',
    },
  ],
  pharmacist: [
    {
      id: 'pharm-1',
      question: 'How do I view prescriptions?',
      answer: 'Prescriptions appear in your Dashboard under "Pharmacy Queue". You can also navigate to Prescriptions page. Each shows the patient, medications prescribed, and prescribing clinician.',
    },
    {
      id: 'pharm-2',
      question: 'How do I mark as dispensed?',
      answer: 'Open the prescription, review the medications, then change the status dropdown to "Dispensed". No additional notes are required. The system will record the dispensing timestamp and your username.',
    },
    {
      id: 'pharm-3',
      question: 'What if medication is out of stock?',
      answer: 'Change the status to "Out of Stock" and optionally add a note with the expected restock date. The prescribing clinician and patient will be notified automatically.',
    },
  ],
  administrator: [
    {
      id: 'admin-1',
      question: 'How do I add new users?',
      answer: 'Go to User Management page and click "+ Add New User". Fill in username, password, name, email, phone, role, and department (if applicable). Click "Save User" to create the account.',
    },
    {
      id: 'admin-2',
      question: 'How do I view audit logs?',
      answer: 'Navigate to Audit Logs page. Use the filters to search by user, action, date range, or affected resource. You can export logs to CSV for external analysis.',
    },
    {
      id: 'admin-3',
      question: 'How do I unlock a clinical note?',
      answer: 'Go to the student\'s profile, find the locked visit, and click the unlock icon (if available). You\'ll be prompted to provide a reason. This action is logged in the audit trail.',
    },
    {
      id: 'admin-4',
      question: 'How do I generate reports?',
      answer: 'Go to Reports page. Select the report type (Dashboard Stats, Referrals, Visits, etc.), set date ranges and filters, then click "Generate". Reports can be viewed on-screen or exported to CSV/PDF.',
    },
  ],
};

const roleLabels = {
  all: 'All Users',
  clinician: 'Clinician',
  intake_team: 'Intake Team',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  administrator: 'Administrator',
};

const priorityColors = {
  Low: '#10b981',
  Medium: '#3b82f6',
  High: '#f59e0b',
  Urgent: '#ef4444',
};

// Search Icon Component
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// Chevron Icon Component
const ChevronIcon = ({ isOpen }) => (
  <svg 
    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#3b82f6';

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: bgColor,
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideIn 0.3s ease',
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
    </div>
  );
};

const Help = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [faqs, setFaqs] = useState({ all: [] });
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('operational');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [charCount, setCharCount] = useState(0);
  
  const [formData, setFormData] = useState({
    name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : '',
    email: user?.email || '',
    subject: '',
    message: '',
    priority: 'Medium',
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Load FAQs on mount
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        // Try to fetch from API first
        const response = await getFaqs();
        setFaqs(response.data);
      } catch (error) {
        // Use local data if API fails
        setFaqs(faqData);
      } finally {
        setLoading(false);
      }
    };
    loadFaqs();
    
    // Load system status
    getSystemStatus().then(res => {
      setSystemStatus(res.data?.status || 'operational');
    }).catch(() => {
      setSystemStatus('operational');
    });

    // Log page view
    console.log(`[AUDIT] Help & Support accessed by ${user?.username} (${user?.role}) at ${new Date().toISOString()}`);
  }, [user]);

  // Load saved role preference
  useEffect(() => {
    const savedRole = localStorage.getItem('helpSelectedRole');
    if (savedRole && roleLabels[savedRole]) {
      setSelectedRole(savedRole);
    }
    // Highlight user's role tab
    if (user?.role && roleLabels[user.role]) {
      setSelectedRole(user.role);
    }
  }, [user]);

// Filter FAQs based on role and search
   const filteredFaqs = useMemo(() => {
     const faqsObj = typeof faqs === 'object' && faqs !== null ? faqs : {};
     
     let faqsForRole = selectedRole === 'all' 
       ? [...(faqsObj.all || [])] 
       : selectedRole === 'clinician'
       ? [...(faqsObj.all || []), ...(faqsObj.clinician || [])]
       : selectedRole === 'intake_team'
       ? [...(faqsObj.all || []), ...(faqsObj.intake_team || [])]
       : selectedRole === 'lab_technician'
       ? [...(faqsObj.all || []), ...(faqsObj.lab_technician || [])]
       : selectedRole === 'pharmacist'
       ? [...(faqsObj.all || []), ...(faqsObj.pharmacist || [])]
       : selectedRole === 'administrator'
       ? [...(faqsObj.all || []), ...(faqsObj.administrator || [])]
       : [...(faqsObj.all || [])];

     if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      faqsForRole = faqsForRole.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
    }

    return faqsForRole;
  }, [faqs, selectedRole, searchQuery]);

  // Handle role tab change
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    localStorage.setItem('helpSelectedRole', role);
    setExpandedFaqId(null);
  };

  // Handle FAQ expand/collapse
  const handleFaqToggle = (id) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  // Highlight matching text
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} style={{ background: '#fef08a', padding: '0 2px', borderRadius: '2px' }}>{part}</mark>
        : part
    );
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'message') {
      setCharCount(value.length);
    }
    
    // Clear error when field is modified
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.subject) errors.subject = 'Please select a subject';
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.length < 50) {
      errors.message = 'Message must be at least 50 characters';
    } else if (formData.message.length > 500) {
      errors.message = 'Message must not exceed 500 characters';
    }
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitSupportTicket(formData);
      const ticketNum = response.data?.ticket_number || `TICKET-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setTicketNumber(ticketNum);
      setToast({ message: `Ticket submitted successfully! Your ticket number is ${ticketNum}`, type: 'success' });
      setFormData({
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : '',
        email: user?.email || '',
        subject: '',
        message: '',
        priority: 'Medium',
      });
      setCharCount(0);
    } catch (error) {
      if (error.response?.status === 429) {
        setToast({ message: 'Too many requests. Please wait 5 minutes before submitting again.', type: 'error' });
      } else {
        setToast({ message: 'Failed to submit ticket. Please try again or contact IT support directly.', type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render skeleton loader
  const renderSkeleton = () => (
    <div style={{ animation: 'pulse 1.5s infinite' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: '#e2e8f0', height: '80px', borderRadius: '8px', marginBottom: '12px' }}></div>
      ))}
    </div>
  );

  return (
    <Layout>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .faq-item:hover { background: rgba(59, 130, 246, 0.05); }
        .tab-item { cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .tab-item:hover { color: #3b82f6; }
        .tab-item.active { color: #3b82f6; font-weight: 600; border-bottom: 2px solid #3b82f6; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        @media (max-width: 768px) {
          .help-layout { flex-direction: column !important; }
          .help-sidebar { width: 100% !important; position: static !important; }
          .help-main { width: 100% !important; }
          .tab-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '32px', marginBottom: '32px', border: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>Help & Support Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: '0 0 24px 0' }}>Find answers to common questions or contact IT support</p>
          
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 16px 16px 48px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '16px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="help-layout" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Left Column - FAQs and Contact Form */}
        <div className="help-main" style={{ flex: '1', minWidth: '0' }}>
          
          {/* Role Tabs */}
          <div className="tab-scroll" style={{ display: 'flex', gap: '8px', marginBottom: '24px', paddingBottom: '8px' }}>
            {Object.entries(roleLabels).map(([key, label]) => (
              <button
                key={key}
                className={`tab-item ${selectedRole === key ? 'active' : ''}`}
                onClick={() => handleRoleChange(key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: selectedRole === key ? '#3b82f6' : 'var(--text-muted)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: selectedRole === key ? '600' : '400',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                Frequently Asked Questions
                {searchQuery && <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '14px' }}> ({filteredFaqs.length} results)</span>}
              </h2>
            </div>
            
            <div>
              {loading ? renderSkeleton() : filteredFaqs.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No results found</p>
                  <p style={{ fontSize: '14px', margin: 0 }}>Try different keywords or contact IT support</p>
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <div 
                    key={faq.id} 
                    className="faq-item"
                    style={{
                      borderBottom: '1px solid var(--card-border)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <button
                      onClick={() => handleFaqToggle(faq.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 24px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: '500',
                      }}
                      aria-expanded={expandedFaqId === faq.id}
                    >
                      <span>{highlightText(faq.question, searchQuery)}</span>
                      <ChevronIcon isOpen={expandedFaqId === faq.id} />
                    </button>
                    {expandedFaqId === faq.id && (
                      <div style={{ padding: '0 24px 20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', animation: 'slideIn 0.3s ease' }}>
                        {highlightText(faq.answer, searchQuery)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Support Form */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0' }}>Contact Support</h2>
            
            {ticketNumber && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ color: '#10b981', margin: 0, fontSize: '14px' }}>
                  <strong>✓ Ticket Submitted!</strong> Your ticket number is: <strong>{ticketNumber}</strong>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                  />
                  {formErrors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{formErrors.name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                  />
                  {formErrors.email && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{formErrors.email}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Subject *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                  >
                    <option value="">Select a subject</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Account Access">Account Access</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.subject && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{formErrors.subject}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Message * (50-500 characters)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  maxLength={500}
                  placeholder="Describe your issue or request in detail..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: '#fff', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ color: charCount < 50 ? '#f59e0b' : charCount > 450 ? '#ef4444' : 'var(--text-muted)', fontSize: '12px' }}>
                    {charCount}/500 characters
                  </span>
                  {formErrors.message && <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.message}</span>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? '#1e40af' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                    Submitting...
                  </>
                ) : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="help-sidebar" style={{ width: '320px', position: 'sticky', top: '24px' }}>
          
          {/* Quick Links */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>Quick Links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="#tutorials" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Video Tutorials
              </a>
              <a href="#manual" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                User Manual PDF
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                <span>System Status: </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: systemStatus === 'operational' ? '#10b981' : '#ef4444', display: 'inline-block' }}></span>
                  <span style={{ color: systemStatus === 'operational' ? '#10b981' : '#ef4444' }}>
                    {systemStatus === 'operational' ? 'All systems operational' : 'Issues reported'}
                  </span>
                </span>
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', padding: 0 }}
                onClick={() => alert('Keyboard shortcuts modal would open here')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6" y2="8"></line><line x1="10" y1="8" x2="10" y2="8"></line><line x1="14" y1="8" x2="14" y2="8"></line><line x1="18" y1="8" x2="18" y2="8"></line><line x1="6" y1="12" x2="6" y2="12"></line><line x1="10" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="14" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="18" y2="16"></line></svg>
                Keyboard Shortcuts
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>Contact Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</p>
                <a href="mailto:support@uog.edu.et" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>support@uog.edu.et</a>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</p>
                <a href="tel:+251582200375" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>+251-58-220-0375</a>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Office Hours</p>
                <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>Mon-Fri: 8:00 AM - 5:00 PM EAT</p>
              </div>
            </div>
          </div>

          {/* Live Chat Button */}
          <button
            style={{
              width: '100%',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = '#059669'}
            onMouseLeave={(e) => e.target.style.background = '#10b981'}
            onClick={() => alert('Live chat would open here')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Start Live Chat
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Help;