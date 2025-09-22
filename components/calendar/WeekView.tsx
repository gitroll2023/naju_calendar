'use client';

import { useState } from 'react';
import { useCalendarStore } from '@/lib/store';
import { WEEK_DAYS, getCategoryInfo } from '@/lib/calendar-utils';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday
} from 'date-fns';
import type { Event } from '@/types/calendar';
import EventDetailModal from '../ui/EventDetailModal';
import EditEventModal from '../ui/EditEventModal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import Toast from '../ui/Toast';

export default function WeekView() {
  const { currentDate, selectedDate, selectDate, getFilteredEvents, updateEvent, deleteEvent } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success' });

  // 현재 날짜가 포함된 주의 시작과 끝
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 일요일 시작
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  // 주의 모든 날짜들
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 필터링된 이벤트들
  const filteredEvents = getFilteredEvents();

  // 각 날짜별 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event =>
      isSameDay(event.date, date)
    );
  };

  const handleDateClick = (date: Date) => {
    selectDate(date);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
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

  return (
    <div className="bg-white">
      {/* 세로 레이아웃: 요일별 일정 표시 */}
      <div className="space-y-1 p-2">
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDate(day);
          const isTodayDate = isToday(day);
          const isSelectedDate = selectedDate && isSameDay(day, selectedDate);

          return (
            <div key={dayIndex} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
              {/* 요일 및 날짜 */}
              <div className="flex-shrink-0 w-20 text-center">
                <button
                  onClick={() => handleDateClick(day)}
                  className={`w-12 h-12 rounded-full text-sm font-medium transition-colors mb-1 ${
                    isTodayDate
                      ? 'bg-blue-600 text-white'
                      : isSelectedDate
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {format(day, 'd')}
                </button>
                <div className="text-xs text-gray-600 font-medium">
                  {WEEK_DAYS[dayIndex]}
                </div>
              </div>

              {/* 일정 목록 */}
              <div className="flex-1 min-h-[60px]">
                {dayEvents.length === 0 ? (
                  <div className="text-gray-400 text-sm py-2">일정 없음</div>
                ) : (
                  <div className="space-y-1">
                    {dayEvents
                      .sort((a, b) => {
                        // 종일 일정을 먼저, 그 다음 시간 순으로 정렬
                        if (a.isAllDay && !b.isAllDay) return -1;
                        if (!a.isAllDay && b.isAllDay) return 1;
                        if (!a.startTime || !b.startTime) return 0;
                        return a.startTime.localeCompare(b.startTime);
                      })
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center space-x-2 p-2 rounded-lg cursor-pointer touch-manipulation hover:bg-gray-50"
                          onClick={() => handleEventClick(event)}
                        >
                          {/* 카테고리 색상 표시 */}
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCategoryInfo(event.category).color }}
                          />
                          
                          {/* 일정 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate text-sm">
                              {event.title}
                            </div>
                            {!event.isAllDay && event.startTime && (
                              <div className="text-xs text-gray-500">
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </div>
                            )}
                            {/* 디버깅용 - 나중에 제거 */}
                            {!event.isAllDay && !event.startTime && (
                              <div className="text-xs text-red-500">
                                시간 정보 없음 (종일 아님)
                              </div>
                            )}
                            {event.isAllDay && (
                              <div className="text-xs text-gray-500">종일</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 이벤트 상세 모달 */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        onCopySuccess={showToast}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
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