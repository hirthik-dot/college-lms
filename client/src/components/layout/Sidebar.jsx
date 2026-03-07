import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    HiOutlineHome,
    HiOutlineClipboardCheck,
    HiOutlineDocumentText,
    HiOutlineAcademicCap,
    HiOutlineBookOpen,
    HiOutlineSpeakerphone,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineChartBar,
    HiOutlineClipboardList,
    HiOutlineCalendar,
    HiOutlineUpload,
    HiOutlineCheckCircle,
    HiOutlineBriefcase,
} from 'react-icons/hi';

const navItems = {
    student: [
        { label: 'Dashboard', path: '/student/dashboard', icon: HiOutlineHome },
        { label: 'Attendance', path: '/student/attendance', icon: HiOutlineClipboardCheck },
        { label: 'Assignments', path: '/student/assignments', icon: HiOutlineDocumentText },
        { label: 'Marks', path: '/student/marks', icon: HiOutlineAcademicCap },
        { label: 'Content', path: '/student/content', icon: HiOutlineBookOpen },
        { label: 'Announcements', path: '/student/announcements', icon: HiOutlineSpeakerphone },
    ],
    staff: [
        { label: 'Dashboard', path: '/staff/dashboard', icon: HiOutlineHome },
        { label: 'Take Attendance', path: '/staff/attendance', icon: HiOutlineClipboardCheck },
        { label: 'Upload Content', path: '/staff/content', icon: HiOutlineUpload },
        { label: 'Assignments', path: '/staff/assignments', icon: HiOutlineDocumentText },
        { label: 'Grade Book', path: '/staff/gradebook', icon: HiOutlineAcademicCap },
        { label: 'Leave Request', path: '/staff/leaves', icon: HiOutlineCalendar },
        { label: 'Announcements', path: '/staff/announcements', icon: HiOutlineSpeakerphone },
    ],
    hod: [
        { label: 'Dashboard', path: '/hod/dashboard', icon: HiOutlineHome },
        { label: 'Manage Staff', path: '/hod/staff', icon: HiOutlineBriefcase },
        { label: 'Manage Students', path: '/hod/students', icon: HiOutlineUsers },
        { label: 'Manage Subjects', path: '/hod/subjects', icon: HiOutlineBookOpen },
        { label: 'Attendance Reports', path: '/hod/attendance-reports', icon: HiOutlineClipboardList },
        { label: 'Marks Reports', path: '/hod/marks-reports', icon: HiOutlineChartBar },
        { label: 'Leave Approvals', path: '/hod/leaves', icon: HiOutlineCheckCircle },
        { label: 'Announcements', path: '/hod/announcements', icon: HiOutlineSpeakerphone },
        { label: 'Dept Reports', path: '/hod/reports', icon: HiOutlineUserGroup },
    ],
};

export default function Sidebar() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const items = navItems[user.role] || [];

    const roleBadge = {
        student: { label: 'Student', color: 'bg-primary-500' },
        staff: { label: 'Staff', color: 'bg-accent-500' },
        hod: { label: 'HOD', color: 'bg-amber-500' },
    };

    const badge = roleBadge[user.role];

    return (
        <aside
            className="fixed left-0 top-0 h-screen bg-surface-900 text-white
                 flex flex-col z-[var(--z-fixed)]"
            style={{ width: 'var(--sidebar-width)' }}
        >
            {/* Branding */}
            <div className="px-6 py-5 border-b border-surface-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-sm">
                        LMS
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight">College LMS</h1>
                        <span
                            className={`inline-block mt-0.5 px-2 py-0.5 text-2xs font-semibold rounded-full text-white ${badge?.color}`}
                        >
                            {badge?.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive
                                    ? 'bg-primary-600/20 text-primary-300 shadow-glow'
                                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                                }
              `}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-surface-700/50 text-2xs text-surface-500">
                © 2026 College LMS
            </div>
        </aside>
    );
}
