# LEE TECH BOT — Premium Upgrade

This release hardens the existing Baileys bot without removing its existing command catalog. It is intended to be deployed as a fresh application build, with credentials supplied through environment variables.

## What changed

- **Secrets removed from source:** owner number, Giphy key, and provider keys are now read from `.env` or the host’s secret manager.
- **Owner authorization fixed:** an unset `OWNER_NUMBER` can no longer authorize every sender because an empty string matched every JID.
- **Startup made safe:** pairing mode is opt-in through `PAIRING_CODE=true` or `--pairing-code`; there is no hardcoded phone number.
- **Message resilience added:** duplicate WhatsApp deliveries are ignored, command bursts are rate-limited, and lightweight health metrics are maintained in memory.
- **State writes made safer:** new runtime helpers support atomic JSON replacement and safe fallback reads, preventing partially-written state files.
- **Deployment scripts corrected:** the Docker image command is valid, the project has a reproducible `package-lock.json`, and `npm run check` performs syntax and test validation.
- **Runtime cleanup fixed:** temporary-file cleanup no longer calls `.catch()` on a non-Promise callback return.
- **Privacy improved:** example owner and premium data files no longer contain personal phone numbers.

## Secure setup

1. Copy `.env.example` to `.env`.
2. Set `OWNER_NUMBER` to the bot owner’s international number, digits only.
3. Set `PHONE_NUMBER` only when using pairing mode. Keep `PAIRING_CODE=false` unless you explicitly need pairing.
4. Add provider keys only for services you actually use.
5. Keep the `session/` directory private and never commit it.
6. Install and validate with:

```bash
npm ci
npm run check
npm start
```

The bot defaults to public mode and the `.` prefix. Change `BOT_MODE` and `PREFIX` in `.env` or use the bot’s owner settings where supported.

## Operations

The command burst limit defaults to eight commands per sender per ten seconds. Tune `COMMAND_RATE_LIMIT` and `COMMAND_RATE_WINDOW_MS` for the deployment. `global.botHealth.snapshot()` is available to an internal diagnostics integration if a health endpoint is added later.

## Dependency note

The current feature set contains several legacy media and scraper packages. `npm audit` reports transitive vulnerabilities, including issues through `libsignal`, `sharp`, `request`, `ytdl-core`/scrapers, and older parser packages. They should be migrated in a dedicated compatibility pass rather than applying `npm audit fix --force`, which proposes breaking upgrades. Do not expose the bot to untrusted arbitrary code execution while legacy `.eval` functionality remains enabled; keep owner credentials private and consider removing that command for multi-operator deployments.
