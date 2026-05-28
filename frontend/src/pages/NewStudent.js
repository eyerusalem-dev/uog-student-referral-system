import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { createStudent } from '../services/api';

const NewStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    university_id: '',
    first_name: '',
    last_name: '',
    gender: '',
    department: '',
    year_of_study: '',
    phone: '',
    emergency_contact: '',
    allergies: '',
    dorm_number: '',
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo') {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare data for FormData (required for file uploads)
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });

    try {
      await createStudent(data);
      navigate('/students');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Failed to register student. Check ID format (no slashes).');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1>Register New Student</h1>
      
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '8px', maxWidth: '800px', color: '#333' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>University ID (e.g., GUR-2024-01)</label>
            <input name="university_id" required onChange={handleChange} placeholder="Format: GUR-YYYY-XX" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name</label>
            <input name="first_name" required onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name</label>
            <input name="last_name" required onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Gender</label>
            <select name="gender" required onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Academic Department</label>
            <input name="department" required onChange={handleChange} placeholder="e.g. Computer Science" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year of Study</label>
            <input type="number" name="year_of_study" required onChange={handleChange} min="1" max="8" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number (e.g., 0912345678)</label>
            <input name="phone" required onChange={handleChange} placeholder="09XXXXXXXX" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Emergency Contact</label>
            <input name="emergency_contact" onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Allergies</label>
            <input name="allergies" onChange={handleChange} placeholder="e.g. Peanuts, Penicillin (Optional)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dorm Number</label>
            <input name="dorm_number" required onChange={handleChange} placeholder="e.g. Block 4, Room 12" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Photo (Optional)</label>
            <input type="file" name="photo" accept="image/*" onChange={handleChange} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#1053ae', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Register Student'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default NewStudent;