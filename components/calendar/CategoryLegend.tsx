'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CHURCH_CATEGORIES, getCategoryInfo } from '@/lib/calendar-utils';
import { useCalendarStore } from '@/lib/store';
import type { ChurchCategory, Event } from '@/types/calendar';

export default function CategoryLegend() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { events, activeCategories, setActiveCategories, toggleCategory, currentDate } = useCalendarStore();

  // 현재 달에 해당하는 이벤트들만 필터링
  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === currentDate.getFullYear() &&
           eventDate.getMonth() === currentDate.getMonth();
  });

  // 각 카테고리별 이벤트 수 계산 (현재 달만)
  const categoryStats = Object.keys(CHURCH_CATEGORIES).reduce((acc, category) => {
    const categoryKey = category as ChurchCategory;
    const count = currentMonthEvents.filter(event => event.category === categoryKey).length;
    acc[categoryKey] = count;
    return acc;
  }, {} as Record<ChurchCategory, number>);

  const handleToggleCategory = (category: ChurchCategory) => {
    toggleCategory(category);
  };

  const handleToggleAll = () => {
    if (activeCategories.size === Object.keys(CHURCH_CATEGORIES).length) {
      setActiveCategories(new Set());
    } else {
      setActiveCategories(new Set(Object.keys(CHURCH_CATEGORIES) as ChurchCategory[]));
    }
  };

  return (
    <div className="bg-white border-b border-gray-100">
      {/* 범례 토글 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          조직별 일정 범례 & 검색
        </span>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* 범례 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* 검색 바 */}
          <div className="relative">
            <input
              type="text"
              placeholder="일정, 장소, 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* 검색 결과 */}
          {searchQuery && (
            <SearchResults query={searchQuery} events={currentMonthEvents} />
          )}

          {/* 전체 선택/해제 버튼 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleToggleAll}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {activeCategories.size === Object.keys(CHURCH_CATEGORIES).length ? '전체 해제' : '전체 선택'}
            </button>
            <span className="text-xs text-gray-500">
              {activeCategories.size}/{Object.keys(CHURCH_CATEGORIES).length} 선택됨
            </span>
          </div>

          {/* 카테고리 목록 */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CHURCH_CATEGORIES).map(([key, info]) => {
              const category = key as ChurchCategory;
              const isActive = activeCategories.has(category);
              const count = categoryStats[category];

              return (
                <button
                  key={category}
                  onClick={() => handleToggleCategory(category)}
                  className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
                    isActive
                      ? 'border-gray-300 bg-gray-50 shadow-sm'
                      : 'border-gray-200 bg-gray-100 opacity-50'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: info.color }}
                  />
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium text-gray-700">
                      {info.icon} {info.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {count}개 일정
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 검색 결과 컴포넌트
interface SearchResultsProps {
  query: string;
  events: Event[];
}

function SearchResults({ query, events }: SearchResultsProps) {
  const filteredEvents = events.filter(event => {
    const searchTerm = query.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchTerm) ||
      event.location?.toLowerCase().includes(searchTerm) ||
      event.description?.toLowerCase().includes(searchTerm)
    );
  });

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">"검색어"와 일치하는 일정이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">
          검색 결과 ({filteredEvents.length}개)
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {filteredEvents.map((event) => {
          const categoryInfo = getCategoryInfo(event.category);
          return (
            <div
              key={event.id}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-2">
                <div
                  className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: categoryInfo.color }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-gray-900 truncate">
                    {event.title}
                  </h4>
                  <div className="text-xs text-gray-500 mt-1">
                    {categoryInfo.icon} {categoryInfo.label}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-500 mt-1">
                      📍 {event.location}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    📅 {event.date.getMonth() + 1}월 {event.date.getDate()}일
                    {event.startTime && (
                      <span className="ml-2">
                        🕰️ {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}