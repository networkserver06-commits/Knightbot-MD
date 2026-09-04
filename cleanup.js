'use strict';

const fs = require('fs');
const path = require('path');

const removableDirs = [path.join(process.cwd(), 'temp'), path.join(process.cwd(), 'tmp')];
for (const directory of removableDirs) {
  fs.mkdirSync(directory, { recursive: true });
  for (const entry of fs.readdirSync(directory)) {
    const target = path.join(directory, entry);
    fs.rmSync(target, { recursive: true, force: true });
  }
  console.log(`Cleaned runtime directory: ${directory}`);
}

console.log('Cleanup complete; authentication and persistent data were preserved.');
