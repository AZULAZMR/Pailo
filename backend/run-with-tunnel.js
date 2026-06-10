const localtunnel = require('localtunnel');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const outFile = 'C:\\Users\\manal\\AppData\\Local\\Temp\\opencode\\tunnel-url.txt';

async function main() {
  const backend = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true
  });

  backend.stdout.on('data', d => process.stdout.write(`[b] ${d}`));
  backend.stderr.on('data', d => process.stderr.write(`[b] ${d}`));

  await new Promise(r => setTimeout(r, 15000));

  const tunnel = await localtunnel({ port: 3000 });
  const url = tunnel.url;
  fs.writeFileSync(outFile, url);
  console.log('TUNNEL_URL=' + url);

  tunnel.on('error', e => console.error('Tunnel error:', e.message));
  tunnel.on('close', () => console.log('Tunnel closed'));

  setInterval(() => {}, 60000);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
