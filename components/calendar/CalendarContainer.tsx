'use client';

import { CalendarIcon, Squares2X2Icon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { CalendarIcon as CalendarSolidIcon, Squares2X2Icon as Squares2X2SolidIcon, ViewColumnsIcon as ViewColumnsSolidIcon } from '@heroicons/react/24/solid';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import WeekView from './WeekView';
import DayView from './DayView';
import CategoryLegend from './CategoryLegend';
import FloatingActionButton from '../ui/FloatingActionButton';
import BottomSheet from '../ui/BottomSheet';
import EventList from '../events/EventList';
import EventModal from '../events/EventModal';
import EditEventModal from '../ui/EditEventModal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import ExcelUploadModal from '../ui/ExcelUploadModal';
import Toast from '../ui/Toast';
import { useCalendarStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import type { Event } from '@/types/calendar';
import { convertEventsToCSV, downloadCSV, generateCSVFilename } from '@/lib/csv-export';

export default function CalendarContainer() {
  const {
    viewMode,
    setViewMode,
    selectedDate,
    getFilteredEvents,
    events,
    updateEvent,
    deleteEvent,
    loading,
    error
  } = useCalendarStore();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as const });

  // 선택된 날짜가 변경될 때 하단 시트 열기
  useEffect(() => {
    if (selectedDate) {
      setIsBottomSheetOpen(true);
    }
  }, [selectedDate]);

  const handleAddEvent = () => {
    setIsEventModalOpen(true);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false);
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeletingEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async (updatedEvent: Event) => {
    try {
      await updateEvent(updatedEvent.id, updatedEvent);
      showToast('일정이 수정되었습니다! ✅', 'success');
    } catch {
      showToast('일정 수정에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const handleCancelEdit = () => {
    showToast('수정이 취소되었습니다.', 'success');
  };

  const handleConfirmDelete = async (event: Event) => {
    try {
      await deleteEvent(event.id);
      showToast('일정이 삭제되었습니다! 🗑️', 'success');
    } catch {
      showToast('일정 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const handleCancelDelete = () => {
    showToast('삭제가 취소되었습니다.', 'success');
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEvent(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingEvent(null);
  };

  // CSV 다운로드 핸들러
  const handleDownloadCSV = () => {
    if (!events || events.length === 0) {
      showToast('다운로드할 일정이 없습니다.', 'error');
      return;
    }

    try {
      const csvContent = convertEventsToCSV(events);
      const filename = generateCSVFilename(events);
      downloadCSV(csvContent, filename);
      showToast(`${events.length}개의 일정을 다운로드했습니다.`, 'success');
    } catch {
      showToast('CSV 다운로드 중 오류가 발생했습니다.', 'error');
    }
  };

  // 선택된 날짜의 필터링된 일정 가져오기
  const filteredEvents = getFilteredEvents();
  const selectedDateEvents = selectedDate ? filteredEvents.filter(event =>
    event.date.getDate() === selectedDate.getDate() &&
    event.date.getMonth() === selectedDate.getMonth() &&
    event.date.getFullYear() === selectedDate.getFullYear()
  ) : [];

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 헤더 */}
      <CalendarHeader
        onExcelUpload={() => setIsExcelUploadOpen(true)}
        onDownloadCSV={handleDownloadCSV}
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="pt-[88px] px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="pt-[88px] px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-blue-600 text-sm">데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 카테고리 범례 (월간 보기에서만 표시) */}
      {viewMode === 'month' && !error && !loading && (
        <div className="pt-[88px]">
          <CategoryLegend />
        </div>
      )}

      {/* 메인 캘린더 영역 */}
      <main className={`flex-1 pb-20 overflow-auto bg-white ${
        viewMode === 'month' && !error && !loading ? 'pt-4' :
        error || loading ? 'pt-2' : 'pt-[88px]'
      }`}>
        {viewMode === 'month' && <CalendarGrid />}
        {viewMode === 'week' && <WeekView />}
        {viewMode === 'day' && <DayView />}
      </main>

      {/* 플로팅 액션 버튼 */}
      <FloatingActionButton onClick={handleAddEvent} />

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-4">
            {/* 월간 보기 */}
            <button
              onClick={() => setViewMode('month')}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors touch-manipulation ${
                viewMode === 'month'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:text-gray-800'
              }`}
            >
              {viewMode === 'month' ? (
                <Squares2X2SolidIcon className="w-6 h-6 mb-1" />
              ) : (
                <Squares2X2Icon className="w-6 h-6 mb-1" />
              )}
              <span className="text-xs font-medium">월간</span>
            </button>

            {/* 주간 보기 */}
            <button
              onClick={() => setViewMode('week')}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors touch-manipulation ${
                viewMode === 'week'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:text-gray-800'
              }`}
            >
              {viewMode === 'week' ? (
                <ViewColumnsSolidIcon className="w-6 h-6 mb-1" />
              ) : (
                <ViewColumnsIcon className="w-6 h-6 mb-1" />
              )}
              <span className="text-xs font-medium">주간</span>
            </button>

            {/* 일간 보기 */}
            <button
              onClick={() => setViewMode('day')}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors touch-manipulation ${
                viewMode === 'day'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:text-gray-800'
              }`}
            >
              {viewMode === 'day' ? (
                <CalendarSolidIcon className="w-6 h-6 mb-1" />
              ) : (
                <CalendarIcon className="w-6 h-6 mb-1" />
              )}
              <span className="text-xs font-medium">일간</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 하단 시트 - 선택된 날짜의 일정 목록 */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleCloseBottomSheet}
      >
        <EventList
          events={selectedDateEvents}
          selectedDate={selectedDate}
          onAddEvent={handleAddEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      </BottomSheet>

      {/* 일정 추가 모달 */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        selectedDate={selectedDate}
        onSuccess={showToast}
        onCancel={showToast}
      />

      {/* 수정 모달 */}
      <EditEventModal
        event={editingEvent}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        event={deletingEvent}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* 엑셀 업로드 모달 */}
      <ExcelUploadModal
        isOpen={isExcelUploadOpen}
        onClose={() => setIsExcelUploadOpen(false)}
        onSuccess={showToast}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        type={toast.type}
      />
    </div>
  );
}