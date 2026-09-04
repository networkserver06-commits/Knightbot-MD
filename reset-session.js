'use strict';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Match the bot's panel-friendly environment loading. Panel-injected values
// always win, while blank values do not block a nested env file.
const envCandidates = [
  process.env.ENV_FILE,
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'env'),
  path.join(process.cwd(), 'config.env'),
  path.join(__dirname, '.env'),
  '/home/container/.env',
  '/home/container/env',
  '/home/container/config.env',
  '/home/container/LEE-TECHBOT-MD-main/.env',
  '/home/container/LEE-TECHBOT-MD-main/env',
  '/home/container/LEE-TECHBOT-MD-main/config.env'
].filter(Boolean);

for (const envPath of [...new Set(envCandidates)]) {
  if (!fs.existsSync(envPath) || !fs.statSync(envPath).isFile()) continue;
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined || process.env[key] === '') process.env[key] = value;
  }
}

const authDir = process.env.AUTH_DIR || './session';
const resolved = path.resolve(authDir);
const allowedRoot = path.resolve(process.cwd());

if (resolved === allowedRoot || resolved === path.parse(resolved).root) {
  throw new Error(`Refusing to delete unsafe AUTH_DIR: ${resolved}`);
}

if (fs.existsSync(resolved)) {
  fs.rmSync(resolved, { recursive: true, force: true });
  console.log(`Removed auth directory: ${resolved}`);
} else {
  console.log(`Auth directory does not exist: ${resolved}`);
}
console.log('Session reset complete. Start the bot and link the device with a new pairing code.');
