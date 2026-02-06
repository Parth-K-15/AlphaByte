// Test the certificate API endpoint
const testEmail = 'participant@alphabyte.com';
const url = `http://localhost:5000/api/participant/certificates?email=${encodeURIComponent(testEmail)}`;

console.log('🔍 Testing API endpoint...');
console.log('URL:', url);
console.log('');

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    console.log('📊 Stats:', data.data?.stats);
    console.log('🏆 Certificates:', data.data?.certificates?.length || 0);
    console.log('✅ Attended (no cert):', data.data?.attendedEventsWithoutCertificate?.length || 0);
    console.log('📝 All Events:', data.data?.allEvents?.length || 0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
