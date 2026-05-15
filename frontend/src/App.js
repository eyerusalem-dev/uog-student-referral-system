import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';

import StudentList from './pages/StudentList';
import NewStudent from './pages/NewStudent';
import StudentProfile from './pages/StudentProfile';

import NewVisit from './pages/NewVisit';

import ReferralList from './pages/ReferralList';
import NewReferral from './pages/NewReferral';

import UserList from './pages/UserList';
import DepartmentList from './pages/DepartmentList';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={['admin', 'clinician']}>
                <StudentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'clinician']}>
                <NewStudent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/:universityId"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visits/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'clinician']}>
                <NewVisit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <ReferralList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referrals/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'clinician']}>
                <NewReferral />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DepartmentList />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;