import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Proxy endpoint for camera snapshots
app.get('/camera-snapshot', async (req, res) => {
  try {
    const { ip, port, path, username, password } = req.query;
    
    if (!ip || !path) {
      return res.status(400).json({ error: 'Missing required parameters: ip, path' });
    }
    
    // Build camera URL
    const protocol = port === '443' ? 'https' : 'http';
    const portStr = port && port !== '80' && port !== '443' ? `:${port}` : '';
    const cameraUrl = `${protocol}://${ip}${portStr}${path}&rnd=${Date.now()}`;
    
    console.log('Proxying camera request:', cameraUrl);
    
    // Build headers with authentication
    const headers: Record<string, string> = {};
    if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }
    
    // Fetch from camera
    const response = await fetch(cameraUrl, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      console.error(`Camera returned ${response.status}: ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `Camera error: ${response.status} ${response.statusText}` 
      });
    }
    
    // Forward the image
    const buffer = await response.buffer();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(buffer);
    
  } catch (error) {
    console.error('Camera proxy error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch camera image' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎥 Camera Proxy Server running on http://localhost:${PORT}`);
  console.log(`   Use: http://localhost:${PORT}/camera-snapshot?ip=IP&port=PORT&path=PATH&username=USER&password=PASS`);
});
