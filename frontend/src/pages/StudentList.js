import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudents } from '../services/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

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

  // Simple client-side search
  const filteredStudents = students.filter((student) =>
    student.university_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Students</h1>
        <Link to="/students/new" style={{ padding: '10px 20px', background: '#1053ae', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
          + Register New Student
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by ID or Name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ccc' }}
      />

      {loading ? (
        <p>Loading students...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', color: '#333', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Department</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Year</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.university_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{student.university_id}</td>
                  <td style={{ padding: '12px' }}>{student.first_name} {student.last_name}</td>
                  <td style={{ padding: '12px' }}>{student.department}</td>
                  <td style={{ padding: '12px' }}>{student.year_of_study}</td>
                  <td style={{ padding: '12px' }}>
                    <Link to={`/students/${student.university_id}`} style={{ color: '#1053ae', fontWeight: 'bold' }}>
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Layout>
  );
};

export default StudentList;