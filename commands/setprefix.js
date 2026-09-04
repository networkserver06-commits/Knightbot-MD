const fs = require('fs');
const path = require('path');
const { parsePrefixArgument } = require('../lib/prefix');

const prefixPath = path.join(__dirname, '../data/prefix.json');

const setPrefixCommand = async (sock, chatId, message, isOwnerOrSudoCheck, userMessage) => {
    if (!isOwnerOrSudoCheck) {
        return await sock.sendMessage(chatId, { text: '❌ Only the owner can change the prefix.' }, { quoted: message });
    }

    const parsed = parsePrefixArgument(userMessage);
    if (!parsed.valid) {
        return await sock.sendMessage(chatId, { text: '📝 Usage: .setprefix [one letter/symbol/emoji]\nExamples: .setprefix !   .setprefix 🔥   .setprefix none\n\n❌ ' + parsed.reason }, { quoted: message });
    }

    const storedPrefix = parsed.value;

    // Save the new prefix permanently
    fs.writeFileSync(prefixPath, JSON.stringify({ prefix: storedPrefix }, null, 2));

    await sock.sendMessage(chatId, { text: `✅ Prefix successfully and permanently changed to: *${storedPrefix || 'none (no prefix)'}*` }, { quoted: message });
};

module.exports = setPrefixCommand;
