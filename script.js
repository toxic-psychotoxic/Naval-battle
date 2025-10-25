/* script.js — Морской бой с авторасстановкой, отсчётом, умным ИИ, подсветкой и переключением полей (без кнопки «Новая игра») */

const SIZE = 10;
const FLEET = { 4: 1, 3: 2, 2: 3, 1: 4 };

let phase = "placing";
let playerBoard, computerBoard;
let playerShips = [];
let computerShips = [];
let selectedSize = null;
let selectedCells = [];
let currentTurn = null;
let aiMemory = { hits: [], direction: "" };
let lastShot = { x: -1, y: -1, board: null };

const playerEl = document.getElementById("player-board");
const compEl = document.getElementById("computer-board");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBattle");
const cancelSel = document.getElementById("cancelSelection");
const shipBtnsBox = document.getElementById("ship-buttons");
const diceBox = document.getElementById("dice-controls");
const rollBtn = document.getElementById("rollBtn");
const timerEl = document.getElementById("timer");
const diceResult = document.getElementById("dice-result");

// Авторасстановка
const autoBtn = document.createElement("button");
autoBtn.textContent = "🚀 Авторасстановка";
autoBtn.id = "autoPlace";
startBtn.insertAdjacentElement("beforebegin", autoBtn);

// Кнопка «Переключить поле»
const toggleBtn = document.createElement("button");
toggleBtn.textContent = "🔁 Переключить поле";
toggleBtn.id = "toggleView";
toggleBtn.style.display = "none";
statusEl.parentElement.appendChild(toggleBtn);

// ========== Утилиты ==========
function makeEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => ({ ship: false, hit: false })));
}
function isInside(x, y) { return x >= 0 && x < SIZE && y >= 0 && y < SIZE; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

// ========== Рендер ==========
function cellIndex(x, y) { return y * SIZE + x; }

function renderBoard(board, element, showShips) {
  element.innerHTML = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = board[y][x];
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;

      // Показываем корабли, попадания, промахи
      if (showShips && d.ship) cell.classList.add("ship");
      if (d.hit && d.ship) cell.classList.add("hit");
      if (d.hit && !d.ship) cell.classList.add("miss");

      // 🔹 Подсветка временно выбранных клеток при расстановке
      if (phase === "placing" && element === playerEl && selectedCells.some(c => c.x === x && c.y === y)) {
        cell.classList.add("preview");
      }

      // 🔹 Мигание последнего выстрела
      if (lastShot.x === x && lastShot.y === y && lastShot.board === element) {
        cell.classList.add("blink");
      }

      cell.addEventListener("click", () => {
        if (phase === "placing" && element === playerEl) handlePlacementClick(x, y);
        else if (phase === "battle" && element === compEl && currentTurn === "player")
          handlePlayerShot(x, y);
      });
      element.appendChild(cell);
    }
  }
}

// 🔹 Функция для мигания клетки
function blinkCell(boardEl, x, y) {
  lastShot = { x, y, board: boardEl };
  renderBoard(boardEl === playerEl ? playerBoard : computerBoard, boardEl, boardEl === playerEl);
  
  // Убираем мигание через 1 секунду
  setTimeout(() => {
    lastShot = { x: -1, y: -1, board: null };
    renderBoard(boardEl === playerEl ? playerBoard : computerBoard, boardEl, boardEl === playerEl);
  }, 1000);
}

// ========== Проверки ==========
function boardHasShipNear(board, x, y) {
  for (let yy = y - 1; yy <= y + 1; yy++)
    for (let xx = x - 1; xx <= x + 1; xx++)
      if (isInside(xx, yy) && board[yy][xx].ship) return true;
  return false;
}

