const http = require('http');

const ADMIN_TOKEN = process.env.VANI_ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  throw new Error('VANI_ADMIN_TOKEN is required to run the authenticated API tests.');
}

async function testEndpoint(path, method = 'GET', postData = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
        ...customHeaders
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
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE BACKEND & INQUIRY TESTS ---');
  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    try {
      await fn();
      console.log('PASS: ' + name);
      passed++;
    } catch (e) {
      console.error('FAIL: ' + name + ' -> ' + e.message);
    }
  }

  // 1. Check API Artworks
  await check('GET /api/artworks returns 200', async () => {
    const res = await testEndpoint('/api/artworks');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
    const json = JSON.parse(res.data);
    if (!Array.isArray(json)) throw new Error('Not an array');
  });

  // 2. Check API Social Links
  await check('GET /api/social-links returns 200', async () => {
    const res = await testEndpoint('/api/social-links');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
    const json = JSON.parse(res.data);
    if (!Array.isArray(json) || json.length === 0) throw new Error('Invalid social links data');
  });

  // 3. Check API Videos
  await check('GET /api/videos returns 200', async () => {
    const res = await testEndpoint('/api/videos');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
  });

  // 4. Test Buy Inquiry Submission
  const testEmail = `collector-test-${Date.now()}@example.com`;
  let createdInquiryId = null;
  await check('POST /api/inquiries records artwork buy inquiry', async () => {
    const testInquiry = {
      type: 'artwork_buy',
      artworkId: 'test-art-101',
      artworkTitle: 'Golden Horizon',
      artworkPrice: '$1,200',
      artworkImageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675',
      artworkMedium: 'Oil on Canvas',
      senderName: 'Test Collector',
      senderEmail: testEmail,
      message: 'I want to purchase this piece.'
    };
    const res = await testEndpoint('/api/inquiries', 'POST', testInquiry);
    if (res.statusCode !== 200 && res.statusCode !== 201) throw new Error('Status ' + res.statusCode + ' data: ' + res.data);
    const json = JSON.parse(res.data);
    if (!json.success || !json.inquiry.id) throw new Error('Missing inquiry confirmation');
    createdInquiryId = json.inquiry.id;
  });

  // 5. Verify Inquiry appears in Inquiries list
  await check('GET /api/inquiries returns recorded inquiries', async () => {
    if (!createdInquiryId) throw new Error('Create inquiry test did not return an id');
    const res = await testEndpoint('/api/inquiries');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
    const json = JSON.parse(res.data);
    if (!Array.isArray(json) || json.length === 0) throw new Error('No inquiries found');
    const found = json.find(i => i.id === createdInquiryId && i.senderEmail === testEmail);
    if (!found) throw new Error('Test inquiry not found in database');
  });

  // 6. Clean up the test inquiry so automated runs do not pollute production data.
  await check('DELETE /api/inquiries removes the test inquiry', async () => {
    if (!createdInquiryId) throw new Error('No test inquiry id available for cleanup');
    const res = await testEndpoint(`/api/inquiries/${encodeURIComponent(createdInquiryId)}`, 'DELETE');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode + ' data: ' + res.data);
  });

  // 7. Test Static Pages
  await check('GET /index.html returns 200', async () => {
    const res = await testEndpoint('/index.html');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
  });

  await check('GET /admin.html returns 200', async () => {
    const res = await testEndpoint('/admin.html');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
  });

  await check('GET /work.html returns 200', async () => {
    const res = await testEndpoint('/work.html');
    if (res.statusCode !== 200) throw new Error('Status ' + res.statusCode);
  });

  console.log('\nTEST RESULTS: ' + passed + '/' + total + ' PASSED');
}

runTests();
