'use strict';

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

let cachedMenuImage;

function getMenuImage() {
    if (cachedMenuImage !== undefined) return cachedMenuImage;
    const candidates = [path.join(__dirname, '../menu.jpg'), path.join(__dirname, '../assets/bot_image.jpg')];
    for (const file of candidates) {
        try {
            if (fs.existsSync(file)) return (cachedMenuImage = fs.readFileSync(file));
        } catch (_) {}
    }
    return (cachedMenuImage = null);
}

function section(title, lines) {
    return `╭─〔 ${title} 〕\n${lines.map(line => `│ ${line}`).join('\n')}\n╰──────────────`;
}

function buildMenu() {
    const p = global.prefix === 'none' ? '.' : (global.prefix || '.');
    const name = settings.botName || 'LEE TECH BOT';
    const version = settings.version || '3.0.7';
    return [
        `╭━━━〔 🤖 ${name} 〕━━━╮`,
        `┃  ✦ PREMIUM COMMAND CENTER`,
        `┃  ⚡ v${version}  •  ${global.ytch || '@ServerNetwork-yt'}`,
        `╰━━━━━━━━━━━━━━━━━━━━╯`,
        '',
        section('⚡ QUICK START', [
            `${p}ping   ${p}speed   ${p}uptime`,
            `${p}health   ${p}botinfo   ${p}id   ${p}adminstatus`,
            `${p}owner   ${p}groupinfo   ${p}staff   ${p}jid`,
            `${p}groupstats   ${p}eat   ${p}time`,
            `${p}help <command>   ${p}commands  (full menu)`,
            `${p}help admin   ${p}help owner   ${p}help download`
        ]),
        '',
        section('✨ AI & SMART', [
            `${p}gpt <question>   ${p}gemini <question>`,
            `${p}chatbot on/off   ${p}imagine <prompt>`,
            `${p}translate <text> <lang>   ${p}tts <text>`,
            `${p}weather <city>   ${p}news   ${p}lyrics <song>`
        ]),
        '',
        section('🎨 MEDIA STUDIO', [
            `${p}sticker   ${p}take   ${p}emojimix`,
            `${p}removebg   ${p}remini   ${p}blur`,
            `${p}meme   ${p}attp   ${p}textmaker`,
            `${p}vv   ${p}delete   ${p}clear`
        ]),
        '',
        section('📥 DOWNLOADS', [
            `${p}download <YouTube/TikTok/Instagram/Facebook link>`,
            `${p}play <song>   ${p}song <song>   ${p}spotify <query>`,
            `${p}tiktok <url>   ${p}instagram <url>   ${p}facebook <url>`,
            `${p}video <query>   ${p}ss <url>`,
            `${p}url / ${p}tourl  (reply to an image or video)`
        ]),
        '',
        section('🛡️ GROUP ADMIN', [
            `${p}tagall   ${p}hidetag   ${p}tagnotadmin`,
            `${p}warn   ${p}warnings   ${p}mute   ${p}kick`,
            `${p}antilink   ${p}antispam   ${p}antibadword`,
            `${p}welcome on/off   ${p}goodbye on/off   ${p}chatbot on/off`,
            `${p}groupinfo   ${p}topmembers   ${p}onlinemembers`,
            `Admin actions require the bot to be group admin`
        ]),
        '',
        section('🎮 FUN & GAMES', [
            `${p}tictactoe   ${p}trivia   ${p}hangman`,
            `${p}truth   ${p}dare   ${p}8ball`,
            `${p}joke   ${p}quote   ${p}fact   ${p}shayari`,
            `${p}compliment   ${p}insult   ${p}flirt   ${p}ship`
        ]),
        '',
        section('🔐 OWNER TOOLS', [
            `${p}settings   ${p}mode   ${p}setprefix`,
            `${p}hidechannel on/off   ${p}ownerstatus`,
            `${p}maintenance on/off`,
            `${p}backup   ${p}update   ${p}cleartmp`,
            `${p}autotyping   ${p}autoread   ${p}anticall`,
            `${p}tostatus  (your status)   ${p}togstatus  (group audience)`,
            `${p}savestatus / ${p}statusdl  (download status)`,
            `${p}devmenu  (developer tools)`
        ]),
        '',
        global.ownerControls?.hideChannel ? '╭─〔 🔒 PRIVATE MODE 〕\n│ Channel promotion is hidden.\n╰──────────────' : `╭─〔 📢 OFFICIAL CHANNEL 〕\n│ ${global.channelLink || 'https://whatsapp.com'}\n╰──────────────`,
        `\n⚡ Fast • Secure • Reliable\n✦ Powered by LEE TECH`
    ].join('\n');
}

