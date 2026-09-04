'use strict';

function normalizeWhatsAppNumber(value) {
    let raw = String(value ?? '').trim();
    if (!raw) return '';
    raw = raw.replace(/[\u00A0\u2000-\u200B]/g, '');
    let digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (!/^[1-9][0-9]{9,14}$/.test(digits)) return '';
    return digits;
}

module.exports = { normalizeWhatsAppNumber };
