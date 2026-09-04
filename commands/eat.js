'use strict';

async function eatTimeCommand(sock, chatId, message) {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-KE', {
        timeZone: 'Africa/Nairobi',
        dateStyle: 'full',
        timeStyle: 'long'
    }).format(now);
    return sock.sendMessage(chatId, {
        text: `🕒 *EAST AFRICA TIME*\n\n${formatted}\n\nTimezone: Africa/Nairobi (EAT, UTC+03:00)`
    }, { quoted: message });
}

module.exports = eatTimeCommand;
