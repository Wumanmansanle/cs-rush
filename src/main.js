import { Game } from './game/game.js';
import { VIEW_W, VIEW_H } from './config.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__game = game;

// 分辨率自适应：启动即适配，并每 5 秒检测窗口尺寸变化
function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ssaa = dpr === 1 ? 2 : 1; // 低 DPR 屏超采样抗锯齿
  const scale = Math.min(4, dpr * ssaa);
  const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const cssW = Math.floor(VIEW_W * s), cssH = Math.floor(VIEW_H * s);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.max(1, Math.round(cssW * scale));
  canvas.height = Math.max(1, Math.round(cssH * scale));
}
let lastW = window.innerWidth, lastH = window.innerHeight;
fitCanvas();
window.addEventListener('resize', fitCanvas);
setInterval(() => {
  const w = window.innerWidth, h = window.innerHeight;
  if (w !== lastW || h !== lastH) { lastW = w; lastH = h; fitCanvas(); }
}, 5000);

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;

function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.25) dt = 0.25;
  acc += dt;
  while (acc >= STEP) { game.update(STEP); acc -= STEP; }
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
