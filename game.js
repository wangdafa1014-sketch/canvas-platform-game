// 原创像素风平台跳跃小游戏（纯 Canvas + JS）
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

const WORLD = {
  width: 2400,
  height: canvas.height,
  gravity: 0.7,
  tile: 30,
};

const keys = {
  left: false,
  right: false,
  jump: false,
};

let gameState = {
  score: 0,
  lives: 3,
  won: false,
  gameOver: false,
  message: "",
};

const player = {
  x: 80,
  y: 0,
  w: 26,
  h: 34,
  vx: 0,
  vy: 0,
  speed: 3.1,
  jumpForce: -13,
  onGround: false,
  spawnX: 80,
  spawnY: 0,
  invincibleTimer: 0,
};

const level = {
  platforms: [
    { x: 0, y: 500, w: 2400, h: 40 },
    { x: 180, y: 430, w: 170, h: 20 },
    { x: 430, y: 370, w: 140, h: 20 },
    { x: 650, y: 310, w: 180, h: 20 },
    { x: 930, y: 420, w: 130, h: 20 },
    { x: 1120, y: 360, w: 190, h: 20 },
    { x: 1370, y: 300, w: 120, h: 20 },
    { x: 1540, y: 390, w: 180, h: 20 },
    { x: 1810, y: 340, w: 170, h: 20 },
    { x: 2060, y: 270, w: 150, h: 20 },
  ],
  spikes: [
    { x: 360, y: 480, w: 70, h: 20 },
    { x: 855, y: 480, w: 75, h: 20 },
    { x: 1710, y: 480, w: 65, h: 20 },
  ],
  coins: [
    { x: 230, y: 390, r: 8, taken: false },
    { x: 490, y: 330, r: 8, taken: false },
    { x: 740, y: 270, r: 8, taken: false },
    { x: 980, y: 380, r: 8, taken: false },
    { x: 1200, y: 320, r: 8, taken: false },
    { x: 1430, y: 260, r: 8, taken: false },
    { x: 1630, y: 350, r: 8, taken: false },
    { x: 1880, y: 300, r: 8, taken: false },
    { x: 2140, y: 230, r: 8, taken: false },
  ],
  enemies: [
    { x: 540, y: 476, w: 24, h: 24, minX: 480, maxX: 620, vx: 1.2 },
    { x: 1250, y: 336, w: 24, h: 24, minX: 1130, maxX: 1280, vx: 1.1 },
    { x: 1860, y: 316, w: 24, h: 24, minX: 1820, maxX: 1950, vx: 1.4 },
  ],
  flag: { x: 2290, y: 420, w: 16, h: 80 },
};

let cameraX = 0;

function resetGame() {
  gameState = { score: 0, lives: 3, won: false, gameOver: false, message: "" };
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.invincibleTimer = 0;

  level.coins.forEach((coin) => (coin.taken = false));
  level.enemies[0].x = 540;
  level.enemies[1].x = 1250;
  level.enemies[2].x = 1860;
  cameraX = 0;
}

