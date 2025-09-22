'use client';

import { useEffect, useState } from 'react';
import CalendarContainer from '@/components/calendar/CalendarContainer';
import AuthPage from '@/components/auth/AuthPage';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarStore } from '@/lib/store';

export default function Home() {
  const { loadEvents } = useCalendarStore();
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated, loadEvents]);

  // 인증 성공 핸들러
  const handleAuthSuccess = () => {
    checkAuth(); // 인증 상태 다시 확인
  };

  // 마운트되지 않았거나 로딩 중일 때
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지 표시
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // 인증된 경우 캘린더 표시
  return <CalendarContainer />;
}
