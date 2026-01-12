// Download OpenStreetMap tiles for offline use
// Run with: npm run download-map-tiles

import fs from 'fs';
import path from 'path';
import https from 'https';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TILES_DIR = path.join(process.cwd(), 'public', 'map-tiles');
const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL not found");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// OSM Tile servers (rotate to avoid rate limiting)
const tileServers = [
  'https://a.tile.openstreetmap.org',
  'https://b.tile.openstreetmap.org',
  'https://c.tile.openstreetmap.org',
];
let serverIndex = 0;

// Download a single tile
const downloadTile = (z: number, x: number, y: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tileDir = path.join(TILES_DIR, z.toString(), x.toString());
    const tilePath = path.join(tileDir, `${y}.png`);

    // Skip if exists
    if (fs.existsSync(tilePath)) {
      resolve();
      return;
    }

    // Create directory
    if (!fs.existsSync(tileDir)) {
      fs.mkdirSync(tileDir, { recursive: true });
    }

    const server = tileServers[serverIndex];
    serverIndex = (serverIndex + 1) % tileServers.length;

    const url = `${server}/${z}/${x}/${y}.png`;
    const file = fs.createWriteStream(tilePath);

    https.get(url, {
      headers: {
        'User-Agent': 'BoschAlertSoftware/1.0 (Offline Map Cache)'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        fs.unlinkSync(tilePath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(tilePath)) fs.unlinkSync(tilePath);
      reject(err);
    });
  });
};

// Convert lat/lon to tile coordinates
function latLonToTile(lat: number, lon: number, zoom: number) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}