function respawnPlayer() {
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.invincibleTimer = 90;
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function handleInput() {
  if (gameState.won || gameState.gameOver) return;

  player.vx = 0;
  if (keys.left) player.vx = -player.speed;
  if (keys.right) player.vx = player.speed;

  if (keys.jump && player.onGround) {
    player.vy = player.jumpForce;
    player.onGround = false;
  }
}

function updatePlayer() {
  if (gameState.won || gameState.gameOver) return;

  player.vy += WORLD.gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  for (const p of level.platforms) {
    if (!rectIntersect(player, p)) continue;

    const prevY = player.y - player.vy;
    if (prevY + player.h <= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (prevY >= p.y + p.h) {
      player.y = p.y + p.h;
      player.vy = 0;
    } else {
      if (player.vx > 0) player.x = p.x - player.w;
      if (player.vx < 0) player.x = p.x + p.w;
    }
  }

  player.x = Math.max(0, Math.min(player.x, WORLD.width - player.w));

  if (player.y > WORLD.height + 100) {
    loseLife("你掉出了地图！");
  }

  if (player.invincibleTimer > 0) player.invincibleTimer--;
}

function updateEnemies() {
  for (const e of level.enemies) {
    e.x += e.vx;
    if (e.x <= e.minX || e.x + e.w >= e.maxX) e.vx *= -1;

    if (player.invincibleTimer <= 0 && rectIntersect(player, e)) {
      loseLife("你被敌人碰到了！");
    }
  }
}

function updateCoins() {
  for (const coin of level.coins) {
    if (coin.taken) continue;
    const hitbox = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
    if (rectIntersect(player, hitbox)) {
      coin.taken = true;
      gameState.score += 10;
    }
  }
}

function updateHazardsAndFlag() {
  for (const s of level.spikes) {
    if (player.invincibleTimer <= 0 && rectIntersect(player, s)) {
      loseLife("你踩到了尖刺！");
    }
  }

  if (rectIntersect(player, level.flag)) {
    gameState.won = true;
    gameState.message = "关卡完成！按“重新开始”可再玩一次。";
  }
}

function loseLife(reason) {
  if (gameState.won || gameState.gameOver) return;
  gameState.lives -= 1;
  if (gameState.lives <= 0) {
    gameState.gameOver = true;
    gameState.message = `${reason} 游戏失败，点击“重新开始”重试。`;
    return;
  }

  gameState.message = `${reason} 你还有 ${gameState.lives} 条命。`;
  respawnPlayer();
}

function updateCamera() {
  const target = player.x - canvas.width * 0.35;
  cameraX += (target - cameraX) * 0.08;
  cameraX = Math.max(0, Math.min(cameraX, WORLD.width - canvas.width));
}

function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function renderBackground() {
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#bae6fd";
  for (let i = 0; i < 8; i++) {
    const cloudX = ((i * 310 - cameraX * 0.25) % (WORLD.width + 300)) - 150;
    ctx.fillRect(cloudX, 80 + (i % 3) * 35, 70, 20);
    ctx.fillRect(cloudX + 20, 70 + (i % 3) * 35, 45, 15);
  }
}

function renderWorld() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const p of level.platforms) {
    drawPixelRect(p.x, p.y, p.w, p.h, "#4b5563");
    drawPixelRect(p.x, p.y, p.w, 4, "#9ca3af");
  }

  for (const s of level.spikes) {
    for (let i = 0; i < s.w; i += 10) {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(s.x + i, s.y + s.h);
      ctx.lineTo(s.x + i + 5, s.y);
      ctx.lineTo(s.x + i + 10, s.y + s.h);
      ctx.fill();
    }
  }

  for (const coin of level.coins) {
    if (coin.taken) continue;
    drawPixelRect(coin.x - 6, coin.y - 6, 12, 12, "#facc15");
    drawPixelRect(coin.x - 2, coin.y - 4, 4, 8, "#fde68a");
  }

  for (const e of level.enemies) {
    drawPixelRect(e.x, e.y, e.w, e.h, "#7c3aed");
    drawPixelRect(e.x + 4, e.y + 6, 4, 4, "#ffffff");
    drawPixelRect(e.x + 16, e.y + 6, 4, 4, "#ffffff");
  }

  drawPixelRect(level.flag.x, level.flag.y, 4, level.flag.h, "#e5e7eb");
  drawPixelRect(level.flag.x + 4, level.flag.y, level.flag.w, 20, "#22c55e");

  // 玩家（像素方块角色）
  const blink = player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 5) % 2 === 0;
  if (!blink) {
    drawPixelRect(player.x, player.y, player.w, player.h, "#2563eb");
    drawPixelRect(player.x + 6, player.y + 8, 4, 4, "#ffffff");
    drawPixelRect(player.x + 16, player.y + 8, 4, 4, "#ffffff");
  }

  ctx.restore();
}

function renderUI() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.fillRect(10, 10, 280, 85);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "20px 'Courier New'";
  ctx.fillText(`得分: ${gameState.score}`, 20, 38);
  ctx.fillText(`生命: ${gameState.lives}`, 20, 64);

  if (gameState.message) {
    ctx.font = "16px 'Courier New'";
    ctx.fillStyle = gameState.won ? "#22c55e" : "#f87171";
    ctx.fillText(gameState.message, 20, 88);
  }
}

function gameLoop() {
  handleInput();
  updatePlayer();
  updateEnemies();
  updateCoins();
  updateHazardsAndFlag();
  updateCamera();

  renderBackground();
  renderWorld();
  renderUI();

  requestAnimationFrame(gameLoop);
}

function setKey(e, isDown) {
  const key = e.key.toLowerCase();
  if (["arrowleft", "a"].includes(key)) keys.left = isDown;
  if (["arrowright", "d"].includes(key)) keys.right = isDown;
  if (["arrowup", "w", " "].includes(key)) keys.jump = isDown;
}

window.addEventListener("keydown", (e) => {
  setKey(e, true);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => setKey(e, false));
restartBtn.addEventListener("click", resetGame);

resetGame();
gameLoop();
