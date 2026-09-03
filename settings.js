'use strict';
require('dotenv').config();
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
