import type { Event } from '@/types/calendar';
import { CHURCH_CATEGORIES } from '@/lib/calendar-utils';

/**
 * 이벤트 배열을 CSV 형식으로 변환
 */
export function convertEventsToCSV(events: Event[]): string {
  // CSV 헤더
  const headers = [
    '날짜',
    '제목',
    '카테고리',
    '시작시간',
    '종료시간',
    '장소',
    '설명',
    '종일',
    '알림',
    '반복'
  ];

  // CSV 행 생성
  const rows = events.map(event => {
    const date = new Date(event.date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // 카테고리 라벨 가져오기
    const categoryLabel = CHURCH_CATEGORIES[event.category]?.label || event.category;

    return [
      dateStr,
      escapeCSV(event.title),
      categoryLabel,
      event.startTime || '',
      event.endTime || '',
      escapeCSV(event.location || ''),
      escapeCSV(event.description || ''),
      event.isAllDay ? '예' : '아니오',
      event.reminder || '',
      event.recurring || ''
    ].join(',');
  });

  // BOM 추가 (Excel에서 한글 깨짐 방지)
  const BOM = '\uFEFF';

  // 헤더와 데이터 행 결합
  return BOM + [headers.join(','), ...rows].join('\n');
}

/**
 * CSV 특수문자 이스케이프 처리
 */
function escapeCSV(str: string): string {
  if (!str) return '';

  // 쉼표, 줄바꿈, 큰따옴표가 있으면 큰따옴표로 감싸기
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * CSV 파일 다운로드
 */
export function downloadCSV(csvContent: string, filename: string = 'church_events.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 메모리 정리
  URL.revokeObjectURL(url);
}

/**
 * 날짜 범위에 따른 파일명 생성
 */
export function generateCSVFilename(events: Event[]): string {
  if (events.length === 0) {
    return 'church_events.csv';
  }

  // 날짜순 정렬
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstDate = new Date(sortedEvents[0].date);
  const lastDate = new Date(sortedEvents[sortedEvents.length - 1].date);

  const startStr = `${firstDate.getFullYear()}${String(firstDate.getMonth() + 1).padStart(2, '0')}${String(firstDate.getDate()).padStart(2, '0')}`;
  const endStr = `${lastDate.getFullYear()}${String(lastDate.getMonth() + 1).padStart(2, '0')}${String(lastDate.getDate()).padStart(2, '0')}`;

  return `나주교회_일정_${startStr}_${endStr}.csv`;
}