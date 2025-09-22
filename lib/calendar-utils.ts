import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  getYear,
  getMonth
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CalendarDay, CalendarWeek, CalendarMonth, Event } from '@/types/calendar';

export function getCalendarDays(date: Date, events: Event[]): CalendarDay[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 일요일 시작
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  return days.map((day): CalendarDay => ({
    date: day,
    isToday: isToday(day),
    isSelected: false, // 이는 컴포넌트에서 설정
    isCurrentMonth: isSameMonth(day, date),
    events: getEventsForDate(day, events),
  }));
}

export function getCalendarWeeks(days: CalendarDay[]): CalendarWeek[] {
  const weeks: CalendarWeek[] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push({
      days: days.slice(i, i + 7),
    });
  }

  return weeks;
}

export function getCalendarMonth(date: Date, events: Event[]): CalendarMonth {
  const days = getCalendarDays(date, events);
  const weeks = getCalendarWeeks(days);

  return {
    year: getYear(date),
    month: getMonth(date) + 1, // date-fns는 0-based month를 사용
    weeks,
  };
}

export function getEventsForDate(date: Date, events: Event[]): Event[] {
  return events.filter(event => isSameDay(event.date, date));
}

export function formatMonthYear(date: Date): string {
  return format(date, 'yyyy년 M월', { locale: ko });
}

export function formatDayOfWeek(date: Date): string {
  return format(date, 'E', { locale: ko });
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}:${minute.toString().padStart(2, '0')}`;
}

export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
}

export function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

import type { ChurchCategory } from '@/types/calendar';

export const CHURCH_CATEGORIES = {
  worship: {
    label: '예배/인맞음',
    color: '#3B82F6',      // 파란색 - 예배, 인맞음
    lightColor: '#DBEAFE',
    textColor: '#1E40AF',
    icon: '⛪'
  },
  celebration: {
    label: '송하행사',
    color: '#10B981',      // 초록색 - 송하행사
    lightColor: '#D1FAE5',
    textColor: '#065F46',
    icon: '🎉'
  },
  theology: {
    label: '신학부',
    color: '#8B5CF6',      // 보라색 - 신학부(센터/모임)
    lightColor: '#EDE9FE',
    textColor: '#5B21B6',
    icon: '📚'
  },
  admin: {
    label: '관리부',
    color: '#6B7280',      // 회색 - 관리부
    lightColor: '#F3F4F6',
    textColor: '#374151',
    icon: '🏢'
  },
  education: {
    label: '교육부',
    color: '#F97316',      // 주황색 - 교육부
    lightColor: '#FED7AA',
    textColor: '#C2410C',
    icon: '🎓'
  },
  evangelism: {
    label: '전도부',
    color: '#EF4444',      // 빨간색 - 전도부/전도기획
    lightColor: '#FEE2E2',
    textColor: '#B91C1C',
    icon: '📣'
  },
  service: {
    label: '봉사/홍보',
    color: '#FDE047',      // 노란색 - 봉사/홍보
    lightColor: '#FEF3C7',
    textColor: '#A16207',
    icon: '🤝'
  },
  regional: {
    label: '나주지역회의',
    color: '#06B6D4',      // 청록색 - 나주지역회의
    lightColor: '#CFFAFE',
    textColor: '#0E7490',
    icon: '🗺️'
  },
  church: {
    label: '교회',
    color: '#60A5FA',      // 연한 파란색 - 교회 일정
    lightColor: '#DBEAFE',
    textColor: '#2563EB',
    icon: '✝️'
  },
  adult: {
    label: '장년회',
    color: '#1E40AF',      // 진한 파란색 - 장년회
    lightColor: '#DBEAFE',
    textColor: '#1E3A8A',
    icon: '👥'
  },
  women: {
    label: '부녀회',
    color: '#EC4899',      // 분홍색 - 부녀회
    lightColor: '#FCE7F3',
    textColor: '#BE185D',
    icon: '👩'
  },
  youth: {
    label: '청년회',
    color: '#0891B2',      // 청록색 - 청년회
    lightColor: '#CFFAFE',
    textColor: '#0E7490',
    icon: '👨‍💼'
  },
  advisory: {
    label: '자문회',
    color: '#7C3AED',      // 보라색 - 자문회
    lightColor: '#EDE9FE',
    textColor: '#5B21B6',
    icon: '💼'
  },
  children: {
    label: '유년회',
    color: '#EAB308',      // 노란색 - 유년회
    lightColor: '#FEF3C7',
    textColor: '#A16207',
    icon: '👶'
  },
  student: {
    label: '학생회',
    color: '#059669',      // 초록색 - 학생회
    lightColor: '#D1FAE5',
    textColor: '#065F46',
    icon: '🎓'
  }
} as const;

export function getCategoryInfo(category: ChurchCategory) {
  return CHURCH_CATEGORIES[category];
}

export function getCategoryColor(category: ChurchCategory) {
  return CHURCH_CATEGORIES[category].color;
}

export function getCategoryLabel(category: ChurchCategory) {
  return CHURCH_CATEGORIES[category].label;
}

// 레거시 호환성을 위한 함수 (기존 color 기반 코드와 호환)
export const EVENT_COLORS = {
  red: '#EF4444',
  yellow: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
} as const;