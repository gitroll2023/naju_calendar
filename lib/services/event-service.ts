import { supabase } from '@/lib/supabase';
import type { Event, ChurchCategory } from '@/types/calendar';
import type { Database } from '@/types/database';
import { formatDateToString, parseDateString, logDateDebug } from '@/lib/date-utils';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

// Database row를 Event 타입으로 변환
function mapDbRowToEvent(row: EventRow): Event {
  // 날짜 문자열을 Date 객체로 변환
  const date = parseDateString(row.date);

  if (process.env.NODE_ENV === 'development') {
    logDateDebug(`DB row ${row.id}`, date);
  }

  return {
    id: row.id,
    title: row.title,
    date: date,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    category: row.category as ChurchCategory,
    description: row.description || undefined,
    location: row.location || undefined,
    isAllDay: row.is_all_day,
    reminder: row.reminder || undefined,
    recurring: row.recurring as Event['recurring'] || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Event 타입을 Database insert 타입으로 변환
function mapEventToDbInsert(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): EventInsert {
  return {
    title: event.title,
    date: formatDateToString(event.date), // 로컬 날짜 YYYY-MM-DD 형식
    start_time: event.startTime || null,
    end_time: event.endTime || null,
    category: event.category,
    description: event.description || null,
    location: event.location || null,
    is_all_day: event.isAllDay,
    reminder: event.reminder || null,
    recurring: event.recurring || null,
  };
}

// Event 타입을 Database update 타입으로 변환
function mapEventToDbUpdate(event: Partial<Event>): EventUpdate {
  const update: EventUpdate = {};

  if (event.title !== undefined) update.title = event.title;
  if (event.date !== undefined) update.date = formatDateToString(event.date);
  if (event.startTime !== undefined) update.start_time = event.startTime || null;
  if (event.endTime !== undefined) update.end_time = event.endTime || null;
  if (event.category !== undefined) update.category = event.category;
  if (event.description !== undefined) update.description = event.description || null;
  if (event.location !== undefined) update.location = event.location || null;
  if (event.isAllDay !== undefined) update.is_all_day = event.isAllDay;
  if (event.reminder !== undefined) update.reminder = event.reminder || null;
  if (event.recurring !== undefined) update.recurring = event.recurring || null;

  return update;
}

export class EventService {
  // 모든 이벤트 가져오기
  static async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    return data?.map(mapDbRowToEvent) || [];
  }

  // 특정 날짜의 이벤트 가져오기
  static async getEventsByDate(date: Date): Promise<Event[]> {
    const dateStr = formatDateToString(date);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('date', dateStr)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events by date:', error);
      throw new Error(`Failed to fetch events for date: ${error.message}`);
    }

    return data?.map(mapDbRowToEvent) || [];
  }

  // 특정 월의 이벤트 가져오기
  static async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const startDate = formatDateToString(new Date(year, month - 1, 1));
    const endDate = formatDateToString(new Date(year, month, 0));

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events by month:', error);
      throw new Error(`Failed to fetch events for month: ${error.message}`);
    }

    return data?.map(mapDbRowToEvent) || [];
  }

  // 이벤트 추가
  static async addEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const insertData = mapEventToDbInsert(eventData);

    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error adding event:', error);
      throw new Error(`Failed to add event: ${error.message}`);
    }

    return mapDbRowToEvent(data);
  }

  // 이벤트 수정
  static async updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
    const updateData = mapEventToDbUpdate(eventData);

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error(`Failed to update event: ${error.message}`);
    }

    return mapDbRowToEvent(data);
  }

  // 이벤트 삭제
  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  // 카테고리별 이벤트 가져오기
  static async getEventsByCategory(category: ChurchCategory): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('category', category)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events by category:', error);
      throw new Error(`Failed to fetch events by category: ${error.message}`);
    }

    return data?.map(mapDbRowToEvent) || [];
  }

  // 날짜 범위로 이벤트 가져오기
  static async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events by date range:', error);
      throw new Error(`Failed to fetch events by date range: ${error.message}`);
    }

    return data?.map(mapDbRowToEvent) || [];
  }
}