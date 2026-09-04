'use strict';

const path = require('path');
const { readJson, atomicWriteJson } = require('../lib/runtime');
const isOwnerOrSudo = require('../lib/isOwner');

const file = path.join(process.cwd(), 'data', 'ownerControls.json');
const state = readJson(file, { hideChannel: false, maintenance: false });
global.ownerControls = state;

function save() { atomicWriteJson(file, global.ownerControls); }
function status(value) { return value ? 'ON' : 'OFF'; }

async function ownerControlsCommand(sock, chatId, message, input = '') {
    const senderId = message.key?.participant || message.key?.remoteJid;
    const isOwner = message.key?.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
    if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only command.' }, { quoted: message });

    const parts = String(input).trim().toLowerCase().split(/\s+/).filter(Boolean);
    const command = parts[0] || 'status';
    const value = parts[1];
    if (!['on', 'off', 'status'].includes(value || 'status')) {
        return sock.sendMessage(chatId, { text: 'Usage: `.hidechannel on/off/status`\n       `.maintenance on/off/status`\n       `.ownerstatus`' }, { quoted: message });
    }

    if (command === 'hidechannel') {
        if (value === 'on' || value === 'off') { global.ownerControls.hideChannel = value === 'on'; save(); }
        return sock.sendMessage(chatId, { text: `╭─〔 📢 CHANNEL VISIBILITY 〕\n│ Status: *${status(global.ownerControls.hideChannel)}*\n│ Channel context is ${global.ownerControls.hideChannel ? 'hidden' : 'visible'} in bot messages.\n╰──────────────` }, { quoted: message });
    }
    if (command === 'maintenance') {
        if (value === 'on' || value === 'off') { global.ownerControls.maintenance = value === 'on'; save(); }
        return sock.sendMessage(chatId, { text: `╭─〔 🛠️ MAINTENANCE MODE 〕\n│ Status: *${status(global.ownerControls.maintenance)}*\n│ ${global.ownerControls.maintenance ? 'Only owner messages are processed.' : 'Normal operation restored.'}\n╰──────────────` }, { quoted: message });
    }
    if (command === 'ownerstatus') {
        const health = global.botHealth?.snapshot?.() || {};
        return sock.sendMessage(chatId, { text: `╭━━〔 👑 OWNER STATUS 〕━━╮\n┃ Maintenance: *${status(global.ownerControls.maintenance)}*\n┃ Channel hidden: *${status(global.ownerControls.hideChannel)}*\n┃ Messages: *${health.messages || 0}*\n┃ Commands: *${health.commands || 0}*\n┃ Errors: *${health.errors || 0}*\n╰━━━━━━━━━━━━━━━━╯` }, { quoted: message });
    }
    return sock.sendMessage(chatId, { text: 'Usage: `.hidechannel on/off/status`, `.maintenance on/off/status`, or `.ownerstatus`' }, { quoted: message });
}

module.exports = { ownerControlsCommand };
