'use client';

import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/lib/store';
import { isSaturday, isSunday } from '@/lib/calendar-utils';
import { isSameDay } from 'date-fns';
import type { CalendarDay as CalendarDayType } from '@/types/calendar';
import EventIndicator from '../events/EventIndicator';

interface CalendarDayProps {
  day: CalendarDayType;
}

export default function CalendarDay({ day }: CalendarDayProps) {
  const { selectedDate, selectDate } = useCalendarStore();

  const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
  const dayNumber = day.date.getDate();
  const isSat = isSaturday(day.date);
  const isSun = isSunday(day.date);

  const handleClick = () => {
    selectDate(day.date);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-start p-1 min-h-[100px] cursor-pointer transition-all duration-200 touch-manipulation',
        'border-r border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100',
        {
          'bg-blue-50 border-blue-200': isSelected && !day.isToday,
          'bg-gray-50': !day.isCurrentMonth,
        }
      )}
    >
      {/* 날짜 숫자 */}
      <div className={cn(
        'flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full mb-1 transition-all duration-200',
        {
          // 오늘 날짜
          'bg-blue-600 text-white font-bold shadow-md': day.isToday,
          // 선택된 날짜 (오늘이 아닌 경우)
          'bg-blue-100 text-blue-800 font-semibold ring-2 ring-blue-300': isSelected && !day.isToday,
          // 다른 달 날짜
          'text-gray-300': !day.isCurrentMonth,
          // 일요일
          'text-red-600 font-semibold': isSun && day.isCurrentMonth && !day.isToday && !isSelected,
          // 토요일
          'text-blue-600 font-semibold': isSat && day.isCurrentMonth && !day.isToday && !isSelected,
          // 평일
          'text-gray-800 hover:bg-gray-100': !isSun && !isSat && day.isCurrentMonth && !day.isToday && !isSelected,
        }
      )}>
        {dayNumber}
      </div>

      {/* 이벤트 인디케이터 */}
      {day.events.length > 0 && (
        <div className="w-full mt-1">
          <EventIndicator events={day.events} />
        </div>
      )}
    </div>
  );
}