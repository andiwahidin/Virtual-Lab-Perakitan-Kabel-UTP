/**
 * ============================================================================
 * SCRIPT.JS - ENGINE LAB VIRTUAL PERAKITAN KABEL UTP (INFORMATIKA SMA)
 * Pengembang: Andi Wahidin Burhanuddin (Guru TIK SMAN 12 Wajo)
 * ============================================================================
 */

/* ============================================================================
 * [1] KONFIGURASI DEBUGGER & TROUBLESHOOTING
 * Ubah DEBUG_MODE menjadi false jika tidak ingin menampilkan log di Console (F12)
 * ============================================================================ */
const DEBUG_MODE = true;

function debugLog(moduleName, message, data = null) {
  if (!DEBUG_MODE) return;
  const time = new Date().toLocaleTimeString('id-ID');
  const style = 'background:#0c4a6e; color:#facc15; font-weight:bold; padding:2px 6px; border-radius:4px;';
  if (data !== null) {
    console.log(`%c[UTP-LAB ${time}] [${moduleName}]`, style, message, data);
  } else {
    console.log(`%c[UTP-LAB ${time}] [${moduleName}]`, style, message);
  }
}

function debugError(moduleName, errorObj) {
  console.error(`[UTP-LAB ERROR] [${moduleName}]:`, errorObj);
}

/* ============================================================================
 * [2] DATA KONSTANTA (WARNA KABEL, STANDAR T568A/B, MISI, & KUNCI LKPD)
 * ============================================================================ */
const WIRES = [
  { id: 'WO',  name: 'Putih-Oranye',  short: 'P-Oranye',  cls: 'wire-wo',  hex: '#fb923c', striped: true,  pair: 'Pasangan 2 (Oranye)',  pA: 3, pB: 1 },
  { id: 'O',   name: 'Oranye',        short: 'Oranye',    cls: 'wire-o',   hex: '#ea580c', striped: false, pair: 'Pasangan 2 (Oranye)',  pA: 6, pB: 2 },
  { id: 'WG',  name: 'Putih-Hijau',   short: 'P-Hijau',   cls: 'wire-wg',  hex: '#22c55e', striped: true,  pair: 'Pasangan 3 (Hijau)',   pA: 1, pB: 3 },
  { id: 'B',   name: 'Biru',          short: 'Biru',      cls: 'wire-b',   hex: '#2563eb', striped: false, pair: 'Pasangan 1 (Biru)',    pA: 4, pB: 4 },
  { id: 'WB',  name: 'Putih-Biru',    short: 'P-Biru',    cls: 'wire-wb',  hex: '#3b82f6', striped: true,  pair: 'Pasangan 1 (Biru)',    pA: 5, pB: 5 },
  { id: 'G',   name: 'Hijau',         short: 'Hijau',     cls: 'wire-g',   hex: '#16a34a', striped: false, pair: 'Pasangan 3 (Hijau)',   pA: 2, pB: 6 },
  { id: 'WBR', name: 'Putih-Cokelat', short: 'P-Cokelat', cls: 'wire-wbr', hex: '#a16207', striped: true,  pair: 'Pasangan 4 (Cokelat)', pA: 7, pB: 7 },
  { id: 'BR',  name: 'Cokelat',       short: 'Cokelat',   cls: 'wire-br',  hex: '#78350f', striped: false, pair: 'Pasangan 4 (Cokelat)', pA: 8, pB: 8 }
];

const STD_B = ['WO', 'O', 'WG', 'B', 'WB', 'G', 'WBR', 'BR'];
const STD_A = ['WG', 'G', 'WO', 'B', 'WB', 'O', 'WBR', 'BR'];

const MISSIONS = [
  { id: 1, title: 'Misi 1: Straight T568B',  target: 'STRAIGHT_B',   desc: 'Susun Ujung A = T568B dan Ujung B = T568B, lakukan crimping, lalu tekan Catat Data & Verifikasi.' },
  { id: 2, title: 'Misi 2: Straight T568A',  target: 'STRAIGHT_A',   desc: 'Susun Ujung A = T568A dan Ujung B = T568A, lakukan crimping, lalu tekan Catat Data & Verifikasi.' },
  { id: 3, title: 'Misi 3: PC ke Switch',    target: 'STRAIGHT_ANY', desc: 'Hubungkan PC ke Switch Lab (Perangkat Berbeda = Kabel Straight-Through).' },
  { id: 4, title: 'Misi 4: PC ke PC (Cross)',target: 'CROSSOVER',    desc: 'Hubungkan PC langsung ke PC (Perangkat Sejenis = Kabel Crossover T568A ↔ T568B).' },
  { id: 5, title: 'Misi 5: Router ke PC',    target: 'CROSSOVER',    desc: 'Hubungkan Port Ethernet Router langsung ke PC Admin menggunakan kabel Crossover.' }
];

const LKPD_KEYS = {
  5: { ans: '6', msg: 'Benar! Pada T568B, kawat Hijau berada di Pin 6 (RX-).' },
  6: { ans: '3', msg: 'Benar! Pada kabel Crossover, Pin 1 bersilangan menuju Pin 3.' },
  7: { ans: '4', msg: 'Benar! Hanya 4 pin utama yang aktif pada 100Base-TX (Pin 1, 2, 3, dan 6).' },
  8: { ans: '3', msg: 'Benar! Pada T568A, Putih-Oranye berada di Pin 3.' }
};

/* ============================================================================
 * [3] STATE MANAGEMENT APLIKASI
 * ============================================================================ */
let splashMode = 'T568B';
let splashPinStep = 1;

let sim = {
  missionId: 1,
  stripped: false,
  activeEnd: 'A',
  slotIdx: 0,
  swapMode: false,
  swapFirst: null,
  ends: {
    A: [null, null, null, null, null, null, null, null],
    B: [null, null, null, null, null, null, null, null]
  },
  crimped: { A: false, B: false },
  testerRunning: false,
  testerTimer: null,
  speed: 420,
  completedMissions: {},
  logs: []
};

