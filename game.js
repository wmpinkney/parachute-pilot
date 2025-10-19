// ==========================================
// Parachute Pilot DX  (Version 5 Deluxe)
// Part 1 – Core Setup, Environment & Player
// ==========================================

// Canvas setup
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Global state
let keys = {};
let score = 0;
let gameOver = false;
let frame = 0;

// Player object
const player = {
  x: 240,
  y: 60,
  vx: 0,
  vy: 0,
  width: 16,
  height: 18,
  tilt: 0,
  colorBody: "#ff6868",
  colorCanopy: "#ffe066",
  power: null,
  powerTimer: 0
};

// Arrays for environment
const clouds = [];
const hills = [];
const obstacles = [];
const particles = []; // for weather / effects
const powerUps = [];

// Wind & physics
let wind = 0;
let windTarget = 0;
let gravity = 0.04;
const damping = 0.97;
const controlForce = 0.05;

// Weather + lighting
let weather = "clear";
let weatherTimer = 0;
let lightningTimer = 0;
let dayTime = 0;

// Difficulty
let obstacleSpeed = 2;
let spawnChance = 0.02;

// ==========================================
// INITIALIZATION
// ==========================================
for (let i = 0; i < 8; i++)
  clouds.push({
    x: i * 80,
    y: 20 + Math.random() * 60,
    speed: 0.4 + Math.random() * 0.3,
    shade: `hsl(${190 + Math.random() * 10},60%,${85 + Math.random() * 10}%)`
  });

for (let i = 0; i < 6; i++)
  hills.push({
    x: i * 160,
    color: `hsl(${100 + Math.random() * 20},40%,35%)`,
    h: 40 + Math.random() * 30
  });

for (let i = 0; i < 6; i++) obstacles.push(makeObstacle(i * 120 + 480));

// ------------------------------------------
function makeObstacle(x) {
  const type = Math.random() < 0.6 ? "tree" : "building";
  const h = type === "tree" ? 40 + Math.random() * 20 : 70 + Math.random() * 50;
  const palette = {
    tree: `hsl(${100 + Math.random() * 20},50%,30%)`,
    building: `hsl(${210 + Math.random() * 10},15%,${40 + Math.random() * 20}%)`
  };
  return { x, y: 320 - h, w: type === "tree" ? 14 : 24, h, type, color: palette[type] };
}

// ==========================================
// RESET / UPDATE CORE
// ==========================================
function resetGame() {
  score = 0;
  frame = 0;
  player.x = 240;
  player.y = 60;
  player.vx = 0;
  player.vy = 0;
  player.tilt = 0;
  player.power = null;
  player.powerTimer = 0;
  obstacles.length = 0;
  for (let i = 0; i < 6; i++) obstacles.push(makeObstacle(i * 120 + 480));
  gameOver = false;
  weather = "clear";
  weatherTimer = 0;
  lightningTimer = 0;
  dayTime = 0;
}

