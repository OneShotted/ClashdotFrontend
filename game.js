const socket = new WebSocket("wss://your-render-server-url"); // Replace with actual Render WebSocket URL

let playerId = null;
let players = {};
let mobs = [];

let keys = {};
let username = '';
let chatInput = document.getElementById('chatInput');
let chatBox = document.getElementById('chatBox');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let showUsernamePrompt = true;

document.getElementById('usernameButton').onclick = () => {
  const input = document.getElementById('usernameInput');
  if (input.value.trim() !== '') {
    username = input.value.trim();
    socket.send(JSON.stringify({ type: 'username', username }));
    showUsernamePrompt = false;
    document.getElementById('usernameScreen').style.display = 'none';
  }
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'init') {
    playerId = data.id;
  }

  if (data.type === 'state') {
    players = data.players;
    mobs = data.mobs;
  }

  if (data.type === 'chat') {
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    if (data.username === "CharmedZ" && data.id === playerId) {
      msg.style.color = 'red';
    }
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
};

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Enter' && document.activeElement !== chatInput) {
    chatInput.focus();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    socket.send(JSON.stringify({ type: 'chat', message: chatInput.value }));
    chatInput.value = '';
  }
});

// Send movement keys every 100ms
setInterval(() => {
  if (playerId && !showUsernamePrompt) {
    const pressed = [];
    if (keys['arrowup'] || keys['w']) pressed.push('up');
    if (keys['arrowdown'] || keys['s']) pressed.push('down');
    if (keys['arrowleft'] || keys['a']) pressed.push('left');
    if (keys['arrowright'] || keys['d']) pressed.push('right');
    socket.send(JSON.stringify({ type: 'move', keys: pressed }));
  }
}, 100);

// Game rendering loop
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const me = players[playerId];
  if (!me) return requestAnimationFrame(render);

  const offsetX = canvas.width / 2 - me.x;
  const offsetY = canvas.height / 2 - me.y;

  // Draw mobs
  for (const mob of mobs) {
    const x = mob.x + offsetX;
    const y = mob.y + offsetY;

    if (mob.type === 'wanderer') {
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fill();
    } else if (mob.type === 'chaser') {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(x, y - 15);
      ctx.lineTo(x - 12, y + 12);
      ctx.lineTo(x + 12, y + 12);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw players
  for (const id in players) {
    const p = players[id];
    const x = p.x + offsetX;
    const y = p.y + offsetY;

    // Body
    ctx.fillStyle = p.color || 'blue';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();

    // Username
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.username, x, y - 30);

    // Health bar
    const barWidth = 40;
    const barHeight = 6;
    const healthPercent = p.health / 100;
    ctx.fillStyle = 'gray';
    ctx.fillRect(x - barWidth / 2, y - 25, barWidth, barHeight);
    ctx.fillStyle = 'green';
    ctx.fillRect(x - barWidth / 2, y - 25, barWidth * healthPercent, barHeight);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x - barWidth / 2, y - 25, barWidth, barHeight);
  }

  requestAnimationFrame(render);
}

render();

