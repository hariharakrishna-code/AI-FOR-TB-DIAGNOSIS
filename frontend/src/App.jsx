import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import PatientList from './pages/dashboard/PatientList';
import AddPatient from './pages/dashboard/AddPatient';
import DiagnosisWizard from './pages/dashboard/DiagnosisWizard';
import ResultsPage from './pages/dashboard/ResultsPage';
import PatientDetails from './pages/dashboard/PatientDetails';
import Reports from './pages/dashboard/Reports';
import Settings from './pages/dashboard/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/new" element={<AddPatient />} />
        <Route path="patients/:id" element={<PatientDetails />} />
        <Route path="diagnose" element={<DiagnosisWizard />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
