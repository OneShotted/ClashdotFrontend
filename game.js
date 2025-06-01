const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const socket = new WebSocket("wss://websocket-vavu.onrender.com");

let username = "";
let devCode = "";

let players = {};
let mobs = {};
let messages = [];
let myId = null;

let keys = {};

document.getElementById("start-button").addEventListener("click", () => {
  username = document.getElementById("username-input").value.trim();
  devCode = document.getElementById("dev-code-input").value.trim();

  if (username !== "") {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("changelog").style.display = "block";
    socket.send(JSON.stringify({ type: "login", name: username, devCode }));
  }
});

document.getElementById("send-button").addEventListener("click", () => {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (text !== "") {
    socket.send(JSON.stringify({ type: "chat", message: text }));
    input.value = "";
  }
});

document.getElementById("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("send-button").click();
  }
});

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "init") {
    myId = data.id;
    players = data.players;
    mobs = data.mobs;
    messages = data.messages || [];
  } else if (data.type === "update") {
    players = data.players;
    mobs = data.mobs;
  } else if (data.type === "message") {
    messages.push(data);
    if (messages.length > 5) messages.shift();
    const msg = document.createElement("div");
    msg.className = "chat-message";
    msg.textContent = `${data.name}: ${data.message}`;
    if (data.name === "CharmedZ" && data.devCode === "1627") {
      msg.style.color = "red";
    }
    document.getElementById("chat-messages").appendChild(msg);
    document.getElementById("chat-messages").scrollTop = document.getElementById("chat-messages").scrollHeight;
  } else if (data.type === "changelog") {
    document.getElementById("changelog").innerHTML = data.html;
  }
};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function sendMovement() {
  socket.send(JSON.stringify({ type: "move", keys }));
}

function drawPlayer(p) {
  context.beginPath();
  context.arc(p.x, p.y, 20, 0, Math.PI * 2);
  context.fillStyle = p.id === myId ? "blue" : "green";
  context.fill();
  context.stroke();

  // Health bar
  context.fillStyle = "red";
  context.fillRect(p.x - 20, p.y - 30, 40, 5);
  context.fillStyle = "lime";
  context.fillRect(p.x - 20, p.y - 30, (p.health / 100) * 40, 5);

  context.fillStyle = "black";
  context.font = "12px Arial";
  context.textAlign = "center";
  context.fillText(p.name, p.x, p.y - 35);
}

function drawMob(mob) {
  context.save();
  context.translate(mob.x, mob.y);
  if (mob.type === "wanderer") {
    context.beginPath();
    context.arc(0, 0, 15, 0, Math.PI * 2);
    context.fillStyle = "yellow";
    context.fill();
  } else if (mob.type === "chaser") {
    context.beginPath();
    context.moveTo(0, -15);
    context.lineTo(15, 15);
    context.lineTo(-15, 15);
    context.closePath();
    context.fillStyle = "orange";
    context.fill();
  }
  context.restore();
}

function gameLoop() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    drawPlayer(players[id]);
  }

  for (let id in mobs) {
    drawMob(mobs[id]);
  }

  sendMovement();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Dev panel
document.getElementById("dev-panel-toggle").addEventListener("click", () => {
  const panel = document.getElementById("dev-panel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
});

document.getElementById("teleport-button").addEventListener("click", () => {
  const x = parseInt(document.getElementById("teleport-x").value);
  const y = parseInt(document.getElementById("teleport-y").value);
  socket.send(JSON.stringify({ type: "teleport", x, y }));
});

document.getElementById("kick-button").addEventListener("click", () => {
  const id = document.getElementById("kick-id").value;
  socket.send(JSON.stringify({ type: "kick", id }));
});

document.getElementById("broadcast-button").addEventListener("click", () => {
  const message = document.getElementById("broadcast-message").value;
  socket.send(JSON.stringify({ type: "broadcast", message }));
});

document.getElementById("search-button").addEventListener("click", () => {
  const query = document.getElementById("search-player").value.toLowerCase();
  const results = document.getElementById("search-results");
  results.innerHTML = "";
  for (let id in players) {
    const p = players[id];
    if (p.name.toLowerCase().includes(query)) {
      const div = document.createElement("div");
      div.textContent = `${p.name} (${id})`;
      results.appendChild(div);
    }
  }
});

