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

async function verifyAuth() {
  console.log('====================================================');
  console.log(' VERIFYING SUPER ADMIN LOGIN CREDENTIALS');
  console.log('====================================================');

  const email = 'settlexperts@gmail.com';
  const password = 'settlexpert931075@Abc';

  // 1. Verify Database State
  const user = db.prepare('SELECT id, name, email, role, status, password_hash FROM users WHERE email = ?').get(email);
  console.log('1. Database Record Check:', {
    exists: !!user,
    id: user?.id,
    email: user?.email,
    role: user?.role,
    status: user?.status,
    isHashBcrypt: user?.password_hash.startsWith('$2'),
    plaintextMatch: user?.password_hash === password ? 'SECURITY_BREACH' : 'PROPERLY_HASHED'
  });

  if (!user || user.role !== 'admin' || user.status !== 'active') {
    throw new Error('Super Admin user is missing or inactive in database');
  }

  // 2. Verify Bcrypt compare
  const isMatch = bcrypt.compareSync(password, user.password_hash);
  console.log('2. Direct Password Verify:', isMatch ? 'SUCCESS' : 'FAILED');
  if (!isMatch) throw new Error('Password hash does not match plain password');

  // 3. Verify API Login with Correct Credentials
  const loginRes = await postJson('http://localhost:5000/api/auth/login', {
    email: email,
    password: password
  });

  console.log('3. API Login Response Status:', loginRes.status);
  console.log('   User Returned:', loginRes.body.user);
  console.log('   Has Token:', !!loginRes.body.token);
  console.log('   Password Hash Leak Check in API Response:', loginRes.body.user.password_hash === undefined ? 'SAFE (No Leak)' : 'LEAKED');

  if (loginRes.status !== 200 || !loginRes.body.token || loginRes.body.user.role !== 'admin') {
    throw new Error('API Login failed for Super Admin');
  }

  // 4. Verify API Login Rejects Wrong Password
  const wrongRes = await postJson('http://localhost:5000/api/auth/login', {
    email: email,
    password: 'WrongPassword@123'
  });

  console.log('4. API Wrong Password Rejection Status:', wrongRes.status, '(Expected 401)');
  if (wrongRes.status !== 401) {
    throw new Error('API allowed login with wrong password');
  }

  console.log('\n====================================================');
  console.log(' ALL SUPER ADMIN AUTHENTICATION CHECKS PASSED (100%)');
  console.log('====================================================');
}

verifyAuth().catch((err) => {
  console.error('Verification Error:', err);
  process.exit(1);
});
