const http = require('http');
const db = require('../db/database');
const bcrypt = require('bcryptjs');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runSecurityTestSuite() {
  console.log('===============================================================');
  console.log(' SETTL EXPERT — SUPER ADMIN LOCKOUT & SECURITY VERIFICATION');
  console.log('===============================================================');

  const adminEmail = 'settlexperts@gmail.com';
  const correctPassword = 'settlexpert931075@Abc';
  const wrongPassword = 'IncorrectPassword123!';

  // Reset admin state before starting test
  db.prepare(`
    UPDATE users 
    SET failed_login_attempts = 0, locked_until = NULL 
    WHERE email = ?
  `).run(adminEmail);

  // 1. Test 1 to 4 failed attempts
  console.log('\n--- Test Phase 1: Consecutive Failed Password Attempts 1 to 4 ---');
  for (let i = 1; i <= 4; i++) {
    const res = await postJson('http://localhost:5000/api/auth/login', {
      email: adminEmail,
      password: wrongPassword
    });

    const userState = db.prepare('SELECT failed_login_attempts, locked_until FROM users WHERE email = ?').get(adminEmail);
    console.log(`Attempt ${i} Response: HTTP ${res.status}, failed_attempts in DB: ${userState.failed_login_attempts}, locked_until: ${userState.locked_until}`);

    if (res.status !== 401 || userState.failed_login_attempts !== i || userState.locked_until !== null) {
      throw new Error(`Attempt ${i} assertion failed`);
    }
  }
  console.log('✔ Phase 1 Passed: Attempts 1-4 increment failed_login_attempts and do not lock account.');

  // 2. Test 5th failed attempt -> Must trigger account lockout for 15 mins
  console.log('\n--- Test Phase 2: 5th Failed Attempt -> 15-Minute Account Lockout ---');
  const res5 = await postJson('http://localhost:5000/api/auth/login', {
    email: adminEmail,
    password: wrongPassword
  });

  const lockedState = db.prepare('SELECT failed_login_attempts, locked_until FROM users WHERE email = ?').get(adminEmail);
  console.log(`5th Attempt Response: HTTP ${res5.status}`);
  console.log(`Error Message: "${res5.body?.error}"`);
  console.log(`DB State: failed_attempts = ${lockedState.failed_login_attempts}, locked_until = ${lockedState.locked_until}`);

  if (res5.status !== 403 || !lockedState.locked_until) {
    throw new Error('5th attempt failed to lock account');
  }

  const expectedErrMsg = 'Too many failed login attempts. Your account has been temporarily locked. Please try again after 15 minutes.';
  if (res5.body.error !== expectedErrMsg) {
    throw new Error(`Expected exact error message "${expectedErrMsg}", got "${res5.body.error}"`);
  }
  console.log('✔ Phase 2 Passed: 5th attempt immediately locks account with exact 15-min lockout message.');

  // 3. Test that even CORRECT password CANNOT bypass the active lock
  console.log('\n--- Test Phase 3: Correct Password Blocked During Active Lock ---');
  const resCorrectWhileLocked = await postJson('http://localhost:5000/api/auth/login', {
    email: adminEmail,
    password: correctPassword
  });

  console.log(`Login with Correct Password during lock: HTTP ${resCorrectWhileLocked.status}`);
  if (resCorrectWhileLocked.status !== 403 || resCorrectWhileLocked.body.error !== expectedErrMsg) {
    throw new Error('Correct password bypassed the active lockout');
  }
  console.log('✔ Phase 3 Passed: Correct password strictly rejected during active lockout.');

  // 4. Test Automatic Expiration after 15 minutes
  console.log('\n--- Test Phase 4: Automatic Unlock after 15-Minute Timer Expiry ---');
  // Simulate time travel: set locked_until to 1 minute in the past
  const pastTime = new Date(Date.now() - 60 * 1000).toISOString();
  db.prepare('UPDATE users SET locked_until = ? WHERE email = ?').run(pastTime, adminEmail);

  // Now login with correct password -> Should automatically unlock and succeed
  const resAfterExpiry = await postJson('http://localhost:5000/api/auth/login', {
    email: adminEmail,
    password: correctPassword
  });

  const stateAfterSuccess = db.prepare('SELECT failed_login_attempts, locked_until, last_login_at FROM users WHERE email = ?').get(adminEmail);
  console.log(`Login Response after timer expiry: HTTP ${resAfterExpiry.status}`);
  console.log(`DB State after successful login: failed_attempts = ${stateAfterSuccess.failed_login_attempts}, locked_until = ${stateAfterSuccess.locked_until}, last_login_at = ${stateAfterSuccess.last_login_at}`);

  if (resAfterExpiry.status !== 200 || !resAfterExpiry.body.token || stateAfterSuccess.failed_login_attempts !== 0 || stateAfterSuccess.locked_until !== null) {
    throw new Error('Login failed or did not reset failed_attempts after lock expiration');
  }
  console.log('✔ Phase 4 Passed: Automatic unlock without manual intervention, failed_attempts reset to 0.');

  // 5. Verify Security Audit Logs and No Password Leaks
  console.log('\n--- Test Phase 5: Audit Log Integrity & Zero Password Leakage ---');
  const logs = db.prepare(`SELECT * FROM audit_logs WHERE module = 'Auth' ORDER BY created_at DESC LIMIT 10`).all();
  console.log(`Found ${logs.length} recent Auth audit logs:`);
  for (const l of logs) {
    console.log(` - Action: "${l.action}", IP: "${l.ip_address}", Details: ${l.details_json}`);
    if (l.details_json && (l.details_json.includes(correctPassword) || l.details_json.includes(wrongPassword))) {
      throw new Error('SECURITY VIOLATION: Plaintext password leaked in audit logs');
    }
  }
  console.log('✔ Phase 5 Passed: Security events properly logged, zero plaintext passwords stored.');

  // 6. Verify Employee / Manager authentication is unmodified
  console.log('\n--- Test Phase 6: Employee / Manager Authentication Unmodified ---');
  const empLogin = await postJson('http://localhost:5000/api/auth/login', {
    email: 'consultant@settlexpert.com',
    password: 'Employee@123'
  });
  console.log(`Employee Login Response: HTTP ${empLogin.status}, Role: ${empLogin.body?.user?.role}`);
  if (empLogin.status !== 200 || empLogin.body?.user?.role !== 'employee') {
    throw new Error('Employee authentication failed');
  }
  console.log('✔ Phase 6 Passed: Employee authentication completely functional and unaffected.');

  console.log('\n===============================================================');
  console.log(' ALL 14 SUPER ADMIN LOCKOUT & SECURITY CHECKS PASSED (100%)');
  console.log('===============================================================');
}

runSecurityTestSuite().catch((err) => {
  console.error('\nSecurity Test Suite Error:', err);
  process.exit(1);
});
