'use strict';

const instagramCommand = require('./instagram');
const facebookCommand = require('./facebook');
const tiktokCommand = require('./tiktok');
const videoCommand = require('./video');

function extractUrl(text = '') {
    return text.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[),.!?]+$/, '') || '';
}

function routeFor(url) {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'instagram.com' || host === 'instagr.am') return instagramCommand;
    if (host === 'facebook.com' || host === 'fb.watch' || host.endsWith('.facebook.com')) return facebookCommand;
    if (host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'vt.tiktok.com') return tiktokCommand;
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com') return videoCommand;
    return null;
}

async function downloadCommand(sock, chatId, message) {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const url = extractUrl(text);
    if (!url) {
        return sock.sendMessage(chatId, { text: '╭─〔 📥 UNIVERSAL DOWNLOAD 〕\n│ Send a public YouTube, TikTok, Instagram, or Facebook link.\n│ Example: `.download https://youtu.be/...`\n╰──────────────' }, { quoted: message });
    }
    try {
        const handler = routeFor(url);
        if (!handler) {
            return sock.sendMessage(chatId, { text: '❌ Supported platforms: YouTube, TikTok, Instagram, and Facebook. The link may also be private or region restricted.' }, { quoted: message });
        }
        const routed = { ...message, message: { conversation: `${handler === videoCommand ? '.ytmp4' : '.download'} ${url}` } };
        return handler(sock, chatId, routed);
    } catch (error) {
        console.error('[download] route error:', error.message);
        return sock.sendMessage(chatId, { text: '❌ That link could not be processed. Check that it is public and try again.' }, { quoted: message });
    }
}

module.exports = downloadCommand;
module.exports.routeFor = routeFor;
