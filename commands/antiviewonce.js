'use strict';

const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '../data/antiviewonce.json');
function loadState() {
    try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { return {}; }
}
function saveState(state) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    const temp = `${statePath}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(state, null, 2));
    fs.renameSync(temp, statePath);
}
global.antiviewonceState = global.antiviewonceState || loadState();
global.antiviewonceWarnCooldown = global.antiviewonceWarnCooldown || {};

async function antiviewonceCommand(sock, chatId, message, isGroup, isSenderAdmin, isOwnerOrSudoCheck, userMessage) {
    if (!isGroup) return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    if (!isSenderAdmin && !isOwnerOrSudoCheck) return sock.sendMessage(chatId, { text: '❌ Only group admins can change this protection.' }, { quoted: message });
    const arg = userMessage.trim().split(/\s+/)[1]?.toLowerCase();
    if (arg !== 'on' && arg !== 'off') {
        return sock.sendMessage(chatId, { text: `🛡️ Usage: .antiviewonce on/off\nCurrent status: *${global.antiviewonceState[chatId] || 'off'}*` }, { quoted: message });
    }
    global.antiviewonceState[chatId] = arg;
    saveState(global.antiviewonceState);
    return sock.sendMessage(chatId, { text: `🛡️ Anti-ViewOnce is now *${arg.toUpperCase()}* for this group.` }, { quoted: message });
}

async function checkAntiViewOnce(sock, chatId, message, isGroup, isSenderAdmin, isBotAdmin, senderId) {
    if (!isGroup || global.antiviewonceState[chatId] !== 'on' || isSenderAdmin || message.key.fromMe) return false;
    const content = message.message?.ephemeralMessage?.message || message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message || message.message;
    const isViewOnce = Boolean(content?.imageMessage?.viewOnce || content?.videoMessage?.viewOnce || message.message?.viewOnceMessageV2 || message.message?.viewOnceMessage);
    if (!isViewOnce) return false;
    if (!isBotAdmin) return true;
    try { await sock.sendMessage(chatId, { delete: message.key }); } catch (error) { console.warn('[antiviewonce] delete failed:', error.message || error); }
    const key = `${chatId}:${senderId}`;
    const now = Date.now();
    if (now - (global.antiviewonceWarnCooldown[key] || 0) > 10000) {
        global.antiviewonceWarnCooldown[key] = now;
        await sock.sendMessage(chatId, { text: `🛡️ @${senderId.split('@')[0]}, view-once media is disabled in this group.`, mentions: [senderId] });
    }
    return true;
}

module.exports = { antiviewonceCommand, checkAntiViewOnce };
