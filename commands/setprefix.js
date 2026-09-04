const fs = require('fs');
const path = require('path');

const prefixPath = path.join(__dirname, '../data/prefix.json');

const setPrefixCommand = async (sock, chatId, message, isOwnerOrSudoCheck, userMessage) => {
    if (!isOwnerOrSudoCheck) {
        return await sock.sendMessage(chatId, { text: '❌ Only the owner can change the prefix.' }, { quoted: message });
    }

    const newPrefix = userMessage.trim().split(/\s+/)[1] || '';

    if (!newPrefix || /\s/u.test(newPrefix)) {
        return await sock.sendMessage(chatId, { text: '📝 Usage: .setprefix [one token]\nExamples: .setprefix !   .setprefix 🔥   .setprefix none' }, { quoted: message });
    }

    const storedPrefix = newPrefix.toLowerCase() === 'none' ? '' : newPrefix;

    // Save the new prefix permanently
    fs.writeFileSync(prefixPath, JSON.stringify({ prefix: storedPrefix }, null, 2));

    await sock.sendMessage(chatId, { text: `✅ Prefix successfully and permanently changed to: *${storedPrefix || 'none (no prefix)'}*` }, { quoted: message });
};

module.exports = setPrefixCommand;
