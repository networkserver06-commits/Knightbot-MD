'use strict';

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function unwrap(message) {
    let current = message || {};
    for (let i = 0; i < 4; i += 1) {
        if (current.ephemeralMessage?.message) current = current.ephemeralMessage.message;
        else if (current.viewOnceMessage?.message) current = current.viewOnceMessage.message;
        else if (current.viewOnceMessageV2?.message) current = current.viewOnceMessageV2.message;
        else break;
    }
    return current;
}

function getQuotedMessage(message) {
    const current = unwrap(message?.message || message);
    const context = current.extendedTextMessage?.contextInfo
        || current.imageMessage?.contextInfo
        || current.videoMessage?.contextInfo
        || current.documentMessage?.contextInfo
        || current.audioMessage?.contextInfo;
    return unwrap(context?.quotedMessage);
}

function getContent(quoted) {
    const value = unwrap(quoted);
    if (value.conversation) return { type: 'text', value: value.conversation };
    if (value.extendedTextMessage?.text) return { type: 'text', value: value.extendedTextMessage.text };
    for (const type of ['imageMessage', 'videoMessage']) {
        if (value[type]) return { type: type.replace('Message', ''), value: value[type] };
    }
    return null;
}

async function downloadMedia(media, type) {
    const stream = await downloadContentFromMessage(media, type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

function normalizeJid(value) {
    const text = String(value || '').trim();
    if (!text || text.includes('@lid')) return '';
    const number = text.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    return number ? `${number}@s.whatsapp.net` : '';
}

async function groupAudience(sock, chatId) {
    const metadata = await sock.groupMetadata(chatId);
    const recipients = (metadata.participants || [])
        .map((participant) => normalizeJid(participant.id || participant.phoneNumber))
        .filter(Boolean);
    return { subject: metadata.subject || 'selected group', recipients: [...new Set(recipients)] };
}

async function personalAudience(sock) {
    const recipients = new Set();
    try {
        const groups = await sock.groupFetchAllParticipating();
        for (const group of Object.values(groups || {})) {
            for (const participant of group.participants || []) {
                const jid = normalizeJid(participant.id || participant.phoneNumber);
                if (jid) recipients.add(jid);
            }
        }
    } catch (error) {
        console.warn('[status] Could not build full personal audience:', error.message || error);
    }
    const botJid = normalizeJid(sock.user?.id);
    if (botJid) recipients.add(botJid);
    return [...recipients];
}

async function publishStatus(sock, content, recipients) {
    const payload = content.type === 'text'
        ? { text: content.value, backgroundColor: '#000000', font: 1 }
        : {
            [content.type]: await downloadMedia(content.value, content.type),
            caption: content.value.caption || ''
        };
    const options = { broadcast: true };
    if (recipients?.length) options.statusJidList = recipients;
    await sock.sendMessage('status@broadcast', payload, options);
}

module.exports = {
    getQuotedMessage,
    getContent,
    groupAudience,
    personalAudience,
    publishStatus
};
