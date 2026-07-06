"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'DEVELOPER' | 'ADMIN';
  level: number;
  xp: number;
  points: number;
  profile?: {
    avatarUrl: string;
    bannerUrl: string;
    bio: string;
  };
  likes?: Array<{ id: string; gameId: string; userId: string }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  apiUrl: string;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const apiUrl = 'http://localhost:5000/api';

  useEffect(() => {
    const storedToken = localStorage.getItem('pixelhub_token');
    const storedUser = localStorage.getItem('pixelhub_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setMounted(true);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('pixelhub_token', newToken);
    localStorage.setItem('pixelhub_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('pixelhub_token');
    localStorage.removeItem('pixelhub_user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('steam_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Error refreshing user', err);
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Auto attach token if present
    const currentToken = token || localStorage.getItem('steam_token');
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    // Determine content type if body is present and not FormData
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;
    
    return fetch(fullUrl, {
      ...options,
      headers
    });
  };

  // Prevent hydration flicker
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, apiUrl, login, logout, refreshUser, authFetch }}>
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
