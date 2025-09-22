import type { Event } from '@/types/calendar';
import { getCategoryInfo } from '@/lib/calendar-utils';

interface EventIndicatorProps {
  events: Event[];
}

export default function EventIndicator({ events }: EventIndicatorProps) {
  if (events.length === 0) return null;

  // 교회일정(church 카테고리)이 있는지 확인
  const churchEvents = events.filter(event => event.category === 'church');
  const otherEvents = events.filter(event => event.category !== 'church');
  const hasChurchEvent = churchEvents.length > 0;

  // 3개 이하면 모든 이벤트를 작은 바로 표시 (교회일정 제외)
  if (events.length <= 3 && !hasChurchEvent) {
    return (
      <div className="flex flex-col space-y-1 w-full">
        {events.map((event) => (
          <div
            key={event.id}
            className="h-1 rounded-full w-full"
            style={{ backgroundColor: getCategoryInfo(event.category).color }}
            title={event.title}
          />
        ))}
      </div>
    );
  }

  // 교회일정이 있는 경우 또는 3개 초과인 경우
  return (
    <div className="flex flex-col space-y-1 w-full">
      {/* 교회일정이 있으면 첫 번째 교회일정을 텍스트로 표시 */}
      {hasChurchEvent && (
        <div
          className="text-xs font-medium px-1 py-0.5 rounded text-white truncate text-center"
          style={{ backgroundColor: getCategoryInfo(churchEvents[0].category).color }}
          title={churchEvents[0].title}
        >
          {churchEvents[0].title}
        </div>
      )}

      {/* 나머지 이벤트들을 작은 바로 표시 */}
      {(() => {
        // 교회일정 제외한 나머지 이벤트들 + 추가 교회일정들
        const remainingEvents = [
          ...otherEvents,
          ...churchEvents.slice(1) // 첫 번째 교회일정 제외한 나머지 교회일정들
        ];

        if (remainingEvents.length === 0) return null;

        // 최대 3개까지만 바로 표시
        const displayEvents = remainingEvents.slice(0, 3);
        const hiddenCount = remainingEvents.length - displayEvents.length;

        return (
          <div className="flex space-x-0.5">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: getCategoryInfo(event.category).color }}
                title={event.title}
              />
            ))}
            {hiddenCount > 0 && (
              <div className="h-1 flex-1 rounded-full bg-gray-400" title={`+${hiddenCount}개 더`} />
            )}
          </div>
        );
      })()}
    </div>
  );
}