function buildDeveloperMenu() {
    const p = global.prefix === 'none' ? '.' : (global.prefix || '.');
    const version = settings.version || '3.0.7';
    return [
        `╭━━━〔 🧰 DEVELOPER TOOLKIT 〕━━━╮`,
        `┃ ⚙️ LEE TECH BOT v${version}`,
        `╰━━━━━━━━━━━━━━━━━━━━━━╯`,
        '',
        section('📡 OBSERVABILITY', [
            `${p}health   ${p}system   ${p}stats`,
            `${p}ping   ${p}speed   ${p}uptime   ${p}runtime`,
            `${p}botinfo   ${p}jid   ${p}ownerstatus`
        ]),
        '',
        section('🛠️ OPERATIONS', [
            `${p}settings   ${p}backup   ${p}cleartmp`,
            `${p}clearsession   ${p}update`,
            `${p}maintenance on/off   ${p}mode public/private`
        ]),
        '',
        section('🔧 CONFIGURATION', [
            `${p}setprefix <symbol>`,
            `${p}hidechannel on/off`,
            `${p}setmenuimage  (reply to image)`
        ]),
        '',
        section('🔐 DEVELOPER ACCESS', [
            `${p}eval <code>  (owner/super-owner only)`,
            `${p}git   ${p}github   ${p}repo`,
            'Sensitive operations are protected by owner authorization.'
        ]),
        '',
        'Use .help <command> for user-facing command guides.'
    ].join('\n');
}

function messageText(message) {
    return message?.message?.conversation || message?.message?.extendedTextMessage?.text || '';
}

function buildDetails(topic) {
    const p = global.prefix === 'none' ? '.' : (global.prefix || '.');
    const topics = {
        admin: `🛡️ *ADMIN GUIDE*\n\n${p}adminstatus\n${p}groupstats\n${p}kick @user\n${p}promote @user\n${p}demote @user\n${p}mute @user\n${p}warn @user reason\n${p}antilink on/off\n${p}antispam on/off\n${p}welcome on/off\n${p}goodbye on/off\n\nThe sender must be a group admin, and the bot must also be a group admin for moderation actions.`,
        owner: `🔐 *OWNER GUIDE*\n\n${p}mode public/private\n${p}setprefix .\n${p}hidechannel on/off\n${p}maintenance on/off\n${p}ownerstatus\n${p}clearsession\n${p}cleartmp\n${p}backup\n${p}update\n${p}tostatus (reply to text/image/video)\n${p}togstatus (reply in a group; group audience)\n${p}savestatus or ${p}statusdl (reply to a status)\n\nOwner tools are restricted to the configured owner or sudo account.`,
        download: `📥 *DOWNLOAD GUIDE*\n\n${p}download <social link>\n${p}tiktok <url>\n${p}instagram <url>\n${p}facebook <url>\n${p}play <song>\n${p}song <song>\n${p}spotify <query>\n${p}video <query>\n${p}ss <url>\n${p}url or ${p}tourl (reply to image/video)\n\nUse direct public links and avoid repeated requests to reduce rate limits.`,
        ai: `✨ *AI GUIDE*\n\n${p}gpt <question>\n${p}gemini <question>\n${p}chatbot on/off\n${p}imagine <prompt>\n${p}translate <text> <language>\n${p}tts <text>`,
        dev: buildDeveloperMenu(),
        developer: buildDeveloperMenu(),
        tools: buildDeveloperMenu()
    };
    return topics[topic] || `Use ${p}menu for all commands. Available guides: admin, owner, download, ai.`;
}

async function helpCommand(sock, chatId, message) {
    const words = messageText(message).trim().split(/\s+/);
    const requestedTopic = words[1]?.toLowerCase() || (['.devmenu', '.developermenu', '.tools'].includes(words[0]?.toLowerCase()) ? 'dev' : undefined);
    const helpMessage = requestedTopic ? buildDetails(requestedTopic) : buildMenu();
    const image = getMenuImage();
    const contextInfo = global.ownerControls?.hideChannel ? {} : {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363404186001130@newsletter',
            newsletterName: 'LEE TECHBOT MD',
            serverMessageId: -1
        }
    };

    try {
        if (image) {
            return await sock.sendMessage(chatId, { image, caption: helpMessage, contextInfo }, { quoted: message });
        }
        return await sock.sendMessage(chatId, { text: helpMessage, contextInfo }, { quoted: message });
    } catch (error) {
        console.error('Menu send error:', error.message);
        return sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;
module.exports.buildMenu = buildMenu;
