/**
 * Script to fix the date format in existing video sitemap XML files
 * 
 * Google's Video Sitemap specification requires dates in W3C format (YYYY-MM-DDThh:mm:ss+TZD)
 * not just a bare YYYY-MM-DD date.
 */

const fs = require('fs').promises;
const path = require('path');

// Path to the video sitemap file
const sitemapPath = path.join(__dirname, '..', 'public', 'sitemaps', 'video-sitemap.xml');

// Path for backup
const backupPath = sitemapPath.replace('.xml', '.backup.xml');

async function fixSitemapDates() {
    try {
        console.log('Reading sitemap file...');
        const data = await fs.readFile(sitemapPath, 'utf8');

        // Create backup of original file
        console.log('Creating backup...');
        await fs.writeFile(backupPath, data);

        // Replace dates using regex
        console.log('Fixing dates in sitemap...');
        const fixedData = data.replace(
            /(<video:publication_date>)(\d{4}-\d{2}-\d{2})(<\/video:publication_date>)/g, 
            '$1$2T00:00:00+00:00$3'
        );

        // Write fixed content back to file
        console.log('Writing fixed sitemap...');
        await fs.writeFile(sitemapPath, fixedData);

        // Count number of fixes
        const originalMatches = data.match(/(<video:publication_date>)(\d{4}-\d{2}-\d{2})(<\/video:publication_date>)/g) || [];
        console.log(`Fixed ${originalMatches.length} dates in the sitemap file`);
        
        console.log('Sitemap date format fixed successfully!');
        console.log(`Original backup saved to: ${backupPath}`);
        console.log(`Updated sitemap saved to: ${sitemapPath}`);
        
    } catch (error) {
        console.error('Error fixing sitemap dates:', error);
    }
}

// Run the function
fixSitemapDates();