/* ============================================================================
 * [4] MESIN AUDIO (WEB AUDIO API SYNTHESIZER: SFX & BGM)
 * ============================================================================ */
let audioCtx = null;
let sfxEnabled = true;
let bgmEnabled = true;
let bgmTimer = null;
let bgmStep = 0;

function initAudioEngine() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
        debugLog('AUDIO', 'AudioContext berhasil diinisialisasi.');
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    debugError('AUDIO', err);
  }
}

function playSfx(type) {
  if (!sfxEnabled) return;
  try {
    initAudioEngine();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'click') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(740, now);
      o.frequency.exponentialRampToValueAtTime(380, now + 0.06);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.065);
    } else if (type === 'wire') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(540, now);
      o.frequency.exponentialRampToValueAtTime(920, now + 0.08);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.085);
    } else if (type === 'strip') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(240, now);
      o.frequency.linearRampToValueAtTime(680, now + 0.16);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.19);
    } else if (type === 'crimp') {
      [0, 0.07, 0.15].forEach((off, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(200 + i * 150, now + off);
        o.frequency.exponentialRampToValueAtTime(95, now + off + 0.06);
        g.gain.setValueAtTime(0.28, now + off);
        g.gain.exponentialRampToValueAtTime(0.01, now + off + 0.06);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now + off); o.stop(now + off + 0.065);
      });
    } else if (type === 'beep') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1046.5, now);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.085);
    } else if (type === 'ok') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + i * 0.08);
        g.gain.setValueAtTime(0.26, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.005, now + i * 0.08 + 0.22);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.23);
      });
    } else if (type === 'err') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(195, now);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.19);
    }
  } catch (err) {
    debugError('SFX', err);
  }
}

function startCyberBgm() {
  initAudioEngine();
  if (bgmTimer) clearInterval(bgmTimer);
  const melody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23, 440.00, 587.33, 440.00, 349.23];
  const bass   = [130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 146.83, 146.83, 146.83, 146.83, 146.83, 146.83];

  const playTick = () => {
    if (!bgmEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const idx = bgmStep % melody.length;

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(melody[idx], now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    if (idx === 0 || idx === 6) {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(bass[idx], now);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(0.11, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now);
      osc2.stop(now + 2.3);
    }
    bgmStep++;
  };

  playTick();
  bgmTimer = setInterval(playTick, 460);
  updateAudioButtonsUI();
}

function toggleSfx() {
  initAudioEngine();
  sfxEnabled = !sfxEnabled;
  if (sfxEnabled) playSfx('click');
  updateAudioButtonsUI();
  debugLog('AUDIO', `Status SFX: ${sfxEnabled ? 'AKTIF' : 'MATI'}`);
}

function toggleBgm() {
  initAudioEngine();
  bgmEnabled = !bgmEnabled;
  if (bgmEnabled) {
    startCyberBgm();
  } else if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
  updateAudioButtonsUI();
  debugLog('AUDIO', `Status BGM: ${bgmEnabled ? 'AKTIF' : 'MATI'}`);
}

function updateAudioButtonsUI() {
  const btnS = document.getElementById('btnSfx');
  const btnB = document.getElementById('btnBgm');
  if (!btnS || !btnB) return;

  btnS.classList.toggle('muted', !sfxEnabled);
  btnS.textContent = sfxEnabled ? '🔊' : '🔇';

  btnB.classList.toggle('muted', !bgmEnabled);
  btnB.textContent = bgmEnabled ? '🎵' : '🔕';
}

/* ============================================================================
 * [5] ANIMASI LATAR CANVAS & PRATINJAU SPLASH SCREEN
 * ============================================================================ */
function initBackgroundCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let netNodes = [];
  let binaryBits = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  for (let i = 0; i < 24; i++) {
    netNodes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: 2.5 + Math.random() * 2.5,
      color: i % 3 === 0 ? '#facc15' : '#38bdf8'
    });
  }

  for (let i = 0; i < 22; i++) {
    binaryBits.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vy: 0.35 + Math.random() * 0.55,
      bit: Math.random() > 0.5 ? '1' : '0',
      alpha: 0.12 + Math.random() * 0.25
    });
  }

  function drawNetworkBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rays = [0.15, 0.45, 0.78];
    rays.forEach((pos) => {
      const topX = canvas.width * pos;
      const grad = ctx.createLinearGradient(topX, 0, topX, canvas.height * 0.8);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.10)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(topX - 50, 0);
      ctx.lineTo(topX + 50, 0);
      ctx.lineTo(topX + 180, canvas.height * 0.8);
      ctx.lineTo(topX - 180, canvas.height * 0.8);
      ctx.closePath();
      ctx.fill();
    });

    for (let i = 0; i < netNodes.length; i++) {
      const a = netNodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
      if (a.y < 0 || a.y > canvas.height) a.vy *= -1;

      for (let j = i + 1; j < netNodes.length; j++) {
        const b = netNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 185) {
          const alpha = (1 - dist / 185) * 0.22;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          const t = ((Date.now() * 0.0006 + i * 0.3) % 1);
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.fillStyle = `rgba(250, 204, 21, ${alpha * 2.2})`;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = a.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.font = 'bold 12px monospace';
    binaryBits.forEach(b => {
      b.y -= b.vy;
      if (b.y < -15) {
        b.y = canvas.height + 15;
        b.x = Math.random() * canvas.width;
      }
      ctx.fillStyle = `rgba(125, 211, 252, ${b.alpha})`;
      ctx.fillText(b.bit, b.x, b.y);
    });

    requestAnimationFrame(drawNetworkBackground);
  }
  drawNetworkBackground();
}

