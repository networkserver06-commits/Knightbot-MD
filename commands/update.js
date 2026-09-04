const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');
const DEFAULT_UPDATE_ZIP_URL = 'https://github.com/networkserver06-commits/LEE-TECHBOT-MD/archive/refs/heads/main.zip';

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

async function updateViaGit() {
    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    await run('git fetch --all --prune');
    const newRev = (await run('git rev-parse origin/main')).trim();
    const alreadyUpToDate = oldRev === newRev;
    const commits = alreadyUpToDate ? '' : await run(`git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`).catch(() => '');
    const files = alreadyUpToDate ? '' : await run(`git diff --name-status ${oldRev} ${newRev}`).catch(() => '');
    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    return { oldRev, newRev, alreadyUpToDate, commits, files };
}

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            // Avoid infinite redirect loops
            if (visited.has(url) || visited.size > 5) {
                return reject(new Error('Too many redirects'));
            }
            visited.add(url);

            const useHttps = url.startsWith('https://');
            const client = useHttps ? require('https') : require('http');
            const req = client.get(url, {
                headers: {
                    'User-Agent': 'LEE TECHBot-Updater/1.0',
                    'Accept': '*/*'
                }
            }, res => {
                // Handle redirects
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;
                    if (!location) return reject(new Error(`HTTP ${res.statusCode} without Location`));
                    const nextUrl = new URL(location, url).toString();
                    res.resume();
                    return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }

                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
                file.on('error', err => {
                    try { file.close(() => {}); } catch {}
                    fs.unlink(dest, () => reject(err));
                });
            });
            req.on('error', err => {
                fs.unlink(dest, () => reject(err));
            });
        } catch (e) {
            reject(e);
        }
    });
}

async function extractZip(zipPath, outDir) {
    // Try to use platform tools; no extra npm modules required
    if (process.platform === 'win32') {
        const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`;
        await run(cmd);
        return;
    }
    // Linux/mac: try unzip, else 7z, else busybox unzip
    try {
        await run('command -v unzip');
        await run(`unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}
    try {
        await run('command -v 7z');
        await run(`7z x -y '${zipPath}' -o'${outDir}'`);
        return;
    } catch {}
    try {
        await run('busybox unzip -h');
        await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}
    throw new Error("No system unzip tool found (unzip/7z/busybox). Git mode is recommended on this panel.");
}

function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        if (stat.isDirectory()) {
            copyRecursive(s, d, ignore, path.join(relative, entry), outList);
        } else {
            fs.copyFileSync(s, d);
            if (outList) outList.push(path.join(relative, entry).replace(/\\/g, '/'));
        }
    }
}

async function updateViaZip(sock, chatId, message, zipOverride) {
    const zipUrl = (zipOverride || settings.updateZipUrl || process.env.UPDATE_ZIP_URL || DEFAULT_UPDATE_ZIP_URL).trim();
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, 'update.zip');
    await downloadFile(zipUrl, zipPath);
    const extractTo = path.join(tmpDir, 'update_extract');
    if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
    await extractZip(zipPath, extractTo);

    // Find the top-level extracted folder (GitHub zips create REPO-branch folder)
    const [root] = fs.readdirSync(extractTo).map(n => path.join(extractTo, n));
    const srcRoot = fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;

    // Copy over while preserving runtime dirs/files
    const ignore = ['node_modules', '.git', 'session', 'tmp', 'tmp/', 'temp', 'data', 'baileys_store.json'];
    const copied = [];
    // Preserve ownerNumber from existing settings.js if present
    let preservedOwner = null;
    let preservedBotOwner = null;
    try {
        const currentSettings = require('../settings');
        preservedOwner = currentSettings && currentSettings.ownerNumber ? String(currentSettings.ownerNumber) : null;
        preservedBotOwner = currentSettings && currentSettings.botOwner ? String(currentSettings.botOwner) : null;
    } catch {}
    copyRecursive(srcRoot, process.cwd(), ignore, '', copied);
    if (preservedOwner) {
        try {
            const settingsPath = path.join(process.cwd(), 'settings.js');
            if (fs.existsSync(settingsPath)) {
                let text = fs.readFileSync(settingsPath, 'utf8');
                text = text.replace(/ownerNumber:\s*'[^']*'/, `ownerNumber: '${preservedOwner}'`);
                if (preservedBotOwner) {
                    text = text.replace(/botOwner:\s*'[^']*'/, `botOwner: '${preservedBotOwner}'`);
                }
                fs.writeFileSync(settingsPath, text);
            }
        } catch {}
    }
    // Cleanup extracted directory
    try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(zipPath, { force: true }); } catch {}
    return { copiedFiles: copied };
}

