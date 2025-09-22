import * as XLSX from 'xlsx';
import type { Event, ChurchCategory } from '@/types/calendar';
import { parseExcelSerialDate, parseExcelDateCell, parseKoreanDate, parseSimpleDay, logDateDebug } from '@/lib/date-utils';

interface ParsedEvent {
  title: string;
  date: Date;
  category: ChurchCategory;
  description?: string;
  location?: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
}

// 메모 섹션의 카테고리 레이블이거나 제외해야 할 텍스트인지 확인하는 함수
function isExcludedText(text: string): boolean {
  const excludedLabels = [
    '메모:',
    '예배, 인맞음',
    '송하행사',
    '신학부(센터)',
    '신학부(모임)',
    '관리부',
    '나주지역회의',
    '교육부',
    '봉사,홍보',
    '봉사, 홍보',
    '전도부',
    '전도기획'
  ];

  // 정확히 일치하는지 확인
  if (excludedLabels.some(label => text.trim() === label || text.trim() === label.replace(',', ', '))) {
    return true;
  }

  // 주간 관련 텍스트 제외 (찾기주간, 전도주간 등)
  if (text.includes('주간') && (text.includes('(') || text.includes('~'))) {
    return true;
  }

  // "찾기주간"이 포함된 모든 텍스트 제외
  if (text.includes('찾기주간')) {
    return true;
  }

  return false;
}

// 텍스트로 카테고리 추론하는 함수
function inferCategoryFromText(text: string): ChurchCategory | null {
  const textLower = text.toLowerCase();

  // 카테고리별 키워드
  if (textLower.includes('예배') || textLower.includes('인맞음')) return 'worship';
  if (textLower.includes('송하') || textLower.includes('졸업')) return 'celebration';
  if (textLower.includes('신학') || textLower.includes('센터')) return 'theology';
  if (textLower.includes('관리') || textLower.includes('재정')) return 'admin';
  if (textLower.includes('교육') || textLower.includes('학습')) return 'education';
  if (textLower.includes('전도') || textLower.includes('선교')) return 'evangelism';
  if (textLower.includes('봉사') || textLower.includes('홍보')) return 'service';
  if (textLower.includes('지역') || textLower.includes('나주')) return 'regional';

  return null;
}

// 배경색을 카테고리로 매핑하는 함수
function mapColorToCategory(color: string | undefined, title?: string): ChurchCategory {
  // 색상이 없으면 텍스트로 추론
  if (!color && title) {
    const inferredCategory = inferCategoryFromText(title);
    if (inferredCategory) return inferredCategory;
  }

  if (!color) return 'church';

  // Excel 색상 코드를 카테고리로 매핑
  // 색상 코드는 엑셀에서 ARGB 형식 (FF + RGB)
  const colorMap: { [key: string]: ChurchCategory } = {
    // 파란색 계열 - 예배, 인맞음
    'FF0070C0': 'worship',
    'FF00B0F0': 'worship',
    'FF5B9BD5': 'worship',

    // 초록색 계열 - 송하행사
    'FF70AD47': 'celebration',
    'FF92D050': 'celebration',
    'FF00B050': 'celebration',

    // 보라색 계열 - 신학부
    'FF7030A0': 'theology',
    'FFB455B4': 'theology',
    'FFCC99FF': 'theology',

    // 회색 계열 - 관리부
    'FFA6A6A6': 'admin',
    'FF808080': 'admin',
    'FF595959': 'admin',

    // 주황색 계열 - 교육부
    'FFED7D31': 'education',
    'FFFFC000': 'education',
    'FFFFCC00': 'education',

    // 빨간색 계열 - 전도부
    'FFFF0000': 'evangelism',
    'FFFF6666': 'evangelism',
    'FFE26B0A': 'evangelism',

    // 노란색 계열 - 봉사/홍보
    'FFFFFF00': 'service',
    'FFFFEB9C': 'service',
    'FFFFF2CC': 'service',

    // 청록색 계열 - 나주지역회의
    'FF00FFFF': 'regional',
    'FF00CCFF': 'regional',
    'FF99FFFF': 'regional'
  };

  // 정확한 매칭이 없으면 비슷한 색상 찾기
  const upperColor = color.toUpperCase();
  if (colorMap[upperColor]) {
    return colorMap[upperColor];
  }

  // RGB 값을 분석하여 가장 비슷한 카테고리 찾기
  if (upperColor.length >= 6) {
    const r = parseInt(upperColor.substr(-6, 2), 16);
    const g = parseInt(upperColor.substr(-4, 2), 16);
    const b = parseInt(upperColor.substr(-2, 2), 16);

    // 색상 분석 로직
    if (b > r && b > g) return 'worship';        // 파란색 계열
    if (g > r && g > b) return 'celebration';    // 초록색 계열
    if (r > 200 && g > 200 && b < 100) return 'service';  // 노란색 계열
    if (r > g && r > b && r > 200) return 'evangelism';   // 빨간색 계열
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'admin'; // 회색 계열
  }

  return 'church'; // 기본값
}

