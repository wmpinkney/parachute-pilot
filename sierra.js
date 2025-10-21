// ====================================================
// Parachute Pilot DX –  SIERRA SCENE  MODULE
// ====================================================

// simple flag
let inSierra = false;
const sierraBirds = [];
const sierraMountains = [];
let sierraWind = 0;

// initialize biome assets
function initSierra() {
  inSierra = true;
  sierraBirds.length = 0;
  sierraMountains.length = 0;

  // generate mountain range
  for (let i = 0; i < 5; i++) {
    sierraMountains.push({
      x: i * 160,
      w: 160,
      h: 60 + Math.random() * 40,
      color: `hsl(${220 + Math.random() * 10},40%,45%)`
    });
  }

  // first flock of birds
  for (let i = 0; i < 6; i++) {
    sierraBirds.push({
      x: Math.random() * 480,
      y: 80 + Math.random() * 100,
      vx: 0.6 + Math.random() * 0.3
    });
  }
  resetGame();
  weather = "snow"; // starts snowy
}

// ====================================================
// SIERRA UPDATE + DRAW
// ====================================================
function updateSierra() {
  if (!inSierra || gameOver) return;

  // gentle stronger winds
  if (Math.random() < 0.01) windTarget = (Math.random() - 0.5) * 0.6;

  // mountain scroll
  for (let m of sierraMountains) {
    m.x -= 1;
    if (m.x + m.w < 0) {
      m.x += 160 * 5;
      m.h = 60 + Math.random() * 40;
    }
  }

  // birds glide across
  for (let b of sierraBirds) {
    b.x += b.vx;
    b.y += Math.sin(frame / 30 + b.x / 50) * 0.2;
    if (b.x > 500) {
      b.x = -Math.random() * 50;
      b.y = 80 + Math.random() * 100;
    }
  }
}

function drawSierraBackground() {
  if (!inSierra) return;

  // sky gradient
  const grd = ctx.createLinearGradient(0, 0, 0, 320);
  grd.addColorStop(0, "#87a0d0");
  grd.addColorStop(1, "#d8bfa8");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 480, 320);

  // distant mountains
  for (let m of sierraMountains) {
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.moveTo(m.x, 320);
    ctx.lineTo(m.x + 80, 320 - m.h);
    ctx.lineTo(m.x + 160, 320);
    ctx.closePath();
    ctx.fill();
  }

  // valleys and plateaus (foreground hills reuse)
  for (let h of hills) {
    ctx.fillStyle = `hsl(110,30%,25%)`;
    ctx.beginPath();
    ctx.moveTo(h.x, 320);
    ctx.quadraticCurveTo(h.x + 80, 320 - h.h * 0.6, h.x + 160, 320);
    ctx.fill();
  }

  // birds
  ctx.fillStyle = "#222";
  for (let b of sierraBirds) {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + 6, b.y + 2);
    ctx.lineTo(b.x + 12, b.y);
    ctx.stroke();
  }
}

// ====================================================
// MAIN LOOP EXTENSION
// ====================================================
function sierraLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  updateWeather();
  updatePowerUps();
  handlePowerEffects();
  adjustTerrain();
  spawnPowerUp();
  updateSierra();

  drawSierraBackground();
  drawObstacles();
  drawParticles();
  drawPowerUps();
  drawPlayer();
  drawHUD();

  if (!gameOver && musicEnabled) updateMusic();
  requestAnimationFrame(sierraLoop);
}

// integrate with menu
document.addEventListener("keydown", (e) => {
  if (currentScene === "sierra" && e.key === " ") {
    initSierra();
    sierraLoop();
  }
});