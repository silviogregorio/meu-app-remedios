import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages - Critical (Eager Load)
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import CompleteProfile from './pages/CompleteProfile';

// Pages - Lazy Load
const Home = React.lazy(() => import('./pages/Home'));
const Patients = React.lazy(() => import('./pages/Patients'));
const Medications = React.lazy(() => import('./pages/Medications'));
const Prescriptions = React.lazy(() => import('./pages/Prescriptions.jsx'));
const HealthDiary = React.lazy(() => import('./pages/HealthDiary'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Manual = React.lazy(() => import('./pages/Manual'));
const Support = React.lazy(() => import('./pages/Support'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Share = React.lazy(() => import('./pages/Share'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Widget = React.lazy(() => import('./pages/Widget'));
const TrophyGallery = React.lazy(() => import('./pages/TrophyGallery'));
const SecurityAudit = React.lazy(() => import('./pages/SecurityAudit'));

// Admin Pages - Lazy
const AdminSponsors = React.lazy(() => import('./pages/AdminSponsors'));
const AdminSecurity = React.lazy(() => import('./pages/AdminSecurity'));
const AdminSupport = React.lazy(() => import('./pages/AdminSupport'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));

import NotificationManager from './components/NotificationManager';
import AppUpdateChecker from './components/AppUpdateChecker';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/ui/LoadingScreen';
import { ThemeProvider } from './context/ThemeContext';
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppProvider>
            <SpeedInsights />
            <NotificationManager />
            <AppUpdateChecker />

            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route element={<Layout />}>
                    <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                    <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
                    <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                    <Route path="/diary" element={<ProtectedRoute><HealthDiary /></ProtectedRoute>} />
                    <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
                    <Route path="/manual" element={<ProtectedRoute><Manual /></ProtectedRoute>} />
                    <Route path="/contact" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/widget" element={<ProtectedRoute><Widget /></ProtectedRoute>} />
                    <Route path="/trophies" element={<ProtectedRoute><TrophyGallery /></ProtectedRoute>} />
                    <Route path="/security-audit" element={<ProtectedRoute><SecurityAudit /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute adminOnly={true}><AdminSettings /></ProtectedRoute>} />
                    <Route path="/admin/sponsors" element={<ProtectedRoute><AdminSponsors /></ProtectedRoute>} />
                    <Route path="/admin/support" element={<ProtectedRoute adminOnly={true}><AdminSupport /></ProtectedRoute>} />
                    <Route path="/admin/security" element={<ProtectedRoute adminOnly={true}><AdminSecurity /></ProtectedRoute>} />
                  </Route>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/complete-profile" element={<ProtectedRoute skipProfileCheck={true}><CompleteProfile /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AppProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
