import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../services/api";

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emptyForm = {
    name: "",
    building_location: "",
    description: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNew = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleEdit = (dept) => {
    setEditing(dept.id);
    setFormData({
      name: dept.name,
      building_location: dept.building_location || "",
      description: dept.description || "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editing) {
        await updateDepartment(editing, formData);
        setSuccess("Department updated successfully.");
      } else {
        await createDepartment(formData);
        setSuccess("Department created successfully.");
      }

      fetchDepartments();
      setShowForm(false);
      setEditing(null);
      setFormData(emptyForm);
    } catch (err) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Failed to save department.");
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;

    try {
      await deleteDepartment(id);
      setSuccess(`Department "${name}" deleted.`);
      fetchDepartments();
    } catch (err) {
      setError("Cannot delete. Department may have active referrals.");
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 style={{ color: "rgba(255,255,255,0.95)", fontSize: "24px" }}>
          Department Management
        </h1>
        <button className="btn-primary" onClick={handleNew}>
          + New Department
        </button>
      </div>

      {success && (
        <div style={{
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.25)",
          color: "#22c55e",
          padding: "12px 16px",
          borderRadius: "10px",
          marginBottom: "20px",
          fontSize: "14px",
        }}>
          {success}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {showForm && (
        <div className="form-card" style={{ marginBottom: "24px" }}>
          <h2 style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: "18px",
            marginBottom: "20px",
          }}>
            {editing ? "Edit Department" : "Create New Department"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ophthalmology"
                />
              </div>

              <div className="form-group">
                <label>Building Location</label>
                <input
                  name="building_location"
                  value={formData.building_location}
                  onChange={handleChange}
                  placeholder="e.g. Main Block A"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of this department..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editing ? "Update" : "Create Department"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading departments...</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Building</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length > 0 ? (
                departments.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: "600" }}>{d.name}</td>
                    <td>{d.building_location || "—"}</td>
                    <td>{d.description || "—"}</td>
                    <td>
                      <button
                        className="btn-accept"
                        style={{ fontSize: "12px", padding: "5px 12px" }}
                        onClick={() => handleEdit(d)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-decline"
                        style={{ fontSize: "12px", padding: "5px 12px", marginLeft: "6px" }}
                        onClick={() => handleDelete(d.id, d.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No departments yet.
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

export default DepartmentList;