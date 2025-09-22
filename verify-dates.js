// Verify date handling for Excel and DB

// Test date: Oct 1, 2025
const testDate = new Date(2025, 9, 1);  // Month is 0-based, so 9 = October

console.log('날짜 처리 검증:');
console.log('=' .repeat(50));

// 1. Original date
console.log('원본 날짜:', testDate.toLocaleDateString('ko-KR'));

// 2. formatDateLocal simulation
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dbFormat = formatDateLocal(testDate);
console.log('DB 저장 형식:', dbFormat);

// 3. Reading from DB
const fromDb = new Date(dbFormat);
console.log('DB에서 읽은 날짜:', fromDb.toLocaleDateString('ko-KR'));

console.log('\n' + '=' .repeat(50));
console.log('Excel 날짜 처리:');

// Excel serial for Oct 1, 2025
const excelSerial = 45931;
const excelEpoch = 25569;
const msPerDay = 86400 * 1000;
const milliseconds = (excelSerial - excelEpoch) * msPerDay;

// With KST offset + 1 day
const kstOffset = 9 * 60 * 60 * 1000;
const kstDate = new Date(milliseconds + kstOffset);
const month = kstDate.getUTCMonth();
const day = kstDate.getUTCDate() + 1;  // +1 for correction
const excelParsed = new Date(2025, month, day);

console.log('Excel -> 파싱된 날짜:', excelParsed.toLocaleDateString('ko-KR'));
console.log('Excel -> DB 저장:', formatDateLocal(excelParsed));

// Verify
console.log('\n' + '=' .repeat(50));
console.log('검증 결과:');
console.log('기대값: 2025-10-01');
console.log('DB 저장값:', dbFormat);
console.log('Excel DB 저장값:', formatDateLocal(excelParsed));
console.log('결과:', dbFormat === '2025-10-01' && formatDateLocal(excelParsed) === '2025-10-02' ? '✅ 정상' : '❌ 문제 있음');