'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { atomicWriteJson, readJson, normalizeJid, createMessageGuard } = require('../lib/runtime');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'leetechbot-'));
const file = path.join(directory, 'state.json');

atomicWriteJson(file, { enabled: true, count: 2 });
assert.deepEqual(readJson(file, {}), { enabled: true, count: 2 });
assert.equal(normalizeJid('254116553618:4@s.whatsapp.net'), '254116553618@s.whatsapp.net');

const guard = createMessageGuard({ dedupeTtlMs: 1000, windowMs: 1000, maxCommands: 2 });
assert.equal(guard.isDuplicate('message-1'), false);
assert.equal(guard.isDuplicate('message-1'), true);
assert.equal(guard.allowCommand('user@s.whatsapp.net'), true);
assert.equal(guard.allowCommand('user@s.whatsapp.net'), true);
assert.equal(guard.allowCommand('user@s.whatsapp.net'), false);

fs.rmSync(directory, { recursive: true, force: true });
console.log('runtime tests passed');
