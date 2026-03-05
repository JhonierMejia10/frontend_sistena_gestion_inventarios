import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const access = localStorage.getItem('access_token');
            const refresh = localStorage.getItem('refresh_token');

            if (!access) {
                setLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode(access);
                const isExpired = decoded.exp * 1000 < Date.now();

                if (!isExpired) {
                    // Token vigente, usar directamente
                    setUser({ id: decoded.user_id });
                } else if (refresh) {
                    // Access expirado pero tenemos refresh → intentar renovar
                    try {
                        const { data } = await axios.post('http://localhost:8000/api/token/refresh/', {
                            refresh,
                        });
                        localStorage.setItem('access_token', data.access);
                        if (data.refresh) {
                            localStorage.setItem('refresh_token', data.refresh);
                        }
                        const newDecoded = jwtDecode(data.access);
                        setUser({ id: newDecoded.user_id });
                    } catch {
                        // Refresh token inválido o expirado → logout
                        logout();
                    }
                } else {
                    logout();
                }
            } catch {
                logout();
            }

            setLoading(false);
        };

        initAuth();
    }, [logout]);

    const login = async (username, password) => {
        try {
            const response = await api.post('/api/token/', { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            const decoded = jwtDecode(response.data.access);
            setUser({ id: decoded.user_id });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.detail || 'Error al iniciar sesión'
            };
        }
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
