/* style.css — оформление игры "Морской бой" + экран выбора режима */
:root{
  --cell: 38px;
  --gap: 2px;
  --pad: 6px;
  --border: 3px;

  --bg1:#003566;
  --bg2:#001d3d;
  --my-ship:#1f6feb;
  --select:#ffd60a;
  --hit:#c62828;
  --miss:rgba(255,255,255,.35);
  --grid:rgba(255,255,255,.12);
  --line:rgba(255,255,255,.25);
  --panel:#00509e;
  --panel-active:#ffc300;
}

*{ box-sizing:border-box; }
html,body{
  margin:0; padding:0;
  font-family: "Segoe UI", system-ui, sans-serif;
  color:#fff;
  background: radial-gradient(100% 100% at 50% 0%, var(--bg1) 0%, var(--bg2) 100%);
  min-height: 100vh;
}

h1{ margin:10px 8px; text-align:center; }

#status{
  text-align:center;
  margin:8px auto 12px;
  font-size:18px;
  max-width:900px;
}

/* 🔹 Экран выбора режима */
.mode-select{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:14px;
  margin-top:60px;
}
.mode-select button{
  background:var(--panel);
  color:#fff;
  border:none;
  padding:14px 22px;
  border-radius:12px;
  font-size:18px;
  cursor:pointer;
  min-width:220px;
  transition:.2s;
}
.mode-select button:hover{ background:var(--panel-active); color:#000; }

#setup-panel{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:10px;
  margin-bottom:8px;
}

#ship-buttons{
  display:flex; flex-wrap:wrap; gap:8px;
  justify-content:center;
}

#ship-buttons button{
  background:var(--panel);
  border:none; color:#fff;
  padding:8px 12px;
  border-radius:10px;
  cursor:pointer;
  font-size:15px;
  min-width:160px;
}
#ship-buttons button.active{
  background:var(--panel-active);
  color:#000;
}
#ship-buttons button:disabled{
  opacity:.5; cursor:not-allowed;
}

.setup-actions{
  display:flex; gap:10px; justify-content:center;
}

.setup-actions button, .footer-actions button, #rollBtn{
  background:var(--panel);
  border:none; color:#fff;
  padding:10px 14px; border-radius:10px;
  cursor:pointer; font-size:16px;
}
.setup-actions button:disabled{ opacity:.5; cursor:not-allowed; }

.dice{
  display:flex; gap:12px; justify-content:center; align-items:center;
  margin:8px 0 12px;
}
#timer{
  width:44px; height:44px;
  border-radius:10px;
  border:2px solid var(--line);
  display:flex; align-items:center; justify-content:center;
  font-size:18px;
}
#dice-result{ min-width:160px; text-align:left; }

#boards{
  position:relative;
  width: calc(10*var(--cell) + 9*var(--gap) + 2*var(--pad) + 2*var(--border));
  height: calc(10*var(--cell) + 9*var(--gap) + 2*var(--pad) + 2*var(--border));
  margin: 0 auto 14px;
}

.board{
  position:absolute; inset:0;
  display:grid;
  grid-template-columns: repeat(10, var(--cell));
  grid-template-rows: repeat(10, var(--cell));
  gap:var(--gap);
  padding:var(--pad);
  border:var(--border) solid var(--grid);
  border-radius:14px;
  background:rgba(255,255,255,.04);
}

.cell{
  width:var(--cell); height:var(--cell);
  background: rgba(255,255,255,.10);
  border: 1px solid var(--line);
  cursor:pointer;
  transition: transform .05s ease;
  position: relative;
}
.cell:active{ transform:scale(.98); }

.cell.ship{ background: var(--my-ship); }
.cell.hit{ background: var(--hit); }
.cell.miss{ background: var(--miss); }
.cell.preview { background-color: rgba(0, 200, 255, 0.6); outline: 2px solid #00c8ff; }

/* Мигание клеток (как было) */
.cell.blink { animation: blink-animation 0.5s ease-in-out 2 !important; z-index:10; }
@keyframes blink-animation {
  0%,100%{opacity:1;transform:scale(1);}
  50%{opacity:.7;transform:scale(1.15);}
}

.footer-actions{ display:flex; justify-content:center; margin-bottom:18px; }

@media (max-width:520px){
  :root{ --cell:30px; }
  #status{ font-size:16px; }
}
