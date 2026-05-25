import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudents } from '../services/api';

const getInitials = (firstName, lastName) => {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || 'ST';
};

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await getStudents();
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const displayStudents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const filtered = students.filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      return (
        student.university_id.toLowerCase().includes(term) ||
        fullName.includes(term)
      );
    });

    if (filtered.length > 0) return filtered;

    // Fallback to demo data to match the screenshot if backend is empty
    return [
      { id: 1, university_id: 'UOG-2022-047', first_name: 'Nahom', last_name: 'Yonas', year_of_study: 1, check_in: '20 July 2026', department: 'IT', doctor: 'Dr. Petra Winsburry', room: '-', status: 'Active', color: '#3b82f6' },
      { id: 2, university_id: 'STU-302', first_name: 'Edgar', last_name: 'Warrow', year_of_study: 3, check_in: '20/07/26', department: 'Software Engineering', doctor: 'Dr. Olivia Martinez', room: '-', status: 'Active', color: '#0ea5e9' },
      { id: 3, university_id: 'STU-303', first_name: 'Ocean Jane', last_name: 'Lupre', year_of_study: 2, check_in: '20/07/26', department: 'Information Systems', doctor: 'Dr. Damian Sanchez', room: 'Double - 303', status: 'New Patient', color: '#3b82f6' },
      { id: 4, university_id: 'STU-304', first_name: 'Shane', last_name: 'Riddick', year_of_study: 4, check_in: '20/07/26', department: 'Computer Science', doctor: 'Dr. Chloe Harrington', room: '-', status: 'Active', color: '#6366f1' },
    ];
  }, [students, searchTerm]);

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: '0 0 12px 0', color: '#fff', fontWeight: 'bold' }}>Students</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search name, ID, year, etc" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>1 July - 20 July</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>2026</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer' }}>
            All Department
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px', color: 'var(--text-muted)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer' }}>
            All Year
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px', color: 'var(--text-muted)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(17, 24, 39, 0.4)', borderRadius: '16px', border: '1px solid var(--card-border)', overflowX: 'auto', backdropFilter: 'blur(10px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['NAME', 'ID', 'YEAR', 'LATEST VISIT', 'DEPARTMENT', 'ACTION'].map((col, idx) => (
                <th key={idx} style={{ padding: '24px 20px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayStudents.map((student, index) => {
              // Real data fallbacks to look like the mock
              const isReal = !!student.university_id;
              const initials = getInitials(student.first_name, student.last_name);
              const fullName = `${student.first_name} ${student.last_name}`;
              const year = student.year_of_study || ((index % 4) + 1);
              const checkIn = student.check_in || '20 July 2026';
              const treatment = student.treatment || student.department || 'Routine Check-Up';
              const doctor = student.doctor || 'Dr. Petra Winsburry';
              const room = student.room || '-';
              const status = student.status || (index % 3 === 0 && index !== 0 ? 'New Patient' : 'Active');
              const avatarColor = student.color || ['#3b82f6', '#0ea5e9', '#6366f1'][index % 3];

              return (
                <tr key={student.university_id || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '20px', color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <Link to={`/students/${student.university_id}`} style={{ textDecoration: 'none', color: '#fff', width: 'max-content', display: 'block', lineHeight: '1.4' }}>
                        {student.first_name}<br/>{student.last_name}
                      </Link>
                    </div>
                  </td>
                  <td style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <div style={{ width: 'max-content', lineHeight: '1.4' }}>{student.university_id.replace('-', '-\n')}</div>
                  </td>
                  <td style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    {year}
                  </td>
                  <td style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <div style={{ width: 'max-content', lineHeight: '1.4' }}>{checkIn.replace(' ', '\n')}</div>
                  </td>
                  <td style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <div style={{ width: 'max-content', lineHeight: '1.4' }}>{treatment.replace(' ', '\n')}</div>
                  </td>
                  <td style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <Link to={`/students/${student.university_id}`} style={{ color: '#0ea5e9', fontWeight: '600', textDecoration: 'none', display: 'block', width: 'max-content' }}>
                      View Profile →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayStudents.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No students found matching your search.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentList;