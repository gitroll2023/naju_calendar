export type ChurchCategory =
  | 'worship'      // 예배, 인맞음 (파란색 계열)
  | 'celebration'  // 송하행사 (초록색 계열)
  | 'theology'     // 신학부 (보라색 계열)
  | 'admin'        // 관리부 (회색 계열)
  | 'education'    // 교육부 (주황색 계열)
  | 'evangelism'   // 전도부 (빨간색 계열)
  | 'service'      // 봉사/홍보 (노란색 계열)
  | 'regional'     // 나주지역회의 (청록색 계열)
  | 'church';      // 기타 교회 일정 (기본 파란색)

export interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  category: ChurchCategory;
  description?: string;
  location?: string;
  isAllDay: boolean;
  reminder?: number; // minutes before
  recurring?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export type ViewMode = 'month' | 'week' | 'day';

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  viewMode: ViewMode;
  events: Event[];
  loading: boolean;
  error: string | null;
  activeCategories: Set<ChurchCategory>;

  // Actions
  setCurrentDate: (date: Date) => void;
  selectDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  loadEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Event | null>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  deleteMonthEvents: (year: number, month: number) => Promise<number>;
  getEventsForDate: (date: Date) => Event[];
  getEventsForMonth: (year: number, month: number) => Event[];
  getFilteredEvents: () => Event[];
  setActiveCategories: (categories: Set<ChurchCategory>) => void;
  toggleCategory: (category: ChurchCategory) => void;
  checkDuplicate: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  events: Event[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}