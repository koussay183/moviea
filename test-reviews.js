const http = require('http');

// Test URLs
const tests = [
    { type: 'Movie', path: '/all-about/movie/550', title: 'Fight Club' },
    { type: 'TV Show', path: '/all-about/tv/1396', title: 'Breaking Bad' }
];

// Bot User-Agent (Googlebot)
const botUserAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function testEndpoint(path, type, title) {
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
                resolve({ type, path, title, status: res.statusCode, html: data });
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
    console.log('🎬 Testing Enhanced SEO with User Reviews\n');
    console.log('User-Agent: Googlebot\n');
    console.log('='.repeat(70));

    for (const test of tests) {
        try {
            console.log(`\n🎥 Testing ${test.type}: ${test.title}`);
            console.log('-'.repeat(70));
            
            const result = await testEndpoint(test.path, test.type, test.title);

            console.log(`✅ Status: ${result.status}`);
            console.log(`📊 Response size: ${result.html.length.toLocaleString()} characters`);

            // Check for new features
            const checks = {
                'User Reviews Section': result.html.includes('user-reviews') || result.html.includes('User Reviews'),
                'Review Cards': result.html.includes('review-card'),
                'Review Author': result.html.includes('review-author'),
                'Review Content': result.html.includes('review-content'),
                'Trailer Embed': result.html.includes('youtube.com/embed') || result.html.includes('trailer-container'),
                'Meta Image (og:image)': result.html.includes('og:image'),
                'Twitter Image': result.html.includes('twitter:image'),
                'Breadcrumbs': result.html.includes('breadcrumb'),
                'Cast Grid': result.html.includes('cast-grid') || result.html.includes('cast-member'),
                'Production Details': result.html.includes('production-grid'),
                'Related Content': result.html.includes('related-grid'),
                'Enhanced Structured Data': result.html.includes('@graph')
            };

            console.log('\n📋 Features Check:');
            let passCount = 0;
            Object.entries(checks).forEach(([feature, passed]) => {
                const icon = passed ? '✅' : '❌';
                console.log(`   ${icon} ${feature}`);
                if (passed) passCount++;
            });

            console.log(`\n📈 Score: ${passCount}/${Object.keys(checks).length} features`);

            // Check meta image specifically
            const ogImageMatch = result.html.match(/<meta property="og:image" content="([^"]+)"/);
            if (ogImageMatch) {
                console.log(`\n🖼️  Meta Image URL: ${ogImageMatch[1].substring(0, 60)}...`);
            } else {
                console.log('\n⚠️  No og:image meta tag found!');
            }

            // Count reviews
            const reviewCount = (result.html.match(/review-card/g) || []).length;
            console.log(`\n💬 User Reviews Found: ${reviewCount} ${reviewCount > 0 ? '✅' : '⚠️  (No reviews available)'}`);

            // Word count
            const wordCount = result.html.split(/\s+/).length;
            console.log(`📄 Total word count: ~${wordCount.toLocaleString()} words`);

        } catch (error) {
            console.log(`❌ Error testing ${test.type}:`);
            console.log('   Error details:', JSON.stringify(error, null, 2));
            if (error.error && error.error.includes('ECONNREFUSED')) {
                console.log('\n⚠️  Server is not running! Start with: node index.js');
                break;
            }
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Testing complete!\n');
}

runTests().catch(console.error);
