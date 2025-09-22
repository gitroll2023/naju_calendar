// Manual test for Excel date conversion
// Testing the logic directly without imports

// Simulate parseExcelSerialDate function (with +1 day correction)
function parseExcelSerialDate(serial, defaultYear) {
  const EXCEL_EPOCH = 25569;
  const MS_PER_DAY = 86400 * 1000;

  // Excel serial을 Unix timestamp로 변환
  const milliseconds = (serial - EXCEL_EPOCH) * MS_PER_DAY;

  // UTC Date 객체 생성
  const utcDate = new Date(milliseconds);

  // UTC 기준으로 날짜 컴포넌트 추출 (하루 추가 보정)
  let year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate() + 1; // Excel 날짜가 하루 빠르게 표시되는 문제 보정

  // defaultYear가 제공되면 해당 연도 사용
  if (defaultYear) {
    year = defaultYear;
  }

  // 로컬 Date 객체 생성
  return new Date(year, month, day, 0, 0, 0, 0);
}

// Simulate formatDateToString function
function formatDateToString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

console.log('📅 Excel Date Conversion Test');
console.log('=' .repeat(60));

// Test October 1, 2025 (Excel serial: 45931)
const testSerial = 45931;
console.log(`\nTesting Excel serial ${testSerial}:`);
console.log('-'.repeat(40));

const date = parseExcelSerialDate(testSerial, 2025);
const formatted = formatDateToString(date);

console.log('Parsed Date Object:', {
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  date: date.getDate(),
  hours: date.getHours(),
  localString: date.toLocaleDateString('ko-KR')
});

console.log('\nResults:');
console.log(`Expected: 2025-10-01 (October 1, 2025)`);
console.log(`Got:      ${formatted}`);
console.log(`Status:   ${formatted === '2025-10-01' ? '✅ CORRECT' : '❌ INCORRECT'}`);

// Test multiple dates
console.log('\n' + '=' .repeat(60));
console.log('Testing multiple dates:');
console.log('-'.repeat(40));

const testCases = [
  { serial: 45931, expected: '2025-10-01', description: 'October 1' },
  { serial: 45932, expected: '2025-10-02', description: 'October 2' },
  { serial: 45940, expected: '2025-10-10', description: 'October 10' },
  { serial: 45950, expected: '2025-10-20', description: 'October 20' },
  { serial: 45961, expected: '2025-10-31', description: 'October 31' }
];

let passCount = 0;
testCases.forEach(test => {
  const d = parseExcelSerialDate(test.serial, 2025);
  const f = formatDateToString(d);
  const passed = f === test.expected;
  if (passed) passCount++;

  console.log(`${test.description}: ${f} ${passed ? '✅' : `❌ (expected ${test.expected})`}`);
});

console.log(`\n📊 Results: ${passCount}/${testCases.length} tests passed`);

// Test with actual timezone
console.log('\n' + '=' .repeat(60));
console.log('Current timezone info:');
console.log(`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
console.log(`Offset: UTC${new Date().getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(new Date().getTimezoneOffset()/60)}`);