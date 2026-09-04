'use strict';

global.groupModeTimers = global.groupModeTimers || new Map();

async function groupModeCommand(sock, chatId, message, isGroup, isSenderAdmin, isBotAdmin, isOwnerOrSudoCheck, userMessage) {
    if (!isGroup) return sock.sendMessage(chatId, { text: '❌ This command can only be used in a group.' }, { quoted: message });
    if (!isSenderAdmin && !isOwnerOrSudoCheck) return sock.sendMessage(chatId, { text: '❌ Only group admins can change group mode.' }, { quoted: message });
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ Promote the bot to admin first.' }, { quoted: message });

    const command = userMessage.trim().split(/\s+/)[0];
    const parts = userMessage.trim().split(/\s+/);
    const minutesText = parts[1];
    const minutes = minutesText === undefined ? null : Number(minutesText);
    if (minutesText !== undefined && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) {
        return sock.sendMessage(chatId, { text: '❌ Duration must be a whole number from 1 to 1440 minutes.\nExample: .close 30' }, { quoted: message });
    }
    const open = ['.open', '.groupopen', '.unannounce'].includes(command);
    const setting = open ? 'not_announcement' : 'announcement';
    try {
        const previousTimer = global.groupModeTimers.get(chatId);
        if (previousTimer) clearTimeout(previousTimer);
        await sock.groupSettingUpdate(chatId, setting);
        let suffix = '';
        if (minutes) {
            const reverseSetting = open ? 'announcement' : 'not_announcement';
            const reverseText = open ? '🔒 Timed open ended; only admins can send messages now.' : '🔓 Timed close ended; everyone can send messages now.';
            const timer = setTimeout(async () => {
                global.groupModeTimers.delete(chatId);
                try {
                    await sock.groupSettingUpdate(chatId, reverseSetting);
                    await sock.sendMessage(chatId, { text: reverseText });
                } catch (error) {
                    console.error('[groupmode timer]', error.message || error);
                }
            }, minutes * 60 * 1000);
            global.groupModeTimers.set(chatId, timer);
            suffix = `\n⏱️ Automatic reversal in *${minutes} minute${minutes === 1 ? '' : 's'}*.`;
        } else {
            global.groupModeTimers.delete(chatId);
        }
        return sock.sendMessage(chatId, {
            text: `${open ? '🔓 *Group opened.* Everyone can send messages.' : '🔒 *Group closed.* Only admins can send messages.'}${suffix}`
        }, { quoted: message });
    } catch (error) {
        console.error('[groupmode]', error.message || error);
        return sock.sendMessage(chatId, { text: '❌ Could not change group messaging mode.' }, { quoted: message });
    }
}

module.exports = groupModeCommand;
