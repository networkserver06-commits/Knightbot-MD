'use strict';

const isAdmin = require('../lib/isAdmin');

async function adminStatusCommand(sock, chatId, message, senderId, isGroup, isOwnerOrSudoCheck) {
    if (!isGroup) {
        return sock.sendMessage(chatId, { text: '❌ .adminstatus can only be used in a group.' }, { quoted: message });
    }
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        const text = [
            '🛡️ *GROUP PERMISSION STATUS*',
            '',
            `Your admin status: *${isSenderAdmin ? '✅ Admin' : '❌ Member'}*`,
            `Bot admin status: *${isBotAdmin ? '✅ Admin' : '❌ Member'}*`,
            `Owner/sudo status: *${isOwnerOrSudoCheck ? '✅ Authorized' : '❌ Standard user'}*`,
            '',
            isBotAdmin
                ? 'The bot can perform group moderation actions when the sender is authorized.'
                : 'Promote the bot to group admin before using moderation commands.'
        ].join('\n');
        return sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (error) {
        console.error('[adminstatus]', error.message || error);
        return sock.sendMessage(chatId, { text: '❌ Could not read group permissions right now.' }, { quoted: message });
    }
}

module.exports = adminStatusCommand;
