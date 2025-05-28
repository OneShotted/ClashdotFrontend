// Setup canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define world size (the playable area)
const worldWidth = 2000;
const worldHeight = 2000;

// Player setup
let player = {
  x: worldWidth / 2,
  y: worldHeight / 2,
  radius: 20,
  speed: 3
};

const keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function update() {
  if (keys['w']) player.y -= player.speed;
  if (keys['s']) player.y += player.speed;
  if (keys['a']) player.x -= player.speed;
  if (keys['d']) player.x += player.speed;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Camera offset: center the player
  const camX = player.x - canvas.width / 2;
  const camY = player.y - canvas.height / 2;

  // Example: draw background (optional)
  // ctx.fillStyle = '#eee';
  // ctx.fillRect(-camX, -camY, worldWidth, worldHeight);

  // Draw player in center of screen
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'blue';
  ctx.fill();

  // If you have other objects, draw them relative to camX/camY
  // e.g. ctx.fillRect(enemy.x - camX, enemy.y - camY, 20, 20);
}


function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
