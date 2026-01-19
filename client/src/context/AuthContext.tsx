import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { User, AuthContextType, AuthResponse } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  // Check valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.post<AuthResponse>('/auth/refresh-token');
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        logout(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const updateUser = (newData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...newData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      // Cookies are set by backend automatically
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData: any) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', userData);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async (callApi = true) => {
    if (callApi) {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.error("Logout failed", e);
      }
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      updateUser,
      login,
      register,
      logout,
      loading
    }}>
      {!loading && children}
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