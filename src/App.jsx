import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Patients from './pages/Patients';
import Medications from './pages/Medications';
import Prescriptions from './pages/Prescriptions.jsx';
import HealthDiary from './pages/HealthDiary';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Share from './pages/Share';

import Landing from './pages/Landing';
import AdminSponsors from './pages/AdminSponsors';
import AdminSecurity from './pages/AdminSecurity';

import NotificationManager from './components/NotificationManager';
import { ThemeProvider } from './context/ThemeContext';

import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect } from 'react';

function App() {
  // FORCE SERVICE WORKER UPDATE - REMOVED TO PREVENT LOOP
  /*
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          console.log('[App] Unregistering SW:', registration);
          registration.unregister();
        }
      });
    }
  }, []);
  */

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppProvider>
            <SpeedInsights />
            {/* <ReloadPrompt /> REMOVED TO PREVENT LOOP */}
            <NotificationManager />
            <BrowserRouter>
              {/* <VersionCheck /> REMOVED TO PREVENT LOOP */}
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route element={<Layout />}>
                  <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                  <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
                  <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/diary" element={<ProtectedRoute><HealthDiary /></ProtectedRoute>} />
                  <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/admin/sponsors" element={<ProtectedRoute><AdminSponsors /></ProtectedRoute>} />
                  <Route path="/admin/security" element={<ProtectedRoute adminOnly={true}><AdminSecurity /></ProtectedRoute>} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
