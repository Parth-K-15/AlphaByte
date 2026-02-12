import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testProfileAccess() {
  try {
    console.log('1. Logging in as participant...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'participant@alphabyte.com',
        password: 'part123',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginResponse.status, loginData);

    if (!loginData.success) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginData.data.token;
    console.log('\n2. Token received:', token.substring(0, 20) + '...');

    console.log('\n3. Accessing profile endpoint...');
    const profileResponse = await fetch(`${API_BASE}/participant/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const profileData = await profileResponse.json();
    console.log('Profile response:', profileResponse.status, profileData);

    if (profileData.success) {
      console.log('\n✅ Profile access successful!');
      console.log('Profile data:', {
        name: profileData.data.name,
        email: profileData.data.email,
        college: profileData.data.college,
      });
    } else {
      console.error('\n❌ Profile access failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProfileAccess();