async function restartProcess(sock, chatId, message) {
    global.__updateRestarting = true;
    try {
        // Stop Baileys reconnect listeners from competing with the new process.
        if (sock?.ws && typeof sock.ws.close === 'function') sock.ws.close();
    } catch (error) {
        console.warn('[update] Socket close warning:', error.message || error);
    }

    const restartMode = String(process.env.RESTART_MODE || 'auto').toLowerCase();
    if (restartMode === 'none') {
        console.log('[update] Restart disabled by RESTART_MODE=none');
        return;
    }

    if (process.env.RESTART_COMMAND) {
        try {
            await run(process.env.RESTART_COMMAND);
            return;
        } catch (error) {
            console.warn('[update] RESTART_COMMAND failed:', error.message || error);
        }
    }

    const isPanel = Boolean(
        process.env.P_SERVER_UUID ||
        process.env.PTERODACTYL_SERVER_UUID ||
        process.env.KATABUMP_SERVER_ID ||
        process.env.KATABUMP
    );
    const hasProcessSupervisor = Boolean(process.env.pm_id || process.env.PM2_HOME);

    if (restartMode !== 'panel' && (hasProcessSupervisor || restartMode === 'pm2' || process.env.PM2_APP_NAME)) {
        try {
            const appName = process.env.PM2_APP_NAME || 'leetechbot';
            await run(`pm2 restart "${appName.replace(/[^a-zA-Z0-9_.-]/g, '')}"`);
            return;
        } catch (error) {
            console.warn('[update] PM2 restart unavailable:', error.message || error);
            if (hasProcessSupervisor || restartMode === 'pm2') {
                setTimeout(() => process.exit(0), 1200);
                return;
            }
        }
    }

    // Pterodactyl/Katabump supervisors restart the container after a clean
    // exit. Do not create a second child process inside the panel container.
    if (restartMode === 'panel' || isPanel) {
        setTimeout(() => process.exit(0), 1200);
        return;
    }

    // For a plain VPS/host started directly with Node, replace the current
    // process with a detached child so the bot comes back without a human.
    try {
        const entry = path.resolve(process.argv[1] || 'index.js');
        const child = spawn(process.execPath, ['-e', `setTimeout(() => require(${JSON.stringify(entry)}), 4500)`], {
            cwd: process.cwd(),
            env: { ...process.env, BOT_RESTARTED_AFTER_UPDATE: '1' },
            detached: true,
            stdio: 'inherit'
        });
        child.unref();
        setTimeout(() => process.exit(0), 1200);
    } catch (error) {
        console.error('[update] Self-restart failed; exiting for host supervisor:', error.message || error);
        setTimeout(() => process.exit(0), 1200);
    }
}

async function updateCommand(sock, chatId, message, zipOverride) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: 'Only bot owner or sudo can use .update' }, { quoted: message });
        return;
    }
    try {
        await sock.sendMessage(chatId, { text: '🔄 *Automatic update started*\nChecking GitHub main and preparing the bot…' }, { quoted: message });
        let updatedFromGit = false;
        let source = 'GitHub main ZIP';
        let revision = 'main branch';
        if (await hasGitRepo()) {
            try {
                const { newRev, alreadyUpToDate } = await updateViaGit();
                console.log(`[update] ${alreadyUpToDate ? 'already current' : 'updated'} at ${newRev}`);
                updatedFromGit = true;
                source = alreadyUpToDate ? 'GitHub main (already current)' : 'GitHub main (Git)';
                revision = newRev.slice(0, 12);
            } catch (gitError) {
                console.warn('[update] Git update unavailable; using GitHub ZIP fallback:', gitError.message || gitError);
            }
        }
        if (!updatedFromGit) {
            await sock.sendMessage(chatId, { text: '📦 Downloading the latest GitHub main build…' }, { quoted: message }).catch(() => {});
            await updateViaZip(sock, chatId, message, zipOverride);
        }
        // Ignore lifecycle scripts during WhatsApp-triggered updates. This
        // keeps Termux/Katabump alive when optional native sharp binaries
        // are unavailable; the core bot does not require sharp.
        await sock.sendMessage(chatId, { text: '📚 Installing dependencies and checking optional modules…' }, { quoted: message }).catch(() => {});
        await run('npm install --no-audit --no-fund --ignore-scripts');
        await run('npm rebuild sharp --foreground-scripts').catch(() => {});
        const packagePath = path.join(process.cwd(), 'package.json');
        let version = settings.version || 'unknown';
        try { version = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version || version; } catch {}
        await sock.sendMessage(chatId, {
            text: `✅ *Update completed successfully*\n\nSource: *${source}*\nRevision: *${revision}*\nVersion: *${version}*\n\n♻️ Restarting now. Send .ping after reconnection to verify the bot.`
        }, { quoted: message });
        // Give WhatsApp time to accept the success message before the process exits.
        await new Promise((resolve) => setTimeout(resolve, 1200));
        await restartProcess(sock, chatId, message);
    } catch (err) {
        console.error('Update failed:', err);
        await sock.sendMessage(chatId, { text: `❌ Update failed:\n${String(err.message || err)}` }, { quoted: message });
    }
}

module.exports = updateCommand;
