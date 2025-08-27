// Test script for API key functionality
const API_BASE = 'http://localhost:4000';

async function testApiKeySystem() {
  console.log('🧪 Testing Carcosa API Key System...\n');

  try {
    // 1. Test creating an API key (requires authentication)
    console.log('1️⃣ Testing API key creation...');
    const createResponse = await fetch(`${API_BASE}/api/v1/projects/1/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth_token=your_jwt_token_here' // You'll need to get this from login
      },
      body: JSON.stringify({
        label: 'Test API Key',
        permissions: ['read', 'write']
      })
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ API key created successfully:', createData.apiKey.substring(0, 20) + '...');
      
      const apiKey = createData.apiKey;
      
      // 2. Test using the API key for file upload
      console.log('\n2️⃣ Testing file upload with API key...');
      const uploadResponse = await fetch(`${API_BASE}/api/v1/projects/1/uploads/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          path: 'test-file.txt',
          contentType: 'text/plain',
          tenantId: null
        })
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log('✅ File upload initiated successfully');
        console.log('   - Upload ID:', uploadData.uploadId);
        console.log('   - File path:', uploadData.path);
        console.log('   - Signed URL:', uploadData.signedUrl.substring(0, 50) + '...');
      } else {
        const errorData = await uploadResponse.json();
        console.log('❌ File upload failed:', errorData);
      }

      // 3. Test listing uploads with API key
      console.log('\n3️⃣ Testing list uploads with API key...');
      const listResponse = await fetch(`${API_BASE}/api/v1/projects/1/uploads`, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        console.log('✅ Uploads listed successfully');
        console.log('   - Found', listData.uploads?.length || 0, 'uploads');
      } else {
        const errorData = await listResponse.json();
        console.log('❌ List uploads failed:', errorData);
      }

    } else {
      console.log('❌ API key creation failed - you may need to authenticate first');
      console.log('   Response:', await createResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎯 Test completed!');
  console.log('\n📝 To test manually:');
  console.log('1. Login to the dashboard');
  console.log('2. Go to a project\'s settings');
  console.log('3. Create an API key in the API Keys tab');
  console.log('4. Use the key with X-API-Key header in API calls');
}

// Run the test
testApiKeySystem();
