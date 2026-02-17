import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testAdminLogin() {
  const credentials = [
    { email: 'admin@alphabyte.com', password: 'admin123' },
    { email: 'admin@alphabyte.com', password: 'Admin123' },
    { email: 'admin@alphabyte.com', password: 'alphabyte123' },
  ];

  for (const cred of credentials) {
    console.log(`\nTrying: ${cred.email} / ${cred.password}`);
    
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred),
      });

      const data = await response.json();
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      
      if (data.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('User:', data.data.user);
        console.log('Token:', data.data.token);
        console.log('Redirect:', data.data.redirectPath);
        return;
      } else {
        console.log('Message:', data.message);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  console.log('\n❌ None of the credentials worked');
}

testAdminLogin();
