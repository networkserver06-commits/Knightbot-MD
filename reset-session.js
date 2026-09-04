'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const authDir = process.env.AUTH_DIR || './session';
const resolved = path.resolve(authDir);
const allowedRoot = path.resolve(process.cwd());

if (resolved === allowedRoot || resolved === path.parse(resolved).root) {
    throw new Error(`Refusing to delete unsafe AUTH_DIR: ${resolved}`);
}

fs.rmSync(resolved, { recursive: true, force: true });
console.log(`Removed auth directory: ${resolved}`);
console.log('Start the bot again and link the device with a new pairing code.');