function validateFinalPlacement(board, cells) {
  if (!cells.every(({ x, y }) => isInside(x, y))) return false;
  const xs = cells.map(c => c.x);
  const ys = cells.map(c => c.y);
  const vertical = xs.every(v => v === xs[0]);
  const horizontal = ys.every(v => v === ys[0]);
  if (!vertical && !horizontal) return false;
  const sorted = (vertical ? ys : xs).slice().sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) if (sorted[i] !== sorted[i - 1] + 1) return false;
  for (const { x, y } of cells) {
    if (board[y][x].ship) return false;
    for (let yy = y - 1; yy <= y + 1; yy++)
      for (let xx = x - 1; xx <= x + 1; xx++) {
        if (!isInside(xx, yy)) continue;
        const isSelf = cells.some(c => c.x === xx && c.y === yy);
        if (!isSelf && board[yy][xx].ship) return false;
      }
  }
  return true;
}

function allFleetPlaced() { return Object.values(FLEET).every(v => v === 0); }

// ========== Расстановка ==========
function handlePlacementClick(x, y) {
  if (selectedSize == null) return (statusEl.textContent = "Выберите корабль.");
  if (boardHasShipNear(playerBoard, x, y))
    return (statusEl.textContent = "Корабли не должны касаться.");
  selectedCells.push({ x, y });
  renderBoard(playerBoard, playerEl, true);
  if (selectedCells.length === selectedSize) {
    if (validateFinalPlacement(playerBoard, selectedCells)) {
      selectedCells.forEach(({ x, y }) => (playerBoard[y][x].ship = true));
      playerShips.push(clone(selectedCells));
      FLEET[selectedSize]--;
      selectedSize = null;
      selectedCells = [];
      renderBoard(playerBoard, playerEl, true);
      updateShipButtons();
      if (allFleetPlaced()) startBtn.disabled = false;
      statusEl.textContent = "Корабль установлен.";
    } else {
      selectedCells = [];
      renderBoard(playerBoard, playerEl, true);
      statusEl.textContent = "Ошибка: по прямой и без касаний.";
    }
  }
}

function updateShipButtons() {
  shipBtnsBox.innerHTML = "";
  Object.entries(FLEET)
    .sort((a, b) => b[0] - a[0])
    .forEach(([len, count]) => {
      const btn = document.createElement("button");
      btn.dataset.size = String(len);
      btn.textContent = `${len}-клеточный × ${count}`;
      if (count === 0) btn.disabled = true;
      btn.addEventListener("click", () => {
        if (FLEET[len] === 0) return;
        selectedSize = Number(len);
        selectedCells = [];
        statusEl.textContent = `Выбран ${len}-клеточный корабль.`;
        renderBoard(playerBoard, playerEl, true);
      });
      shipBtnsBox.appendChild(btn);
    });
}

// Авторасстановка игрока
autoBtn.addEventListener("click", () => {
  Object.keys(FLEET).forEach(k => (FLEET[k] = 0));
  playerBoard = makeEmptyBoard();
  playerShips = [];
  const sizes = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  for (const len of sizes) {
    let placed = false;
    while (!placed) {
      const dir = Math.random() < 0.5 ? "h" : "v";
      const x0 = Math.floor(Math.random() * SIZE);
      const y0 = Math.floor(Math.random() * SIZE);
      const cells = [];
      for (let i = 0; i < len; i++) {
        const x = dir === "h" ? x0 + i : x0;
        const y = dir === "v" ? y0 + i : y0;
        if (!isInside(x, y)) { cells.length = 0; break; }
        cells.push({ x, y });
      }
      if (!cells.length) continue;
      if (validateFinalPlacement(playerBoard, cells)) {
        cells.forEach(({ x, y }) => (playerBoard[y][x].ship = true));
        playerShips.push(cells);
        placed = true;
      }
    }
  }
  renderBoard(playerBoard, playerEl, true);
  startBtn.disabled = false;
  statusEl.textContent = "Корабли расставлены автоматически!";
});

// Авторасстановка соперника
function autoPlaceComputer() {
  const sizes = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  for (const len of sizes) {
    let placed = false;
    while (!placed) {
      const dir = Math.random() < 0.5 ? "h" : "v";
      const x0 = Math.floor(Math.random() * SIZE);
      const y0 = Math.floor(Math.random() * SIZE);
      const cells = [];
      for (let i = 0; i < len; i++) {
        const x = dir === "h" ? x0 + i : x0;
        const y = dir === "v" ? y0 + i : y0;
        if (!isInside(x, y)) { cells.length = 0; break; }
        cells.push({ x, y });
      }
      if (!cells.length) continue;
      if (validateFinalPlacement(computerBoard, cells)) {
        cells.forEach(({ x, y }) => (computerBoard[y][x].ship = true));
        computerShips.push(cells);
        placed = true;
      }
    }
  }
}

