'use strict';

async function groupModeCommand(sock, chatId, message, isGroup, isSenderAdmin, isBotAdmin, isOwnerOrSudoCheck, userMessage) {
    if (!isGroup) return sock.sendMessage(chatId, { text: '❌ This command can only be used in a group.' }, { quoted: message });
    if (!isSenderAdmin && !isOwnerOrSudoCheck) return sock.sendMessage(chatId, { text: '❌ Only group admins can change group mode.' }, { quoted: message });
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ Promote the bot to admin first.' }, { quoted: message });

    const command = userMessage.trim().split(/\s+/)[0];
    const open = ['.open', '.groupopen', '.unannounce'].includes(command);
    const setting = open ? 'not_announcement' : 'announcement';
    try {
        await sock.groupSettingUpdate(chatId, setting);
        return sock.sendMessage(chatId, {
            text: open ? '🔓 *Group opened.* Everyone can send messages.' : '🔒 *Group closed.* Only admins can send messages.'
        }, { quoted: message });
    } catch (error) {
        console.error('[groupmode]', error.message || error);
        return sock.sendMessage(chatId, { text: '❌ Could not change group messaging mode.' }, { quoted: message });
    }
}

module.exports = groupModeCommand;
