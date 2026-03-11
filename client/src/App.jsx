import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth
import Login from './pages/auth/Login';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentAssignments from './pages/student/Assignments';
import StudentMarks from './pages/student/Marks';
import StudentContent from './pages/student/Content';
import StudentSubjects from './pages/student/Subjects';
import StudentAnnouncements from './pages/student/Announcements';
import StudentMyTimetable from './pages/student/MyTimetable';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard';
import StaffAttendance from './pages/staff/Attendance';
import StaffContent from './pages/staff/Content';
import StaffAssignments from './pages/staff/Assignments';
import StaffGradeBook from './pages/staff/GradeBook';
import StaffLeaveRequest from './pages/staff/LeaveRequest';
import StaffSubjects from './pages/staff/Subjects';
import StaffAnnouncements from './pages/staff/Announcements';
import CoursePlanManager from './pages/staff/CoursePlanManager';
import SubmitHourReport from './pages/staff/SubmitHourReport';
import StaffMyTimetable from './pages/staff/MyTimetable';

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
import CoursePlanReports from './pages/hod/CoursePlanReports';
import HodTimetableManagement from './pages/hod/TimetableManagement';

export default function App() {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return null; // Let ProtectedRoute or AuthContext handle loading state UX if needed

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

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
            <Route path="/student/*" element={<ProtectedRoute allowedRole="student" />}>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="marks" element={<StudentMarks />} />
                <Route path="subjects" element={<StudentSubjects />} />
                <Route path="content" element={<StudentContent />} />
                <Route path="announcements" element={<StudentAnnouncements />} />
                <Route path="timetable" element={<StudentMyTimetable />} />
            </Route>

            {/* Staff Routes */}
            <Route path="/staff/*" element={<ProtectedRoute allowedRole="staff" />}>
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="subjects" element={<StaffSubjects />} />
                <Route path="attendance" element={<StaffAttendance />} />
                <Route path="content" element={<StaffContent />} />
                <Route path="assignments" element={<StaffAssignments />} />
                <Route path="grades" element={<StaffGradeBook />} />
                <Route path="leave" element={<StaffLeaveRequest />} />
                <Route path="announcements" element={<StaffAnnouncements />} />
                <Route path="course-plan" element={<CoursePlanManager />} />
                <Route path="course-plan/submit/:topicId" element={<SubmitHourReport />} />
                <Route path="timetable" element={<StaffMyTimetable />} />
            </Route>

            {/* HOD Routes */}
            <Route path="/hod/*" element={<ProtectedRoute allowedRole="hod" />}>
                <Route path="dashboard" element={<HodDashboard />} />
                <Route path="staff" element={<HodManageStaff />} />
                <Route path="students" element={<HodManageStudents />} />
                <Route path="subjects" element={<HodManageSubjects />} />
                <Route path="reports/attendance" element={<HodAttendanceReports />} />
                <Route path="reports/marks" element={<HodMarksReports />} />
                <Route path="leaves" element={<HodLeaveApprovals />} />
                <Route path="announcements" element={<HodAnnouncements />} />
                <Route path="reports/overall" element={<HodDeptReports />} />
                <Route path="course-plan-reports" element={<CoursePlanReports />} />
                <Route path="timetable" element={<HodTimetableManagement />} />
            </Route>

            {/* 404 Fallback */}
            <Route
                path="*"
                element={
                    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
                        <p className="text-xl text-slate-600 mb-8">Page not found</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Return Home
                        </button>
                    </div>
                }
            />
        </Routes>
    );
}
