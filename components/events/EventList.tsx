'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Event } from '@/types/calendar';
import { getCategoryInfo, formatTime } from '@/lib/calendar-utils';
import { ClockIcon, MapPinIcon, DocumentDuplicateIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Toast from '../ui/Toast';

interface EventListProps {
  events: Event[];
  selectedDate: Date | null;
  onAddEvent?: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

export default function EventList({ events, selectedDate, onAddEvent, onEdit, onDelete }: EventListProps) {
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as const });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  if (!selectedDate) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <p className="text-sm">날짜를 선택하여 일정을 확인하세요</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <div className="text-center">
          <p className="text-sm font-medium">
            {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
          </p>
          <p className="text-xs mt-1 mb-3">등록된 일정이 없습니다</p>
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              일정 추가
            </button>
          )}
        </div>
      </div>
    );
  }

  // 시간대별로 일정 정렬
  const sortedEvents = [...events].sort((a, b) => {
    // 종일 일정은 위에
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    if (a.isAllDay && b.isAllDay) return 0;

    // 시간이 있는 일정은 시간순으로
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    if (a.startTime && !b.startTime) return -1;
    if (!a.startTime && b.startTime) return 1;

    return 0;
  });

  return (
    <div className="p-4">
      {/* 선택된 날짜 표시 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
        </h3>
        <p className="text-sm text-gray-600">{events.length}개의 일정</p>
      </div>

      {/* 일정 목록 */}
      <div className="space-y-3">
        {sortedEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onCopySuccess={showToast}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* 일정 추가 버튼 */}
        {onAddEvent && (
          <button
            onClick={onAddEvent}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <span className="text-sm font-medium">+ 일정 추가</span>
          </button>
        )}
      </div>

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

interface EventItemProps {
  event: Event;
  onCopySuccess: (message: string, type?: 'success' | 'error') => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

function EventItem({ event, onCopySuccess, onEdit, onDelete }: EventItemProps) {
  const categoryInfo = getCategoryInfo(event.category);

  const handleCopyEvent = () => {
    const eventText = `${event.title}\n` +
      `${categoryInfo.icon} ${categoryInfo.label}\n` +
      `📅 ${event.date.getFullYear()}년 ${event.date.getMonth() + 1}월 ${event.date.getDate()}일\n` +
      (event.isAllDay ? '⏰ 종일\n' :
        event.startTime ? `⏰ ${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}\n` : '') +
      (event.location ? `📍 ${event.location}\n` : '') +
      (event.description ? `📝 ${event.description}` : '');

    navigator.clipboard.writeText(eventText).then(() => {
      onCopySuccess('일정 정보가 복사되었습니다! 📋', 'success');
    }).catch(() => {
      onCopySuccess('복사에 실패했습니다. 다시 시도해주세요.', 'error');
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        {/* 카테고리 인디케이터 */}
        <div className="flex items-center mt-1 flex-shrink-0">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryInfo.color }}
          />
          <span className="text-xs text-gray-500 ml-1">
            {categoryInfo.icon}
          </span>
        </div>

        {/* 일정 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-base font-semibold text-gray-900 truncate flex-1">
              {event.title}
            </h4>
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              <button
                onClick={handleCopyEvent}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="일정 정보 복사"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="일정 수정"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(event)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="일정 삭제"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 조직 정보 */}
          <div className="flex items-center mt-2 text-sm">
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: categoryInfo.lightColor,
                color: categoryInfo.textColor
              }}
            >
              {categoryInfo.icon} {categoryInfo.label}
            </span>
          </div>

          {/* 시간 정보 */}
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-1" />
            {event.isAllDay ? (
              <span>종일</span>
            ) : (
              <span>
                {event.startTime && formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </span>
            )}
          </div>

          {/* 장소 정보 */}
          {event.location && (
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* 설명 */}
          {event.description && (
            <p className="mt-2 text-sm text-gray-700 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}