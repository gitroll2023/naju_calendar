// Excel 날짜 변환 테스트
console.log('📅 Excel 날짜 변환 테스트');
console.log('='.repeat(60));

// parseExcelSerialDate 함수 시뮬레이션 (현재 로직)
function parseExcelSerialDate(serial, defaultYear) {
  const EXCEL_EPOCH = 25569;
  const MS_PER_DAY = 86400 * 1000;

  // 현재 로직: +1일 보정
  const milliseconds = (serial - EXCEL_EPOCH + 1) * MS_PER_DAY;
  const utcDate = new Date(milliseconds);

  let year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();

  if (defaultYear) {
    year = defaultYear;
  }

  return new Date(year, month, day, 0, 0, 0, 0);
}

// 날짜 포맷 함수
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Excel serial number 테스트
// 45931 = October 1, 2025 in Excel
const testSerials = [
  { serial: 45930, desc: 'September 30, 2025' },
  { serial: 45931, desc: 'October 1, 2025' },
  { serial: 45932, desc: 'October 2, 2025' },
  { serial: 45935, desc: 'October 5, 2025' },
  { serial: 45940, desc: 'October 10, 2025' }
];

console.log('\n현재 로직 (+1일 보정 적용):');
console.log('-'.repeat(40));
testSerials.forEach(test => {
  const date = parseExcelSerialDate(test.serial, 2025);
  console.log(`Serial ${test.serial} (${test.desc}):`);
  console.log(`  → ${formatDate(date)} (${date.toLocaleDateString('ko-KR')})`);
});

// 보정 없이 테스트
function parseExcelSerialDateNormal(serial, defaultYear) {
  const EXCEL_EPOCH = 25569;
  const MS_PER_DAY = 86400 * 1000;

  // 보정 없이
  const milliseconds = (serial - EXCEL_EPOCH) * MS_PER_DAY;
  const utcDate = new Date(milliseconds);

  let year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();

  if (defaultYear) {
    year = defaultYear;
  }

  return new Date(year, month, day, 0, 0, 0, 0);
}

console.log('\n\n보정 없는 로직:');
console.log('-'.repeat(40));
testSerials.forEach(test => {
  const date = parseExcelSerialDateNormal(test.serial, 2025);
  console.log(`Serial ${test.serial} (${test.desc}):`);
  console.log(`  → ${formatDate(date)} (${date.toLocaleDateString('ko-KR')})`);
});

// 예상되는 올바른 결과
console.log('\n\n예상 결과:');
console.log('-'.repeat(40));
console.log('Serial 45931 → 2025-10-01 (October 1)');
console.log('Serial 45932 → 2025-10-02 (October 2)');
console.log('Serial 45935 → 2025-10-05 (October 5)');

// 실제 Date 객체로 10월 1일 만들기
console.log('\n\n직접 생성한 10월 1일:');
console.log('-'.repeat(40));
const oct1 = new Date(2025, 9, 1); // month는 0-based
console.log('new Date(2025, 9, 1):');
console.log(`  → ${formatDate(oct1)} (${oct1.toLocaleDateString('ko-KR')})`);