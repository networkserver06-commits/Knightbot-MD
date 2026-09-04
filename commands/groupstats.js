'use strict';

async function groupStatsCommand(sock, chatId, message, isGroup) {
    if (!isGroup) return sock.sendMessage(chatId, { text: '❌ .groupstats can only be used in a group.' }, { quoted: message });
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const admins = participants.filter((p) => p.admin === 'admin' || p.admin === 'superadmin');
        const owners = participants.filter((p) => p.admin === 'superadmin');
        const description = metadata.desc ? '✅ Set' : '❌ Not set';
        const settings = [
            `Messages: *${metadata.announce ? 'Admins only' : 'Everyone'}*`,
            `Edit info: *${metadata.restrict ? 'Admins only' : 'Everyone'}*`,
            `Description: *${description}*`,
            `Community: *${metadata.isCommunity ? 'Yes' : 'No'}*`
        ];
        const text = [
            `📊 *GROUP STATISTICS*`,
            `*${metadata.subject || 'Unnamed group'}*`,
            '',
            `Members: *${participants.length}*`,
            `Admins: *${admins.length}*`,
            `Main admins: *${owners.length}*`,
            '',
            ...settings
        ].join('\n');
        return sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (error) {
        console.error('[groupstats]', error.message || error);
        return sock.sendMessage(chatId, { text: '❌ Could not load group statistics.' }, { quoted: message });
    }
}

module.exports = groupStatsCommand;