// ==========================================
// INPUT
// ==========================================
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (gameOver && e.key === " ") resetGame();
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// ==========================================
// UPDATE PHYSICS & ENVIRONMENT
// ==========================================
function update() {
  if (gameOver) return;
  frame++;
  score++;

  // Gradual difficulty
  if (frame % 600 === 0) {
    obstacleSpeed += 0.2;
    spawnChance += 0.002;
  }

  // Wind target
  if (Math.random() < 0.01) windTarget = (Math.random() - 0.5) * 0.3;
  wind += (windTarget - wind) * 0.01;

  // Player input
  if (keys["ArrowLeft"]) player.vx -= controlForce;
  if (keys["ArrowRight"]) player.vx += controlForce;
  if (keys["ArrowUp"]) player.vy -= 0.05;
  if (keys["ArrowDown"]) player.vy += 0.05;

  // Apply gravity (modified by power-ups)
  let g = gravity;
  if (player.power === "feather") g *= 0.4;
  if (player.power === "shield") g *= 0.9;
  player.vx += wind;
  player.vy += g;
  player.vx *= damping;
  player.vy *= damping;

  player.x += player.vx;
  player.y += player.vy;

  // Bounds
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x + player.width > 480) { player.x = 480 - player.width; player.vx = 0; }
  if (player.y < 0) { player.y = 0; player.vy = 0; }
  if (player.y + player.height > 304) gameOver = true;

  // Tilt for animation
  player.tilt = Math.max(-1, Math.min(1, player.vx * 0.1));

  // Move background layers
  for (let c of clouds) { c.x -= c.speed; if (c.x < -60) c.x = 480 + Math.random() * 40; }
  for (let h of hills) { h.x -= 1; if (h.x < -160) { h.x += 160 * 6; h.h = 40 + Math.random() * 30; } }

  // Move obstacles
  for (let o of obstacles) {
    o.x -= obstacleSpeed;
    if (o.x + o.w < 0) { o.x += 720; Object.assign(o, makeObstacle(o.x)); }
    // Collision
    if (player.x < o.x + o.w &&
        player.x + player.width > o.x &&
        player.y < o.y + o.h &&
        player.y + player.height > o.y) {
      if (player.power !== "shield") gameOver = true;
    }
  }
}
// ==========================================
// Parachute Pilot DX
// Part 2 – Weather, Power-ups & Terrain
// ==========================================

// ------------------------------------------
// WEATHER CONTROL
// ------------------------------------------
function updateWeather() {
  weatherTimer++;
  if (weatherTimer > 900) {
    weatherTimer = 0;
    const cycle = ["clear", "windy", "rain", "storm", "snow", "night"];
    weather = cycle[(cycle.indexOf(weather) + 1) % cycle.length];
  }

  // Particles (rain / snow)
  if (weather === "rain" || weather === "storm") {
    if (Math.random() < 0.4)
      particles.push({
        type: "rain",
        x: Math.random() * 480,
        y: -10,
        vy: 3 + Math.random() * 2
      });
  } else if (weather === "snow") {
    if (Math.random() < 0.2)
      particles.push({
        type: "snow",
        x: Math.random() * 480,
        y: -10,
        vy: 0.5 + Math.random(),
        drift: Math.random() * 2 - 1
      });
  }

  // Update particle positions
  for (let p of particles) {
    if (p.type === "rain") {
      p.y += p.vy;
      p.x += wind * 4;
    } else if (p.type === "snow") {
      p.y += p.vy;
      p.x += Math.sin(frame * 0.05 + p.drift);
    }
  }
  // Cleanup
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].y > 320) particles.splice(i, 1);

  // Lightning
  if (weather === "storm" && Math.random() < 0.004) lightningTimer = 10;
  if (lightningTimer > 0) lightningTimer--;
}

// ------------------------------------------
// POWER-UP SYSTEM
// ------------------------------------------
const powerTypes = [
  { name: "feather", color: "#ffd166" },
  { name: "shield", color: "#06d6a0" },
  { name: "stabilizer", color: "#118ab2" }
];

function spawnPowerUp() {
  if (Math.random() < 0.005)
    powerUps.push({
      x: 480,
      y: 80 + Math.random() * 180,
      w: 12,
      h: 12,
      ...powerTypes[Math.floor(Math.random() * powerTypes.length)]
    });
}

function updatePowerUps() {
  for (let p of powerUps) {
    p.x -= obstacleSpeed;
    // Collision with player
    if (
      player.x < p.x + p.w &&
      player.x + player.width > p.x &&
      player.y < p.y + p.h &&
      player.y + player.height > p.y
    ) {
      player.power = p.name;
      player.powerTimer = 600; // ~10s duration
      playSound("power");
      p.collected = true;
    }
  }
  for (let i = powerUps.length - 1; i >= 0; i--) if (powerUps[i].x + powerUps[i].w < 0 || powerUps[i].collected) powerUps.splice(i, 1);
}

