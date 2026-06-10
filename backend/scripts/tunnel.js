const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const URL_FILE = path.join(__dirname, '..', 'tunnel-url-prod.txt');
const PORT = 3000;

let tunnel;

async function connect() {
  tunnel = await localtunnel({ port: PORT });

  const url = tunnel.url;
  fs.writeFileSync(URL_FILE, url);
  console.log('TUNNEL_URL:' + url);

  tunnel.on('close', () => {
    console.log('Tunnel closed, reconnecting...');
    setTimeout(connect, 2000);
  });
  tunnel.on('error', (e) => console.log('Tunnel error:', e.message));

  setInterval(() => {
    const h = require('https');
    const r = h.get(url + '/api/health', { headers: { 'bypass-tunnel-reminder': 'true' }, timeout: 8000 }, () => {});
    r.on('error', () => {});
    r.end();
  }, 30000);
}

connect();
