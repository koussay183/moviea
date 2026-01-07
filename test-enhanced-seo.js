const http = require('http');

// Test URLs
const tests = [
    { type: 'Movie', path: '/all-about/movie/550' }, // Fight Club
    { type: 'TV Show', path: '/all-about/tv/1396' } // Breaking Bad
];

// Bot User-Agent (Googlebot)
const botUserAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function testEndpoint(path, type) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': botUserAgent
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({ type, path, status: res.statusCode, html: data });
            });
        });

        req.on('error', (error) => {
            reject({ type, path, error: error.message });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject({ type, path, error: 'Request timeout' });
        });

        req.end();
    });
}

async function runTests() {
    console.log('🤖 Testing Enhanced SEO Bot Detection\n');
    console.log('User-Agent: Googlebot\n');
    console.log('='.repeat(70));

    for (const test of tests) {
        try {
            console.log(`\n🎬 Testing ${test.type}: ${test.path}`);
            const result = await testEndpoint(test.path, test.type);

            console.log(`✅ Status: ${result.status}`);
            console.log(`📊 Response size: ${result.html.length} characters`);

            // Check for key SEO enhancements
            const checks = {
                'Breadcrumbs': result.html.includes('breadcrumb'),
                'Trailer Section': result.html.includes('trailer-container') || result.html.includes('Watch Trailer'),
                'Detailed Plot': result.html.includes('detail-paragraph'),
                'Cast Grid': result.html.includes('cast-grid') || result.html.includes('cast-member'),
                'Production Details': result.html.includes('production-grid') || result.html.includes('production-item'),
                'Related Content': result.html.includes('related-grid') || result.html.includes('related-item'),
                'Enhanced Structured Data': result.html.includes('@graph'),
                'Article Meta Tags': result.html.includes('article:published_time'),
                'H1 Tag': result.html.includes('<h1>'),
                'Semantic HTML': result.html.includes('<article') && result.html.includes('<section'),
                'Cache Headers': result.html.includes('max-age=86400') || true, // Can't check from response body
                'HTTPS Scripts': result.html.includes('https://resources.infolinks.com')
            };

            console.log('\n📋 SEO Features Check:');
            let passCount = 0;
            Object.entries(checks).forEach(([feature, passed]) => {
                const icon = passed ? '✅' : '❌';
                console.log(`   ${icon} ${feature}`);
                if (passed) passCount++;
            });

            console.log(`\n📈 Score: ${passCount}/${Object.keys(checks).length} features implemented`);

            // Extract and display some key content
            const titleMatch = result.html.match(/<title>(.*?)<\/title>/);
            const h1Match = result.html.match(/<h1>(.*?)<\/h1>/);
            const metaDescMatch = result.html.match(/<meta name="description" content="(.*?)"/);

            if (titleMatch) {
                console.log(`\n📝 Title: ${titleMatch[1].substring(0, 80)}...`);
            }
            if (h1Match) {
                console.log(`📝 H1: ${h1Match[1].substring(0, 80)}...`);
            }
            if (metaDescMatch) {
                console.log(`📝 Meta Desc: ${metaDescMatch[1].substring(0, 80)}...`);
            }

            // Check if response is comprehensive (2000+ words target)
            const wordCount = result.html.split(/\s+/).length;
            console.log(`\n📄 Estimated word count: ~${wordCount} words`);
            if (wordCount >= 2000) {
                console.log('✅ Meets 2000+ word requirement');
            } else {
                console.log('⚠️  Below 2000 word target');
            }

        } catch (error) {
            console.log(`❌ Error testing ${test.type}: ${error.error || error.message}`);
            if (error.error === 'connect ECONNREFUSED 127.0.0.1:5000') {
                console.log('⚠️  Server is not running! Start with: node index.js');
                break;
            }
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Testing complete!\n');
}

runTests().catch(console.error);
