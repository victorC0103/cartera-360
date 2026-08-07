import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Recuperar sesión persistida
        const storedToken = localStorage.getItem('crediruta_token');
        const storedUser = localStorage.getItem('crediruta_user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('crediruta_token', jwtToken);
        localStorage.setItem('crediruta_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('crediruta_token');
        localStorage.removeItem('crediruta_user');
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};
