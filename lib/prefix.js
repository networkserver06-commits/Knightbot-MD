'use strict';

function graphemes(value) {
    if (typeof Intl.Segmenter === 'function') {
        return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)].map((part) => part.segment);
    }
    return Array.from(value);
}

function parsePrefixArgument(commandText) {
    const text = String(commandText || '').trim();
    const match = text.match(/^\S+(?:\s+(.*))?$/u);
    const remainder = match?.[1]?.trim() || '';
    if (!remainder) return { valid: false, reason: 'Provide one character or use `none` for no prefix.' };
    if (/^none$/iu.test(remainder)) return { valid: true, value: '' };
    if (/\s/u.test(remainder)) return { valid: false, reason: 'Prefix must be exactly one letter, symbol, or emoji.' };
    const parts = graphemes(remainder);
    if (parts.length !== 1 || /[\p{White_Space}\p{Control}]/u.test(parts[0])) {
        return { valid: false, reason: 'Prefix must be exactly one Unicode character.' };
    }
    return { valid: true, value: remainder };
}

module.exports = { parsePrefixArgument };
