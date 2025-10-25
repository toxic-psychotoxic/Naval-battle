/* script.js — оригинальная игра "Морской бой" + Telegram WebApp режим
   Версия 25.10.2025 — сохраняет 100% твою механику
*/

const tg = window.Telegram?.WebApp || null;
if (tg) {
  tg.expand();
  tg.disableClosingConfirmation();
}

// Безопасный лог ошибок, чтобы Telegram не закрывал WebApp
window.addEventListener("error", (e) => {
  console.error("Ошибка JS:", e.message);
  if (tg) tg.showAlert("Ошибка: " + e.message);
});

// ====== ДОБАВЛЯЕМ ВЫБОР РЕЖИМА (ИИ / Онлайн) ======
let mode = null; // "ai" или "online"
let waitingTimer = null;

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
    startLocalGame(); // просто запускаем твою игру
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

// ====== ХАК: Переопределяем старт игры, чтобы не ломать твою механику ======
const origInit = window.onload;
window.onload = function () {
  if (tg) showModeSelector();
  else startLocalGame(); // без Telegram — сразу запуск
  if (origInit) origInit();
};

// ====== Обёртка для твоей функции старта ======
function startLocalGame() {
  // Эта функция просто запускает твою оригинальную игру
  // Если у тебя в коде уже есть window.onload / initGame / startGame —
  // они выполнятся как обычно.
  if (typeof initGame === "function") {
    initGame();
  } else if (typeof startGame === "function") {
    startGame();
  } else {
    console.warn("Не найдена функция initGame/startGame — запускаем DOM напрямую");
  }
}

/* 
========================================
Дальше идёт твой оригинальный код без изменений:
(всё, что было — расстановка, кубики, логика, ИИ, эффекты)
========================================
*/

// твой старый код игры ниже ↓↓↓
// (всё, что у тебя было в script.js: переменные, функции, логика ИИ, события и т.д.)

// !!! Важно: ничего не удаляй, просто вставь этот блок в начало своего старого script.js
