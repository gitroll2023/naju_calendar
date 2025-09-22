'use client';

import { useState, useEffect } from 'react';
import type { Event, ChurchCategory } from '@/types/calendar';
import { CHURCH_CATEGORIES } from '@/lib/calendar-utils';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface EditEventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: Event) => Promise<void>;
  onCancel: () => void;
}

export default function EditEventModal({ event, isOpen, onClose, onSave, onCancel }: EditEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'church' as ChurchCategory,
    date: '',
    isAllDay: false,
    startTime: '',
    endTime: '',
    location: '',
    description: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title,
        category: event.category,
        date: format(event.date, 'yyyy-MM-dd'),
        isAllDay: event.isAllDay,
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        location: event.location || '',
        description: event.description || ''
      });
      setErrors({});
    }
  }, [event, isOpen]);

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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '일정 제목을 입력해주세요.';
    }

    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요.';
    }

    if (!formData.isAllDay) {
      if (!formData.startTime) {
        newErrors.startTime = '시작 시간을 입력해주세요.';
      }
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !event) return;

    setIsSubmitting(true);

    try {
      const updatedEvent: Event = {
        ...event,
        title: formData.title.trim(),
        category: formData.category,
        date: new Date(formData.date),
        isAllDay: formData.isAllDay,
        startTime: formData.isAllDay ? undefined : formData.startTime || undefined,
        endTime: formData.isAllDay ? undefined : formData.endTime || undefined,
        location: formData.location.trim() || undefined,
        description: formData.description.trim() || undefined
      };

      await onSave(updatedEvent);
      onClose();
    } catch {
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* 핸들바 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">일정 수정</h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 일정 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일정 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="일정 제목을 입력하세요"
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            {/* 조직 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                조직 *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as ChurchCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(CHURCH_CATEGORIES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜 *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>

            {/* 종일 일정 체크박스 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAllDay"
                checked={formData.isAllDay}
                onChange={(e) => handleInputChange('isAllDay', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-700">
                종일 일정
              </label>
            </div>

            {/* 시간 설정 */}
            {!formData.isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 시간 *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.startTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.startTime && <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.endTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.endTime && <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>}
                </div>
              </div>
            )}

            {/* 장소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                장소
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="장소를 입력하세요"
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="일정에 대한 설명을 입력하세요"
              />
            </div>

            {/* 버튼 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>수정 중...</span>
                  </div>
                ) : (
                  '수정 완료'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}