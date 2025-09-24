'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, DocumentArrowUpIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useCalendarStore } from '@/lib/store';
import { getNextMonth, getPreviousMonth } from '@/lib/calendar-utils';
import { addDays, subDays, addWeeks, subWeeks, format, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarHeaderProps {
  onExcelUpload?: () => void;
  onDownloadCSV?: () => void;
}

export default function CalendarHeader({ onExcelUpload, onDownloadCSV }: CalendarHeaderProps) {
  const { currentDate, setCurrentDate, viewMode, deleteMonthEvents, events } = useCalendarStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 현재 월의 일정 수 계산
  const currentMonthEventCount = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === currentDate.getFullYear() &&
           eventDate.getMonth() === currentDate.getMonth();
  }).length;

  const handleDeleteMonth = async () => {
    if (deleteInput !== '삭제') {
      return; // 입력이 올바르지 않으면 아무것도 하지 않음
    }

    setIsDeleting(true);
    try {
      await deleteMonthEvents(currentDate.getFullYear(), currentDate.getMonth());
      setShowDeleteConfirm(false);
      setDeleteInput('');
      // Toast 메시지는 CalendarContainer에서 처리하도록 할 수도 있음
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteInput('');
  };

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(getPreviousMonth(currentDate));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(getNextMonth(currentDate));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateDisplayText = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'M월', { locale: ko });
    } else if (viewMode === 'week') {
      const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // 일요일 시작
      const endOfWeekDate = endOfWeek(currentDate, { weekStartsOn: 0 });

      if (startOfWeekDate.getMonth() === endOfWeekDate.getMonth()) {
        // 같은 달에 속한 경우
        return `${format(startOfWeekDate, 'M월', { locale: ko })} ${format(startOfWeekDate, 'd', { locale: ko })}~${format(endOfWeekDate, 'd일', { locale: ko })}`;
      } else {
        // 다른 달에 걸쳐 있는 경우
        return `${format(startOfWeekDate, 'M월 d일', { locale: ko })}~${format(endOfWeekDate, 'M월 d일', { locale: ko })}`;
      }
    } else if (viewMode === 'day') {
      return format(currentDate, 'M월 d일 (E)', { locale: ko });
    }
    return format(currentDate, 'M월', { locale: ko });
  };

  const getPreviousLabel = () => {
    if (viewMode === 'month') return '이전 달';
    if (viewMode === 'week') return '이전 주';
    if (viewMode === 'day') return '이전 날';
    return '이전';
  };

  const getNextLabel = () => {
    if (viewMode === 'month') return '다음 달';
    if (viewMode === 'week') return '다음 주';
    if (viewMode === 'day') return '다음 날';
    return '다음';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="safe-area-inset-top">
        {/* 앱 타이틀 */}
        <div className="flex items-center justify-center py-2 bg-blue-600">
          <CalendarDaysIcon className="w-4 h-4 text-white mr-2" />
          <h1 className="text-white text-sm font-semibold">
            나주지역 일정공유 캘린더 {format(currentDate, 'yyyy')}
          </h1>
        </div>

        <div className="flex items-center justify-between h-14 px-4">
          {/* 날짜 표시 */}
          <div className="flex items-center">
            <h2 className="text-lg font-bold text-gray-900">
              {getDateDisplayText()}
            </h2>
          </div>

          {/* 네비게이션 컨트롤 */}
          <div className="flex items-center space-x-2">
            {/* 월 전체 삭제 버튼 - 월간 보기에서만 표시 */}
            {viewMode === 'month' && currentMonthEventCount > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                title={`${format(currentDate, 'M', { locale: ko })}월 전체 삭제 (${currentMonthEventCount}개)`}
              >
                <TrashIcon className="w-5 h-5 text-white" />
              </button>
            )}
            {/* CSV 다운로드 버튼 - 월간 보기에서만 표시 */}
            {viewMode === 'month' && onDownloadCSV && (
              <button
                onClick={onDownloadCSV}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                title="전체 일정 CSV 다운로드"
              >
                <ArrowDownTrayIcon className="w-5 h-5 text-white" />
              </button>
            )}
            {/* 엑셀 업로드 버튼 - 월간 보기에서만 표시 */}
            {viewMode === 'month' && onExcelUpload && (
              <button
                onClick={onExcelUpload}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-green-600 hover:bg-green-700 transition-colors"
                title="엑셀 일정 가져오기"
              >
                <DocumentArrowUpIcon className="w-5 h-5 text-white" />
              </button>
            )}
            {/* 이전 버튼 */}
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              aria-label={getPreviousLabel()}
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
            </button>

            {/* 현재 버튼 */}
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-full transition-colors touch-manipulation"
            >
              현재
            </button>

            {/* 다음 버튼 */}
            <button
              onClick={handleNext}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              aria-label={getNextLabel()}
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 월 전체 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseDeleteConfirm} />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {format(currentDate, 'yyyy년 M월', { locale: ko })} 전체 삭제
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {format(currentDate, 'M월', { locale: ko })}의 모든 일정 {currentMonthEventCount}개를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-red-600 mb-4">
              ⚠️ 이 작업은 되돌릴 수 없습니다.
            </p>
            
            {/* 삭제 확인 입력 필드 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정말 삭제하려면 <span className="text-red-600 font-bold">&quot;삭제&quot;</span>를 입력해주세요
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="삭제"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteConfirm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteMonth}
                disabled={deleteInput !== '삭제' || isDeleting}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  deleteInput === '삭제' && !isDeleting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isDeleting ? '삭제 중...' : '전체 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}