function renderSplashWires() {
  const activeOrder = splashMode === 'T568A' ? STD_A : STD_B;
  const svgGroup = document.getElementById('splashSvgWires');
  const stripBox = document.getElementById('splashPinStrip');
  const connLabel = document.getElementById('splashConnectorLabel');

  if (!svgGroup || !stripBox || !connLabel) return;

  if (splashMode === 'T568B') {
    connLabel.textContent = 'RJ-45 PIN 1 ──────────► PIN 8 (STANDAR T568B)';
  } else if (splashMode === 'T568A') {
    connLabel.textContent = 'RJ-45 PIN 1 ──────────► PIN 8 (STANDAR T568A)';
  } else {
    connLabel.textContent = 'CROSSOVER: UJUNG A (T568B) ◄──► UJUNG B (T568A)';
  }

  const xPositions = [30.5, 53.5, 76.5, 99.5, 122.5, 145.5, 168.5, 191.5];
  svgGroup.innerHTML = activeOrder.map((wId, idx) => {
    const w = WIRES.find(item => item.id === wId);
    const x = xPositions[idx];
    return `
      <rect x="${x}" y="44" width="9" height="90" rx="2" fill="${w.hex}" />
      ${w.striped ? `<line x1="${x + 4.5}" y1="44" x2="${x + 4.5}" y2="134" stroke="#ffffff" stroke-width="3.2" stroke-dasharray="6 6" />` : ''}
    `;
  }).join('');

  stripBox.innerHTML = activeOrder.map((wId, idx) => {
    const w = WIRES.find(item => item.id === wId);
    return `
      <div id="spCard${idx + 1}" class="splash-pin-card">
        <span class="splash-pin-num">PIN ${idx + 1}</span>
        <div class="splash-pin-bar ${w.cls}"></div>
        <span class="splash-pin-name">${w.short}</span>
      </div>
    `;
  }).join('');
}

function setSplashPreviewMode(mode) {
  playSfx('click');
  splashMode = mode;
  document.getElementById('spBtnB').classList.toggle('active', mode === 'T568B');
  document.getElementById('spBtnA').classList.toggle('active', mode === 'T568A');
  document.getElementById('spBtnCross').classList.toggle('active', mode === 'CROSS');
  renderSplashWires();
  debugLog('SPLASH', `Mode pratinjau diubah ke: ${mode}`);
}

function startSplashScannerLoop() {
  setInterval(() => {
    const crossMap = { 1: 3, 2: 6, 3: 1, 4: 4, 5: 5, 6: 2, 7: 7, 8: 8 };
    const remoteActivePin = splashMode === 'CROSS' ? crossMap[splashPinStep] : splashPinStep;
    const isCrossedPin = splashMode === 'CROSS' && [1, 2, 3, 6].includes(splashPinStep);

    for (let i = 1; i <= 8; i++) {
      const mLed = document.getElementById('spM' + i);
      const rLed = document.getElementById('spR' + i);
      const gPin = document.getElementById('spPin' + i);
      const pCard = document.getElementById('spCard' + i);

      if (mLed) {
        mLed.setAttribute('fill', i === splashPinStep ? '#22c55e' : '#1e293b');
        mLed.setAttribute('stroke', i === splashPinStep ? '#86efac' : '#334155');
      }
      if (rLed) {
        const onColor = isCrossedPin ? '#facc15' : '#22c55e';
        const onStroke = isCrossedPin ? '#fef08a' : '#86efac';
        rLed.setAttribute('fill', i === remoteActivePin ? onColor : '#1e293b');
        rLed.setAttribute('stroke', i === remoteActivePin ? onStroke : '#334155');
      }
      if (gPin) {
        gPin.setAttribute('fill', i === splashPinStep ? '#ffffff' : '#eab308');
      }
      if (pCard) {
        pCard.classList.toggle('active-scan', i === splashPinStep);
      }
    }

    const roleLabel = splashPinStep === 1 ? 'TX+' : splashPinStep === 2 ? 'TX-' : splashPinStep === 3 ? 'RX+' : splashPinStep === 6 ? 'RX-' : 'DATA';
    const scanText = document.getElementById('splashScanLabel');
    if (scanText) {
      scanText.textContent = `UJI SINYAL: MASTER PIN ${splashPinStep} (${roleLabel}) ➔ REMOTE PIN ${remoteActivePin}`;
    }

    splashPinStep = splashPinStep >= 8 ? 1 : splashPinStep + 1;
  }, 420);
}

/* ============================================================================
 * [6] LOADING TRANSITION, NAVIGASI LAYAR, & RENDER TEORI
 * ============================================================================ */
function startLabWithLoading() {
  initAudioEngine();
  playSfx('wire');
  if (bgmEnabled && !bgmTimer) startCyberBgm();

  const overlay = document.getElementById('loadingOverlay');
  const barFill = document.getElementById('loadingBarFill');
  const pctText = document.getElementById('loadingPercentText');
  const stepText = document.getElementById('loadingStepText');
  overlay.style.display = 'flex';

  const steps = [
    'Mengupas selubung jaket kabel UTP Cat5e/Cat6...',
    'Mengurutkan 8 inti kawat standar EIA/TIA-568A & T568B...',
    'Menyiapkan konektor RJ-45 & Tang Crimping...',
    'Mengkalibrasi indikator LED LAN Tester Master & Remote...',
    'Laboratorium Virtual Siap Digunakan!'
  ];

  let progress = 0;
  const timer = setInterval(() => {
    progress += 4;
    if (progress > 100) progress = 100;
    barFill.style.width = progress + '%';
    pctText.textContent = progress + '%';

    const litCount = Math.floor((progress / 100) * 8);
    for (let i = 0; i < 8; i++) {
      const wEl = document.getElementById('lw' + i);
      if (i < litCount && wEl && !wEl.classList.contains('lit')) {
        wEl.classList.add('lit');
        playSfx('click');
      }
    }

    const sIdx = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
    stepText.textContent = steps[sIdx];

    if (progress >= 100) {
      clearInterval(timer);
      playSfx('ok');
      setTimeout(() => {
        overlay.style.display = 'none';
        navigateTo('home');
      }, 320);
    }
  }, 45);
}

