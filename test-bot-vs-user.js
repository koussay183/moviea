const http = require('http');

// Test with both bot and regular user
async function testBothUserAgents(path, type) {
    const botUA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const userUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎬 Testing: ${type} - ${path}`);
    console.log('='.repeat(70));

    // Test Bot
    const botResult = await makeRequest(path, botUA);
    console.log(`\n🤖 BOT (Googlebot):`);
    console.log(`   Status: ${botResult.status}`);
    console.log(`   Size: ${botResult.html.length} characters`);
    console.log(`   Has enhanced content: ${botResult.html.includes('breadcrumb') ? '✅ Yes' : '❌ No'}`);
    console.log(`   Has trailer: ${botResult.html.includes('trailer-container') ? '✅ Yes' : '❌ No'}`);
    console.log(`   Has @graph: ${botResult.html.includes('@graph') ? '✅ Yes' : '❌ No'}`);
    
    // Test User
    const userResult = await makeRequest(path, userUA);
    console.log(`\n👤 USER (Chrome):`);
    console.log(`   Status: ${userResult.status}`);
    console.log(`   Size: ${userResult.html.length} characters`);
    console.log(`   Has React SPA: ${userResult.html.includes('static/js/main') ? '✅ Yes' : '❌ No'}`);
    console.log(`   Minimal meta: ${userResult.html.length < 5000 ? '✅ Yes (lightweight)' : '❌ No'}`);
    
    console.log(`\n📊 Comparison:`);
    console.log(`   Bot content is ${(botResult.html.length / userResult.html.length).toFixed(2)}x larger`);
    console.log(`   Different responses: ${botResult.html !== userResult.html ? '✅ Yes' : '❌ No'}`);
}

function makeRequest(path, userAgent) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: { 'User-Agent': userAgent }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, html: data });
            });
        });

        req.on('error', (error) => {
            reject({ error: error.message });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject({ error: 'Request timeout' });
        });

        req.end();
    });
}

async function runTests() {
    console.log('🚀 Testing Bot vs User Detection\n');
    
    try {
        await testBothUserAgents('/all-about/movie/550', 'Movie (Fight Club)');
        await testBothUserAgents('/all-about/tv/1396', 'TV Show (Breaking Bad)');
        
        console.log(`\n${'='.repeat(70)}`);
        console.log('✅ All tests completed successfully!\n');
    } catch (error) {
        console.log(`\n❌ Error: ${error.error || error.message}`);
        if (error.error === 'connect ECONNREFUSED 127.0.0.1:5000') {
            console.log('⚠️  Server is not running! Start with: node index.js\n');
        }
    }
}

runTests();
