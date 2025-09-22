import { create } from 'zustand';
import { isSameDay } from 'date-fns';
import type { CalendarState, Event, ChurchCategory } from '@/types/calendar';
import { EventService } from './services/event-service';
import { CHURCH_CATEGORIES } from './calendar-utils';
import { isSupabaseConfigured } from './supabase';
import { generateId } from './utils';

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  currentDate: new Date(),
  selectedDate: null,
  viewMode: 'month',
  events: [],
  loading: false,
  error: null,
  activeCategories: new Set(Object.keys(CHURCH_CATEGORIES) as ChurchCategory[]),

  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
  },

  selectDate: (date: Date) => {
    set({ selectedDate: date });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  loadEvents: async () => {
    try {
      set({ loading: true, error: null });

      if (isSupabaseConfigured) {
        const events = await EventService.getAllEvents();
        set({ events, loading: false });
      } else {
        // Supabase가 설정되지 않은 경우 샘플 데이터 로드
        const events = createSampleEventsData();
        set({ events, loading: false });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load events'
      });
    }
  },

  addEvent: async (eventData) => {
    try {
      set({ loading: true, error: null });

      // 중복 체크
      const existingEvents = get().events;
      const isDuplicate = existingEvents.some(event => {
        const isSameDate = isSameDay(event.date, eventData.date);
        const isSameTitle = event.title.trim() === eventData.title.trim();
        const isSameTime = event.startTime === eventData.startTime;
        return isSameDate && isSameTitle && isSameTime;
      });

      if (isDuplicate) {
        set({
          loading: false,
          error: '동일한 날짜에 같은 제목의 일정이 이미 존재합니다.'
        });
        return null;
      }

      if (isSupabaseConfigured) {
        const newEvent = await EventService.addEvent(eventData);
        set((state) => ({
          events: [...state.events, newEvent],
          loading: false
        }));
        return newEvent;
      } else {
        // 로컬 저장소 사용
        const newEvent: Event = {
          ...eventData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          events: [...state.events, newEvent],
          loading: false
        }));
        return newEvent;
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to add event'
      });
      return null;
    }
  },

  updateEvent: async (id: string, eventData) => {
    try {
      set({ loading: true, error: null });

      if (isSupabaseConfigured) {
        const updatedEvent = await EventService.updateEvent(id, eventData);
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? updatedEvent : event
          ),
          loading: false
        }));
      } else {
        // 로컬 저장소 사용
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, ...eventData, updatedAt: new Date() }
              : event
          ),
          loading: false
        }));
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update event'
      });
    }
  },

  deleteEvent: async (id: string) => {
    try {
      set({ loading: true, error: null });

      if (isSupabaseConfigured) {
        await EventService.deleteEvent(id);
      }

      // 로컬 및 Supabase 모두 로컬 상태에서 제거
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
        loading: false
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete event'
      });
    }
  },

  getEventsForDate: (date: Date) => {
    const { events } = get();
    return events.filter((event) => isSameDay(event.date, date));
  },

  getEventsForMonth: (year: number, month: number) => {
    const { events } = get();
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month - 1;
    });
  },

  getFilteredEvents: () => {
    const { events, activeCategories } = get();
    return events.filter(event => activeCategories.has(event.category));
  },

  setActiveCategories: (categories: Set<ChurchCategory>) => {
    set({ activeCategories: categories });
  },

  toggleCategory: (category: ChurchCategory) => {
    const { activeCategories } = get();
    const newActiveCategories = new Set(activeCategories);
    if (newActiveCategories.has(category)) {
      newActiveCategories.delete(category);
    } else {
      newActiveCategories.add(category);
    }
    set({ activeCategories: newActiveCategories });
  },

  // 해당 월의 모든 일정 삭제
  deleteMonthEvents: async (year: number, month: number) => {
    try {
      set({ loading: true, error: null });

      const { events } = get();
      // 해당 월의 이벤트 필터링
      const monthEvents = events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      });

      if (isSupabaseConfigured) {
        // Supabase에서 삭제
        for (const event of monthEvents) {
          await EventService.deleteEvent(event.id);
        }
      }

      // 로컬 상태에서 제거
      const remainingEvents = events.filter((event) => {
        const eventDate = new Date(event.date);
        return !(eventDate.getFullYear() === year && eventDate.getMonth() === month);
      });

      set({
        events: remainingEvents,
        loading: false
      });

      return monthEvents.length; // 삭제된 이벤트 수 반환
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete month events'
      });
      return 0;
    }
  },

  // 중복 이벤트 확인
  checkDuplicate: (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const existingEvents = get().events;
    return existingEvents.some(event => {
      const isSameDate = isSameDay(event.date, eventData.date);
      const isSameTitle = event.title.trim() === eventData.title.trim();
      const isSameTime = event.startTime === eventData.startTime;
      return isSameDate && isSameTitle && isSameTime;
    });
  },
}));

// 샘플 데이터 생성 함수 (Supabase가 설정되지 않은 경우)
function createSampleEventsData(): Event[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      id: generateId(),
      title: '주일예배',
      date: new Date(today),
      startTime: '10:30',
      endTime: '12:00',
      category: 'church',
      description: '주일 대예배',
      location: '본당',
      isAllDay: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      title: '수요기도회',
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      startTime: '19:30',
      endTime: '21:00',
      category: 'church',
      description: '수요일 저녁 기도회',
      location: '본당',
      isAllDay: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      title: '청년부 모임',
      date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      startTime: '14:00',
      endTime: '16:00',
      category: 'youth',
      description: '청년부 정기 모임 및 성경공부',
      location: '청년부실',
      isAllDay: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      title: '장년부 성경공부',
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      startTime: '10:00',
      endTime: '11:30',
      category: 'adult',
      description: '장년부 정기 성경공부',
      location: '장년부실',
      isAllDay: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
}

// 데이터베이스에서 이벤트 로드 (클라이언트 사이드에서만 실행)
if (typeof window !== 'undefined') {
  // DOM이 로드된 후 이벤트 로드
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      useCalendarStore.getState().loadEvents();
    });
  } else {
    useCalendarStore.getState().loadEvents();
  }
}