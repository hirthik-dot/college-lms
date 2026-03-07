import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { HiOutlineLogout, HiOutlineBell } from 'react-icons/hi';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header
            className="fixed top-0 right-0 bg-white/80 backdrop-blur-md border-b border-surface-200
                 flex items-center justify-between px-6 z-[var(--z-sticky)]"
            style={{
                left: 'var(--sidebar-width)',
                height: 'var(--navbar-height)',
            }}
        >
            {/* Left — page context */}
            <div>
                <p className="text-sm text-surface-500">
                    Welcome back,{' '}
                    <span className="font-semibold text-surface-900">{user?.name || 'User'}</span>
                </p>
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-4">
                {/* Notification bell */}
                <button
                    className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100
                     hover:text-surface-700 transition-colors"
                >
                    <HiOutlineBell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger-500" />
                </button>

                {/* User info */}
                <div className="flex items-center gap-3">
                    <Avatar name={user?.name} size="sm" />
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-surface-900 leading-tight">{user?.name}</p>
                        <p className="text-2xs text-surface-500 capitalize">{user?.role}</p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-500
                     hover:bg-danger-50 hover:text-danger-600 transition-colors"
                    title="Logout"
                >
                    <HiOutlineLogout className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
}
