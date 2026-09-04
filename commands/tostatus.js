'use strict';

const { getQuotedMessage, getContent, personalAudience, publishStatus } = require('../lib/status');

const toStatusCommand = async (sock, chatId, message, isOwnerOrSudoCheck) => {
    if (!isOwnerOrSudoCheck) {
        return sock.sendMessage(chatId, { text: '❌ Only the bot owner or super-owner can use this command.' }, { quoted: message });
    }

    const quoted = getQuotedMessage(message);
    const content = getContent(quoted);
    if (!content) {
        return sock.sendMessage(chatId, {
            text: '❌ Reply to a text, image, or video, then send .tostatus.'
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { text: '⏳ Uploading to your WhatsApp Status…' }, { quoted: message });
        const recipients = await personalAudience(sock);
        await publishStatus(sock, content, recipients);
        return sock.sendMessage(chatId, {
            text: `✅ ${content.type === 'text' ? 'Text' : `${content.type.charAt(0).toUpperCase()}${content.type.slice(1)}`} posted to your WhatsApp Status.`
        }, { quoted: message });
    } catch (error) {
        console.error('[tostatus]', error.message || error);
        return sock.sendMessage(chatId, {
            text: '❌ Status upload failed. Check that the media is still available and try again.'
        }, { quoted: message });
    }
};

module.exports = toStatusCommand;
