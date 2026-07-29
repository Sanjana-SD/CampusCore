const http = require('http');

const BACKEND_URL = 'http://localhost:5000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const postRequest = (path, payload) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
};

async function runMockScanner() {
  console.log('=====================================================');
  console.log('         CampusCore ESP8266 Simulator Script         ');
  console.log('=====================================================');
  console.log(`Targeting backend server: ${BACKEND_URL}`);
  console.log('Make sure the backend server is running ("npm start") before executing this.\n');

  const studentCard = '83A2C51B'; // Mohammed Taha Shariff (active student)
  const unrecognizedCard = 'FFFFFFFF'; // Invalid RFID card
  const bookCard = 'BOOK_UID_01'; // RFID tag for Computer Networks book
  const gateDevice = 'GATE_READER_01';

  // Test Case 1: Unrecognized Card Scan
  console.log('--- TEST 1: Unrecognized RFID Scan ---');
  try {
    const res1 = await postRequest('/api/attendance/scan', {
      rfid_uid: unrecognizedCard,
      timestamp: new Date().toISOString(),
      device_id: gateDevice
    });
    console.log(`Response status: ${res1.statusCode}`);
    console.log(`Result: ${res1.data.result}`);
    console.log(`Message: ${res1.data.message}\n`);
  } catch (err) {
    console.error('Test 1 failed. Is backend running?', err.message);
    return;
  }

  // Test Case 2: First check-in (IN)
  console.log('--- TEST 2: Active Student Check-In (IN) ---');
  const res2 = await postRequest('/api/attendance/scan', {
    rfid_uid: studentCard,
    timestamp: new Date().toISOString(),
    device_id: gateDevice
  });
  console.log(`Response status: ${res2.statusCode}`);
  console.log(`Result: ${res2.data.result}`);
  console.log(`Student: ${res2.data.student_name}`);
  console.log(`Message: ${res2.data.message}\n`);

  // Test Case 3: Rapid Double-Tap (Debounce limit = 5s)
  console.log('--- TEST 3: Rapid Double-Tap (Debounce Check, 1s later) ---');
  await sleep(1000);
  const res3 = await postRequest('/api/attendance/scan', {
    rfid_uid: studentCard,
    timestamp: new Date().toISOString(),
    device_id: gateDevice
  });
  console.log(`Response status: ${res3.statusCode}`);
  console.log(`Result: ${res3.data.result}`);
  console.log(`Message: ${res3.data.message}\n`);

  // Test Case 4: Normal check-out (OUT, 6s later to clear debounce)
  console.log('--- TEST 4: Student Check-Out (OUT, waiting 6 seconds...) ---');
  await sleep(5500); // 5.5 seconds sleep
  const res4 = await postRequest('/api/attendance/scan', {
    rfid_uid: studentCard,
    timestamp: new Date().toISOString(),
    device_id: gateDevice
  });
  console.log(`Response status: ${res4.statusCode}`);
  console.log(`Result: ${res4.data.result}`);
  console.log(`Message: ${res4.data.message}\n`);

  // Test Case 5: Multiple check-ins (IN-OUT cycle toggle check)
  console.log('--- TEST 5: Re-entry Cycle (IN, waiting 6 seconds...) ---');
  await sleep(5500);
  const res5 = await postRequest('/api/attendance/scan', {
    rfid_uid: studentCard,
    timestamp: new Date().toISOString(),
    device_id: gateDevice
  });
  console.log(`Response status: ${res5.statusCode}`);
  console.log(`Result: ${res5.data.result}`);
  console.log(`Message: ${res5.data.message}\n`);

  console.log('=====================================================');
  console.log('          Simulation checks completed.               ');
  console.log('=====================================================');
}

runMockScanner();
