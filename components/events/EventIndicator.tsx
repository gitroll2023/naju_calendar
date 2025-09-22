import type { Event } from '@/types/calendar';
import { getCategoryInfo } from '@/lib/calendar-utils';

interface EventIndicatorProps {
  events: Event[];
}

export default function EventIndicator({ events }: EventIndicatorProps) {
  if (events.length === 0) return null;

  // 최근 일정을 기준으로 정렬 (최신순)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 최대 2개의 일정을 텍스트로 표시
  const displayEvents = sortedEvents.slice(0, 2);
  const hiddenCount = sortedEvents.length - displayEvents.length;

  return (
    <div className="flex flex-col space-y-1 w-full">
      {/* 일정들을 텍스트로 표시 */}
      {displayEvents.map((event) => (
        <div
          key={event.id}
          className="text-[10px] font-medium px-1 py-0.5 rounded text-white truncate text-center leading-tight"
          style={{ backgroundColor: getCategoryInfo(event.category).color }}
          title={event.title}
        >
          {event.title}
        </div>
      ))}

      {/* 숨겨진 일정이 있으면 표시 */}
      {hiddenCount > 0 && (
        <div
          className="text-[10px] font-medium px-1 py-0.5 rounded text-white text-center bg-gray-500"
          title={`+${hiddenCount}개 더`}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
}