import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/helpers';
import { Lock, User, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    // Already authenticated?
    if (isAuthenticated) {
        if (user?.role === 'hod') return <Navigate to="/hod/dashboard" replace />;
        if (user?.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
        return <Navigate to="/student/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loggedInUser = await login(identifier, password);

            const roleRedirects = {
                student: '/student/dashboard',
                staff: '/staff/dashboard',
                hod: '/hod/dashboard',
            };

            const target = roleRedirects[loggedInUser.role] || '/login';
            navigate(target, { replace: true });
        } catch (err) {
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden">
            {/* Desktop Left Half - Premium Deep Blue Gradient */}
            <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 items-center justify-center p-12 overflow-hidden">
                {/* Decorative Pattern / Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                <div className="relative z-10 w-full max-w-lg text-white space-y-8">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <Sparkles className="w-6 h-6 text-blue-200" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Hindusthan LMS</h2>
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        Empowering<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
                            Academic Excellence
                        </span>
                    </h1>

                    <p className="text-lg text-indigo-200 leading-relaxed font-light mt-6 max-w-sm">
                        Sign in to access your courses, track your progress, and stay connected with your department.
                    </p>
                </div>
            </div>

            {/* Right Half - White Login Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
                <div className="w-full max-w-[420px] space-y-8">
                    {/* Mobile Only Header Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">College LMS</h2>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-500">Sign in to your portal</p>
                    </div>

                    {error && (
                        <div className="animate-shake p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                            <div className="bg-red-100 text-red-600 p-1.5 rounded-full mt-0.5 shrink-0">
                                <Lock className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-red-800">Authentication Failed</h4>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Username / ID</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-0.5"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In to Portal'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-8 space-y-2">
                        <p className="text-xs text-gray-500">
                            Accounts are managed by your department.
                            <br />Contact HOD for access issues.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
