import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudents, createVisit } from '../services/api';

const NewVisit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedStudent = searchParams.get('student');

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    student: preselectedStudent || '',
    symptoms: '',
    diagnosis: '',
    advice: '',
    treatment: '',
    note: '',
    lab_used: false,
    lab_note: '',
    pharmacy_used: false,
    medication_given: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await getStudents();
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Could not load students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validateForm = () => {
    if (!formData.student) {
      return 'Please select a student.';
    }

    if (!formData.symptoms.trim()) {
      return 'Symptoms are required.';
    }

    if (formData.lab_used && !formData.lab_note.trim()) {
      return 'Lab note is required when lab is used.';
    }

    if (formData.pharmacy_used && !formData.medication_given.trim()) {
      return 'Medication given is required when pharmacy is used.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await createVisit(formData);
      navigate(`/students/${formData.student}`);
    } catch (err) {
      console.error('Visit creation failed:', err);

      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Failed to create visit.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <h1>New Clinical Visit</h1>
      <p className="muted">
        Record the student’s clinic visit, including lab and pharmacy usage.
      </p>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Student</label>

            {loadingStudents ? (
              <p>Loading students...</p>
            ) : (
              <select
                name="student"
                value={formData.student}
                onChange={handleChange}
                required
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option
                    key={student.university_id}
                    value={student.university_id}
                  >
                    {student.university_id} - {student.first_name}{' '}
                    {student.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group full-width">
            <label>Symptoms *</label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              required
              placeholder="Example: headache, fever, fatigue"
            />
          </div>

          <div className="form-group">
            <label>Diagnosis</label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Example: suspected viral infection"
            />
          </div>

          <div className="form-group">
            <label>Treatment</label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              placeholder="Example: Paracetamol 500mg"
            />
          </div>

          <div className="form-group">
            <label>Advice</label>
            <textarea
              name="advice"
              value={formData.advice}
              onChange={handleChange}
              placeholder="Example: rest and drink fluids"
            />
          </div>

          <div className="form-group">
            <label>General Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Additional clinician note"
            />
          </div>
        </div>

        <hr className="section-divider" />

        <div className="form-grid">
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="lab_used"
                checked={formData.lab_used}
                onChange={handleChange}
              />
              Lab used during this visit
            </label>
          </div>

          {formData.lab_used && (
            <div className="form-group full-width">
              <label>Lab Note *</label>
              <textarea
                name="lab_note"
                value={formData.lab_note}
                onChange={handleChange}
                placeholder="Example: CBC and malaria smear requested"
              />
            </div>
          )}

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="pharmacy_used"
                checked={formData.pharmacy_used}
                onChange={handleChange}
              />
              Pharmacy used during this visit
            </label>
          </div>

          {formData.pharmacy_used && (
            <div className="form-group full-width">
              <label>Medication Given *</label>
              <textarea
                name="medication_given"
                value={formData.medication_given}
                onChange={handleChange}
                placeholder="Example: Paracetamol 500mg, 20 tablets"
              />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving Visit...' : 'Save Visit'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default NewVisit;