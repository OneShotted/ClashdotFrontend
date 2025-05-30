// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Define world size
const worldWidth = 2000;
const worldHeight = 2000;

// Player setup
let player = {
  x: worldWidth / 2,
  y: worldHeight / 2,
  radius: 20,
  speed: 3
};

// Input tracking
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Game loop
function update() {
  if (keys['w'] && player.y > 0) player.y -= player.speed;
  if (keys['s'] && player.y < worldHeight) player.y += player.speed;
  if (keys['a'] && player.x > 0) player.x -= player.speed;
  if (keys['d'] && player.x < worldWidth) player.x += player.speed;
}

function drawTerrain(camX, camY) {
  // Grass background
  ctx.fillStyle = '#7cfc00';
  ctx.fillRect(-camX, -camY, worldWidth, worldHeight);

  // Grid overlay
  ctx.strokeStyle = '#ccc';
  for (let x = 0; x < worldWidth; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x - camX, 0 - camY);
    ctx.lineTo(x - camX, worldHeight - camY);
    ctx.stroke();
  }
  for (let y = 0; y < worldHeight; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0 - camX, y - camY);
    ctx.lineTo(worldWidth - camX, y - camY);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const camX = player.x - canvas.width / 2;
  const camY = player.y - canvas.height / 2;

  drawTerrain(camX, camY);

  // Draw player in center
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'blue';
  ctx.fill();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