function navigateTo(viewName) {
  playSfx('click');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.add('active');
    debugLog('NAVIGASI', `Berpindah ke layar: view-${viewName}`);
  } else {
    debugError('NAVIGASI', `Elemen view-${viewName} tidak ditemukan!`);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTeoriSection() {
  const grid = document.getElementById('teoriWireGrid');
  if (!grid) return;

  grid.innerHTML = WIRES.map((w, idx) => `
    <div onclick="playSfx('wire')" style="cursor: pointer; padding: 12px; border-radius: 14px; background: rgba(4, 20, 38, 0.85); border: 1px solid rgba(56, 189, 248, 0.3); transition: transform 0.15s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
      <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-family: monospace; color: var(--cyan); margin-bottom: 6px;">
        <span>#${idx + 1} • ${w.pair}</span>
        <span style="color: var(--yellow);">${w.striped ? 'Belang' : 'Polos'}</span>
      </div>
      <div class="${w.cls}" style="height: 24px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4); margin-bottom: 8px;"></div>
      <div style="font-weight: 800; font-size: 0.92rem;">${w.name}</div>
      <div style="font-size: 0.76rem; font-family: monospace; color: var(--text-muted); margin-top: 4px;">
        T568B: <strong>Pin ${w.pB}</strong> | T568A: <strong>Pin ${w.pA}</strong>
      </div>
    </div>
  `).join('');

  const buildPinRows = (stdArr) => stdArr.map((wId, idx) => {
    const w = WIRES.find(x => x.id === wId);
    const pin = idx + 1;
    const role = pin === 1 ? 'TX+' : pin === 2 ? 'TX-' : pin === 3 ? 'RX+' : pin === 6 ? 'RX-' : 'Cadangan';
    const isMain = [1, 2, 3, 6].includes(pin);
    return `
      <div style="display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 10px; background: rgba(4, 20, 38, 0.8); border: 1px solid rgba(148,163,184,0.2);">
        <span style="width: 52px; font-family: monospace; font-weight: 800; font-size: 0.78rem; text-align: center; padding: 3px 0; border-radius: 6px; background: rgba(15,23,42,0.9); color: var(--yellow);">PIN ${pin}</span>
        <div class="${w.cls}" style="width: 78px; height: 20px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.35); flex-shrink: 0;"></div>
        <span style="flex: 1; font-weight: 700; font-size: 0.85rem;">${w.name}</span>
        <span style="font-family: monospace; font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; background: ${isMain ? 'rgba(56,189,248,0.18)' : 'rgba(15,23,42,0.6)'}; color: ${isMain ? '#38bdf8' : '#94a3b8'}; font-weight: 700;">${role}</span>
      </div>
    `;
  }).join('');

  document.getElementById('teoriTableA').innerHTML = buildPinRows(STD_A);
  document.getElementById('teoriTableB').innerHTML = buildPinRows(STD_B);
}

/* ============================================================================
 * [7] LOGIKA SIMULASI PERAKITAN KABEL UTP & LAN TESTER
 * ============================================================================ */
function selectMission(id) {
  stopTester();
  sim.missionId = id;
  sim.stripped = false;
  sim.activeEnd = 'A';
  sim.slotIdx = 0;
  sim.swapMode = false;
  sim.swapFirst = null;
  sim.ends = {
    A: [null, null, null, null, null, null, null, null],
    B: [null, null, null, null, null, null, null, null]
  };
  sim.crimped = { A: false, B: false };
  renderSimUI();
  debugLog('SIMULASI', `Misi ${id} dipilih.`);
}

function stripJacket() {
  sim.stripped = true;
  playSfx('strip');
  renderSimUI();
  debugLog('SIMULASI', 'Jaket kabel UTP berhasil dikupas.');
}

function toggleCheat() {
  playSfx('click');
  const box = document.getElementById('cheatBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function switchEnd(endKey) {
  playSfx('click');
  sim.activeEnd = endKey;
  const emptyIdx = sim.ends[endKey].findIndex(x => x === null);
  sim.slotIdx = emptyIdx !== -1 ? emptyIdx : 0;
  sim.swapFirst = null;
  renderSimUI();
  debugLog('SIMULASI', `Beralih ke konektor Ujung ${endKey}`);
}

function clickPinSlot(idx) {
  if (!sim.stripped) {
    playSfx('err');
    showModal('⚠️', 'Kupas Jaket Kabel Dahulu', 'Tekan tombol <strong>"✂️ 1. Kupas Jaket Kabel"</strong> sebelum menyusun kawat ke dalam konektor RJ-45.');
    return;
  }
  const arr = sim.ends[sim.activeEnd];
  if (sim.swapMode) {
    if (sim.swapFirst === null) {
      sim.swapFirst = idx;
      playSfx('click');
    } else if (sim.swapFirst === idx) {
      sim.swapFirst = null;
      playSfx('click');
    } else {
      const tmp = arr[sim.swapFirst];
      arr[sim.swapFirst] = arr[idx];
      arr[idx] = tmp;
      sim.crimped[sim.activeEnd] = false;
      debugLog('SIMULASI', `Tukar Pin pada Ujung ${sim.activeEnd}: Pin ${sim.swapFirst + 1} <-> Pin ${idx + 1}`);
      sim.swapFirst = null;
      playSfx('wire');
    }
    renderSimUI();
    return;
  }
  sim.slotIdx = idx;
  playSfx('click');
  renderSimUI();
}

function pickWire(wireId) {
  if (!sim.stripped) {
    playSfx('err');
    showModal('⚠️', 'Kupas Jaket Kabel Dahulu', 'Klik tombol <strong>"✂️ 1. Kupas Jaket Kabel"</strong> terlebih dahulu.');
    return;
  }
  const arr = sim.ends[sim.activeEnd];
  const oldPos = arr.indexOf(wireId);
  if (oldPos !== -1 && oldPos !== sim.slotIdx) arr[oldPos] = null;

  arr[sim.slotIdx] = wireId;
  sim.crimped[sim.activeEnd] = false;
  playSfx('wire');
  debugLog('SIMULASI', `Kawat ${wireId} dipasang ke Ujung ${sim.activeEnd} Pin #${sim.slotIdx + 1}`);

  const nextEmpty = arr.findIndex((v, i) => v === null && i > sim.slotIdx);
  if (nextEmpty !== -1) sim.slotIdx = nextEmpty;
  else {
    const anyEmpty = arr.findIndex(v => v === null);
    if (anyEmpty !== -1) sim.slotIdx = anyEmpty;
    else if (sim.slotIdx < 7) sim.slotIdx++;
  }
  renderSimUI();
}

function toggleSwap() {
  playSfx('click');
  sim.swapMode = !sim.swapMode;
  sim.swapFirst = null;
  renderSimUI();
}

function clearEnd() {
  playSfx('click');
  sim.ends[sim.activeEnd] = [null, null, null, null, null, null, null, null];
  sim.crimped[sim.activeEnd] = false;
  sim.slotIdx = 0;
  renderSimUI();
  debugLog('SIMULASI', `Pin pada Ujung ${sim.activeEnd} dikosongkan.`);
}

function triggerCrimpAnimation() {
  const box = document.getElementById('rj45Box');
  box.classList.remove('crimp-shake');
  void box.offsetWidth;
  box.classList.add('crimp-shake');
}

function crimpActiveEnd() {
  const cnt = sim.ends[sim.activeEnd].filter(Boolean).length;
  if (cnt < 8) {
    playSfx('err');
    showModal('⚠️', `Pin Ujung ${sim.activeEnd} Belum Lengkap`, `Baru terisi ${cnt} dari 8 kawat pada Ujung ${sim.activeEnd}.`);
    return;
  }
  sim.crimped[sim.activeEnd] = true;
  playSfx('crimp');
  triggerCrimpAnimation();
  renderSimUI();
  debugLog('SIMULASI', `Konektor Ujung ${sim.activeEnd} berhasil di-crimping.`);
}

function crimpBothEnds() {
  const cA = sim.ends.A.filter(Boolean).length;
  const cB = sim.ends.B.filter(Boolean).length;
  if (cA < 8 || cB < 8) {
    playSfx('err');
    showModal('⚠️', 'Kawat Belum Lengkap 8 Pin', `Pastikan Ujung A (${cA}/8) dan Ujung B (${cB}/8) sudah terisi penuh sebelum di-crimping.`);
    return;
  }
  sim.crimped.A = true;
  sim.crimped.B = true;
  playSfx('crimp');
  triggerCrimpAnimation();
  renderSimUI();
  debugLog('SIMULASI', 'Konektor Ujung A dan Ujung B berhasil di-crimping.');
}

function getStandardName(arr) {
  if (arr.filter(Boolean).length < 8) return 'Belum Lengkap';
  if (arr.every((v, i) => v === STD_B[i])) return 'T568B';
  if (arr.every((v, i) => v === STD_A[i])) return 'T568A';
  return 'Susunan Kustom';
}

function analyzeCableConfiguration() {
  const stdA = getStandardName(sim.ends.A);
  const stdB = getStandardName(sim.ends.B);
  let cableType = 'Belum Lengkap';
  let note = 'Susun ke-8 kawat pada Ujung A & B lalu tekan Crimping';

  if (sim.ends.A.filter(Boolean).length === 8 && sim.ends.B.filter(Boolean).length === 8) {
    if ((stdA === 'T568B' && stdB === 'T568B') || (stdA === 'T568A' && stdB === 'T568A')) {
      cableType = `Straight (${stdA})`;
      note = sim.crimped.A && sim.crimped.B ? 'Siap diuji (Pola Remote 1-2-3-4-5-6-7-8)' : 'Belum di-crimping!';
    } else if ((stdA === 'T568A' && stdB === 'T568B') || (stdA === 'T568B' && stdB === 'T568A')) {
      cableType = 'Crossover (Silang)';
      note = sim.crimped.A && sim.crimped.B ? 'Siap diuji (Pola Remote 3-6-1-4-5-2-7-8)' : 'Belum di-crimping!';
    } else {
      cableType = 'Salah Urutan / Non-Standar';
      note = 'Urutan warna tidak sesuai T568A maupun T568B';
    }
  }
  return { stdA, stdB, cableType, note };
}

function renderSimUI() {
  const mBar = document.getElementById('missionBtnBar');
  if (!mBar) return;

  mBar.innerHTML = MISSIONS.map(m => {
    const active = sim.missionId === m.id;
    const done = Boolean(sim.completedMissions[m.id]);
    return `
      <button onclick="selectMission(${m.id})" style="padding: 8px 10px; border-radius: 10px; border: 1.5px solid ${active ? 'var(--yellow)' : 'rgba(148,163,184,0.3)'}; background: ${active ? 'rgba(250,204,21,0.16)' : 'rgba(4,22,40,0.65)'}; color: #fff; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.76rem; font-weight: 800;">${m.title}</span>
        <span style="font-size: 0.75rem;">${done ? '✅' : ''}</span>
      </button>
    `;
  }).join('');

  const curM = MISSIONS.find(x => x.id === sim.missionId);
  document.getElementById('missionBriefBox').innerHTML = `<strong>Instruksi ${curM.title}:</strong> ${curM.desc}`;
  document.getElementById('simMissionStatus').textContent = `Misi Selesai: ${Object.keys(sim.completedMissions).length} / 5`;

  const btnStrip = document.getElementById('btnStrip');
  if (sim.stripped) {
    btnStrip.style.background = 'rgba(34, 197, 94, 0.2)';
    btnStrip.style.color = '#86efac';
    btnStrip.style.border = '1px solid #22c55e';
    btnStrip.innerHTML = '✓ Jaket Kabel Terkupas';
  } else {
    btnStrip.style.background = 'var(--yellow)';
    btnStrip.style.color = '#0f172a';
    btnStrip.innerHTML = '✂️ 1. Kupas Jaket Kabel';
  }

  const cA = sim.ends.A.filter(Boolean).length;
  const cB = sim.ends.B.filter(Boolean).length;
  const btnA = document.getElementById('btnEndA');
  const btnB = document.getElementById('btnEndB');
  btnA.style.background = sim.activeEnd === 'A' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(4, 22, 40, 0.65)';
  btnA.style.border = sim.activeEnd === 'A' ? '2px solid var(--cyan)' : '1.5px solid rgba(148,163,184,0.3)';
  btnB.style.background = sim.activeEnd === 'B' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(4, 22, 40, 0.65)';
  btnB.style.border = sim.activeEnd === 'B' ? '2px solid var(--cyan)' : '1.5px solid rgba(148,163,184,0.3)';

  document.getElementById('badgeEndA').textContent = sim.crimped.A ? 'CRIMP ✓' : `${cA}/8 Pin`;
  document.getElementById('badgeEndA').style.background = sim.crimped.A ? '#16a34a' : 'rgba(15,23,42,0.8)';
  document.getElementById('badgeEndB').textContent = sim.crimped.B ? 'CRIMP ✓' : `${cB}/8 Pin`;
  document.getElementById('badgeEndB').style.background = sim.crimped.B ? '#16a34a' : 'rgba(15,23,42,0.8)';

  document.getElementById('labelActiveEnd').textContent = `UJUNG ${sim.activeEnd}`;
  document.getElementById('targetPinLabel').textContent = `#${sim.slotIdx + 1}`;

  const btnSwap = document.getElementById('btnSwap');
  btnSwap.style.background = sim.swapMode ? 'var(--yellow)' : 'rgba(15, 23, 42, 0.8)';
  btnSwap.style.color = sim.swapMode ? '#0f172a' : '#fde047';

  const curArr = sim.ends[sim.activeEnd];
  const pinContainer = document.getElementById('pinGridContainer');
  pinContainer.innerHTML = curArr.map((wId, idx) => {
    const wObj = WIRES.find(w => w.id === wId);
    const isSel = !sim.swapMode && sim.slotIdx === idx;
    const isSwap = sim.swapMode && sim.swapFirst === idx;
    return `
      <div class="pin-slot ${isSel ? 'selected' : ''} ${isSwap ? 'swap-active' : ''}" onclick="clickPinSlot(${idx})">
        <div style="font-size: 0.72rem; font-family: monospace; font-weight: 800; color: ${isSel ? 'var(--yellow)' : '#94a3b8'}; margin-bottom: 4px;">P${idx + 1}</div>
        <div class="gold-pin" style="width: 12px; height: 20px; border-radius: 2px; margin-bottom: 5px;"></div>
        <div class="${wObj ? wObj.cls : ''}" style="width: 100%; height: 68px; border-radius: 6px; border: 1px dashed rgba(148,163,184,0.4); display: flex; align-items: center; justify-content: center;">
          ${!wObj ? '<span style="font-size: 0.62rem; color: #64748b; transform: rotate(-90deg);">Kosong</span>' : ''}
        </div>
        <div style="font-size: 0.65rem; font-weight: 700; margin-top: 5px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
          ${wObj ? wObj.short : '-'}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('crimpStatusText').innerHTML = sim.crimped[sim.activeEnd]
    ? `<span style="color: #4ade80; font-weight: 800;">🔒 Terkunci (Crimped)</span>`
    : `<span style="color: var(--yellow);">🔓 Belum Di-Crimping</span>`;

  const pal = document.getElementById('paletteContainer');
  pal.innerHTML = WIRES.map(w => {
    const pos = curArr.indexOf(w.id);
    return `
      <button class="wire-btn" onclick="pickWire('${w.id}')">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 5px;">
          <span>${w.short}</span>
          <span style="color: var(--yellow); font-family: monospace;">${pos !== -1 ? 'P' + (pos + 1) : ''}</span>
        </div>
        <div class="${w.cls}" style="height: 16px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3);"></div>
      </button>
    `;
  }).join('');

  const info = analyzeCableConfiguration();
  document.getElementById('readoutCableType').textContent = info.cableType;
  document.getElementById('readoutSub').textContent = `Ujung A: ${info.stdA} | Ujung B: ${info.stdB}`;
  document.getElementById('readoutNote').textContent = info.note;
}

function setSpeed(ms) {
  sim.speed = ms;
  document.getElementById('spdNormal').classList.toggle('active', ms === 420);
  document.getElementById('spdSlow').classList.toggle('active', ms === 850);
  if (sim.testerRunning) {
    stopTester();
    toggleTester();
  }
}

function renderLeds(activeMasterPin, remotePins, colorCls = 'led-green') {
  const mList = document.getElementById('masterLedList');
  const rList = document.getElementById('remoteLedList');
  if (!mList || !rList) return;

  let mHtml = '';
  let rHtml = '';
  for (let p = 1; p <= 8; p++) {
    const mOn = activeMasterPin === p;
    const rOn = remotePins.includes(p);
    mHtml += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 10px; border-radius: 8px; background: rgba(15,23,42,0.9);">
        <span style="font-family: monospace; font-size: 0.78rem; font-weight: 700;">PIN ${p}</span>
        <div class="led-dot ${mOn ? 'led-green' : ''}"></div>
      </div>
    `;
    rHtml += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 10px; border-radius: 8px; background: rgba(15,23,42,0.9);">
        <span style="font-family: monospace; font-size: 0.78rem; font-weight: 700;">PIN ${p}</span>
        <div class="led-dot ${rOn ? colorCls : ''}"></div>
      </div>
    `;
  }
  mList.innerHTML = mHtml;
  rList.innerHTML = rHtml;
}

function stopTester() {
  if (sim.testerTimer) clearInterval(sim.testerTimer);
  sim.testerTimer = null;
  sim.testerRunning = false;
  const btn = document.getElementById('btnTester');
  if (btn) btn.innerHTML = '▶ Uji LAN Tester';
}

function toggleTester() {
  if (sim.testerRunning) {
    stopTester();
    renderLeds(-1, []);
    return;
  }
  if (!sim.crimped.A || !sim.crimped.B) {
    playSfx('err');
    showModal('⚠️', 'Konektor Belum Di-Crimping', 'Tekan tombol <strong>"🔧 Crimping A & B Sekaligus"</strong> terlebih dahulu agar konektor terkunci sebelum diuji.');
    return;
  }
  sim.testerRunning = true;
  document.getElementById('btnTester').innerHTML = '⏹ Hentikan Tester';
  let curPin = 1;

  debugLog('TESTER', 'Memulai pengujian LAN Tester', { ujungA: sim.ends.A, ujungB: sim.ends.B });

  const step = () => {
    if (curPin > 8) curPin = 1;
    const wA = sim.ends.A[curPin - 1];
    let rPins = [];
    if (wA) {
      sim.ends.B.forEach((wB, idxB) => {
        if (wB === wA) rPins.push(idxB + 1);
      });
    }
    let col = 'led-green';
    if (rPins.length === 0) {
      col = 'led-red';
      playSfx('err');
    } else if (rPins[0] !== curPin) {
      col = 'led-amber';
      playSfx('beep');
    } else {
      playSfx('beep');
    }
    renderLeds(curPin, rPins, col);
    curPin++;
  };
  step();
  sim.testerTimer = setInterval(step, sim.speed);
}

function getRemotePatternString() {
  if (!sim.crimped.A || !sim.crimped.B) return 'Belum Crimping';
  let out = [];
  for (let p = 0; p < 8; p++) {
    const wA = sim.ends.A[p];
    const idxB = sim.ends.B.indexOf(wA);
    out.push(idxB !== -1 ? idxB + 1 : 'X');
  }
  return out.join('-');
}

function recordExperimentData() {
  if (!sim.crimped.A || !sim.crimped.B) {
    playSfx('err');
    showModal('⚠️', 'Belum Di-Crimping', 'Pastikan Ujung A dan Ujung B sudah terisi 8 kawat dan di-crimping sebelum mencatat data percobaan.');
    return;
  }

  const info = analyzeCableConfiguration();
  const pattern = getRemotePatternString();
  const status = info.cableType.includes('Straight') || info.cableType.includes('Crossover')
    ? 'Terhubung (Valid)'
    : 'Gagal / Salah Pin';

  const newEntry = {
    no: sim.logs.length + 1,
    stdA: info.stdA,
    stdB: info.stdB,
    type: info.cableType,
    pattern,
    status
  };

  sim.logs.push(newEntry);
  debugLog('DATA-LOG', 'Baris data percobaan baru dicatat:', newEntry);
  renderExperimentTable();

  const m = MISSIONS.find(x => x.id === sim.missionId);
  let ok = false;
  if (m.target === 'STRAIGHT_B' && info.stdA === 'T568B' && info.stdB === 'T568B') ok = true;
  if (m.target === 'STRAIGHT_A' && info.stdA === 'T568A' && info.stdB === 'T568A') ok = true;
  if (m.target === 'STRAIGHT_ANY' && ((info.stdA === 'T568B' && info.stdB === 'T568B') || (info.stdA === 'T568A' && info.stdB === 'T568A'))) ok = true;
  if (m.target === 'CROSSOVER' && ((info.stdA === 'T568A' && info.stdB === 'T568B') || (info.stdA === 'T568B' && info.stdB === 'T568A'))) ok = true;

  if (ok) {
    sim.completedMissions[m.id] = true;
    playSfx('ok');
    renderSimUI();
    showModal('🎉', `${m.title} Berhasil!`, `Data rakitan <strong>${info.cableType}</strong> dengan pola Remote <code>${pattern}</code> telah masuk ke Tabel Data Percobaan.`);
  } else {
    playSfx('click');
    showModal('📌', 'Data Tercatat ke Tabel', `Rakitanmu (<strong>${info.stdA} – ${info.stdB}</strong>) dengan pola Remote <code>${pattern}</code> telah dicatat, namun belum sesuai target <strong>${m.title}</strong>.`);
  }
}

function renderExperimentTable() {
  const tbody = document.getElementById('expLogBody');
  if (sim.logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-table-cell">Belum ada data dicatat.</td></tr>`;
    return;
  }
  tbody.innerHTML = sim.logs.map(row => `
    <tr>
      <td>${row.no}</td>
      <td>${row.stdA}</td>
      <td>${row.stdB}</td>
      <td style="color: var(--yellow); font-weight: 700;">${row.type}</td>
      <td style="font-family: monospace;">${row.pattern}</td>
      <td style="color: ${row.status.includes('Valid') ? '#4ade80' : '#f87171'}; font-weight: 700;">${row.status}</td>
    </tr>
  `).join('');
}

function clearExperimentLog() {
  playSfx('click');
  sim.logs = [];
  renderExperimentTable();
  debugLog('DATA-LOG', 'Tabel data percobaan dikosongkan.');
}

/* ============================================================================
 * [8] LKPD CEK OTOMATIS & EKSPOR PDF (jsPDF 2.5.1)
 * ============================================================================ */
function checkLkpdAnswer(qNum) {
  const val = document.getElementById('lkpdQ' + qNum).value.trim();
  const fb = document.getElementById('fbQ' + qNum);
  if (!val) {
    playSfx('err');
    fb.style.color = '#fbbf24';
    fb.textContent = 'Isi jawaban terlebih dahulu!';
    return;
  }
  if (val === LKPD_KEYS[qNum].ans) {
    playSfx('ok');
    fb.style.color = '#4ade80';
    fb.textContent = '✓ ' + LKPD_KEYS[qNum].msg;
  } else {
    playSfx('err');
    fb.style.color = '#f87171';
    fb.textContent = '✗ Belum tepat, silakan cek kembali di menu Teori.';
  }
}

function exportLkpdToPdf() {
  try {
    const nama = document.getElementById('lkpdNama').value.trim() || 'Siswa_Informatika';
    const kelas = document.getElementById('lkpdKelas').value.trim() || '-';

    if (!window.jspdf || !window.jspdf.jsPDF) {
      debugLog('PDF', 'Pustaka jsPDF tidak terdeteksi, mengalihkan ke window.print()');
      window.print();
      return;
    }

    playSfx('ok');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFillColor(8, 47, 73);
    doc.rect(0, 0, pageWidth, 34, 'F');
    doc.setTextColor(250, 204, 21);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LEMBAR KERJA PESERTA DIDIK (LKPD)', pageWidth / 2, 12, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('Lab Virtual Perakitan Kabel UTP (Straight & Crossover, T568A & T568B)', pageWidth / 2, 19, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Mata Pelajaran: Informatika SMA | Pengembang: Andi Wahidin Burhanuddin (SMAN 12 Wajo)', pageWidth / 2, 26, { align: 'center' });

    y = 42;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Nama Siswa : ${nama}`, 15, y);
    doc.text(`Kelas : ${kelas}`, 120, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Waktu Unduh : ${new Date().toLocaleString('id-ID')}`, 15, y);
    doc.text(`Misi Simulasi Selesai : ${Object.keys(sim.completedMissions).length} / 5 Misi`, 120, y);
    y += 5;
    doc.setDrawColor(180, 180, 180);
    doc.line(15, y, pageWidth - 15, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('Rekap Data Percobaan Simulasi:', 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (sim.logs.length === 0) {
      doc.text('- (Belum ada data percobaan yang dicatat pada tabel simulasi)', 15, y);
      y += 7;
    } else {
      sim.logs.forEach(r => {
        doc.text(`${r.no}. Ujung A: ${r.stdA} | Ujung B: ${r.stdB} -> ${r.type} | Pola Remote: ${r.pattern} (${r.status})`, 15, y);
        y += 5.5;
      });
      y += 3;
    }

    const questions = [
      { q: '1. Urutan nyala lampu Master & Remote pada standar yang sama (T568B-T568B):', a: document.getElementById('lkpdQ1').value },
      { q: '2. Perbandingan urutan warna T568A dan T568B (pasangan yang bertukar & tetap):', a: document.getElementById('lkpdQ2').value },
      { q: '3. Urutan nyala lampu Remote pada kabel Crossover (T568A-T568B):', a: document.getElementById('lkpdQ3').value },
      { q: '4. Alasan koneksi PC-Switch memakai Straight sedangkan PC-PC memakai Crossover:', a: document.getElementById('lkpdQ4').value },
      { q: '5. Nomor pin kawat Hijau pada T568B:', a: document.getElementById('lkpdQ5').value },
      { q: '6. Nomor lampu Remote saat Master di Pin 1 pada kabel Crossover:', a: document.getElementById('lkpdQ6').value },
      { q: '7. Jumlah pin aktif TX/RX pada Fast Ethernet 100Base-TX:', a: document.getElementById('lkpdQ7').value },
      { q: '8. Nomor pin Putih-Oranye pada standar T568A:', a: document.getElementById('lkpdQ8').value },
      { q: '9. Analisis kasus jika lampu nomor 2 mati total pada kabel Straight PC-Switch:', a: document.getElementById('lkpdQ9').value },
      { q: '10. Kesimpulan praktikum perakitan kabel UTP:', a: document.getElementById('lkpdQ10').value }
    ];

    questions.forEach(item => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const qLines = doc.splitTextToSize(item.q, pageWidth - 30);
      doc.text(qLines, 15, y);
      y += qLines.length * 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const ansText = (item.a && item.a.trim()) ? item.a.trim() : '(Belum diisi)';
      const aLines = doc.splitTextToSize('Jawaban: ' + ansText, pageWidth - 34);
      doc.text(aLines, 18, y);
      y += aLines.length * 5 + 4;
    });

    const safeName = nama.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`LKPD_Kabel_UTP_${safeName}.pdf`);
    debugLog('PDF', `Berkas LKPD_Kabel_UTP_${safeName}.pdf berhasil diunduh.`);
    showModal('📄', 'PDF Berhasil Diunduh!', `Berkas <strong>LKPD_Kabel_UTP_${safeName}.pdf</strong> telah berhasil dibuat dan diunduh ke perangkatmu.`);
  } catch (err) {
    debugError('PDF', err);
    showModal('⚠️', 'Gagal Membuat PDF', 'Terjadi kesalahan saat menyusun PDF. Pastikan koneksi internet aktif atau periksa log Console (F12).');
  }
}

/* ============================================================================
 * [9] MODAL DIALOG & INISIALISASI UTAMA
 * ============================================================================ */
function showModal(emoji, title, htmlBody) {
  document.getElementById('modalEmoji').textContent = emoji;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = htmlBody;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  playSfx('click');
  document.getElementById('modalOverlay').style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    initBackgroundCanvas();
    renderTeoriSection();
    selectMission(1);
    renderLeds(-1, []);
    updateAudioButtonsUI();
    debugLog('INIT', 'Aplikasi Lab Virtual Perakitan Kabel UTP berhasil dimuat sepenuhnya.');
  } catch (err) {
    debugError('INIT', err);
  }
});