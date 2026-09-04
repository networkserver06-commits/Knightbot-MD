# LEE TECH BOT — Premium Upgrade

This release hardens the existing Baileys bot without removing its existing command catalog. It is intended to be deployed as a fresh application build, with credentials supplied through environment variables.

## What changed

- **Secrets removed from source:** owner number, Giphy key, and provider keys are now read from `.env` or the host’s secret manager.
- **Owner authorization fixed:** an unset `OWNER_NUMBER` can no longer authorize every sender because an empty string matched every JID.
- **Startup made safe:** saved sessions reconnect silently; QR login is the default for new sessions, with linking-code mode as an explicit fallback through `AUTH_METHOD=pairing`, `PAIRING_CODE=true`, or `--pairing-code`.
- **Message resilience added:** duplicate WhatsApp deliveries are ignored, command bursts are rate-limited, and lightweight health metrics are maintained in memory.
- **State writes made safer:** new runtime helpers support atomic JSON replacement and safe fallback reads, preventing partially-written state files.
- **Deployment scripts corrected:** the Docker image command is valid, the project has a reproducible `package-lock.json`, and `npm run check` performs syntax and test validation.
- **Runtime cleanup fixed:** temporary-file cleanup no longer calls `.catch()` on a non-Promise callback return.
- **Premium AI chatbot:** `.chatbot on` can use any OpenAI-compatible provider through `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL`, with timeout and bounded retry controls.
- **Responsible anti-ban protection:** duplicate suppression, command throttling, bounded AI retries, and exponential reconnect backoff reduce accidental spam and connection churn. No bot can guarantee immunity from WhatsApp enforcement; use the official terms-compliant account and avoid bulk messaging.
- **Privacy improved:** example owner and premium data files no longer contain personal phone numbers.

## Secure setup

1. Copy `.env.example` to `.env`.
2. Set `OWNER_NUMBER` to the bot owner’s international number, digits only.
3. Leave `AUTH_METHOD` empty and `PAIRING_CODE=false` for QR-first login. Set `AUTH_METHOD=pairing` and `PHONE_NUMBER` only when using the linking-code fallback.
4. Add provider keys only for services you actually use.
5. Keep the `session/` directory private and never commit it.
6. Install and validate with:

```bash
npm ci
npm run check
npm start
```

The bot defaults to public mode and the `.` prefix. Change `BOT_MODE` and `PREFIX` in `.env` or use the bot’s owner settings where supported.

## Katabump panel QR deployment

You **do not** need to upload a session file or configure `SESSION_ID`. Add these panel environment variables:

```env
PHONE_NUMBER=
PAIRING_CODE=false
USE_MOBILE=false
AUTH_DIR=./session
```

Start the bot with `npm start`. If a saved session exists, it reconnects without asking anything. For a new session, it creates the auth directory automatically and prints a QR code directly in the Katabump logs. Scan it in WhatsApp under **Linked devices → Link a device**. Keep `AUTH_DIR` on persistent panel storage so the bot reconnects without relinking. If Katabump uses ephemeral storage, you must authenticate again after every storage reset.

For the linking-code fallback, set `AUTH_METHOD=pairing`, provide `PHONE_NUMBER` in international digits such as `254723...`, and the generated code will be printed after startup. In an interactive terminal with no saved session, the bot asks whether to use QR or linking code and defaults to QR.

## AI chatbot

Configure an OpenAI-compatible endpoint, for example `AI_API_URL=https://api.openai.com/v1`, plus a private `AI_API_KEY`. Then an administrator can enable group replies with `.chatbot on`. The bot only responds when mentioned or when a user replies to the bot, which reduces unsolicited traffic. If no AI key is configured, the existing compatibility provider remains available.

## Operations

The command burst limit defaults to eight commands per sender per ten seconds. Tune `COMMAND_RATE_LIMIT` and `COMMAND_RATE_WINDOW_MS` for the deployment. `global.botHealth.snapshot()` is available to an internal diagnostics integration if a health endpoint is added later.

## Dependency note

The current feature set contains several legacy media and scraper packages. `npm audit` reports transitive vulnerabilities, including issues through `libsignal`, `sharp`, `request`, `ytdl-core`/scrapers, and older parser packages. They should be migrated in a dedicated compatibility pass rather than applying `npm audit fix --force`, which proposes breaking upgrades. Do not expose the bot to untrusted arbitrary code execution while legacy `.eval` functionality remains enabled; keep owner credentials private and consider removing that command for multi-operator deployments.
