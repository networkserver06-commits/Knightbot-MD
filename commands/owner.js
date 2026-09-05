'use strict';

const settings = require('../settings');

function contact(number, name) {
    const digits = String(number || '').replace(/[^0-9]/g, '');
    if (!digits) return null;
    return {
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;waid=${digits}:+${digits}\nEND:VCARD\n`,
        displayName: name
    };
}

async function ownerCommand(sock, chatId, message) {
    const contacts = [
        contact(settings.ownerNumber, `${settings.botOwner || 'LEE TECH'} — Owner`),
        contact(settings.superOwnerNumber, 'LEE TECH — Super Owner')
    ].filter(Boolean);

    if (!contacts.length) {
        return sock.sendMessage(chatId, {
            text: '❌ No owner contact is configured. Set OWNER_NUMBER or SUPER_OWNER_NUMBER in the deployment environment.'
        }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        contacts: { displayName: 'LEE TECH BOT — Owner Support', contacts }
    }, { quoted: message });
}

module.exports = ownerCommand;
