import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Auth
import Login from './pages/auth/Login';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentAssignments from './pages/student/Assignments';
import StudentMarks from './pages/student/Marks';
import StudentContent from './pages/student/Content';
import StudentAnnouncements from './pages/student/Announcements';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard';
import StaffAttendance from './pages/staff/Attendance';
import StaffContent from './pages/staff/Content';
import StaffAssignments from './pages/staff/Assignments';
import StaffGradeBook from './pages/staff/GradeBook';
import StaffLeaveRequest from './pages/staff/LeaveRequest';
import StaffAnnouncements from './pages/staff/Announcements';

// HOD Pages
import HodDashboard from './pages/hod/Dashboard';
import HodManageStaff from './pages/hod/ManageStaff';
import HodManageStudents from './pages/hod/ManageStudents';
import HodManageSubjects from './pages/hod/ManageSubjects';
import HodAttendanceReports from './pages/hod/AttendanceReports';
import HodMarksReports from './pages/hod/MarksReports';
import HodLeaveApprovals from './pages/hod/LeaveApprovals';
import HodAnnouncements from './pages/hod/Announcements';
import HodDeptReports from './pages/hod/DeptReports';

function PrivateRoute({ children, allowedRoles }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default function App() {
    const { user, isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                }
            />

            {/* Root Redirect based on role */}
            <Route
                path="/"
                element={
                    !isAuthenticated ? (
                        <Navigate to="/login" replace />
                    ) : user?.role === 'hod' ? (
                        <Navigate to="/hod/dashboard" replace />
                    ) : user?.role === 'staff' ? (
                        <Navigate to="/staff/dashboard" replace />
                    ) : (
                        <Navigate to="/student/dashboard" replace />
                    )
                }
            />

            {/* Student Routes */}
            <Route path="/student">
                <Route path="dashboard" element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>} />
                <Route path="attendance" element={<PrivateRoute allowedRoles={['student']}><StudentAttendance /></PrivateRoute>} />
                <Route path="assignments" element={<PrivateRoute allowedRoles={['student']}><StudentAssignments /></PrivateRoute>} />
                <Route path="marks" element={<PrivateRoute allowedRoles={['student']}><StudentMarks /></PrivateRoute>} />
                <Route path="content" element={<PrivateRoute allowedRoles={['student']}><StudentContent /></PrivateRoute>} />
                <Route path="announcements" element={<PrivateRoute allowedRoles={['student']}><StudentAnnouncements /></PrivateRoute>} />
            </Route>

            {/* Staff Routes */}
            <Route path="/staff">
                <Route path="dashboard" element={<PrivateRoute allowedRoles={['staff']}><StaffDashboard /></PrivateRoute>} />
                <Route path="attendance" element={<PrivateRoute allowedRoles={['staff']}><StaffAttendance /></PrivateRoute>} />
                <Route path="content" element={<PrivateRoute allowedRoles={['staff']}><StaffContent /></PrivateRoute>} />
                <Route path="assignments" element={<PrivateRoute allowedRoles={['staff']}><StaffAssignments /></PrivateRoute>} />
                <Route path="gradebook" element={<PrivateRoute allowedRoles={['staff']}><StaffGradeBook /></PrivateRoute>} />
                <Route path="leaves" element={<PrivateRoute allowedRoles={['staff']}><StaffLeaveRequest /></PrivateRoute>} />
                <Route path="announcements" element={<PrivateRoute allowedRoles={['staff']}><StaffAnnouncements /></PrivateRoute>} />
            </Route>

            {/* HOD Routes */}
            <Route path="/hod">
                <Route path="dashboard" element={<PrivateRoute allowedRoles={['hod']}><HodDashboard /></PrivateRoute>} />
                <Route path="staff" element={<PrivateRoute allowedRoles={['hod']}><HodManageStaff /></PrivateRoute>} />
                <Route path="students" element={<PrivateRoute allowedRoles={['hod']}><HodManageStudents /></PrivateRoute>} />
                <Route path="subjects" element={<PrivateRoute allowedRoles={['hod']}><HodManageSubjects /></PrivateRoute>} />
                <Route path="attendance-reports" element={<PrivateRoute allowedRoles={['hod']}><HodAttendanceReports /></PrivateRoute>} />
                <Route path="marks-reports" element={<PrivateRoute allowedRoles={['hod']}><HodMarksReports /></PrivateRoute>} />
                <Route path="leaves" element={<PrivateRoute allowedRoles={['hod']}><HodLeaveApprovals /></PrivateRoute>} />
                <Route path="announcements" element={<PrivateRoute allowedRoles={['hod']}><HodAnnouncements /></PrivateRoute>} />
                <Route path="reports" element={<PrivateRoute allowedRoles={['hod']}><HodDeptReports /></PrivateRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
