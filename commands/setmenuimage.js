'use strict';

const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { readJson, atomicWriteJson } = require('../lib/runtime');

const menuImagePath = path.join(process.cwd(), 'menu.jpg');
const menuSettingsPath = path.join(process.cwd(), 'data', 'menuSettings.json');

function readMenuSettings() {
    return readJson(menuSettingsPath, { enabled: false });
}

function saveMenuSettings(settings) {
    atomicWriteJson(menuSettingsPath, { enabled: Boolean(settings.enabled) });
}

function commandText(message) {
    return message?.message?.conversation || message?.message?.extendedTextMessage?.text || '';
}

function quotedImage(message) {
    const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    return quoted?.imageMessage || message?.message?.imageMessage || null;
}

async function setMenuImageCommand(sock, chatId, message, isOwnerOrSudoCheck) {
    if (!isOwnerOrSudoCheck) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner can manage the menu image.' }, { quoted: message });
    }

    const argument = commandText(message).trim().split(/\s+/)[1]?.toLowerCase();
    const current = readMenuSettings();
    if (argument === 'on' || argument === 'image' || argument === 'off' || argument === 'text' || argument === 'status' || argument === 'none') {
        if (argument === 'status') {
            return sock.sendMessage(chatId, {
                text: `╭─〔 *MENU DISPLAY* 〕\n│ Mode: *${current.enabled && fs.existsSync(menuImagePath) ? 'IMAGE' : 'TEXT ONLY'}*\n│ Image file: *${fs.existsSync(menuImagePath) ? 'AVAILABLE' : 'NOT SET'}*\n╰────────────────────\n\nUse *.menumode image* or *.menumode text*.`
            }, { quoted: message });
        }
        const enabled = argument === 'on' || argument === 'image';
        if (enabled && !fs.existsSync(menuImagePath)) {
            return sock.sendMessage(chatId, { text: '❌ No menu image is set. Reply to an image with *.setmenuimage* first.' }, { quoted: message });
        }
        saveMenuSettings({ enabled });
        return sock.sendMessage(chatId, {
            text: enabled
                ? '✅ Menu image mode enabled. Use *.menu* to display the image menu.'
                : '✅ Text-only menu mode enabled. The menu image is now disabled.'
        }, { quoted: message });
    }

    const image = quotedImage(message);
    if (!image) {
        return sock.sendMessage(chatId, {
            text: '❌ Reply to an image with *.setmenuimage* to replace the menu image.\n\nUse *.menumode text* to disable images or *.menumode status* to check the current mode.'
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: '⏳ Updating menu image…' }, { quoted: message });
    try {
        const stream = await downloadContentFromMessage(image, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 256) throw new Error('empty image');
        fs.writeFileSync(menuImagePath, buffer);
        saveMenuSettings({ enabled: true });
        return sock.sendMessage(chatId, {
            text: '✅ Menu image replaced and enabled.\nUse *.menumode text* any time to switch back to a text-only menu.'
        }, { quoted: message });
    } catch (error) {
        console.error('[menu-image] update failed:', error.message || error);
        return sock.sendMessage(chatId, { text: '❌ Could not save that image. Please try a smaller JPG or PNG.' }, { quoted: message });
    }
}

module.exports = setMenuImageCommand;
module.exports.menuImagePath = menuImagePath;
module.exports.menuSettingsPath = menuSettingsPath;
module.exports.readMenuSettings = readMenuSettings;
