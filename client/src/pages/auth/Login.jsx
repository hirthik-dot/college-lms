import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { parseApiError } from '../../utils/helpers';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);

            const roleRedirects = {
                student: '/student/dashboard',
                staff: '/staff/dashboard',
                hod: '/hod/dashboard',
            };

            navigate(roleRedirects[user.role] || '/');
        } catch (err) {
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-surface-800 to-primary-950 px-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-600/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white text-2xl font-bold mb-4 shadow-glow">
                        LMS
                    </div>
                    <h1 className="text-3xl font-bold text-white">College LMS</h1>
                    <p className="text-surface-400 mt-2">Sign in to your account</p>
                </div>

                {/* Form card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-danger-500/20 border border-danger-500/30 text-danger-200 text-sm animate-slide-down">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@college.edu"
                            required
                            className="[&_label]:text-surface-300 [&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-surface-500"
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="[&_label]:text-surface-300 [&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-surface-500"
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full py-3"
                            size="lg"
                        >
                            Sign In
                        </Button>
                    </form>
                </div>

                <p className="text-center text-surface-500 text-sm mt-6">
                    © 2026 College LMS. All rights reserved.
                </p>
            </div>
        </div>
    );
}
