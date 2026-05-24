import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudents } from '../services/api';

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

  // Case-insensitive search + Alphabetical sorting by full name
  const filteredAndSortedStudents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return students
      .filter((student) => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        return (
          student.university_id.toLowerCase().includes(term) ||
          fullName.includes(term)
        );
      })
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [students, searchTerm]);

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Students</h1>
        <Link 
          to="/students/new" 
          style={{ 
            padding: '10px 20px', 
            background: '#1053ae', 
            color: 'white', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          + Register New Student
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by ID or Name (case insensitive)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '12px 16px', 
          marginBottom: '20px', 
          borderRadius: '8px', 
          border: '1px solid #ccc',
          fontSize: '15px'
        }}
      />

      {loading ? (
        <p>Loading students...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600' }}>University ID</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600' }}>Student Name</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600' }}>Department</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600' }}>Year</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600' }}>Phone</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStudents.length > 0 ? (
                filteredAndSortedStudents.map((student) => (
                  <tr key={student.university_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{student.university_id}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {student.first_name} {student.last_name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{student.department}</td>
                    <td style={{ padding: '14px 16px' }}>{student.year_of_study}</td>
                    <td style={{ padding: '14px 16px' }}>{student.phone}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Link 
                        to={`/students/${student.university_id}`}
                        style={{ 
                          color: '#1053ae', 
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                      >
                        View Profile →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default StudentList;