// Add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🗺️  Map Tiles Downloader\n');

  // Fetch sites from database
  console.log('📍 Fetching site locations from database...\n');
  const sites = await client.query(api.siteMap.getSites);

  if (!sites || sites.length === 0) {
    console.log('❌ No sites found in database');
    process.exit(1);
  }

  // Get bounding box from all sites with coordinates
  const sitesWithCoords = sites.filter(s => s.latitude && s.longitude);
  
  if (sitesWithCoords.length === 0) {
    console.log('❌ No sites have coordinates');
    process.exit(1);
  }

  const lats = sitesWithCoords.map(s => s.latitude!);
  const lons = sitesWithCoords.map(s => s.longitude!);
  
  const bounds = {
    minLat: Math.min(...lats) - 0.05, // Add padding
    maxLat: Math.max(...lats) + 0.05,
    minLon: Math.min(...lons) - 0.05,
    maxLon: Math.max(...lons) + 0.05,
  };

  console.log(`📊 Found ${sitesWithCoords.length} sites with coordinates`);
  console.log(`📍 Coverage area:`);
  console.log(`   Latitude:  ${bounds.minLat.toFixed(4)} to ${bounds.maxLat.toFixed(4)}`);
  console.log(`   Longitude: ${bounds.minLon.toFixed(4)} to ${bounds.maxLon.toFixed(4)}\n`);

  // Zoom levels split into 4 tiers
  const worldZoomLevels = [1, 2, 3, 4, 5];                   // Full world coverage
  const largeRegionZoomLevels = [6, 7, 8];                   // Large region around area
  const mediumRegionZoomLevels = [9, 10];                    // Medium region around area
  const specificAreaZoomLevels = [11, 12, 13, 14, 15];      // Specific area only
  
  console.log(`🌍 Zoom 1-5: Full world coverage`);
  console.log(`🗺️  Zoom 6-8: Large region (±3° padding)`);
  console.log(`📍 Zoom 9-10: Medium region (±1° padding)`);
  console.log(`🎯 Zoom 11-15: Specific area\n`);

  let totalTiles = 0;
  let downloadedTiles = 0;
  let skippedTiles = 0;
  let errorCount = 0;

  // Calculate total tiles needed
  // World zoom levels - download all tiles
  for (const zoom of worldZoomLevels) {
    const tilesAtZoom = Math.pow(2, zoom);
    totalTiles += tilesAtZoom * tilesAtZoom;
  }
  
  // Large region - download with 3° padding
  for (const zoom of largeRegionZoomLevels) {
    const largeBounds = {
      minLat: bounds.minLat - 3,
      maxLat: bounds.maxLat + 3,
      minLon: bounds.minLon - 3,
      maxLon: bounds.maxLon + 3,
    };
    const minTile = latLonToTile(largeBounds.maxLat, largeBounds.minLon, zoom);
    const maxTile = latLonToTile(largeBounds.minLat, largeBounds.maxLon, zoom);
    totalTiles += (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
  }
  
  // Medium region - download with 1° padding
  for (const zoom of mediumRegionZoomLevels) {
    const mediumBounds = {
      minLat: bounds.minLat - 1,
      maxLat: bounds.maxLat + 1,
      minLon: bounds.minLon - 1,
      maxLon: bounds.maxLon + 1,
    };
    const minTile = latLonToTile(mediumBounds.maxLat, mediumBounds.minLon, zoom);
    const maxTile = latLonToTile(mediumBounds.minLat, mediumBounds.maxLon, zoom);
    totalTiles += (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
  }
  
  // Specific area - download exact area
  for (const zoom of specificAreaZoomLevels) {
    const minTile = latLonToTile(bounds.maxLat, bounds.minLon, zoom);
    const maxTile = latLonToTile(bounds.minLat, bounds.maxLon, zoom);
    totalTiles += (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
  }

  console.log(`📦 Total tiles to download: ${totalTiles}\n`);
  console.log('⚠️  This may take 10-30 minutes. Please be patient...\n');

  const startTime = Date.now();

  // Download world zoom levels (full world coverage)
  for (const zoom of worldZoomLevels) {
    console.log(`🌍 Downloading zoom level ${zoom} (full world)...`);
    
    const tilesAtZoom = Math.pow(2, zoom);
    const minTile = { x: 0, y: 0 };
    const maxTile = { x: tilesAtZoom - 1, y: tilesAtZoom - 1 };
    
    const tilesThisLevel = tilesAtZoom * tilesAtZoom;
    let levelProgress = 0;

    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        const tilePath = path.join(TILES_DIR, zoom.toString(), x.toString(), `${y}.png`);
        
        if (fs.existsSync(tilePath)) {
          skippedTiles++;
        } else {
          try {
            await downloadTile(zoom, x, y);
            downloadedTiles++;
            
            // Rate limiting: 1 request per 100ms (10 req/sec - conservative)
            await delay(100);
          } catch (error) {
            errorCount++;
            if (errorCount < 10) {
              console.error(`   ⚠️  Failed: ${zoom}/${x}/${y} - ${error instanceof Error ? error.message : error}`);
            }
          }
        }

        levelProgress++;
        
        // Progress update every 50 tiles
        if (levelProgress % 50 === 0) {
          const percent = ((downloadedTiles + skippedTiles) / totalTiles * 100).toFixed(1);
          process.stdout.write(`   Progress: ${percent}% (${downloadedTiles + skippedTiles}/${totalTiles})\r`);
        }
      }
    }
    
    console.log(`   ✅ Zoom ${zoom} complete (${tilesThisLevel} tiles)\n`);
  }

  // Download large region zoom levels
  for (const zoom of largeRegionZoomLevels) {
    console.log(`🗺️  Downloading zoom level ${zoom} (large region, ±3° padding)...`);
    
    const largeBounds = {
      minLat: bounds.minLat - 3,
      maxLat: bounds.maxLat + 3,
      minLon: bounds.minLon - 3,
      maxLon: bounds.maxLon + 3,
    };
    const minTile = latLonToTile(largeBounds.maxLat, largeBounds.minLon, zoom);
    const maxTile = latLonToTile(largeBounds.minLat, largeBounds.maxLon, zoom);
    
    const tilesThisLevel = (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
    let levelProgress = 0;

    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        const tilePath = path.join(TILES_DIR, zoom.toString(), x.toString(), `${y}.png`);
        
        if (fs.existsSync(tilePath)) {
          skippedTiles++;
        } else {
          try {
            await downloadTile(zoom, x, y);
            downloadedTiles++;
            
            // Rate limiting: 1 request per 100ms (10 req/sec - conservative)
            await delay(100);
          } catch (error) {
            errorCount++;
            if (errorCount < 10) {
              console.error(`   ⚠️  Failed: ${zoom}/${x}/${y} - ${error instanceof Error ? error.message : error}`);
            }
          }
        }

        levelProgress++;
        
        // Progress update every 50 tiles
        if (levelProgress % 50 === 0) {
          const percent = ((downloadedTiles + skippedTiles) / totalTiles * 100).toFixed(1);
          process.stdout.write(`   Progress: ${percent}% (${downloadedTiles + skippedTiles}/${totalTiles})\r`);
        }
      }
    }
    
    console.log(`   ✅ Zoom ${zoom} complete (${tilesThisLevel} tiles)\n`);
  }

  // Download medium region zoom levels
  for (const zoom of mediumRegionZoomLevels) {
    console.log(`📍 Downloading zoom level ${zoom} (medium region, ±1° padding)...`);
    
    const mediumBounds = {
      minLat: bounds.minLat - 1,
      maxLat: bounds.maxLat + 1,
      minLon: bounds.minLon - 1,
      maxLon: bounds.maxLon + 1,
    };
    const minTile = latLonToTile(mediumBounds.maxLat, mediumBounds.minLon, zoom);
    const maxTile = latLonToTile(mediumBounds.minLat, mediumBounds.maxLon, zoom);
    
    const tilesThisLevel = (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
    let levelProgress = 0;

    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        const tilePath = path.join(TILES_DIR, zoom.toString(), x.toString(), `${y}.png`);
        
        if (fs.existsSync(tilePath)) {
          skippedTiles++;
        } else {
          try {
            await downloadTile(zoom, x, y);
            downloadedTiles++;
            
            // Rate limiting: 1 request per 100ms (10 req/sec - conservative)
            await delay(100);
          } catch (error) {
            errorCount++;
            if (errorCount < 10) {
              console.error(`   ⚠️  Failed: ${zoom}/${x}/${y} - ${error instanceof Error ? error.message : error}`);
            }
          }
        }

        levelProgress++;
        
        // Progress update every 50 tiles
        if (levelProgress % 50 === 0) {
          const percent = ((downloadedTiles + skippedTiles) / totalTiles * 100).toFixed(1);
          process.stdout.write(`   Progress: ${percent}% (${downloadedTiles + skippedTiles}/${totalTiles})\r`);
        }
      }
    }
    
    console.log(`   ✅ Zoom ${zoom} complete (${tilesThisLevel} tiles)\n`);
  }

  // Download specific area zoom levels
  for (const zoom of specificAreaZoomLevels) {
    console.log(`🎯 Downloading zoom level ${zoom} (specific area)...`);
    
    const minTile = latLonToTile(bounds.maxLat, bounds.minLon, zoom);
    const maxTile = latLonToTile(bounds.minLat, bounds.maxLon, zoom);
    
    const tilesThisLevel = (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
    let levelProgress = 0;

    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        const tilePath = path.join(TILES_DIR, zoom.toString(), x.toString(), `${y}.png`);
        
        if (fs.existsSync(tilePath)) {
          skippedTiles++;
        } else {
          try {
            await downloadTile(zoom, x, y);
            downloadedTiles++;
            
            // Rate limiting: 1 request per 100ms (10 req/sec - conservative)
            await delay(100);
          } catch (error) {
            errorCount++;
            if (errorCount < 10) {
              console.error(`   ⚠️  Failed: ${zoom}/${x}/${y} - ${error instanceof Error ? error.message : error}`);
            }
          }
        }

        levelProgress++;
        
        // Progress update every 50 tiles
        if (levelProgress % 50 === 0) {
          const percent = ((downloadedTiles + skippedTiles) / totalTiles * 100).toFixed(1);
          process.stdout.write(`   Progress: ${percent}% (${downloadedTiles + skippedTiles}/${totalTiles})\r`);
        }
      }
    }
    
    console.log(`   ✅ Zoom ${zoom} complete (${tilesThisLevel} tiles)\n`);
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n✨ Download Complete!\n');
  console.log('Summary:');
  console.log(`   Total tiles: ${totalTiles}`);
  console.log(`   Downloaded: ${downloadedTiles}`);
  console.log(`   Already had: ${skippedTiles}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Duration: ${duration} minutes`);
  console.log(`   Storage: ${TILES_DIR}`);
  
  console.log('\n✅ Map will now work offline!\n');
}

main().catch(console.error);
