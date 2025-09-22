'use client';

import { useCalendarStore } from '@/lib/store';
import { getCalendarMonth } from '@/lib/calendar-utils';
import CalendarWeekDays from './CalendarWeekDays';
import CalendarDay from './CalendarDay';

export default function CalendarGrid() {
  const { currentDate, getFilteredEvents } = useCalendarStore();

  const filteredEvents = getFilteredEvents();
  const calendarMonth = getCalendarMonth(currentDate, filteredEvents);

  return (
    <div className="bg-white">
      {/* 요일 헤더 */}
      <CalendarWeekDays />

      {/* 캘린더 그리드 */}
      <div className="divide-y divide-gray-100">
        {calendarMonth.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.days.map((day, dayIndex) => (
              <CalendarDay
                key={`${weekIndex}-${dayIndex}`}
                day={day}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}