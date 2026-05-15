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
    department: '',
    year_of_study: '',
    phone: '',
    emergency_contact: '',
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

    // Prepare data for FormData
    const data = new FormData();
    
    // Only append fields that have values
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    try {
      await createStudent(data);
      navigate('/students');
    } catch (err) {
      // Show the real error from the backend
      if (err.response && err.response.data) {
        setError(err.response.data.detail || err.response.data.non_field_errors || 'Registration failed. Please check your input.');
      } else {
        setError('Failed to register student. Please check your input.');
      }
      console.error('Registration Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1>Register New Student</h1>
      
      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>University ID (e.g., UOG-2021-045)</label>
            <input name="university_id" required onChange={handleChange} placeholder="No slashes allowed" />
          </div>
          
          <div className="form-group">
            <label>First Name</label>
            <input name="first_name" required onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input name="last_name" required onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Academic Department</label>
            <input name="department" required onChange={handleChange} placeholder="e.g. Computer Science" />
          </div>

          <div className="form-group">
            <label>Year of Study</label>
            <input type="number" name="year_of_study" required onChange={handleChange} min="1" max="8" />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input name="phone" required onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Emergency Contact</label>
            <input name="emergency_contact" onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Photo (Optional)</label>
            <input type="file" name="photo" accept="image/*" onChange={handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Register Student'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default NewStudent;