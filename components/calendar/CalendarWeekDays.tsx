import { WEEK_DAYS } from '@/lib/calendar-utils';

export default function CalendarWeekDays() {
  return (
    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
      {WEEK_DAYS.map((day, index) => (
        <div
          key={day}
          className={`
            py-4 text-center text-sm font-semibold tracking-wide
            ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'}
          `}
        >
          {day}
        </div>
      ))}
    </div>
  );
}