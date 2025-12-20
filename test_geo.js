
const API_KEY = 'AIzaSyBplMddsBbre7pCjuMfzeGjmpsHd2IGBqk';

async function testGeo() {
    try {
        console.log('Testing Google Geolocation API...');
        const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ considerIp: true })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testGeo();
