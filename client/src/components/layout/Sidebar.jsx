import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    FileText,
    GraduationCap,
    Megaphone,
    UploadCloud,
    CalendarClock,
    Users,
    UserCog,
    BarChart3,
    LogOut,
    Sparkles,
    Menu,
    X,
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const { user, logout } = useAuth();

    const getNavItems = () => {
        if (!user) return [];

        if (user.role === 'student') {
            return [
                { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
                { label: 'My Subjects', path: '/student/subjects', icon: BookOpen },
                { label: 'Attendance', path: '/student/attendance', icon: ClipboardList },
                { label: 'Assignments', path: '/student/assignments', icon: FileText },
                { label: 'Marks', path: '/student/marks', icon: GraduationCap },
                { label: 'My Timetable', path: '/student/timetable', icon: CalendarClock },
                { label: 'Announcements', path: '/student/announcements', icon: Megaphone },
            ];
        }
        if (user.role === 'staff') {
            return [
                { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
                { label: 'My Subjects', path: '/staff/subjects', icon: BookOpen },
                { label: 'Take Attendance', path: '/staff/attendance', icon: ClipboardList },
                { label: 'Upload Content', path: '/staff/content', icon: UploadCloud },
                { label: 'Assignments', path: '/staff/assignments', icon: FileText },
                { label: 'Course Plan', path: '/staff/course-plan', icon: BookOpen },
                { label: 'Grade Book', path: '/staff/grades', icon: GraduationCap },
                { label: 'My Timetable', path: '/staff/timetable', icon: CalendarClock },
                { label: 'Leave Request', path: '/staff/leave', icon: CalendarClock },
                { label: 'Announcements', path: '/staff/announcements', icon: Megaphone },
            ];
        }
        if (user.role === 'hod') {
            return [
                { label: 'Dashboard', path: '/hod/dashboard', icon: LayoutDashboard },
                { label: 'Manage Staff', path: '/hod/staff', icon: UserCog },
                { label: 'Manage Students', path: '/hod/students', icon: Users },
                { label: 'Manage Subjects', path: '/hod/subjects', icon: BookOpen },
                { label: 'Attendance Reports', path: '/hod/reports/attendance', icon: BarChart3 },
                { label: 'Marks Reports', path: '/hod/reports/marks', icon: GraduationCap },
                { label: 'Leave Approvals', path: '/hod/leaves', icon: CalendarClock },
                { label: 'Announcements', path: '/hod/announcements', icon: Megaphone },
                { label: 'Department Reports', path: '/hod/reports/overall', icon: FileText },
                { label: 'Course Plan Reports', path: '/hod/course-plan-reports', icon: ClipboardList },
                { label: 'Timetable Management', path: '/hod/timetable', icon: CalendarClock },
            ];
        }
        return [];
    };

    const navItems = getNavItems();

    const navClasses = ({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 mt-1 ${isActive
            ? 'bg-blue-600/10 text-blue-700 font-semibold'
            : 'text-gray-600 font-medium hover:bg-gray-100/80 hover:text-gray-900'
        }`;

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar drawer mechanism */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-[280px] bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-[260px]`}
            >
                {/* Brand Logo Wrapper */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 flex-shrink-0 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col -mr-4">
                            <h2 className="text-[15px] font-bold text-gray-900 tracking-tight leading-4">College LMS</h2>
                            <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">
                                Computer Science
                            </span>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col p-4">

                    {/* User Mini Profile */}
                    <div className="mb-6 px-2 py-3 bg-gray-50 rounded-2xl flex items-center gap-3">
                        {user?.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center border-2 border-white shadow-sm uppercase shrink-0">
                                {user?.username?.charAt(0) || user?.full_name?.charAt(0) || '?'}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                            <span className="text-[11px] font-bold text-blue-600 capitalize bg-blue-100/50 inline-block px-1.5 py-0.5 rounded w-max mt-0.5">
                                {user?.role} Badge
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col gap-0.5">
                        {/* Section Header */}
                        <p className="px-3.5 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Main Menu</p>

                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={navClasses}
                            >
                                <item.icon className="w-5 h-5 opacity-80" strokeWidth={2.2} />
                                <span className="text-[14px]">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                </div>

                {/* Footer fixed */}
                <div className="p-4 border-t border-gray-100 pl-4 bg-gray-50/50 shrink-0">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-600 font-medium hover:bg-red-50 hover:text-red-700 transition-all text-[14px]"
                    >
                        <LogOut className="w-5 h-5" strokeWidth={2} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
