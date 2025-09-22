// Test date handling for Excel imports
const { parseExcelSerialDate, formatDateToString, parseDateString } = require('./lib/date-utils');

console.log('📅 Date Handling Test');
console.log('=' .repeat(60));

// Test cases with Excel serial numbers
const testCases = [
  { serial: 45931, expected: '2025-10-01', description: 'October 1, 2025' },
  { serial: 45932, expected: '2025-10-02', description: 'October 2, 2025' },
  { serial: 45950, expected: '2025-10-20', description: 'October 20, 2025' },
  { serial: 45900, expected: '2025-08-31', description: 'August 31, 2025' },
  { serial: 45961, expected: '2025-10-31', description: 'October 31, 2025' }
];

console.log('\n1️⃣ Excel Serial Date Conversion:');
console.log('-'.repeat(60));

testCases.forEach(test => {
  const date = parseExcelSerialDate(test.serial, 2025);
  const formatted = formatDateToString(date);
  const passed = formatted === test.expected;

  console.log(`Serial ${test.serial} (${test.description}):`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got:      ${formatted}`);
  console.log(`  Local:    ${date.toLocaleDateString('ko-KR')}`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});

// Test round-trip: Date → String → Date
console.log('\n2️⃣ Round-trip Test (Date → String → Date):');
console.log('-'.repeat(60));

const originalDate = new Date(2025, 9, 1); // October 1, 2025
console.log('Original Date:', originalDate.toLocaleDateString('ko-KR'));

const dbString = formatDateToString(originalDate);
console.log('DB String:', dbString);

const parsedDate = parseDateString(dbString);
console.log('Parsed Date:', parsedDate.toLocaleDateString('ko-KR'));

const isSame = originalDate.getFullYear() === parsedDate.getFullYear() &&
               originalDate.getMonth() === parsedDate.getMonth() &&
               originalDate.getDate() === parsedDate.getDate();

console.log('Round-trip success:', isSame ? '✅ PASS' : '❌ FAIL');

// Test current date
console.log('\n3️⃣ Current Date Test:');
console.log('-'.repeat(60));

const now = new Date();
const nowString = formatDateToString(now);
console.log('Current Date:', now.toLocaleDateString('ko-KR'));
console.log('DB Format:', nowString);
console.log('Time Info:', {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  date: now.getDate(),
  hours: now.getHours(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
});

console.log('\n' + '='.repeat(60));
console.log('📊 Summary:');
const allPassed = testCases.every(test => {
  const date = parseExcelSerialDate(test.serial, 2025);
  const formatted = formatDateToString(date);
  return formatted === test.expected;
});

console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed - please check the date handling logic');