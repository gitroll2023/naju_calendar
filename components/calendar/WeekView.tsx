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
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as const });

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
      {/* 주간 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div key={index} className="p-3 text-center border-r border-gray-100 last:border-r-0">
            <div className="text-xs text-gray-600 mb-1">
              {WEEK_DAYS[index]}
            </div>
            <button
              onClick={() => handleDateClick(day)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                isToday(day)
                  ? 'bg-blue-600 text-white'
                  : selectedDate && isSameDay(day, selectedDate)
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {format(day, 'd')}
            </button>
          </div>
        ))}
      </div>

      {/* 시간대별 일정 표시 */}
      <div className="grid grid-cols-7">
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDate(day);

          return (
            <div key={dayIndex} className="border-r border-gray-100 last:border-r-0 min-h-[400px] p-2">
              {/* 종일 일정 */}
              {dayEvents
                .filter(event => event.isAllDay)
                .map((event) => (
                  <div
                    key={event.id}
                    className="mb-1 p-1 rounded text-xs font-medium text-white truncate cursor-pointer touch-manipulation"
                    style={{ backgroundColor: getCategoryInfo(event.category).color }}
                    onClick={() => handleEventClick(event)}
                  >
                    {event.title}
                  </div>
                ))}

              {/* 시간 일정 */}
              {dayEvents
                .filter(event => !event.isAllDay)
                .sort((a, b) => {
                  if (!a.startTime || !b.startTime) return 0;
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((event) => (
                  <div
                    key={event.id}
                    className="mb-1 p-1 rounded text-xs cursor-pointer border-l-2 touch-manipulation"
                    style={{
                      borderLeftColor: getCategoryInfo(event.category).color,
                      backgroundColor: getCategoryInfo(event.category).lightColor
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {event.title}
                    </div>
                    {event.startTime && (
                      <div className="text-gray-600">
                        {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </div>
                    )}
                  </div>
                ))}
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