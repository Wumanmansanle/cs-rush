import { VIEW_W, VIEW_H } from '../config.js';
import { clamp } from './math.js';

export class Camera {
  constructor() { this.x = 0; this.y = 0; this.zoom = 1; }
  follow(tx, ty, mapW, mapH, dt = 1) {
    const vw = VIEW_W / this.zoom, vh = VIEW_H / this.zoom;
    const gx = clamp(tx - vw / 2, 0, Math.max(0, mapW - vw));
    const gy = clamp(ty - vh / 2, 0, Math.max(0, mapH - vh));
    const k = Math.min(1, dt * 10);
    this.x += (gx - this.x) * k;
    this.y += (gy - this.y) * k;
  }
  worldToScreen(x, y) { return [(x - this.x) * this.zoom, (y - this.y) * this.zoom]; }
  screenToWorld(x, y) { return [x / this.zoom + this.x, y / this.zoom + this.y]; }
}
