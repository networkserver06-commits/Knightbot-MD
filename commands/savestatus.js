'use strict';

const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

function unwrap(message) {
    let current = message || {};
    for (let i = 0; i < 5; i += 1) {
        if (current.ephemeralMessage?.message) current = current.ephemeralMessage.message;
        else if (current.viewOnceMessage?.message) current = current.viewOnceMessage.message;
        else if (current.viewOnceMessageV2?.message) current = current.viewOnceMessageV2.message;
        else break;
    }
    return current;
}

function getContext(message) {
    const current = unwrap(message?.message || message);
    return current.extendedTextMessage?.contextInfo
        || current.imageMessage?.contextInfo
        || current.videoMessage?.contextInfo
        || current.documentMessage?.contextInfo
        || current.audioMessage?.contextInfo
        || null;
}

async function readMedia(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

function getStatusReferences(context, message) {
    return [
        context?.remoteJid,
        context?.participant,
        context?.quotedMessage?.key?.remoteJid,
        message?.key?.remoteJid
    ].filter(Boolean).map(String);
}

const savestatusCommand = async (sock, chatId, message, senderId) => {
    const context = getContext(message);
    const quotedMsg = unwrap(context?.quotedMessage);
    const isStatusReply = getStatusReferences(context, message)
        .some((value) => value === 'status@broadcast' || value.includes('status@broadcast'));

    if (!quotedMsg || !isStatusReply) {
        return sock.sendMessage(chatId, {
            text: '❌ Reply directly to an image, video, audio, or text WhatsApp status with .savestatus or .statusdl.'
        }, { quoted: message });
    }

    try {
        const type = getContentType(quotedMsg);
        const target = senderId || chatId;
        if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(type)) {
            const media = quotedMsg[type];
            const mediaType = type.replace('Message', '');
            const buffer = await readMedia(media, mediaType);
            const payload = { [mediaType]: buffer };
            if (media.caption) payload.caption = media.caption;
            if (media.mimetype) payload.mimetype = media.mimetype;
            if (media.fileName) payload.fileName = media.fileName;
            await sock.sendMessage(target, payload);
        } else if (type === 'conversation' || type === 'extendedTextMessage') {
            const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
            if (!text.trim()) throw new Error('Empty status text');
            await sock.sendMessage(target, { text: `📥 *Saved status text*\n\n${text}` });
        } else {
            return sock.sendMessage(chatId, { text: '❌ This WhatsApp status type cannot be downloaded.' }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: '✅ Status saved successfully and sent to your private chat.'
        }, { quoted: message });
    } catch (error) {
        console.error('[savestatus] download failed:', error.message || error);
        await sock.sendMessage(chatId, {
            text: '❌ Could not save this status. It may have expired, been deleted, or its media is unavailable.'
        }, { quoted: message });
    }
};

module.exports = savestatusCommand;
module.exports.unwrap = unwrap;
module.exports.getContext = getContext;
module.exports.getStatusReferences = getStatusReferences;
