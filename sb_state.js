/**
 * sb_state.js  — Shared Status Bar State
 * Persists carrier, time, battery, signal, wifi, notifications
 * across all RBC pages via sessionStorage.
 *
 * Usage: include this script on every page BEFORE your page-specific scripts.
 * Then call SB.init() once the DOM is ready.
 */

(function(w){
  const KEY = 'rbc_sb_state';

  const DEFAULT = {
    carrier:  'Rogers',
    time:     '23:18',
    battPct:  89,
    battStyle:0,
    sigChoice:0,
    wifiChoice:0,
    notifs:   []   // array of notif ids that are active
  };

  function load() {
    try { return Object.assign({}, DEFAULT, JSON.parse(sessionStorage.getItem(KEY) || '{}')); }
    catch(e) { return Object.assign({}, DEFAULT); }
  }
  function save(state) {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
  }

  /* ── Battery SVG templates ── */
  const BATT_STYLES = [
    p=>`<svg width="25" height="13" viewBox="0 0 25 13" fill="none"><rect x=".75" y=".75" width="21.5" height="11.5" rx="3" stroke="white" stroke-width="1.5"/><rect x="22.25" y="4" width="2" height="5" rx="1" fill="white"/><rect x="2" y="2" width="${Math.round(p/100*17.5)}" height="9" rx="1.5" fill="${p<=20?'#ff3b30':p<=50?'#ff9500':'white'}"/></svg>`,
    p=>`<svg width="13" height="22" viewBox="0 0 13 22" fill="none"><rect x="4" y="0" width="5" height="2" rx="1" fill="white"/><rect x=".75" y="2" width="11.5" height="19.25" rx="2.5" stroke="white" stroke-width="1.5"/><rect x="2.5" y="${2+Math.round((1-p/100)*14.5)}" width="8" height="${Math.round(p/100*14.5)}" rx="1.5" fill="${p<=20?'#ff3b30':p<=50?'#ff9500':'white'}"/></svg>`,
    p=>{const f=Math.ceil(p/100*5);let b='';for(let i=4;i>=0;i--){const y=1.5+(4-i)*3.8;b+=`<rect x="1.5" y="${y}" width="9" height="3" rx="1" fill="${i<f?(p<=20?'#ff453a':p<=50?'#ff9f0a':'white'):'rgba(255,255,255,0.2)'}"/>`;}return`<svg width="12" height="22" viewBox="0 0 12 22" fill="none"><rect x=".75" y=".75" width="10.5" height="20.5" rx="3" stroke="white" stroke-width="1.5"/>${b}</svg>`;},
    p=>`<svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x=".5" y=".5" width="19" height="9" rx="2.5" stroke="rgba(255,255,255,0.6)" stroke-width="1"/><rect x="19.5" y="3" width="2" height="4" rx="1" fill="rgba(255,255,255,0.6)"/><rect x="1.5" y="1.5" width="${Math.round(p/100*16)}" height="7" rx="1.5" fill="${p<=20?'#ff3b30':p<=50?'#ff9500':'#30d158'}"/></svg>`,
    p=>`<svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x=".75" y=".75" width="22.5" height="11.5" rx="4" stroke="white" stroke-width="1.5"/><rect x="23.25" y="3.5" width="2.5" height="6" rx="1.5" fill="white"/><rect x="2.5" y="2.5" width="${Math.round(p/100*18.5)}" height="8" rx="2.5" fill="${p<=20?'#ff3b30':p<=50?'#ffcc00':'#4cd964'}"/></svg>`,
    ()=>`<svg width="1" height="12"></svg>`,
  ];

  /* ── Signal SVGs ── */
  const SIG_SVGS = [
    `<svg width="17" height="14" viewBox="0 0 17 14" fill="white"><rect x="0" y="10" width="3" height="4" rx="0.5"/><rect x="4.5" y="7" width="3" height="7" rx="0.5"/><rect x="9" y="3.5" width="3" height="10.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="14" rx="0.5"/></svg>`,
    `<svg width="17" height="14" viewBox="0 0 17 14" fill="white"><rect x="0" y="10" width="3" height="4" rx="0.5"/><rect x="4.5" y="7" width="3" height="7" rx="0.5"/><rect x="9" y="3.5" width="3" height="10.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="14" rx="0.5" opacity="0.3"/></svg>`,
    `<svg width="18" height="14" viewBox="0 0 18 14" fill="none"><rect x="0" y="11" width="2.5" height="3" rx="0.5" stroke="white" fill="white"/><rect x="4" y="8" width="2.5" height="6" rx="0.5" stroke="white" fill="white"/><rect x="8" y="5" width="2.5" height="9" rx="0.5" stroke="white" fill="white"/><rect x="12" y="2" width="2.5" height="12" rx="0.5" stroke="white" fill="rgba(255,255,255,0.2)"/><rect x="15.5" y="0" width="2.5" height="14" rx="0.5" stroke="white" fill="rgba(255,255,255,0.15)"/></svg>`,
    `<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><rect x="0" y="10" width="2.5" height="4" rx="0.5" fill="white"/><rect x="4" y="7" width="2.5" height="7" rx="0.5" fill="white"/><rect x="8" y="3.5" width="2.5" height="10.5" rx="0.5" fill="white"/><rect x="12" y="0" width="2.5" height="14" rx="0.5" fill="white"/><text x="16.5" y="13" font-size="9" font-weight="800" fill="white" font-family="Arial">5G</text></svg>`,
    `<svg width="26" height="14" viewBox="0 0 26 14" fill="none"><rect x="0" y="10" width="2.5" height="4" rx="0.5" fill="white"/><rect x="4" y="7" width="2.5" height="7" rx="0.5" fill="white"/><rect x="8" y="3.5" width="2.5" height="10.5" rx="0.5" fill="white"/><rect x="12" y="0" width="2.5" height="14" rx="0.5" fill="white"/><text x="17" y="13" font-size="9" font-weight="800" fill="white" font-family="Arial">LTE</text></svg>`,
    `<svg width="18" height="14" viewBox="0 0 18 14" fill="white"><circle cx="2" cy="12" r="2"/><circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="2.5" r="2"/></svg>`,
    `<svg width="17" height="14" viewBox="0 0 17 14" fill="none"><rect x="0" y="10" width="3" height="4" rx="0.5" fill="rgba(255,255,255,0.25)"/><rect x="4.5" y="7" width="3" height="7" rx="0.5" fill="rgba(255,255,255,0.25)"/><rect x="9" y="3.5" width="3" height="10.5" rx="0.5" fill="rgba(255,255,255,0.25)"/><rect x="13.5" y="0" width="3" height="14" rx="0.5" fill="rgba(255,255,255,0.25)"/></svg>`,
  ];

  /* ── WiFi SVGs ── */
  const WIFI_SVGS = [
    `<svg width="16" height="13" viewBox="0 0 20 16" fill="none"><path d="M1 5.2Q10-.8 19 5.2" stroke="white" stroke-width="2.1" stroke-linecap="round"/><path d="M4 8.8Q10 4.5 16 8.8" stroke="white" stroke-width="2.1" stroke-linecap="round"/><path d="M7 12Q10 9.5 13 12" stroke="white" stroke-width="2.1" stroke-linecap="round"/><circle cx="10" cy="14.5" r="1.5" fill="white"/></svg>`,
    `<svg width="16" height="13" viewBox="0 0 20 16" fill="none"><path d="M1 5.2Q10-.8 19 5.2" stroke="rgba(255,255,255,0.25)" stroke-width="2.1" stroke-linecap="round"/><path d="M4 8.8Q10 4.5 16 8.8" stroke="white" stroke-width="2.1" stroke-linecap="round"/><path d="M7 12Q10 9.5 13 12" stroke="white" stroke-width="2.1" stroke-linecap="round"/><circle cx="10" cy="14.5" r="1.5" fill="white"/></svg>`,
    `<svg width="16" height="13" viewBox="0 0 20 16" fill="none"><path d="M1 5.2Q10-.8 19 5.2" stroke="rgba(255,255,255,0.2)" stroke-width="2.1" stroke-linecap="round"/><path d="M4 8.8Q10 4.5 16 8.8" stroke="rgba(255,255,255,0.2)" stroke-width="2.1" stroke-linecap="round"/><path d="M7 12Q10 9.5 13 12" stroke="white" stroke-width="2.1" stroke-linecap="round"/><circle cx="10" cy="14.5" r="1.5" fill="white"/></svg>`,
    `<svg width="16" height="14" viewBox="0 0 20 17" fill="none"><path d="M1 6Q10-1 19 6" stroke="white" stroke-width="2.3" stroke-linecap="round"/><path d="M4.5 10Q10 5.5 15.5 10" stroke="white" stroke-width="2.3" stroke-linecap="round"/><path d="M8 13.5Q10 11.5 12 13.5" stroke="white" stroke-width="2.3" stroke-linecap="round"/><circle cx="10" cy="16" r="1.5" fill="white"/></svg>`,
    `<svg width="16" height="13" viewBox="0 0 20 16" fill="white"><path d="M10 14Q3 8 3 3A7 7 0 0 1 17 3Q17 8 10 14Z"/><circle cx="10" cy="14.5" r="1.5"/></svg>`,
    `<svg width="16" height="13" viewBox="0 0 20 16" fill="none"><path d="M1 5.2Q10-.8 19 5.2" stroke="rgba(255,255,255,0.2)" stroke-width="2.1" stroke-linecap="round"/><path d="M4 8.8Q10 4.5 16 8.8" stroke="rgba(255,255,255,0.2)" stroke-width="2.1" stroke-linecap="round"/><path d="M7 12Q10 9.5 13 12" stroke="rgba(255,255,255,0.2)" stroke-width="2.1" stroke-linecap="round"/><circle cx="10" cy="14.5" r="1.5" fill="rgba(255,255,255,0.2)"/></svg>`,
  ];

  /* All known notification icons (same as index.html) */
  const NOTIF_DEFS = {
    sms:`<svg viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.8" stroke-linecap="round"/><line x1="8" y1="9" x2="16" y2="9" stroke="white" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="13" x2="13" y2="13" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    voicemail:`<svg viewBox="0 0 24 24" fill="none"><circle cx="6" cy="13" r="4" stroke="white" stroke-width="1.8"/><circle cx="18" cy="13" r="4" stroke="white" stroke-width="1.8"/><line x1="6" y1="17" x2="18" y2="17" stroke="white" stroke-width="1.8"/></svg>`,
    missed:`<svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.39 19a19.5 19.5 0 0 1-5-5 19.79 19.79 0 0 1-2.93-8.4A2 2 0 0 1 5.44 3.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.61 11.22a16 16 0 0 0 5.17 5.17l1.09-1.09a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.5v-.58z" stroke="white" stroke-width="1.7"/><line x1="17" y1="3" x2="22" y2="8" stroke="white" stroke-width="1.8" stroke-linecap="round"/><line x1="22" y1="3" x2="17" y2="8" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    email:`<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="white" stroke-width="1.8"/><polyline points="2,6 12,13 22,6" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    alarm:`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="7" stroke="white" stroke-width="1.8"/><polyline points="12,9 12,13 15,15" stroke="white" stroke-width="1.8" stroke-linecap="round"/><line x1="5" y1="3" x2="2" y2="6" stroke="white" stroke-width="1.8" stroke-linecap="round"/><line x1="19" y1="3" x2="22" y2="6" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    notif:`<svg viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="white" stroke-width="1.8"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    telegram:`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.6"/><path d="M7.5 11.5l2.5 3 6-7-9.5 3.5z" fill="white"/><line x1="10" y1="14.5" x2="10" y2="17.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    whatsapp:`<svg viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="white" stroke-width="1.7"/></svg>`,
    facebook:`<svg viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="white" stroke-width="1.7"/></svg>`,
    instagram:`<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" stroke-width="1.7"/><circle cx="12" cy="12" r="4.5" stroke="white" stroke-width="1.7"/><circle cx="17.5" cy="6.5" r="1" fill="white"/></svg>`,
    twitter:`<svg viewBox="0 0 24 24" fill="white"><text x="3" y="18" font-size="11" font-weight="900" font-family="Arial" fill="white">𝕏</text></svg>`,
    reddit:`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.7"/><circle cx="8.5" cy="12.5" r="1.2" fill="white"/><circle cx="15.5" cy="12.5" r="1.2" fill="white"/><path d="M9 16s1 1.5 3 1.5 3-1.5 3-1.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    twitch:`<svg viewBox="0 0 24 24" fill="none"><path d="M4 2H21v13l-5 5H4V2z" stroke="white" stroke-width="1.7"/><line x1="9" y1="7" x2="9" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="7" x2="14" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`,
    youtube:`<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" stroke="white" stroke-width="1.7"/><polygon points="10,9 16,12 10,15" fill="white"/></svg>`,
    spotify:`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.7"/><path d="M8 15c2.5-1.5 5.5-1.5 8 0" stroke="white" stroke-width="1.6" stroke-linecap="round"/><path d="M7 12c3-2 7-2 10 0" stroke="white" stroke-width="1.6" stroke-linecap="round"/><path d="M6 9c3.5-2.5 8.5-2.5 12 0" stroke="white" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    discord:`<svg viewBox="0 0 24 24" fill="white" opacity="0.9"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.033.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
    tiktok:`<svg viewBox="0 0 24 24" fill="none"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    snapchat:`<svg viewBox="0 0 24 24" fill="none"><path d="M12 2a7 7 0 0 0-7 7v3l-2 2s1 1 3 1c0 0 1 3 6 3s6-3 6-3c2 0 3-1 3-1l-2-2V9a7 7 0 0 0-7-7z" stroke="white" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    maps:`<svg viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="white" stroke-width="1.7"/><circle cx="12" cy="10" r="3" stroke="white" stroke-width="1.7"/></svg>`,
    calendar:`<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="white" stroke-width="1.7"/><line x1="16" y1="2" x2="16" y2="6" stroke="white" stroke-width="1.7" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="white" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="white" stroke-width="1.7"/></svg>`,
    banking:`<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="11" rx="1.5" stroke="white" stroke-width="1.7"/><path d="M3 10l9-7 9 7" stroke="white" stroke-width="1.7" stroke-linecap="round"/><rect x="9" y="14" width="6" height="7" rx="1" stroke="white" stroke-width="1.4"/></svg>`,
    'wifi-ic':`<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="white" stroke-width="1.8" stroke-linecap="round"/><path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="white" stroke-width="1.8" stroke-linecap="round"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="white" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="20" r="1.2" fill="white"/></svg>`,
    download:`<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    apple:`<svg viewBox="0 0 24 24" fill="none"><path d="M12 4C10 4 8.5 5.5 8.5 5.5S7 4 5.5 4A4.5 4.5 0 0 0 2 8.7C2 13.5 7.5 18.5 12 20c4.5-1.5 10-6.5 10-11.3A4.5 4.5 0 0 0 17.5 4c-1 0-2 .7-2.5 1.2A4 4 0 0 0 12 4z" stroke="white" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    netflix:`<svg viewBox="0 0 24 24" fill="none"><text x="5" y="19" font-size="16" font-weight="900" font-family="Arial" fill="white">N</text></svg>`,
    google:`<svg viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" opacity="0.9"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" opacity="0.75"/></svg>`,
  };

  /**
   * Apply saved state to a page's status bar DOM.
   * Call after page load. Requires DOM elements: sbCarrier, sbTime, sbBpct,
   * sbSigWrap (optional), sbWifiWrap (optional), battIcon (optional), sbNotifs (optional)
   */
  function applyToPage(state) {
    const s = state || load();
    const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
    const setHtml = (id, val) => { const el=document.getElementById(id); if(el) el.innerHTML=val; };

    set('sbCarrier', s.carrier);
    set('sbTime', s.time);
    set('sbBpct',  s.battPct + '%');

    // Battery icon
    if (document.getElementById('battIcon')) {
      setHtml('battIcon', BATT_STYLES[s.battStyle||0](s.battPct));
    }
    // Signal icon
    if (document.getElementById('sigIcon')) {
      const el = document.getElementById('sigIcon');
      if (el) el.outerHTML = SIG_SVGS[s.sigChoice||0].replace('<svg','<svg id="sigIcon"');
    }
    // WiFi icon
    if (document.getElementById('wifiIcon')) {
      setHtml('wifiIcon', WIFI_SVGS[s.wifiChoice||0]);
    }
    // Notification icons
    const bar = document.getElementById('sbNotifs');
    if (bar && s.notifs && s.notifs.length) {
      bar.innerHTML = s.notifs.map(id => {
        const svg = NOTIF_DEFS[id];
        if (!svg) return '';
        return `<div style="display:flex;align-items:center;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" style="display:block">${svg.replace(/<svg[^>]*>/,'').replace('</svg>','')}</svg></div>`;
      }).join('');
    }
  }

  w.SB = {
    load, save, applyToPage,
    BATT_STYLES, SIG_SVGS, WIFI_SVGS, NOTIF_DEFS,
    update(patch) {
      const s = Object.assign(load(), patch);
      save(s);
      applyToPage(s);
      return s;
    }
  };

})(window);
