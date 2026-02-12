// Test simulating the organizer certificate generation call
const testEmail = 'participant@alphabyte.com';
const eventId = '697f914d7f3e8adc9d196a1b'; // Hackmatrix 4.0
const organizerId = '6746b2c16e3a68fddfb4abff'; // Use a test organizer ID

const url = `http://localhost:5000/api/organizer/certificates/${eventId}/generate`;

console.log('🔬 Testing Certificate Generation...');
console.log('Event ID:', eventId);
console.log('POST URL:', url);
console.log('');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizerId,
    template: 'default',
    achievement: 'Participation',
    competitionName: 'Hackmatrix 4.0'
  })
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ SUCCESS!');
      console.log('Generated:', data.data?.generated || 0);
      console.log('Failed:', data.data?.failed || 0);
    } else {
      console.log('\n❌ FAILED!');
      console.log('Message:', data.message);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
