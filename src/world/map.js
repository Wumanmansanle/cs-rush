import { TILE, VIEW_W, VIEW_H, COLORS, WALL_H, CRATE_H } from '../config.js';

export const TILECODE = { FLOOR: 0, WALL: 1, CRATE: 2, SITE_A: 3, SITE_B: 4, SPAWN_T: 5, SPAWN_CT: 6 };
const { FLOOR, WALL, CRATE, SITE_A, SITE_B, SPAWN_T, SPAWN_CT } = TILECODE;

export class GameMap {
  constructor(def) {
    this.def = def;
    this.cols = def.cols; this.rows = def.rows;
    this.w = def.cols * TILE; this.h = def.rows * TILE;
    this.grid = [];
    for (let r = 0; r < this.rows; r++) this.grid.push(new Array(this.cols).fill(FLOOR));
    const fill = (c0, r0, c1, r1, code) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.inB(c, r)) this.grid[r][c] = code; };
    def.paint(fill);
    this.sites = { A: this._site(def.sites.A), B: this._site(def.sites.B) };
    this.spawnRects = { T: this._rect(def.spawns.T), CT: this._rect(def.spawns.CT) };
  }
  _rect(a) { return { c0: a[0], r0: a[1], c1: a[2], r1: a[3] }; }
  inB(c, r) { return c >= 0 && r >= 0 && c < this.cols && r < this.rows; }
  _site(a) { const x = a[0] * TILE, y = a[1] * TILE, w = (a[2] - a[0] + 1) * TILE, h = (a[3] - a[1] + 1) * TILE; return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 }; }
  tile(c, r) { return this.inB(c, r) ? this.grid[r][c] : WALL; }
  solid(c, r) { const t = this.tile(c, r); return t === WALL || t === CRATE; }
  walkable(c, r) { return this.inB(c, r) && !this.solid(c, r); }
  siteAt(x, y) { for (const k of ['A', 'B']) { const s = this.sites[k]; if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return k; } return null; }
  spawns(team, count) {
    const sr = this.spawnRects[team]; const pts = [];
    const cy = (sr.r0 + sr.r1 + 1) / 2 * TILE;
    const width = sr.c1 - sr.c0 + 1;
    for (let i = 0; i < count; i++) { const t = (i + 0.5) / count; pts.push({ x: (sr.c0 + width * t) * TILE, y: cy }); }
    return pts;
  }
  nearestWalkable(c, r) {
    if (this.walkable(c, r)) return { c, r };
    for (let rad = 1; rad < 8; rad++)
      for (let dr = -rad; dr <= rad; dr++)
        for (let dc = -rad; dc <= rad; dc++)
          if (this.walkable(c + dc, r + dr)) return { c: c + dc, r: r + dr };
    return { c, r };
  }
  _bounds(cam) {
    const vw = VIEW_W / (cam.zoom || 1), vh = VIEW_H / (cam.zoom || 1);
    return [
      Math.max(0, Math.floor(cam.x / TILE)), Math.min(this.cols - 1, Math.ceil((cam.x + vw) / TILE)),
      Math.max(0, Math.floor(cam.y / TILE)), Math.min(this.rows - 1, Math.ceil((cam.y + vh) / TILE)),
    ];
  }
  // 地面 pass：只画地板/标记/ AO，立体块交给深度排序 pass
  renderGround(g, cam) {
    const [c0, c1, r0, r1] = this._bounds(cam);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (this.solid(c, r)) continue;
      const t = this.grid[r][c]; const x = c * TILE - cam.x, y = r * TILE - cam.y;
      const hsh = (c * 7 + r * 13) % 5;
      g.rect(x, y, TILE, TILE, (c + r) & 1 ? COLORS.floor : COLORS.floorAlt);
      if (hsh === 0) { g.rect(x + 3, y + 5, 1, 1, 'rgba(0,0,0,0.10)'); g.rect(x + 10, y + 11, 1, 1, 'rgba(255,255,255,0.12)'); }
      else if (hsh === 1) g.rect(x + 6, y + 9, 2, 1, 'rgba(0,0,0,0.07)');
      else if (hsh === 2) g.rect(x + 12, y + 4, 1, 2, 'rgba(255,255,255,0.10)');
      else if (hsh === 3) g.rect(x + 2, y + 12, 3, 1, 'rgba(0,0,0,0.05)');
      if (this.solid(c, r - 1)) g.rect(x, y, TILE, 2, 'rgba(0,0,0,0.18)');
      if (this.solid(c, r + 1)) g.rect(x, y + TILE - 2, TILE, 2, 'rgba(0,0,0,0.10)');
      if (this.solid(c - 1, r)) g.rect(x, y, 2, TILE, 'rgba(0,0,0,0.14)');
      if (this.solid(c + 1, r)) g.rect(x + TILE - 2, y, 2, TILE, 'rgba(0,0,0,0.14)');
      if (t === SITE_A) g.rect(x, y, TILE, TILE, 'rgba(184,86,63,0.28)');
      else if (t === SITE_B) g.rect(x, y, TILE, TILE, 'rgba(63,127,184,0.28)');
      else if (t === SPAWN_T) g.rect(x, y, TILE, TILE, 'rgba(207,143,79,0.14)');
      else if (t === SPAWN_CT) g.rect(x, y, TILE, TILE, 'rgba(79,143,206,0.14)');
    }
    for (const k of ['A', 'B']) {
      const s = this.sites[k]; const sx = s.x - cam.x, sy = s.y - cam.y;
      g.stroke(sx + 1, sy + 1, s.w - 2, s.h - 2, k === 'A' ? 'rgba(232,138,111,0.7)' : 'rgba(111,168,232,0.7)', 1);
      g.text(k, s.cx - cam.x, s.cy - cam.y, { color: k === 'A' ? '#e88a6f' : '#6fa8e8', size: 22, align: 'center', baseline: 'middle', bold: true });
    }
    for (const [c, r, t] of (this.def.labels || [])) {
      g.text(t, c * TILE - cam.x, r * TILE - cam.y, { color: 'rgba(242,234,216,0.5)', size: 7, align: 'center', font: '"Microsoft YaHei", sans-serif' });
    }
  }
  solidBlocks(cam) {
    const [c0, c1, r0, r1] = this._bounds(cam);
    const list = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const t = this.grid[r][c];
      if (t === WALL || t === CRATE) list.push({ c, r, t, y: (r + 1) * TILE });
    }
    return list;
  }
  // 伪 3D 立体块：顶面 + 南面 + 东侧阴影 + 地面投影
  drawBlock(g, cam, c, r, t) {
    const x = c * TILE - cam.x, y = r * TILE - cam.y;
    const H = t === WALL ? WALL_H : CRATE_H;
    g.rect(x, y + TILE, TILE, 3, 'rgba(0,0,0,0.22)');
    if (t === WALL) {
      g.rect(x, y + TILE - H, TILE, H, '#4a3c28');
      g.rect(x, y + TILE - H, TILE, 1, 'rgba(0,0,0,0.35)');
      for (let i = 0; i < TILE; i += 8) g.rect(x + i, y + TILE - H + 2, 1, H - 3, 'rgba(0,0,0,0.18)');
      g.rect(x, y - H, TILE, TILE, COLORS.wall);
      g.rect(x, y - H, TILE, 2, COLORS.wallTop);
      g.rect(x, y - H + 8, TILE, 1, 'rgba(0,0,0,0.16)');
      g.rect(x + ((r % 2) ? 4 : 10), y - H + 3, 1, 5, 'rgba(0,0,0,0.13)');
      g.rect(x + TILE - 2, y - H, 2, TILE, 'rgba(0,0,0,0.18)');
    } else {
      g.rect(x + 1, y + TILE - H, TILE - 2, H, '#6a5230');
      g.rect(x + 1, y + TILE - H, TILE - 2, 1, 'rgba(0,0,0,0.3)');
      g.rect(x + 1, y + 1 - H, TILE - 2, TILE - 2, COLORS.crate);
      g.rect(x + 1, y + 1 - H, TILE - 2, 2, COLORS.crateTop);
      g.rect(x + 1, y + 6 - H, TILE - 2, 1, 'rgba(0,0,0,0.18)');
      g.rect(x + 1, y + 11 - H, TILE - 2, 1, 'rgba(0,0,0,0.18)');
      g.rect(x + TILE - 3, y + 1 - H, 2, TILE - 2, 'rgba(0,0,0,0.15)');
      g.line(x + 3, y + 3 - H, x + TILE - 3, y + TILE - 3 - H, COLORS.crateTop, 1);
    }
  }
}
