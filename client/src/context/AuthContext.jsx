import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // In-memory state for security (no localStorage for tokens/user details)
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Validate active session on full page mount using the secure endpoint
    useEffect(() => {
        const validateSession = async () => {
            try {
                // If a session exists, the backend /me route will return the user
                // The interceptor will attach the token if it somehow persisted or if using HttpOnly cookies
                // Note: since we moved from localStorage to in-memory, a hard reload clears token state.
                // We attempt to fetch /auth/me. If the backend is using cookies or the token is somehow available,
                // it might succeed. Otherwise, it fails and clears state.
                const response = await api.get('/auth/me');
                if (response?.data?.user) {
                    setUser(response.data.user);
                    // If the API returns the token along with the profile (optional), set it
                    if (response.data.token) {
                        setToken(response.data.token);
                        // Make sure the interceptor has it for future calls in memory
                        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                    }
                } else {
                    logout();
                }
            } catch (err) {
                // Ignore initial 401s on mount since user might just not be logged in
                logout();
            } finally {
                setLoading(false);
            }
        };

        // If there's token in memory (from a fast refresh) validate it. 
        // If not, still try because of httpOnly cookies if implemented on backend.
        validateSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(async (identifier, password) => {
        const response = await api.post('/auth/login', { username: identifier, password });

        const receivedToken = response.data.token;
        const userData = response.data.user;

        // Store in memory state ONLY
        setToken(receivedToken);
        setUser(userData);

        // Setup axios default header so the interceptor has it
        if (receivedToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
        }

        return userData;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    }, []);

    const isAuthenticated = !!token && !!user;

    const hasRole = useCallback(
        (role) => {
            return user ? user.role === role : false;
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
