const localtunnel = require('localtunnel');
const fs = require('fs');
const outFile = 'C:\\Users\\manal\\AppData\\Local\\Temp\\opencode\\tunnel-url.txt';

async function main() {
  const tunnel = await localtunnel({ port: 3000 });
  const url = tunnel.url;
  fs.writeFileSync(outFile, url);
  console.log('TUNNEL_URL=' + url);
  tunnel.on('error', e => console.error('Tunnel error:', e.message));
  tunnel.on('close', () => console.log('Tunnel closed'));
  setInterval(() => {}, 60000);
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
