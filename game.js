const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game world and player
const worldWidth = 2000;
const worldHeight = 2000;

let player = {
  x: worldWidth / 2,
  y: worldHeight / 2,
  radius: 20,
  speed: 3
};

let playerId = null;
let allPlayers = {};

// ✅ Connect to your live WebSocket server
const socket = new WebSocket('wss://websocket-1-xib5.onrender.com');

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'init') {
    playerId = data.id;
    allPlayers = data.players;
  } else if (data.type === 'update') {
    allPlayers = data.players;
  }
};

// Controls
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Terrain
function drawTerrain(camX, camY) {
  ctx.fillStyle = '#7cfc00';
  ctx.fillRect(-camX, -camY, worldWidth, worldHeight);

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

// Game loop
function update() {
  if (keys['w']) player.y -= player.speed;
  if (keys['s']) player.y += player.speed;
  if (keys['a']) player.x -= player.speed;
  if (keys['d']) player.x += player.speed;

  if (playerId && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'move',
      pos: { x: player.x, y: player.y }
    }));
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const camX = player.x - canvas.width / 2;
  const camY = player.y - canvas.height / 2;

  drawTerrain(camX, camY);

  for (let id in allPlayers) {
    const p = allPlayers[id];
    const screenX = p.x - camX;
    const screenY = p.y - camY;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
    ctx.fillStyle = id === playerId ? 'blue' : 'red';
    ctx.fill();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

