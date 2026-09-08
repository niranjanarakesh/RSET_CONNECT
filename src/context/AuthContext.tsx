import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, StudentUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  role: 'student' | 'admin' | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string, rolePreference?: 'student' | 'admin') => Promise<void>;
  logout: () => void;
  updateCurrentUser: (updated: Partial<StudentUser>) => void;
  switchToStudent: (uid?: string) => Promise<void>;
  switchToAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'rsms_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<'student' | 'admin' | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore saved session from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token && parsed.user) {
          setUser(parsed.user);
          setRole(parsed.role);
          setToken(parsed.token);
        }
      } catch (err) {
        console.error('Failed to parse stored auth session:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string, rolePreference?: 'student' | 'admin') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role: rolePreference }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    setUser(data.user);
    setRole(data.role);
    setToken(data.token);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: data.user,
        role: data.role,
        token: data.token,
      })
    );
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateCurrentUser = (updated: Partial<StudentUser>) => {
    if (user && role === 'student') {
      const newUser = { ...user, ...updated } as StudentUser;
      setUser(newUser);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: newUser,
          role,
          token,
        })
      );
    }
  };

  const switchToStudent = async (uid = 'RSET2024CSE001') => {
    try {
      const res = await fetch(`/api/students/${uid}`);
      if (res.ok) {
        const student = await res.json();
        const simToken = `sim_jwt_token_${student.uid}`;
        setUser(student);
        setRole('student');
        setToken(simToken);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user: student,
            role: 'student',
            token: simToken,
          })
        );
      }
    } catch (err) {
      console.error('Error switching to student:', err);
    }
  };

  const switchToAdmin = () => {
    const adminUser = {
      username: 'admin',
      name: 'Academic Controller',
      role: 'admin' as const,
      department: 'Deanery of Academics',
      email: 'academics@rajagiri.edu.in',
    };
    const simToken = 'sim_jwt_token_admin';
    setUser(adminUser);
    setRole('admin');
    setToken(simToken);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: adminUser,
        role: 'admin',
        token: simToken,
      })
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        login,
        logout,
        updateCurrentUser,
        switchToStudent,
        switchToAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
