import React, { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { changePassword } from "../services/api";

const Profile = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const getRoleLabel = () => {
    if (user?.role === "admin") return "Administrator";
    if (user?.role === "clinician") return "Clinic Clinician";
    if (user?.role === "intake_team") return "Intake Team";
    return user?.role || "User";
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to change password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 style={{ color: "rgba(255,255,255,0.95)", fontSize: "24px", marginBottom: "28px" }}>
        My Profile
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Profile Info Card */}
        <div className="form-card">
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontSize: "18px", marginBottom: "22px" }}>
            Account Information
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>USERNAME</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px", fontWeight: "600" }}>
                {user?.username}
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>FULL NAME</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px" }}>
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : "Not set"}
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>EMAIL</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px" }}>
                {user?.email || "Not set"}
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>ROLE</div>
              <div style={{ color: "#1053ae", fontSize: "16px", fontWeight: "600" }}>
                {getRoleLabel()}
              </div>
            </div>

            {user?.department && (
              <div>
                <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>DEPARTMENT</div>
                <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px" }}>
                  {user.department}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="form-card">
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontSize: "18px", marginBottom: "22px" }}>
            Change Password
          </h2>

          {success && (
            <div style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#22c55e",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
            }}>
              {success}
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handlePasswordChange}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;