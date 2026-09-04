'use strict';

const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

async function readMedia(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

const savestatusCommand = async (sock, chatId, message, senderId) => {
    const context = message.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = context?.quotedMessage;
    const statusReferences = [context?.participant, context?.remoteJid, message.key?.remoteJid].filter(Boolean);
    const isStatusReply = statusReferences.some((value) => String(value).includes('status@broadcast'));

    if (!quotedMsg || !isStatusReply) {
        return sock.sendMessage(chatId, {
            text: '❌ Reply to a WhatsApp status with .savestatus or .statusdl to download it.'
        }, { quoted: message });
    }

    try {
        const type = getContentType(quotedMsg);
        if (type === 'imageMessage' || type === 'videoMessage' || type === 'audioMessage' || type === 'documentMessage') {
            const mediaType = type.replace('Message', '');
            const buffer = await readMedia(quotedMsg[type], mediaType);
            const payload = { [mediaType]: buffer };
            if (quotedMsg[type].caption) payload.caption = quotedMsg[type].caption;
            if (quotedMsg[type].mimetype) payload.mimetype = quotedMsg[type].mimetype;
            if (quotedMsg[type].fileName) payload.fileName = quotedMsg[type].fileName;
            await sock.sendMessage(senderId, payload);
        } else if (type === 'conversation' || type === 'extendedTextMessage') {
            const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
            await sock.sendMessage(senderId, { text: `📥 Downloaded status text:\n\n${text}` });
        } else {
            return sock.sendMessage(chatId, { text: '❌ This status type cannot be downloaded.' }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: '✅ Status downloaded and sent to your private chat.' }, { quoted: message });
    } catch (error) {
        console.error('Error downloading status:', error.message || error);
        await sock.sendMessage(chatId, { text: '❌ Could not download this status. It may have expired or been deleted.' }, { quoted: message });
    }
};

module.exports = savestatusCommand;
