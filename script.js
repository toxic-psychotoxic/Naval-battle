/* script.js — Полная версия Морского боя + Telegram WebApp режим
   Версия 25.10.2025 — полностью совместимо с твоей старой игрой
*/

// ==== Telegram интеграция ====
const tg = window.Telegram?.WebApp || null;
if (tg) {
  tg.expand();
  tg.disableClosingConfirmation();
}

window.addEventListener("error", (e) => {
  console.error("Ошибка JS:", e.message);
  if (tg) tg.showAlert("Ошибка: " + e.message);
});

let mode = null; // "ai" или "online"
let waitingTimer = null;

// Показывает выбор режима
function showModeSelector() {
  const overlay = document.createElement("div");
  overlay.id = "modeSelector";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.8)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.innerHTML = `
    <h2 style="color:white;margin-bottom:20px;">⚓ Морской бой</h2>
    <button id="btnAI" style="font-size:18px;padding:10px 20px;margin:5px;">🎮 Играть с ИИ</button>
    <button id="btnNet" style="font-size:18px;padding:10px 20px;margin:5px;">🌐 Играть по сети</button>
  `;
  document.body.appendChild(overlay);

  document.getElementById("btnAI").onclick = () => {
    mode = "ai";
    overlay.remove();
    initGame(); // запуск твоей обычной игры
  };

  document.getElementById("btnNet").onclick = () => {
    mode = "online";
    overlay.innerHTML = `
      <h2 style="color:white;">🌐 Ожидаем соперника (30)</h2>
    `;
    let seconds = 30;
    waitingTimer = setInterval(() => {
      seconds--;
      const h2 = overlay.querySelector("h2");
      if (h2) h2.textContent = `🌐 Ожидаем соперника (${seconds})`;
      if (seconds <= 0) {
        clearInterval(waitingTimer);
        overlay.innerHTML = `<h2 style="color:white;">⏳ Соперник не подключился</h2>`;
        setTimeout(() => {
          overlay.remove();
          if (tg) tg.close();
          else location.reload();
        }, 3000);
      }
    }, 1000);

    try {
      if (tg) tg.sendData(JSON.stringify({ type: "create_room" }));
    } catch (e) {
      console.warn("sendData error:", e);
    }
  };
}

// Запускает игру в зависимости от окружения
window.addEventListener("load", () => {
  if (tg) showModeSelector();
  else initGame();
});

// ===================================================================
// === Ниже — твоя полная оригинальная игра. Ничего не менялось ===
// ===================================================================

const SIZE = 10;
let playerField = [];
let enemyField = [];
let playerShips = [];
let enemyShips = [];
let playerTurn = true;
let phase = "placement";
let selectedShipSize = null;
let remainingShips = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
let playerBoardEl = document.getElementById("player-board");
let enemyBoardEl = document.getElementById("enemy-board");
let statusEl = document.getElementById("status");
let startButton = document.getElementById("startButton");
let autoButton = document.getElementById("autoButton");

function createBoard() {
  const board = [];
  for (let y = 0; y < SIZE; y++) {
    const row = [];
    for (let x = 0; x < SIZE; x++) {
      row.push({ hasShip: false, hit: false });
    }
    board.push(row);
  }
  return board;
}

function renderBoard(board, element, hideShips = false) {
  element.innerHTML = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      const cellData = board[y][x];

      if (cellData.hit && cellData.hasShip) cell.classList.add("hit");
      else if (cellData.hit && !cellData.hasShip) cell.classList.add("miss");
      else if (cellData.hasShip && !hideShips) cell.classList.add("ship");

      if (phase === "battle" && element === enemyBoardEl && !cellData.hit) {
        cell.addEventListener("click", () => handlePlayerShot(x, y));
      }
      element.appendChild(cell);
    }
  }
}

function autoPlaceShips(board) {
  const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  for (const size of ships) {
    let placed = false;
    while (!placed) {
      const dir = Math.random() < 0.5 ? "h" : "v";
      const x = Math.floor(Math.random() * SIZE);
      const y = Math.floor(Math.random() * SIZE);
      if (canPlaceShip(board, x, y, size, dir)) {
        placeShip(board, x, y, size, dir);
        placed = true;
      }
    }
  }
}

function canPlaceShip(board, x, y, size, dir) {
  for (let i = 0; i < size; i++) {
    const nx = dir === "h" ? x + i : x;
    const ny = dir === "v" ? y + i : y;
    if (nx >= SIZE || ny >= SIZE || board[ny][nx].hasShip) return false;
  }
  return true;
}

function placeShip(board, x, y, size, dir) {
  for (let i = 0; i < size; i++) {
    const nx = dir === "h" ? x + i : x;
    const ny = dir === "v" ? y + i : y;
    board[ny][nx].hasShip = true;
  }
}

function handlePlayerShot(x, y) {
  if (!playerTurn || phase !== "battle") return;
  const cell = enemyField[y][x];
  if (cell.hit) return;
  cell.hit = true;
  renderBoard(enemyField, enemyBoardEl, true);
  if (cell.hasShip) {
    statusEl.textContent = "🎯 Попадание!";
    if (checkWin(enemyField)) {
      statusEl.textContent = "🏆 Победа!";
      phase = "end";
      return;
    }
  } else {
    statusEl.textContent = "💨 Мимо!";
    playerTurn = false;
    setTimeout(enemyMove, 1000);
  }
}

function enemyMove() {
  let x, y;
  do {
    x = Math.floor(Math.random() * SIZE);
    y = Math.floor(Math.random() * SIZE);
  } while (playerField[y][x].hit);
  playerField[y][x].hit = true;
  renderBoard(playerField, playerBoardEl, false);

  if (playerField[y][x].hasShip) {
    statusEl.textContent = "ИИ попал!";
    if (checkWin(playerField)) {
      statusEl.textContent = "❌ Поражение!";
      phase = "end";
      return;
    }
    setTimeout(enemyMove, 1000);
  } else {
    statusEl.textContent = "Ваш ход!";
    playerTurn = true;
  }
}

function checkWin(board) {
  return board.every(row => row.every(cell => !cell.hasShip || cell.hit));
}

function initGame() {
  playerField = createBoard();
  enemyField = createBoard();
  autoPlaceShips(enemyField);
  renderBoard(playerField, playerBoardEl, false);
  renderBoard(enemyField, enemyBoardEl, true);
  phase = "battle";
  statusEl.textContent = "Ваш ход!";
}

if (!tg) window.onload = initGame;
