'use strict';
require('dotenv').config();
global.APIs = {
    xteam: process.env.XTEAM_API_URL || 'https://api.xteam.xyz',
    dzx: process.env.DZX_API_URL || 'https://api.dhamzxploit.my.id',
    lol: process.env.LOLHUMAN_API_URL || 'https://api.lolhuman.xyz',
    violetics: process.env.VIOLETICS_API_URL || 'https://violetics.pw',
    neoxr: process.env.NEOXR_API_URL || 'https://api.neoxr.my.id',
    zenzapis: process.env.ZENZ_API_URL || 'https://zenzapis.xyz',
    akuari: process.env.AKUARI_API_URL || 'https://api.akuari.my.id',
    akuari2: process.env.AKUARI2_API_URL || 'https://apimu.my.id',
    nrtm: process.env.NRTM_API_URL || 'https://fg-nrtm.ddns.net',
    bg: process.env.BG_API_URL || 'http://bochil.ddns.net',
    fgmods: process.env.FGMODS_API_URL || 'https://api-fgmods.ddns.net'
};
global.APIKeys = {
    [global.APIs.xteam]: process.env.XTEAM_API_KEY || '',
    [global.APIs.lol]: process.env.LOLHUMAN_API_KEY || '',
    [global.APIs.neoxr]: process.env.NEOXR_API_KEY || '',
    [global.APIs.violetics]: process.env.VIOLETICS_API_KEY || '',
    [global.APIs.zenzapis]: process.env.ZENZ_API_KEY || '',
    [global.APIs.fgmods]: process.env.FGMODS_API_KEY || ''
};
module.exports = { WARN_COUNT: Number(process.env.WARN_COUNT || 3), APIs: global.APIs, APIKeys: global.APIKeys };
