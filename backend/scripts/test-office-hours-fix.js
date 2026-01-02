/**
 * Test script to verify the office hours fix
 * This tests the corrected isWithinOfficeHours function
 */

require('dotenv').config();
const { isWithinOfficeHours, toIST } = require('../src/utils/haversine');

function testOfficeHoursFix() {
  console.log('=== TESTING OFFICE HOURS FIX ===\n');
  
  console.log('Testing the corrected isWithinOfficeHours function\n');
  
  console.log('Office Hours Definition: 9 AM to 8 PM IST (9:00 - 19:59 IST)');
  console.log('Time Conversion: UTC time -> IST hour extraction using timezone\n');
  
  // Test cases: Various check-in times in UTC that should be converted to IST for validation
  const testCases = [
    { utcTime: '2026-01-02T03:30:00Z', description: 'Check-in at 9:00 AM IST (3:30 AM UTC + 5:30h) - START OF OFFICE HOURS', expected: true },
    { utcTime: '2026-01-02T03:31:00Z', description: 'Check-in at 9:01 AM IST (3:31 AM UTC + 5:30h) - WITHIN OFFICE HOURS', expected: true },
    { utcTime: '2026-01-02T04:00:00Z', description: 'Check-in at 9:30 AM IST (4:00 AM UTC + 5:30h) - WITHIN OFFICE HOURS', expected: true },
    { utcTime: '2026-01-02T10:01:00Z', description: 'Check-in at 3:31 PM IST (10:01 AM UTC + 5:30h) - PROBLEMATIC CASE - WITHIN OFFICE HOURS', expected: true },
    { utcTime: '2026-01-02T10:30:00Z', description: 'Check-in at 4:00 PM IST (10:30 AM UTC + 5:30h) - WITHIN OFFICE HOURS', expected: true },
    { utcTime: '2026-01-02T14:29:00Z', description: 'Check-in at 7:59 PM IST (2:59 PM UTC + 5:30h) - END OF OFFICE HOURS', expected: true },
    { utcTime: '2026-01-02T14:30:00Z', description: 'Check-in at 8:00 PM IST (3:00 PM UTC + 5:30h) - OUTSIDE OFFICE HOURS', expected: false },
    { utcTime: '2026-01-02T14:31:00Z', description: 'Check-in at 8:01 PM IST (3:01 PM UTC + 5:30h) - OUTSIDE OFFICE HOURS', expected: false },
    { utcTime: '2026-01-02T00:00:00Z', description: 'Check-in at 5:30 AM IST (12:00 AM UTC + 5:30h) - OUTSIDE OFFICE HOURS', expected: false },
    { utcTime: '2026-01-02T00:30:00Z', description: 'Check-in at 6:00 AM IST (12:30 AM UTC + 5:30h) - OUTSIDE OFFICE HOURS', expected: false },
    { utcTime: '2026-01-02T03:29:00Z', description: 'Check-in at 8:59 AM IST (3:29 AM UTC + 5:30h) - LAST MINUTE BEFORE OFFICE HOURS', expected: false },
    { utcTime: '2026-01-02T14:59:00Z', description: 'Check-in at 8:29 PM IST (3:29 PM UTC + 5:30h) - OUTSIDE OFFICE HOURS', expected: false },
  ];
  
  console.log('TIME CONVERSION TABLE:');
  console.log('UTC Time in DB | Expected IST | Within Office Hours | Result | Status');
  console.log('---------------|--------------|-------------------|--------|--------');
  
  let allTestsPassed = true;
  
  testCases.forEach((testCase, index) => {
    const utcTime = new Date(testCase.utcTime);
    
    // Calculate expected IST time manually for display
    const istTime = new Date(utcTime.getTime() + (5.5 * 60 * 60 * 1000));
    const istHour = parseInt(utcTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }));
    
    const result = isWithinOfficeHours(utcTime);
    const passed = result === testCase.expected;
    
    if (!passed) {
      allTestsPassed = false;
    }
    
    console.log(`${utcTime.toISOString().substr(11, 5)} UTC   | ${istTime.toISOString().substr(11, 5)} IST   | ${testCase.expected ? 'YES' : 'NO '.padEnd(17)} | ${result ? 'YES' : 'NO '.padEnd(3)} | ${passed ? 'PASS' : 'FAIL'}`);
    console.log(`              | ${istHour}:xx IST      |                   |        | ${testCase.description}`);
    console.log('--------------------------------------------------------------------------------------------------');
  });
  
  console.log(`\nOVERALL RESULT: ${allTestsPassed ? 'ALL TESTS PASSED! ✅' : 'SOME TESTS FAILED! ❌'}`);
  
  console.log('\nTESTING THE SPECIFIC PROBLEMATIC CASE:');
  const problematicTime = new Date('2026-01-02T10:01:23.017Z');
  const problematicResult = isWithinOfficeHours(problematicTime);
  console.log(`DB time: ${problematicTime.toISOString()}`);
  console.log(`IST time: ${new Date(problematicTime.getTime() + (5.5 * 60 * 60 * 1000)).toISOString()}`);
  console.log(`IST hour: ${parseInt(problematicTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }))}`);
  console.log(`Within office hours: ${problematicResult} (SHOULD BE: true)`);
  console.log(`Status: ${problematicResult === true ? 'FIXED! ✅' : 'STILL BROKEN! ❌'}`);
  
  console.log('\nADDITIONAL BOUNDARY TESTS:');
  
  // Test boundary conditions
  const boundaryTests = [
    { time: '2026-01-02T03:29:59Z', desc: 'Just before office start (8:59 AM IST) - should be outside', expected: false },
    { time: '2026-01-02T03:30:00Z', desc: 'Office start time (9:00 AM IST) - should be within', expected: true },
    { time: '2026-01-02T03:30:01Z', desc: 'Just after office start (9:00 AM IST) - should be within', expected: true },
    { time: '2026-01-02T14:29:59Z', desc: 'Just before office end (7:59 PM IST) - should be within', expected: true },
    { time: '2026-01-02T14:30:00Z', desc: 'Office end time (8:00 PM IST) - should be outside', expected: false },
    { time: '2026-01-02T14:30:01Z', desc: 'Just after office end (8:01 PM IST) - should be outside', expected: false },
  ];
  
  boundaryTests.forEach(test => {
    const utcTime = new Date(test.time);
    const result = isWithinOfficeHours(utcTime);
    const passed = result === test.expected;
    const status = passed ? '✅' : '❌';
    console.log(`${test.desc}: ${result ? 'WITHIN' : 'OUTSIDE'} office hours - ${status}`);
  });
  
  if (allTestsPassed) {
    console.log('\n🎉 OFFICE HOURS LOGIC FIX VERIFICATION: SUCCESS! 🎉');
    console.log('The attendance flagging issue has been resolved.');
    console.log('Times that should be within office hours (9 AM - 8 PM IST) will no longer be incorrectly flagged.');
  } else {
    console.log('\n❌ OFFICE HOURS LOGIC FIX VERIFICATION: FAILED ❌');
    console.log('Some tests failed. The fix needs more work.');
  }
  
  return allTestsPassed;
}

// Run the test
const result = testOfficeHoursFix();
process.exit(result ? 0 : 1);