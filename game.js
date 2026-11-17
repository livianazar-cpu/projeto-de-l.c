/* =====================================================
   Coin Rush – Fase 1 (Edição Galáxia)  (Core Loop)
   Plataforma 2D em Canvas, JavaScript puro.
   Protagonista: boneca de cabelos loiros e vestido azul.
   ===================================================== */
(() => {
  'use strict';

  // ---------- Configuração ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;   // 960
  const H = canvas.height;  // 540

  const WORLD_W = 3700;
  const GRAVITY = 2000;
  const MAX_SPEED = 280;
  const ACCEL = 2200;
  const FRICTION = 2600;
  const JUMP_V = -760;
  const COYOTE_TIME = 0.10;   // pode pular logo após sair da borda
  const JUMP_BUFFER = 0.12;   // guarda o pulo apertado um pouco antes de tocar o chão
  const START_LIVES = 3;
  const START_TIME = 120;     // segundos
  const GROUND_Y = 470;

  // ---------- Entrada ----------
  const keys = Object.create(null);
  let jumpBuffer = 0;

  const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'];
  const BLOCK_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  addEventListener('keydown', (e) => {
    if (BLOCK_KEYS.includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys[e.code] = true;

    if (JUMP_KEYS.includes(e.code)) jumpBuffer = JUMP_BUFFER;

    if (e.code === 'Enter' && (state === 'menu' || state === 'won' || state === 'lost')) {
      resetGame();
      state = 'playing';
    }
    if (e.code === 'KeyR') {
      resetGame();
      state = 'playing';
    }
    if (e.code === 'Space' && (state === 'menu')) {
      resetGame();
      state = 'playing';
    }
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  // ---------- Dados da fase ----------
  // Chão com buracos (cair no vazio = perder vida)
  const groundSegments = [
    [0, 700], [830, 1500], [1640, 2300], [2430, 3000], [3130, 3700],
  ];
  const solids = [];
  groundSegments.forEach(([a, b]) => solids.push({ x: a, y: GROUND_Y, w: b - a, h: H - GROUND_Y + 60, ground: true }));

  // Plataformas flutuantes (asteroides e placas espaciais)
  [
    [300, 380, 140], [520, 310, 120],
    [900, 385, 140], [1090, 315, 140], [1290, 385, 110],
    [1750, 385, 160], [1980, 315, 120], [2140, 245, 130],
    [2330, 380, 100],            // ajuda a atravessar o buraco 2300-2430
    [2560, 370, 140], [2760, 300, 120],
    [3040, 385, 70],             // ajuda no buraco final
    [3250, 360, 140], [3420, 290, 130],
  ].forEach(([x, y, w]) => solids.push({ x, y, w, h: 20 }));

  // Moedas estelares
  const coins = [];
  const coinRow = (x, y, n, gap = 36) => {
    for (let i = 0; i < n; i++) coins.push({ x: x + i * gap, y, r: 12, taken: false });
  };
  coinRow(180, 430, 3);
  coinRow(320, 335, 3);
  coinRow(540, 265, 3);
  coinRow(740, 400, 2, 40);          // sobre o buraco
  coinRow(920, 340, 3);
  coinRow(1110, 270, 3);
  coinRow(1300, 340, 3);
  coinRow(1420, 430, 3);
  coinRow(1770, 340, 4);
  coinRow(2000, 270, 3);
  coinRow(2160, 200, 3);
  coinRow(2330, 335, 3);
  coinRow(2580, 325, 4);
  coinRow(2780, 255, 3);
  coinRow(3060, 340, 2, 40);
  coinRow(3270, 315, 4);
  coinRow(3440, 245, 3);

  // Aliens (patrulham o chão)
  const enemyDefs = [
    { x: 450,  y: GROUND_Y, minX: 380,  maxX: 690 },
    { x: 1000, y: GROUND_Y, minX: 850,  maxX: 1480 },
    { x: 1200, y: GROUND_Y, minX: 850,  maxX: 1480 },
    { x: 1800, y: GROUND_Y, minX: 1660, maxX: 2280 },
    { x: 2600, y: GROUND_Y, minX: 2450, maxX: 2980 },
    { x: 3300, y: GROUND_Y, minX: 3150, maxX: 3680 },
  ];

  const goal = { x: 3600, y: GROUND_Y - 120, w: 12, h: 120 };  // portal de chegada
  const CHECKPOINT_X = 1660;

  // ---------- Cenário (estrelas, planetas) ----------
  const stars = [];
  for (let i = 0; i < 140; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * (GROUND_Y + 40),
      s: Math.random() < 0.15 ? 3 : (Math.random() < 0.5 ? 2 : 1),
      f: 0.03 + Math.random() * 0.25,      // fator de parallax
      p: Math.random() * Math.PI * 2,      // fase do brilho
    });
  }
  const wrap = (v, m) => ((v % m) + m) % m;

  // ---------- Estado ----------
  let state = 'menu';           // menu | playing | won | lost
  let player, enemies, camX, score, coinCount, lives, timeLeft, checkpoint, flash, popups, bonusInfo;
  let timeSinceStart = 0;

  function resetGame() {
    coins.forEach(c => (c.taken = false));
    enemies = enemyDefs.map(d => ({
      x: d.x, y: d.y - 28, w: 32, h: 28,
      minX: d.minX, maxX: d.maxX - 32,
      vx: (Math.random() < 0.5 ? -1 : 1) * 60, alive: true,
    }));
    score = 0;
    coinCount = 0;
    lives = START_LIVES;
    timeLeft = START_TIME;
    checkpoint = { x: 60, y: GROUND_Y - 40 };
    popups = [];
    bonusInfo = null;
    flash = 0;
    spawnPlayer();
  }

  function spawnPlayer() {
    player = {
      x: checkpoint.x, y: checkpoint.y, w: 28, h: 40,
      vx: 0, vy: 0, onGround: false, coyote: 0, facing: 1, invul: 1.0,
    };
    camX = Math.max(0, Math.min(WORLD_W - W, player.x - W / 2));
  }

  function loseLife() {
    lives--;
    flash = 0.35;
    if (lives <= 0) {
      state = 'lost';
      return;
    }
    spawnPlayer();
  }

  function addPopup(text, x, y, color = '#fff') {
    popups.push({ text, x, y, t: 0.8, color });
  }

  // ---------- Física ----------
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function updatePlayer(dt) {
    const left = keys.ArrowLeft || keys.KeyA;
    const right = keys.ArrowRight || keys.KeyD;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);

    // Horizontal
    if (dir !== 0) {
      player.vx += dir * ACCEL * dt;
      player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));
      player.facing = dir;
    } else {
      const f = FRICTION * dt;
      if (Math.abs(player.vx) <= f) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * f;
    }

    // Pulo (coyote time + buffer)
    jumpBuffer = Math.max(0, jumpBuffer - dt);
    player.coyote = player.onGround ? COYOTE_TIME : Math.max(0, player.coyote - dt);
    if (jumpBuffer > 0 && player.coyote > 0) {
      player.vy = JUMP_V;
      player.onGround = false;
      player.coyote = 0;
      jumpBuffer = 0;
    }
    // Pulo variável: soltar a tecla corta o pulo
    const jumpHeld = keys.Space || keys.ArrowUp || keys.KeyW;
    if (!jumpHeld && player.vy < -250) player.vy += GRAVITY * 1.5 * dt;

    player.vy += GRAVITY * dt;
    if (player.vy > 1100) player.vy = 1100;

    // Eixo X
    player.x += player.vx * dt;
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x + player.w > WORLD_W) { player.x = WORLD_W - player.w; player.vx = 0; }
    for (const s of solids) {
      if (overlap(player, s)) {
        if (player.vx > 0) player.x = s.x - player.w;
        else if (player.vx < 0) player.x = s.x + s.w;
        player.vx = 0;
      }
    }

    // Eixo Y
    player.y += player.vy * dt;
    player.onGround = false;
    for (const s of solids) {
      if (overlap(player, s)) {
        if (player.vy > 0) {
          player.y = s.y - player.h;
          player.onGround = true;
        } else if (player.vy < 0) {
          player.y = s.y + s.h;
        }
        player.vy = 0;
      }
    }

    if (player.invul > 0) player.invul -= dt;

    // Checkpoint
    if (player.x > CHECKPOINT_X && checkpoint.x < CHECKPOINT_X) {
      checkpoint = { x: CHECKPOINT_X + 20, y: GROUND_Y - 40 };
      addPopup('Checkpoint!', player.x, player.y - 20, '#7dffb0');
    }

    // Queda no vazio
    if (player.y > H + 80) loseLife();
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
      if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }

      if (state === 'playing' && overlap(player, e)) {
        const playerBottomPrev = player.y + player.h - player.vy * dt;
        const stomp = player.vy > 0 && playerBottomPrev <= e.y + 12;
        if (stomp) {
          e.alive = false;
          player.vy = -520;
          score += 100;
          addPopup('+100', e.x, e.y - 8, '#ffd54a');
        } else if (player.invul <= 0) {
          lives--;
          flash = 0.35;
          if (lives <= 0) { state = 'lost'; return; }
          player.invul = 1.5;
          player.vy = -400;
          player.vx = (player.x < e.x ? -1 : 1) * 300;
        }
      }
    }
  }

  function updateCoins() {
    for (const c of coins) {
      if (c.taken) continue;
      const nx = Math.max(player.x, Math.min(c.x, player.x + player.w));
      const ny = Math.max(player.y, Math.min(c.y, player.y + player.h));
      if ((nx - c.x) ** 2 + (ny - c.y) ** 2 < c.r * c.r) {
        c.taken = true;
        coinCount++;
        score += 10;
        addPopup('+10', c.x, c.y - 10, '#fff3a0');
      }
    }
  }

  function update(dt) {
    timeSinceStart += dt;
    if (state !== 'playing') {
      popups.forEach(p => (p.t -= dt));
      popups = popups.filter(p => p.t > 0);
      return;
    }

    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; state = 'lost'; return; }

    updatePlayer(dt);
    if (state !== 'playing') return;
    updateEnemies(dt);
    if (state !== 'playing') return;
    updateCoins();

    // Meta (portal)
    if (overlap(player, goal) || player.x > goal.x - 10) {
      const timeBonus = Math.floor(timeLeft) * 5;
      const lifeBonus = lives * 100;
      score += timeBonus + lifeBonus;
      bonusInfo = { timeBonus, lifeBonus };
      state = 'won';
    }

    camX += ((player.x - W / 2 + player.w / 2) - camX) * Math.min(1, dt * 8);
    camX = Math.max(0, Math.min(WORLD_W - W, camX));

    popups.forEach(p => { p.t -= dt; p.y -= 40 * dt; });
    popups = popups.filter(p => p.t > 0);
    if (flash > 0) flash -= dt;
  }

  // ---------- Desenho ----------
  function drawPlanet(px, py, r, c1, c2, ring) {
    if (ring) {
      ctx.strokeStyle = ring;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 1.7, r * 0.45, -0.3, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    if (ring) {
      ctx.strokeStyle = ring;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 1.7, r * 0.45, -0.3, 0, Math.PI);
      ctx.stroke();
    }
  }

  function drawBackground() {
    // céu do espaço
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0626');
    g.addColorStop(0.6, '#241250');
    g.addColorStop(1, '#4a1f6e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // nebulosas
    const blobs = [
      [220, 160, 260, 'rgba(255,90,200,0.22)'],
      [700, 120, 300, 'rgba(90,120,255,0.22)'],
      [520, 330, 280, 'rgba(120,60,200,0.25)'],
    ];
    blobs.forEach(([bx, by, br, col], i) => {
      const x = wrap(bx - camX * 0.05 * (i + 1), W + 600) - 300;
      const rg = ctx.createRadialGradient(x, by, 0, x, by, br);
      rg.addColorStop(0, col);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - br, by - br, br * 2, br * 2);
    });

    // estrelas com brilho
    for (const s of stars) {
      const sx = wrap(s.x - camX * s.f, W);
      const a = 0.45 + 0.55 * Math.sin(timeSinceStart * 2 + s.p);
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
      ctx.fillRect(sx, s.y, s.s, s.s);
    }

    // planetas distantes (parallax)
    drawPlanet(wrap(720 - camX * 0.08, W + 500) - 150, 140, 70, '#ffb86b', '#b5462f', 'rgba(255,220,160,0.7)');
    drawPlanet(wrap(240 - camX * 0.15, W + 400) - 100, 300, 34, '#8be9ff', '#2a6fb0', null);
    drawPlanet(wrap(1000 - camX * 0.22, W + 600) - 200, 90, 20, '#d9a6ff', '#6a2fb0', null);
  }

  function drawSolids() {
    for (const s of solids) {
      if (s.x + s.w < camX - 10 || s.x > camX + W + 10) continue;
      const x = s.x - camX;
      if (s.ground) {
        // rocha alienígena
        ctx.fillStyle = '#2b1f55';
        ctx.fillRect(x, s.y, s.w, s.h);
        ctx.fillStyle = '#4a3a8c';
        ctx.fillRect(x, s.y, s.w, 12);
        ctx.fillStyle = '#7cf4ff';
        ctx.fillRect(x, s.y, s.w, 3);
        // cristais e pontinhos decorativos
        for (let cx = Math.ceil(s.x / 56) * 56; cx < s.x + s.w - 10; cx += 56) {
          const dx = cx - camX;
          if (dx < -20 || dx > W + 20) continue;
          const hgt = 6 + (cx * 7 % 5) * 3;
          ctx.fillStyle = (cx / 56) % 2 === 0 ? '#ff7ad9' : '#7cf4ff';
          ctx.beginPath();
          ctx.moveTo(dx, s.y);
          ctx.lineTo(dx + 4, s.y - hgt);
          ctx.lineTo(dx + 8, s.y);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.18)';
          ctx.fillRect(dx + 14, s.y + 28 + (cx % 3) * 14, 4, 4);
        }
      } else {
        // placa espacial flutuante
        ctx.fillStyle = '#3b4a7a';
        ctx.fillRect(x, s.y, s.w, s.h);
        ctx.fillStyle = '#ff7ad9';
        ctx.fillRect(x, s.y, s.w, 4);
        ctx.fillStyle = '#1f2a52';
        ctx.fillRect(x, s.y + s.h - 5, s.w, 5);
        ctx.fillStyle = '#7cf4ff';
        for (let lx = 10; lx < s.w - 6; lx += 22) ctx.fillRect(x + lx, s.y + 9, 4, 4);
      }
    }
  }

  function drawStar(cx, cy, r, spin) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const px = cx + Math.cos(ang) * rad * spin;
      const py = cy + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawCoins() {
    for (const c of coins) {
      if (c.taken || c.x < camX - 20 || c.x > camX + W + 20) continue;
      const spin = Math.max(0.25, Math.abs(Math.cos(timeSinceStart * 3 + c.x * 0.05)));
      const bob = Math.sin(timeSinceStart * 3 + c.x * 0.03) * 3;
      const cx = c.x - camX, cy = c.y + bob;
      // brilho
      ctx.fillStyle = 'rgba(255, 224, 100, 0.22)';
      ctx.beginPath(); ctx.arc(cx, cy, c.r + 6, 0, Math.PI * 2); ctx.fill();
      // estrela dourada
      drawStar(cx, cy, c.r, spin);
      ctx.fillStyle = '#ffd54a';
      ctx.fill();
      ctx.strokeStyle = '#b78600';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (!e.alive) continue;
      const x = e.x - camX;
      if (x < -40 || x > W + 40) continue;
      const bob = Math.sin(timeSinceStart * 6 + e.x * 0.05) * 2;
      const y = e.y + bob;
      // antenas
      ctx.strokeStyle = '#2fa862';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 9, y + 2); ctx.lineTo(x + 5, y - 8);
      ctx.moveTo(x + 23, y + 2); ctx.lineTo(x + 27, y - 8);
      ctx.stroke();
      ctx.fillStyle = '#ff7ad9';
      ctx.fillRect(x + 2, y - 11, 6, 6);
      ctx.fillRect(x + 24, y - 11, 6, 6);
      // corpo (gelatina alienígena)
      ctx.fillStyle = '#43d17a';
      ctx.beginPath();
      ctx.moveTo(x, y + e.h);
      ctx.quadraticCurveTo(x, y, x + e.w / 2, y);
      ctx.quadraticCurveTo(x + e.w, y, x + e.w, y + e.h);
      ctx.fill();
      // olho único
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 9, y + 7, 14, 10);
      ctx.fillStyle = '#240b52';
      const look = e.vx > 0 ? 4 : 0;
      ctx.fillRect(x + 11 + look, y + 9, 6, 6);
    }
  }

  function drawGoal() {
    // portal de chegada
    const cx = goal.x - camX + 6;
    const cy = goal.y + goal.h / 2;
    if (cx < -80 || cx > W + 80) return;
    const pulse = Math.sin(timeSinceStart * 4) * 3;
    const rg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 70);
    rg.addColorStop(0, 'rgba(124,244,255,.9)');
    rg.addColorStop(1, 'rgba(124,244,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(cx - 80, cy - 80, 160, 160);
    ctx.fillStyle = '#12082e';
    ctx.beginPath(); ctx.ellipse(cx, cy, 26, 56, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff7ad9';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(cx, cy, 28 + pulse * 0.3, 58 + pulse, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#7cf4ff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, 18, 42, 0, 0, Math.PI * 2); ctx.stroke();
  }

  // Boneca de cabelos loiros e vestido azul
  function drawPlayer() {
    if (player.invul > 0 && Math.floor(player.invul * 12) % 2 === 0) return;
    const x = player.x - camX;
    const y = player.y;
    const w = player.w;
    const f = player.facing;
    const moving = player.onGround && Math.abs(player.vx) > 20;
    const step = moving ? Math.sin(timeSinceStart * 18) * 3 : 0;
    const air = !player.onGround;
    const sway = (Math.min(Math.abs(player.vx), MAX_SPEED) / MAX_SPEED) * -f * 6 + (air ? -player.vy * 0.004 : 0);

    // cabelo longo (atrás), balança com o movimento
    ctx.fillStyle = '#e8b830';
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 4);
    ctx.lineTo(x + w - 1, y + 4);
    ctx.lineTo(x + w - 1 + sway, y + 31);
    ctx.lineTo(x + 1 + sway, y + 31);
    ctx.fill();

    // pernas e sapatinhos
    ctx.fillStyle = '#ffe0c2';
    ctx.fillRect(x + 8 + step, y + 33, 5, 5);
    ctx.fillRect(x + 15 - step, y + 33, 5, 5);
    ctx.fillStyle = '#7e57c2';
    ctx.fillRect(x + 7 + step, y + 37, 7, 3);
    ctx.fillRect(x + 14 - step, y + 37, 7, 3);

    // vestido azul
    ctx.fillStyle = '#2f7de1';
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 17);
    ctx.lineTo(x + w - 7, y + 17);
    ctx.lineTo(x + w + 2, y + 35);
    ctx.lineTo(x - 2, y + 35);
    ctx.fill();
    ctx.fillStyle = '#8fc3ff';           // barra do vestido
    ctx.fillRect(x - 1, y + 32, w + 2, 3);
    ctx.fillStyle = '#1d56a8';           // cintura
    ctx.fillRect(x + 8, y + 22, w - 16, 3);

    // bracinhos
    const arm = air ? -3 : step * 0.6;
    ctx.fillStyle = '#ffe0c2';
    ctx.fillRect(x + 3, y + 19 + arm, 4, 8);
    ctx.fillRect(x + w - 7, y + 19 - arm, 4, 8);

    // cabeça
    ctx.fillStyle = '#ffe0c2';
    ctx.fillRect(x + 3, y + 3, w - 6, 15);

    // franja e mechas laterais
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(x + 2, y, w - 4, 7);
    ctx.fillRect(x + 2, y, 4, 15);
    ctx.fillRect(x + w - 6, y, 4, 15);

    // laço azul-claro
    ctx.fillStyle = '#bfe0ff';
    const bx = f > 0 ? x + w - 11 : x + 5;
    ctx.fillRect(bx, y - 3, 7, 5);
    ctx.fillStyle = '#5aa9ff';
    ctx.fillRect(bx + 2, y - 2, 3, 3);

    // olhos e bochechas
    ctx.fillStyle = '#1a2a6c';
    ctx.fillRect(x + 8 + f * 2, y + 9, 3, 5);
    ctx.fillRect(x + 17 + f * 2, y + 9, 3, 5);
    ctx.fillStyle = '#ff9db1';
    ctx.fillRect(x + 6 + f * 2, y + 14, 4, 2);
    ctx.fillRect(x + 18 + f * 2, y + 14, 4, 2);
  }

  function drawPopups() {
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const p of popups) {
      ctx.globalAlpha = Math.min(1, p.t * 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x - camX, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    // barra translúcida
    ctx.fillStyle = 'rgba(10, 6, 38, .7)';
    ctx.fillRect(0, 0, W, 44);

    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px system-ui, sans-serif';

    // moedas estelares
    drawStar(28, 22, 11, 1);
    ctx.fillStyle = '#ffd54a';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`× ${coinCount} / ${coins.length}`, 46, 23);

    // pontos
    ctx.textAlign = 'center';
    ctx.fillText(`PONTOS  ${String(score).padStart(5, '0')}`, W / 2 - 60, 23);

    // tempo
    const low = timeLeft < 20;
    ctx.fillStyle = low ? '#ff6b6b' : '#fff';
    ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, W / 2 + 120, 23);

    // vidas
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff7ab8';
    ctx.fillText('♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, START_LIVES - lives)), W - 16, 23);
    ctx.textBaseline = 'alphabetic';
  }

  function drawOverlay(title, lines, color) {
    ctx.fillStyle = 'rgba(8, 4, 30, .78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.fillText(title, W / 2, 190);
    ctx.fillStyle = '#fff';
    ctx.font = '22px system-ui, sans-serif';
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 245 + i * 34));
  }

  function draw() {
    drawBackground();
    drawSolids();
    drawGoal();
    drawCoins();
    drawEnemies();
    if (player) drawPlayer();
    drawPopups();
    drawHUD();

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,60,120,${flash})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (state === 'menu') {
      drawOverlay('COIN RUSH', [
        'Fase 1 – Nebulosa Cintilante',
        'Ajude a boneca a cruzar a galáxia: colete estrelas,',
        'pise nos aliens e chegue ao portal!',
        'Pressione ENTER ou ESPAÇO para começar',
      ], '#ffd54a');
    } else if (state === 'won') {
      drawOverlay('PORTAL ATINGIDO!', [
        `Estrelas: ${coinCount}/${coins.length}`,
        `Bônus de tempo: +${bonusInfo.timeBonus}   Bônus de vidas: +${bonusInfo.lifeBonus}`,
        `PONTUAÇÃO FINAL: ${score}`,
        'ENTER para jogar de novo',
      ], '#7cf4ff');
    } else if (state === 'lost') {
      drawOverlay('GAME OVER', [
        timeLeft <= 0 ? 'O tempo acabou!' : 'A boneca ficou sem vidas.',
        `Pontuação: ${score}`,
        'ENTER para tentar de novo',
      ], '#ff6b6b');
    }
  }

  // ---------- Loop principal (passo fixo de 1/60 s) ----------
  resetGame();
  const STEP = 1 / 60;
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