// ========== Кубики ==========
startBtn.addEventListener("click", () => {
  if (!allFleetPlaced()) return (statusEl.textContent = "Расставьте корабли.");
  autoPlaceComputer();
  phase = "dice";
  diceBox.style.display = "flex";
  statusEl.textContent = "Бросьте кубики, чтобы определить, кто ходит первым.";
  if (timerEl) timerEl.style.display = "none";
});

rollBtn.addEventListener("click", () => {
  if (phase !== "dice") return;
  rollBtn.disabled = true;

  let tick = 0, finalP = 1, finalC = 1;
  const interval = setInterval(() => {
    finalP = Math.floor(Math.random() * 6) + 1;
    finalC = Math.floor(Math.random() * 6) + 1;
    diceResult.textContent = `Вы: ${finalP}, Соперник: ${finalC}`;
    tick++;
    if (tick >= 10) {
      clearInterval(interval);
      const playerStarts = finalP >= finalC;
      diceResult.textContent += playerStarts ? " → Вы начинаете!" : " → Соперник начинает!";
      startCountdown(playerStarts);
    }
  }, 100);
});

function startCountdown(playerStarts) {
  let n = 3;
  statusEl.textContent = `Начинаем через ${n}...`;
  const timer = setInterval(() => {
    n--;
    if (n > 0) statusEl.textContent = `Начинаем через ${n}...`;
    else {
      clearInterval(timer);
      document.querySelectorAll("button").forEach(btn => {
        if (btn.id !== "toggleView") btn.style.display = "none";
      });
      phase = "battle";
      currentTurn = playerStarts ? "player" : "computer";
      if (playerStarts) {
        statusEl.textContent = "Ваш ход! Стреляйте по полю соперника.";
        playerEl.style.display = "none";
        compEl.style.display = "grid";
      } else {
        statusEl.textContent = "Ход соперника...";
        playerEl.style.display = "grid";
        compEl.style.display = "none";
        setTimeout(computerTurn, 1000);
      }
    }
  }, 1000);
}

// ========== Бой ==========
function markAroundKilledShip(board, shipCells) {
  for (const { x, y } of shipCells)
    for (let yy = y - 1; yy <= y + 1; yy++)
      for (let xx = x - 1; xx <= x + 1; xx++)
        if (isInside(xx, yy) && !board[yy][xx].hit && !board[yy][xx].ship)
          board[yy][xx].hit = true;
}
function isShipSunk(board, shipCells) {
  return shipCells.every(({ x, y }) => board[y][x].hit);
}

function handlePlayerShot(x, y) {
  const cell = computerBoard[y][x];
  if (cell.hit) return;
  cell.hit = true;
  
  // 🔹 Мигание клетки при выстреле игрока
  blinkCell(compEl, x, y);

  if (cell.ship) {
    statusEl.textContent = "Попадание!";
    const ship = computerShips.find(s => s.some(c => c.x === x && c.y === y));
    if (ship && isShipSunk(computerBoard, ship)) {
      markAroundKilledShip(computerBoard, ship);
      statusEl.textContent = "Корабль уничтожен!";
    }
    if (checkWin(computerBoard)) return endGame("Вы победили!");
  } else {
    statusEl.textContent = "Мимо! Теперь ход соперника.";
    currentTurn = "computer";
    setTimeout(() => {
      statusEl.textContent = "Ход соперника...";
      setTimeout(() => {
        compEl.style.display = "none";
        playerEl.style.display = "grid";
        computerTurn();
      }, 1000);
    }, 1000);
  }
}

