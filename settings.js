'use strict';
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Katabump may start the process from a working directory different from the
// repository directory. Try the common panel locations, but never override
// variables already injected by the panel/container environment.
const envCandidates = [
  process.env.ENV_FILE,
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'env'),
  path.join(process.cwd(), 'config.env'),
  path.join(__dirname, '.env'),
  '/home/container/.env',
  '/home/container/env',
  '/home/container/config.env'
].filter(Boolean);
for (const envPath of [...new Set(envCandidates)]) {
  if (fs.existsSync(envPath) && fs.statSync(envPath).isFile()) {
    dotenv.config({ path: envPath, override: false, quiet: true });
  }
}
const cleanDigits = (value) => String(value || '').replace(/[^0-9]/g, '');
const ownerNumber = cleanDigits(process.env.OWNER_NUMBER || '');
module.exports = {
  packname: process.env.STICKER_PACKNAME || 'LEE TECH BOT',
  author: process.env.STICKER_AUTHOR || 'LEE TECH',
  botName: process.env.BOT_NAME || 'LEE TECH BOT',
  botOwner: process.env.BOT_OWNER || 'LEE TECH',
  ownerNumber,
  giphyApiKey: process.env.GIPHY_API_KEY || '',
  commandMode: process.env.BOT_MODE === 'private' ? 'private' : 'public',
  prefix: process.env.PREFIX || '.',
  maxStoreMessages: Number(process.env.MAX_STORE_MESSAGES || 20),
  storeWriteInterval: Number(process.env.STORE_WRITE_INTERVAL || 10000),
  description: process.env.BOT_DESCRIPTION || 'A reliable, feature-rich WhatsApp assistant for groups and private chats.',
  version: process.env.BOT_VERSION || '2.0.0-premium',
  channelLink: process.env.CHANNEL_LINK || '',
  updateZipUrl: process.env.UPDATE_ZIP_URL || ''
};
