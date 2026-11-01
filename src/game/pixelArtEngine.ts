/**
 * MOTOR GRÁFICO 2.5D HD — ILUMINAÇÃO VOLUMÉTRICA, SOMBREADORES RGBA 32-BITS E ANTI-ALIASING SUAVE
 * Ambientação Oficial: Amazônia — Chamado Ribeirinho Acreano (Cruzeiro do Sul / Vale do Juruá - Acre)
 *
 * Características Visuais 2.5D HD:
 * - Zero blocos quadrados de pixel art: todas as superfícies, folhagens, construções, rios, veículos,
 *   personagens e retratos utilizam curvas suaves, gradientes radiais/lineares 32-bits RGBA, oclusão de
 *   ambiente (ambient occlusion), relevo 2.5D em perspectiva 3/4 e iluminação tropical quente.
 * - Cache de texturas HD em alta densidade (2x supersampling por tile de 48×48 px) para 60 FPS constantes.
 */

import { Direction, ToolId } from './rules';
import { TileType, MapBuilding } from '../data/maps';
import { CROPS_DATA } from '../data/crops';
import { AnimalCategoryId } from '../data/animals';

export const TILE_PX = 48;

export interface TileNeighbors {
  n: TileType;
  s: TileType;
  e: TileType;
  w: TileType;
}

const hdTileCache = new Map<string, HTMLCanvasElement>();

