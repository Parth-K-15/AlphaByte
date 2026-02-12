import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testPasswordChange() {
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
    console.log('Login response:', loginResponse.status, loginData.success ? 'SUCCESS' : loginData);

    if (!loginData.success) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginData.data.token;
    console.log('\n2. Token received');

    console.log('\n3. Testing password change endpoint...');
    const passwordResponse = await fetch(`${API_BASE}/participant/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'part123',
        newPassword: 'newpass123',
      }),
    });

    const passwordData = await passwordResponse.json();
    console.log('Password change response:', passwordResponse.status, passwordData);

    if (passwordData.success) {
      console.log('\n✅ Password change successful!');
    } else {
      console.error('\n❌ Password change failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPasswordChange();
