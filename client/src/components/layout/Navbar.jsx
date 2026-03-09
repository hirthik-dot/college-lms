import { Menu, Bell, Settings, LogOut, Search, User as UserIcon, FileText, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';

export default function Navbar({ setMobileOpen }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    // Fetch notifications for students
    const isStudent = user?.role === 'student';
    const { data: notifData } = useQuery({
        queryKey: ['student-material-notifications'],
        queryFn: async () => {
            const { data } = await api.get('/student/notifications/materials');
            return data.data;
        },
        enabled: isStudent,
        refetchInterval: 60000,
    });

    const notifications = notifData?.notifications || [];
    const unreadCount = notifData?.unreadCount || 0;

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark notification as read
    const handleNotifClick = async (notif) => {
        try {
            if (!notif.is_read) {
                await api.put(`/student/notifications/${notif.id}/read`);
                queryClient.invalidateQueries({ queryKey: ['student-material-notifications'] });
            }
            setNotifOpen(false);
            navigate(`/student/content?subjectId=${notif.subject_id}&topicId=${notif.topic_id}`);
        } catch (err) {
            console.error(err);
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        try {
            await api.put('/student/notifications/mark-all-read');
            queryClient.invalidateQueries({ queryKey: ['student-material-notifications'] });
        } catch (err) {
            console.error(err);
        }
    };

    // Time ago helper
    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-lg border-b border-gray-100 h-16 px-4 sm:px-6 lg:px-8 transition-all">
            {/* Left side: Hamburger + Search */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 w-full max-w-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search system..."
                        className="bg-transparent border-none text-sm text-gray-700 w-full focus:outline-none placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Right side: Actions & Profile */}
            <div className="flex items-center gap-3 sm:gap-5 justify-end">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-50"
                    >
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                        {!isStudent && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />}
                        <Bell className="w-5 h-5" />
                    </button>

                    {/* Notification Dropdown */}
                    {notifOpen && isStudent && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 py-2 z-50 max-h-[400px] overflow-y-auto">
                            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No new materials</p>
                                </div>
                            ) : (
                                notifications.slice(0, 20).map(notif => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotifClick(notif)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notif.is_read ? 'border-l-3 border-l-blue-500 bg-blue-50/30' : ''
                                            }`}
                                    >
                                        <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                New material: {notif.topic_name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{notif.subject_name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.notified_at)}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1" />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {user?.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm">
                                {user?.username?.charAt(0) || user?.full_name?.charAt(0) || '?'}
                            </div>
                        )}
                        <span className="text-sm font-semibold text-gray-700 hidden lg:block tracking-tight">
                            {user?.full_name || 'User'}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 py-2 z-50">
                            <div className="px-4 py-3 border-b border-gray-50 mb-1 lg:hidden">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate capitalize">{user?.role} Account</p>
                            </div>

                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                <UserIcon className="w-4 h-4" /> Profile Details
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                <Settings className="w-4 h-4" /> Settings
                            </button>

                            <div className="h-px bg-gray-100 my-1" />

                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
