'use client';

import { useEffect } from 'react';
import type { Event } from '@/types/calendar';
import { getCategoryInfo, formatTime } from '@/lib/calendar-utils';
import { ClockIcon, MapPinIcon, XMarkIcon, DocumentDuplicateIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess: (message: string, type?: 'success' | 'error') => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

export default function EventDetailModal({ event, isOpen, onClose, onCopySuccess, onEdit, onDelete }: EventDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyEvent = () => {
    if (!event) return;

    const categoryInfo = getCategoryInfo(event.category);
    const eventText = `${event.title}\n` +
      `${categoryInfo.icon} ${categoryInfo.label}\n` +
      `📅 ${event.date.getFullYear()}년 ${event.date.getMonth() + 1}월 ${event.date.getDate()}일\n` +
      (event.isAllDay ? '⏰ 종일\n' :
        event.startTime ? `⏰ ${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}\n` : '') +
      (event.location ? `📍 ${event.location}\n` : '') +
      (event.description ? `📝 ${event.description}` : '');

    navigator.clipboard.writeText(eventText).then(() => {
      onCopySuccess('일정 정보가 복사되었습니다! 📋', 'success');
      onClose();
    }).catch(() => {
      onCopySuccess('복사에 실패했습니다. 다시 시도해주세요.', 'error');
    });
  };

  if (!isOpen || !event) return null;

  const categoryInfo = getCategoryInfo(event.category);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
          {/* 핸들바 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-lg font-bold text-gray-900">일정 상세정보</h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleCopyEvent}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="일정 정보 복사"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </button>
              {onEdit && (
                <button
                  onClick={() => {
                    if (event) {
                      onEdit(event);
                      onClose();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="일정 수정"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (event) {
                      onDelete(event);
                      onClose();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="일정 삭제"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 내용 */}
          <div className="px-4 pb-6 space-y-4">
            {/* 제목 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {event.title}
              </h3>
            </div>

            {/* 조직 정보 */}
            <div className="flex items-center">
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: categoryInfo.lightColor,
                  color: categoryInfo.textColor
                }}
              >
                {categoryInfo.icon} {categoryInfo.label}
              </span>
            </div>

            {/* 날짜 */}
            <div className="flex items-center text-gray-700">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="font-medium">
                  {format(event.date, 'M월 d일 (E)', { locale: ko })}
                </p>
              </div>
            </div>

            {/* 시간 정보 */}
            <div className="flex items-center text-gray-700">
              <ClockIcon className="w-6 h-6 mr-3 text-gray-500" />
              <div>
                {event.isAllDay ? (
                  <p className="font-medium">종일</p>
                ) : (
                  <p className="font-medium">
                    {event.startTime && formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </p>
                )}
              </div>
            </div>

            {/* 장소 정보 */}
            {event.location && (
              <div className="flex items-center text-gray-700">
                <MapPinIcon className="w-6 h-6 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {/* 설명 */}
            {event.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">상세 내용</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}