function enableHD(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

function hash2d(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function getOrCreateHDBitmap(
  key: string,
  logicalW: number,
  logicalH: number,
  drawer: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const existing = hdTileCache.get(key);
  if (existing) return existing;

  const scale = 2; // Supersampling 2x para nitidez 2.5D HD
  const c = document.createElement('canvas');
  c.width = logicalW * scale;
  c.height = logicalH * scale;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.scale(scale, scale);
    enableHD(ctx);
    drawer(ctx, logicalW, logicalH);
  }
  hdTileCache.set(key, c);
  return c;
}

function drawSoftShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha = 0.34
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / Math.max(1, rx));
  const grad = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
  grad.addColorStop(0, `rgba(12, 8, 4, ${alpha})`);
  grad.addColorStop(0.65, `rgba(12, 8, 4, ${alpha * 0.55})`);
  grad.addColorStop(1, 'rgba(12, 8, 4, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFoliageSphere25D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  darkColor: string,
  midColor: string,
  lightColor: string,
  rimColor?: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / Math.max(1, rx));
  const grad = ctx.createRadialGradient(-rx * 0.28, -rx * 0.32, rx * 0.08, 0, 0, rx);
  grad.addColorStop(0, lightColor);
  grad.addColorStop(0.55, midColor);
  grad.addColorStop(1, darkColor);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();

  if (rimColor) {
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// 1. TERRENOS 2.5D HD COM BORDAS ORGÂNICAS E TEXTURAS PINTADAS
// ============================================================================

export function drawTerrainTile(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  screenX: number,
  screenY: number,
  gridX: number,
  gridY: number,
  animTick: number,
  neighbors?: TileNeighbors
) {
  enableHD(ctx);
  const variant = Math.abs(gridX * 7 + gridY * 13) % 4;
  const waterPhase =
    tile === 'water_deep' || tile === 'water_shallow'
      ? Math.floor(animTick * 4 + (gridX + gridY) % 3) % 6
      : 0;
  const nKey = neighbors
    ? `${neighbors.n[0]}${neighbors.s[0]}${neighbors.e[0]}${neighbors.w[0]}`
    : 'none';
  const cacheKey = `hd25d_${tile}_v${variant}_w${waterPhase}_${nKey}`;

  const bmp = getOrCreateHDBitmap(cacheKey, TILE_PX, TILE_PX, (tCtx, w, h) => {
    renderTerrain25D(tCtx, tile, w, h, variant, waterPhase, neighbors);
  });

  if (bmp) {
    ctx.drawImage(bmp, screenX, screenY, TILE_PX, TILE_PX);
  }
}

function renderTerrain25D(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  w: number,
  h: number,
  variant: number,
  waterPhase: number,
  neighbors?: TileNeighbors
) {
  switch (tile) {
    case 'grass':
    case 'tree_solid': {
      // Base uniforme nas bordas para conexão 100% contínua entre tiles adjacentes
      ctx.fillStyle = '#467d30';
      ctx.fillRect(0, 0, w, h);

      // Manchas aveludadas internas de grama tropical 2.5D
      for (let i = 0; i < 5; i++) {
        const rx = 8 + hash2d(variant * 11 + i, 1) * (w - 16);
        const ry = 8 + hash2d(variant * 17 + i, 2) * (h - 16);
        const rad = 8 + (i % 3) * 4;
        const patchGrad = ctx.createRadialGradient(rx, ry, 1, rx, ry, rad);
        patchGrad.addColorStop(0, i % 2 === 0 ? 'rgba(116, 179, 75, 0.38)' : 'rgba(42, 82, 26, 0.28)');
        patchGrad.addColorStop(1, 'rgba(70, 125, 48, 0)');
        ctx.fillStyle = patchGrad;
        ctx.beginPath();
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lâminas de capim curvadas em 2.5D (curvas Bézier suaves)
      for (let b = 0; b < 6; b++) {
        const bx = 6 + ((b * 9 + variant * 7) % (w - 12));
        const by = 10 + ((b * 11 + variant * 5) % (h - 14));
        ctx.strokeStyle = b % 2 === 0 ? '#74ba4c' : '#2e591d';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 2, by - 5, bx - 4, by - 7);
        ctx.moveTo(bx + 1, by);
        ctx.quadraticCurveTo(bx + 3, by - 4, bx + 5, by - 6);
        ctx.stroke();
      }

      // Pequenas flores silvestres amazônicas ocasionais
      if (variant === 1 || variant === 3) {
        const fx = variant === 1 ? 15 : 33;
        const fy = variant === 1 ? 31 : 16;
        ctx.fillStyle = variant === 1 ? '#ffdf6b' : '#ff9eb5';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fx - 0.5, fy - 0.5, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'dirt_path': {
      // Base uniforme nas bordas para estrada/trilha contínua sem costura entre tiles
      ctx.fillStyle = '#a47043';
      ctx.fillRect(0, 0, w, h);

      // Sombreamento radial orgânico interno e seixos arredondados
      const centerGlow = ctx.createRadialGradient(w * 0.5, h * 0.5, 2, w * 0.5, h * 0.5, w * 0.48);
      centerGlow.addColorStop(0, 'rgba(196, 142, 90, 0.28)');
      centerGlow.addColorStop(1, 'rgba(164, 112, 67, 0)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 6; i++) {
        const sx = 7 + hash2d(i + variant * 9, 4) * (w - 14);
        const sy = 7 + hash2d(i + variant * 13, 8) * (h - 14);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(214, 168, 120, 0.34)' : 'rgba(92, 55, 26, 0.28)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 4.5, 2.6, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bordas orgânicas chanfradas de grama onde encontra terreno natural
      const isGrass = (t?: TileType) => t === 'grass' || t === 'tree_solid';
      ctx.fillStyle = '#477d31';
      if (neighbors && isGrass(neighbors.n)) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(w * 0.5, 8, w, 0);
        ctx.closePath();
        ctx.fill();
      }
      if (neighbors && isGrass(neighbors.s)) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.quadraticCurveTo(w * 0.5, h - 8, w, h);
        ctx.closePath();
        ctx.fill();
      }
      if (neighbors && isGrass(neighbors.w)) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(8, h * 0.5, 0, h);
        ctx.closePath();
        ctx.fill();
      }
      if (neighbors && isGrass(neighbors.e)) {
        ctx.beginPath();
        ctx.moveTo(w, 0);
        ctx.quadraticCurveTo(w - 8, h * 0.5, w, h);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'farm_plot': {
      // Canteiro agrícola unificado sem costuras de grade
      ctx.fillStyle = '#633c1e';
      ctx.fillRect(0, 0, w, h);

      for (const fy of [14, 34]) {
        const ridgeGrad = ctx.createLinearGradient(0, fy - 5, 0, fy + 5);
        ridgeGrad.addColorStop(0, '#7a4c29');
        ridgeGrad.addColorStop(0.5, '#59351a');
        ridgeGrad.addColorStop(1, '#422510');
        ctx.fillStyle = ridgeGrad;
        ctx.beginPath();
        ctx.roundRect(2, fy - 4, w - 4, 8, 4);
        ctx.fill();
      }

      // Moldura de contenção APENAS no perímetro externo do canteiro
      ctx.fillStyle = '#3d220e';
      if (neighbors && neighbors.n !== 'farm_plot') ctx.fillRect(0, 0, w, 3);
      if (neighbors && neighbors.s !== 'farm_plot') ctx.fillRect(0, h - 3, w, 3);
      if (neighbors && neighbors.w !== 'farm_plot') ctx.fillRect(0, 0, 3, h);
      if (neighbors && neighbors.e !== 'farm_plot') ctx.fillRect(w - 3, 0, 3, h);
      break;
    }

    case 'road_asphalt': {
      ctx.fillStyle = '#4e555e';
      ctx.fillRect(0, 0, w, h);

      if (neighbors && neighbors.n !== 'road_asphalt') {
        ctx.fillStyle = '#9ea6b0';
        ctx.fillRect(0, 0, w, 4);
      }
      if (neighbors && neighbors.s !== 'road_asphalt') {
        ctx.fillStyle = '#34383d';
        ctx.fillRect(0, h - 4, w, 4);
      }

      if (variant % 2 === 0) {
        ctx.fillStyle = '#f5c842';
        ctx.beginPath();
        ctx.roundRect(14, h * 0.5 - 2, 20, 4, 2);
        ctx.fill();
      }
      break;
    }

    case 'tall_grass': {
      renderTerrain25D(ctx, 'grass', w, h, variant, 0);
      for (let i = 0; i < 5; i++) {
        const bx = 8 + ((i * 8 + variant * 5) % (w - 16));
        const by = 12 + ((i * 9 + variant * 7) % (h - 16));
        drawFoliageSphere25D(ctx, bx, by, 6, 4.5, '#1d4714', '#3d7d29', '#7ccc52');
      }
      break;
    }

    case 'sand_bank': {
      // Praia fluvial contínua sem costura entre tiles
      ctx.fillStyle = '#dec08a';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 5; i++) {
        const sx = 8 + hash2d(i * 11 + variant, 12) * (w - 16);
        const sy = 8 + hash2d(i * 17 + variant, 14) * (h - 16);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(245, 224, 184, 0.45)' : 'rgba(194, 158, 103, 0.38)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'wood_floor':
    case 'bridge_road': {
      ctx.fillStyle = '#7a4b24';
      ctx.fillRect(0, 0, w, h);

      for (let py = 0; py < h; py += 12) {
        const plankGrad = ctx.createLinearGradient(0, py, 0, py + 11);
        plankGrad.addColorStop(0, '#b57642');
        plankGrad.addColorStop(0.5, '#965d2e');
        plankGrad.addColorStop(1, '#663c1a');
        ctx.fillStyle = plankGrad;
        ctx.fillRect(1, py + 1, w - 2, 10);
      }

      if (tile === 'bridge_road') {
        ctx.fillStyle = '#4f2c12';
        ctx.fillRect(0, 0, w, 5);
        ctx.fillRect(0, h - 5, w, 5);
        ctx.fillStyle = '#c9884d';
        ctx.fillRect(0, 1, w, 2);
        ctx.fillRect(0, h - 4, w, 2);
      }
      break;
    }

    case 'water_shallow':
    case 'water_deep': {
      // Rio contínuo sem costura de grade 48x48
      const isDeep = tile === 'water_deep';
      ctx.fillStyle = isDeep ? '#175478' : '#2b7ba3';
      ctx.fillRect(0, 0, w, h);

      const shift = (waterPhase / 6) * Math.PI * 2;
      ctx.strokeStyle = isDeep ? 'rgba(135, 215, 250, 0.35)' : 'rgba(195, 242, 255, 0.52)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      const wy1 = 14 + Math.sin(shift + variant) * 2.5;
      const wy2 = 34 + Math.cos(shift + variant) * 2.5;

      ctx.beginPath();
      ctx.moveTo(8, wy1);
      ctx.quadraticCurveTo(w * 0.5, wy1 - 4, w - 8, wy1);
      ctx.moveTo(10, wy2);
      ctx.quadraticCurveTo(w * 0.5, wy2 + 4, w - 10, wy2);
      ctx.stroke();
      break;
    }

    case 'fence': {
      renderTerrain25D(ctx, 'grass', w, h, variant, 0);
      drawSoftShadow(ctx, w * 0.5, h - 7, 22, 5, 0.32);

      // Travessas horizontais da cerca rural em madeira 2.5D
      const railGrad = ctx.createLinearGradient(0, 18, 0, 34);
      railGrad.addColorStop(0, '#b87640');
      railGrad.addColorStop(1, '#6e411c');
      ctx.fillStyle = railGrad;
      ctx.beginPath();
      ctx.roundRect(0, 17, w, 6, 2);
      ctx.roundRect(0, 29, w, 6, 2);
      ctx.fill();

      // Mourões verticais cilíndricos com topo iluminado
      for (const pxX of [8, w - 16]) {
        const postGrad = ctx.createLinearGradient(pxX, 8, pxX + 8, 8);
        postGrad.addColorStop(0, '#c7854e');
        postGrad.addColorStop(0.5, '#965d2e');
        postGrad.addColorStop(1, '#543013');
        ctx.fillStyle = postGrad;
        ctx.beginPath();
        ctx.roundRect(pxX, 9, 8, 32, 3);
        ctx.fill();
      }
      break;
    }
  }
}

// ============================================================================
// 2. ÁRVORES AMAZÔNICAS 2.5D HD (COPAS VOLUMÉTRICAS EM CAMADAS E SOMBRAS)
// ============================================================================

export type TreeKind32 =
  | 'samauma'
  | 'acai'
  | 'buriti'
  | 'cupuacu'
  | 'castanheira'
  | 'seringueira'
  | 'bananeira'
  | 'mangueira'
  | 'ipe_amarelo';

export function drawRegionalTree(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  treeType: TreeKind32 = 'samauma'
) {
  enableHD(ctx);
  const bmp = getOrCreateHDBitmap(`tree25d_${treeType}`, 96, 96, (tCtx) => {
    renderTree25D(tCtx, treeType);
  });
  if (bmp) {
    ctx.drawImage(bmp, screenX - 24, screenY - 38, 96, 96);
  }
}

function renderTree25D(
  ctx: CanvasRenderingContext2D,
  treeType: TreeKind32
) {
  // Sombra projetada no solo em 2.5D
  drawSoftShadow(ctx, 48, 78, 30, 11, 0.42);

  if (treeType === 'acai' || treeType === 'buriti' || treeType === 'bananeira') {
    // Palmeira de Açaí / Touceira de Bananeira com folhas arqueadas suaves em 2.5D
    const trunkGrad = ctx.createLinearGradient(43, 30, 53, 76);
    trunkGrad.addColorStop(0, '#a67b56');
    trunkGrad.addColorStop(0.5, '#7d5838');
    trunkGrad.addColorStop(1, '#4f351e');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(44, 77);
    ctx.quadraticCurveTo(46, 52, 46, 28);
    ctx.lineTo(51, 28);
    ctx.quadraticCurveTo(52, 52, 53, 77);
    ctx.closePath();
    ctx.fill();

    // Cachos de Açaí ou Banana sob a copa
    ctx.fillStyle = treeType === 'acai' ? '#3b1747' : '#f5c838';
    ctx.beginPath();
    ctx.arc(43, 34, 5.5, 0, Math.PI * 2);
    ctx.arc(54, 35, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Palhas tropicais em leque 2.5D
    const fronds = [
      { dx: -30, dy: -4, cy: -16 },
      { dx: 30, dy: -4, cy: -16 },
      { dx: -26, dy: 12, cy: -4 },
      { dx: 26, dy: 12, cy: -4 },
      { dx: -14, dy: -20, cy: -24 },
      { dx: 14, dy: -20, cy: -24 },
      { dx: 0, dy: 16, cy: 6 }
    ];
    for (const f of fronds) {
      const fGrad = ctx.createLinearGradient(48, 28, 48 + f.dx, 28 + f.dy);
      fGrad.addColorStop(0, '#80cf53');
      fGrad.addColorStop(0.6, '#46962b');
      fGrad.addColorStop(1, '#235714');
      ctx.strokeStyle = fGrad;
      ctx.lineWidth = treeType === 'bananeira' ? 8 : 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(48, 28);
      ctx.quadraticCurveTo(48 + f.dx * 0.55, 28 + f.cy, 48 + f.dx, 28 + f.dy);
      ctx.stroke();
    }
    return;
  }

  // Tronco robusto com sapopembas (raízes tabulares amazônicas) em relevo 2.5D
  const trunkGrad = ctx.createLinearGradient(36, 36, 60, 78);
  trunkGrad.addColorStop(0, '#9c683e');
  trunkGrad.addColorStop(0.5, '#734827');
  trunkGrad.addColorStop(1, '#422611');
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(34, 78);
  ctx.quadraticCurveTo(41, 64, 42, 38);
  ctx.lineTo(54, 38);
  ctx.quadraticCurveTo(55, 64, 62, 78);
  ctx.closePath();
  ctx.fill();

  if (treeType === 'seringueira') {
    // Corte de sangria e tigela de látex
    ctx.strokeStyle = '#fff5e4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(43, 54);
    ctx.lineTo(52, 61);
    ctx.stroke();
    ctx.fillStyle = '#c94a29';
    ctx.beginPath();
    ctx.arc(52, 64, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const isIpe = treeType === 'ipe_amarelo';
  const darkC = isIpe ? '#9e6808' : '#1e4a18';
  const midC = isIpe ? '#e3a514' : '#3a7d2c';
  const lightC = isIpe ? '#ffe45e' : '#78c953';

  // Camadas volumétricas da copa 2.5D (base sombreada -> tufos médios -> topo iluminado pelo sol)
  drawFoliageSphere25D(ctx, 48, 36, 33, 24, darkC, midC, midC);
  drawFoliageSphere25D(ctx, 31, 34, 20, 16, darkC, midC, lightC);
  drawFoliageSphere25D(ctx, 65, 35, 20, 16, darkC, midC, lightC);
  drawFoliageSphere25D(ctx, 48, 22, 24, 18, midC, lightC, isIpe ? '#fff59e' : '#9be36d');

  if (treeType === 'mangueira' || treeType === 'castanheira') {
    const fruitColor = treeType === 'mangueira' ? '#ff9d2e' : '#6e3f1d';
    for (const pt of [
      { x: 32, y: 36 },
      { x: 48, y: 41 },
      { x: 62, y: 34 },
      { x: 41, y: 26 },
      { x: 56, y: 27 }
    ]) {
      ctx.fillStyle = fruitColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ============================================================================
// 3. LAVOURAS E CULTURAS 2.5D HD (SOLO SECO/REGADO + SEMENTE + 4 FASES)
// ============================================================================

function drawPalmLeaf25D(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  dx: number,
  dy: number,
  ctrlYOffset: number,
  width: number,
  lightColor = '#8ce05a',
  darkColor = '#266318'
) {
  const grad = ctx.createLinearGradient(x0, y0, x0 + dx, y0 + dy);
  grad.addColorStop(0, lightColor);
  grad.addColorStop(1, darkColor);
  ctx.strokeStyle = grad;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(x0 + dx * 0.52, y0 + ctrlYOffset, x0 + dx, y0 + dy);
  ctx.stroke();
}

function drawPalmateLeafCluster25D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lightColor = '#8ee35f',
  midColor = '#439428',
  darkColor = '#1d4d12'
) {
  const angles = [-2.45, -1.9, -1.57, -1.24, -0.69];
  for (const ang of angles) {
    const lx = cx + Math.cos(ang) * radius;
    const ly = cy + Math.sin(ang) * (radius * 0.85);
    const lGrad = ctx.createLinearGradient(cx, cy, lx, ly);
    lGrad.addColorStop(0, darkColor);
    lGrad.addColorStop(0.55, midColor);
    lGrad.addColorStop(1, lightColor);
    ctx.strokeStyle = lGrad;
    ctx.lineWidth = Math.max(2.4, radius * 0.28);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(lx, ly);
    ctx.stroke();
  }
}

export function drawFarmPlotAndCrop(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tilled: boolean,
  watered: boolean,
  cropId: string | null,
  stage: 0 | 1 | 2 | 3 | 4,
  animTick = 0,
  isRaining = false
) {
  enableHD(ctx);
  const cx = screenX + TILE_PX * 0.5;
  const cy = screenY + TILE_PX * 0.5;

  // --------------------------------------------------------------------------
  // CAMADA 1: ESTADO DO SOLO (VIRGEM vs. ARADO SECO vs. ARADO REGADO 💧)
  // --------------------------------------------------------------------------
  if (!tilled) {
    // Cova virgem não arada: torrões rústicos e tufos de mato rasteiro indicando uso da Enxada
    ctx.fillStyle = 'rgba(56, 31, 14, 0.42)';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 6, 5.5, 3, 0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 9, cy + 7, 6, 3.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6db846';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (const tuft of [
      { x: screenX + 13, y: screenY + 18 },
      { x: screenX + 34, y: screenY + 32 }
    ]) {
      ctx.beginPath();
      ctx.moveTo(tuft.x, tuft.y);
      ctx.quadraticCurveTo(tuft.x - 2, tuft.y - 5, tuft.x - 4, tuft.y - 6);
      ctx.moveTo(tuft.x, tuft.y);
      ctx.quadraticCurveTo(tuft.x + 2, tuft.y - 5, tuft.x + 4, tuft.y - 6);
      ctx.stroke();
    }
    return;
  }

  // Canteiro Arado em Relevo 2.5D (Seco vs. Regado)
  const moundGrad = ctx.createRadialGradient(cx, cy - 2, 4, cx, cy, TILE_PX * 0.48);
  if (watered) {
    // Terra preta amazônica intensamente úmida e irrigada
    moundGrad.addColorStop(0, '#3d210e');
    moundGrad.addColorStop(0.65, '#261306');
    moundGrad.addColorStop(1, '#170b03');
  } else {
    // Terra arada seca (barro claro de roçado)
    moundGrad.addColorStop(0, '#9c653b');
    moundGrad.addColorStop(0.68, '#734522');
    moundGrad.addColorStop(1, '#4f2d14');
  }

  ctx.fillStyle = moundGrad;
  ctx.beginPath();
  ctx.roundRect(screenX + 3, screenY + 3, TILE_PX - 6, TILE_PX - 6, 10);
  ctx.fill();

  // Borda do canteiro (reflexo úmido azulado quando regado, borda terrosa quando seco)
  ctx.strokeStyle = watered ? 'rgba(96, 198, 255, 0.45)' : 'rgba(56, 30, 12, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3 Sulcos horizontais de arado (leiras agrícolas em perspectiva 2.5D)
  for (const furrowY of [screenY + 13, screenY + 24, screenY + 35]) {
    // Sombra profunda do sulco
    ctx.fillStyle = watered ? '#120802' : '#3d210d';
    ctx.beginPath();
    ctx.roundRect(screenX + 7, furrowY - 2.5, TILE_PX - 14, 5.5, 3);
    ctx.fill();

    // Crista iluminada da terra revirada
    ctx.fillStyle = watered ? '#4f2c14' : '#b87c4c';
    ctx.beginPath();
    ctx.roundRect(screenX + 8, furrowY - 3.5, TILE_PX - 16, 2.2, 1.2);
    ctx.fill();

    // Lâmina d'água cristalina acumulada dentro dos sulcos quando REGADO
    if (watered) {
      const sheenGrad = ctx.createLinearGradient(screenX + 9, furrowY - 1, screenX + TILE_PX - 9, furrowY + 2);
      sheenGrad.addColorStop(0, 'rgba(56, 165, 230, 0.55)');
      sheenGrad.addColorStop(0.5, 'rgba(138, 224, 255, 0.78)');
      sheenGrad.addColorStop(1, 'rgba(41, 138, 204, 0.55)');
      ctx.fillStyle = sheenGrad;
      ctx.beginPath();
      ctx.roundRect(screenX + 10, furrowY - 1, TILE_PX - 20, 2.4, 1.2);
      ctx.fill();
    }
  }

  // Gotículas de umidade reluzentes no canteiro regado
  if (watered) {
    const droplets = [
      { x: screenX + 11, y: screenY + 10 },
      { x: screenX + 38, y: screenY + 17 },
      { x: screenX + 12, y: screenY + 38 }
    ];
    for (const d of droplets) {
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(d.x - 0.6, d.y - 0.6, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Se ainda não há semente plantada, finaliza após renderizar a terra arada (seca ou regada)
  if (!cropId) return;

  const crop = CROPS_DATA[cropId] ?? CROPS_DATA.mandioca;
  const baseY = screenY + TILE_PX - 9;

  // Cova circular central onde a semente/planta está firmada
  ctx.fillStyle = watered ? 'rgba(15, 7, 2, 0.75)' : 'rgba(54, 29, 12, 0.62)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 4, 12, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plaquinha de madeira identificadora no canto superior esquerdo do canteiro plantado
  ctx.save();
  ctx.fillStyle = '#5c3416';
  ctx.fillRect(screenX + 8.5, screenY + 9, 2.2, 8);
  ctx.fillStyle = '#d9a466';
  ctx.strokeStyle = '#3d200a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(screenX + 5, screenY + 5, 9.5, 6.5, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = crop.accentColor;
  ctx.fillRect(screenX + 6.5, screenY + 6.8, 6.5, 3);
  ctx.restore();

  // --------------------------------------------------------------------------
  // CAMADA 2: ESTÁGIO 0 — SEMENTE / MANIVA / MUDA RECÉM-PLANTADA NA COVA
  // --------------------------------------------------------------------------
  if (stage === 0) {
    ctx.save();
    if (cropId === 'mandioca' || cropId === 'macaxeira') {
      // Manivas (toletes de caule de mandioca/macaxeira) fincadas na cova com gemas verdes brotando
      for (const offset of [
        { dx: -4, dy: -4, rot: -0.28 },
        { dx: 4, dy: -3, rot: 0.24 }
      ]) {
        ctx.save();
        ctx.translate(cx + offset.dx, baseY + offset.dy);
        ctx.rotate(offset.rot);
        const stickGrad = ctx.createLinearGradient(-3, -6, 3, 4);
        stickGrad.addColorStop(0, '#9e673a');
        stickGrad.addColorStop(1, '#543216');
        ctx.fillStyle = stickGrad;
        ctx.strokeStyle = '#2b1606';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-2.8, -7, 5.6, 10, 2);
        ctx.fill();
        ctx.stroke();

        // Topo cortado claro da maniva
        ctx.fillStyle = '#f2dec2';
        ctx.beginPath();
        ctx.ellipse(0, -6.5, 2.4, 1.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gema lateral verde viva na maniva
        ctx.fillStyle = '#8ce858';
        ctx.beginPath();
        ctx.arc(2.6, -2.5, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (cropId === 'cana') {
      // Toletes de cana-de-açúcar com nós deitados no sulco
      for (const dy of [-6, -2]) {
        ctx.fillStyle = '#8bc34a';
        ctx.strokeStyle = '#33691e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 8, baseY + dy - 2, 16, 4.2, 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#d4e157';
        ctx.beginPath();
        ctx.moveTo(cx - 2, baseY + dy - 2);
        ctx.lineTo(cx - 2, baseY + dy + 2);
        ctx.moveTo(cx + 3, baseY + dy - 2);
        ctx.lineTo(cx + 3, baseY + dy + 2);
        ctx.stroke();
      }
    } else if (cropId === 'abacaxi') {
      // Coroa de abacaxi recém-plantada no centro da cova
      for (const ang of [-2.2, -1.8, -1.57, -1.34, -0.95]) {
        drawPalmLeaf25D(
          ctx,
          cx,
          baseY - 3,
          Math.cos(ang) * 9,
          Math.sin(ang) * 8,
          -4,
          2.3,
          '#9be86b',
          '#2e6f3e'
        );
      }
    } else if (crop.isTree) {
      // Caroço/muda florestal (Açaí, Cupuaçu, Cacau, Banana, Mamão) no torrão com radícula brotando
      drawFoliageSphere25D(
        ctx,
        cx,
        baseY - 4,
        6.5,
        4.8,
        '#361c0a',
        crop.accentColor,
        '#fff3d6',
        '#241105'
      );
      // Pontinha embrionária verde saindo da semente
      ctx.strokeStyle = '#9be86b';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 6);
      ctx.quadraticCurveTo(cx + 2, baseY - 12, cx + 5, baseY - 11);
      ctx.stroke();
    } else {
      // Sementes visíveis dispostas na cova aberta (Milho, Feijão, Arroz, Maracujá, Pimenta, Hortaliças)
      const seedPositions = [
        { dx: -7, dy: -4 },
        { dx: -2.5, dy: -6 },
        { dx: 0, dy: -3 },
        { dx: 3.5, dy: -6 },
        { dx: 7, dy: -4 }
      ];
      for (let i = 0; i < seedPositions.length; i++) {
        const sp = seedPositions[i];
        ctx.fillStyle = i % 2 === 0 ? crop.accentColor : '#ffe082';
        ctx.strokeStyle = '#2b1606';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(cx + sp.dx, baseY + sp.dy, 3.1, 2.1, i * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Brilho especular na semente
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + sp.dx - 0.8, baseY + sp.dy - 0.6, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Radícula branca/verde apontando na semente central
      ctx.strokeStyle = '#b9f6ca';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 4);
      ctx.quadraticCurveTo(cx + 1, baseY - 8, cx + 3, baseY - 9);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // CAMADA 3: FASES DE CRESCIMENTO BOTÂNICO (ESTÁGIOS 1, 2, 3 E 4)
  // --------------------------------------------------------------------------
  ctx.save();
  if (isRaining) {
    const swayAngle = Math.sin(animTick * 0.14 + screenX * 0.05 + screenY * 0.03) * 0.09;
    ctx.translate(cx, baseY);
    ctx.rotate(swayAngle);
    ctx.translate(-cx, -baseY);
  }

  const shadowRx = stage === 1 ? 8 : stage === 2 ? 12 : stage === 3 ? 15 : 17;
  drawSoftShadow(ctx, cx, baseY + 1, shadowRx, 5, 0.38);

  if (stage === 1) {
    // ========================================================================
    // ESTÁGIO 1: BROTO / EMERGÊNCIA (COTILÉDONES E PRIMEIRO TALO)
    // ========================================================================
    if (cropId === 'mandioca' || cropId === 'macaxeira') {
      // Tolete de maniva na base + haste avermelhada com primeiras folhinhas
      ctx.fillStyle = '#7d4e28';
      ctx.beginPath();
      ctx.roundRect(cx - 3, baseY - 6, 6, 6, 2);
      ctx.fill();
    }

    // Caule hipocótilo tenro
    ctx.strokeStyle = cropId === 'mandioca' ? '#8c3b2b' : '#4da82f';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 2);
    ctx.lineTo(cx, baseY - 13);
    ctx.stroke();

    // Duas folhinhas cotiledonares abertas em 2.5D
    drawFoliageSphere25D(ctx, cx - 5.5, baseY - 13, 5.2, 3.2, '#256118', '#58b838', '#a8f57d');
    drawFoliageSphere25D(ctx, cx + 5.5, baseY - 13, 5.2, 3.2, '#256118', '#58b838', '#a8f57d');
    drawFoliageSphere25D(ctx, cx, baseY - 16, 3.8, 2.8, '#2d731e', '#6fd149', '#c4ff9e');
  } else if (stage === 2) {
    // ========================================================================
    // ESTÁGIO 2: CRESCIMENTO VEGETATIVO (CAULE ESTRUTURADO E FOLHAGEM TÍPICA)
    // ========================================================================
    if (cropId === 'mandioca' || cropId === 'macaxeira' || cropId === 'mamao') {
      // Haste lenhosa jovem + folhas palmadas de 5 lóbulos típicas da mandioca/macaxeira
      ctx.strokeStyle = cropId === 'mandioca' ? '#7a4424' : '#5f7d32';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 1);
      ctx.lineTo(cx, baseY - 18);
      ctx.stroke();

      drawPalmateLeafCluster25D(ctx, cx - 6, baseY - 15, 8.5, '#98eb6a', '#489c2b', '#1e4f12');
      drawPalmateLeafCluster25D(ctx, cx + 6, baseY - 15, 8.5, '#98eb6a', '#489c2b', '#1e4f12');
      drawPalmateLeafCluster25D(ctx, cx, baseY - 20, 9.5, '#b0f584', '#54b035', '#245c17');
    } else if (cropId === 'milho' || cropId === 'arroz' || cropId === 'cana') {
      // Colmos eretos segmentados e folhas lanceoladas arqueadas
      for (const sxOff of [-4, 0, 4]) {
        ctx.strokeStyle = '#3d8c29';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx + sxOff, baseY - 1);
        ctx.lineTo(cx + sxOff * 1.2, baseY - 21);
        ctx.stroke();
      }
      drawPalmLeaf25D(ctx, cx, baseY - 12, -13, -5, -8, 3, '#9be86b', '#2b6e1b');
      drawPalmLeaf25D(ctx, cx, baseY - 12, 13, -5, -8, 3, '#9be86b', '#2b6e1b');
      drawPalmLeaf25D(ctx, cx, baseY - 18, -10, -8, -9, 2.8, '#b2f285', '#348022');
      drawPalmLeaf25D(ctx, cx, baseY - 18, 10, -8, -9, 2.8, '#b2f285', '#348022');
    } else if (cropId === 'abacaxi') {
      // Roseta espinhosa média de abacaxi
      for (const f of [
        { dx: -15, dy: -6, cy: -10 },
        { dx: 15, dy: -6, cy: -10 },
        { dx: -11, dy: -14, cy: -16 },
        { dx: 11, dy: -14, cy: -16 },
        { dx: 0, dy: -18, cy: -18 }
      ]) {
        drawPalmLeaf25D(ctx, cx, baseY - 2, f.dx, f.dy, f.cy, 3.2, '#8ce05a', '#21592a');
      }
    } else if (crop.isTree) {
      // Muda de árvore/palmeira com tronco jovem e copa em formação
      ctx.strokeStyle = '#784c28';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 1);
      ctx.lineTo(cx, baseY - 18);
      ctx.stroke();
      drawFoliageSphere25D(ctx, cx - 6, baseY - 17, 8, 6.5, '#1d4d14', '#3f8f29', '#7ed455');
      drawFoliageSphere25D(ctx, cx + 6, baseY - 17, 8, 6.5, '#1d4d14', '#3f8f29', '#7ed455');
      drawFoliageSphere25D(ctx, cx, baseY - 22, 9.5, 7.5, '#255e1a', '#52ab35', '#9be86b');
    } else {
      // Arbusto / rama estruturada com galhos e folhagem em camadas
      ctx.strokeStyle = '#4e7d24';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 1);
      ctx.lineTo(cx - 5, baseY - 14);
      ctx.moveTo(cx, baseY - 1);
      ctx.lineTo(cx + 5, baseY - 14);
      ctx.stroke();
      drawFoliageSphere25D(ctx, cx - 6, baseY - 11, 8.5, 6.8, '#215216', '#439428', '#82d656');
      drawFoliageSphere25D(ctx, cx + 6, baseY - 11, 8.5, 6.8, '#215216', '#439428', '#82d656');
      drawFoliageSphere25D(ctx, cx, baseY - 16, 10, 8, '#28611b', '#52ad34', '#9be86b');
    }
  } else if (stage === 3) {
    // ========================================================================
    // ESTÁGIO 3: FLORAÇÃO E FRUTIFICAÇÃO JOVEM (PRÉ-COLHEITA)
    // ========================================================================
    if (cropId === 'mandioca' || cropId === 'macaxeira') {
      // Raízes engrossando na base da terra + caule bifurcado + copa palmada densa
      ctx.fillStyle = crop.accentColor;
      ctx.beginPath();
      ctx.ellipse(cx - 5, baseY - 2, 4.5, 2.3, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + 5, baseY - 2, 4.5, 2.3, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#734423';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 2);
      ctx.lineTo(cx, baseY - 16);
      ctx.lineTo(cx - 7, baseY - 24);
      ctx.moveTo(cx, baseY - 16);
      ctx.lineTo(cx + 7, baseY - 24);
      ctx.stroke();

      drawPalmateLeafCluster25D(ctx, cx - 9, baseY - 22, 10, '#8ee05c', '#3f8f27', '#1b4710');
      drawPalmateLeafCluster25D(ctx, cx + 9, baseY - 22, 10, '#8ee05c', '#3f8f27', '#1b4710');
      drawPalmateLeafCluster25D(ctx, cx, baseY - 27, 11, '#a8f279', '#52ad34', '#235916');
    } else if (cropId === 'milho' || cropId === 'arroz' || cropId === 'cana') {
      // Colmos altos + pendão floral dourado no topo e espigas/panículas verdes formando
      for (const sxOff of [-5, 0, 5]) {
        ctx.strokeStyle = '#367d22';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(cx + sxOff, baseY - 1);
        ctx.lineTo(cx + sxOff, baseY - 28);
        ctx.stroke();
      }
      drawPalmLeaf25D(ctx, cx, baseY - 14, -16, -4, -10, 3.2, '#8ce05a', '#245e17');
      drawPalmLeaf25D(ctx, cx, baseY - 14, 16, -4, -10, 3.2, '#8ce05a', '#245e17');
      drawPalmLeaf25D(ctx, cx, baseY - 22, -13, -7, -10, 3, '#a4ed74', '#2d701d');
      drawPalmLeaf25D(ctx, cx, baseY - 22, 13, -7, -10, 3, '#a4ed74', '#2d701d');

      // Pendão floral dourado no topo
      if (cropId !== 'cana') {
        ctx.strokeStyle = '#f5d469';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 28);
        ctx.lineTo(cx - 4, baseY - 34);
        ctx.moveTo(cx, baseY - 28);
        ctx.lineTo(cx, baseY - 35);
        ctx.moveTo(cx, baseY - 28);
        ctx.lineTo(cx + 4, baseY - 34);
        ctx.stroke();
      }
    } else if (cropId === 'abacaxi') {
      // Grande roseta espinhosa + botão floral avermelhado central do abacaxi jovem
      for (const f of [
        { dx: -18, dy: -5, cy: -12 },
        { dx: 18, dy: -5, cy: -12 },
        { dx: -14, dy: -15, cy: -19 },
        { dx: 14, dy: -15, cy: -19 },
        { dx: -7, dy: -22, cy: -24 },
        { dx: 7, dy: -22, cy: -24 }
      ]) {
        drawPalmLeaf25D(ctx, cx, baseY - 2, f.dx, f.dy, f.cy, 3.5, '#8ce05a', '#1d4f25');
      }
      drawFoliageSphere25D(ctx, cx, baseY - 13, 5.8, 7.5, '#7a2332', '#d94c5a', '#ff9ea8');
    } else {
      // Planta robusta em floração / frutos verdes em desenvolvimento
      ctx.strokeStyle = '#633d1e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 1);
      ctx.lineTo(cx, baseY - 22);
      ctx.stroke();

      drawFoliageSphere25D(ctx, cx - 8, baseY - 15, 11, 9, '#1b4711', '#3b8724', '#74c74a');
      drawFoliageSphere25D(ctx, cx + 8, baseY - 15, 11, 9, '#1b4711', '#3b8724', '#74c74a');
      drawFoliageSphere25D(ctx, cx, baseY - 23, 13, 10.5, '#245918', '#4ca630', '#96e667');

      // Flores abertas e pequenos frutos verdes ainda imaturos
      for (const fl of [
        { dx: -7, dy: -16 },
        { dx: 7, dy: -16 },
        { dx: 0, dy: -24 }
      ]) {
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(cx + fl.dx, baseY + fl.dy, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8bc34a';
        ctx.beginPath();
        ctx.arc(cx + fl.dx + 2, baseY + fl.dy + 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (stage === 4) {
    // ========================================================================
    // ESTÁGIO 4: MADURO / PRONTO PARA COLHEITA (FRUTOS/RAÍZES + BRILHO DOURADO)
    // ========================================================================
    const pulse = (Math.sin(animTick * 0.12 + screenX * 0.1) + 1) * 0.5;

    // Halo dourado suave de planta pronta para colheita
    const auraGrad = ctx.createRadialGradient(cx, baseY - 16, 4, cx, baseY - 16, 22);
    auraGrad.addColorStop(0, `rgba(255, 238, 130, ${0.28 + pulse * 0.18})`);
    auraGrad.addColorStop(1, 'rgba(255, 215, 64, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, baseY - 16, 22, 0, Math.PI * 2);
    ctx.fill();

    if (cropId === 'mandioca' || cropId === 'macaxeira') {
      // Touceira alta de mandioca/macaxeira + raízes graúdas aflorando na base da cova!
      ctx.strokeStyle = '#6e3f1f';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 2);
      ctx.lineTo(cx, baseY - 20);
      ctx.lineTo(cx - 9, baseY - 29);
      ctx.moveTo(cx, baseY - 20);
      ctx.lineTo(cx + 9, baseY - 29);
      ctx.stroke();

      drawPalmateLeafCluster25D(ctx, cx - 10, baseY - 26, 11, '#9be86b', '#439629', '#1b4710');
      drawPalmateLeafCluster25D(ctx, cx + 10, baseY - 26, 11, '#9be86b', '#439629', '#1b4710');
      drawPalmateLeafCluster25D(ctx, cx, baseY - 32, 12.5, '#b8f78e', '#52ad34', '#235916');

      // Raízes tuberosas maduras de Mandioca/Macaxeira na base
      for (const root of [
        { dx: -8, dy: -2, rot: -0.35 },
        { dx: 0, dy: -1, rot: 0.05 },
        { dx: 8, dy: -2, rot: 0.35 }
      ]) {
        ctx.save();
        ctx.translate(cx + root.dx, baseY + root.dy);
        ctx.rotate(root.rot);
        ctx.fillStyle = cropId === 'macaxeira' ? '#f5ecd7' : '#7a4928';
        ctx.strokeStyle = '#2b1506';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    } else if (cropId === 'milho') {
      // Pé de milho carregado com espigas douradas abertas na palha
      for (const sxOff of [-5, 0, 5]) {
        ctx.strokeStyle = '#337820';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + sxOff, baseY - 1);
        ctx.lineTo(cx + sxOff, baseY - 30);
        ctx.stroke();
      }
      drawPalmLeaf25D(ctx, cx, baseY - 16, -17, -4, -10, 3.4, '#8ce05a', '#245e17');
      drawPalmLeaf25D(ctx, cx, baseY - 16, 17, -4, -10, 3.4, '#8ce05a', '#245e17');

      for (const cob of [
        { dx: -6, dy: -16, rot: -0.3 },
        { dx: 6, dy: -18, rot: 0.3 }
      ]) {
        ctx.save();
        ctx.translate(cx + cob.dx, baseY + cob.dy);
        ctx.rotate(cob.rot);
        ctx.fillStyle = '#ffd54f';
        ctx.strokeStyle = '#8c5d0b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    } else if (cropId === 'abacaxi') {
      // Abacaxi Gigante Regional dourado com coroa verde no centro da roseta
      for (const f of [
        { dx: -19, dy: -4, cy: -12 },
        { dx: 19, dy: -4, cy: -12 },
        { dx: -15, dy: -14, cy: -18 },
        { dx: 15, dy: -14, cy: -18 }
      ]) {
        drawPalmLeaf25D(ctx, cx, baseY - 2, f.dx, f.dy, f.cy, 3.6, '#8ce05a', '#1d4f25');
      }
      drawFoliageSphere25D(ctx, cx, baseY - 15, 8.5, 11, '#a65c0e', '#f5b938', '#fff09e', '#593004');
      drawPalmLeaf25D(ctx, cx, baseY - 25, -5, -7, -6, 2.4, '#9be86b', '#266318');
      drawPalmLeaf25D(ctx, cx, baseY - 25, 5, -7, -6, 2.4, '#9be86b', '#266318');
      drawPalmLeaf25D(ctx, cx, baseY - 25, 0, -9, -7, 2.6, '#b8f78e', '#266318');
    } else {
      // Planta ou árvore madura exuberante + frutos regionais brilhantes prontos para colheita
      ctx.strokeStyle = '#5c3719';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 1);
      ctx.lineTo(cx, baseY - 24);
      ctx.stroke();

      drawFoliageSphere25D(ctx, cx - 9, baseY - 16, 12, 10, '#1c4712', '#3c8724', '#74c74a');
      drawFoliageSphere25D(ctx, cx + 9, baseY - 16, 12, 10, '#1c4712', '#3c8724', '#74c74a');
      drawFoliageSphere25D(ctx, cx, baseY - 24, 15, 12, '#28631a', '#52ad34', '#9be86b');

      for (const offset of [
        { dx: -8, dy: -13 },
        { dx: 8, dy: -14 },
        { dx: -3, dy: -22 },
        { dx: 5, dy: -21 }
      ]) {
        const fGrad = ctx.createRadialGradient(
          cx + offset.dx - 1.5,
          baseY + offset.dy - 1.5,
          0.5,
          cx + offset.dx,
          baseY + offset.dy,
          5.4
        );
        fGrad.addColorStop(0, '#ffffff');
        fGrad.addColorStop(0.32, crop.accentColor);
        fGrad.addColorStop(1, crop.secondaryColor);
        ctx.fillStyle = fGrad;
        ctx.strokeStyle = '#291405';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(cx + offset.dx, baseY + offset.dy, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Estrela cintilante indicando colheita pronta
    const starY = baseY - 35 - pulse * 2.5;
    ctx.fillStyle = '#fff59d';
    ctx.strokeStyle = '#b27808';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx + 12, starY, 3 + pulse * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 4. ARQUITETURA REGIONAL 2.5D HD (PERSPECTIVA 3/4, TELHADOS E PALAFITAS)
// ============================================================================

export function drawRegionalBuilding(
  ctx: CanvasRenderingContext2D,
  b: MapBuilding,
  screenX: number,
  screenY: number
) {
  enableHD(ctx);
  const w = b.width * TILE_PX;
  const h = b.height * TILE_PX;

  // Sombra volumétrica projetada ao redor da edificação
  ctx.save();
  ctx.fillStyle = 'rgba(10, 6, 3, 0.36)';
  ctx.beginPath();
  ctx.roundRect(screenX + 6, screenY + 12, w - 4, h - 4, 12);
  ctx.fill();
  ctx.restore();

  let roofTop = '#b8462c';
  let roofBottom = '#7d2916';
  let wallTop = '#edd3ad';
  let wallBottom = '#c7a477';
  let trimColor = '#593419';

  switch (b.style) {
    case 'casa_familia':
    case 'casa_ribeirinha':
      roofTop = '#c94f32';
      roofBottom = '#872c18';
      wallTop = '#d99e66';
      wallBottom = '#ab713e';
      break;
    case 'casa_farinha':
    case 'abrigo_animais':
    case 'banca_feira':
      roofTop = '#b88746';
      roofBottom = '#7d5624';
      wallTop = '#ba8350';
      wallBottom = '#8a5a2f';
      break;
    case 'mercado_municipal':
    case 'loja_sementes':
    case 'loja_ferramentas':
    case 'comercio_animais':
      roofTop = '#2f7dad';
      roofBottom = '#1b4f73';
      wallTop = '#f7e4bc';
      wallBottom = '#d9be8c';
      break;
    case 'terminal_rodoviaria':
    case 'oficina_barcos':
    case 'poco_agua':
      roofTop = '#296c9c';
      roofBottom = '#174363';
      wallTop = '#e8eff5';
      wallBottom = '#bfd0de';
      break;
  }

  if (b.style === 'poco_agua') {
    // Poço de pedra circular com telhadinho colonial e água cristalina
    const cx = screenX + w * 0.5;
    const cy = screenY + h * 0.62;
    drawSoftShadow(ctx, cx, cy + 16, w * 0.42, 12, 0.42);

    ctx.fillStyle = '#8c857b';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.36, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d3832';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, w * 0.25, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pilares de madeira e telhado do poço
    ctx.fillStyle = '#5c3416';
    ctx.fillRect(cx - w * 0.3, screenY + 18, 6, cy - screenY - 16);
    ctx.fillRect(cx + w * 0.3 - 6, screenY + 18, 6, cy - screenY - 16);

    const wellRoof = ctx.createLinearGradient(screenX, screenY + 4, screenX, screenY + 28);
    wellRoof.addColorStop(0, '#c94f32');
    wellRoof.addColorStop(1, '#872c18');
    ctx.fillStyle = wellRoof;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.38, screenY + 26);
    ctx.lineTo(cx, screenY + 4);
    ctx.lineTo(cx + w * 0.38, screenY + 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#381908';
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }

  const roofH = Math.floor(h * 0.48);
  const wallY = screenY + roofH - 6;
  const wallH = h - roofH + 2;

  // Pés de palafita / alicerce de madeira na base
  ctx.fillStyle = '#3d2210';
  for (let pxX = screenX + 10; pxX < screenX + w - 12; pxX += 26) {
    ctx.fillRect(pxX, screenY + h - 8, 6, 8);
  }

  // Corpo frontal da construção em perspectiva 3/4 com tábuas horizontais
  const wallGrad = ctx.createLinearGradient(screenX, wallY, screenX, wallY + wallH);
  wallGrad.addColorStop(0, wallTop);
  wallGrad.addColorStop(1, wallBottom);
  ctx.fillStyle = wallGrad;
  ctx.beginPath();
  ctx.roundRect(screenX + 4, wallY, w - 8, wallH, 6);
  ctx.fill();
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tábuas horizontais de madeira nas paredes
  ctx.strokeStyle = 'rgba(48, 24, 8, 0.24)';
  ctx.lineWidth = 1;
  for (let py = wallY + 8; py < wallY + wallH - 4; py += 7) {
    ctx.beginPath();
    ctx.moveTo(screenX + 5, py);
    ctx.lineTo(screenX + w - 5, py);
    ctx.stroke();
  }

  // Sombra projetada pelo beiral do telhado na parede frontal
  const eaveShadow = ctx.createLinearGradient(screenX, wallY, screenX, wallY + 12);
  eaveShadow.addColorStop(0, 'rgba(20, 10, 4, 0.45)');
  eaveShadow.addColorStop(1, 'rgba(20, 10, 4, 0)');
  ctx.fillStyle = eaveShadow;
  ctx.fillRect(screenX + 5, wallY, w - 10, 12);

  // Porta na coordenada exata de interação
  const doorOffsetX = (b.doorX - b.x) * TILE_PX;
  const doorScreenX = screenX + doorOffsetX + TILE_PX * 0.22;
  const doorW = TILE_PX * 0.56;
  const doorH = Math.min(34, wallH - 8);
  const doorY = wallY + wallH - doorH;

  const doorGrad = ctx.createLinearGradient(doorScreenX, doorY, doorScreenX, doorY + doorH);
  doorGrad.addColorStop(0, '#5e3417');
  doorGrad.addColorStop(1, '#361b09');
  ctx.fillStyle = doorGrad;
  ctx.beginPath();
  ctx.roundRect(doorScreenX, doorY, doorW, doorH, [6, 6, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = '#d9a05b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Janelas iluminadas com esquadrias em cruz
  for (let wx = screenX + 16; wx < screenX + w - 28; wx += TILE_PX) {
    if (Math.abs(wx - doorScreenX) < 26) continue;
    const winGrad = ctx.createLinearGradient(wx, wallY + 12, wx, wallY + 28);
    winGrad.addColorStop(0, '#fff3b8');
    winGrad.addColorStop(1, '#f0b846');
    ctx.fillStyle = winGrad;
    ctx.beginPath();
    ctx.roundRect(wx, wallY + 12, 18, 16, 3);
    ctx.fill();
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(wx + 9, wallY + 12);
    ctx.lineTo(wx + 9, wallY + 28);
    ctx.moveTo(wx, wallY + 20);
    ctx.lineTo(wx + 18, wallY + 20);
    ctx.stroke();
  }

  // Telhado inclinado 32-Bits com telhas coloniais desenhadas
  const roofGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY + roofH);
  roofGrad.addColorStop(0, roofTop);
  roofGrad.addColorStop(1, roofBottom);
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(screenX + 10, screenY + 4);
  ctx.lineTo(screenX + w - 10, screenY + 4);
  ctx.lineTo(screenX + w + 2, screenY + roofH);
  ctx.lineTo(screenX - 2, screenY + roofH);
  ctx.closePath();
  ctx.fill();

  // Canais verticais e horizontais das telhas coloniais
  ctx.strokeStyle = 'rgba(38, 14, 4, 0.28)';
  ctx.lineWidth = 1.2;
  for (let tx = screenX + 14; tx < screenX + w - 10; tx += 12) {
    ctx.beginPath();
    ctx.moveTo(tx, screenY + 6);
    ctx.lineTo(tx, screenY + roofH - 2);
    ctx.stroke();
  }
  for (let ty = screenY + 14; ty < screenY + roofH - 4; ty += 11) {
    ctx.beginPath();
    ctx.moveTo(screenX + 6, ty);
    ctx.lineTo(screenX + w - 6, ty);
    ctx.stroke();
  }

  ctx.strokeStyle = '#381908';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screenX + 10, screenY + 4);
  ctx.lineTo(screenX + w - 10, screenY + 4);
  ctx.lineTo(screenX + w + 2, screenY + roofH);
  ctx.lineTo(screenX - 2, screenY + roofH);
  ctx.closePath();
  ctx.stroke();

  // Placa de madeira com o nome do local
  if (b.name) {
    ctx.save();
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    const labelW = Math.min(w - 8, ctx.measureText(b.name).width + 14);
    const lx = screenX + (w - labelW) * 0.5;
    const ly = screenY + roofH - 11;
    ctx.fillStyle = 'rgba(36, 19, 8, 0.92)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, labelW, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#e0b263';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#fff5de';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.name, screenX + w * 0.5, ly + 8);
    ctx.restore();
  }
}

// ============================================================================
// 5. PERSONAGENS 2.5D HD (PROTAGONISTA E MORADORES RIBEIRINHOS)
// ============================================================================

export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  facing: Direction,
  walkFrame: number,
  shirtColor: string,
  hatColor: string | null,
  hairColor: string,
  activeTool?: ToolId,
  isSwingingTool = false
) {
  enableHD(ctx);
  const cx = screenX + TILE_PX * 0.5;
  const footY = screenY + TILE_PX - 5;
  const bob = walkFrame === 0 ? 0 : -2;
  const legSwing = walkFrame === 1 ? -3.5 : walkFrame === 2 ? 3.5 : 0;

  drawSoftShadow(ctx, cx, footY + 1, 13, 5, 0.42);

  // Botas e calça jeans em volume 2.5D
  ctx.fillStyle = '#294666';
  ctx.beginPath();
  ctx.roundRect(cx - 7, footY - 13 + legSwing * 0.5, 6, 10, 3);
  ctx.roundRect(cx + 1, footY - 13 - legSwing * 0.5, 6, 10, 3);
  ctx.fill();

  ctx.fillStyle = '#3d2210';
  ctx.beginPath();
  ctx.roundRect(cx - 7.5, footY - 5 + legSwing * 0.5, 6.5, 5, 2.5);
  ctx.roundRect(cx + 1, footY - 5 - legSwing * 0.5, 6.5, 5, 2.5);
  ctx.fill();

  // Tronco / camisa xadrez + jardineira jeans em 2.5D
  const torsoGrad = ctx.createLinearGradient(cx - 10, footY - 27 + bob, cx + 10, footY - 12 + bob);
  torsoGrad.addColorStop(0, shirtColor);
  torsoGrad.addColorStop(1, '#1d2938');
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.roundRect(cx - 9, footY - 26 + bob, 18, 15, 6);
  ctx.fill();
  ctx.strokeStyle = '#1f1209';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Gola branca + Jardineira jeans com alças e botões dourados
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, footY - 26 + bob);
  ctx.lineTo(cx + 3.5, footY - 26 + bob);
  ctx.lineTo(cx, footY - 21 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(cx - 6.5, footY - 25 + bob, 3, 13);
  ctx.fillRect(cx + 3.5, footY - 25 + bob, 3, 13);
  ctx.fillRect(cx - 7.5, footY - 19 + bob, 15, 8);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(cx - 6, footY - 20 + bob, 2, 2);
  ctx.fillRect(cx + 4, footY - 20 + bob, 2, 2);

  // Braços articulados com mangas da camisa e punhos dobrados
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.roundRect(cx - 12.5, footY - 24 + bob - legSwing * 0.4, 4.5, 7.5, 2);
  ctx.roundRect(cx + 8, footY - 24 + bob + legSwing * 0.4, 4.5, 7.5, 2);
  ctx.fill();
  ctx.fillStyle = '#d9996c';
  ctx.beginPath();
  ctx.roundRect(cx - 12, footY - 17 + bob - legSwing * 0.4, 3.8, 4.5, 2);
  ctx.roundRect(cx + 8.3, footY - 17 + bob + legSwing * 0.4, 3.8, 4.5, 2);
  ctx.fill();

  // Cabeça arredondada em 2.5D
  const headY = footY - 34 + bob;
  const skinGrad = ctx.createRadialGradient(cx - 3, headY - 3, 2, cx, headY, 11);
  skinGrad.addColorStop(0, '#f2b88c');
  skinGrad.addColorStop(1, '#c78356');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.arc(cx, headY, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#291509';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Cabelo
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.arc(cx, headY - 2, 9.8, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();

  // Olhos expressivos (quando não está de costas)
  if (facing !== 'up') {
    const eyeShift = facing === 'left' ? -2.5 : facing === 'right' ? 2.5 : 0;
    ctx.fillStyle = '#1c1008';
    ctx.beginPath();
    ctx.arc(cx - 3.2 + eyeShift, headY + 0.5, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 3.2 + eyeShift, headY + 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chapéu de palha ribeirinho em 2.5D
  if (hatColor) {
    const brimGrad = ctx.createLinearGradient(cx - 14, headY - 9, cx + 14, headY - 5);
    brimGrad.addColorStop(0, '#fff09e');
    brimGrad.addColorStop(0.5, hatColor);
    brimGrad.addColorStop(1, '#9e6f14');
    ctx.fillStyle = brimGrad;
    ctx.beginPath();
    ctx.ellipse(cx, headY - 7, 13.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b210d';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.roundRect(cx - 8, headY - 13, 16, 6.5, [5, 5, 1, 1]);
    ctx.fill();
    ctx.fillStyle = '#c93829';
    ctx.fillRect(cx - 8, headY - 8.5, 16, 2);
  }

  // Ferramenta empunhada durante ação
  if (isSwingingTool && activeTool) {
    ctx.save();
    ctx.translate(cx + 10, footY - 18);
    ctx.rotate(0.45);
    ctx.strokeStyle = '#8c5832';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, -10);
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================================
// 6. ANIMAIS DA FAZENDA E VEÍCULOS (ÔNIBUS E CANOAS) EM 2.5D HD
// ============================================================================

export function drawAnimalSprite(
  ctx: CanvasRenderingContext2D,
  categoryId: AnimalCategoryId,
  screenX: number,
  screenY: number,
  animTick: number,
  fedToday: boolean
) {
  enableHD(ctx);
  const cx = screenX + TILE_PX * 0.5;
  const cy = screenY + TILE_PX * 0.58 + Math.sin(animTick * 0.1 + screenX) * 1.2;

  drawSoftShadow(ctx, cx, screenY + TILE_PX - 6, 14, 5, 0.35);

  if (categoryId === 'peixe_viveiro') {
    // Tambaqui nadando com nadadeiras e escamas
    drawFoliageSphere25D(ctx, cx, cy, 11, 6, '#1f4f32', '#3d8556', '#85d19c', '#122e1d');
    ctx.fillStyle = '#e65c39';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx - 16, cy - 5);
    ctx.lineTo(cx - 16, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  let bodyColor = '#f5f0e6';
  let shadeColor = '#c9bfb0';
  let rx = 12;
  let ry = 9;

  if (categoryId === 'galinha') {
    bodyColor = '#fff7e8';
    shadeColor = '#d9c4a3';
    rx = 9;
    ry = 7.5;
  } else if (categoryId === 'pato') {
    bodyColor = '#c49a6c';
    shadeColor = '#8a6239';
    rx = 9.5;
    ry = 7;
  } else if (categoryId === 'porco') {
    bodyColor = '#ffc1cc';
    shadeColor = '#e5899b';
    rx = 13;
    ry = 9.5;
  } else if (categoryId === 'cabra') {
    bodyColor = '#e6ccb2';
    shadeColor = '#b08968';
    rx = 12.5;
    ry = 9;
  } else if (categoryId === 'vaca') {
    bodyColor = '#f7f3eb';
    shadeColor = '#c4b7a6';
    rx = 15;
    ry = 10.5;
  }

  // Pernas articuladas do animal
  ctx.fillStyle = categoryId === 'galinha' || categoryId === 'pato' ? '#e69525' : '#3b2313';
  ctx.fillRect(cx - rx * 0.45, cy + ry * 0.6, 3, 6);
  ctx.fillRect(cx + rx * 0.25, cy + ry * 0.6, 3, 6);

  // Corpo volumétrico
  drawFoliageSphere25D(ctx, cx, cy, rx, ry, shadeColor, bodyColor, '#ffffff', '#3b2313');

  // Manchas malhadas na vaca
  if (categoryId === 'vaca') {
    ctx.fillStyle = '#6e4226';
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 2, 5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 4, cy + 2, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cabeça do animal
  const headX = cx + rx * 0.75;
  const headY = cy - ry * 0.48;
  const headColor = categoryId === 'pato' ? '#2e7d32' : bodyColor;
  const headShade = categoryId === 'pato' ? '#1b5e20' : shadeColor;
  drawFoliageSphere25D(ctx, headX, headY, rx * 0.52, ry * 0.55, headShade, headColor, '#ffffff', '#3b2313');

  // Crista e bico (aves) ou focinho e chifres (mamíferos)
  if (categoryId === 'galinha' || categoryId === 'pato') {
    if (categoryId === 'galinha') {
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.arc(headX, headY - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.moveTo(headX + 4, headY - 1);
    ctx.lineTo(headX + 9, headY + 1);
    ctx.lineTo(headX + 4, headY + 3);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#f48fb1';
    ctx.beginPath();
    ctx.ellipse(headX + 5, headY + 2, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Olho vivo
  ctx.fillStyle = '#1a0f07';
  ctx.beginPath();
  ctx.arc(headX + 1.5, headY - 1, 1.4, 0, Math.PI * 2);
  ctx.fill();

  if (fedToday) {
    ctx.fillStyle = '#ffdf5d';
    ctx.strokeStyle = '#3b2313';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy - ry - 9, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c9342b';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', cx, cy - ry - 6);
  }
}

export function drawBusVehicle(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  direction: Direction
) {
  enableHD(ctx);
  const isHorizontal = direction === 'left' || direction === 'right';
  const w = isHorizontal ? 76 : 42;
  const h = isHorizontal ? 38 : 68;
  const x = screenX + (TILE_PX - w) * 0.5;
  const y = screenY + (TILE_PX - h) * 0.5;

  drawSoftShadow(ctx, screenX + TILE_PX * 0.5, y + h, w * 0.52, 8, 0.45);

  const busGrad = ctx.createLinearGradient(x, y, x, y + h);
  busGrad.addColorStop(0, '#ffffff');
  busGrad.addColorStop(0.45, '#e3eef7');
  busGrad.addColorStop(0.5, '#256ba8');
  busGrad.addColorStop(1, '#15436e');
  ctx.fillStyle = busGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = '#14293d';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (isHorizontal) {
    for (let wx = x + 8; wx < x + w - 12; wx += 13) {
      ctx.fillStyle = '#8fd4fa';
      ctx.beginPath();
      ctx.roundRect(wx, y + 7, 10, 9, 2.5);
      ctx.fill();
    }
    for (const wheelX of [x + 16, x + w - 16]) {
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath();
      ctx.arc(wheelX, y + h - 1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.arc(wheelX, y + h - 1, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawCanoeVessel(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  direction: Direction,
  hasPilot = false
) {
  enableHD(ctx);
  const cx = screenX + TILE_PX * 0.5;
  const cy = screenY + TILE_PX * 0.55;
  const isHorizontal = direction === 'left' || direction === 'right';

  ctx.save();
  ctx.translate(cx, cy);
  if (!isHorizontal) ctx.rotate(Math.PI * 0.5);

  // Marola de água 2.5D ao redor do casco
  ctx.strokeStyle = 'rgba(210, 245, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 2, 27, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Casco de madeira esculpido em 2.5D
  const hullGrad = ctx.createLinearGradient(0, -8, 0, 8);
  hullGrad.addColorStop(0, '#c78346');
  hullGrad.addColorStop(0.5, '#965928');
  hullGrad.addColorStop(1, '#4f2b0e');
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(-25, 0);
  ctx.quadraticCurveTo(0, -10, 25, 0);
  ctx.quadraticCurveTo(0, 10, -25, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2b1506';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Bancos internos da canoa
  ctx.fillStyle = '#d99b62';
  ctx.fillRect(-9, -4, 3.5, 8);
  ctx.fillRect(6, -4, 3.5, 8);

  ctx.restore();

  if (hasPilot) {
    drawCharacterSprite(ctx, screenX, screenY - 10, direction, 0, '#285985', '#f2c138', '#361e10');
  }
}

// ============================================================================
// 7. RETRATOS FACIAIS FOTORREALISTAS DIGITAIS & ÍCONES 2D ILUSTRADOS
// ============================================================================

export function drawProtagonistPortrait(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  drawCharacterPortrait32Bit(ctx, w, h, '#285985', '#f2c138', '#2a160b', true);
}

/**
 * Renderiza um Retrato de Rosto Fotorrealista Digital (pintura digital realista de alta densidade)
 * com iluminação subsurface scattering na pele, íris detalhada com fibras radiais, cílios,
 * ponte nasal esculpida, lábios com volume realista, fios de cabelo/barba e fundo bokeh amazônico.
 */
export function drawCharacterPortrait32Bit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shirtColor: string,
  hatColor: string | null,
  hairColor: string,
  isProtagonist = false
) {
  enableHD(ctx);
  ctx.clearRect(0, 0, w, h);

  const s = w / 140;
  ctx.save();
  ctx.scale(s, s);
  const W = 140;
  const H = 140;
  const cx = W * 0.5;

  // Determinismo visual por personagem baseado nas cores de camisa/cabelo/chapéu
  const seedStr = `${shirtColor}_${hatColor || 'none'}_${hairColor}_${isProtagonist ? 'p' : 'n'}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const hLow = hairColor.toLowerCase();
  const isElder =
    hLow.includes('d9d9') ||
    hLow.includes('cfcf') ||
    hLow.includes('e5e7') ||
    hLow.includes('9ca3') ||
    hLow.includes('bdbd');
  const isFemale =
    !isProtagonist &&
    (shirtColor.toLowerCase().includes('b84a39') ||
      shirtColor.toLowerCase().includes('2f7a4c') ||
      shirtColor.toLowerCase().includes('c85a32') ||
      shirtColor.toLowerCase().includes('8a3b58') ||
      shirtColor.toLowerCase().includes('d97706') ||
      shirtColor.toLowerCase().includes('e06d53') ||
      (!hatColor && (hash % 3 === 0)));

  // Paleta de pele realista amazônica (subsurface scattering quente)
  const skinPalettes = [
    { highlight: '#f8d5b8', mid: '#dfa276', warm: '#c97d52', shadow: '#8c4f2b', deep: '#592e16', lipUpper: '#9e5044', lipLower: '#bf6b5c' },
    { highlight: '#f2c7a3', mid: '#d18e5e', warm: '#b86c3e', shadow: '#7d421e', deep: '#4a230c', lipUpper: '#8f463a', lipLower: '#b05c4e' },
    { highlight: '#e6b48e', mid: '#be7b4b', warm: '#a35c2f', shadow: '#6b3615', deep: '#3d1b07', lipUpper: '#7d3b30', lipLower: '#9c4f42' }
  ];
  const skin = isProtagonist ? skinPalettes[0] : skinPalettes[hash % skinPalettes.length];

  // 1. FUNDO FOTOGRÁFICO DO VALE DO JURUÁ (Lente 85mm f/1.4 Golden Hour Bokeh)
  const skyBg = ctx.createLinearGradient(0, 0, 0, H);
  skyBg.addColorStop(0, '#0f293a');
  skyBg.addColorStop(0.45, '#134e4a');
  skyBg.addColorStop(0.82, '#1e3a2f');
  skyBg.addColorStop(1, '#09151c');
  ctx.fillStyle = skyBg;
  ctx.fillRect(0, 0, W, H);

  // Luz solar dourada filtrada pela copa das árvores (Bokeh circles)
  const bokehSpots = [
    { x: 24, y: 28, r: 22, col: 'rgba(253, 224, 71, 0.22)' },
    { x: 114, y: 34, r: 19, col: 'rgba(251, 191, 36, 0.20)' },
    { x: 18, y: 82, r: 16, col: 'rgba(52, 211, 153, 0.16)' },
    { x: 120, y: 76, r: 21, col: 'rgba(56, 189, 248, 0.16)' },
    { x: 70, y: 18, r: 28, col: 'rgba(254, 240, 138, 0.15)' }
  ];
  for (const b of bokehSpots) {
    const bGrad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.r);
    bGrad.addColorStop(0, b.col);
    bGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. CABELO LONGO TRASEIRO (para personagens femininas)
  if (isFemale) {
    const backHairGrad = ctx.createLinearGradient(cx - 38, 45, cx + 38, 122);
    backHairGrad.addColorStop(0, hairColor);
    backHairGrad.addColorStop(1, '#0d0704');
    ctx.fillStyle = backHairGrad;
    ctx.beginPath();
    ctx.ellipse(cx, 78, 37, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. PESCOÇO ANATÔMICO COM MÚSCULOS ESTERNOCLEIDOMASTOIDEOS E SOMBRA PROJETADA DO QUEIXO
  const neckGrad = ctx.createLinearGradient(cx - 18, 86, cx + 18, 118);
  neckGrad.addColorStop(0, skin.shadow);
  neckGrad.addColorStop(0.35, skin.mid);
  neckGrad.addColorStop(0.75, skin.warm);
  neckGrad.addColorStop(1, skin.deep);
  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 16, 86);
  ctx.quadraticCurveTo(cx - 18, 104, cx - 24, 118);
  ctx.lineTo(cx + 24, 118);
  ctx.quadraticCurveTo(cx + 18, 104, cx + 16, 86);
  ctx.closePath();
  ctx.fill();

  // Sombra profunda logo abaixo do queixo
  const chinShadow = ctx.createRadialGradient(cx, 92, 2, cx, 95, 19);
  chinShadow.addColorStop(0, 'rgba(38, 15, 5, 0.72)');
  chinShadow.addColorStop(1, 'rgba(38, 15, 5, 0)');
  ctx.fillStyle = chinShadow;
  ctx.beginPath();
  ctx.ellipse(cx, 93, 17, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. OMBROS E VESTIMENTA REALISTA COM DOBRAS DE TECIDO E COSTURAS
  const safeShirt =
    shirtColor.toLowerCase().includes('f2e5') ||
    shirtColor.toLowerCase().includes('d8c5') ||
    shirtColor.toLowerCase().includes('f5ec') ||
    shirtColor.toLowerCase().includes('8c58')
      ? '#0d9488'
      : shirtColor;

  const shirtGrad = ctx.createLinearGradient(cx - 56, 102, cx + 56, 140);
  shirtGrad.addColorStop(0, safeShirt);
  shirtGrad.addColorStop(0.5, safeShirt);
  shirtGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = shirtGrad;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 58, 142);
  ctx.quadraticCurveTo(cx - 52, 106, cx - 22, 102);
  ctx.lineTo(cx + 22, 102);
  ctx.quadraticCurveTo(cx + 52, 106, cx + 58, 142);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Camiseta interna clara e gola anatômica
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(cx - 16, 102);
  ctx.quadraticCurveTo(cx, 114, cx + 16, 102);
  ctx.lineTo(cx, 126);
  ctx.closePath();
  ctx.fill();

  // Lapelas da gola da camisa com sombra projetada
  ctx.fillStyle = safeShirt;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 21, 98);
  ctx.lineTo(cx - 10, 120);
  ctx.lineTo(cx - 28, 114);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + 21, 98);
  ctx.lineTo(cx + 10, 120);
  ctx.lineTo(cx + 28, 114);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Alças de jardineira/suspensório para trabalhadores rurais e protagonista
  if (isProtagonist || hash % 2 === 0) {
    const strapGrad = ctx.createLinearGradient(0, 104, 0, 140);
    strapGrad.addColorStop(0, '#1e3a8a');
    strapGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = strapGrad;
    ctx.fillRect(cx - 34, 105, 11, 36);
    ctx.fillRect(cx + 23, 105, 11, 36);
    // Botões metálicos de latão escovado
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx - 28.5, 124, 3.2, 0, Math.PI * 2);
    ctx.arc(cx + 28.5, 124, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 5. ORELHAS ESCULPIDAS COM HÉLICE E LÓBULO
  for (const side of [-1, 1]) {
    const ex = cx + side * 31.5;
    const ey = 66;
    const earGrad = ctx.createLinearGradient(ex - 4, ey - 10, ex + 4, ey + 10);
    earGrad.addColorStop(0, skin.mid);
    earGrad.addColorStop(0.6, skin.warm);
    earGrad.addColorStop(1, skin.shadow);
    ctx.fillStyle = earGrad;
    ctx.strokeStyle = skin.deep;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 5.5, 10.5, side * -0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Concha interna da orelha
    ctx.strokeStyle = skin.shadow;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ex - side * 1, ey, 3.2, -Math.PI * 0.4, Math.PI * 0.5);
    ctx.stroke();

    // Brinco artesanal discreto em personagens femininas
    if (isFemale) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ex + side * 1, ey + 9.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. ESTRUTURA CRANIANA E FACIAL FOTORREALISTA (MANDÍBULA, MAÇÃS DO ROSTO, TESTA E QUEIXO)
  const faceGrad = ctx.createRadialGradient(cx - 7, 54, 4, cx, 64, 42);
  faceGrad.addColorStop(0, skin.highlight);
  faceGrad.addColorStop(0.42, skin.mid);
  faceGrad.addColorStop(0.78, skin.warm);
  faceGrad.addColorStop(1, skin.shadow);

  ctx.fillStyle = faceGrad;
  ctx.strokeStyle = skin.deep;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx - 31, 52);
  ctx.bezierCurveTo(cx - 32, 30, cx - 18, 22, cx, 22);
  ctx.bezierCurveTo(cx + 18, 22, cx + 32, 30, cx + 31, 52);
  // Maçãs do rosto até linha da mandíbula e queixo
  ctx.bezierCurveTo(cx + 32, 68, cx + 27, 82, cx + 16, 91);
  ctx.quadraticCurveTo(cx, 99, cx - 16, 91);
  ctx.bezierCurveTo(cx - 27, 82, cx - 32, 68, cx - 31, 52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Iluminação Subsurface Scattering nas maçãs do rosto e têmporas (warm blush & golden rim light)
  for (const side of [-1, 1]) {
    const cheekGlow = ctx.createRadialGradient(cx + side * 17, 69, 1, cx + side * 17, 69, 13);
    cheekGlow.addColorStop(0, 'rgba(225, 95, 75, 0.24)');
    cheekGlow.addColorStop(1, 'rgba(225, 95, 75, 0)');
    ctx.fillStyle = cheekGlow;
    ctx.beginPath();
    ctx.arc(cx + side * 17, 69, 13, 0, Math.PI * 2);
    ctx.fill();

    // Brilho nas maçãs do rosto
    const highlightGlow = ctx.createRadialGradient(cx + side * 14, 63, 0.5, cx + side * 14, 63, 7);
    highlightGlow.addColorStop(0, 'rgba(255, 240, 225, 0.34)');
    highlightGlow.addColorStop(1, 'rgba(255, 240, 225, 0)');
    ctx.fillStyle = highlightGlow;
    ctx.beginPath();
    ctx.arc(cx + side * 14, 63, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sulcos nasolabiais naturais e linhas de expressão de sabedoria para idosos
  ctx.strokeStyle = isElder ? 'rgba(90, 42, 18, 0.48)' : 'rgba(110, 52, 24, 0.22)';
  ctx.lineWidth = isElder ? 1.3 : 0.9;
  ctx.beginPath();
  ctx.moveTo(cx - 8, 69);
  ctx.quadraticCurveTo(cx - 14, 75, cx - 12, 82);
  ctx.moveTo(cx + 8, 69);
  ctx.quadraticCurveTo(cx + 14, 75, cx + 12, 82);
  if (isElder) {
    // Linhas suaves na testa
    ctx.moveTo(cx - 12, 39);
    ctx.quadraticCurveTo(cx, 37.5, cx + 12, 39);
    ctx.moveTo(cx - 10, 42.5);
    ctx.quadraticCurveTo(cx, 41, cx + 10, 42.5);
  }
  ctx.stroke();

  // 7. OLHOS FOTORREALISTAS (ESCLERA SOMBRIADA, ÍRIS COM FIBRAS RADIAIS, PUPILA, PÁLPEBRAS E BRILHO CORNEANO)
  const irisColors = ['#3b2212', '#4a3219', '#2c4c38', '#5c3a1e'];
  const irisCol = isProtagonist ? '#3b2212' : irisColors[hash % irisColors.length];

  for (const side of [-1, 1]) {
    const ex = cx + side * 13.5;
    const ey = 56.5;

    // Sombra da cavidade ocular (órbita)
    const socketGrad = ctx.createRadialGradient(ex, ey - 1, 2, ex, ey - 1, 10.5);
    socketGrad.addColorStop(0, 'rgba(92, 44, 18, 0.36)');
    socketGrad.addColorStop(1, 'rgba(92, 44, 18, 0)');
    ctx.fillStyle = socketGrad;
    ctx.beginPath();
    ctx.arc(ex, ey - 1, 10.5, 0, Math.PI * 2);
    ctx.fill();

    // Esclera amendoada com leve sombreamento superior
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ex - 7.5, ey + 0.5);
    ctx.quadraticCurveTo(ex, ey - 5.2, ex + 7.5, ey + 0.5);
    ctx.quadraticCurveTo(ex, ey + 4.8, ex - 7.5, ey + 0.5);
    ctx.closePath();
    ctx.clip();

    const scleraGrad = ctx.createLinearGradient(ex, ey - 4, ex, ey + 4);
    scleraGrad.addColorStop(0, '#cbd5e1');
    scleraGrad.addColorStop(0.35, '#f8fafc');
    scleraGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = scleraGrad;
    ctx.fillRect(ex - 8, ey - 6, 16, 12);

    // Íris detalhada
    const irisGrad = ctx.createRadialGradient(ex, ey, 0.8, ex, ey, 4.1);
    irisGrad.addColorStop(0, '#78472a');
    irisGrad.addColorStop(0.65, irisCol);
    irisGrad.addColorStop(1, '#140b05');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, 4.0, 0, Math.PI * 2);
    ctx.fill();

    // Pupila
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(ex, ey, 1.85, 0, Math.PI * 2);
    ctx.fill();

    // Reflexo corneano principal (janela de luz) e secundário
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 1.3, ey - 1.3, 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(ex + 1.4, ey + 1.1, 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Dobra da pálpebra superior (crease)
    ctx.strokeStyle = skin.deep;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(ex - 7.5, ey - 2.2);
    ctx.quadraticCurveTo(ex, ey - 6.8, ex + 7.5, ey - 2.2);
    ctx.stroke();

    // Linha de cílios superior e contorno amendoado
    ctx.strokeStyle = '#140a04';
    ctx.lineWidth = isFemale ? 2.1 : 1.65;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 7.6, ey + 0.5);
    ctx.quadraticCurveTo(ex, ey - 5.2, ex + 7.8, ey + 0.3);
    ctx.stroke();

    // Linha d'água inferior sutil
    ctx.strokeStyle = 'rgba(74, 34, 14, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(ex - 6.8, ey + 0.8);
    ctx.quadraticCurveTo(ex, ey + 4.8, ex + 6.8, ey + 0.6);
    ctx.stroke();
  }

  // 8. SOBRANCELHAS COM FIOS ESCULPIDOS
  for (const side of [-1, 1]) {
    const bx = cx + side * 13.5;
    const by = 48.2;
    ctx.strokeStyle = hairColor;
    ctx.lineWidth = isFemale ? 2.2 : 2.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx - side * 7.5, by + 1.2);
    ctx.quadraticCurveTo(bx, by - 2.4, bx + side * 8.2, by + 1.6);
    ctx.stroke();
  }

  // 9. NARIZ ESCULPIDO EM 3D (PONTE NASAL, PONTA ILUMINADA, ASAS NASAIS E NARINAS)
  // Sombra lateral da ponte nasal
  const noseShadow = ctx.createLinearGradient(cx - 6, 54, cx + 6, 70);
  noseShadow.addColorStop(0, 'rgba(115, 56, 26, 0.38)');
  noseShadow.addColorStop(0.5, 'rgba(255, 235, 215, 0.35)');
  noseShadow.addColorStop(1, 'rgba(115, 56, 26, 0.45)');
  ctx.fillStyle = noseShadow;
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, 54);
  ctx.lineTo(cx - 5.8, 69);
  ctx.quadraticCurveTo(cx, 72.5, cx + 5.8, 69);
  ctx.lineTo(cx + 3.5, 54);
  ctx.closePath();
  ctx.fill();

  // Brilho na ponta e dorso do nariz
  ctx.strokeStyle = 'rgba(255, 244, 230, 0.58)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 0.5, 55);
  ctx.lineTo(cx - 0.5, 67.5);
  ctx.stroke();

  // Narinas e base do nariz
  ctx.fillStyle = skin.deep;
  ctx.beginPath();
  ctx.ellipse(cx - 3.6, 70.2, 1.9, 1.1, 0.35, 0, Math.PI * 2);
  ctx.ellipse(cx + 3.6, 70.2, 1.9, 1.1, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = skin.shadow;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 6.8, 68.5);
  ctx.quadraticCurveTo(cx - 7.5, 71.2, cx - 4.2, 71.5);
  ctx.moveTo(cx + 6.8, 68.5);
  ctx.quadraticCurveTo(cx + 7.5, 71.2, cx + 4.2, 71.5);
  ctx.stroke();

  // 10. BARBA / BIGODE OPCIONAL PARA PERSONAGENS MASCULINOS ADULTOS/IDOSOS
  if (!isFemale && (isElder || (!isProtagonist && hash % 2 === 1))) {
    ctx.fillStyle = isElder ? 'rgba(215, 220, 228, 0.78)' : 'rgba(42, 24, 14, 0.55)';
    ctx.beginPath();
    ctx.moveTo(cx - 22, 74);
    ctx.quadraticCurveTo(cx, 71, cx + 22, 74);
    ctx.quadraticCurveTo(cx + 18, 93, cx, 96);
    ctx.quadraticCurveTo(cx - 18, 93, cx - 22, 74);
    ctx.closePath();
    ctx.fill();
  }

  // 11. LÁBIOS REALISTAS COM ARCO DO CUPIDO, SORRISO HUMANO E VOLUME
  // Lábio superior
  ctx.fillStyle = isFemale ? '#b84a49' : skin.lipUpper;
  ctx.beginPath();
  ctx.moveTo(cx - 10.5, 79.5);
  ctx.quadraticCurveTo(cx - 4.5, 76.5, cx, 78.2);
  ctx.quadraticCurveTo(cx + 4.5, 76.5, cx + 10.5, 79.5);
  ctx.quadraticCurveTo(cx, 81.5, cx - 10.5, 79.5);
  ctx.closePath();
  ctx.fill();

  // Lábio inferior com brilho central
  ctx.fillStyle = isFemale ? '#d46260' : skin.lipLower;
  ctx.beginPath();
  ctx.moveTo(cx - 10.2, 79.6);
  ctx.quadraticCurveTo(cx, 85.8, cx + 10.2, 79.6);
  ctx.quadraticCurveTo(cx, 81.2, cx - 10.2, 79.6);
  ctx.closePath();
  ctx.fill();

  // Linha de sorriso entre os lábios
  ctx.strokeStyle = skin.deep;
  ctx.lineWidth = 1.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 11.2, 79.2);
  ctx.quadraticCurveTo(cx, 81.8, cx + 11.2, 79.2);
  ctx.stroke();

  // Brilho especular suave no lábio inferior
  ctx.strokeStyle = 'rgba(255, 240, 235, 0.45)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, 82.3);
  ctx.quadraticCurveTo(cx, 83.1, cx + 3.5, 82.3);
  ctx.stroke();

  // 12. CABELO MODELADO COM FIOS E VOLUME NATURAL
  const hairTopGrad = ctx.createLinearGradient(cx, 16, cx, 52);
  hairTopGrad.addColorStop(0, hairColor);
  hairTopGrad.addColorStop(1, '#120904');
  ctx.fillStyle = hairTopGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 32, 54);
  ctx.bezierCurveTo(cx - 35, 25, cx - 18, 16, cx, 16);
  ctx.bezierCurveTo(cx + 18, 16, cx + 35, 25, cx + 32, 54);
  ctx.quadraticCurveTo(cx + 25, 34, cx + 8, 33);
  ctx.quadraticCurveTo(cx - 6, 31, cx - 22, 37);
  ctx.quadraticCurveTo(cx - 28, 43, cx - 32, 54);
  ctx.closePath();
  ctx.fill();

  // 13. CHAPÉU DE PALHA ACREANO TRANÇADO (SE APLICÁVEL)
  if (hatColor || isProtagonist) {
    const hCol = hatColor ?? '#f2c138';
    // Sombra projetada da aba na testa
    const brimShadow = ctx.createLinearGradient(cx, 30, cx, 44);
    brimShadow.addColorStop(0, 'rgba(28, 12, 4, 0.52)');
    brimShadow.addColorStop(1, 'rgba(28, 12, 4, 0)');
    ctx.fillStyle = brimShadow;
    ctx.fillRect(cx - 31, 31, 62, 12);

    // Copa do chapéu com textura de palha
    const crownGrad = ctx.createLinearGradient(cx - 28, 8, cx + 28, 32);
    crownGrad.addColorStop(0, '#fef08a');
    crownGrad.addColorStop(0.5, hCol);
    crownGrad.addColorStop(1, '#a16207');
    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 27, 31);
    ctx.quadraticCurveTo(cx - 24, 10, cx, 10);
    ctx.quadraticCurveTo(cx + 24, 10, cx + 27, 31);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fita de couro/tecido na base da copa
    ctx.fillStyle = isProtagonist ? '#0d9488' : '#78350f';
    ctx.fillRect(cx - 26.5, 26, 53, 4.5);

    // Aba curvada frontal em perspectiva 2.5D
    const brimGrad = ctx.createLinearGradient(cx - 48, 28, cx + 48, 36);
    brimGrad.addColorStop(0, '#ca8a04');
    brimGrad.addColorStop(0.5, '#fef08a');
    brimGrad.addColorStop(1, '#a16207');
    ctx.fillStyle = brimGrad;
    ctx.beginPath();
    ctx.ellipse(cx, 31.5, 46, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Moldura fotográfica interna sutil
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  ctx.restore();
}

export const drawNpcPortrait = drawCharacterPortrait32Bit;

/**
 * Desenha ícones 2D ilustrados à mão (estilo arte de jogo 2D detalhada, sem visual chapado de Canva)
 * para todas as ferramentas, menus do HUD, clima e sementes/cultivos.
 */
export function drawHandPaintedHudIcon2D(
  ctx: CanvasRenderingContext2D,
  name: string,
  w: number,
  h = w
) {
  enableHD(ctx);
  ctx.clearRect(0, 0, w, h);
  const s = w / 48;
  ctx.save();
  ctx.scale(s, s);

  // Sombra base suave de ícone de jogo
  drawSoftShadow(ctx, 24, 41, 14, 4.5, 0.32);

  switch (name) {
    case 'enxada': {
      // Cabo de madeira torneada de lei com veios e chanfro
      const woodGrad = ctx.createLinearGradient(8, 38, 34, 12);
      woodGrad.addColorStop(0, '#78350f');
      woodGrad.addColorStop(0.5, '#d97706');
      woodGrad.addColorStop(1, '#92400e');
      ctx.strokeStyle = '#271206';
      ctx.lineWidth = 7.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(9, 39);
      ctx.lineTo(33, 13);
      ctx.stroke();

      ctx.strokeStyle = woodGrad;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(9, 39);
      ctx.lineTo(33, 13);
      ctx.stroke();

      // Lâmina de aço forjado reluzente da enxada
      const bladeGrad = ctx.createLinearGradient(24, 6, 42, 24);
      bladeGrad.addColorStop(0, '#f8fafc');
      bladeGrad.addColorStop(0.45, '#94a3b8');
      bladeGrad.addColorStop(0.8, '#475569');
      bladeGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bladeGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, 10);
      ctx.lineTo(34, 6);
      ctx.lineTo(42, 16);
      ctx.lineTo(33, 25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fio de corte brilhante + anel de fixação de ferro
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(33, 24);
      ctx.lineTo(41, 16);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(31, 14, 3.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'semente': {
      // Saquinho de juta/estopa ribeirinho amarrado com cordão + maniva e broto verde vivo
      const bagGrad = ctx.createRadialGradient(22, 26, 3, 24, 28, 16);
      bagGrad.addColorStop(0, '#fde68a');
      bagGrad.addColorStop(0.55, '#d97706');
      bagGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = bagGrad;
      ctx.strokeStyle = '#271206';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 17);
      ctx.quadraticCurveTo(10, 26, 13, 37);
      ctx.quadraticCurveTo(24, 42, 35, 37);
      ctx.quadraticCurveTo(38, 26, 32, 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Broto botânico de folhas verdes saindo do saco de sementes
      drawFoliageSphere25D(ctx, 19, 13, 7, 4.5, '#14532d', '#22c55e', '#bbf7d0');
      drawFoliageSphere25D(ctx, 29, 13, 7, 4.5, '#14532d', '#22c55e', '#bbf7d0');
      drawFoliageSphere25D(ctx, 24, 9, 5.5, 4, '#166534', '#4ade80', '#dcfce7');

      // Sementes douradas desenhadas na frente do saco
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.2;
      for (const sx of [20, 24, 28]) {
        ctx.beginPath();
        ctx.ellipse(sx, 29, 2.5, 3.8, (sx - 24) * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }

    case 'regador': {
      // Regador metálico azul-celeste com alça curvada, bico crivo dourado e gotas d'água
      const canGrad = ctx.createLinearGradient(10, 18, 30, 38);
      canGrad.addColorStop(0, '#7dd3fc');
      canGrad.addColorStop(0.45, '#0284c7');
      canGrad.addColorStop(1, '#0c4a6e');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;

      // Alça superior e traseira
      ctx.beginPath();
      ctx.arc(19, 18, 9, Math.PI * 0.75, Math.PI * 2.15);
      ctx.stroke();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Bico longo do regador
      ctx.fillStyle = canGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(27, 26);
      ctx.lineTo(39, 15);
      ctx.lineTo(41, 18);
      ctx.lineTo(29, 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crivo dourado na ponta do bico
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(40, 16.5, 3.8, 2.2, 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tambor cilíndrico do regador
      ctx.fillStyle = canGrad;
      ctx.beginPath();
      ctx.roundRect(10, 19, 19, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Gotas cristalinas caindo do bico
      for (const [gx, gy] of [
        [43, 23],
        [39, 27],
        [44, 30]
      ]) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(gx, gy, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx - 0.6, gy - 0.6, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'colheita': {
      // Paneiro amazônico de cipó trançado cheio de mandioca, açaí, milho e cupuaçu
      // Frutas no topo
      drawFoliageSphere25D(ctx, 16, 18, 6.5, 5.5, '#14532d', '#22c55e', '#86efac');
      drawFoliageSphere25D(ctx, 25, 16, 6.5, 5.5, '#7c2d12', '#ea580c', '#fdba74');
      drawFoliageSphere25D(ctx, 32, 19, 6, 5, '#3b0764', '#7e22ce', '#d8b4fe');

      // Cesto trançado
      const basketGrad = ctx.createLinearGradient(8, 20, 40, 39);
      basketGrad.addColorStop(0, '#f59e0b');
      basketGrad.addColorStop(0.5, '#b45309');
      basketGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = basketGrad;
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 21);
      ctx.lineTo(40, 21);
      ctx.lineTo(35, 38);
      ctx.quadraticCurveTo(24, 41, 13, 38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Trama de vime/cipó
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.45)';
      ctx.lineWidth = 1.3;
      for (let bx = 14; bx <= 34; bx += 5) {
        ctx.beginPath();
        ctx.moveTo(bx, 22);
        ctx.lineTo(bx + (bx < 24 ? 1 : -1), 37);
        ctx.stroke();
      }
      break;
    }

    case 'vara_pesca': {
      // Vara de bambu envergada + linha + boia vermelha e branca + peixe tambaqui prateado
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(8, 40);
      ctx.quadraticCurveTo(20, 18, 36, 7);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(8, 40);
      ctx.quadraticCurveTo(20, 18, 36, 7);
      ctx.stroke();

      // Linha de pesca
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(36, 7);
      ctx.quadraticCurveTo(40, 20, 33, 31);
      ctx.stroke();

      // Boia clássica vermelha/branca
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(33, 31, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(33, 31, 4.8, Math.PI, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'machado_limpeza': {
      // Machado/Terçado Ribeirinho para manejo e cuidado
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, 38);
      ctx.lineTo(28, 18);
      ctx.stroke();

      const axeGrad = ctx.createLinearGradient(20, 8, 40, 26);
      axeGrad.addColorStop(0, '#f1f5f9');
      axeGrad.addColorStop(0.5, '#64748b');
      axeGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = axeGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(22, 13);
      ctx.quadraticCurveTo(34, 8, 40, 18);
      ctx.quadraticCurveTo(33, 28, 25, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'mochila': {
      // Mochila de lona verde-floresta com fivelas de couro e bolso frontal
      const packGrad = ctx.createLinearGradient(10, 10, 38, 40);
      packGrad.addColorStop(0, '#34d399');
      packGrad.addColorStop(0.45, '#059669');
      packGrad.addColorStop(1, '#064e3b');
      ctx.fillStyle = packGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(10, 12, 28, 27, 7);
      ctx.fill();
      ctx.stroke();

      // Aba superior de couro marrom
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(11, 11, 26, 11, 5);
      ctx.fill();
      ctx.stroke();

      // Tiras de couro e fivelas douradas
      ctx.fillStyle = '#78350f';
      ctx.fillRect(15, 16, 4, 18);
      ctx.fillRect(29, 16, 4, 18);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14.5, 23, 5, 4);
      ctx.fillRect(28.5, 23, 5, 4);
      break;
    }

    case 'feira': {
      // Barraca da Feira de Cruzeiro do Sul com toldo listrado colorido e moeda dourada
      ctx.fillStyle = '#78350f';
      ctx.fillRect(11, 18, 3, 20);
      ctx.fillRect(34, 18, 3, 20);

      // Balcão de madeira
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(9, 28, 30, 11, 3);
      ctx.fill();
      ctx.stroke();

      // Toldo listrado vermelho/amarelo
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#fef08a';
        ctx.beginPath();
        ctx.roundRect(8 + i * 8, 9, 8, 11, 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }

    case 'diario': {
      // Caderno de Campo encadernado em couro com marcador de página e pena/folha
      const bookGrad = ctx.createLinearGradient(10, 8, 38, 40);
      bookGrad.addColorStop(0, '#f59e0b');
      bookGrad.addColorStop(0.5, '#b45309');
      bookGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = bookGrad;
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(11, 7, 26, 34, 4);
      ctx.fill();
      ctx.stroke();

      // Páginas creme internas
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(15, 10, 19, 28);

      // Linhas manuscritas e selo botânico
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(18, 16);
      ctx.lineTo(31, 16);
      ctx.moveTo(18, 21);
      ctx.lineTo(31, 21);
      ctx.moveTo(18, 26);
      ctx.lineTo(27, 26);
      ctx.stroke();
      break;
    }

    case 'opcoes': {
      // Engrenagem de bronze e aço polido
      const gearGrad = ctx.createRadialGradient(22, 22, 3, 24, 24, 16);
      gearGrad.addColorStop(0, '#f8fafc');
      gearGrad.addColorStop(0.55, '#94a3b8');
      gearGrad.addColorStop(1, '#334155');
      ctx.fillStyle = gearGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;

      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.save();
        ctx.translate(24, 24);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.roundRect(-4, -18, 8, 36, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(24, 24, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(24, 24, 5.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'agir': {
      // Insígnia de Ação / Mão e Centelha Dourada
      const boltGrad = ctx.createLinearGradient(14, 6, 34, 42);
      boltGrad.addColorStop(0, '#fef08a');
      boltGrad.addColorStop(0.5, '#f59e0b');
      boltGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = boltGrad;
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(26, 5);
      ctx.lineTo(11, 26);
      ctx.lineTo(23, 26);
      ctx.lineTo(20, 43);
      ctx.lineTo(37, 21);
      ctx.lineTo(25, 21);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'camera': {
      // Câmera fotográfica/binóculo de observação com lente reflexiva
      const camGrad = ctx.createLinearGradient(8, 12, 40, 38);
      camGrad.addColorStop(0, '#475569');
      camGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = camGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(8, 14, 32, 23, 5);
      ctx.fill();
      ctx.stroke();

      const lensGrad = ctx.createRadialGradient(22, 23, 1, 24, 25, 9);
      lensGrad.addColorStop(0, '#e0f2fe');
      lensGrad.addColorStop(0.45, '#0284c7');
      lensGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(24, 25.5, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'sol': {
      const sunGrad = ctx.createRadialGradient(22, 22, 2, 24, 24, 14);
      sunGrad.addColorStop(0, '#fef9c3');
      sunGrad.addColorStop(0.55, '#facc15');
      sunGrad.addColorStop(1, '#ea580c');
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(24 + Math.cos(a) * 14, 24 + Math.sin(a) * 14);
        ctx.lineTo(24 + Math.cos(a) * 19, 24 + Math.sin(a) * 19);
        ctx.stroke();
      }
      ctx.fillStyle = sunGrad;
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(24, 24, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'chuva':
    case 'nublado': {
      const cloudGrad = ctx.createLinearGradient(12, 10, 36, 30);
      cloudGrad.addColorStop(0, '#f8fafc');
      cloudGrad.addColorStop(0.6, '#94a3b8');
      cloudGrad.addColorStop(1, '#475569');
      ctx.fillStyle = cloudGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(18, 22, 8, Math.PI * 0.5, Math.PI * 1.6);
      ctx.arc(26, 18, 9.5, Math.PI * 0.9, Math.PI * 1.95);
      ctx.arc(33, 23, 7, Math.PI * 1.3, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (name === 'chuva') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        for (const rx of [16, 24, 32]) {
          ctx.beginPath();
          ctx.moveTo(rx, 31);
          ctx.lineTo(rx - 3, 39);
          ctx.stroke();
        }
      }
      break;
    }

    case 'som_ligado':
    case 'som_mudo': {
      const hornGrad = ctx.createLinearGradient(10, 14, 28, 34);
      hornGrad.addColorStop(0, '#fde68a');
      hornGrad.addColorStop(0.5, '#f59e0b');
      hornGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = hornGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9, 20);
      ctx.lineTo(16, 20);
      ctx.lineTo(26, 11);
      ctx.lineTo(26, 37);
      ctx.lineTo(16, 28);
      ctx.lineTo(9, 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (name === 'som_ligado') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(28, 24, 6, -0.7, 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(28, 24, 11, -0.7, 0.7);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(31, 18);
        ctx.lineTo(40, 30);
        ctx.moveTo(40, 18);
        ctx.lineTo(31, 30);
        ctx.stroke();
      }
      break;
    }

    default: {
      const crop = CROPS_DATA[name] ?? CROPS_DATA.mandioca;
      drawFoliageSphere25D(ctx, 24, 16, 10, 7, '#14532d', '#22c55e', '#86efac');
      drawFoliageSphere25D(ctx, 24, 28, 11, 9, crop.secondaryColor, crop.accentColor, '#ffffff');
      break;
    }
  }

  ctx.restore();
}

export function drawPixelIcon(
  ctx: CanvasRenderingContext2D,
  kind: string,
  w: number,
  h = w
) {
  drawHandPaintedHudIcon2D(ctx, kind, w, h);
}

// ============================================================================
// 8. CENAS CINEMATOGRÁFICAS 2.5D HD: PRÓLOGO, MENU DE TÍTULO E ÔNIBUS
// ============================================================================

export function drawTitleScreenPixelScene(
  ctx: CanvasRenderingContext2D,
  realW: number,
  realH: number,
  tick: number
) {
  if (realW <= 0 || realH <= 0) return;
  enableHD(ctx);

  const horizonY = realH * 0.52;

  // 1. Céu crepuscular amazônico em gradiente contínuo 2.5D HD
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#131d38');
  skyGrad.addColorStop(0.3, '#393d6e');
  skyGrad.addColorStop(0.62, '#9e5263');
  skyGrad.addColorStop(0.84, '#e68849');
  skyGrad.addColorStop(1, '#ffde7a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, realW, horizonY + 2);

  // Sol dourado sobre o Rio Juruá com halo atmosférico
  const sunX = realW * 0.56;
  const sunY = horizonY - realH * 0.04;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, realH * 0.22);
  sunGlow.addColorStop(0, 'rgba(255, 250, 215, 0.96)');
  sunGlow.addColorStop(0.35, 'rgba(255, 212, 110, 0.55)');
  sunGlow.addColorStop(1, 'rgba(255, 160, 75, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, realH * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // 2. Cordilheira de Floresta Amazônica e palafitas iluminadas na margem
  ctx.fillStyle = '#183614';
  ctx.fillRect(0, horizonY - 26, realW, 28);
  for (let tx = 0; tx < realW + 40; tx += 36) {
    const r = hash2d(tx, 19);
    const rad = 22 + r * 14;
    drawFoliageSphere25D(ctx, tx, horizonY - 18 - r * 12, rad, rad * 0.75, '#142e10', '#2b5920', '#589c3b');
  }

  // 3. Águas espelhadas do Rio Juruá em 2.5D HD
  const riverGrad = ctx.createLinearGradient(0, horizonY, 0, realH);
  riverGrad.addColorStop(0, '#2b6487');
  riverGrad.addColorStop(0.38, '#1e4d6b');
  riverGrad.addColorStop(1, '#0e293d');
  ctx.fillStyle = riverGrad;
  ctx.fillRect(0, horizonY, realW, realH - horizonY);

  // Reflexo solar ondulante nas águas
  for (let i = 0; i < 16; i++) {
    const prog = i / 16;
    const ry = horizonY + 8 + prog * (realH - horizonY - 20);
    const rw = (1 - prog * 0.55) * (realW * 0.26);
    const rx = sunX - rw * 0.5 + Math.sin(i * 0.7 + tick * 0.08) * 6;
    ctx.fillStyle = prog < 0.5 ? 'rgba(255, 226, 125, 0.55)' : 'rgba(235, 150, 75, 0.35)';
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, 3.5, 2);
    ctx.fill();
  }

  // 4. Trapiche de madeira em perspectiva 2.5D no primeiro plano
  const pierTopY = realH * 0.62;
  for (let i = 0; i < 11; i++) {
    const p = i / 11;
    const py = pierTopY + p * (realH - pierTopY);
    const pw = realW * (0.36 + p * 0.24);
    const pxX = realW * 0.5 - pw * 0.42;
    const plankGrad = ctx.createLinearGradient(pxX, py, pxX, py + 14);
    plankGrad.addColorStop(0, '#c2834b');
    plankGrad.addColorStop(0.6, '#8f582a');
    plankGrad.addColorStop(1, '#4a290e');
    ctx.fillStyle = plankGrad;
    ctx.beginPath();
    ctx.roundRect(pxX, py, pw, 11, 4);
    ctx.fill();
  }

  // Protagonista contemplando o Rio Juruá no trapiche
  drawCharacterSprite(
    ctx,
    realW * 0.52 - 24,
    pierTopY - 36,
    'up',
    0,
    '#2e7040',
    '#f2c138',
    '#361e10'
  );
}

export function drawStoryIntroScene25D(
  ctx: CanvasRenderingContext2D,
  realW: number,
  realH: number,
  slideIdx: number,
  tick: number
) {
  if (realW <= 0 || realH <= 0) return;
  enableHD(ctx);

  // Fundo base ribeirinho 2.5D HD
  drawTitleScreenPixelScene(ctx, realW, realH, tick);

  // Quadro ilustrado central 2.5D HD exclusivo para cada um dos 3 capítulos do Prólogo
  const cardW = Math.min(realW * 0.86, 440);
  const cardH = Math.min(realH * 0.28, 190);
  const cardX = (realW - cardW) * 0.5;
  const cardY = realH * 0.25;

  ctx.save();
  ctx.fillStyle = 'rgba(28, 16, 8, 0.88)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.strokeStyle = '#e0b263';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (slideIdx === 0) {
    // Cena 1: A Carta Selada do Avô Raimundo
    const envW = 136;
    const envH = 86;
    const ex = cardX + (cardW - envW) * 0.5;
    const ey = cardY + (cardH - envH) * 0.5;
    const envGrad = ctx.createLinearGradient(ex, ey, ex, ey + envH);
    envGrad.addColorStop(0, '#fff5db');
    envGrad.addColorStop(1, '#dfc496');
    ctx.fillStyle = envGrad;
    ctx.beginPath();
    ctx.roundRect(ex, ey, envW, envH, 8);
    ctx.fill();
    ctx.strokeStyle = '#8c5d30';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Aba do envelope e selo de cera vermelho do Vale do Juruá
    ctx.beginPath();
    ctx.moveTo(ex + 4, ey + 4);
    ctx.lineTo(ex + envW * 0.5, ey + envH * 0.56);
    ctx.lineTo(ex + envW - 4, ey + 4);
    ctx.stroke();

    ctx.fillStyle = '#c93429';
    ctx.beginPath();
    ctx.arc(ex + envW * 0.5, ey + envH * 0.54, 13, 0, Math.PI * 2);
    ctx.fill();
  } else if (slideIdx === 1) {
    // Cena 2: As 10 Manivas de Mandioca Mansa da Família
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const sx = cardX + cardW * 0.22 + col * (cardW * 0.14);
      const sy = cardY + cardH * 0.36 + row * 48;
      drawFoliageSphere25D(ctx, sx, sy, 14, 10, '#4f2d12', '#8c5528', '#c9884d', '#2b1608');
      drawFoliageSphere25D(ctx, sx, sy - 9, 8, 6, '#235916', '#52ad34', '#9be86b');
    }
  } else {
    // Cena 3: A Evolução Semanal (Roçado, Canoa no Rio e Casa de Farinha)
    drawCanoeVessel(ctx, cardX + cardW * 0.22, cardY + cardH * 0.45, 'right', true);
    drawFarmPlotAndCrop(ctx, cardX + cardW * 0.48, cardY + cardH * 0.42, true, true, 'mandioca', 4, tick, false);
    drawAnimalSprite(ctx, 'galinha', cardX + cardW * 0.72, cardY + cardH * 0.44, tick, true);
  }
  ctx.restore();
}

export function drawBusArrivalCutscene25D(
  ctx: CanvasRenderingContext2D,
  realW: number,
  realH: number,
  progress: number,
  tick: number
) {
  if (realW <= 0 || realH <= 0) return;
  enableHD(ctx);

  const horizonY = realH * 0.34;

  // 1. Céu dourado da manhã no Vale do Juruá
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#1e3c6e');
  skyGrad.addColorStop(0.55, '#598ec9');
  skyGrad.addColorStop(1, '#f7d794');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, realW, horizonY + 4);

  // 2. Floresta e colinas suaves ao fundo
  const meadowGrad = ctx.createLinearGradient(0, horizonY, 0, realH);
  meadowGrad.addColorStop(0, '#2d591e');
  meadowGrad.addColorStop(0.45, '#467d30');
  meadowGrad.addColorStop(1, '#2f591f');
  ctx.fillStyle = meadowGrad;
  ctx.fillRect(0, horizonY, realW, realH - horizonY);

  for (let tx = 0; tx < realW + 40; tx += 38) {
    const r = hash2d(tx, 7);
    drawFoliageSphere25D(ctx, tx, horizonY - 8 - r * 10, 24, 18, '#193b12', '#2f6321', '#62ab44');
  }

  // 3. Igarapé cristalino cruzando sob a ponte de madeira do ramal
  const streamX = realW * 0.34;
  const streamGrad = ctx.createLinearGradient(streamX - 24, horizonY, streamX + 24, realH);
  streamGrad.addColorStop(0, '#2b7ba3');
  streamGrad.addColorStop(1, '#175478');
  ctx.fillStyle = streamGrad;
  ctx.beginPath();
  ctx.moveTo(streamX - 18, horizonY);
  ctx.lineTo(streamX + 22, horizonY);
  ctx.lineTo(streamX - 8, realH);
  ctx.lineTo(streamX - 52, realH);
  ctx.closePath();
  ctx.fill();

  // 4. Estrada rural do Sítio Boa Esperança com acostamento e ponte de madeira
  const roadY = realH * 0.47;
  const roadH = 76;
  const roadGrad = ctx.createLinearGradient(0, roadY, 0, roadY + roadH);
  roadGrad.addColorStop(0, '#c28b58');
  roadGrad.addColorStop(0.5, '#a47043');
  roadGrad.addColorStop(1, '#7d5027');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, roadY, realW, roadH);

  // Ponte de madeira sobre o igarapé
  ctx.fillStyle = '#8f582a';
  ctx.beginPath();
  ctx.roundRect(streamX - 42, roadY - 4, 68, roadH + 8, 6);
  ctx.fill();
  ctx.strokeStyle = '#4a290e';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Árvores amazônicas e porteira da Fazenda à direita
  for (let tx = 24; tx < realW - 40; tx += 96) {
    drawRegionalTree(ctx, tx, roadY - 64, tx % 192 === 0 ? 'samauma' : 'acai');
  }

  // Porteira de madeira do Sítio Boa Esperança
  const gateX = realW * 0.72;
  ctx.fillStyle = '#5e3417';
  ctx.fillRect(gateX, roadY - 38, 8, 44);
  ctx.fillRect(gateX + 64, roadY - 38, 8, 44);
  ctx.fillStyle = '#ba7c40';
  ctx.beginPath();
  ctx.roundRect(gateX - 8, roadY - 46, 88, 18, 5);
  ctx.fill();
  ctx.fillStyle = '#fff5de';
  ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SÍTIO BOA ESPERANÇA', gateX + 36, roadY - 34);

  // 5. Ônibus regional avançando suavemente pela estrada até o portão da fazenda
  const busX = -50 + progress * (gateX - 18);
  drawBusVehicle(ctx, busX, roadY + 15, 'right');

  // Roçado e flores na parte inferior do quadro
  for (let fx = 28; fx < realW; fx += 78) {
    drawFoliageSphere25D(ctx, fx, roadY + roadH + 34, 18, 12, '#1d4714', '#3d8228', '#78c953');
  }
  void tick;
}

export function renderArtSampleToDataUrl(sampleId: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  enableHD(ctx);
  drawTerrainTile(ctx, 'grass', 0, 0, 0, 0, 0);
  drawTerrainTile(ctx, 'grass', 48, 0, 1, 0, 0);
  drawTerrainTile(ctx, 'grass', 0, 48, 0, 1, 0);
  drawTerrainTile(ctx, 'grass', 48, 48, 1, 1, 0);
  if (sampleId.includes('tree') || sampleId.includes('arvore')) {
    drawRegionalTree(ctx, 24, 24, 'samauma');
  } else {
    drawCharacterSprite(ctx, 24, 24, 'down', 0, '#285985', '#f2c138', '#361e10');
  }
  return canvas.toDataURL();
}
