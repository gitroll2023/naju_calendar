'use client';

import { useState } from 'react';
import { useCalendarStore } from '@/lib/store';
import { getCategoryInfo, formatTime } from '@/lib/calendar-utils';
import { isSameDay } from 'date-fns';
import { ClockIcon, MapPinIcon, DocumentDuplicateIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Event } from '@/types/calendar';
import Toast from '../ui/Toast';
import EditEventModal from '../ui/EditEventModal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';

export default function DayView() {
  const { currentDate, getFilteredEvents, updateEvent, deleteEvent } = useCalendarStore();
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success' });
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 필터링된 이벤트들 중 현재 날짜의 이벤트만
  const filteredEvents = getFilteredEvents();
  const dayEvents = filteredEvents.filter(event =>
    isSameDay(event.date, currentDate)
  );

  // 종일 일정과 시간 일정 분리
  const allDayEvents = dayEvents.filter(event => event.isAllDay);
  const timedEvents = dayEvents
    .filter(event => !event.isAllDay)
    .sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime.localeCompare(b.startTime);
    });

  // 시간대별 슬롯 생성 (6시부터 23시까지)
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const eventsInSlot = timedEvents.filter(event => {
      if (!event.startTime) return false;
      const eventHour = parseInt(event.startTime.split(':')[0]);
      return eventHour === hour;
    });

    timeSlots.push({
      time: timeString,
      displayTime: hour < 12 ? `오전 ${hour === 0 ? 12 : hour}:00` :
                   hour === 12 ? '오후 12:00' : `오후 ${hour - 12}:00`,
      events: eventsInSlot
    });
  }

  const handleCopyEvent = (event: Event) => {
    const categoryInfo = getCategoryInfo(event.category);
    const eventText = `${event.title}\n` +
      `${categoryInfo.icon} ${categoryInfo.label}\n` +
      `📅 ${event.date.getFullYear()}년 ${event.date.getMonth() + 1}월 ${event.date.getDate()}일\n` +
      (event.isAllDay ? '⏰ 종일\n' :
        event.startTime ? `⏰ ${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}\n` : '') +
      (event.location ? `📍 ${event.location}\n` : '') +
      (event.description ? `📝 ${event.description}` : '');

    navigator.clipboard.writeText(eventText).then(() => {
      showToast('일정 정보가 복사되었습니다! 📋', 'success');
    }).catch(() => {
      showToast('복사에 실패했습니다. 다시 시도해주세요.', 'error');
    });
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
      {/* 날짜 헤더 */}
      <div className="p-4 border-b border-gray-200">
     
        <p className="text-sm text-gray-600 mt-1">
          총 {dayEvents.length}개의 일정
        </p>
      </div>

      <div className="p-4">
        {/* 종일 일정 섹션 */}
        {allDayEvents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">종일 일정</h3>
            <div className="space-y-2">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: getCategoryInfo(event.category).color,
                    backgroundColor: getCategoryInfo(event.category).lightColor
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: getCategoryInfo(event.category).color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900">
                          {event.title}
                        </h4>
                        <div className="flex items-center mt-1 text-sm">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getCategoryInfo(event.category).lightColor,
                              color: getCategoryInfo(event.category).textColor
                            }}
                          >
                            {getCategoryInfo(event.category).icon} {getCategoryInfo(event.category).label}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.description && (
                          <p className="mt-2 text-sm text-gray-700">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopyEvent(event)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="일정 정보 복사"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="일정 수정"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="일정 삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시간대별 일정 */}
        {timedEvents.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">시간별 일정</h3>
            <div className="space-y-1">
              {timeSlots.map((slot) => (
                <div key={slot.time} className="flex">
                  {/* 시간 표시 */}
                  <div className="w-20 flex-shrink-0 text-xs text-gray-500 py-2 pr-3 text-right">
                    {slot.events.length > 0 && slot.displayTime}
                  </div>

                  {/* 일정 표시 */}
                  <div className="flex-1 min-h-[20px] border-l border-gray-100 pl-3">
                    {slot.events.map((event) => (
                      <div
                        key={event.id}
                        className="mb-2 p-3 rounded-lg border-l-4"
                        style={{
                          borderLeftColor: getCategoryInfo(event.category).color,
                          backgroundColor: getCategoryInfo(event.category).lightColor
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                              style={{ backgroundColor: getCategoryInfo(event.category).color }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900">
                                {event.title}
                              </h4>
                              <div className="flex items-center mt-1 text-sm">
                                <span
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: getCategoryInfo(event.category).lightColor,
                                    color: getCategoryInfo(event.category).textColor
                                  }}
                                >
                                  {getCategoryInfo(event.category).icon} {getCategoryInfo(event.category).label}
                                </span>
                              </div>
                              <div className="flex items-center mt-1 text-sm text-gray-600">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                <span>
                                  {event.startTime && formatTime(event.startTime)}
                                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                                </span>
                              </div>
                              {event.location && (
                                <div className="flex items-center mt-1 text-sm text-gray-600">
                                  <MapPinIcon className="w-4 h-4 mr-1" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {event.description && (
                                <p className="mt-2 text-sm text-gray-700">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                            <button
                              onClick={() => handleCopyEvent(event)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                              title="일정 정보 복사"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="일정 수정"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="일정 삭제"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : allDayEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📅</div>
            <p className="text-gray-500">이 날에는 등록된 일정이 없습니다</p>
          </div>
        ) : null}
      </div>

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