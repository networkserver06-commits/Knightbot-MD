'use strict';

const fetch = require('node-fetch');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function configured() {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_URL);
}

async function generateChatCompletion(messages) {
  if (!configured()) return null;
  const url = process.env.AI_API_URL.replace(/\/$/, '') + '/chat/completions';
  const attempts = Math.max(1, Math.min(Number(process.env.AI_MAX_RETRIES || 2), 3));
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS || 15000));
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.AI_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages,
          temperature: Number(process.env.AI_TEMPERATURE || 0.7),
          max_tokens: Number(process.env.AI_MAX_TOKENS || 180)
        }),
        signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}`);
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('AI provider returned no text');
      return text;
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await sleep(500 * (2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('AI provider failed');
}

module.exports = { configured, generateChatCompletion };
