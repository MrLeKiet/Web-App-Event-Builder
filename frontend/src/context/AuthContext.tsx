import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser as loginUserApi } from '../api/apiClient';

interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: 'admin' | 'member';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<boolean>;
    authHeaders: { username: string; password: string } | null;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authCredentials, setAuthCredentials] = useState<{ username: string; password: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from storage on app start
    useEffect(() => {
        const loadUserFromStorage = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                const credentials = await AsyncStorage.getItem('authCredentials');

                if (userJson) {
                    setUser(JSON.parse(userJson));
                }

                if (credentials) {
                    setAuthCredentials(JSON.parse(credentials));
                }
            } catch (error) {
                console.error('Error loading user from storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserFromStorage();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setIsLoading(true);
            const userData = await loginUserApi(username, password);

            // Save to state
            setUser(userData);
            setAuthCredentials({ username, password });

            // Save to storage
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('authCredentials', JSON.stringify({ username, password }));
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            console.log("Starting logout process");
            
            // Clear AsyncStorage first
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('authCredentials');
            console.log("AsyncStorage cleared");
            
            // Clear state immediately - no need for timeout
            setUser(null);
            setAuthCredentials(null);
            console.log("State cleared - user is now null");
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    };

    // Helper value to check if user is an admin
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                logout,
                authHeaders: authCredentials,
                isAdmin
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};