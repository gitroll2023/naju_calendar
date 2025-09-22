'use client';

import { useEffect } from 'react';
import type { Event } from '@/types/calendar';
import { getCategoryInfo } from '@/lib/calendar-utils';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DeleteConfirmModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (event: Event) => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ event, isOpen, onClose, onConfirm, onCancel }: DeleteConfirmModalProps) {
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

  const handleConfirm = () => {
    if (event) {
      onConfirm(event);
      onClose();
    }
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  if (!isOpen || !event) return null;

  const categoryInfo = getCategoryInfo(event.category);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-bold text-gray-900">일정 삭제</h2>
            </div>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 내용 */}
          <div className="p-4">
            <p className="text-gray-700 mb-4">
              다음 일정을 정말 삭제하시겠습니까?
            </p>

            {/* 일정 정보 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <div
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: categoryInfo.color }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {event.title}
                  </h4>
                  <div className="flex items-center mt-1">
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
                  <div className="text-xs text-gray-600 mt-1">
                    📅 {format(event.date, 'yyyy년 M월 d일 (E)', { locale: ko })}
                    {!event.isAllDay && event.startTime && (
                      <span className="ml-2">
                        🕰️ {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </span>
                    )}
                    {event.isAllDay && <span className="ml-2">🕰️ 종일</span>}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-600 mt-1">
                      📍 {event.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 text-center">
              삭제된 일정은 복구할 수 없습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 p-4 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              아니오
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              예, 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}