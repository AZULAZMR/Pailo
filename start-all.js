const localtunnel = require('./backend/node_modules/localtunnel');
const { spawn } = require('child_process');
const fs = require('fs');

const backendDir = __dirname + '\\backend';
const frontendDir = __dirname + '\\frontend';
const outFile = 'C:\\Users\\manal\\AppData\\Local\\Temp\\opencode\\tunnel-url.txt';

async function main() {
  // Start backend
  const backend = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: backendDir, stdio: 'pipe', shell: true
  });
  backend.stdout.on('data', d => process.stdout.write(`[backend] ${d}`));
  backend.stderr.on('data', d => process.stderr.write(`[backend] ${d}`));

  await new Promise(r => setTimeout(r, 15000));

  // Verify backend
  const http = require('http');
  await new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3000/api/health', res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { console.log('Backend OK'); resolve(); });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });

  // Start tunnel
  const tunnel = await localtunnel({ port: 3000 });
  const url = tunnel.url;
  fs.writeFileSync(outFile, url);
  console.log('TUNNEL_URL=' + url);
  tunnel.on('error', e => console.error('Tunnel error:', e.message));

  // Start Expo
  const expo = spawn('npx', ['expo', 'start', '--lan'], {
    cwd: frontendDir, stdio: 'pipe', shell: true
  });
  expo.stdout.on('data', d => process.stdout.write(`[expo] ${d}`));
  expo.stderr.on('data', d => process.stderr.write(`[expo] ${d}`));

  console.log('All running!');
  setInterval(() => {}, 60000);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