// === Умный ИИ ===
function computerTurn() {
  if (phase !== "battle") return;

  let x, y;
  if (aiMemory.hits.length > 0) {
    if (aiMemory.direction) {
      const dir = aiMemory.direction;
      const base = aiMemory.hits[0];
      const last = aiMemory.hits[aiMemory.hits.length - 1];
      const options = dir === "h"
        ? [{ x: base.x - 1, y: base.y }, { x: last.x + 1, y: last.y }]
        : [{ x: base.x, y: base.y - 1 }, { x: base.x, y: base.y + 1 }];
      const t = options.find(c => isInside(c.x, c.y) && !playerBoard[c.y][c.x].hit);
      if (t) { x = t.x; y = t.y; }
    }
    if (x === undefined) {
      const b = aiMemory.hits[0];
      const dirs = [
        { x: b.x + 1, y: b.y },
        { x: b.x - 1, y: b.y },
        { x: b.x, y: b.y + 1 },
        { x: b.x, y: b.y - 1 },
      ];
      const candidates = dirs.filter(c => isInside(c.x, c.y) && !playerBoard[c.y][c.x].hit);
      if (candidates.length) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        x = pick.x; y = pick.y;
      }
    }
  }

  if (x === undefined) {
    do {
      x = Math.floor(Math.random() * SIZE);
      y = Math.floor(Math.random() * SIZE);
    } while (playerBoard[y][x].hit);
  }

  playerBoard[y][x].hit = true;
  
  // 🔹 Мигание клетки при выстреле ИИ
  blinkCell(playerEl, x, y);

  const cell = playerBoard[y][x];
  if (cell.ship) {
    aiMemory.hits.push({ x, y });
    const ship = playerShips.find(s => s.some(c => c.x === x && c.y === y));
    if (ship && isShipSunk(playerBoard, ship)) {
      markAroundKilledShip(playerBoard, ship);
      aiMemory = { hits: [], direction: "" };
      statusEl.textContent = "Соперник потопил ваш корабль!";
      if (checkWin(playerBoard)) return endGame("Соперник победил!");
      setTimeout(computerTurn, 1200);
    } else {
      if (aiMemory.hits.length === 2) {
        const [a, b] = aiMemory.hits;
        aiMemory.direction = (a.x === b.x) ? "v" : "h";
      }
      statusEl.textContent = "Соперник попал! Стреляет ещё...";
      setTimeout(computerTurn, 1000);
    }
  } else {
    statusEl.textContent = "Промах! Теперь ваш ход.";
    currentTurn = "player";
    setTimeout(() => {
      statusEl.textContent = "Ваш ход!";
      setTimeout(() => {
        playerEl.style.display = "none";
        compEl.style.display = "grid";
      }, 1000);
    }, 1000);
  }
}

function checkWin(board) {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (board[y][x].ship && !board[y][x].hit) return false;
  return true;
}

function endGame(msg) {
  phase = "ended";
  statusEl.textContent = msg;
  diceBox.style.display = "none";
  playerEl.style.display = "grid";
  compEl.style.display = "grid";
  toggleBtn.style.display = "inline-block";
}

// === Переключение полей ===
toggleBtn.addEventListener("click", () => {
  if (playerEl.style.display === "none") {
    playerEl.style.display = "grid";
    compEl.style.display = "none";
  } else if (compEl.style.display === "none") {
    playerEl.style.display = "none";
    compEl.style.display = "grid";
  } else {
    playerEl.style.display = "grid";
    compEl.style.display = "none";
  }
});

// Инициализация
function initGame() {
  // Сбрасываем флот в исходное состояние
  Object.assign(FLEET, { 4: 1, 3: 2, 2: 3, 1: 4 });

  playerBoard = makeEmptyBoard();
  computerBoard = makeEmptyBoard();
  playerShips = [];
  computerShips = [];
  selectedSize = null;
  selectedCells = [];
  phase = "placing";
  currentTurn = null;
  aiMemory = { hits: [], direction: "" };
  lastShot = { x: -1, y: -1, board: null };

  renderBoard(playerBoard, playerEl, true);
  renderBoard(computerBoard, compEl, false);
  updateShipButtons();
  startBtn.disabled = true;
  toggleBtn.style.display = "none";
  diceBox.style.display = "none";

  statusEl.textContent = "Расставьте корабли вручную или нажмите «Авторасстановка».";
}

initGame();
