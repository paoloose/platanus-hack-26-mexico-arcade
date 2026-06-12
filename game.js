// Platanus Hack 26 — Lucha de Código
// Scene-based architecture. Each game phase is a Phaser Scene.

const W = 800, H = 600, K = 'platanus-lucha-26';

const C = {
  bg: 0x1a0a2e, crowd: 0x2d1b4e, apron: 0x4a0000, mat: 0x8B7355,
  rope1: 0xff0000, rope2: 0xffffff, rope3: 0x0000ff,
  p1: 0xff0000, p2: 0x0000ff, txt: 0xffffff, shadow: 0x000000,
  bar: 0x00ff00, timer: 0xffff00,
};

// =============================================================================
// CSEF SPRITE ENGINE
// =============================================================================
const P_PAL = [
  0x000000, 0x24222a, 0x4e4b5b, 0x7b768e, 0xaba4c1, 0xd3cde7, 0xfefdfe, 0xffefa8,
  0xe2b35a, 0x9f5611, 0x6e2100, 0x390800, 0x5e2e00, 0x915f01, 0xe6c429, 0xeceab7,
  0xd2fe7d, 0xc1e12c, 0x989800, 0x5b4d00, 0x362400, 0x004d03, 0x0c6d00, 0x2b9200,
  0x7ec43f, 0xb2da73, 0xc8feae, 0x83fe6b, 0xff6600, 0x00cb22, 0x006d45, 0x004d3d,
  0x206100, 0x019000, 0x0bba3d, 0x2eda91, 0x4fffca, 0xd0fff6, 0xa9fbee, 0x01ffff,
  0x009cbe, 0x006092, 0x004373, 0x006cdc, 0x6dd0ff, 0xb6f3ff, 0xa4dbff, 0x687aff,
  0x0147ff, 0x0017c5, 0x140c81, 0x4200a5, 0x8d00f9, 0xc84ff5, 0xea9bf3, 0xf8dcf7,
  0xf49fb3, 0xf6629d, 0xff0092, 0xcc0095, 0xa30092, 0x920030, 0xc1003f, 0xff0000,
  0xf5765d, 0xd11717, 0xa41c1c, 0xab8169, 0x7c6822, 0xffc7ba, 0x254c93, 0xdeac92,
  0x18171a, 0xf7bb1b, 0xBF7F1F
];
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&*()_+-=[]{};:,/<?`"';
const COLOR_MAP = {};
for (let i = 0; i < CHARS.length; i++) {
  if (i < P_PAL.length) COLOR_MAP[CHARS[i]] = P_PAL[i];
}
COLOR_MAP['.'] = null; COLOR_MAP[' '] = null;

function parseCSEF(s, w) {
  const r = [], p = [];
  for (let i = 0; i < s.length;) {
    if (!p.length) {
      if (s[i] === '~') { r.push(Array(w).fill('.')); i++; continue; }
      if (s[i] === '^') { if (r.length) r.push([...r.at(-1)]); i++; continue; }
    }
    if (s[i] === '>' && p.length >= w / 2 && w % 2 === 0) {
      const h = p.slice(0, w / 2);
      r.push([...h, ...h.toReversed()]);
      p.length = 0; i++; continue;
    }
    const n = +s[i], c = s[i + 1];
    if (!n || n > 9) { i++; continue; }
    p.push(...Array(n).fill(c));
    while (p.length >= w) r.push(p.splice(0, w));
    i += 2;
  }
  if (p.length) r.push(p);
  return r;
}

function parseSprite(sData, w = 24) {
  if (!sData) return [];
  if (Array.isArray(sData)) return sData;
  try {
    const res = parseCSEF(sData, w);
    if (!res || !res.length || res[0].length !== w) {
      throw new Error('Invalid dimensions or empty sprite');
    }
    return res;
  } catch (e) {
    throw new Error('CRASH: Invalid encoded sprite data: ' + sData + ' | Error: ' + e.message);
  }
}

function drawSprite(gfx, sData, x, y) {
  if (!sData || !sData.length) return;
  const h = sData.length;
  const w = sData[0]?.length || 0;
  if (!w) return;
  const cx = w >> 1;
  const cy = h >> 1;
  
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < sData[r].length; c++) {
      const col = COLOR_MAP[sData[r][c]];
      if (col != null) {
        gfx.fillStyle(col, 1);
        gfx.fillRect(x - cx + c | 0, y - cy + r | 0, 1, 1);
      }
    }
  }
}

const CH = [
  ['BLUE DEMON', {
  Walk: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
  Jump: '~~~~~8.7:9.8.2:1E5:8.7.3:4E2:8.7.4:1E2A2E8.^7.5:4E8.8.4:1E3=8.8.4:3E9.5.4=5:9.1.4.9=1=9.1.^3.4=1K6=9.1.3.3=2K6=6.2q2.3.3=1K7=4.1:3q2.3.2=2.7=2.3:3q2.7.9:3:3q2.^7.9:2:6.8.7:9.',
  Punch: '~~9.1.7:7.9.1.2:1E5:6.9.3:4E2:6.9.4:1E2A2E6.^9.5:4E6.9.1.4:1E3=6.9.1.4:3E1.4=2.9.1.1=5:1.6=1.9.7=1K6=1.8.2=2K4=1K1=3.2=1.8.3=2K3=1K7.8.4=2K2=1K7.8.6=1K1=8.9.5=1K1=8.9.8:7.9.9:6.9.4:1.4:6.^9.4q1.4q6.9.4q1.5q5.9.5q9.1.',
  Lift: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
}],
  ['EL SANTO', {
  Walk: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
  Jump: '~~~~~8.7:9.8.2:1E5:8.7.3:4E2:8.7.4:1E2A2E8.^7.5:4E8.8.4:1E3=8.8.4:3E9.5.4=5:9.1.4.9=1=9.1.^3.4=1K6=9.1.3.3=2K6=6.2q2.3.3=1K7=4.1:3q2.3.2=2.7=2.3:3q2.7.9:3:3q2.^7.9:2:6.8.7:9.',
  Punch: '~~9.1.7:7.9.1.2:1E5:6.9.3:4E2:6.9.4:1E2A2E6.^9.5:4E6.9.1.4:1E3=6.9.1.4:3E1.4=2.9.1.1=5:1.6=1.9.7=1K6=1.8.2=2K4=1K1=3.2=1.8.3=2K3=1K7.8.4=2K2=1K7.8.6=1K1=8.9.5=1K1=8.9.8:7.9.9:6.9.4:1.4:6.^9.4q1.4q6.9.4q1.5q5.9.5q9.1.',
  Lift: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
}],
  ['EL MÍSTICO', {
  Walk: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
  Jump: '~~~~~8.7:9.8.2:1E5:8.7.3:4E2:8.7.4:1E2A2E8.^7.5:4E8.8.4:1E3=8.8.4:3E9.5.4=5:9.1.4.9=1=9.1.^3.4=1K6=9.1.3.3=2K6=6.2q2.3.3=1K7=4.1:3q2.3.2=2.7=2.3:3q2.7.9:3:3q2.^7.9:2:6.8.7:9.',
  Punch: '~~9.1.7:7.9.1.2:1E5:6.9.3:4E2:6.9.4:1E2A2E6.^9.5:4E6.9.1.4:1E3=6.9.1.4:3E1.4=2.9.1.1=5:1.6=1.9.7=1K6=1.8.2=2K4=1K1=3.2=1.8.3=2K3=1K7.8.4=2K2=1K7.8.6=1K1=8.9.5=1K1=8.9.8:7.9.9:6.9.4:1.4:6.^9.4q1.4q6.9.4q1.5q5.9.5q9.1.',
  Lift: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
}],
  ['CHARRO', {
  Walk: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
  Jump: '~~~~~8.7:9.8.2:1E5:8.7.3:4E2:8.7.4:1E2A2E8.^7.5:4E8.8.4:1E3=8.8.4:3E9.5.4=5:9.1.4.9=1=9.1.^3.4=1K6=9.1.3.3=2K6=6.2q2.3.3=1K7=4.1:3q2.3.2=2.7=2.3:3q2.7.9:3:3q2.^7.9:2:6.8.7:9.',
  Punch: '~~9.1.7:7.9.1.2:1E5:6.9.3:4E2:6.9.4:1E2A2E6.^9.5:4E6.9.1.4:1E3=6.9.1.4:3E1.4=2.9.1.1=5:1.6=1.9.7=1K6=1.8.2=2K4=1K1=3.2=1.8.3=2K3=1K7.8.4=2K2=1K7.8.6=1K1=8.9.5=1K1=8.9.8:7.9.9:6.9.4:1.4:6.^9.4q1.4q6.9.4q1.5q5.9.5q9.1.',
  Lift: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
}],
  ['Platanus', {
  Walk: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
  Jump: '~~~~~8.7:9.8.2:1E5:8.7.3:4E2:8.7.4:1E2A2E8.^7.5:4E8.8.4:1E3=8.8.4:3E9.5.4=5:9.1.4.9=1=9.1.^3.4=1K6=9.1.3.3=2K6=6.2q2.3.3=1K7=4.1:3q2.3.2=2.7=2.3:3q2.7.9:3:3q2.^7.9:2:6.8.7:9.',
  Punch: '~~9.1.7:7.9.1.2:1E5:6.9.3:4E2:6.9.4:1E2A2E6.^9.5:4E6.9.1.4:1E3=6.9.1.4:3E1.4=2.9.1.1=5:1.6=1.9.7=1K6=1.8.2=2K4=1K1=3.2=1.8.3=2K3=1K7.8.4=2K2=1K7.8.6=1K1=8.9.5=1K1=8.9.8:7.9.9:6.9.4:1.4:6.^9.4q1.4q6.9.4q1.5q5.9.5q9.1.',
  Lift: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
}],
  ['La Parka', {
  Walk: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
  Jump: '~~~~~8.7:9.8.2:1E5:8.7.3:4E2:8.7.4:1E2A2E8.^7.5:4E8.8.4:1E3=8.8.4:3E9.5.4=5:9.1.4.9=1=9.1.^3.4=1K6=9.1.3.3=2K6=6.2q2.3.3=1K7=4.1:3q2.3.2=2.7=2.3:3q2.7.9:3:3q2.^7.9:2:6.8.7:9.',
  Punch: '~~9.1.7:7.9.1.2:1E5:6.9.3:4E2:6.9.4:1E2A2E6.^9.5:4E6.9.1.4:1E3=6.9.1.4:3E1.4=2.9.1.1=5:1.6=1.9.7=1K6=1.8.2=2K4=1K1=3.2=1.8.3=2K3=1K7.8.4=2K2=1K7.8.6=1K1=8.9.5=1K1=8.9.8:7.9.9:6.9.4:1.4:6.^9.4q1.4q6.9.4q1.5q5.9.5q9.1.',
  Lift: '~9.7:8.9.2:1E5:7.8.3:4E2:7.8.4:1E2A2E7.^8.5:4E7.9.4:1E3=7.9.4:3E8.9.1.5:9.9.1.5=9.8.4=>7.3=1K5=8.7.3=2K4=1K7.7.4=2K3=1K1=6.7.6=1K2=1K1=6.8.5=1K2=8.8.4:>8.9:7.8.4:1.4:7.^8.4q1.4q7.8.4q1.5q6.8.5q9.2.',
}]
];

const C_SPR = parseSprite('5.1J4.4.3J3.3.1?1J1?1J1?2.2.7J1.3.5,2.3.1,1A1,1A1,2.3.5,2.4.1X1,1X3.3.5X2.2.7Y1.', 10);
const ANGEL_SPRITE = parseSprite('2.3<9.6.2.1<1.2<9.5.2.1<3?9.5.3.1<9.7.3.2<4.2?8.1?1?3.1<3.1?2<1?4.4?1<2?1.2<2.1?2<1?2.5?1<1.1<2?1.1<3.3<2.1?2<2}1.1.2<2?1}2<2.1<2.2?1<2}2.2.2<1?1}5<1.1}1?4<2.2.2<2?1}6<1}3<1?2.3.1<1?3}1<2?2<1}1<2?3.4.3?1}5?1}1<5.5.2?3}3<1}6.7.2}3<1}3<4.7.1}4<3.3<2.7.1<2}2<8.6.2}5<7.5.2}1?5<7.5.1}1?1}5<7.5.1?2}3<2}1<6.4.2?1}5<1}1<6.5.1?1}4<1?1<1}6.6.1}4<1?2}6.7.1?3<1?1<7.7.1?3<1.2<6.7.1?1<3K2<6.7.1K1<4K2<5.7.1{2K3{7.7.3{>^6.1K2{1,>^6.1K1{2,>^5.1K2{2,>^^5.1K1{3,>5.1K2{3,3{1K5.7.2{1,>^^^^^^^^^^^7.2{1,3{7.7.1{2,>', 20);
const CROWD_SPRITES = [
  { idle: C_SPR, cheer: C_SPR },
  { idle: C_SPR, cheer: C_SPR },
  { idle: C_SPR, cheer: C_SPR }
];

const SPRITES = CH.map(c => {
  const s = {};
  for (const [frame, data] of Object.entries(c[1])) {
    s[frame] = data ? parseSprite(data, 24) : null;
  }
  return s;
});
// =============================================================================

const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'],
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'],
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};

const KEY_TO_ARCADE = {};
for (const [code, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) {
    KEY_TO_ARCADE[key.length === 1 ? key.toLowerCase() : key] = code;
  }
}

const held = Object.create(null);
const pressed = Object.create(null);

window.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const code = KEY_TO_ARCADE[key];
  if (!code) return;
  if (!held[code]) pressed[code] = true;
  held[code] = true;
});

window.addEventListener('keyup', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const code = KEY_TO_ARCADE[key];
  if (!code) return;
  held[code] = false;
});

function isHeld(code) { return held[code] === true; }
function isPressed(code) {
  if (pressed[code]) { pressed[code] = false; return true; }
  return false;
}

function clearPressed() { for (const k in pressed) pressed[k] = false; }

// Audio
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function snd(type) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  switch (type) {
    case 'punch':
      osc.type = 'square'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05); break;
    case 'slam':
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15); break;
    case 'rope':
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1); break;
    case 'jump':
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2); break;
    case 'count':
      osc.type = 'square'; osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05); break;
    case 'bell':
      osc.type = 'sine'; osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5); break;
    case 'select':
      osc.type = 'square'; osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      osc.start(now); osc.stop(now + 0.03); break;
  }
}

// Storage
function getStorage() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(key) {
      try { const raw = window.localStorage.getItem(key); return raw === null ? { found: false, value: null } : { found: true, value: JSON.parse(raw) }; }
      catch { return { found: false, value: null }; }
    },
    async set(key, value) { window.localStorage.setItem(key, JSON.stringify(value)); },
  };
}
async function loadData(key) { return getStorage().get(key); }
async function saveData(key, value) { return getStorage().set(key, value); }

// Constants
const RING = { x: 100, y: 120, w: 600, h: 360, matH: 320, ropeY: 40, ropeH: 8, turnW: 20, turnH: 40 };
const P = {
  size: 40, walkSpd: 3.5, jumpGrav: 0.8, jumpForce: 12, jumpMax: 20,
  chargeTime: 2000, punchDmg: 5, tackleDmg: 15, slamDmg: 20, throwDmg: 20, topRopeDmg: 40,
  punchKb: 20, tackleKb: 40, comboTime: 2000, comboCount: 3, downTime: 2000, maxHealth: 100,
};

const ST = {
  IDLE: 'idle', WALK: 'walk', RUN: 'run', JUMP: 'jump',
  PUNCH: 'punch', HIT: 'hit', DOWN: 'down', LIFT: 'lift', CARRY: 'carry', KO: 'ko', FLY: 'fly',
  SUPLEX_A: 'suplex_a', SUPLEX_R: 'suplex_r'
};

const AI = [
  { punchChance: 0.08, tackleChance: 0.05, jumpChance: 0.01, runChance: 0.3 },
  { punchChance: 0.04, tackleChance: 0.02, jumpChance: 0.02, runChance: 0.1 },
  { punchChance: 0.03, tackleChance: 0.02, jumpChance: 0.06, runChance: 0.2 },
];

// Helpers
function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
function particles(s, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const p = s.add.rectangle(x, y, 4, 4, color, 1);
    const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const d = Phaser.Math.Between(10, 30);
    s.tweens.add({ targets: p, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, alpha: 0, duration: 200, onComplete: () => p.destroy() });
  }
}
function shake(s, intensity, duration) { s.cameras.main.shake(duration * 1000, intensity); }
function damage(s, p, amt, kb) {
  if (p.invuln > 0) return;
  p.health -= amt; if (p.health < 0) p.health = 0;
  p.vx += kb;
  particles(s, p.x, p.y, 0xffffff, 4);
  if (amt >= 15) shake(s, amt / 2000, amt / 100);
}

// ============================================
// SCENES
// ============================================

class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }
  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a2e, 1);

    // Mexico City Skyline
    const gfx = this.add.graphics();
    gfx.fillStyle(0x0d0718, 1);
    gfx.fillRect(0, H - 200, 100, 200);
    gfx.fillRect(100, H - 280, 80, 280);
    gfx.fillRect(180, H - 150, 60, 150);
    gfx.fillRect(240, H - 320, 70, 320);
    gfx.fillRect(W - 80, H - 180, 80, 180);
    gfx.fillRect(W - 190, H - 250, 110, 250);
    gfx.fillRect(W - 270, H - 120, 80, 120);
    gfx.fillRect(W - 350, H - 290, 80, 290);

    // Angel of Independence
    const angelGfx = this.add.graphics();
    angelGfx.scale = 5;
    drawSprite(angelGfx, ANGEL_SPRITE, (W / 2) / 5, (H - 250) / 5);

    // Overlay to dim background slightly behind text
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.4);

    // Titles
    const title = this.add.text(W / 2, 100, 'LUCHA DE CÓDIGO', { fontFamily: 'monospace', fontSize: '48px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, 150, 'Platanus Hack 26 — CDMX', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.05, duration: 1000, yoyo: true, repeat: -1 });

    // Mode Selection
    this.opts = [
      { label: '1 PLAYER', val: '1p' },
      { label: '2 PLAYER', val: '2p' },
    ];
    this.cursor = 0;
    this.items = [];

    for (let i = 0; i < this.opts.length; i++) {
      const y = H - 180 + i * 60;
      const bg = this.add.rectangle(W / 2, y, 300, 50, 0x1a1e05).setStrokeStyle(2, 0x3a3a0a);
      const txt = this.add.text(W / 2, y, this.opts[i].label, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
      this.items.push({ bg, txt });
    }

    this.add.text(W / 2, H - 40, 'UP/DOWN TO MOVE  START OR BTN1 TO SELECT', { fontFamily: 'monospace', fontSize: '14px', color: '#6f7a4a' }).setOrigin(0.5);
    this.updateMenu();
  }

  updateMenu() {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].bg.setFillStyle(i === this.cursor ? 0xe1ff00 : 0x1a1e05);
      this.items[i].txt.setColor(i === this.cursor ? '#000000' : '#ffffff');
    }
  }

  update() {
    const axis = (isPressed('P1_D') || isPressed('P2_D') ? 1 : 0) - (isPressed('P1_U') || isPressed('P2_U') ? 1 : 0);
    if (axis !== 0) {
      this.cursor = Phaser.Math.Wrap(this.cursor + axis, 0, this.opts.length);
      this.updateMenu();
      snd('select');
    }

    if (isPressed('P1_1') || isPressed('P2_1') || isPressed('START1') || isPressed('START2')) {
      const sel = this.opts[this.cursor].val;
      snd('select');
      this.registry.set('mode', sel);
      this.registry.set('round', 1);
      this.registry.set('scores', { p1: 0, p2: 0 });
      this.registry.set('tournament', 0);
      this.scene.start('CharSelectScene');
    }
    clearPressed();
  }
}

class CharSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharSelectScene' }); }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1);
    this.add.text(W / 2, 40, 'SELECT FIGHTER', { fontFamily: 'monospace', fontSize: '28px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);

    this.mode = this.registry.get('mode') || '1p';
    this.charCount = CH.length; // Number of characters
    this.transitioning = false;
    this.lastMoveT = [0, 0];
    this.lastBtnT = [0, 0];

    // Player selections
    this.sel = [
      { cursor: 0, confirmed: false },
      { cursor: this.charCount - 1, confirmed: false }
    ];

    // Graphics layers
    this.gridGfx = this.add.graphics();
    this.pvwGfx = [this.add.graphics(), this.add.graphics()];

    // Text objects
    this.p1Label = this.add.text(115, 80, 'P1', { fontFamily: 'monospace', fontSize: '20px', color: '#4488ff', fontStyle: 'bold' }).setOrigin(0.5);
    this.p2Label = this.add.text(W - 115, 80, this.mode === '2p' ? 'P2' : 'CPU', { fontFamily: 'monospace', fontSize: '20px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
    this.p1Name = this.add.text(115, 360, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.p2Name = this.add.text(W - 115, 360, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.p1Ready = this.add.text(115, 390, '✓ READY', { fontFamily: 'monospace', fontSize: '16px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);
    this.p2Ready = this.add.text(W - 115, 390, '✓ READY', { fontFamily: 'monospace', fontSize: '16px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);

    this.hintTxt = this.add.text(W / 2, H - 30, 'JOYSTICK TO MOVE · BTN1 OR START TO SELECT', { fontFamily: 'monospace', fontSize: '12px', color: '#6f7a4a' }).setOrigin(0.5);

    // Generate preview textures for each character
    const tg = this.add.graphics();
    for (let i = 0; i < this.charCount; i++) {
      const spr = SPRITES[i]?.Walk;
      if (spr) {
        tg.clear();
        drawSprite(tg, spr, 12, 12);
        tg.generateTexture('charPvw_' + i, 24, 24);
      }
    }
    tg.destroy();
  }

  update(t) {
    if (this.transitioning) return;

    // P1 input
    this.handlePlayerInput(0, t, 'P1_U', 'P1_D', 'P1_L', 'P1_R', 'P1_1', 'START1');

    // P2 input (only in 2p mode)
    if (this.mode === '2p') {
      this.handlePlayerInput(1, t, 'P2_U', 'P2_D', 'P2_L', 'P2_R', 'P2_1', 'START2');
    }

    // Check if all confirmed
    const p1Done = this.sel[0].confirmed;
    const p2Done = this.sel[1].confirmed;

    // AI roulette logic in 1P mode
    if (this.mode === '1p' && p1Done && !p2Done && !this.aiPicking) {
      this.aiPicking = true;
      let ticks = 0;
      this.time.addEvent({
        delay: 80,
        repeat: 12,
        callback: () => {
          ticks++;
          if (ticks <= 12) {
            this.sel[1].cursor = Phaser.Math.Between(0, this.charCount - 1);
            snd('select');
          } else {
            const others = [];
            for (let i = 0; i < this.charCount; i++) if (i !== this.sel[0].cursor) others.push(i);
            this.sel[1].cursor = others[Phaser.Math.Between(0, others.length - 1)];
            this.sel[1].confirmed = true;
            snd('bell');
            this.time.delayedCall(1000, () => {
              this.registry.set('p1Char', this.sel[0].cursor);
              this.registry.set('p2Char', this.sel[1].cursor);
              this.scene.start('PlayScene');
            });
          }
        }
      });
    }

    // Normal 2P start
    if (this.mode === '2p' && p1Done && p2Done && !this.transitioning) {
      this.transitioning = true;
      snd('bell');
      this.time.delayedCall(800, () => {
        this.registry.set('p1Char', this.sel[0].cursor);
        this.registry.set('p2Char', this.sel[1].cursor);
        this.scene.start('PlayScene');
      });
    }

    this.renderUI();
    clearPressed();
  }

  handlePlayerInput(pIdx, t, upK, downK, leftK, rightK, btnK, btnK2) {
    const s = this.sel[pIdx];
    if (s.confirmed) return;

    // Movement with debounce
    if (t - this.lastMoveT[pIdx] >= 180) {
      let moved = false;
      const cols = Math.min(3, this.charCount);
      const rows = Math.ceil(this.charCount / cols);
      const cCol = s.cursor % cols;
      const cRow = Math.floor(s.cursor / cols);

      if (isPressed(leftK) && cCol > 0) { s.cursor--; moved = true; }
      else if (isPressed(rightK) && cCol < cols - 1 && s.cursor < this.charCount - 1) { s.cursor++; moved = true; }
      else if (isPressed(upK) && cRow > 0) { s.cursor -= cols; moved = true; }
      else if (isPressed(downK) && cRow < rows - 1) {
        if (s.cursor + cols < this.charCount) s.cursor += cols;
        else s.cursor = this.charCount - 1;
        moved = true;
      }
      if (moved) { this.lastMoveT[pIdx] = t; snd('select'); }
    }

    // Confirm
    if ((isPressed(btnK) || (btnK2 && isPressed(btnK2))) && t - this.lastBtnT[pIdx] >= 250) {
      s.confirmed = true;
      this.lastBtnT[pIdx] = t;
      snd('select');
    }
  }

  renderUI() {
    this.gridGfx.clear();
    this.pvwGfx[0].clear();
    this.pvwGfx[1].clear();

    const slotW = 100, slotH = 120, gap = 16;
    const cols = Math.min(3, this.charCount);
    const rows = Math.ceil(this.charCount / cols);
    const totalW = cols * (slotW + gap) - gap;
    const totalH = rows * (slotH + gap) - gap;
    const startX = (W - totalW) / 2;
    const startY = (H - totalH) / 2 + 20;

    for (let i = 0; i < this.charCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (slotW + gap);
      const y = startY + row * (slotH + gap);

      const p1H = this.sel[0].cursor === i;
      const p2H = this.sel[1].cursor === i && (this.mode === '2p' || this.aiPicking || this.sel[1].confirmed);

      // Slot background
      this.gridGfx.fillStyle(0x1a1a2e, 1);
      this.gridGfx.fillRect(x, y, slotW, slotH);

      // Border highlight
      if (p1H && p2H) {
        this.gridGfx.lineStyle(3, 0x4488ff, 1);
        this.gridGfx.strokeRect(x, y, slotW, slotH);
        this.gridGfx.lineStyle(3, 0xff4444, 1);
        this.gridGfx.strokeRect(x + 4, y + 4, slotW - 8, slotH - 8);
      } else if (p1H) {
        this.gridGfx.lineStyle(3, 0x4488ff, 1);
        this.gridGfx.strokeRect(x, y, slotW, slotH);
      } else if (p2H) {
        this.gridGfx.lineStyle(3, 0xff4444, 1);
        this.gridGfx.strokeRect(x, y, slotW, slotH);
      } else {
        this.gridGfx.lineStyle(1, 0x333333, 1);
        this.gridGfx.strokeRect(x, y, slotW, slotH);
      }

      // Draw character preview sprite in slot (scaled)
      const spr = SPRITES[i]?.Walk;
      if (spr) {
        const sc = 5;
        const sh = spr.length, sw = spr[0]?.length || 0;
        const sox = x + (slotW - sw * sc) / 2, soy = y + (slotH - sh * sc) / 2;
        for (let r = 0; r < sh; r++) {
          for (let c = 0; c < (spr[r]?.length || 0); c++) {
            const col = COLOR_MAP[spr[r][c]];
            if (col != null) {
              this.gridGfx.fillStyle(col, 1);
              this.gridGfx.fillRect(sox + c * sc, soy + r * sc, sc, sc);
            }
          }
        }
      }

      // Character name below slot
      // (We reuse text objects sparingly - draw name via graphics text)
    }

    // Update preview names
    const k1 = this.sel[0].cursor;
    const k2 = this.sel[1].cursor;
    this.p1Name.setText(CH[k1][0]);
    this.p2Name.setText((this.mode === '2p' || this.sel[1].confirmed) ? CH[k2][0] : '???');
    this.p1Ready.setVisible(this.sel[0].confirmed);
    this.p2Ready.setVisible(this.sel[1].confirmed);

    // Draw large previews on sides
    this.drawPreview(0, 115, 220);
    if (this.mode === '2p' || this.aiPicking || this.sel[1].confirmed) this.drawPreview(1, W - 115, 220);
  }

  drawPreview(pIdx, cx, cy) {
    const g = this.pvwGfx[pIdx];
    const key = this.sel[pIdx].cursor;
    const spr = SPRITES[key]?.Walk;
    if (!spr) return;

    // Draw scaled sprite (each pixel = 6px)
    const scale = 9;
    const h = spr.length, w = spr[0]?.length || 0;
    const ox = cx - (w * scale) / 2, oy = cy - (h * scale) / 2;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < (spr[r]?.length || 0); c++) {
        const col = COLOR_MAP[spr[r][c]];
        if (col != null) {
          g.fillStyle(col, 1);
          g.fillRect(ox + c * scale, oy + r * scale, scale, scale);
        }
      }
    }
  }
}

class PlayScene extends Phaser.Scene {
  constructor() { super({ key: 'PlayScene' }); }

  create() {
    this.cameras.main.setBackgroundColor('#1a1e05');

    // Create ring
    this.createRing();
    const G = this.ring.geometry;

    const p1Char = this.registry.get('p1Char') || 0;
    const p2Char = this.registry.get('p2Char') || 1;

    // Create players in opposite corners
    this.p1 = this.createPlayer(1, p1Char, G.backLX + 30, G.backY + 30, C.p1);
    this.p2 = this.createPlayer(2, p2Char, G.frontRX - 120, G.frontY - 120, C.p2);

    // Create HUD
    this.createHUD();

    // Game state
    this.mode = this.registry.get('mode') || '1p';
    this.round = this.registry.get('round') || 1;
    this.scores = this.registry.get('scores') || { p1: 0, p2: 0 };
    this.timer = 60;
    this.lastTime = this.time.now;
    this.tournament = this.registry.get('tournament') || 0;

    // Reset round
    this.resetRound();

    // Show FIGHT!
    this.showFightText();
    snd('bell');
  }

  createRing() {
    this.ring = {};
    this.ring.g = this.add.graphics();       // back layer (behind players)
    this.ring.fg = this.add.graphics();      // front layer (over players)
    this.ring.fg.setDepth(1000);

    // Centralized geometry: all coordinates derived from these 4 corners
    const G = {
      backY: 180,
      frontY: 480,
      backLX: 120,
      backRX: 680,
      frontLX: -55,
      frontRX: 855,
    };
    G.height = G.frontY - G.backY;
    G.backW = G.backRX - G.backLX;
    G.frontW = G.frontRX - G.frontLX;
    G.centerX = (G.backLX + G.backRX + G.frontLX + G.frontRX) / 4;
    G.centerY = (G.backY + G.frontY) / 2;

    // Rope levels: wide separation so lateral ropes are clearly distinct
    G.ropeLevels = [
      { backOff: 16, frontOff: 18, color: C.rope1 },   // bottom (red)
      { backOff: 38, frontOff: 40, color: C.rope2 },   // middle (white)
      { backOff: 62, frontOff: 64, color: C.rope3 },   // top (blue)
    ];
    G.topRopeY = G.backY - 66;  // just above top back rope
    G.apronH = 60;
    G.apronBottom = G.frontY + G.apronH;

    // Store geometry
    this.ring.geometry = G;

    // Crowd textures
    const tg = this.add.graphics();
    for (let i = 0; i < CROWD_SPRITES.length; i++) {
      tg.clear(); drawSprite(tg, CROWD_SPRITES[i].idle, 5, 5); tg.generateTexture('crowd' + i + '_idle', 10, 10);
      tg.clear(); drawSprite(tg, CROWD_SPRITES[i].cheer, 5, 5); tg.generateTexture('crowd' + i + '_cheer', 10, 10);
    }
    tg.destroy();

    // Crowd (above top rope)
    this.ring.crowd = [];
    const crowdRows = 4;
    const crowdCols = 32;
    const startX = G.frontLX - 100;
    const endX = G.frontRX + 100;
    const spacingX = (endX - startX) / (crowdCols - 1);
    const startY = 15;
    const endY = G.topRopeY - 20;
    const spacingY = (endY - startY) / (crowdRows - 1);

    for (let r = 0; r < crowdRows; r++) {
      for (let c = 0; c < crowdCols; c++) {
        const type = Phaser.Math.Between(0, 2);
        // Add slight random offset to break up the perfect grid
        const ox = Phaser.Math.Between(-10, 10);
        const oy = Phaser.Math.Between(-5, 5);
        const sp = this.add.image(startX + c * spacingX + ox, startY + r * spacingY + oy, 'crowd' + type + '_idle');
        sp.setScale(3);
        sp.setDepth(sp.y - 500); // Behind the ring
        sp.crowdType = type;
        sp.baseY = sp.y;
        sp.phase = Math.random() * Math.PI * 2;
        this.ring.crowd.push(sp);
      }
    }

    // Rope spring system: each side has local bend at contact point
    this.ring.ropes = {
      back: { amount: 0, target: 0, contactX: 0, k: 8, maxBend: 25, decay: 0.92, pushVel: 0, soundTimer: 0 },
      front: { amount: 0, target: 0, contactX: 0, k: 8, maxBend: 25, decay: 0.92, pushVel: 0, soundTimer: 0 },
      left: { amount: 0, target: 0, contactY: 0, k: 8, maxBend: 25, decay: 0.92, pushVel: 0, soundTimer: 0 },
      right: { amount: 0, target: 0, contactY: 0, k: 8, maxBend: 25, decay: 0.92, pushVel: 0, soundTimer: 0 },
    };



    // Referee removed
  }

  drawRing() {
    const g = this.ring.g;
    const fg = this.ring.fg;
    g.clear();
    fg.clear();

    const G = this.ring.geometry;

    // Crowd animation
    const isCheering = (this.p1.state === ST.DOWN || this.p1.state === ST.KO || 
                        this.p2.state === ST.DOWN || this.p2.state === ST.KO || this.timer <= 0);

    for (const sp of this.ring.crowd) {
      if (isCheering) {
        sp.setTexture('crowd' + sp.crowdType + '_cheer');
        sp.y = sp.baseY - Math.abs(Math.sin(this.time.now * 0.015 + sp.phase)) * 8;
      } else {
        sp.setTexture('crowd' + sp.crowdType + '_idle');
        sp.y = sp.baseY;
      }
    }

    // Apron (front face below mat) — on front layer so it covers player feet
    fg.fillStyle(0x4a0000, 1);
    fg.beginPath();
    fg.moveTo(G.frontLX, G.frontY);
    fg.lineTo(G.frontRX, G.frontY);
    fg.lineTo(G.frontRX, G.apronBottom);
    fg.lineTo(G.frontLX, G.apronBottom);
    fg.closePath();
    fg.fillPath();

    // Apron stripes
    for (let i = 0; i < 3; i++) {
      const y = G.frontY + 10 + i * 15;
      fg.fillStyle(0xffcc00, 0.6);
      fg.fillRect(G.frontLX, y, G.frontW, 4);
    }

    // Mat (trapezoid) and border
    g.beginPath();
    g.moveTo(G.backLX, G.backY);
    g.lineTo(G.backRX, G.backY);
    g.lineTo(G.frontRX, G.frontY);
    g.lineTo(G.frontLX, G.frontY);
    g.closePath();
    g.fillStyle(C.mat, 1);
    g.fillPath();
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokePath();

    // Draw ropes — back/left/right on g (behind players), front on fg (over players)
    for (let i = 0; i < G.ropeLevels.length; i++) {
      const level = G.ropeLevels[i];
      const bY = G.backY - level.backOff;
      const fY = G.frontY - level.frontOff;

      // Back rope — on back layer
      g.lineStyle(3, level.color, 1);
      const rBack = this.ring.ropes.back;
      g.beginPath();
      g.moveTo(G.backLX, bY);
      if (rBack.amount > 0.5) {
        const t = Phaser.Math.Clamp((rBack.contactX - G.backLX) / G.backW, 0.1, 0.9);
        const cpX = G.backLX + t * G.backW;
        g.lineTo(cpX - 15, bY - rBack.amount);
        g.lineTo(cpX + 15, bY - rBack.amount);
      }
      g.lineTo(G.backRX, bY);
      g.strokePath();

      // Front rope — on FRONT layer (over players)
      fg.lineStyle(3, level.color, 1);
      const rFront = this.ring.ropes.front;
      fg.beginPath();
      fg.moveTo(G.frontLX, fY);
      if (rFront.amount > 0.5) {
        const t = Phaser.Math.Clamp((rFront.contactX - G.frontLX) / G.frontW, 0.1, 0.9);
        const cpX = G.frontLX + t * G.frontW;
        fg.lineTo(cpX - 25, fY + rFront.amount);
        fg.lineTo(cpX + 25, fY + rFront.amount);
      }
      fg.lineTo(G.frontRX, fY);
      fg.strokePath();

      // Left rope — on back layer
      g.lineStyle(3, level.color, 1);
      const rLeft = this.ring.ropes.left;
      g.beginPath();
      g.moveTo(G.backLX, bY);
      if (rLeft.amount > 0.5) {
        // Shift contactY down by 20px so the peak aligns with the player's visual body, not just their feet
        const t = Phaser.Math.Clamp((rLeft.contactY + 40 - G.backY) / G.height, 0.1, 0.9);
        const rX = G.backLX + (G.frontLX - G.backLX) * t;
        const rY = bY + (fY - bY) * t;
        // Calculate offset for the V-dent width along the rope
        const dt = 15 / G.height;
        const dx = (G.frontLX - G.backLX) * dt;
        const dy = (fY - bY) * dt;
        g.lineTo(rX - dx - rLeft.amount, rY - dy);
        g.lineTo(rX + dx - rLeft.amount, rY + dy);
      }
      g.lineTo(G.frontLX, fY);
      g.strokePath();

      // Right rope — on back layer
      g.lineStyle(3, level.color, 1);
      const rRight = this.ring.ropes.right;
      g.beginPath();
      g.moveTo(G.backRX, bY);
      if (rRight.amount > 0.5) {
        // Shift contactY down by 20px so the peak aligns with the player's visual body
        const t = Phaser.Math.Clamp((rRight.contactY + 40 - G.backY) / G.height, 0.1, 0.9);
        const rX = G.backRX + (G.frontRX - G.backRX) * t;
        const rY = bY + (fY - bY) * t;
        // Calculate offset for the V-dent width along the rope
        const dt = 15 / G.height;
        const dx = (G.frontRX - G.backRX) * dt;
        const dy = (fY - bY) * dt;
        g.lineTo(rX - dx + rRight.amount, rY - dy);
        g.lineTo(rX + dx + rRight.amount, rY + dy);
      }
      g.lineTo(G.frontRX, fY);
      g.strokePath();
    }

  }

  createPlayer(num, charName, x, y, color) {
    const p = {
      num, charName, x, y, vx: 0, vy: 0, facing: num === 1 ? 1 : -1,
      state: ST.IDLE, health: P.maxHealth, color,
      charge: 0, charging: false, combo: 0, comboTimer: 0,
      downTimer: 0, carry: null, carriedBy: null,
      hitTimer: 0, invuln: 0,
      shadowVX: 0, shadowVY: 0,
      sprites: SPRITES[charName],
    };

    p.body = this.add.graphics();
    // Keep p.bodyInner reference null since we don't need a separate inner rectangle anymore
    p.bodyInner = null;

    p.shad = this.add.ellipse(x, y, P.size, P.size / 2, C.shadow, 0.5);
    p.shad.setVisible(false);

    p.chargeBarBg = this.add.rectangle(x, y - P.size / 2 - 25, P.size, 6, 0x000000);
    p.chargeBarBg.setStrokeStyle(2, 0xffffff, 0.5);
    p.chargeBar = this.add.rectangle(x - P.size / 2, y - P.size / 2 - 25, 0, 4, 0xffff00);
    p.chargeBar.setOrigin(0, 0.5);
    p.chargeBar.setVisible(false);
    p.chargeBarBg.setVisible(false);

    p.comboTxt = this.add.text(x, y, '', { fontFamily: 'monospace', fontSize: '14px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);
    p.comboTxt.setVisible(false);

    p.debugState = this.add.text(x, y + P.size / 2 + 5, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', backgroundColor: '#000000' }).setOrigin(0.5);

    return p;
  }

  createHUD() {
    this.hud = {};
    this.hud.timer = this.add.text(W / 2, 20, '60', { fontFamily: 'monospace', fontSize: '32px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    this.hud.round = this.add.text(W / 2, 50, 'ROUND 1', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0);

    this.hud.hp1Bg = this.add.rectangle(120, 30, 200, 24, 0x000000).setScrollFactor(0);
    this.hud.hp1Bg.setStrokeStyle(2, 0xffffff);
    this.hud.hp1 = this.add.rectangle(20, 30, 200, 20, C.bar).setScrollFactor(0);
    this.hud.hp1.setOrigin(0, 0.5);
    this.hud.p1Name = this.add.text(20, 50, 'P1', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(0, 0.5).setScrollFactor(0);

    this.hud.hp2Bg = this.add.rectangle(W - 120, 30, 200, 24, 0x000000).setScrollFactor(0);
    this.hud.hp2Bg.setStrokeStyle(2, 0xffffff);
    this.hud.hp2 = this.add.rectangle(W - 220, 30, 200, 20, C.bar).setScrollFactor(0);
    this.hud.hp2.setOrigin(0, 0.5);
    this.hud.p2Name = this.add.text(W - 20, 50, 'P2', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0.5).setScrollFactor(0);
  }

  resetRound() {
    const G = this.ring.geometry;

    this.p1.x = G.backLX + 30; this.p1.y = G.backY + 30;
    this.p1.vx = 0; this.p1.vy = 0; this.p1.state = ST.IDLE; this.p1.health = P.maxHealth;
    this.p1.charge = 0; this.p1.charging = false; this.p1.combo = 0; this.p1.comboTimer = 0;
    this.p1.downTimer = 0; this.p1.carry = null; this.p1.carriedBy = null;
    this.p1.hitTimer = 0; this.p1.invuln = 0;
    this.p1.facing = 1;
    this.p1.body.setAngle(0); this.p1.body.setAlpha(1);

    this.p2.x = G.frontRX - 120; this.p2.y = G.frontY - 120;
    this.p2.vx = 0; this.p2.vy = 0; this.p2.state = ST.IDLE; this.p2.health = P.maxHealth;
    this.p2.charge = 0; this.p2.charging = false; this.p2.combo = 0; this.p2.comboTimer = 0;
    this.p2.downTimer = 0; this.p2.carry = null; this.p2.carriedBy = null;
    this.p2.hitTimer = 0; this.p2.invuln = 0;
    this.p2.facing = -1;
    this.p2.body.setAngle(0); this.p2.body.setAlpha(1);

    this.timer = 60; this.lastTime = this.time.now;
    // Reset rope deformations
    for (const side in this.ring.ropes) {
      const r = this.ring.ropes[side];
      r.amount = 0; r.target = 0; r.soundTimer = 0;
    }
    this.updatePlayerVisuals(this.p1); this.updatePlayerVisuals(this.p2);
    this.updateHUD();

    // Reset camera to center of ring
    this.cameras.main.scrollX = G.centerX - W / 2;
  }

  showFightText() {
    const txt = this.add.text(W / 2, H / 2, 'FIGHT!', { fontFamily: 'monospace', fontSize: '64px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    this.tweens.add({ targets: txt, scale: 1.5, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
  }

  updatePlayerVisuals(p) {
    // For carried players, position is based on carrier
    let drawX = p.x, drawY = p.y;
    if (p.state === ST.CARRY && p.carriedBy) {
      drawX = p.carriedBy.x;
      drawY = p.carriedBy.y - P.size * 0.5;
    }

    if (p.state === ST.HIT) {
      drawX += (Math.random() - 0.5) * 10;
      drawY += (Math.random() - 0.5) * 10;
    }

    p.body.setPosition(drawX, drawY);

    // Determine sprite frame based on state
    let frame = 'Walk';
    if (p.state === ST.JUMP || p.state === ST.FLY) frame = 'Jump';
    else if (p.state === ST.PUNCH) frame = 'Punch';
    else if (p.state === ST.DOWN || p.state === ST.CARRY || p.state === ST.KO) frame = 'Walk';
    else if (p.state === ST.LIFT) frame = 'Lift';
    else if (p.state === ST.SUPLEX_A) frame = 'Walk';
    else if (p.state === ST.SUPLEX_R) frame = 'Jump';

    p.body.clear();
    if (p.sprites && p.sprites[frame] && p.sprites[frame].length > 0) {
      // Draw sprite. Because drawSprite iterates row/col, it works best unscaled, 
      // but we apply flip by scaling the graphics object itself.
      // Scaling it up by 2 makes 24x24 become 48x48 (which fits the arcade style nicely)
      drawSprite(p.body, p.sprites[frame], 0, 0);
    } else {
      // Fallback: draw rectangles manually onto the graphics object
      let fillC = p.color;
      let alphaMultiplier = 1;
      
      // Damage blink
      if (p.state === ST.HIT) {
        alphaMultiplier = 0.7 + Math.sin(this.time.now * 0.02) * 0.3;
      }
      // KO grayed out
      if (p.state === ST.KO) fillC = 0x888888;
      
      p.body.fillStyle(fillC, 1 * alphaMultiplier);
      p.body.fillRect(-P.size / 2, -P.size / 2, P.size, P.size);
      p.body.lineStyle(3, 0xffffff, 0.8 * alphaMultiplier);
      p.body.strokeRect(-P.size / 2, -P.size / 2, P.size, P.size);
    }

    const baseDepth = (p.state === ST.JUMP || p.state === ST.FLY || p.state === ST.SUPLEX_A || p.state === ST.SUPLEX_R) ? p.shadowY : p.y;
    p.body.setDepth(baseDepth);
    p.shad.setDepth(baseDepth - 1);
    p.chargeBarBg.setDepth(baseDepth + 0.2);
    p.chargeBar.setDepth(baseDepth + 0.3);
    
    p.chargeBarBg.setPosition(drawX, drawY - P.size / 2 - 25);
    p.chargeBar.setPosition(drawX - P.size / 2, drawY - P.size / 2 - 25);
    const cw = (p.charge / P.chargeTime) * P.size;
    p.chargeBar.setSize(cw, 4);

    if (p.state === ST.JUMP || p.state === ST.FLY || p.state === ST.SUPLEX_A || p.state === ST.SUPLEX_R) {
      p.shad.setPosition(p.shadowX, p.shadowY);
      p.shad.setVisible(true);
    } else { p.shad.setVisible(false); }

    // Face the correct direction. We scale by 4 here so 24x24 sprites appear larger (96x96)
    p.body.setScale(p.facing * 4, 4);

    if (p.state === ST.DOWN || p.state === ST.CARRY || p.state === ST.KO) { p.body.setAngle(90); }
    else if (p.state === ST.SUPLEX_A) {
      p.body.setAngle(-90 * p.facing * Math.min(1, p.suplexTimer / 0.35));
    }
    else if (p.state === ST.SUPLEX_R && p.carriedBy) {
      p.body.setAngle(-180 * p.carriedBy.facing * Math.min(1, p.carriedBy.suplexTimer / 0.35));
    }
    else { p.body.setAngle(0); }

    if (p.comboTxt) {
      p.comboTxt.setDepth(baseDepth + 0.4);
      if (p.combo > 1) { p.comboTxt.setPosition(p.x, p.y - P.size / 2 - 50); p.comboTxt.setText(p.combo + ' HIT COMBO!'); p.comboTxt.setVisible(true); }
      else { p.comboTxt.setVisible(false); }
    }

    if (p.charging && p.state !== ST.JUMP) { p.chargeBar.setVisible(true); p.chargeBarBg.setVisible(true); }
    else { p.chargeBar.setVisible(false); p.chargeBarBg.setVisible(false); }

    // Debug: show current state
    if (p.debugState) {
      p.debugState.setDepth(baseDepth + 0.4);
      p.debugState.setPosition(p.x, p.y + P.size / 2 + 8);
      p.debugState.setText(p.state.toUpperCase());
    }
  }

  updateHUD() {
    this.hud.timer.setText(Math.ceil(this.timer).toString());
    this.hud.round.setText('ROUND ' + this.round);
    const w1 = (this.p1.health / P.maxHealth) * 200;
    const w2 = (this.p2.health / P.maxHealth) * 200;
    this.hud.hp1.setSize(w1, 20); this.hud.hp1.setFillStyle(this.p1.health > 30 ? C.bar : 0xff0000);
    this.hud.hp2.setSize(w2, 20); this.hud.hp2.setFillStyle(this.p2.health > 30 ? C.bar : 0xff0000);
  }

  // Trapezoid boundary helpers
  getRingBounds(y) {
    const G = this.ring.geometry;
    const t = Phaser.Math.Clamp((y - G.backY) / G.height, 0, 1);
    return {
      left: G.backLX + (G.frontLX - G.backLX) * t,
      right: G.backRX + (G.frontRX - G.backRX) * t,
    };
  }

    // Springy rope physics - applies to both ground and air players
  applyRopeSpring(p, dt, isShadow) {
    const G = this.ring.geometry;
    const px = isShadow ? p.shadowX : p.x;
    const py = isShadow ? p.shadowY : p.y;
    const bounds = this.getRingBounds(py);
    // Perspective-compensated padding: player's visual "feet" are at their bottom edge,
    // so back/sides need tight or negative padding to look like they reach the edge.
    // Bottom (front) keeps full padding since it already looks correct.
    const minX = bounds.left + 2;
    const maxX = bounds.right - 2;
    const minY = G.backY - P.size / 3;
    const maxY = G.frontY - P.size / 2;

    // Check each rope side
    const ropes = this.ring.ropes;

    // Left rope
    if (px < minX + 5) {
      const pushVel = Math.abs(isShadow ? (p.shadowVX || 0) : (p.vx || 0));
      const r = ropes.left;
      r.target = Math.max(r.target, Math.min(pushVel * 4, r.maxBend));
      r.contactY = py;
      r.pushVel = pushVel;

      // Spring force pushes back (to the right)
      const springForce = r.amount * r.k * dt;
      if (isShadow) {
        p.shadowX += springForce;
      } else {
        p.x += springForce;
      }

      r.soundTimer -= dt;
    }

    // Right rope
    if (px > maxX - 5) {
      const pushVel = Math.abs(isShadow ? (p.shadowVX || 0) : (p.vx || 0));
      const r = ropes.right;
      r.target = Math.max(r.target, Math.min(pushVel * 4, r.maxBend));
      r.contactY = py;
      r.pushVel = pushVel;

      // Spring force pushes back (to the left)
      const springForce = r.amount * r.k * dt;
      if (isShadow) {
        p.shadowX -= springForce;
      } else {
        p.x -= springForce;
      }

      r.soundTimer -= dt;
    }

    // Back rope
    if (py < minY + 5) {
      const pushVel = Math.abs(isShadow ? (p.shadowVY || 0) : (p.vy || 0));
      const r = ropes.back;
      r.target = Math.max(r.target, Math.min(pushVel * 4, r.maxBend));
      r.contactX = px;
      r.pushVel = pushVel;

      // Spring force pushes back (downward)
      const springForce = r.amount * r.k * dt;
      if (isShadow) {
        p.shadowY += springForce;
      } else {
        p.y += springForce;
      }

      r.soundTimer -= dt;
    }

    // Front rope
    if (py > maxY - 5) {
      const pushVel = Math.abs(isShadow ? (p.shadowVY || 0) : (p.vy || 0));
      const r = ropes.front;
      r.target = Math.max(r.target, Math.min(pushVel * 4, r.maxBend));
      r.contactX = px;
      r.pushVel = pushVel;

      // Spring force pushes back (upward)
      const springForce = r.amount * r.k * dt;
      if (isShadow) {
        p.shadowY -= springForce;
      } else {
        p.y -= springForce;
      }

      r.soundTimer -= dt;
    }

    // Clamp position - allow pushing past bounds by rope bend amount
    if (isShadow) {
      p.shadowX = Phaser.Math.Clamp(p.shadowX, minX - ropes.left.amount, maxX + ropes.right.amount);
      p.shadowY = Phaser.Math.Clamp(p.shadowY, minY - ropes.back.amount, maxY + ropes.front.amount);
    } else {
      p.x = Phaser.Math.Clamp(p.x, minX - ropes.left.amount, maxX + ropes.right.amount);
      p.y = Phaser.Math.Clamp(p.y, minY - ropes.back.amount, maxY + ropes.front.amount);
    }
  }

  updateRopes() {
    const ropes = this.ring.ropes;
    for (const side in ropes) {
      const r = ropes[side];
      // Smoothly approach target
      r.amount += (r.target - r.amount) * 0.3;
      // Decay when not pushing
      if (r.target === 0) {
        r.amount *= r.decay;
      }
    }

    // Draw the entire ring
    this.drawRing();
  }

  updateCrowd() {
    // Crowd is now drawn in drawRing()
  }

  // Unified physics engine for both player and AI
  // inputs: { up, down, left, right, btn1, btn2, btn3, btn4 }
  applyPhysics(p, dt, inputs, opp) {
    const s = this;
    if (p.state === ST.KO || p.carriedBy) return;

    // Lift Cooldown
    if (p.liftCooldown > 0) p.liftCooldown -= dt;

    // Down state: countdown and recover
    if (p.state === ST.DOWN) {
      p.downTimer -= dt;
      if (p.downTimer <= 0) {
        p.state = ST.IDLE;
        p.downTimer = 0;
        p.body.setAngle(0);
        if (p.bodyInner) p.bodyInner.setAngle(0);
      }
      p.x += p.vx; p.vx *= 0.9;
      p.y += p.vy; p.vy *= 0.9;
      s.applyRopeSpring(p, dt, false);
      return;
    }

    // Punch state: auto-reset after short duration. Stops player movement.
    if (p.state === ST.PUNCH) {
      p.vx = 0;
      p.vy = 0;
      p.punchTimer = (p.punchTimer || 0) + dt;
      if (p.punchTimer > 0.5) {
        p.state = ST.IDLE;
        p.punchTimer = 0;
      }
    }

    if (p.state === ST.SUPLEX_A) {
      p.vx = 0; p.vy = 0;
      p.suplexTimer += dt;
      const LIFT_TIME = 0.35;
      const progress = p.suplexTimer / LIFT_TIME;

      if (p.suplexTimer <= LIFT_TIME && p.carry) {
        // Lift & slam
        const opp = p.carry;
        const radius = P.size * 0.8;
        
        // Attacker stays mostly grounded until a small hop at the very end
        const jumpOffset = Math.pow(progress, 4) * 20;
        
        // Pivot around the feet instead of the center
        const theta = -Math.PI / 2 * p.facing * progress; // 0 to -90 degrees
        const feetR = P.size / 2;
        p.x = p.shadowX + feetR * Math.sin(theta);
        p.y = p.shadowY + feetR * (1 - Math.cos(theta)) - jumpOffset;
        
        // Position the receiver on an arc closely coordinated with the attacker's body
        // Angle goes from PI/2 (front) -> 0 (top) -> -PI/2 (behind)
        const angleRads = (Math.PI / 2) - (progress * Math.PI);
        opp.shadowX = p.shadowX + Math.sin(angleRads) * radius * p.facing;
        opp.shadowY = p.shadowY; // Opponent lands at the same Y as attacker's base
        
        // Receiver stays glued to the attacker's shifting center of mass
        opp.x = p.x + Math.sin(angleRads) * radius * p.facing;
        opp.y = p.y - Math.cos(angleRads) * radius;

      } else if (p.suplexTimer > LIFT_TIME && p.suplexTimer < LIFT_TIME + 0.1 && p.carry) {
        // Impact
        const opp = p.carry;
        p.y = p.shadowY; // Snap to ground
        opp.x = opp.shadowX;
        opp.y = opp.shadowY; // Snap to ground
        
        damage(s, opp, 25, 0);
        opp.state = ST.DOWN; 
        opp.downTimer = 2.0; 
        opp.liftCooldown = 1.5;
        opp.carriedBy = null;
        p.carry = null;
        snd('slam'); 
        particles(s, opp.x, opp.y, 0xffffff, 10);
        shake(s, 0.015, 0.15); // Extra impact
      } else if (p.suplexTimer > LIFT_TIME + 0.5) {
        // Recovery complete
        p.state = ST.IDLE;
        p.suplexTimer = 0;
      }
      return;
    }

    if (p.state === ST.HIT) {
      p.hitTimer -= dt;
      if (p.hitTimer <= 0) p.state = ST.IDLE;
      p.x += p.vx; p.vx *= 0.9;
      p.y += p.vy; p.vy *= 0.9;
      s.applyRopeSpring(p, dt, false);
      return;
    }

    if (p.state === ST.FLY) {
      const flySpd = P.walkSpd * 2.5;
      p.shadowVX = p.flyDirX * flySpd;
      p.shadowVY = p.flyDirY * flySpd;
      p.shadowX += p.shadowVX;
      p.shadowY += p.shadowVY;
      p.flyDist -= flySpd;

      const G = s.ring.geometry;
      const bounds = s.getRingBounds(p.shadowY);
      const minX = bounds.left + 5;
      const maxX = bounds.right - 5;
      const minY = G.backY - P.size / 3 + 5;
      const maxY = G.frontY - P.size / 2 - 5;

      const shadowDist = Math.sqrt((p.shadowX - opp.x) ** 2 + (p.shadowY - opp.y) ** 2);
      if (shadowDist < P.size * 1.5 && Math.abs(p.jumpHeight - P.size) < P.size) {
        p.flyDist = 0; // Drop straight down if passing over opponent
      }

      if (p.flyDist <= 0 || p.shadowX <= minX || p.shadowX >= maxX || p.shadowY <= minY || p.shadowY >= maxY) {
        p.state = ST.JUMP;
        p.isFlyingDrop = true;
        p.shadowVX = 0;
        p.shadowVY = 0;
        p.vy = 0; // Starts falling
      }

      p.x = p.shadowX;
      p.y = p.shadowY - p.jumpHeight;
      return;
    }

    if (p.state === ST.JUMP) {
      const airSpd = P.walkSpd * 0.1; // little mid-air control
      
      if (p.shadowVX === undefined) p.shadowVX = 0;
      if (p.shadowVY === undefined) p.shadowVY = 0;

      if (inputs.left) p.shadowVX -= airSpd;
      if (inputs.right) p.shadowVX += airSpd;

      p.shadowX += p.shadowVX;
      p.shadowY += p.shadowVY;

      s.applyRopeSpring(p, dt, true);

      const G = s.ring.geometry;
      const bounds = s.getRingBounds(p.shadowY);
      const minX = bounds.left + 5;
      const maxX = bounds.right - 5;
      const minY = G.backY - P.size / 3 + 5;
      const maxY = G.frontY - P.size / 2 - 5;

      let bounced = false;
      if (p.shadowX <= minX) { p.shadowX = minX; p.flyDirX = 1; p.flyDirY = 0; bounced = true; }
      else if (p.shadowX >= maxX) { p.shadowX = maxX; p.flyDirX = -1; p.flyDirY = 0; bounced = true; }
      else if (p.shadowY <= minY) { p.shadowY = minY; }
      else if (p.shadowY >= maxY) { p.shadowY = maxY; }

      if (bounced) {
        p.state = ST.FLY;
        p.flyDist = 200;
        if (p.flyDirX !== 0) p.facing = p.flyDirX;
        snd('rope');
        return;
      }

      p.vy += P.jumpGrav;
      p.jumpHeight -= p.vy;
      p.x = p.shadowX;
      p.y = p.shadowY - p.jumpHeight;

      if (p.jumpHeight <= 0) {
        p.jumpHeight = 0;
        p.y = p.shadowY;
        p.vy = 0;
        p.isFlyingDrop = false;
        p.state = ST.IDLE; snd('slam'); particles(s, p.x, p.y, 0xffffff, 6);
      }

      if ((inputs.btn1 || p.isFlyingDrop) && p.vy > 0 && p.jumpHeight < 50) {
        const shadowDist = Math.sqrt((p.shadowX - opp.x) ** 2 + (p.shadowY - opp.y) ** 2);
        if (shadowDist < P.size * 1.5) {
          damage(s, opp, P.slamDmg, p.facing * P.tackleKb);
          opp.state = ST.DOWN; opp.downTimer = P.downTime / 1000;
          p.isFlyingDrop = false;
          shake(s, 0.012, 0.15);
          snd('slam'); particles(s, opp.x, opp.y, 0xffffff, 8);
        }
      }
      return;
    }

    if (p.state === ST.LIFT) {
      // Carrying opponent - can move (slower) and throw
      let mx = 0, my = 0;
      if (inputs.up) my -= 1; if (inputs.down) my += 1;
      if (inputs.left) mx -= 1; if (inputs.right) mx += 1;
      if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }

      const carrySpd = P.walkSpd * 0.5; // Slower when carrying
      p.vx = mx * carrySpd; p.vy = my * carrySpd;
      p.x += p.vx; p.y += p.vy;

      if (mx !== 0) p.facing = mx > 0 ? 1 : -1;

      // Update carried opponent position
      if (p.carry) {
        p.carry.x = p.x;
        p.carry.y = p.y - P.size * 0.5; // On top of carrier
        p.carry.facing = p.facing;
      }

      // Throw
      if (inputs.btn1) {
        const opp = p.carry;
        if (opp) {
          const throwKb = p.facing * 15; // Just a little force
          damage(s, opp, 0, throwKb); // 0 damage
          opp.state = ST.DOWN; opp.downTimer = 1.0; opp.liftCooldown = 1.5; // Cooldown to prevent infinite lift combo
          p.state = ST.IDLE; p.carry = null; opp.carriedBy = null;
          p.combo = 0; opp.combo = 0;
          snd('slam'); particles(s, opp.x, opp.y, 0xffffff, 8);
        }
      }

      s.applyRopeSpring(p, dt, false);
      return;
    }

    let mx = 0, my = 0;
    if (inputs.up) my -= 1; if (inputs.down) my += 1;
    if (inputs.left) mx -= 1; if (inputs.right) mx += 1;
    if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }

    if (p.state !== ST.PUNCH) {
      p.vx = mx * P.walkSpd; p.vy = my * P.walkSpd;
      p.x += p.vx; p.y += p.vy;
      if (mx !== 0) p.facing = mx > 0 ? 1 : -1;
    } else {
      p.vx = 0; p.vy = 0;
    }

    if (inputs.btn2) {
      if (!p.charging) { p.charging = true; p.charge = 0; }
      p.charge += dt * 1000;
      if (p.charge > P.chargeTime) p.charge = P.chargeTime;
    }
    if (!inputs.btn2 && p.charging) {
      p.charging = false;
      const force = P.jumpForce + (p.charge / P.chargeTime) * (P.jumpMax - P.jumpForce);
      p.vy = -force;
      p.jumpHeight = force;
      p.state = ST.JUMP;
      p.shadowX = p.x;
      p.shadowY = p.y;
      p.shadowVX = p.facing * P.walkSpd;
      p.shadowVY = 0;
      p.isFlyingDrop = false;
      snd('jump');
    }

    if (inputs.btn1 && (p.state === ST.IDLE || p.state === ST.WALK || p.state === ST.RUN)) {
      if (opp.state === ST.DOWN && opp.carriedBy === null && dist(p, opp) < P.size * 1.5 && (opp.liftCooldown || 0) <= 0) {
        p.state = ST.LIFT; opp.state = ST.CARRY; opp.carriedBy = p; p.carry = opp;
        snd('slam');
      } else if (p.carry && opp.state === ST.CARRY) {
        const throwKb = p.facing * 15;
        damage(s, opp, 0, throwKb);
        opp.state = ST.DOWN; opp.downTimer = 1.0; opp.liftCooldown = 1.5;
        p.state = ST.IDLE; p.carry = null; opp.carriedBy = null;
        p.combo = 0; opp.combo = 0;
        shake(s, 0.012, 0.15);
        snd('slam'); particles(s, opp.x, opp.y, 0xffffff, 8);
      } else {
        // Always punch, even if no opponent is near
        p.state = ST.PUNCH;
        p.punchTimer = 0;
        if (dist(p, opp) < P.size * 1.2 && opp.state !== ST.JUMP) {
          if (p.facing === opp.facing && opp.state !== ST.DOWN && opp.state !== ST.HIT && opp.state !== ST.LIFT) {
            // SUPLEX! Punching from behind
            p.state = ST.SUPLEX_A; p.suplexTimer = 0; p.carry = opp;
            p.shadowY = p.y; p.shadowX = p.x;
            opp.state = ST.SUPLEX_R; opp.carriedBy = p;
            opp.shadowY = opp.y; opp.shadowX = opp.x;
            p.combo = 0; opp.combo = 0;
            snd('punch'); // Initial grab sound
          } else {
            damage(s, opp, P.punchDmg, p.facing * P.punchKb);
            
            // If they were down, popping them into HIT state stands them back up for the combo
            opp.state = ST.HIT; opp.hitTimer = 0.15;
            p.combo++; p.comboTimer = P.comboTime / 1000;
            if (p.combo >= P.comboCount) {
              opp.state = ST.DOWN; opp.downTimer = P.downTime / 1000;
              p.combo = 0; snd('slam');
            } else { snd('punch'); }
          }
        } else {
          // Whiff - punch missed
          snd('punch');
        }
      }
    }

    if (p.invuln > 0) p.invuln -= dt;

    if (p.state !== ST.JUMP && p.state !== ST.FLY && p.state !== ST.HIT && p.state !== ST.DOWN && p.state !== ST.LIFT && p.state !== ST.CARRY && p.state !== ST.KO && p.state !== ST.PUNCH && p.state !== ST.SUPLEX_A && p.state !== ST.SUPLEX_R) {
      if (p.vx !== 0 || p.vy !== 0) p.state = ST.WALK;
      else p.state = ST.IDLE;
    }

    s.applyRopeSpring(p, dt, false);

    if (p.combo > 0) { p.comboTimer -= dt; if (p.comboTimer <= 0) p.combo = 0; }

  }

  // Human player reads real inputs
  updatePlayer(p, dt, opp) {
    const inputs = {
      up: p.num === 1 ? isHeld('P1_U') : isHeld('P2_U'),
      down: p.num === 1 ? isHeld('P1_D') : isHeld('P2_D'),
      left: p.num === 1 ? isHeld('P1_L') : isHeld('P2_L'),
      right: p.num === 1 ? isHeld('P1_R') : isHeld('P2_R'),
      btn1: p.num === 1 ? isPressed('P1_1') : isPressed('P2_1'),
      btn2: p.num === 1 ? isHeld('P1_2') : isHeld('P2_2'),
      btn3: p.num === 1 ? isHeld('P1_3') : isHeld('P2_3'),
      btn4: false,
    };
    this.applyPhysics(p, dt, inputs, opp);
  }

  // AI generates virtual inputs and passes them to the same physics
  updateAI(p, opp, dt) {
    const s = this;
    const personality = AI[p.charName] || AI[0];

    const dx = opp.x - p.x, dy = opp.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // AI generates virtual inputs
    const inputs = { up: false, down: false, left: false, right: false, btn1: false, btn2: false, btn3: false, btn4: false };

    // State machine for AI behavior
    if (!p.aiState) p.aiState = 'approach';
    if (!p.aiTimer) p.aiTimer = 0;
    p.aiTimer -= dt;

    // If carrying opponent, throw immediately
    if (p.state === ST.LIFT && p.carry) {
      p.aiState = 'throw';
      p.aiTimer = 0.3;
    }

    if (p.aiTimer <= 0) {
      p.aiTimer = Phaser.Math.FloatBetween(0.2, 0.6);

      const healthPct = p.health / P.maxHealth;
      const oppHealthPct = opp.health / P.maxHealth;

      if (opp.state === ST.DOWN || opp.state === ST.HIT || opp.state === ST.PUNCH) {
        p.aiState = 'capitalize';
        p.aiTimer = 0.3;
      } else if (healthPct < 0.3 && oppHealthPct > 0.5) {
        if (d < 100) {
          p.aiState = Math.random() < 0.5 ? 'jump_attack' : 'wait';
        } else {
          p.aiState = Math.random() < 0.6 ? 'retreat' : 'circle';
        }
      } else if (d < 80) {
        const r = Math.random();
        if (r < personality.punchChance * 3) p.aiState = 'attack';
        else if (r < personality.punchChance * 3 + personality.jumpChance * 2) p.aiState = 'jump_attack';
        else p.aiState = 'circle';
      } else if (d < 200) {
        const r = Math.random();
        if (r < personality.runChance) p.aiState = 'approach';
        else if (r < personality.runChance + personality.jumpChance * 2) p.aiState = 'jump_attack';
        else p.aiState = 'circle';
      } else {
        p.aiState = Math.random() < personality.runChance ? 'approach' : 'wait';
      }

      if (personality === AI.mistico && Math.random() < 0.15) p.aiState = 'jump_attack';
    }

    // Execute AI strategy
    switch (p.aiState) {
      case 'approach':
        if (d > 60) {
          // Human-like Y-axis first alignment
          if (Math.abs(dy) > P.size * 0.8) {
            inputs.up = dy < 0; inputs.down = dy > 0;
            // Also close some X distance if far away
            if (Math.abs(dx) > P.size * 2) {
               inputs.left = dx < 0; inputs.right = dx > 0;
            }
          } else {
            inputs.left = dx < 0; inputs.right = dx > 0;
          }
        } else {
          p.aiState = 'attack'; p.aiTimer = 0.2;
        }
        break;

      case 'retreat':
        if (d < 300) {
          const ang = Math.atan2(dy, dx);
          const mx = -Math.cos(ang) * P.walkSpd;
          const my = -Math.sin(ang) * P.walkSpd;
          if (Math.abs(mx) > Math.abs(my)) { inputs.left = mx < 0; inputs.right = mx > 0; }
          else { inputs.up = my < 0; inputs.down = my > 0; }
        } else {
          p.aiState = 'wait'; p.aiTimer = 1.0;
        }
        break;

      case 'circle':
        {
          const ang = Math.atan2(dy, dx) + Math.PI / 2;
          const mx = Math.cos(ang) * P.walkSpd;
          const my = Math.sin(ang) * P.walkSpd;
          if (Math.abs(mx) > Math.abs(my)) { inputs.left = mx < 0; inputs.right = mx > 0; }
          else { inputs.up = my < 0; inputs.down = my > 0; }
          if (Math.random() < 0.02) p.aiState = 'circle_other';
        }
        break;

      case 'circle_other':
        {
          const ang = Math.atan2(dy, dx) - Math.PI / 2;
          const mx = Math.cos(ang) * P.walkSpd;
          const my = Math.sin(ang) * P.walkSpd;
          if (Math.abs(mx) > Math.abs(my)) { inputs.left = mx < 0; inputs.right = mx > 0; }
          else { inputs.up = my < 0; inputs.down = my > 0; }
          if (Math.random() < 0.02) p.aiState = 'circle';
        }
        break;

      case 'attack':
        if (dist(p, opp) < P.size * 1.2) {
          inputs.btn1 = true;
          p.aiState = 'attack';
          p.aiTimer = 0.15; // Mash fast for combo
        } else {
          p.aiState = 'approach';
        }
        break;

      case 'capitalize':
        if (opp.state !== ST.DOWN && opp.state !== ST.HIT) {
          p.aiState = 'approach';
        } else if (d > 50) {
          const ang = Math.atan2(dy, dx);
          const spd = P.walkSpd;
          const mx = Math.cos(ang) * spd;
          const my = Math.sin(ang) * spd;
          if (Math.abs(mx) > Math.abs(my)) { inputs.left = mx < 0; inputs.right = mx > 0; }
          else { inputs.up = my < 0; inputs.down = my > 0; }
        } else {
          // Once close, decide to lift or combo
          if (Math.random() < 0.4 && opp.state === ST.DOWN) {
            inputs.btn1 = true;
          } else {
            inputs.btn1 = true;
          }
          p.aiTimer = 0.2; // Keep applying input quickly
        }
        break;

      case 'throw':
        // Throw the carried opponent
        if (p.state === ST.LIFT && p.carry) {
          inputs.btn1 = true;
        } else {
          p.aiState = 'approach';
        }
        break;



      case 'jump_attack':
        if (p.state !== ST.JUMP) {
          inputs.btn2 = true;
          p.aiState = 'in_air'; p.aiTimer = 0.5;
        }
        break;

      case 'in_air':
        if (p.state === ST.IDLE) {
          p.aiState = 'approach'; // Landed without doing a body slam
        } else if (p.vy > 0 && p.jumpHeight < 50) {
          const shadowDist = Math.sqrt((p.shadowX - opp.x) ** 2 + (p.shadowY - opp.y) ** 2);
          if (shadowDist < P.size * 1.5) {
            inputs.btn1 = true;
            p.aiState = 'retreat'; p.aiTimer = 1.0;
          }
        }
        break;

      case 'wait':
        if (Math.random() < 0.05) {
          const mx = (Math.random() - 0.5) * P.walkSpd;
          const my = (Math.random() - 0.5) * P.walkSpd;
          if (Math.abs(mx) > Math.abs(my)) { inputs.left = mx < 0; inputs.right = mx > 0; }
          else { inputs.up = my < 0; inputs.down = my > 0; }
        }
        break;
    }

    // Apply the same physics as the player with AI inputs
    this.applyPhysics(p, dt, inputs, opp);
  }

  update() {
    const dt = this.game.loop.delta / 1000;

    // Reset rope targets at start of frame so they can accumulate from all players
    for (const side in this.ring.ropes) {
      this.ring.ropes[side].target = 0;
    }

    // Timer
    if (this.time.now - this.lastTime > 1000) { this.timer--; this.lastTime = this.time.now; }
    if (this.timer <= 0) { this.timer = 0; this.checkKO(); }

    // Pause
    if (isPressed('START1') || isPressed('START2')) {
      this.scene.launch('PauseScene'); this.scene.pause();
      clearPressed(); return;
    }

    // Update players
    this.updatePlayer(this.p1, dt, this.p2);
    if (this.mode === '1p') this.updateAI(this.p2, this.p1, dt);
    else this.updatePlayer(this.p2, dt, this.p1);

    // Check KO
    this.checkKO();

    // Visuals
    this.updatePlayerVisuals(this.p1);
    this.updatePlayerVisuals(this.p2);
    this.updateHUD();
    this.updateRopes();
    this.updateCrowd();

    // Camera Pan
    const midX = (this.p1.x + this.p2.x) / 2;
    let targetScrollX = midX - W / 2;
    const G = this.ring.geometry;
    const minScrollX = G.frontLX - 50;
    const maxScrollX = G.frontRX + 50 - W;
    targetScrollX = Phaser.Math.Clamp(targetScrollX, minScrollX, maxScrollX);
    this.cameras.main.scrollX += (targetScrollX - this.cameras.main.scrollX) * 0.1;

    clearPressed();
  }

  checkKO() {
    if (this.p1.health <= 0 && this.p1.state !== ST.KO) {
      this.p1.state = ST.KO; this.p1.body.setAngle(90); snd('bell');
    }
    if (this.p2.health <= 0 && this.p2.state !== ST.KO) {
      this.p2.state = ST.KO; this.p2.body.setAngle(90); snd('bell');
    }

    if (this.p1.state === ST.KO || this.p2.state === ST.KO || this.timer <= 0) {
      const winner = this.p1.state === ST.KO ? 'p2' : this.p2.state === ST.KO ? 'p1' : this.p1.health > this.p2.health ? 'p1' : this.p2.health > this.p1.health ? 'p2' : 'draw';

      if (winner !== 'draw') {
        this.scores[winner]++;
        this.registry.set('scores', this.scores);
      }

      if (this.scores.p1 >= 2 || this.scores.p2 >= 2 || this.round >= 3) {
        this.registry.set('winner', winner);
        this.registry.set('finalScores', { ...this.scores });
        this.scene.start('MatchOverScene');
      } else {
        this.round++;
        this.registry.set('round', this.round);
        this.scene.start('RoundOverScene', { winner });
      }
    }
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene', active: false }); }
  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    this.add.text(W / 2, H / 2, 'PAUSED', { fontFamily: 'monospace', fontSize: '48px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 50, 'PRESS START TO RESUME', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
  }
  update() {
    if (isPressed('START1') || isPressed('START2')) {
      this.scene.resume('PlayScene');
      this.scene.stop();
    }
    clearPressed();
  }
}

class RoundOverScene extends Phaser.Scene {
  constructor() { super({ key: 'RoundOverScene' }); }
  create(data) {
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8);
    const winner = data.winner;
    this.add.text(W / 2, H / 2, winner === 'p1' ? 'P1 WINS' : 'P2 WINS', { fontFamily: 'monospace', fontSize: '48px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);
    this.time.delayedCall(2000, () => { this.scene.start('PlayScene'); });
  }
}

class MatchOverScene extends Phaser.Scene {
  constructor() { super({ key: 'MatchOverScene' }); }
  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8);
    const winner = this.registry.get('winner');
    const scores = this.registry.get('finalScores');
    const mode = this.registry.get('mode');
    const tournament = this.registry.get('tournament') || 0;

    if (mode === '1p' && winner === 'p1') {
      if (tournament < 3) {
        this.registry.set('tournament', tournament + 1);
        this.add.text(W / 2, H / 2 - 30, 'OPPONENT ' + (tournament + 1) + ' DEFEATED!', { fontFamily: 'monospace', fontSize: '48px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 30, 'NEXT: ' + (tournament + 2) + '/3', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
        this.registry.set('round', 1);
        this.registry.set('scores', { p1: 0, p2: 0 });
        this.time.delayedCall(2000, () => { this.scene.start('PlayScene'); });
        return;
      } else {
        this.add.text(W / 2, H / 2 - 30, 'TOURNAMENT CHAMPION!', { fontFamily: 'monospace', fontSize: '48px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 30, 'ALL 3 OPPONENTS DEFEATED', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
      }
    } else {
      this.add.text(W / 2, H / 2 - 30, winner === 'draw' ? 'DRAW!' : (winner === 'p1' ? 'P1' : 'P2') + ' WINS!', { fontFamily: 'monospace', fontSize: '48px', color: '#e1ff00', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(W / 2, H / 2 + 30, 'P1: ' + scores.p1 + ' - P2: ' + scores.p2, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    }


  }
  update() {
    if (isPressed('START1') || isPressed('START2')) {
      this.registry.set('round', 1);
      this.registry.set('scores', { p1: 0, p2: 0 });
      this.registry.set('tournament', 0);
      this.scene.start('TitleScene');
    }
    clearPressed();
  }
}



// Game config
const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#1a0a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, CharSelectScene, PlayScene, PauseScene, RoundOverScene, MatchOverScene],
};

new Phaser.Game(config);
