import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages (we will create these next)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentProfile from './pages/StudentProfile';
import NewVisit from './pages/NewVisit';
import NewReferral from './pages/NewReferral';
import ReferralList from './pages/ReferralList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['admin', 'clinician']}>
              <StudentList />
            </ProtectedRoute>
          } />
          
          <Route path="/students/:universityId" element={
            <ProtectedRoute>
              <StudentProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/visits/new" element={
            <ProtectedRoute allowedRoles={['admin', 'clinician']}>
              <NewVisit />
            </ProtectedRoute>
          } />
          
          <Route path="/referrals" element={
            <ProtectedRoute>
              <ReferralList />
            </ProtectedRoute>
          } />
          
          <Route path="/referrals/new" element={
            <ProtectedRoute allowedRoles={['admin', 'clinician']}>
              <NewReferral />
            </ProtectedRoute>
          } />
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;