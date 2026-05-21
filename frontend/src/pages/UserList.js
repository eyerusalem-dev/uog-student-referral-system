import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getUsers, createUser, updateUser, deleteUser, getDepartments } from "../services/api";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emptyForm = {
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "clinician",
    department: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (user) => {
    setEditing(user.id);
    setFormData({
      username: user.username,
      password: "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      role: user.role,
      department: user.department || "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleNew = () => {
    setEditing(null);
    setFormData(emptyForm);
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

    const payload = { ...formData };

    if (payload.role !== "department_receiver") {
      payload.department = null;
    }

    if (editing && !payload.password) {
      delete payload.password;
    }

    try {
      if (editing) {
        await updateUser(editing, payload);
        setSuccess("User updated successfully.");
      } else {
        await createUser(payload);
        setSuccess("User created successfully.");
      }

      fetchData();
      setShowForm(false);
      setEditing(null);
      setFormData(emptyForm);
    } catch (err) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Failed to save user.");
      }
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await deleteUser(id);
      setSuccess(`User "${username}" deleted.`);
      fetchData();
    } catch (err) {
      setError("Failed to delete user.");
    }
  };

  const getRoleLabel = (role) => {
    if (role === "admin") return "Administrator";
    if (role === "clinician") return "Clinician";
    if (role === "department_receiver") return "Dept. Receiver";
    return role;
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 style={{ color: "rgba(255,255,255,0.95)", fontSize: "24px" }}>
          User Management
        </h1>
        <button className="btn-primary" onClick={handleNew}>
          + New User
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
            {editing ? "Edit User" : "Create New User"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Username *</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={!!editing}
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label>{editing ? "New Password (leave blank to keep)" : "Password *"}</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editing}
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label>First Name</label>
                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@uog.edu.et"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09..."
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="clinician">Clinician</option>
                  <option value="department_receiver">Department Receiver</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {formData.role === "department_receiver" && (
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editing ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading users...</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>
                    <span className={`badge ${u.role}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td>{u.department_name || "—"}</td>
                  <td>{u.is_active ? "✅" : "❌"}</td>
                  <td>
                    <button
                      className="btn-accept"
                      style={{ fontSize: "12px", padding: "5px 12px" }}
                      onClick={() => handleEdit(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-decline"
                      style={{ fontSize: "12px", padding: "5px 12px", marginLeft: "6px" }}
                      onClick={() => handleDelete(u.id, u.username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default UserList;