// ------------------------------------------
// APPLY POWER-UP EFFECTS
// ------------------------------------------
function handlePowerEffects() {
  if (player.powerTimer > 0) {
    player.powerTimer--;
    if (player.powerTimer === 0) player.power = null;
  }
  // Power modifiers
  if (player.power === "stabilizer") {
    wind *= 0.9;
  }
}

// ------------------------------------------
// PROCEDURAL TERRAIN VARIATION
// ------------------------------------------
function adjustTerrain() {
  // Hills get steeper with score
  const colorShift = 100 + Math.sin(frame / 300) * 20;
  for (let h of hills) h.color = `hsl(${colorShift},40%,35%)`;
  // Random color tweak for trees/buildings over time
  for (let o of obstacles) {
    if (o.type === "tree") o.color = `hsl(${100 + Math.sin(frame / 100) * 20},50%,30%)`;
  }
}

// --- END PART 2 ---
// ==========================================
// Parachute Pilot DX
// Part 3 – Visual Rendering & Drawing
// ==========================================

// ------------------------------------------
// SKY + BACKGROUND
// ------------------------------------------
function drawSky() {
  let top = "#8fd3ff", bottom = "#ffffff";
  if (weather === "night") { top = "#001030"; bottom = "#002050"; }
  if (weather === "storm") { top = "#4a5d75"; bottom = "#9da7bb"; }

  const grd = ctx.createLinearGradient(0, 0, 0, 320);
  grd.addColorStop(0, top);
  grd.addColorStop(1, bottom);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 480, 320);

  // Slight tint for day-night rhythm
  const nightOverlay = Math.abs(Math.sin(frame / 1500));
  ctx.fillStyle = `rgba(0,0,40,${0.3 * nightOverlay})`;
  ctx.fillRect(0, 0, 480, 320);
}

// ------------------------------------------
// CLOUDS & HILLS
// ------------------------------------------
function drawClouds() {
  ctx.globalAlpha = weather === "night" ? 0.6 : 1;
  for (let c of clouds) {
    ctx.fillStyle = c.shade;
    ctx.fillRect(c.x, c.y, 40, 12);
    ctx.fillRect(c.x + 10, c.y - 6, 24, 12);
  }
  ctx.globalAlpha = 1;
}

function drawHills() {
  for (let h of hills) {
    ctx.fillStyle = h.color;
    ctx.beginPath();
    ctx.moveTo(h.x, 320);
    ctx.quadraticCurveTo(h.x + 80, 320 - h.h, h.x + 160, 320);
    ctx.fill();
  }
}

// ------------------------------------------
// OBSTACLES
// ------------------------------------------
function drawObstacles() {
  for (let o of obstacles) {
    if (o.type === "tree") {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.fill();
      ctx.fillStyle = "#5a3c1a";
      ctx.fillRect(o.x + o.w / 2 - 2, o.y + o.h, 4, 10);
    } else {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      for (let i = 0; i < o.h; i += 10)
        ctx.fillRect(o.x + 3, o.y + i + 3, o.w - 6, 2);
    }
  }
}

