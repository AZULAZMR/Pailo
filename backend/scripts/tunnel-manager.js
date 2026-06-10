const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

// Try multiple subdomain names in case one is taken
const SUBDOMAINS = ['pailo-health', 'pailo-coach', 'pailo-backend'];
const URL_FILE = path.join(__dirname, '..', '..', 'tunnel-url-prod.txt');
const PORT = 3000;

let tunnel;

async function trySubdomains() {
  for (const sub of SUBDOMAINS) {
    try {
      tunnel = await localtunnel({ port: PORT, subdomain: sub });
      const url = tunnel.url;
      fs.writeFileSync(URL_FILE, url);
      console.log('Tunnel URL:', url);
      return tunnel;
    } catch (e) {
      console.log('Subdomain', sub, 'unavailable, trying next...');
    }
  }
  // If all subdomains are taken, use random
  tunnel = await localtunnel({ port: PORT });
  const url = tunnel.url;
  fs.writeFileSync(URL_FILE, url);
  console.log('Tunnel URL (random):', url);
  return tunnel;
}

async function startTunnel() {
  try {
    tunnel = await trySubdomains();
    const url = tunnel.url;

    tunnel.on('close', () => {
      console.log('Tunnel closed, restarting in 2s...');
      setTimeout(startTunnel, 2000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });

    // Keepalive ping every 60s
    setInterval(() => {
      const https = require('https');
      const req = https.get(url + '/api/health', { 
        headers: { 'bypass-tunnel-reminder': 'true' },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log('OK:', (data || '').slice(0, 40)));
      });
      req.on('error', (e) => console.log('Keepalive failed:', e.message));
      req.end();
    }, 60000);

    console.log('Tunnel manager running. URL:', url);
  } catch (err) {
    console.error('Failed to start tunnel:', err.message);
    setTimeout(startTunnel, 5000);
  }
}

process.on('SIGINT', () => { if (tunnel) tunnel.close(); process.exit(); });
process.on('SIGTERM', () => { if (tunnel) tunnel.close(); process.exit(); });

startTunnel();
