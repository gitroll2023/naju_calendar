/**
 * 날짜 처리 유틸리티 - 한국 시간대(KST) 기준
 * 모든 날짜는 한국 시간대로 처리됩니다.
 */

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환 (로컬 시간 기준)
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 * 시간은 00:00:00으로 설정됩니다.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Excel serial number를 Date 객체로 변환
 * Excel의 serial number는 1900년 1월 1일을 1로 시작합니다.
 * @param serial Excel serial number
 * @param defaultYear 사용할 연도 (Excel의 연도 대신)
 */
export function parseExcelSerialDate(serial: number, defaultYear?: number): Date {
  // Excel epoch: 1899년 12월 30일 (Excel의 날짜 시작점)
  // Unix epoch: 1970년 1월 1일
  // 둘 사이의 일수: 25569
  const EXCEL_EPOCH = 25569;
  const MS_PER_DAY = 86400 * 1000;

  // Excel serial을 Unix timestamp로 변환 (하루 더하기 보정)
  // Excel 날짜가 실제보다 하루 빠르게 표시되는 문제 해결
  const milliseconds = (serial - EXCEL_EPOCH + 1) * MS_PER_DAY;

  // UTC Date 객체 생성
  const utcDate = new Date(milliseconds);

  // UTC 기준으로 날짜 컴포넌트 추출
  let year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();

  // defaultYear가 제공되면 해당 연도 사용
  if (defaultYear) {
    year = defaultYear;
  }

  // 로컬 Date 객체 생성 (한국 시간대에서 정확한 날짜)
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Date 타입 셀을 Date 객체로 변환
 * Excel에서 직접 날짜 타입으로 들어오는 경우
 */
export function parseExcelDateCell(cellValue: unknown, defaultYear?: number): Date {
  // cellValue를 Date 생성자가 받을 수 있는 타입으로 변환
  const date = new Date(cellValue as string | number | Date);

  // defaultYear가 제공되면 해당 연도로 설정
  if (defaultYear) {
    return new Date(defaultYear, date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * 한글 날짜 문자열을 Date 객체로 변환
 * 예: "10월 1일" -> Date
 */
export function parseKoreanDate(text: string, defaultYear: number): Date | null {
  const dateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1; // 0-based month
    const day = parseInt(dateMatch[2]);
    return new Date(defaultYear, month, day, 0, 0, 0, 0);
  }
  return null;
}

/**
 * 단순 숫자를 날짜로 변환 (월 정보가 있을 때)
 * 예: "15" -> 15일
 */
export function parseSimpleDay(dayText: string, defaultYear: number, defaultMonth: number): Date | null {
  const day = parseInt(dayText);
  if (!isNaN(day) && day >= 1 && day <= 31) {
    const date = new Date(defaultYear, defaultMonth, day, 0, 0, 0, 0);
    // 유효한 날짜인지 확인
    if (date.getMonth() === defaultMonth) {
      return date;
    }
  }
  return null;
}

/**
 * 두 날짜가 같은 날인지 비교 (시간 무시)
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * 날짜 디버깅용 로그
 */
export function logDateDebug(label: string, date: Date): void {
  console.log(`📅 ${label}:`, {
    local: date.toLocaleDateString('ko-KR'),
    iso: date.toISOString(),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    day: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  });
}