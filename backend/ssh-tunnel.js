const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const logFile = path.join(process.env.TEMP || __dirname, 'opencode', 'ssh-tunnel.log');
const urlFile = path.join(process.env.TEMP || __dirname, 'opencode', 'tunnel-url.txt');
const errFile = path.join(process.env.TEMP || __dirname, 'opencode', 'ssh-tunnel.err');
const apiTsFile = path.join(__dirname, '..', 'frontend', 'src', 'services', 'api.ts');

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  fs.appendFileSync(logFile, line + '\n');
  console.log(line);
};

const updateApiTs = (url) => {
  try {
    let content = fs.readFileSync(apiTsFile, 'utf8');
    const newLine = `const API_BASE = '${url}/api';`;
    content = content.replace(/const API_BASE = 'https:\/\/[^']+';/, newLine);
    fs.writeFileSync(apiTsFile, content, 'utf8');
    log('Updated api.ts with URL: ' + url);
  } catch (err) {
    log('Failed to update api.ts: ' + err.message);
  }
};

const args = [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'UserKnownHostsFile=NUL',
  '-o', 'ServerAliveInterval=30',
  '-o', 'ExitOnForwardFailure=yes',
  '-R', '80:localhost:3000',
  'nokey@localhost.run'
];

log('Starting SSH tunnel...');
const proc = spawn('ssh', args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  windowsHide: true,
});

let urlFound = false;

proc.stdout.on('data', (data) => {
  const text = data.toString();
  log('stdout: ' + text.trim());
  const match = text.match(/https:\/\/([a-z0-9]+\.lhr\.life)/);
  if (match) {
    urlFound = true;
    const url = 'https://' + match[1];
    fs.writeFileSync(urlFile, url);
    updateApiTs(url);
    log('TUNNEL URL: ' + url);
  }
});

proc.stderr.on('data', (data) => {
  const text = data.toString();
  log('stderr: ' + text.trim());
  const match = text.match(/https:\/\/([a-z0-9]+\.lhr\.life)/);
  if (match) {
    urlFound = true;
    const url = 'https://' + match[1];
    fs.writeFileSync(urlFile, url);
    updateApiTs(url);
    log('TUNNEL URL: ' + url);
  }
});

proc.on('exit', (code, signal) => {
  log(`SSH exited code=${code} signal=${signal}`);
  if (!urlFound) {
    log('No URL was captured. Tunnel may have failed.');
  }
  process.exit(code || 0);
});

proc.on('error', (err) => {
  log('Failed to start SSH: ' + err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, killing SSH...');
  proc.kill();
});

process.on('SIGINT', () => {
  log('Received SIGINT, killing SSH...');
  proc.kill();
});

log('SSH tunnel started with PID: ' + proc.pid);
