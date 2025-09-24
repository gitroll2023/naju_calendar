'use client';

import { useState } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { parseExcelToEvents, convertToCalendarEvents } from '@/lib/excel-parser';
import { useCalendarStore } from '@/lib/store';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Event } from '@/types/calendar';
import { CHURCH_CATEGORIES } from '@/lib/calendar-utils';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

interface PreviewEvent extends Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {
  tempId: string;
  selected: boolean;
  isDuplicate?: boolean;
}

export default function ExcelUploadModal({ isOpen, onClose, onSuccess }: ExcelUploadModalProps) {
  const { addEvent, events, checkDuplicate, deleteEvent } = useCalendarStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'importing' | 'preview' | 'success' | 'error'>('idle');
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);
  const [showDeleteRecent, setShowDeleteRecent] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 형식 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      setUploadStatus('error');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('parsing');
      setErrorMessage('');

      // 엑셀 파일 파싱
      const parsedEvents = await parseExcelToEvents(file);
      const calendarEvents = convertToCalendarEvents(parsedEvents);

      if (calendarEvents.length === 0) {
        setErrorMessage('엑셀 파일에서 일정을 찾을 수 없습니다.');
        setUploadStatus('error');
        return;
      }

      // 중복 체크 및 미리보기 데이터 생성
      let duplicateCount = 0;
      const previewData: PreviewEvent[] = calendarEvents.map((event, index) => {
        const isDuplicate = checkDuplicate(event);
        if (isDuplicate) duplicateCount++;

        return {
          ...event,
          tempId: `temp-${index}`,
          selected: !isDuplicate, // 중복된 항목은 기본적으로 선택 해제
          isDuplicate
        };
      });

      // 중복 경고 메시지
      if (duplicateCount > 0) {
        setErrorMessage(`⚠️ ${duplicateCount}개의 중복된 일정이 발견되어 선택 해제되었습니다.`);
      }

      setPreviewEvents(previewData);
      setUploadStatus('preview');

    } catch {
      setErrorMessage('파일 처리 중 오류가 발생했습니다.');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      event.target.value = '';
    }
  };

  const handleImportEvents = async () => {
    const selectedEvents = previewEvents.filter(event => event.selected);

    if (selectedEvents.length === 0) {
      setErrorMessage('선택된 일정이 없습니다.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('importing');

      // 선택된 이벤트만 데이터베이스에 추가
      for (const eventData of selectedEvents) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tempId, selected, ...event } = eventData;
        // DB 저장용 날짜 조정 (하루 더하기)
        const adjustedDate = new Date(event.date);
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        const adjustedEvent = { ...event, date: adjustedDate };
        await addEvent(adjustedEvent);
      }

      // 최근 추가된 이벤트 추적 (현재 시간 기준으로)
      const now = new Date();
      const recentEvents = events.filter(e => {
        const createdAt = new Date(e.createdAt);
        return (now.getTime() - createdAt.getTime()) < 60000; // 최근 1분 이내 추가된 이벤트
      });
      setRecentlyAddedIds(recentEvents.map(e => e.id));

      setUploadStatus('success');

      if (onSuccess) {
        onSuccess(`${selectedEvents.length}개의 일정이 성공적으로 추가되었습니다! 📅`);
      }

      // 2초 후 모달 닫기
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);

    } catch {
      setErrorMessage('일정 추가 중 오류가 발생했습니다.');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleEventSelection = (tempId: string) => {
    setPreviewEvents(prev =>
      prev.map(event =>
        event.tempId === tempId
          ? { ...event, selected: !event.selected }
          : event
      )
    );
  };

  const updateEventField = (tempId: string, field: string, value: unknown) => {
    setPreviewEvents(prev =>
      prev.map(event =>
        event.tempId === tempId
          ? { ...event, [field]: value }
          : event
      )
    );
  };

  const removeEvent = (tempId: string) => {
    setPreviewEvents(prev => prev.filter(event => event.tempId !== tempId));
  };

  const selectAllEvents = () => {
    setPreviewEvents(prev => prev.map(event => ({ ...event, selected: true })));
  };

  const deselectAllEvents = () => {
    setPreviewEvents(prev => prev.map(event => ({ ...event, selected: false })));
  };

  const resetModal = () => {
    setUploadStatus('idle');
    setPreviewEvents([]);
    setErrorMessage('');
    setIsUploading(false);
    setEditingEvent(null);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  // 날짜별로 그룹핑
  const groupedEvents = previewEvents.reduce((groups, event) => {
    // 미리보기용 날짜 조정 (하루 더하기)
    const adjustedDate = new Date(event.date);
    adjustedDate.setDate(adjustedDate.getDate() + 1);

    // 로컬 날짜 문자열 생성 (시간대 영향 받지 않도록)
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, PreviewEvent[]>);

  const selectedCount = previewEvents.filter(e => e.selected).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />

      {/* 모달 */}
      <div className="fixed inset-x-4 top-10 bottom-10 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">엑셀 일정 가져오기</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-auto">
          {/* 업로드 영역 */}
          {uploadStatus === 'idle' && (
            <div className="p-6">
              {/* 최근 추가된 일정 삭제 버튼 */}
              {recentlyAddedIds.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        최근에 추가된 {recentlyAddedIds.length}개의 일정이 있습니다.
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        잘못 추가된 경우 삭제할 수 있습니다.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteRecent(true)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 inline mr-1" />
                      일괄 삭제
                    </button>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">엑셀 파일 선택</h3>
                <p className="text-gray-600 mb-4">나주지역 일정 엑셀 파일을 업로드해주세요</p>

                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                  <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                  파일 선택
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <p className="text-sm text-gray-500 mt-2">지원 형식: .xlsx, .xls</p>
              </div>
            </div>
          )}

          {/* 로딩 상태 */}
          {uploadStatus === 'parsing' && (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">엑셀 파일을 분석하고 있습니다...</p>
            </div>
          )}

          {uploadStatus === 'importing' && (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">선택한 일정을 캘린더에 추가하고 있습니다...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {uploadStatus === 'error' && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setUploadStatus('idle')}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* 미리보기 상태 */}
          {uploadStatus === 'preview' && (
            <div className="p-6">
              {/* 상태 헤더 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
                    <p className="text-blue-700">
                      {previewEvents.length}개의 일정을 찾았습니다.
                      ({selectedCount}개 선택됨)
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllEvents}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      전체 선택
                    </button>
                    <button
                      onClick={deselectAllEvents}
                      className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      전체 해제
                    </button>
                  </div>
                </div>
              </div>

              {/* 일정 미리보기 (날짜별 그룹) */}
              <div className="space-y-6">
                {Object.entries(groupedEvents)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateKey, events]) => (
                    <div key={dateKey} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h3 className="font-medium text-gray-900">
                          {(() => {
                            const [year, month, day] = dateKey.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return format(date, 'M월 d일 (E)', { locale: ko });
                          })()}
                          <span className="ml-2 text-sm text-gray-500">
                            ({events.filter(e => e.selected).length}/{events.length}개 선택)
                          </span>
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {events.map((event) => (
                          <EventPreviewItem
                            key={event.tempId}
                            event={event}
                            isEditing={editingEvent === event.tempId}
                            onToggleSelection={() => toggleEventSelection(event.tempId)}
                            onStartEdit={() => setEditingEvent(event.tempId)}
                            onStopEdit={() => setEditingEvent(null)}
                            onUpdateField={(field, value) => updateEventField(event.tempId, field, value)}
                            onRemove={() => removeEvent(event.tempId)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 성공 상태 */}
          {uploadStatus === 'success' && (
            <div className="p-6 text-center">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-700 text-lg font-medium">일정이 성공적으로 추가되었습니다!</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {uploadStatus === 'preview' && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <button
                onClick={() => setUploadStatus('idle')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleImportEvents}
                disabled={isUploading || selectedCount === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? '추가 중...' : `선택한 ${selectedCount}개 일정 추가`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 최근 추가된 일정 삭제 확인 모달 */}
      {showDeleteRecent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteRecent(false)} />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              최근 추가된 일정 삭제
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              최근 1분 이내에 추가된 {recentlyAddedIds.length}개의 일정을 모두 삭제하시겠습니까?
            </p>
            <p className="text-xs text-red-600 mb-4">
              ⚠️ 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteRecent(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  try {
                    for (const id of recentlyAddedIds) {
                      await deleteEvent(id);
                    }
                    if (onSuccess) {
                      onSuccess(`${recentlyAddedIds.length}개의 일정이 삭제되었습니다.`);
                    }
                    setRecentlyAddedIds([]);
                    setShowDeleteRecent(false);
                  } catch {
                    if (onSuccess) {
                      onSuccess('일정 삭제 중 오류가 발생했습니다.', 'error');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 개별 이벤트 미리보기 컴포넌트
interface EventPreviewItemProps {
  event: PreviewEvent;
  isEditing: boolean;
  onToggleSelection: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdateField: (field: string, value: unknown) => void;
  onRemove: () => void;
}

function EventPreviewItem({
  event,
  isEditing,
  onToggleSelection,
  onStartEdit,
  onStopEdit,
  onUpdateField,
  onRemove
}: EventPreviewItemProps) {
  return (
    <div className={`p-4 ${event.selected ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="flex items-start space-x-3">
        {/* 체크박스 */}
        <input
          type="checkbox"
          checked={event.selected}
          onChange={onToggleSelection}
          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
        />

        {/* 이벤트 내용 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              {/* 제목 편집 */}
              <input
                type="text"
                value={event.title}
                onChange={(e) => onUpdateField('title', e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="일정 제목"
              />

              {/* 시간 편집 */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={event.isAllDay}
                    onChange={(e) => onUpdateField('isAllDay', e.target.checked)}
                    className="h-3 w-3"
                  />
                  <span className="text-xs text-gray-600">종일</span>
                </label>

                {!event.isAllDay && (
                  <>
                    <input
                      type="time"
                      value={event.startTime || ''}
                      onChange={(e) => onUpdateField('startTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                    <span className="text-xs text-gray-500">~</span>
                    <input
                      type="time"
                      value={event.endTime || ''}
                      onChange={(e) => onUpdateField('endTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </>
                )}
              </div>

              {/* 장소 편집 */}
              <input
                type="text"
                value={event.location || ''}
                onChange={(e) => onUpdateField('location', e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="장소 (선택사항)"
              />

              {/* 저장/취소 버튼 */}
              <div className="flex space-x-2">
                <button
                  onClick={onStopEdit}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  저장
                </button>
                <button
                  onClick={onStopEdit}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: CHURCH_CATEGORIES[event.category]?.lightColor || '#DBEAFE',
                    color: CHURCH_CATEGORIES[event.category]?.textColor || '#1E40AF'
                  }}
                >
                  {CHURCH_CATEGORIES[event.category]?.label || '교회'}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  {event.isAllDay
                    ? '종일'
                    : `${event.startTime || ''} - ${event.endTime || ''}`
                  }
                </div>
                {event.location && (
                  <div className="flex items-center text-xs text-gray-500">
                    📍 {event.location}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        {!isEditing && (
          <div className="flex space-x-1">
            <button
              onClick={onStartEdit}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="편집"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="삭제"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}