import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Admin-only route protection
    const adminEmails = ['sigremedios@gmail.com', 'sigsis@gmail.com', 'silviogregorio@gmail.com'];
    if (adminOnly && !adminEmails.includes(user.email)) {
        return <Navigate to="/app" replace />;
    }

    return children;
};

export default ProtectedRoute;
