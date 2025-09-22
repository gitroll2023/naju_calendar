'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = 확인중
  const [loading, setLoading] = useState(true);

  // 인증 상태 확인
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
      });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    loading,
    checkAuth,
    logout,
  };
}