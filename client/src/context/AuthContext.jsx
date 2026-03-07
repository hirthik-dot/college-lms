import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('accessToken') || null);
    const [loading, setLoading] = useState(true);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/me');
                setUser(response.data.data);
                localStorage.setItem('user', JSON.stringify(response.data.data));
            } catch {
                logout();
            } finally {
                setLoading(false);
            }
        };

        validateToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, refreshToken, user: userData } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(accessToken);
        setUser(userData);

        return userData;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const isAuthenticated = !!token && !!user;

    const hasRole = useCallback(
        (...roles) => {
            return user ? roles.includes(user.role) : false;
        },
        [user]
    );

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            isAuthenticated,
            login,
            logout,
            hasRole,
        }),
        [user, token, loading, isAuthenticated, login, logout, hasRole]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
