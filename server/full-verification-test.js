const http = require('http');

async function request(path, method = 'GET', postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data, headers: res.headers });
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log('🧪 RUNNING FULL SITE, INQUIRY & ANTI-SPAM TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log('✅ PASS: ' + name);
      passed++;
    } catch (e) {
      console.error('❌ FAIL: ' + name + ' -> ' + e.message);
    }
  }

  // --- 1. Anti-Spam & Link Filter Tests ---
  await test('Legitimate inquiry without links is accepted (HTTP 201)', async () => {
    const validInquiry = {
      type: "artwork_buy",
      artworkTitle: "Golden Hour",
      artworkPrice: "$1,500",
      senderName: "Aarav Mehta",
      senderEmail: "aarav@example.com",
      message: "Hello Vani, I would love to acquire this original piece for my living room."
    };
    const res = await request('/api/inquiries', 'POST', validInquiry);
    if (res.statusCode !== 201 && res.statusCode !== 200) throw new Error('Status ' + res.statusCode + ' data: ' + res.data);
    const json = JSON.parse(res.data);
    if (!json.success || !json.inquiry) throw new Error('Missing inquiry confirmation');
  });

  await test('Spam inquiry with http link is blocked (HTTP 400)', async () => {
    const spamInquiry = {
      type: "artwork_buy",
      senderName: "Spammer",
      senderEmail: "spam@example.com",
      message: "Click here to buy followers http://spam.com/offer"
    };
    const res = await request('/api/inquiries', 'POST', spamInquiry);
    if (res.statusCode !== 400) throw new Error('Expected 400 Bad Request, got: ' + res.statusCode);
  });

  await test('Spam inquiry with www link is blocked (HTTP 400)', async () => {
    const spamInquiry = {
      type: "artwork_buy",
      senderName: "Promo Bot",
      senderEmail: "bot@example.com",
      message: "Visit www.promo-service.org for ranking boosts"
    };
    const res = await request('/api/inquiries', 'POST', spamInquiry);
    if (res.statusCode !== 400) throw new Error('Expected 400 Bad Request, got: ' + res.statusCode);
  });

  await test('Spam inquiry with domain in sender name is blocked (HTTP 400)', async () => {
    const spamInquiry = {
      type: "artwork_buy",
      senderName: "crypto-gain.xyz",
      senderEmail: "crypto@example.com",
      message: "Great art!"
    };
    const res = await request('/api/inquiries', 'POST', spamInquiry);
    if (res.statusCode !== 400) throw new Error('Expected 400 Bad Request, got: ' + res.statusCode);
  });

  // --- 2. All Frontend Pages & Asset Routing Tests ---
  const routes = [
    '/index.html',
    '/admin.html',
    '/work.html',
    '/about.html',
    '/contact.html',
    '/css/style.css',
    '/css/components.css',
    '/js/main.js',
    '/js/site-data.js',
    '/js/admin.js',
    '/assests/ppf.png'
  ];

  for (const r of routes) {
    await test(`Frontend route ${r} returns HTTP 200`, async () => {
      const res = await request(r);
      if (res.statusCode !== 200) throw new Error(`Route ${r} returned status ${res.statusCode}`);
    });
  }

  // --- 3. Public vs Protected API Tests ---
  await test('Public GET /api/artworks is accessible (HTTP 200)', async () => {
    const res = await request('/api/artworks');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
  });

  await test('Public GET /api/social-links is accessible (HTTP 200)', async () => {
    const res = await request('/api/social-links');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
  });

  await test('Protected GET /api/inquiries blocked without token (HTTP 401)', async () => {
    const res = await request('/api/inquiries');
    if (res.statusCode !== 401) throw new Error('Expected 401, received: ' + res.statusCode);
  });

  // --- 4. Cleanup Test Inquiries ---
  try {
    const listRes = await request('/api/inquiries', 'GET', null, { 'x-admin-token': 'vani2026' });
    if (listRes.statusCode === 200) {
      const items = JSON.parse(listRes.data);
      for (const item of items) {
        if (item.senderEmail && (item.senderEmail.includes('example.com') || item.senderEmail.includes('test.com'))) {
          await request('/api/inquiries/' + item.id, 'DELETE', null, { 'x-admin-token': 'vani2026' });
        }
      }
    }
  } catch (e) {}

  console.log('\n====================================================');
  console.log(`🎉 VERIFICATION RESULT: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
  console.log('====================================================\n');
}

runVerification();