// 시간 추론 함수 - 시간이 명시된 경우만 처리
function inferTimeFromTitle(title: string): { startTime?: string; endTime?: string; isAllDay: boolean } {
  // 시간 패턴 찾기 (예: "14:00", "오후 2시", "3시")
  const timePattern = /(\d{1,2}):(\d{2})|(\d{1,2})시|오전\s*(\d{1,2})|오후\s*(\d{1,2})/;
  const match = title.match(timePattern);

  if (match) {
    // 시간이 명시되어 있는 경우에만 시간 설정
    if (match[1] && match[2]) {
      // "14:00" 형식
      const hour = parseInt(match[1]);
      const minute = match[2];
      return {
        startTime: `${hour.toString().padStart(2, '0')}:${minute}`,
        endTime: `${(hour + 2).toString().padStart(2, '0')}:${minute}`, // 기본 2시간
        isAllDay: false
      };
    } else if (match[3]) {
      // "N시" 형식
      const hour = parseInt(match[3]);
      return {
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 2).toString().padStart(2, '0')}:00`,
        isAllDay: false
      };
    } else if (match[4]) {
      // "오전 N" 형식
      const hour = parseInt(match[4]);
      return {
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 2).toString().padStart(2, '0')}:00`,
        isAllDay: false
      };
    } else if (match[5]) {
      // "오후 N" 형식
      const hour = parseInt(match[5]) + 12;
      return {
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 2).toString().padStart(2, '0')}:00`,
        isAllDay: false
      };
    }
  }

  // 시간이 명시되지 않은 모든 일정은 종일 일정으로 처리
  return { isAllDay: true };
}

// 엑셀 데이터에서 이벤트 추출
export function parseExcelToEvents(file: File): Promise<ParsedEvent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
          cellText: false,
          cellNF: false,
          cellStyles: true  // 배경색 스타일 정보 활성화
        });

        const events: ParsedEvent[] = [];

        // 첫 번째 시트 처리
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // range를 사용하여 모든 셀 처리
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');

        console.log(`🔍 시트 범위: ${worksheet['!ref']}`);

        // 날짜와 일정을 저장할 맵
        const dateMapping: { [key: string]: Date } = {};
        const cellValues: { [key: string]: string } = {};
        let memoSectionFound = false;
        let memoStartRow = -1;

        // B1과 C1에서 연도와 월 정보 추출
        let defaultYear = 2025; // 기본값
        let defaultMonth: number | null = null;

        // B1 셀에서 연도 추출
        const b1Cell = worksheet['B1'];
        if (b1Cell) {
          const b1Value = String(b1Cell.v || b1Cell.w || '').trim();
          const yearMatch = b1Value.match(/(\d{4})/);
          if (yearMatch) {
            defaultYear = parseInt(yearMatch[1]);
            console.log(`📅 B1에서 연도 발견: ${defaultYear}년`);
          }
        }

        // C1 셀에서 월 추출
        const c1Cell = worksheet['C1'];
        if (c1Cell) {
          const c1Value = String(c1Cell.v || c1Cell.w || '').trim();
          const monthMatch = c1Value.match(/(\d{1,2})월/);
          if (monthMatch) {
            defaultMonth = parseInt(monthMatch[1]) - 1; // 0-based month
            console.log(`📅 C1에서 월 발견: ${defaultMonth + 1}월`);
          }
        }

        // 모든 셀을 순회하며 날짜와 텍스트 찾기
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            if (!cell) continue;

            // 배경색 추출 (다양한 방법 시도)
            let cellColor: string | undefined;
            if (cell.s) {
              // 스타일 객체가 있는 경우 - 다양한 속성 확인
              if (cell.s.fgColor) cellColor = cell.s.fgColor.rgb;
              else if (cell.s.bgColor) cellColor = cell.s.bgColor.rgb;
              else if (cell.s.patternFill?.fgColor) cellColor = cell.s.patternFill.fgColor.rgb;
              else if (cell.s.patternFill?.bgColor) cellColor = cell.s.patternFill.bgColor.rgb;
              else if (cell.s.fill?.fgColor) cellColor = cell.s.fill.fgColor.rgb;
              else if (cell.s.fill?.bgColor) cellColor = cell.s.fill.bgColor.rgb;

              if (cellColor) {
                console.log(`🎨 색상 발견 [${row},${col}]: ${cellColor} (스타일 객체: ${JSON.stringify(cell.s)})`);
              }
            }

            // 셀 타입에 따른 처리
            if (cell.t === 'd' || (cell.t === 'n' && cell.v > 40000 && cell.v < 50000)) {
              // 날짜 타입이거나 Excel serial date
              let date: Date;
              if (cell.t === 'd') {
                // 직접 Date 타입
                date = parseExcelDateCell(cell.v, defaultYear);
                logDateDebug(`Date cell [${row},${col}]`, date);
              } else {
                // Excel serial date
                date = parseExcelSerialDate(cell.v, defaultYear);
                logDateDebug(`Serial date [${row},${col}] (${cell.v})`, date);
              }

              if (!isNaN(date.getTime()) && date.getFullYear() >= 2023 && date.getFullYear() <= 2026) {
                dateMapping[`${row}-${col}`] = date;
                console.log(`📅 날짜 발견 [${row},${col}]:`, date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }), cell.w || cell.v);
              }
            }
            else if (cell.t === 's' && cell.v) {
              // 문자열 타입
              const text = String(cell.v).trim();

              // 메모 섹션 감지
              if (text === '메모:') {
                memoSectionFound = true;
                memoStartRow = row;
                console.log(`📝 메모 섹션 발견 [${row},${col}]`);
                continue;
              }

              // 날짜 패턴 체크
              if (text.match(/\d{1,2}월\s*\d{1,2}일/) ||
                  text.match(/\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}/) ||
                  text.includes('(월)') || text.includes('(화)') || text.includes('(수)') ||
                  text.includes('(목)') || text.includes('(금)') || text.includes('(토)') || text.includes('(일)')) {

                // 한글 날짜 파싱
                const date = parseKoreanDate(text, defaultYear);
                if (date) {
                  dateMapping[`${row}-${col}`] = date;
                  logDateDebug(`한글 날짜 [${row},${col}]: ${text}`, date);
                }
              } else if (/^\d{1,2}$/.test(text) && defaultMonth !== null) {
                // 단순 숫자 날짜
                const date = parseSimpleDay(text, defaultYear, defaultMonth);
                if (date) {
                  dateMapping[`${row}-${col}`] = date;
                  logDateDebug(`숫자 날짜 [${row},${col}]: ${text}일`, date);
                }
              } else if (text.length > 1 && text.length < 100) {
                // 메모 섹션에 있는 텍스트는 제외
                if (memoSectionFound && row >= memoStartRow && row <= memoStartRow + 10) {
                  if (isExcludedText(text)) {
                    console.log(`🚫 메모 레이블/주간 텍스트 제외 [${row},${col}]: ${text}`);
                    continue;
                  }
                }
                // 메모 섹션 외부에서도 주간 텍스트는 제외
                if (isExcludedText(text)) {
                  console.log(`🚫 제외 텍스트 [${row},${col}]: ${text}`);
                  continue;
                }
                // 일반 텍스트 (일정으로 추정)
                cellValues[`${row}-${col}`] = text;
              }
            }
            else if (cell.w) {
              // formatted value가 있는 경우
              const text = String(cell.w).trim();
              if (text.length > 1 && text.length < 100) {
                cellValues[`${row}-${col}`] = text;
              }
            }
          }
        }

        console.log('📊 분석 결과:', {
          날짜수: Object.keys(dateMapping).length,
          텍스트수: Object.keys(cellValues).length,
          날짜샘플: Object.values(dateMapping).slice(0, 5).map(d => d.toLocaleDateString('ko-KR')),
          텍스트샘플: Object.values(cellValues).slice(0, 10)
        });

        // 2단계: 일정 찾기 - 날짜 셀 아래의 모든 텍스트를 해당 날짜의 일정으로 매핑
        for (const [dateKey, date] of Object.entries(dateMapping)) {
          const [dateRow, dateCol] = dateKey.split('-').map(Number);

          // 해당 날짜 셀 아래의 모든 텍스트 찾기 (같은 열에서)
          for (let checkRow = dateRow + 1; checkRow <= range.e.r; checkRow++) {
            // 다음 날짜를 만나면 중단
            if (dateMapping[`${checkRow}-${dateCol}`]) break;

            const textKey = `${checkRow}-${dateCol}`;
            if (cellValues[textKey]) {
              const title = cellValues[textKey];

              // 필터링
              if (title.length < 2 ||
                  /^\d+$/.test(title) ||
                  /^\d+월$/.test(title) ||
                  /^\d+일$/.test(title) ||
                  title.includes('요일') ||
                  title.includes('작성') ||
                  title === 'nan' ||
                  isExcludedText(title)) {
                continue;
              }

              const timeInfo = inferTimeFromTitle(title);

              // 해당 셀의 배경색 가져오기
              const eventCellAddress = XLSX.utils.encode_cell({ r: checkRow, c: dateCol });
              const eventCell = worksheet[eventCellAddress];
              let eventColor: string | undefined;
              if (eventCell?.s) {
                eventColor = eventCell.s.fgColor?.rgb ||
                            eventCell.s.bgColor?.rgb ||
                            eventCell.s.patternFill?.fgColor?.rgb ||
                            eventCell.s.patternFill?.bgColor?.rgb;
              }
              const category = mapColorToCategory(eventColor, title);

              // 카테고리 매핑 디버깅
              if (eventColor) {
                console.log(`🎨 이벤트 색상 [${checkRow},${dateCol}]: ${eventColor} -> ${category}`);
              }

              // 날짜를 그대로 사용 (이미 정확하게 설정됨)
              events.push({
                title,
                date: date,  // 원본 날짜 그대로 사용
                category,
                description: `엑셀에서 가져온 일정`,
                location: '나주교회',
                ...timeInfo
              });

              console.log(`✅ 일정 추가: ${date.toLocaleDateString('ko-KR')} - ${title} [카테고리: ${category}]`);
            }
          }

          // 같은 행에서 오른쪽 셀들도 확인 (달력 형태인 경우)
          for (let checkCol = dateCol + 1; checkCol <= Math.min(dateCol + 3, range.e.c); checkCol++) {
            // 다른 날짜 셀을 만나면 중단
            if (dateMapping[`${dateRow}-${checkCol}`]) break;

            // 같은 행 또는 바로 아래 행의 텍스트 확인
            for (let rowOffset = 0; rowOffset <= 2; rowOffset++) {
              const textKey = `${dateRow + rowOffset}-${checkCol}`;
              if (cellValues[textKey]) {
                const title = cellValues[textKey];

                // 필터링
                if (title.length < 2 ||
                    /^\d+$/.test(title) ||
                    title.includes('요일') ||
                    title === 'nan' ||
                    isExcludedText(title)) {
                  continue;
                }

                const timeInfo = inferTimeFromTitle(title);

                // 해당 셀의 배경색 가져오기
                const eventCellAddress = XLSX.utils.encode_cell({ r: dateRow + rowOffset, c: checkCol });
                const eventCell = worksheet[eventCellAddress];
                let eventColor: string | undefined;
                if (eventCell?.s) {
                  eventColor = eventCell.s.fgColor?.rgb ||
                              eventCell.s.bgColor?.rgb ||
                              eventCell.s.patternFill?.fgColor?.rgb ||
                              eventCell.s.patternFill?.bgColor?.rgb;
                }
                const category = mapColorToCategory(eventColor, title);

                // 날짜를 그대로 사용 (이미 정확하게 설정됨)
                events.push({
                  title,
                  date: date,  // 원본 날짜 그대로 사용
                  category,
                  description: `엑셀에서 가져온 일정`,
                  location: '나주교회',
                  ...timeInfo
                });

                console.log(`✅ 일정 추가 (인접): ${date.toLocaleDateString('ko-KR')} - ${title} [카테고리: ${category}]`);
              }
            }
          }
        }

        // 중복 제거 (같은 날짜, 같은 제목)
        const uniqueEvents = events.filter((event, index, arr) => {
          return index === arr.findIndex(e =>
            e.title === event.title &&
            e.date.toDateString() === event.date.toDateString()
          );
        });

        console.log('✅ 파싱 완료:', {
          전체이벤트수: events.length,
          중복제거후: uniqueEvents.length,
          샘플: uniqueEvents.slice(0, 3).map(e => ({
            제목: e.title,
            날짜: e.date.toLocaleDateString('ko-KR')
          }))
        });

        // 이벤트가 없으면 더 자세한 디버깅 정보 제공
        if (uniqueEvents.length === 0) {
          console.error('❌ 일정을 찾을 수 없습니다:', {
            날짜수: Object.keys(dateMapping).length,
            셀값수: Object.keys(cellValues).length,
            시트범위: worksheet['!ref']
          });
        }

        resolve(uniqueEvents);

      } catch (error) {
        reject(new Error(`엑셀 파일 파싱 오류: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 오류'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// 파싱된 이벤트를 데이터베이스 형식으로 변환
export function convertToCalendarEvents(parsedEvents: ParsedEvent[]): Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] {
  return parsedEvents.map(event => {
    // 날짜를 그대로 사용 (이미 parseExcelToEvents에서 정확하게 설정됨)
    return {
      title: event.title,
      date: event.date,  // 날짜를 그대로 사용
      startTime: event.startTime,
      endTime: event.endTime,
      category: event.category,
      description: event.description,
      location: event.location,
      isAllDay: event.isAllDay,
      reminder: 30, // 기본 30분 전 알림
    };
  });
}