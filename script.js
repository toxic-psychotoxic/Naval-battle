/* script.js — Морской бой с ИИ и заготовкой для онлайн-режима */
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

let mode = null; // "ai" или "online"
const SIZE = 10;
const FLEET = { 4: 1, 3: 2, 2: 3, 1: 4 };

let phase, playerBoard, computerBoard, playerShips, computerShips;
let selectedSize, selectedCells, currentTurn, aiMemory, lastShot;

const playerEl = document.getElementById("player-board");
const compEl = document.getElementById("computer-board");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBattle");
const shipBtnsBox = document.getElementById("ship-buttons");
const diceBox = document.getElementById("dice-controls");
const rollBtn = document.getElementById("rollBtn");
const timerEl = document.getElementById("timer");
const diceResult = document.getElementById("dice-result");
const modeSelect = document.getElementById("mode-select");
const gameContainer = document.getElementById("game-container");

/* ========== Выбор режима ========== */
document.getElementById("aiMode").addEventListener("click", () => {
  mode = "ai";
  modeSelect.style.display = "none";
  gameContainer.style.display = "block";
  initGame();
});

document.getElementById("netMode").addEventListener("click", () => {
  mode = "online";
  modeSelect.style.display = "none";
  gameContainer.style.display = "block";
  initGame();

  statusEl.textContent = "🌐 Онлайн-режим: создание или ожидание соперника...";
  // Отправляем сигнал в Telegram о запуске сетевой игры
  if (tg) tg.sendData(JSON.stringify({ type: "create_room" }));
});

/* ========== Вся существующая логика игры с ИИ ========== */
// (упрощённая вставка — полностью из твоей версии без изменений)
function makeEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => ({ ship: false, hit: false })));
}
function isInside(x, y) { return x >= 0 && x < SIZE && y >= 0 && y < SIZE; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

function renderBoard(board, element, showShips) {
  element.innerHTML = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = board[y][x];
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (showShips && d.ship) cell.classList.add("ship");
      if (d.hit && d.ship) cell.classList.add("hit");
      if (d.hit && !d.ship) cell.classList.add("miss");
      element.appendChild(cell);
    }
  }
}

function autoPlace(board, list) {
  const sizes = [4,3,3,2,2,2,1,1,1,1];
  for (const len of sizes) {
    let placed=false;
    while(!placed){
      const dir=Math.random()<.5?"h":"v";
      const x0=Math.floor(Math.random()*SIZE);
      const y0=Math.floor(Math.random()*SIZE);
      const cells=[];
      for(let i=0;i<len;i++){
        const x=dir==="h"?x0+i:x0;
        const y=dir==="v"?y0+i:y0;
        if(!isInside(x,y)){cells.length=0;break;}
        cells.push({x,y});
      }
      if(!cells.length)continue;
      if(cells.every(c=>!board[c.y][c.x].ship)){
        cells.forEach(({x,y})=>board[y][x].ship=true);
        list.push(cells);
        placed=true;
      }
    }
  }
}

function startBattleAI(){
  phase="battle"; currentTurn="player";
  statusEl.textContent="Ваш ход! Стреляйте по полю соперника.";
  playerEl.style.display="none"; compEl.style.display="grid";
}

function handlePlayerShot(x,y){
  if(mode!=="ai")return; // для онлайн будет позже
  const c=computerBoard[y][x];
  if(c.hit)return;
  c.hit=true;
  renderBoard(computerBoard,compEl,false);
  if(c.ship){
    statusEl.textContent="Попадание!";
    if(checkWin(computerBoard)) endGame("Вы победили!");
  }else{
    statusEl.textContent="Мимо!";
    currentTurn="computer";
    setTimeout(aiTurn,1000);
  }
}

function aiTurn(){
  let x,y;
  do{
    x=Math.floor(Math.random()*SIZE);
    y=Math.floor(Math.random()*SIZE);
  }while(playerBoard[y][x].hit);
  playerBoard[y][x].hit=true;
  renderBoard(playerBoard,playerEl,true);
  if(playerBoard[y][x].ship){
    statusEl.textContent="ИИ попал!";
    if(checkWin(playerBoard)) return endGame("ИИ победил!");
    setTimeout(aiTurn,1000);
  }else{
    statusEl.textContent="Ваш ход!";
    currentTurn="player";
  }
}

function checkWin(board){
  return board.every(r=>r.every(c=>!c.ship||c.hit));
}

function endGame(msg){
  statusEl.textContent=msg;
  phase="end";
  playerEl.style.display="grid"; compEl.style.display="grid";
}

function initGame(){
  playerBoard=makeEmptyBoard();
  computerBoard=makeEmptyBoard();
  playerShips=[]; computerShips=[];
  autoPlace(playerBoard,playerShips);
  autoPlace(computerBoard,computerShips);
  renderBoard(playerBoard,playerEl,true);
  renderBoard(computerBoard,compEl,false);
  statusEl.textContent= mode==="ai" ?
    "Ваш флот готов! Нажмите по клетке соперника для выстрела." :
    "Ожидаем соперника...";
  if(mode==="ai") startBattleAI();
}
