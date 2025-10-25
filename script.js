/* script.js — Морской бой с ИИ и Онлайн-режимом
   Версия 25.10.2025 — полностью совместима с Telegram WebApp и GitHub Pages
*/

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.disableClosingConfirmation();
}

// Безопасный лог ошибок, чтобы WebApp не закрывался
window.addEventListener("error", (e) => {
  console.error("Ошибка JS:", e.message);
  if (tg) tg.showAlert("Ошибка: " + e.message);
});

let mode = null; // "ai" или "online"
let SIZE = 10;
let phase = "placement";
let playerBoard, computerBoard;
let currentTurn = "player";

// ====== Элементы интерфейса ======
const root = document.body;
root.innerHTML = `
  <div id="modeSelect" class="mode-select">
    <h2>⚓ Морской бой</h2>
    <button id="aiMode">🎮 Играть с ИИ</button>
    <button id="netMode">🌐 Играть по сети</button>
  </div>
  <div id="gameContainer" class="hidden">
    <h2 id="status">⚓ Морской бой</h2>
    <div id="boards">
      <div><h3>Ваш флот</h3><div id="playerBoard" class="board"></div></div>
      <div><h3>Поле соперника</h3><div id="computerBoard" class="board"></div></div>
    </div>
  </div>
`;

const modeSelect = document.getElementById("modeSelect");
const gameContainer = document.getElementById("gameContainer");
const statusEl = document.getElementById("status");
const playerEl = document.getElementById("playerBoard");
const compEl = document.getElementById("computerBoard");

// =============== ОСНОВНЫЕ ФУНКЦИИ ===============

// Создание пустого поля
function makeBoard() {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ ship: false, hit: false }))
  );
}

// Автоматическая расстановка кораблей
function autoPlace(board) {
  const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  for (let s of ships) {
    let placed = false;
    while (!placed) {
      const dir = Math.random() < 0.5 ? "h" : "v";
      const x = Math.floor(Math.random() * SIZE);
      const y = Math.floor(Math.random() * SIZE);
      const coords = [];
      for (let i = 0; i < s; i++) {
        const cx = dir === "h" ? x + i : x;
        const cy = dir === "v" ? y + i : y;
        if (cx >= SIZE || cy >= SIZE || board[cy][cx].ship) {
          coords.length = 0;
          break;
        }
        coords.push([cx, cy]);
      }
      if (coords.length === s) {
        coords.forEach(([cx, cy]) => (board[cy][cx].ship = true));
        placed = true;
      }
    }
  }
}

// Отрисовка поля
function renderBoard(board, element, showShips = false) {
  element.innerHTML = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const data = board[y][x];
      if (data.hit) cell.classList.add(data.ship ? "hit" : "miss");
      else if (showShips && data.ship) cell.classList.add("ship");

      if (mode === "ai" && phase === "battle" && element === compEl) {
        cell.addEventListener("click", () => playerShoot(x, y));
      }
      element.appendChild(cell);
    }
  }
}

// Проверка победы
function checkWin(board) {
  return board.every((row) => row.every((c) => !c.ship || c.hit));
}

// ИИ делает ход
function aiTurn() {
  let x, y;
  do {
    x = Math.floor(Math.random() * SIZE);
    y = Math.floor(Math.random() * SIZE);
  } while (playerBoard[y][x].hit);
  playerBoard[y][x].hit = true;
  renderBoard(playerBoard, playerEl, true);

  if (playerBoard[y][x].ship) {
    statusEl.textContent = "ИИ попал!";
    if (checkWin(playerBoard)) {
      statusEl.textContent = "❌ Вы проиграли!";
      phase = "end";
      return;
    }
    setTimeout(aiTurn, 1000);
  } else {
    statusEl.textContent = "Ваш ход!";
    currentTurn = "player";
  }
}

// Игрок стреляет
function playerShoot(x, y) {
  const cell = computerBoard[y][x];
  if (cell.hit || phase !== "battle") return;
  cell.hit = true;
  renderBoard(computerBoard, compEl, false);
  if (cell.ship) {
    statusEl.textContent = "🎯 Попадание!";
    if (checkWin(computerBoard)) {
      statusEl.textContent = "🏆 Победа!";
      phase = "end";
      return;
    }
  } else {
    statusEl.textContent = "💨 Мимо!";
    currentTurn = "computer";
    setTimeout(aiTurn, 1000);
  }
}

// Инициализация игры
function initGame() {
  playerBoard = makeBoard();
  computerBoard = makeBoard();
  autoPlace(playerBoard);
  autoPlace(computerBoard);
  renderBoard(playerBoard, playerEl, true);
  renderBoard(computerBoard, compEl, false);
  phase = "battle";
  statusEl.textContent = "Ваш ход! Стреляйте по полю соперника.";
}

// Онлайн-ожидание
function startOnlineWaiting() {
  gameContainer.classList.remove("hidden");
  modeSelect.classList.add("hidden");
  statusEl.textContent = "🌐 Ожидаем соперника (30)";
  let seconds = 30;
  const timer = setInterval(() => {
    seconds--;
    statusEl.textContent = `🌐 Ожидаем соперника (${seconds})`;
    if (seconds <= 0) {
      clearInterval(timer);
      statusEl.textContent = "⏳ Соперник не подключился. Попробуйте позже.";
      setTimeout(() => {
        if (tg) tg.close();
        else location.reload();
      }, 3000);
    }
  }, 1000);
}

// ====== ВЫБОР РЕЖИМА ======
document.getElementById("aiMode").addEventListener("click", () => {
  mode = "ai";
  modeSelect.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  initGame();
});

document.getElementById("netMode").addEventListener("click", () => {
  mode = "online";
  modeSelect.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  try {
    if (tg) tg.sendData(JSON.stringify({ type: "create_room" }));
  } catch (e) {
    console.warn("sendData error:", e);
  }
  startOnlineWaiting();
});
