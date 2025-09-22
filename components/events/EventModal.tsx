'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { XMarkIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { Event, ChurchCategory } from '@/types/calendar';
import { useCalendarStore } from '@/lib/store';
import { CHURCH_CATEGORIES, getCategoryInfo } from '@/lib/calendar-utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
  onSuccess?: (message: string) => void;
  onCancel?: (message: string) => void;
}

const CHURCH_CATEGORY_OPTIONS = Object.entries(CHURCH_CATEGORIES).map(([key, value]) => ({
  value: key as ChurchCategory,
  label: value.label,
  color: value.color,
  lightColor: value.lightColor,
  icon: value.icon,
}));

export default function EventModal({ isOpen, onClose, selectedDate, onSuccess, onCancel }: EventModalProps) {
  const { addEvent } = useCalendarStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    isAllDay: false,
    category: 'church' as ChurchCategory,
    location: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '일정 제목을 입력해주세요';
    }

    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요';
    }

    if (!formData.isAllDay) {
      if (!formData.startTime) {
        newErrors.startTime = '시작 시간을 입력해주세요';
      }
      if (!formData.endTime) {
        newErrors.endTime = '종료 시간을 입력해주세요';
      }
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        title: formData.title.trim(),
        date: new Date(formData.date),
        startTime: formData.isAllDay ? undefined : formData.startTime,
        endTime: formData.isAllDay ? undefined : formData.endTime,
        category: formData.category,
        location: formData.location.trim() || undefined,
        description: formData.description.trim() || undefined,
        isAllDay: formData.isAllDay,
      };

      await addEvent(eventData);

      // 폼 초기화
      setFormData({
        title: '',
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        isAllDay: false,
        category: 'church' as ChurchCategory,
        location: '',
        description: '',
      });

      onClose();

      // 성공 알림
      if (onSuccess) {
        onSuccess('일정이 추가되었습니다! ✅');
      }
    } catch (error) {
      if (onSuccess) {
        onSuccess('일정 추가에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* 모달 */}
      <div className="fixed inset-x-4 top-20 bottom-20 bg-white rounded-xl shadow-2xl overflow-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">일정 추가</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              일정 제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="예: 주일예배, 찬양대 연습"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
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
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* 종일 여부 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => handleInputChange('isAllDay', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">종일 일정</span>
            </label>
          </div>

          {/* 시간 */}
          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
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
                {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  종료 시간 *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
              </div>
            </div>
          )}

          {/* 조직별 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              교회 조직 *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHURCH_CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleInputChange('category', category.value)}
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                    formData.category === category.value
                      ? 'border-gray-400 ring-2 ring-gray-300 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: formData.category === category.value ? category.lightColor : '#fff'
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {category.icon} {category.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              장소
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="예: 본당, 청년부실, 교육관"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="w-4 h-4 inline mr-1" />
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="일정에 대한 상세한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onCancel) {
                  onCancel('일정 추가가 취소되었습니다.');
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>저장 중...</span>
                </div>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}