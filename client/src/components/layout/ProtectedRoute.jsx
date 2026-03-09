import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRole }) {
    const { isAuthenticated, loading, user, hasRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-medium">Restoring session...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRole && !hasRole(allowedRole)) {
        // Redirect to their own dashboard based on true role
        const roleRedirects = {
            student: '/student/dashboard',
            staff: '/staff/dashboard',
            hod: '/hod/dashboard',
        };
        return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
    }

    return <Outlet />;
}