// ------------------------------------------
// PARTICLES (RAIN / SNOW / LIGHTNING)
// ------------------------------------------
function drawParticles() {
  if (weather === "rain" || weather === "storm") {
    ctx.strokeStyle = "#55aaff";
    ctx.beginPath();
    for (let p of particles) {
      if (p.type === "rain") {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 2, p.y + 6);
      }
    }
    ctx.stroke();
  } else if (weather === "snow") {
    ctx.fillStyle = "#fff";
    for (let p of particles) if (p.type === "snow") ctx.fillRect(p.x, p.y, 2, 2);
  }
  if (lightningTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${lightningTimer / 10})`;
    ctx.fillRect(0, 0, 480, 320);
  }
}

// ------------------------------------------
// POWER-UPS VISUALS
// ------------------------------------------
function drawPowerUps() {
  for (let p of powerUps) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2);
  }
}

// ------------------------------------------
// PLAYER (MODERN PARACHUTE)
// ------------------------------------------
function drawPlayer() {
  const { x, y, width: w, height: h, tilt } = player;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt * 0.5);
  ctx.translate(-w / 2, -h / 2);

  // canopy
  ctx.fillStyle = player.colorCanopy;
  ctx.beginPath();
  ctx.moveTo(-3, -10);
  ctx.quadraticCurveTo(w / 2, -16, w + 3, -10);
  ctx.lineTo(w + 3, -6);
  ctx.lineTo(-3, -6);
  ctx.closePath();
  ctx.fill();

  // cords
  ctx.strokeStyle = "#dddddd";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -6);
  ctx.moveTo(w, 0);
  ctx.lineTo(w, -6);
  ctx.stroke();

  // pilot body
  ctx.fillStyle = player.colorBody;
  ctx.fillRect(0, 0, w, h);

  // glow when power-up active
  if (player.power) {
    ctx.strokeStyle = player.power === "shield" ? "#06d6a0" :
                      player.power === "stabilizer" ? "#118ab2" : "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(-1, -1, w + 2, h + 2);
  }

  ctx.restore();
}

// ------------------------------------------
// HUD + TEXT
// ------------------------------------------
function drawHUD() {
  ctx.fillStyle = weather === "night" ? "#fff" : "#000";
  ctx.font = "16px monospace";
  ctx.fillText("Score: " + Math.floor(score / 10), 10, 20);
  ctx.fillText("Weather: " + weather, 10, 40);
  if (player.power)
    ctx.fillText("Power: " + player.power, 10, 60);
  if (gameOver) {
    ctx.fillStyle = "#ff0000";
    ctx.fillText("GAME OVER", 180, 150);
    ctx.fillStyle = weather === "night" ? "#fff" : "#000";
    ctx.fillText("Press SPACE to restart", 130, 170);
  }
}
// --- END PART 3 ---
// ==========================================
// Parachute Pilot DX
// Part 4 – Main Loop & Audio
// ==========================================

// ------------------------------------------
// SIMPLE SOUND ENGINE (retro tone synth)
// ------------------------------------------
let audioCtx;
function playTone(freq, duration = 0.1, type = "square") {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function playSound(name) {
  switch (name) {
    case "power": playTone(660, 0.2, "triangle"); break;
    case "crash": playTone(120, 0.3, "sawtooth"); break;
    case "wind":  playTone(220 + Math.random() * 60, 0.1, "square"); break;
  }
}

// ------------------------------------------
// BACKGROUND MUSIC LOOP (simple arpeggio)
// ------------------------------------------
let musicTimer = 0;
function updateMusic() {
  musicTimer++;
  if (musicTimer % 180 === 0) {
    const base = [440, 554, 659, 880];
    const note = base[Math.floor(Math.random() * base.length)];
    playTone(note, 0.15, "sine");
  }
}

// ------------------------------------------
// MAIN GAME LOOP
// ------------------------------------------
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  updateWeather();
  updatePowerUps();
  handlePowerEffects();
  adjustTerrain();
  spawnPowerUp();

  // Draw everything
  drawSky();
  drawClouds();
  drawHills();
  drawObstacles();
  drawParticles();
  drawPowerUps();
  drawPlayer();
  drawHUD();

  if (!gameOver) updateMusic();
  requestAnimationFrame(gameLoop);
}

// ------------------------------------------
// INIT + START
// ------------------------------------------
resetGame();
gameLoop();

// ------------------------------------------
// CONTROLS
// ------------------------------------------
// Arrow keys control the player
// SPACE restarts after crash
// The longer you survive, the faster it gets!
// --- END PART 4 ---
// --- END PART 1 ---
