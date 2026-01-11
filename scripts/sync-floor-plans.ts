// Automatically fetch floor plan URLs from DB, download them, and update DB with local paths
// Run with: npm run sync-floor-plans

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const FLOOR_PLANS_DIR = path.join(process.cwd(), 'public', 'floor-plans');
const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL not found in environment variables");
  console.error("   Make sure .env.local exists with VITE_CONVEX_URL");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Download a file
const downloadFile = (url: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(outputPath);
    
    console.log(`   Downloading: ${url.substring(0, 80)}...`);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(outputPath);
          return downloadFile(redirectUrl, outputPath).then(resolve).catch(reject);
        }
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        return reject(new Error(`HTTP ${response.statusCode} ${response.statusMessage}`));
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      reject(err);
    });
  });
};

// Generate a safe filename from URL
const generateFilename = (url: string, index: number): string => {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const ext = path.extname(pathname) || '.png';
  
  // Try to extract meaningful name
  const filename = path.basename(pathname, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50);
  
  // If filename is too generic or empty, use index
  if (!filename || filename.length < 3) {
    return `floor-plan-${index + 1}${ext}`;
  }
  
  return `${filename}-${index + 1}${ext}`;
};

async function main() {
  console.log('🔄 Floor Plan Sync Utility\n');
  console.log('📊 Fetching floor plans from database...\n');

  // Ensure floor-plans directory exists
  if (!fs.existsSync(FLOOR_PLANS_DIR)) {
    fs.mkdirSync(FLOOR_PLANS_DIR, { recursive: true });
    console.log(`✅ Created directory: ${FLOOR_PLANS_DIR}\n`);
  }

  // Fetch all floors from database
  const floors = await client.query(api.siteMap.getAllFloorsWithUrls);
  
  if (!floors || floors.length === 0) {
    console.log('ℹ️  No floors found in database');
    return;
  }

  console.log(`📋 Found ${floors.length} areas in database\n`);

  const externalUrls = floors.filter(
    floor => floor.floorPlanUrl && 
    (floor.floorPlanUrl.startsWith('http://') || floor.floorPlanUrl.startsWith('https://'))
  );

  if (externalUrls.length === 0) {
    console.log('✅ All floor plans already use local paths!');
    console.log('   Nothing to sync.\n');
    return;
  }

  console.log(`🌐 Found ${externalUrls.length} external URLs to download:\n`);

  const updates: Array<{ floorId: string; oldUrl: string; newUrl: string }> = [];

  for (let i = 0; i < externalUrls.length; i++) {
    const floor = externalUrls[i];
    const url = floor.floorPlanUrl!;
    
    console.log(`[${i + 1}/${externalUrls.length}] ${floor.name}`);
    console.log(`   Current URL: ${url.substring(0, 80)}...`);

    // Generate local filename
    const filename = generateFilename(url, i);
    const localPath = path.join(FLOOR_PLANS_DIR, filename);
    const localUrl = `/floor-plans/${filename}`;

    // Check if already downloaded
    if (fs.existsSync(localPath)) {
      console.log(`   ⏭️  Already exists: ${filename}`);
      updates.push({
        floorId: floor._id,
        oldUrl: url,
        newUrl: localUrl,
      });
      console.log(`   ✅ Will update to: ${localUrl}\n`);
      continue;
    }

    // Download the file
    try {
      await downloadFile(url, localPath);
      console.log(`   ✅ Downloaded: ${filename}`);
      
      updates.push({
        floorId: floor._id,
        oldUrl: url,
        newUrl: localUrl,
      });
      
      console.log(`   ✅ Will update to: ${localUrl}\n`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
      console.log(`   ⏭️  Skipping database update for this floor\n`);
    }
  }

  // Update database with new local paths
  if (updates.length > 0) {
    console.log(`\n📝 Updating ${updates.length} floor plans in database...\n`);
    
    for (const update of updates) {
      try {
        await client.mutation(api.siteMap.updateFloorPlanUrl, {
          floorId: update.floorId as any,
          floorPlanUrl: update.newUrl,
        });
        console.log(`   ✅ Updated: ${update.oldUrl.substring(0, 50)}... → ${update.newUrl}`);
      } catch (error) {
        console.error(`   ❌ Failed to update DB: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  console.log('\n✨ Sync Complete!\n');
  console.log('Summary:');
  console.log(`   Total areas: ${floors.length}`);
  console.log(`   Downloaded: ${updates.length}`);
  console.log(`   Updated in DB: ${updates.length}`);
  console.log(`   Local floor plans: ${fs.readdirSync(FLOOR_PLANS_DIR).filter(f => f.match(/\.(png|jpg|jpeg|svg)$/i)).length}`);
  console.log('\n✅ All floor plans are now local and work offline!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
