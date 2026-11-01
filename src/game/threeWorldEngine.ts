/**
 * MOTOR HÍBRIDO 3D + SPRITES 2.5D HD ILUSTRADOS REALISTAS (THREE.JS PBR)
 * - Personagens 2.5D HD (512x640) com roupas rurais completas em camadas (camiseta interna branca,
 *   camisa xadrez de manga dobrada em cores vibrantes, jardineira/macacão jeans com alças e fivelas
 *   de latão, calça jeans e botas de couro) — nunca confundindo cor de roupa com pele.
 * - Árvores e Cultivos em Billboards 2.5D HD únicos ancorados na base (center: 0.5, 0.05),
 *   eliminando duplicação de troncos em "X" ao girar a câmera.
 * - Canteiros Agrícolas 3D com moldura de madeira, leiras esculpidas, água reflexiva nos sulcos
 *   quando regado, semente/maniva (Estágio 0) e 4 fases botânicas detalhadas.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AnimalCategoryId, Direction, TileType, ToolId } from './rules';
import { MapBuilding } from '../data/maps';
import { CROPS_DATA } from '../data/crops';

export const WORLD_TILE_SIZE = 2.0;

// ============================================================================
// DETECÇÃO DE WEBGL E AMBIENTE PBR
// ============================================================================

export function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    return /SwiftShader|llvmpipe|Software|Basic Render Driver/i.test(rendererStr);
  } catch {
    return true;
  }
}

export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new RoomEnvironment();
  const envTex = pmrem.fromScene(envScene, 0.04).texture;
  envScene.dispose();
  pmrem.dispose();
  return envTex;
}

// ============================================================================
// GERADOR DE TEXTURAS PBR PROCEDURAIS REALISTAS (CACHE SINGLETON)
// ============================================================================

const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(
  key: string,
  width: number,
  height: number,
  repeatX: number,
  repeatY: number,
  isSRGB: boolean,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawFn(ctx, width, height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function getGrassPBRTexture(repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  return getOrCreateTexture(`grass_smooth_v2_${repeatX}_${repeatY}`, 512, 512, repeatX, repeatY, true, (ctx, w, h) => {
    ctx.fillStyle = '#437d31';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 240; i++) {
      const rx = (i * 97) % w;
      const ry = (i * 173) % h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(84, 146, 56, 0.08)' : 'rgba(48, 96, 34, 0.08)';
      ctx.fillRect(rx - 24, ry - 12, 48, 24);
    }

    ctx.lineWidth = 1.5;
    for (let i = 0; i < 950; i++) {
      const gx = (i * 53) % w;
      const gy = (i * 113) % h;
      ctx.strokeStyle = i % 3 === 0 ? '#5c9e41' : i % 3 === 1 ? '#356925' : '#6eb350';
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + 2, gy - 6, gx + (i % 5) - 2, gy - 11);
      ctx.stroke();
    }
  });
}

export function getDirtPathPBRTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('dirt_path_hd', 512, 512, 1, 1, true, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, w * 0.7);
    grad.addColorStop(0, '#c29260');
    grad.addColorStop(1, '#a87848');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 260; i++) {
      const x = (i * 71) % w;
      const y = (i * 131) % h;
      const rad = 4 + (i % 14);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(142, 96, 54, 0.24)' : 'rgba(214, 172, 124, 0.22)';
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 220; i++) {
      const x = (i * 83) % w;
      const y = (i * 149) % h;
      ctx.fillStyle = i % 3 === 0 ? '#7d522b' : '#dfba8c';
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function getWoodPlankPBRTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('wood_plank_hd', 512, 512, 1, 1, true, (ctx, w, h) => {
    ctx.fillStyle = '#7d4c22';
    ctx.fillRect(0, 0, w, h);

    const planks = 6;
    const plankH = h / planks;
    for (let p = 0; p < planks; p++) {
      const y0 = p * plankH;
      const pGrad = ctx.createLinearGradient(0, y0, 0, y0 + plankH);
      pGrad.addColorStop(0, p % 2 === 0 ? '#965e30' : '#855025');
      pGrad.addColorStop(0.5, p % 2 === 0 ? '#a46938' : '#91592b');
      pGrad.addColorStop(1, '#6b3e19');
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, y0 + 2, w, plankH - 4);

      ctx.strokeStyle = 'rgba(52, 26, 8, 0.32)';
      ctx.lineWidth = 1.6;
      for (let v = 0; v < 8; v++) {
        ctx.beginPath();
        ctx.moveTo(0, y0 + 7 + v * 9);
        ctx.bezierCurveTo(w * 0.33, y0 + 3 + v * 9, w * 0.66, y0 + 13 + v * 9, w, y0 + 7 + v * 9);
        ctx.stroke();
      }

      ctx.fillStyle = '#361b08';
      ctx.fillRect(0, y0, w, 3);
    }
  });
}

export function getClayRoofPBRTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('clay_roof_hd', 512, 512, 3, 2, true, (ctx, w, h) => {
    ctx.fillStyle = '#a84225';
    ctx.fillRect(0, 0, w, h);
    const cols = 10;
    const rows = 8;
    const cw = w / cols;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const y = r * rh;
        const grad = ctx.createLinearGradient(x, y, x + cw, y);
        grad.addColorStop(0, '#7d2c16');
        grad.addColorStop(0.45, '#d96543');
        grad.addColorStop(0.85, '#b5492a');
        grad.addColorStop(1, '#69220f');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y + 2, cw - 2, rh - 3);
      }
    }
  });
}

export function getWaterRippleTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('water_ripple_jurua_v3', 512, 512, 4, 3, true, (ctx, w, h) => {
    // Águas ricas do Rio Juruá e igarapés amazônicos com reflexos turquesa, esmeralda e dourado solar
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(0.32, '#0284c7');
    grad.addColorStop(0.65, '#0d9488');
    grad.addColorStop(1, '#075985');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Correntezas suaves em camadas
    for (let i = 0; i < 42; i++) {
      const y = (i * 41) % h;
      const x = (i * 83) % (w - 90);
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(186, 230, 253, 0.38)' : 'rgba(94, 234, 212, 0.25)';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 28, y - 9, x + 58, y + 9, x + 88, y);
      ctx.stroke();
    }

    // Brilhos especulares solares na superfície da água
    ctx.fillStyle = 'rgba(254, 249, 195, 0.28)';
    for (let i = 0; i < 36; i++) {
      const sx = (i * 97 + 20) % (w - 30);
      const sy = (i * 61 + 15) % (h - 20);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 8 + (i % 6), 2.2, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ============================================================================
// ETIQUETAS 3D FLUTUANTES (SPRITES DE ALTA NITIDEZ)
// ============================================================================

export function createLabelSprite3D(
  text: string,
  borderColor = '#e0b263',
  bgColor = 'rgba(28, 15, 7, 0.94)',
  textColor = '#fff7e6',
  scaleWidth = 2.8
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 640, 96);
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    const textW = Math.min(616, ctx.measureText(text).width + 48);
    const bx = (640 - textW) * 0.5;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(bx, 12, textW, 72, 20);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4.5;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 320, 49);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleWidth, scaleWidth * (96 / 640), 1);
  sprite.renderOrder = 25;
  return sprite;
}

export function updateLabelSprite3D(
  sprite: THREE.Sprite,
  text: string,
  borderColor = '#e0b263',
  bgColor = 'rgba(28, 15, 7, 0.94)',
  textColor = '#fff7e6'
) {
  const mat = sprite.material as THREE.SpriteMaterial;
  const tex = mat.map as THREE.CanvasTexture | null;
  if (!tex) return;
  const canvas = tex.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  const textW = Math.min(canvas.width - 24, ctx.measureText(text).width + 48);
  const bx = (canvas.width - textW) * 0.5;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(bx, 12, textW, 72, 20);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4.5;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width * 0.5, 49);
  tex.needsUpdate = true;
}

// ============================================================================
// 1. CONSTRUÇÃO DE TERRENO 3D PURO ("MAPINHA PURO") + ELEMENTOS RIBEIRINHOS 2D
// ============================================================================

export function buildTerrain3DGroup(
  tiles: TileType[][],
  width: number,
  height: number,
  castShadows: boolean
): { group: THREE.Group; waterMeshes: THREE.Mesh[] } {
  const group = new THREE.Group();
  const waterMeshes: THREE.Mesh[] = [];

  const grassTex = getGrassPBRTexture(18, 18);
  const dirtTex = getDirtPathPBRTexture();
  const woodTex = getWoodPlankPBRTexture();
  const waterTex = getWaterRippleTexture();

  // Cúpula de Céu Amazônico com Horizonte Quente
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 64;
  skyCanvas.height = 256;
  const sCtx = skyCanvas.getContext('2d');
  if (sCtx) {
    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0, '#1e40af');
    skyGrad.addColorStop(0.45, '#38bdf8');
    skyGrad.addColorStop(0.78, '#bae6fd');
    skyGrad.addColorStop(1, '#fef3c7');
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 64, 256);
  }
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(145, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
  );
  skyDome.position.set(width * WORLD_TILE_SIZE * 0.5, 0, height * WORLD_TILE_SIZE * 0.5);
  group.add(skyDome);

  // Plano contínuo de Gramado Amazônico sem costuras
  const outerGroundGeo = new THREE.PlaneGeometry(
    width * WORLD_TILE_SIZE + 160,
    height * WORLD_TILE_SIZE + 160
  );
  const outerGroundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.88,
    metalness: 0.02
  });
  const outerGround = new THREE.Mesh(outerGroundGeo, outerGroundMat);
  outerGround.rotation.x = -Math.PI * 0.5;
  outerGround.position.set(
    width * WORLD_TILE_SIZE * 0.5 - WORLD_TILE_SIZE * 0.5,
    0.0,
    height * WORLD_TILE_SIZE * 0.5 - WORLD_TILE_SIZE * 0.5
  );
  outerGround.receiveShadow = castShadows;
  group.add(outerGround);

  const dirtMat = new THREE.MeshStandardMaterial({
    map: dirtTex,
    roughness: 0.88,
    metalness: 0.02
  });
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xe6c891,
    map: dirtTex,
    roughness: 0.82,
    metalness: 0.02
  });
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x454b54,
    roughness: 0.78,
    metalness: 0.08
  });
  const roadLineMat = new THREE.MeshBasicMaterial({ color: 0xf6c844 });
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.72,
    metalness: 0.04
  });
  const waterShallowMat = new THREE.MeshStandardMaterial({
    color: 0x22a6b3,
    map: waterTex,
    roughness: 0.12,
    metalness: 0.28
  });
  const waterDeepMat = new THREE.MeshStandardMaterial({
    color: 0x0969a3,
    map: waterTex,
    roughness: 0.08,
    metalness: 0.35
  });

  // Textura 2D ilustrada de tufos de capim e flores silvestres
  const grassTuftTex = getOrCreateTexture('sprite_grass_tuft_hd', 128, 128, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const bx = w * 0.22 + (i / 13) * w * 0.56;
      const tipX = bx + (i - 6.5) * 4.5;
      const tipY = 22 + (i % 3) * 14;
      const grad = ctx.createLinearGradient(bx, h - 8, tipX, tipY);
      grad.addColorStop(0, '#1e4616');
      grad.addColorStop(0.5, '#3f852c');
      grad.addColorStop(1, '#7cd158');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, h - 8);
      ctx.quadraticCurveTo((bx + tipX) * 0.5, (h + tipY) * 0.5, tipX, tipY);
      ctx.stroke();
    }
    for (const fx of [38, 66, 90]) {
      const fy = 28 + (fx % 15);
      ctx.fillStyle = '#fff8dc';
      ctx.beginPath();
      ctx.arc(fx, fy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(fx, fy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const tuftSpriteMat = new THREE.SpriteMaterial({ map: grassTuftTex, transparent: true });

  // Textura 2D ilustrada de Vitória-Régia e Aguapés do Rio Juruá
  const waterLilyTex = getOrCreateTexture('sprite_vitoria_regia_2d', 192, 192, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.56;

    // Marola de água brilhante ao redor da vitória-régia
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 72, 36, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Borda levantada avermelhada da Vitória-Régia
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, 62, 31, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Disco verde com nervuras radiais amazônicas
    const padGrad = ctx.createRadialGradient(cx - 10, cy - 6, 6, cx, cy, 58);
    padGrad.addColorStop(0, '#84cc16');
    padGrad.addColorStop(0.65, '#15803d');
    padGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = padGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 58, 28, 0, 0.08, Math.PI * 1.92);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    // Nervuras da folha
    ctx.strokeStyle = 'rgba(190, 242, 100, 0.45)';
    ctx.lineWidth = 1.6;
    for (let a = 0.3; a < Math.PI * 1.8; a += 0.45) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 52, cy + Math.sin(a) * 24);
      ctx.stroke();
    }

    // Flor de Vitória-Régia branco-rosada aberta no centro
    for (let p = 0; p < 8; p++) {
      const ang = (p * Math.PI) / 4;
      ctx.fillStyle = p % 2 === 0 ? '#fdf2f8' : '#fbcfe8';
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(ang) * 10, cy - 5 + Math.sin(ang) * 5, 8, 4.5, ang, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy - 5, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  const lilySpriteMat = new THREE.SpriteMaterial({ map: waterLilyTex, transparent: true });

  // Textura 2D ilustrada de Capim-de-Praia e Taboas da margem do rio
  const riverReedTex = getOrCreateTexture('sprite_river_reeds_2d', 160, 192, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const baseY = h - 14;
    for (let i = 0; i < 11; i++) {
      const rx = 38 + i * 8.5;
      const tipX = rx + (i - 5) * 6;
      const tipY = 26 + (i % 3) * 16;
      const rGrad = ctx.createLinearGradient(rx, baseY, tipX, tipY);
      rGrad.addColorStop(0, '#14532d');
      rGrad.addColorStop(0.5, '#16a34a');
      rGrad.addColorStop(1, '#a3e635');
      ctx.strokeStyle = rGrad;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rx, baseY);
      ctx.quadraticCurveTo((rx + tipX) * 0.5, (baseY + tipY) * 0.5, tipX, tipY);
      ctx.stroke();

      if (i === 3 || i === 7) {
        ctx.fillStyle = '#5c3416';
        ctx.strokeStyle = '#271206';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse((rx + tipX) * 0.5, tipY + 26, 4.5, 16, (i - 5) * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  });
  const reedSpriteMat = new THREE.SpriteMaterial({ map: riverReedTex, transparent: true });

  // Textura 2D ilustrada de Cerca Rural de Madeira (substitui cilindros/caixas 3D)
  const fenceSpriteTex = getOrCreateTexture('sprite_wooden_fence_2d', 256, 224, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const baseY = h - 18;

    // Sombra no chão
    ctx.fillStyle = 'rgba(15, 8, 3, 0.35)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, baseY + 2, 108, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Travessas horizontais de madeira rústica com veios
    for (const ry of [baseY - 96, baseY - 48]) {
      const rGrad = ctx.createLinearGradient(16, ry, 16, ry + 22);
      rGrad.addColorStop(0, '#b4743c');
      rGrad.addColorStop(0.5, '#8c5223');
      rGrad.addColorStop(1, '#542d0e');
      ctx.fillStyle = rGrad;
      ctx.strokeStyle = '#271205';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(14, ry, w - 28, 22, 5);
      ctx.fill();
      ctx.stroke();
    }

    // Mourões verticais de itaúba com topo chanfrado
    for (const px of [52, w * 0.5, w - 52]) {
      const pGrad = ctx.createLinearGradient(px - 16, 42, px + 16, baseY);
      pGrad.addColorStop(0, '#c28148');
      pGrad.addColorStop(0.5, '#7c461b');
      pGrad.addColorStop(1, '#432209');
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = '#241004';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(px - 15, baseY);
      ctx.lineTo(px - 15, 58);
      ctx.lineTo(px, 42);
      ctx.lineTo(px + 15, 58);
      ctx.lineTo(px + 15, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pregos de ferro forjado nas junções
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(px, baseY - 85, 3.2, 0, Math.PI * 2);
      ctx.arc(px, baseY - 37, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const fenceSpriteMat = new THREE.SpriteMaterial({ map: fenceSpriteTex, transparent: true });

  const pathGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 1.005, 0.05, WORLD_TILE_SIZE * 1.005);
  const sandGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 1.005, 0.04, WORLD_TILE_SIZE * 1.005);
  const dockSlabGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 0.98, 0.14, WORLD_TILE_SIZE * 0.98);
  const waterGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 1.01, 0.12, WORLD_TILE_SIZE * 1.01);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = tiles[y][x];
      const wx = x * WORLD_TILE_SIZE;
      const wz = y * WORLD_TILE_SIZE;

      if (t === 'grass') {
        if ((x * 13 + y * 29) % 6 === 0) {
          const sp = new THREE.Sprite(tuftSpriteMat);
          sp.scale.set(0.7, 0.7, 1);
          sp.position.set(
            wx + (((x * 7) % 5) - 2) * 0.18,
            0.32,
            wz + (((y * 11) % 5) - 2) * 0.18
          );
          group.add(sp);
        }
      } else if (t === 'dirt_path') {
        const pathMesh = new THREE.Mesh(pathGeo, dirtMat);
        pathMesh.position.set(wx, 0.02, wz);
        pathMesh.receiveShadow = castShadows;
        group.add(pathMesh);
      } else if (t === 'sand_bank') {
        const sandMesh = new THREE.Mesh(sandGeo, sandMat);
        sandMesh.position.set(wx, -0.02, wz);
        sandMesh.receiveShadow = castShadows;
        group.add(sandMesh);

        if ((x + y) % 3 === 0) {
          const reedSp = new THREE.Sprite(reedSpriteMat);
          reedSp.center.set(0.5, 0.05);
          reedSp.scale.set(1.15, 1.35, 1);
          reedSp.position.set(wx + ((x % 2) - 0.5) * 0.4, 0.02, wz + 0.35);
          group.add(reedSp);
        }
      } else if (t === 'road_asphalt' || t === 'bridge_road') {
        const roadMesh = new THREE.Mesh(pathGeo, roadMat);
        roadMesh.position.set(wx, 0.035, wz);
        roadMesh.receiveShadow = castShadows;
        group.add(roadMesh);

        if ((x + y) % 2 === 0) {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.12), roadLineMat);
          stripe.position.set(wx, 0.075, wz);
          group.add(stripe);
        }
      } else if (t === 'wood_floor') {
        const dockMesh = new THREE.Mesh(dockSlabGeo, woodMat);
        dockMesh.position.set(wx, 0.12, wz);
        dockMesh.receiveShadow = castShadows;
        dockMesh.castShadow = castShadows;
        group.add(dockMesh);
      } else if (t === 'water_shallow' || t === 'water_deep') {
        const wMesh = new THREE.Mesh(waterGeo, t === 'water_deep' ? waterDeepMat : waterShallowMat);
        wMesh.position.set(wx, t === 'water_deep' ? -0.16 : -0.1, wz);
        wMesh.userData = { baseY: wMesh.position.y, phase: x * 0.55 + y * 0.45 };
        group.add(wMesh);
        waterMeshes.push(wMesh);

        if (t === 'water_shallow' && (x * 5 + y * 3) % 4 === 0) {
          const lilySp = new THREE.Sprite(lilySpriteMat);
          lilySp.scale.set(1.15, 0.85, 1);
          lilySp.position.set(wx + (((x * 3) % 3) - 1) * 0.25, 0.04, wz - 0.12);
          group.add(lilySp);
        }
      } else if (t === 'fence') {
        const fenceSp = new THREE.Sprite(fenceSpriteMat);
        fenceSp.center.set(0.5, 0.06);
        fenceSp.scale.set(2.05, 1.55, 1);
        fenceSp.position.set(wx, 0.02, wz);
        group.add(fenceSp);
      }
    }
  }

  return { group, waterMeshes };
}

// ============================================================================
// 2. EVOLUÇÃO BOTÂNICA 2D BASEADA NA PLANTA REAL (ESTÁGIOS 0 A 4 POR ESPÉCIE)
// ============================================================================

function getCropBotanicalSpriteTexture(
  cropId: string,
  stage: 0 | 1 | 2 | 3 | 4,
  primaryHex: string,
  secondaryHex: string
): THREE.CanvasTexture {
  const key = `crop_real_botanical_v4_${cropId}_s${stage}`;
  return getOrCreateTexture(key, 384, 384, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const baseY = h - 24;

    // Sombra orgânica na base da planta sobre a cova
    const sRx = stage === 0 ? 48 : stage === 1 ? 62 : stage === 2 ? 84 : stage === 3 ? 102 : 118;
    const shGrad = ctx.createRadialGradient(cx, baseY + 4, 6, cx, baseY + 4, sRx);
    shGrad.addColorStop(0, 'rgba(15, 8, 3, 0.52)');
    shGrad.addColorStop(1, 'rgba(15, 8, 3, 0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 4, sRx, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helper: Folha Palmada Real de Mandioca / Macaxeira / Mamão (5 a 7 lóbulos com pecíolo avermelhado)
    const drawPalmateLeaf = (lx: number, ly: number, scale: number, tilt: number, petioleColor = '#991b1b') => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(tilt);

      // Pecíolo avermelhado longo típico da Manihot esculenta
      ctx.strokeStyle = petioleColor;
      ctx.lineWidth = 4.5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 18 * scale);
      ctx.lineTo(0, 0);
      ctx.stroke();

      for (let i = -3; i <= 3; i++) {
        ctx.save();
        ctx.rotate(i * 0.34);
        const lobeLen = (74 - Math.abs(i) * 10) * scale;
        const lobeW = 13.5 * scale;

        const lGrad = ctx.createLinearGradient(0, 0, 0, -lobeLen);
        lGrad.addColorStop(0, '#14532d');
        lGrad.addColorStop(0.55, '#16a34a');
        lGrad.addColorStop(1, '#86efac');

        ctx.fillStyle = lGrad;
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-lobeW * 0.7, -lobeLen * 0.35, -lobeW, -lobeLen * 0.72, 0, -lobeLen);
        ctx.bezierCurveTo(lobeW, -lobeLen * 0.72, lobeW * 0.7, -lobeLen * 0.35, 0, 0);
        ctx.fill();
        ctx.stroke();

        // Nervura central clara do lóbulo
        ctx.strokeStyle = '#dcfce7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(0, -lobeLen * 0.88);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    // Helper: Frondes Pinadas de Palmeira de Açaí
    const drawPalmFrond = (fx: number, fy: number, len: number, angle: number) => {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(angle);
      ctx.strokeStyle = '#3f6212';
      ctx.lineWidth = 4.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(0, -len * 0.55, angle * 22, -len);
      ctx.stroke();

      for (let d = 14; d < len; d += 12) {
        const lw = (1 - (d / len) * 0.45) * 32;
        ctx.strokeStyle = d % 24 === 0 ? '#15803d' : '#65a30d';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, -d);
        ctx.lineTo(-lw, -d + 10);
        ctx.moveTo(0, -d);
        ctx.lineTo(lw, -d + 10);
        ctx.stroke();
      }
      ctx.restore();
    };

    // Helper: Folha Larga de Bananeira Amazônica
    const drawBananaPaddleLeaf = (bx: number, by: number, len: number, widthL: number, angle: number) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle);
      const bGrad = ctx.createLinearGradient(0, 0, 0, -len);
      bGrad.addColorStop(0, '#15803d');
      bGrad.addColorStop(0.5, '#4ade80');
      bGrad.addColorStop(1, '#bef264');
      ctx.fillStyle = bGrad;
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-widthL, -len * 0.25, -widthL * 0.95, -len * 0.82, 0, -len);
      ctx.bezierCurveTo(widthL * 0.95, -len * 0.82, widthL, -len * 0.25, 0, 0);
      ctx.fill();
      ctx.stroke();

      // Nervura central grossa amarelo-esverdeada
      ctx.strokeStyle = '#ecfccb';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len * 0.94);
      ctx.stroke();
      ctx.restore();
    };

    // ========================================================================
    // ESTÁGIO 0: SEMENTE / MANIVA / MUDA REAL RECÉM-PLANTADA NA TERRA
    // ========================================================================
    if (stage === 0) {
      if (cropId === 'mandioca' || cropId === 'macaxeira') {
        // Duas manivas lenhosas reais (toletes de caule com nós e gemas verdes) fincadas na cova
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(cx + side * 28, baseY - 6);
          ctx.rotate(side * 0.28);

          const barkGrad = ctx.createLinearGradient(-12, 0, 12, 0);
          barkGrad.addColorStop(0, '#451a03');
          barkGrad.addColorStop(0.5, '#92400e');
          barkGrad.addColorStop(1, '#271001');
          ctx.fillStyle = barkGrad;
          ctx.strokeStyle = '#1c0a00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(-11, -86, 22, 86, 6);
          ctx.fill();
          ctx.stroke();

          // Corte superior mostrando o miolo claro da maniva
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.ellipse(0, -84, 9.5, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Gemas/olhos da maniva brotando folhinha verde
          ctx.fillStyle = '#84cc16';
          ctx.beginPath();
          ctx.ellipse(side * 11, -54, 10, 5.5, side * -0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(-side * 10, -28, 8, 4.5, side * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        return;
      }

      if (cropId === 'abacaxi') {
        // Coroa espinhosa real de abacaxi plantada no centro do canteiro
        for (const ang of [-0.95, -0.6, -0.28, 0, 0.28, 0.6, 0.95]) {
          ctx.save();
          ctx.translate(cx, baseY - 6);
          ctx.rotate(ang);
          const lGrad = ctx.createLinearGradient(0, 0, 0, -82);
          lGrad.addColorStop(0, '#14532d');
          lGrad.addColorStop(0.6, '#16a34a');
          lGrad.addColorStop(1, '#dc2626');
          ctx.fillStyle = lGrad;
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-9, 0);
          ctx.quadraticCurveTo(-5, -45, 0, -82);
          ctx.quadraticCurveTo(5, -45, 9, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        return;
      }

      if (cropId === 'cana') {
        // Toletes de cana-de-açúcar com entrenós deitados no sulco
        for (const dy of [-18, -4]) {
          const caneGrad = ctx.createLinearGradient(cx - 56, baseY + dy - 10, cx + 56, baseY + dy + 10);
          caneGrad.addColorStop(0, '#365314');
          caneGrad.addColorStop(0.5, '#84cc16');
          caneGrad.addColorStop(1, '#4d7c0f');
          ctx.fillStyle = caneGrad;
          ctx.strokeStyle = '#1a2e05';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.roundRect(cx - 54, baseY + dy - 9, 108, 18, 8);
          ctx.fill();
          ctx.stroke();

          // Nós da cana e broto lateral
          for (const nx of [-24, 18]) {
            ctx.strokeStyle = '#ecfccb';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx + nx, baseY + dy - 9);
            ctx.lineTo(cx + nx, baseY + dy + 9);
            ctx.stroke();
          }
        }
        return;
      }

      if (cropId === 'acai' || cropId === 'cupuacu' || cropId === 'banana' || cropId === 'mamao') {
        // Muda florestal no torrão/saquinho de viveiro com primeiro par de folhas reais
        ctx.fillStyle = '#291507';
        ctx.strokeStyle = '#0f0702';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx - 26, baseY - 46, 52, 44, 10);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 42);
        ctx.lineTo(cx, baseY - 94);
        ctx.stroke();

        drawBananaPaddleLeaf(cx, baseY - 76, 48, 14, -0.5);
        drawBananaPaddleLeaf(cx, baseY - 76, 48, 14, 0.5);
        return;
      }

      // Sementes reais visíveis na cova (Milho, Feijão-de-Praia, Melancia, Guaraná, Pimenta, Jerimum, etc.)
      const seeds = [
        { x: cx - 34, y: baseY - 12, rot: -0.3 },
        { x: cx + 34, y: baseY - 12, rot: 0.35 },
        { x: cx, y: baseY - 18, rot: 0.05 }
      ];
      for (const s of seeds) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = cropId === 'milho' ? '#facc15' : cropId === 'melancia' ? '#1e293b' : secondaryHex;
        ctx.strokeStyle = '#1c0a00';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Radícula e cotilédone verde emergindo da semente real
        ctx.strokeStyle = '#84cc16';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.quadraticCurveTo(6, -26, 2, -40);
        ctx.stroke();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(2, -42, 9, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    // ========================================================================
    // ESPÉCIE 1: MANDIOCA MANSA & MACAXEIRA (Manihot esculenta)
    // ========================================================================
    if (cropId === 'mandioca' || cropId === 'macaxeira') {
      const stemH = stage === 1 ? 96 : stage === 2 ? 168 : stage === 3 ? 225 : 256;
      const stemW = stage === 1 ? 12 : stage === 2 ? 17 : stage === 3 ? 22 : 26;

      // Estágio 4: Raízes tuberosas grossas de mandioca/macaxeira aflorando na base da cova!
      if (stage === 4) {
        const tubers = [
          { x: cx - 54, y: baseY - 10, ang: -0.26, rx: 44, ry: 16 },
          { x: cx + 54, y: baseY - 10, ang: 0.26, rx: 44, ry: 16 },
          { x: cx - 22, y: baseY - 2, ang: -0.1, rx: 38, ry: 15 },
          { x: cx + 24, y: baseY - 2, ang: 0.12, rx: 38, ry: 15 }
        ];
        for (const tb of tubers) {
          ctx.save();
          ctx.translate(tb.x, tb.y);
          ctx.rotate(tb.ang);
          const tGrad = ctx.createLinearGradient(-tb.rx, -tb.ry, tb.rx, tb.ry);
          tGrad.addColorStop(0, '#451a03');
          tGrad.addColorStop(0.55, '#78350f');
          tGrad.addColorStop(0.85, '#b45309');
          tGrad.addColorStop(1, '#fef3c7'); // Polpa branca visível na ponta
          ctx.fillStyle = tGrad;
          ctx.strokeStyle = '#1c0a00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, 0, tb.rx, tb.ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // Caule lenhoso com nós característicos da mandioca
      const stemGrad = ctx.createLinearGradient(cx - stemW, baseY, cx + stemW, baseY - stemH);
      stemGrad.addColorStop(0, '#5c3416');
      stemGrad.addColorStop(0.55, '#854d0e');
      stemGrad.addColorStop(1, '#3f6212');
      ctx.strokeStyle = '#271205';
      ctx.lineWidth = stemW + 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 4);
      ctx.quadraticCurveTo(cx - 8, baseY - stemH * 0.5, cx, baseY - stemH);
      ctx.stroke();

      ctx.strokeStyle = stemGrad;
      ctx.lineWidth = stemW;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 4);
      ctx.quadraticCurveTo(cx - 8, baseY - stemH * 0.5, cx, baseY - stemH);
      ctx.stroke();

      // Ramificações simpodiais nos estágios 3 e 4
      if (stage >= 3) {
        ctx.strokeStyle = '#271205';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(cx - 4, baseY - stemH * 0.55);
        ctx.lineTo(cx - 56, baseY - stemH * 0.82);
        ctx.moveTo(cx + 2, baseY - stemH * 0.58);
        ctx.lineTo(cx + 56, baseY - stemH * 0.84);
        ctx.stroke();

        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 9;
        ctx.stroke();
      }

      if (stage === 1) {
        drawPalmateLeaf(cx - 26, baseY - 72, 0.72, -0.35);
        drawPalmateLeaf(cx + 26, baseY - 76, 0.72, 0.35);
        drawPalmateLeaf(cx, baseY - 98, 0.82, 0);
        return;
      }

      if (stage === 2) {
        drawPalmateLeaf(cx - 58, baseY - 102, 0.92, -0.55);
        drawPalmateLeaf(cx + 58, baseY - 106, 0.92, 0.55);
        drawPalmateLeaf(cx - 38, baseY - 142, 1.0, -0.28);
        drawPalmateLeaf(cx + 38, baseY - 146, 1.0, 0.28);
        drawPalmateLeaf(cx, baseY - 172, 1.08, 0);
        return;
      }

      drawPalmateLeaf(cx - 82, baseY - 126, 1.05, -0.62);
      drawPalmateLeaf(cx + 82, baseY - 130, 1.05, 0.62);
      drawPalmateLeaf(cx - 60, baseY - 178, 1.14, -0.36);
      drawPalmateLeaf(cx + 60, baseY - 182, 1.14, 0.36);
      drawPalmateLeaf(cx - 28, baseY - 222, 1.18, -0.16);
      drawPalmateLeaf(cx + 28, baseY - 225, 1.18, 0.16);
      drawPalmateLeaf(cx, baseY - 252, 1.24, 0);

      if (stage === 3) {
        // Pequenas flores amarelo-esverdeadas e cápsulas da mandioca em floração
        for (const fp of [
          { x: cx - 46, y: baseY - 156 },
          { x: cx + 46, y: baseY - 158 },
          { x: cx, y: baseY - 196 }
        ]) {
          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#365314';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(fp.x, fp.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      return;
    }

    // ========================================================================
    // ESPÉCIE 2: AÇAÍ NATIVO DO JURUÁ (Euterpe precatoria / oleracea)
    // ========================================================================
    if (cropId === 'acai') {
      const palmH = stage === 1 ? 105 : stage === 2 ? 178 : stage === 3 ? 235 : 268;
      // Touceira de estirpes aneladas de açaizeiro
      const trunks = stage >= 3 ? [-18, 16] : [0];
      for (const txOff of trunks) {
        const tx = cx + txOff;
        const tGrad = ctx.createLinearGradient(tx - 14, 0, tx + 14, 0);
        tGrad.addColorStop(0, '#44403c');
        tGrad.addColorStop(0.5, '#a8a29e');
        tGrad.addColorStop(1, '#292524');
        ctx.fillStyle = tGrad;
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.roundRect(tx - 11, baseY - palmH, 22, palmH, 8);
        ctx.fill();
        ctx.stroke();

        // Palmito (crownshaft) verde-esmeralda no topo da estirpe
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(tx - 10, baseY - palmH, 20, 38);
        ctx.strokeRect(tx - 10, baseY - palmH, 20, 38);

        // Anéis horizontais do tronco da palmeira
        ctx.strokeStyle = 'rgba(28, 25, 23, 0.5)';
        ctx.lineWidth = 2;
        for (let ry = baseY - 18; ry > baseY - palmH + 40; ry -= 18) {
          ctx.beginPath();
          ctx.moveTo(tx - 10, ry);
          ctx.lineTo(tx + 10, ry);
          ctx.stroke();
        }

        // Cachos de Açaí (verdes no estágio 3, roxo-escuros carregados no estágio 4)
        if (stage >= 3) {
          const berryCol = stage === 4 ? '#3b0764' : '#65a30d';
          const berryHi = stage === 4 ? '#a855f7' : '#bef264';
          for (const bSide of [-1, 1]) {
            const bx = tx + bSide * 22;
            const by = baseY - palmH + 46;
            // Vassoura/ráquis do cacho
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2.5;
            for (let r = -2; r <= 2; r++) {
              ctx.beginPath();
              ctx.moveTo(tx + bSide * 8, by - 10);
              ctx.quadraticCurveTo(bx + r * 5, by + 12, bx + r * 7, by + 38);
              ctx.stroke();
              // Dezenas de caroços de açaí no cacho
              for (let k = 0; k < 5; k++) {
                ctx.fillStyle = k % 2 === 0 ? berryCol : berryHi;
                ctx.beginPath();
                ctx.arc(bx + r * 5 + (k % 2) * 3, by + 6 + k * 6.5, 4.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // Coroa de frondes pinadas arqueadas
        const frondAngles = stage === 1 ? [-0.45, 0, 0.45] : [-1.1, -0.65, -0.22, 0.22, 0.65, 1.1];
        for (const fa of frondAngles) {
          drawPalmFrond(tx, baseY - palmH + 6, stage === 1 ? 72 : 108, fa);
        }
      }
      return;
    }

    // ========================================================================
    // ESPÉCIE 3: BANANA COMPRIDA / PACOVÃ (Musa paradisiaca)
    // ========================================================================
    if (cropId === 'banana') {
      const pseudoH = stage === 1 ? 95 : stage === 2 ? 155 : stage === 3 ? 195 : 215;
      const pGrad = ctx.createLinearGradient(cx - 22, 0, cx + 22, 0);
      pGrad.addColorStop(0, '#365314');
      pGrad.addColorStop(0.5, '#84cc16');
      pGrad.addColorStop(1, '#3f6212');
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = '#1a2e05';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 24, baseY);
      ctx.lineTo(cx - 14, baseY - pseudoH);
      ctx.lineTo(cx + 14, baseY - pseudoH);
      ctx.lineTo(cx + 24, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const leafConfigs =
        stage === 1
          ? [
              { a: -0.45, l: 88, w: 22 },
              { a: 0.45, l: 88, w: 22 },
              { a: 0, l: 98, w: 18 }
            ]
          : [
              { a: -1.15, l: 132, w: 32 },
              { a: 1.15, l: 132, w: 32 },
              { a: -0.65, l: 145, w: 34 },
              { a: 0.65, l: 145, w: 34 },
              { a: -0.2, l: 138, w: 30 },
              { a: 0.2, l: 138, w: 30 }
            ];
      for (const lc of leafConfigs) {
        drawBananaPaddleLeaf(cx, baseY - pseudoH + 10, lc.l, lc.w, lc.a);
      }

      if (stage >= 3) {
        // Engaço pendurado com o coração roxo da bananeira e pencas de banana comprida
        ctx.strokeStyle = '#3f6212';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - pseudoH + 14);
        ctx.quadraticCurveTo(cx + 38, baseY - pseudoH + 18, cx + 36, baseY - pseudoH + 92);
        ctx.stroke();

        // Pencas de banana (verdes no estágio 3, amarelo-ouro no estágio 4)
        const banCol = stage === 4 ? '#facc15' : '#84cc16';
        const banStroke = stage === 4 ? '#854d0e' : '#365314';
        for (const py of [34, 54, 74]) {
          for (let b = -2; b <= 2; b++) {
            ctx.fillStyle = banCol;
            ctx.strokeStyle = banStroke;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx + 36 + b * 6, baseY - pseudoH + py, 5, 14, b * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }

        // Coração roxo-avermelhado na ponta do cacho
        ctx.fillStyle = '#881337';
        ctx.strokeStyle = '#4c0519';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(cx + 36, baseY - pseudoH + 102, 11, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      return;
    }

    // ========================================================================
    // ESPÉCIE 4: ABACAXI GIGANTE DE TARAUACÁ / CRUZEIRO DO SUL (Ananas comosus)
    // ========================================================================
    if (cropId === 'abacaxi') {
      const numLeaves = stage === 1 ? 9 : stage === 2 ? 15 : 21;
      const maxLen = stage === 1 ? 98 : stage === 2 ? 142 : 168;
      // Roseta densa de folhas longas em espada com bordas serrilhadas
      for (let i = 0; i < numLeaves; i++) {
        const norm = (i / (numLeaves - 1)) * 2 - 1;
        const ang = norm * 1.28;
        const len = maxLen * (1 - Math.abs(norm) * 0.22);
        ctx.save();
        ctx.translate(cx, baseY - 12);
        ctx.rotate(ang);
        const lGrad = ctx.createLinearGradient(0, 0, 0, -len);
        lGrad.addColorStop(0, '#14532d');
        lGrad.addColorStop(0.55, '#16a34a');
        lGrad.addColorStop(0.85, '#84cc16');
        lGrad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = lGrad;
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.quadraticCurveTo(-6, -len * 0.5, 0, -len);
        ctx.quadraticCurveTo(6, -len * 0.5, 11, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (stage === 3) {
        // Inflorescência rosada/vermelha central do abacaxi em formação
        ctx.fillStyle = '#e11d48';
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 78, 22, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (stage === 4) {
        // Abacaxi Gigante dourado-alaranjado no centro da roseta com escamas losangulares e coroa real
        const pineGrad = ctx.createRadialGradient(cx - 10, baseY - 96, 6, cx, baseY - 90, 46);
        pineGrad.addColorStop(0, '#fef08a');
        pineGrad.addColorStop(0.55, '#f59e0b');
        pineGrad.addColorStop(1, '#9a3412');
        ctx.fillStyle = pineGrad;
        ctx.strokeStyle = '#431407';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 90, 36, 48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Malha diagonal dos gomos/olhos do abacaxi
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 2;
        for (let d = -22; d <= 22; d += 14) {
          ctx.beginPath();
          ctx.moveTo(cx + d - 16, baseY - 122);
          ctx.lineTo(cx + d + 16, baseY - 58);
          ctx.moveTo(cx + d + 16, baseY - 122);
          ctx.lineTo(cx + d - 16, baseY - 58);
          ctx.stroke();
        }

        // Coroa verde espinhosa no topo do fruto
        for (const ca of [-0.6, -0.3, 0, 0.3, 0.6]) {
          drawPalmFrond(cx, baseY - 136, 46, ca);
        }
      }
      return;
    }

    // ========================================================================
    // ESPÉCIE 5: MILHO CRIOULO & CANA-DE-AÇÚCAR (Gramíneas de colmo ereto)
    // ========================================================================
    if (cropId === 'milho' || cropId === 'cana') {
      const stalkH = stage === 1 ? 92 : stage === 2 ? 168 : stage === 3 ? 228 : 262;
      const stalks = [-28, 0, 28];
      for (const sxOff of stalks) {
        const sx = cx + sxOff;
        // Colmo segmentado
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, baseY - 4);
        ctx.lineTo(sx, baseY - stalkH);
        ctx.stroke();

        ctx.strokeStyle = cropId === 'cana' && stage === 4 ? '#a3e635' : '#4ade80';
        ctx.lineWidth = 6.5;
        ctx.stroke();

        // Folhas lanceoladas arqueadas alternadas
        const leafCount = stage === 1 ? 2 : stage === 2 ? 4 : 6;
        for (let l = 1; l <= leafCount; l++) {
          const ly = baseY - (stalkH * l) / (leafCount + 1);
          const side = l % 2 === 0 ? 1 : -1;
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(sx, ly);
          ctx.quadraticCurveTo(sx + side * 38, ly - 24, sx + side * 66, ly + 8);
          ctx.stroke();
        }

        if (cropId === 'milho' && stage >= 3) {
          // Pendão dourado no topo do pé de milho
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          for (const ta of [-0.4, 0, 0.4]) {
            ctx.beginPath();
            ctx.moveTo(sx, baseY - stalkH);
            ctx.lineTo(sx + Math.sin(ta) * 26, baseY - stalkH - 28);
            ctx.stroke();
          }

          if (stage === 4) {
            // Espiga de Milho Crioulo aberta mostrando os grãos dourados e cabelo do milho
            const cobX = sx + (sxOff <= 0 ? -16 : 16);
            const cobY = baseY - stalkH * 0.52;
            ctx.fillStyle = '#fef08a';
            ctx.strokeStyle = '#854d0e';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(cobX, cobY, 13, 28, (sxOff <= 0 ? -1 : 1) * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(cobX, cobY - 4, 8, 18, (sxOff <= 0 ? -1 : 1) * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      return;
    }

    // ========================================================================
    // ESPÉCIE 6: MELANCIA DA PRAIA & JERIMUM CABOCLO (Ramas Rasteiras na Areia/Terra)
    // ========================================================================
    if (cropId === 'melancia' || cropId === 'jerimum') {
      // Ramas verdes sarmentosas espalhadas pelo canteiro com gavinhas e folhas recortadas
      const vines = [
        { x1: cx, y1: baseY - 22, x2: cx - 115, y2: baseY - 68 },
        { x1: cx, y1: baseY - 22, x2: cx + 115, y2: baseY - 64 },
        { x1: cx, y1: baseY - 22, x2: cx - 75, y2: baseY - 125 },
        { x1: cx, y1: baseY - 22, x2: cx + 78, y2: baseY - 122 },
        { x1: cx, y1: baseY - 22, x2: cx, y2: baseY - 148 }
      ];
      const activeVines = stage === 1 ? vines.slice(0, 2) : stage === 2 ? vines.slice(0, 4) : vines;
      for (const v of activeVines) {
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(v.x1, v.y1);
        ctx.quadraticCurveTo((v.x1 + v.x2) * 0.5, v.y2 - 22, v.x2, v.y2);
        ctx.stroke();

        // Folhas cordiformes/recortadas ao longo da rama
        for (const t of [0.45, 0.85]) {
          const lx = v.x1 + (v.x2 - v.x1) * t;
          const ly = v.y1 + (v.y2 - v.y1) * t - 10;
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(lx, ly, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      if (stage === 3) {
        // Flores amarelas campanuladas de cucurbitácea
        for (const fx of [cx - 48, cx + 48, cx]) {
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(fx, baseY - 76, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (stage === 4) {
        // Frutos grandes reais pousados sobre o canteiro!
        const fruitPos = [
          { x: cx - 54, y: baseY - 46, r: 34 },
          { x: cx + 56, y: baseY - 44, r: 32 },
          { x: cx, y: baseY - 82, r: 38 }
        ];
        for (const fp of fruitPos) {
          if (cropId === 'melancia') {
            // Melancia verde-escura com listras verde-claras sinuosas
            const mGrad = ctx.createRadialGradient(fp.x - 10, fp.y - 10, 4, fp.x, fp.y, fp.r);
            mGrad.addColorStop(0, '#86efac');
            mGrad.addColorStop(0.55, '#16a34a');
            mGrad.addColorStop(1, '#052e16');
            ctx.fillStyle = mGrad;
            ctx.strokeStyle = '#052e16';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(fp.x, fp.y, fp.r * 1.15, fp.r * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Listras claras da casca da melancia
            ctx.strokeStyle = '#bbf7d0';
            ctx.lineWidth = 3.5;
            for (const dy of [-10, 0, 10]) {
              ctx.beginPath();
              ctx.moveTo(fp.x - fp.r * 0.9, fp.y + dy);
              ctx.quadraticCurveTo(fp.x, fp.y + dy - 6, fp.x + fp.r * 0.9, fp.y + dy);
              ctx.stroke();
            }
          } else {
            // Jerimum Caboclo abóbora gomos alaranjados
            const jGrad = ctx.createRadialGradient(fp.x - 8, fp.y - 8, 4, fp.x, fp.y, fp.r);
            jGrad.addColorStop(0, '#fdba74');
            jGrad.addColorStop(0.6, '#ea580c');
            jGrad.addColorStop(1, '#7c2d12');
            ctx.fillStyle = jGrad;
            ctx.strokeStyle = '#431407';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(fp.x, fp.y, fp.r * 1.18, fp.r * 0.82, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
      return;
    }

    // ========================================================================
    // ESPÉCIE 7: CUPUAÇU, GUARANÁ, MARACUJÁ, MAMÃO, PIMENTA, FEIJÃO, CARÁ E CHEIRO-VERDE
    // ========================================================================
    const bushH = stage === 1 ? 88 : stage === 2 ? 156 : stage === 3 ? 208 : 242;

    // Estaca de madeira para trepadeiras (Guaraná, Maracujá, Cará Roxo)
    if (cropId === 'guarana' || cropId === 'maracuja' || cropId === 'cara_roxo') {
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#271205';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx - 8, baseY - bushH - 12, 16, bushH + 12, 4);
      ctx.fill();
      ctx.stroke();
    }

    // Tronco/caule principal
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = stage === 1 ? 10 : 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 4);
    ctx.lineTo(cx, baseY - bushH * 0.78);
    ctx.stroke();

    // Copa folhosa em camadas botânicas
    const foliageClusters =
      stage === 1
        ? [
            { x: cx - 22, y: baseY - 58, r: 28 },
            { x: cx + 22, y: baseY - 58, r: 28 },
            { x: cx, y: baseY - 78, r: 32 }
          ]
        : stage === 2
        ? [
            { x: cx - 48, y: baseY - 96, r: 42 },
            { x: cx + 48, y: baseY - 96, r: 42 },
            { x: cx - 28, y: baseY - 134, r: 44 },
            { x: cx + 28, y: baseY - 134, r: 44 },
            { x: cx, y: baseY - 156, r: 48 }
          ]
        : [
            { x: cx - 68, y: baseY - 118, r: 48 },
            { x: cx + 68, y: baseY - 118, r: 48 },
            { x: cx - 48, y: baseY - 168, r: 52 },
            { x: cx + 48, y: baseY - 168, r: 52 },
            { x: cx, y: baseY - 208, r: 58 }
          ];

    for (const fc of foliageClusters) {
      const fGrad = ctx.createRadialGradient(fc.x - 10, fc.y - 12, 6, fc.x, fc.y, fc.r);
      fGrad.addColorStop(0, '#86efac');
      fGrad.addColorStop(0.55, primaryHex);
      fGrad.addColorStop(1, '#14532d');
      ctx.fillStyle = fGrad;
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(fc.x, fc.y, fc.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (stage === 3) {
      // Flores específicas da espécie no estágio 3
      for (const fp of [
        { x: cx - 42, y: baseY - 138 },
        { x: cx + 42, y: baseY - 142 },
        { x: cx, y: baseY - 178 }
      ]) {
        ctx.fillStyle = cropId === 'maracuja' ? '#c084fc' : '#fef08a';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      return;
    }

    if (stage === 4) {
      const fruitCoords = [
        { x: cx - 52, y: baseY - 118 },
        { x: cx + 52, y: baseY - 120 },
        { x: cx - 28, y: baseY - 168 },
        { x: cx + 28, y: baseY - 170 },
        { x: cx, y: baseY - 142 }
      ];
      for (const f of fruitCoords) {
        if (cropId === 'cupuacu') {
          // Cupuaçu oblongo marrom aveludado pendurado nos galhos
          const cGrad = ctx.createLinearGradient(f.x - 18, f.y - 24, f.x + 18, f.y + 24);
          cGrad.addColorStop(0, '#b45309');
          cGrad.addColorStop(0.5, '#78350f');
          cGrad.addColorStop(1, '#451a03');
          ctx.fillStyle = cGrad;
          ctx.strokeStyle = '#1c0a00';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.ellipse(f.x, f.y, 18, 28, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (cropId === 'guarana') {
          // Cacho de Guaraná vermelho vivo com frutos abertos mostrando o "olho" branco e preto!
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#450a0a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(f.x, f.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(f.x, f.y, 8.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(f.x, f.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cropId === 'feijao_de_praia') {
          // Vagens longas de Feijão-de-Praia do Juruá
          ctx.strokeStyle = '#a3e635';
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(f.x - 6, f.y - 18);
          ctx.quadraticCurveTo(f.x + 8, f.y, f.x - 2, f.y + 24);
          ctx.stroke();
        } else {
          // Mamão, Maracujá, Pimenta-de-Cheiro, Cará Roxo
          ctx.fillStyle = secondaryHex;
          ctx.strokeStyle = '#1c0a00';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.ellipse(f.x, f.y, 16, 22, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.arc(f.x - 5, f.y - 6, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });
}

export function populateFarmPlot3DGroup(
  plotGroup: THREE.Group,
  tilled: boolean,
  watered: boolean,
  cropId: string | null,
  stage: 0 | 1 | 2 | 3 | 4,
  castShadows: boolean
) {
  while (plotGroup.children.length > 0) {
    plotGroup.remove(plotGroup.children[0]);
  }

  const woodTex = getWoodPlankPBRTexture();
  const dirtTex = getDirtPathPBRTexture();

  const borderWoodMat = new THREE.MeshStandardMaterial({
    color: 0x6e421c,
    map: woodTex,
    roughness: 0.82
  });
  const borderLongGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 0.94, 0.12, 0.08);
  const borderShortGeo = new THREE.BoxGeometry(0.08, 0.12, WORLD_TILE_SIZE * 0.86);

  const bNorth = new THREE.Mesh(borderLongGeo, borderWoodMat);
  bNorth.position.set(0, 0.06, -WORLD_TILE_SIZE * 0.43);
  const bSouth = new THREE.Mesh(borderLongGeo, borderWoodMat);
  bSouth.position.set(0, 0.06, WORLD_TILE_SIZE * 0.43);
  const bWest = new THREE.Mesh(borderShortGeo, borderWoodMat);
  bWest.position.set(-WORLD_TILE_SIZE * 0.43, 0.06, 0);
  const bEast = new THREE.Mesh(borderShortGeo, borderWoodMat);
  bEast.position.set(WORLD_TILE_SIZE * 0.43, 0.06, 0);
  plotGroup.add(bNorth, bSouth, bWest, bEast);

  if (!tilled) {
    const rawBedGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 0.84, 0.08, WORLD_TILE_SIZE * 0.84);
    const rawBedMat = new THREE.MeshStandardMaterial({
      color: 0x735135,
      map: dirtTex,
      roughness: 0.95
    });
    const rawBed = new THREE.Mesh(rawBedGeo, rawBedMat);
    rawBed.position.y = 0.04;
    rawBed.receiveShadow = castShadows;
    plotGroup.add(rawBed);
    return;
  }

  const soilHex = watered ? 0x2b170b : 0x8c5b34;
  const ridgeHex = watered ? 0x3b2111 : 0xa46d41;
  const soilRoughness = watered ? 0.2 : 0.9;

  const bedGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 0.84, 0.12, WORLD_TILE_SIZE * 0.84);
  const bedMat = new THREE.MeshStandardMaterial({
    color: soilHex,
    map: dirtTex,
    roughness: soilRoughness,
    metalness: watered ? 0.16 : 0.02
  });
  const bedMesh = new THREE.Mesh(bedGeo, bedMat);
  bedMesh.position.y = 0.06;
  bedMesh.receiveShadow = castShadows;
  plotGroup.add(bedMesh);

  const ridgeGeo = new THREE.CylinderGeometry(0.16, 0.22, WORLD_TILE_SIZE * 0.78, 10);
  ridgeGeo.rotateZ(Math.PI * 0.5);
  const ridgeMat = new THREE.MeshStandardMaterial({
    color: ridgeHex,
    roughness: soilRoughness,
    metalness: watered ? 0.14 : 0.02
  });

  for (const rz of [-0.46, 0, 0.46]) {
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.scale.set(1, 0.58, 1);
    ridge.position.set(0, 0.13, rz);
    ridge.receiveShadow = castShadows;
    plotGroup.add(ridge);
  }

  if (watered) {
    const waterStripGeo = new THREE.BoxGeometry(WORLD_TILE_SIZE * 0.76, 0.04, 0.2);
    const waterStripMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.08,
      metalness: 0.5,
      emissive: 0x0284c7,
      emissiveIntensity: 0.24
    });
    for (const wz of [-0.23, 0.23]) {
      const strip = new THREE.Mesh(waterStripGeo, waterStripMat);
      strip.position.set(0, 0.125, wz);
      plotGroup.add(strip);
    }
  }

  if (!cropId) return;

  const cropDef = CROPS_DATA[cropId];
  const primaryHex = cropDef?.accentColor ?? '#43a047';
  const secondaryHex = cropDef?.secondaryColor ?? '#fdd835';

  const plantGroup = new THREE.Group();
  plantGroup.name = 'cropPlantGroup';
  plotGroup.add(plantGroup);

  // Plaquinha de madeira 2D ilustrada no canto do canteiro
  const stakeTex = getOrCreateTexture(`crop_stake_2d_${cropId}`, 128, 128, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#5c3416';
    ctx.strokeStyle = '#241004';
    ctx.lineWidth = 3;
    ctx.fillRect(56, 54, 16, 66);
    ctx.strokeRect(56, 54, 16, 66);

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.roundRect(22, 18, 84, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = secondaryHex;
    ctx.beginPath();
    ctx.arc(64, 42, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  const stakeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: stakeTex, transparent: true }));
  stakeSprite.center.set(0.5, 0.05);
  stakeSprite.scale.set(0.52, 0.52, 1);
  stakeSprite.position.set(-0.62, 0.14, -0.62);
  plantGroup.add(stakeSprite);

  // Billboard 2D/2.5D único com a evolução botânica real da planta
  const cropTex = getCropBotanicalSpriteTexture(cropId, stage, primaryHex, secondaryHex);
  const spriteSize = stage === 0 ? 0.98 : stage === 1 ? 1.28 : stage === 2 ? 1.58 : stage === 3 ? 1.84 : 2.08;
  const cropSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: cropTex, transparent: true })
  );
  cropSprite.center.set(0.5, 0.06);
  cropSprite.scale.set(spriteSize, spriteSize, 1);
  cropSprite.position.set(0, 0.14, 0);
  plantGroup.add(cropSprite);

  if (stage === 4) {
    const starTex = getOrCreateTexture('harvest_ready_badge_2d', 128, 128, 1, 1, true, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 52);
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(0.5, '#facc15');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(64, 14);
      ctx.lineTo(78, 48);
      ctx.lineTo(114, 64);
      ctx.lineTo(78, 80);
      ctx.lineTo(64, 114);
      ctx.lineTo(50, 80);
      ctx.lineTo(14, 64);
      ctx.lineTo(50, 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    const harvestStar = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true }));
    harvestStar.scale.set(0.48, 0.48, 1);
    harvestStar.position.set(0, 2.02, 0);
    harvestStar.name = 'harvestStar';
    plantGroup.add(harvestStar);
  }
}

// ============================================================================
// 3. ÁRVORES AMAZÔNICAS 2.5D HD (BILLBOARD ÚNICO SEM TRONCO DUPLICADO EM "X")
// ============================================================================

function getTreeCanopySpriteTexture(
  kind: 'samauma' | 'acai' | 'buriti' | 'cupuacu' | 'bananeira' | 'ipe_amarelo'
): THREE.CanvasTexture {
  return getOrCreateTexture(`tree_sprite_botanical_2d_v3_${kind}`, 512, 560, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const baseY = h - 22;

    // Sombra elíptica na base do tronco
    const sGrad = ctx.createRadialGradient(cx, baseY, 12, cx, baseY, 125);
    sGrad.addColorStop(0, 'rgba(14, 8, 3, 0.52)');
    sGrad.addColorStop(1, 'rgba(14, 8, 3, 0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.ellipse(cx, baseY, 118, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. BANANEIRA REAL (Pseudocaule fibroso, folhas largas rasgadas pelo vento, cacho de banana e coração roxo)
    if (kind === 'bananeira') {
      const stemGrad = ctx.createLinearGradient(cx - 24, 240, cx + 24, baseY);
      stemGrad.addColorStop(0, '#84cc16');
      stemGrad.addColorStop(0.5, '#4d7c0f');
      stemGrad.addColorStop(1, '#365314');
      ctx.fillStyle = stemGrad;
      ctx.strokeStyle = '#1a2e05';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - 28, baseY);
      ctx.lineTo(cx - 16, 225);
      ctx.lineTo(cx + 16, 225);
      ctx.lineTo(cx + 28, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const paddleAngles = [-1.25, -0.78, -0.32, 0.32, 0.78, 1.25];
      for (const ang of paddleAngles) {
        ctx.save();
        ctx.translate(cx, 228);
        ctx.rotate(ang);
        const lGrad = ctx.createLinearGradient(0, 0, 0, -175);
        lGrad.addColorStop(0, '#65a30d');
        lGrad.addColorStop(0.6, '#84cc16');
        lGrad.addColorStop(1, '#bef264');
        ctx.fillStyle = lGrad;
        ctx.strokeStyle = '#1a2e05';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-48, -52, -46, -135, 0, -178);
        ctx.bezierCurveTo(46, -135, 48, -52, 0, 0);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#d9f99d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -168);
        ctx.stroke();
        ctx.restore();
      }

      // Cacho de bananas maduras e coração roxo
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2.5;
      for (let r = 0; r < 3; r++) {
        for (let b = -2; b <= 2; b++) {
          ctx.beginPath();
          ctx.ellipse(cx + 32 + b * 7, 250 + r * 14, 5, 13, b * 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#701a75';
      ctx.beginPath();
      ctx.ellipse(cx + 32, 304, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return;
    }

    // 2. PALMEIRAS AMAZÔNICAS REAIS (Açaizeiro em touceira e Buritizeiro com palmito verde e frondes arqueadas)
    if (kind === 'acai' || kind === 'buriti') {
      const stems =
        kind === 'acai'
          ? [
              { ox: -22, topX: -34, topY: 205, w: 13 },
              { ox: 18, topX: 28, topY: 222, w: 11 },
              { ox: 0, topX: 0, topY: 175, w: 15 }
            ]
          : [{ ox: 0, topX: 0, topY: 175, w: 22 }];

      for (const st of stems) {
        const tGrad = ctx.createLinearGradient(cx + st.ox - st.w, baseY, cx + st.topX + st.w, st.topY);
        tGrad.addColorStop(0, '#57412d');
        tGrad.addColorStop(0.5, '#a89076');
        tGrad.addColorStop(1, '#3e2d1e');
        ctx.fillStyle = tGrad;
        ctx.strokeStyle = '#1f150d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + st.ox - st.w, baseY);
        ctx.quadraticCurveTo(cx + st.ox * 0.6 - st.w * 0.8, (baseY + st.topY) * 0.5, cx + st.topX - st.w * 0.68, st.topY);
        ctx.lineTo(cx + st.topX + st.w * 0.68, st.topY);
        ctx.quadraticCurveTo(cx + st.ox * 0.6 + st.w * 0.8, (baseY + st.topY) * 0.5, cx + st.ox + st.w, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Anéis de crescimento do estipe
        ctx.strokeStyle = 'rgba(30, 20, 10, 0.45)';
        ctx.lineWidth = 2;
        for (let ry = st.topY + 34; ry < baseY - 14; ry += 22) {
          const t = (ry - st.topY) / (baseY - st.topY);
          const curX = cx + st.topX * (1 - t) + st.ox * t;
          const rw = st.w * (0.68 + t * 0.3);
          ctx.beginPath();
          ctx.moveTo(curX - rw, ry);
          ctx.lineTo(curX + rw, ry);
          ctx.stroke();
        }

        // Palmito verde-esmeralda no topo
        ctx.fillStyle = '#16a34a';
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.roundRect(cx + st.topX - st.w * 0.72, st.topY - 34, st.w * 1.44, 38, 6);
        ctx.fill();
        ctx.stroke();

        // Cachos pendentes de Açaí roxo-escuro ou Buriti castanho-dourado
        for (const side of [-1, 1]) {
          const bx = cx + st.topX + side * (st.w + 14);
          const by = st.topY + 12;
          ctx.strokeStyle = '#a16207';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + st.topX, st.topY + 2);
          ctx.quadraticCurveTo(bx, by - 10, bx + side * 6, by + 28);
          ctx.stroke();

          ctx.fillStyle = kind === 'acai' ? '#1e0b24' : '#b45309';
          ctx.strokeStyle = kind === 'acai' ? '#581c87' : '#451a03';
          ctx.lineWidth = 1.8;
          for (let k = 0; k < 14; k++) {
            const kx = bx + ((k % 3) - 1) * 6.5;
            const ky = by + Math.floor(k / 3) * 6.5;
            ctx.beginPath();
            ctx.arc(kx, ky, kind === 'acai' ? 4.2 : 5.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }

        // Coroa de frondes arqueadas com folíolos finos detalhados
        const frondAngles = [-1.42, -1.02, -0.58, -0.18, 0.18, 0.58, 1.02, 1.42];
        for (const ang of frondAngles) {
          ctx.save();
          ctx.translate(cx + st.topX, st.topY - 26);
          ctx.rotate(ang);
          const fLen = 148;
          ctx.strokeStyle = '#3f6212';
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(ang * 14, -fLen * 0.55, ang * 34, -fLen);
          ctx.stroke();

          for (let lf = 16; lf < fLen; lf += 11) {
            const t = lf / fLen;
            const rx = ang * 34 * t * t;
            const ry = -lf;
            const lSpan = (1 - t * 0.5) * 30;
            ctx.strokeStyle = lf % 22 === 0 ? '#15803d' : '#65a30d';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - lSpan, ry + 14);
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + lSpan, ry + 14);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      return;
    }

    // 3. ÁRVORES FRONDOSAS DA FLORESTA AMAZÔNICA (Samaúma com sapopemas, Cupuaçuzeiro e Ipê-Amarelo)
    // Tronco escultural com raízes sapopemas (buttress roots) e galhos superiores
    const trunkGrad = ctx.createLinearGradient(cx - 68, 220, cx + 68, baseY);
    trunkGrad.addColorStop(0, '#432818');
    trunkGrad.addColorStop(0.42, '#7f5539');
    trunkGrad.addColorStop(0.75, '#582f0e');
    trunkGrad.addColorStop(1, '#261205');
    ctx.fillStyle = trunkGrad;
    ctx.strokeStyle = '#180a02';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 88, baseY);
    ctx.quadraticCurveTo(cx - 38, baseY - 82, cx - 32, 265);
    ctx.lineTo(cx - 82, 195);
    ctx.lineTo(cx - 56, 182);
    ctx.lineTo(cx - 16, 235);
    ctx.lineTo(cx + 16, 235);
    ctx.lineTo(cx + 56, 182);
    ctx.lineTo(cx + 82, 195);
    ctx.lineTo(cx + 32, 265);
    ctx.quadraticCurveTo(cx + 38, baseY - 82, cx + 88, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sulcos verticais das sapopemas e da casca da Samaúma
    ctx.strokeStyle = 'rgba(24, 10, 2, 0.55)';
    ctx.lineWidth = 3;
    for (const sx of [-28, -8, 12, 30]) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * 1.8, baseY - 6);
      ctx.quadraticCurveTo(cx + sx * 0.7, baseY - 95, cx + sx * 0.5, 250);
      ctx.stroke();
    }

    // Copa botânica densa ilustrada em camadas de folhagem orgânica (sem esferas geométricas lisas)
    const isIpe = kind === 'ipe_amarelo';
    const canopyClusters = [
      { x: cx - 128, y: 225, rx: 86, ry: 62, cDark: isIpe ? '#a16207' : '#052e16', cMid: isIpe ? '#eab308' : '#166534', cLight: isIpe ? '#fef08a' : '#4ade80' },
      { x: cx + 128, y: 225, rx: 86, ry: 62, cDark: isIpe ? '#a16207' : '#052e16', cMid: isIpe ? '#eab308' : '#166534', cLight: isIpe ? '#fef08a' : '#4ade80' },
      { x: cx - 84, y: 158, rx: 98, ry: 72, cDark: isIpe ? '#b45309' : '#14532d', cMid: isIpe ? '#facc15' : '#15803d', cLight: isIpe ? '#fef9c3' : '#86efac' },
      { x: cx + 84, y: 158, rx: 98, ry: 72, cDark: isIpe ? '#b45309' : '#14532d', cMid: isIpe ? '#facc15' : '#15803d', cLight: isIpe ? '#fef9c3' : '#86efac' },
      { x: cx, y: 195, rx: 112, ry: 74, cDark: isIpe ? '#a16207' : '#064e3b', cMid: isIpe ? '#eab308' : '#166534', cLight: isIpe ? '#fde047' : '#4ade80' },
      { x: cx, y: 118, rx: 118, ry: 82, cDark: isIpe ? '#ca8a04' : '#14532d', cMid: isIpe ? '#facc15' : '#22c55e', cLight: isIpe ? '#fef08a' : '#bbf7d0' }
    ];

    for (const cl of canopyClusters) {
      const cGrad = ctx.createRadialGradient(cl.x - cl.rx * 0.2, cl.y - cl.ry * 0.35, 12, cl.x, cl.y, cl.rx);
      cGrad.addColorStop(0, cl.cLight);
      cGrad.addColorStop(0.55, cl.cMid);
      cGrad.addColorStop(1, cl.cDark);
      ctx.fillStyle = cGrad;
      ctx.strokeStyle = isIpe ? '#713f12' : '#052e16';
      ctx.lineWidth = 3.5;

      // Contorno recortado de ramos e folhas (8 lóbulos por maciço de copa)
      ctx.beginPath();
      const lobes = 10;
      for (let i = 0; i <= lobes; i++) {
        const a1 = (i / lobes) * Math.PI * 2;
        const aMid = ((i + 0.5) / lobes) * Math.PI * 2;
        const x1 = cl.x + Math.cos(a1) * cl.rx * 0.88;
        const y1 = cl.y + Math.sin(a1) * cl.ry * 0.88;
        const xm = cl.x + Math.cos(aMid) * cl.rx * 1.06;
        const ym = cl.y + Math.sin(aMid) * cl.ry * 1.06;
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.quadraticCurveTo(xm, ym, x1, y1);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tufos iluminados de folhas individuais dentro do maciço
      ctx.fillStyle = cl.cLight;
      for (const [lx, ly] of [
        [-cl.rx * 0.35, -cl.ry * 0.25],
        [0, -cl.ry * 0.38],
        [cl.rx * 0.32, -cl.ry * 0.2]
      ]) {
        ctx.beginPath();
        ctx.ellipse(cl.x + lx, cl.y + ly, 18, 10, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Se for Cupuaçuzeiro, desenha cabaças aveludadas penduradas nos galhos inferiores
    if (kind === 'cupuacu') {
      for (const [px, py] of [
        [cx - 64, 248],
        [cx + 58, 254],
        [cx - 18, 262]
      ]) {
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#271206';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(px, py, 16, 24, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  });
}

export function buildTree3DGroup(
  kind: 'samauma' | 'acai' | 'buriti' | 'cupuacu' | 'bananeira' | 'ipe_amarelo',
  castShadows: boolean
): THREE.Group {
  const group = new THREE.Group();
  void castShadows;
  const tex = getTreeCanopySpriteTexture(kind);

  const w = kind === 'samauma' ? 4.4 : kind === 'bananeira' ? 2.8 : 3.5;
  const h = kind === 'samauma' ? 4.8 : kind === 'bananeira' ? 3.0 : 4.2;

  // Sprite 2.5D HD único ancorado na base para nunca duplicar o tronco!
  const treeSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true })
  );
  treeSprite.center.set(0.5, 0.04);
  treeSprite.scale.set(w, h, 1);
  treeSprite.position.set(0, 0, 0);
  group.add(treeSprite);

  return group;
}

// ============================================================================
// 4. ARQUITETURA REGIONAL ACREANA EM SPRITES 2D/2.5D ILUSTRADOS DE ALTA DEFINIÇÃO
// ============================================================================

function getBuildingIllustratedTexture2D(b: MapBuilding): THREE.CanvasTexture {
  return getOrCreateTexture(`building_sprite_2d_v3_${b.id}_${b.style}`, 768, 640, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const baseY = h - 34;

    // Sombra elíptica projetada no chão sob a edificação
    const shGrad = ctx.createRadialGradient(cx, baseY, 20, cx, baseY, w * 0.45);
    shGrad.addColorStop(0, 'rgba(15, 8, 3, 0.55)');
    shGrad.addColorStop(1, 'rgba(15, 8, 3, 0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 6, w * 0.44, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // ------------------------------------------------------------------------
    // ESTILO A: POÇO DE ÁGUA CRISTALINA (Mureta de pedra, telhado colonial, sarilho e balde)
    // ------------------------------------------------------------------------
    if (b.style === 'poco_agua') {
      // Colunas de madeira de lei traseiras sustentando o telhado do poço
      ctx.fillStyle = '#5c3416';
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 5;
      ctx.fillRect(cx - 125, 190, 26, baseY - 210);
      ctx.strokeRect(cx - 125, 190, 26, baseY - 210);
      ctx.fillRect(cx + 99, 190, 26, baseY - 210);
      ctx.strokeRect(cx + 99, 190, 26, baseY - 210);

      // Eixo de ferro do sarilho, manivela e corda trançada com balde de madeira cheio d'água
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx - 135, 255);
      ctx.lineTo(cx + 135, 255);
      ctx.stroke();
      // Manivela lateral
      ctx.beginPath();
      ctx.moveTo(cx + 135, 255);
      ctx.lineTo(cx + 135, 295);
      ctx.lineTo(cx + 162, 295);
      ctx.stroke();

      // Rolo de corda e corda descendo ao centro do poço
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx - 28, 240, 56, 30, 6);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, 270);
      ctx.lineTo(cx, 375);
      ctx.stroke();

      // Balde de madeira com aros de ferro e água cristalina brilhando
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - 32, 345);
      ctx.lineTo(cx + 32, 345);
      ctx.lineTo(cx + 25, 405);
      ctx.lineTo(cx - 25, 405);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(cx, 347, 29, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mureta circular de pedras e tijolos rústicos em perspectiva 2.5D
      const wellGrad = ctx.createLinearGradient(cx - 160, 415, cx + 160, baseY);
      wellGrad.addColorStop(0, '#94a3b8');
      wellGrad.addColorStop(0.5, '#cbd5e1');
      wellGrad.addColorStop(1, '#475569');
      ctx.fillStyle = wellGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(cx - 155, 415, 310, baseY - 415, 22);
      ctx.fill();
      ctx.stroke();

      // Textura de blocos de pedra esculpidos na mureta
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      for (const ry of [460, 505, 550]) {
        ctx.beginPath();
        ctx.moveTo(cx - 150, ry);
        ctx.lineTo(cx + 150, ry);
        ctx.stroke();
      }
      for (let bx = cx - 100; bx <= cx + 100; bx += 65) {
        ctx.beginPath();
        ctx.moveTo(bx, 418);
        ctx.lineTo(bx, 460);
        ctx.moveTo(bx + 30, 460);
        ctx.lineTo(bx + 30, 505);
        ctx.moveTo(bx, 505);
        ctx.lineTo(bx, 550);
        ctx.stroke();
      }

      // Borda superior do poço e espelho d'água azul-celeste profundo
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.ellipse(cx, 418, 165, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const waterPoolGrad = ctx.createRadialGradient(cx - 20, 416, 10, cx, 418, 130);
      waterPoolGrad.addColorStop(0, '#7dd3fc');
      waterPoolGrad.addColorStop(0.55, '#0284c7');
      waterPoolGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = waterPoolGrad;
      ctx.beginPath();
      ctx.ellipse(cx, 418, 132, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Telhado de telhas de barro de duas águas sobre o poço
      const roofGrad = ctx.createLinearGradient(cx, 75, cx, 215);
      roofGrad.addColorStop(0, '#ea580c');
      roofGrad.addColorStop(0.6, '#b45309');
      roofGrad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = roofGrad;
      ctx.strokeStyle = '#271001';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, 72);
      ctx.lineTo(cx + 195, 208);
      ctx.lineTo(cx - 195, 208);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }

    // ------------------------------------------------------------------------
    // ESTILO B: CASA DE FARINHA TRADICIONAL ACREANA (Fornalha, Tacho de Cobre, Rodo, Tipiti e Sacas)
    // ------------------------------------------------------------------------
    if (b.style === 'casa_farinha') {
      // Piso de madeira/barro batido elevado e esteios de madeira de lei
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(68, baseY - 58, w - 136, 48, 10);
      ctx.fill();
      ctx.stroke();

      // Esteios (pilares de madeira grossa do barracão aberto)
      for (const px of [98, 265, w - 265, w - 98]) {
        const pGrad = ctx.createLinearGradient(px - 14, 210, px + 14, baseY - 54);
        pGrad.addColorStop(0, '#92400e');
        pGrad.addColorStop(0.5, '#b45309');
        pGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = pGrad;
        ctx.fillRect(px - 14, 210, 28, baseY - 264);
        ctx.strokeRect(px - 14, 210, 28, baseY - 264);
      }

      // Chaminé de tijolos ao fundo soltando fumaça cheirosa de lenha
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(150, 88, 46, 260);
      ctx.strokeRect(150, 88, 46, 260);

      // Fornalha circular de tijolo refratário e barro com boca de fogo acesa
      const ovenGrad = ctx.createLinearGradient(130, 390, 390, baseY - 56);
      ovenGrad.addColorStop(0, '#b45309');
      ovenGrad.addColorStop(0.5, '#9a3412');
      ovenGrad.addColorStop(1, '#431407');
      ctx.fillStyle = ovenGrad;
      ctx.beginPath();
      ctx.roundRect(128, 398, 256, baseY - 454, 18);
      ctx.fill();
      ctx.stroke();

      // Boca da fornalha com brasas vivas e lenha ardendo
      ctx.fillStyle = '#1c0a00';
      ctx.beginPath();
      ctx.arc(256, baseY - 62, 42, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      const fireGrad = ctx.createRadialGradient(256, baseY - 68, 4, 256, baseY - 68, 34);
      fireGrad.addColorStop(0, '#fef08a');
      fireGrad.addColorStop(0.55, '#f97316');
      fireGrad.addColorStop(1, '#dc2626');
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(256, baseY - 64, 28, Math.PI, 0);
      ctx.fill();

      // Grande Tacho de Cobre Reluzente cheio de Farinha de Cruzeiro do Sul douradinha!
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#271001';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.ellipse(256, 398, 134, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Massa de farinha amarela torrando no tacho + rodo de madeira
      const flourGrad = ctx.createRadialGradient(246, 394, 10, 256, 398, 115);
      flourGrad.addColorStop(0, '#fef9c3');
      flourGrad.addColorStop(0.6, '#fde047');
      flourGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = flourGrad;
      ctx.beginPath();
      ctx.ellipse(256, 396, 114, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rodo de madeira de mexer farinha apoiado no tacho
      ctx.strokeStyle = '#5c3416';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(275, 394);
      ctx.lineTo(355, 290);
      ctx.stroke();

      // Tipiti de palha trançada pendurado na viga direita + Sacas de estopa de Farinha
      ctx.fillStyle = '#ca8a04';
      ctx.strokeStyle = '#422006';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(455, 248, 34, 175, 14);
      ctx.fill();
      ctx.stroke();

      // Sacas de juta cheias de farinha empilhadas à direita
      for (const [sx, sy] of [
        [535, baseY - 125],
        [605, baseY - 125],
        [570, baseY - 175]
      ]) {
        const sackGrad = ctx.createRadialGradient(sx - 8, sy, 4, sx, sy + 18, 44);
        sackGrad.addColorStop(0, '#fde68a');
        sackGrad.addColorStop(0.6, '#d97706');
        sackGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = sackGrad;
        ctx.beginPath();
        ctx.roundRect(sx - 36, sy, 72, 66, 18);
        ctx.fill();
        ctx.stroke();
      }

      // Telhado amplo de telhas de barro e madeira sobre a Casa de Farinha
      const roofGrad = ctx.createLinearGradient(cx, 72, cx, 232);
      roofGrad.addColorStop(0, '#c2410c');
      roofGrad.addColorStop(0.55, '#9a3412');
      roofGrad.addColorStop(1, '#431407');
      ctx.fillStyle = roofGrad;
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - 180, 78);
      ctx.lineTo(cx + 180, 78);
      ctx.lineTo(w - 42, 224);
      ctx.lineTo(42, 224);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }

    // ------------------------------------------------------------------------
    // ESTILO C: ABRIGO DE ANIMAIS / CURRAL & GALINHEIRO COBERTO DE PALHA
    // ------------------------------------------------------------------------
    if (b.style === 'abrigo_animais') {
      // Cerca de curral e baias de madeira rústica
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#1c0a00';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(76, 265, w - 152, baseY - 285, 12);
      ctx.fill();
      ctx.stroke();

      // Interior sombreado do celeiro com fardos de feno/capim dourado e cocho de água
      ctx.fillStyle = '#271205';
      ctx.fillRect(108, 290, w - 216, baseY - 325);

      // Fardos de feno e milho
      for (const [hx, hy] of [
        [175, baseY - 125],
        [265, baseY - 125],
        [220, baseY - 178]
      ]) {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(hx - 42, hy, 84, 54, 10);
        ctx.fill();
        ctx.stroke();
      }

      // Cocho de madeira com água fresca à direita
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(450, baseY - 115, 175, 52, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(462, baseY - 108, 151, 20);

      // Telhado alto de palha de buriti trançada
      const thatchGrad = ctx.createLinearGradient(cx, 68, cx, 275);
      thatchGrad.addColorStop(0, '#fde047');
      thatchGrad.addColorStop(0.45, '#ca8a04');
      thatchGrad.addColorStop(1, '#713f12');
      ctx.fillStyle = thatchGrad;
      ctx.strokeStyle = '#271205';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, 64);
      ctx.lineTo(w - 44, 274);
      ctx.lineTo(44, 274);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }

    // ------------------------------------------------------------------------
    // ESTILO D: CASA DA FAMÍLIA EM PALAFITA ACREANA & LOJAS REGIONAIS 2.5D
    // ------------------------------------------------------------------------
    let wallTop = '#fef3c7';
    let wallBot = '#fde68a';
    let trimColor = '#0284c7';
    let roofTop = '#ea580c';
    let roofBot = '#7c2d12';

    if (b.style === 'loja_sementes') {
      wallTop = '#dcfce7';
      wallBot = '#86efac';
      trimColor = '#15803d';
    } else if (b.style === 'loja_ferramentas') {
      wallTop = '#fef9c3';
      wallBot = '#fde047';
      trimColor = '#b45309';
    } else if (b.style === 'mercado_municipal' || b.style === 'banca_feira') {
      wallTop = '#ffedd5';
      wallBot = '#fdba74';
      trimColor = '#c2410c';
    } else if (b.style === 'oficina_barcos') {
      wallTop = '#e0f2fe';
      wallBot = '#7dd3fc';
      trimColor = '#0369a1';
    }

    // 1. Palafitas (pilares de madeira de lei elevando o assoalho da casa ribeirinha)
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = 4.5;
    for (const sx of [105, 245, cx, w - 245, w - 105]) {
      ctx.fillRect(sx - 16, baseY - 82, 32, 74);
      ctx.strokeRect(sx - 16, baseY - 82, 32, 74);
    }

    // 2. Assoalho da varanda de tábuas corridas de itaúba
    const deckGrad = ctx.createLinearGradient(64, baseY - 98, 64, baseY - 64);
    deckGrad.addColorStop(0, '#b45309');
    deckGrad.addColorStop(1, '#5c3416');
    ctx.fillStyle = deckGrad;
    ctx.beginPath();
    ctx.roundRect(62, baseY - 98, w - 124, 34, 8);
    ctx.fill();
    ctx.stroke();

    // 3. Parede de tábuas horizontais encaixadas com rodapé de madeira nobre
    const wallGrad = ctx.createLinearGradient(88, 215, 88, baseY - 96);
    wallGrad.addColorStop(0, wallTop);
    wallGrad.addColorStop(1, wallBot);
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.roundRect(88, 212, w - 176, baseY - 308, 8);
    ctx.fill();
    ctx.stroke();

    // Frisos horizontais das tábuas da parede
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.22)';
    ctx.lineWidth = 2.5;
    for (let wy = 240; wy < baseY - 105; wy += 24) {
      ctx.beginPath();
      ctx.moveTo(92, wy);
      ctx.lineTo(w - 92, wy);
      ctx.stroke();
    }

    // 4. Porta central de madeira entalhada e escada frontal de acesso à varanda
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(cx - 52, 295, 104, baseY - 391, 8);
    ctx.fill();
    ctx.stroke();

    // Maçaneta de latão e bandeira colonial acima da porta
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx + 34, 405, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Degraus de madeira descendo da porta até o chão
    for (let st = 0; st < 3; st++) {
      const sw = 128 + st * 18;
      const sy = baseY - 82 + st * 24;
      ctx.fillStyle = st % 2 === 0 ? '#92400e' : '#78350f';
      ctx.beginPath();
      ctx.roundRect(cx - sw * 0.5, sy, sw, 22, 5);
      ctx.fill();
      ctx.stroke();
    }

    // 5. Duas janelas iluminadas com venezianas azuis/verdes típicas de Cruzeiro do Sul
    for (const wx of [195, w - 195]) {
      // Venezianas abertas
      ctx.fillStyle = trimColor;
      ctx.fillRect(wx - 74, 292, 26, 112);
      ctx.strokeRect(wx - 74, 292, 26, 112);
      ctx.fillRect(wx + 48, 292, 26, 112);
      ctx.strokeRect(wx + 48, 292, 26, 112);

      // Vidro iluminado com luz acolhedora interna
      const winGrad = ctx.createRadialGradient(wx, 348, 6, wx, 348, 54);
      winGrad.addColorStop(0, '#fef9c3');
      winGrad.addColorStop(0.6, '#fbbf24');
      winGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = winGrad;
      ctx.fillRect(wx - 48, 292, 96, 112);
      ctx.strokeRect(wx - 48, 292, 96, 112);

      // Esquadria em cruz da janela
      ctx.beginPath();
      ctx.moveTo(wx, 292);
      ctx.lineTo(wx, 404);
      ctx.moveTo(wx - 48, 348);
      ctx.lineTo(wx + 48, 348);
      ctx.stroke();
    }

    // 6. Guarda-corpo entalhado da varanda e rede acreana pendurada (na Casa da Família)
    for (const side of [-1, 1]) {
      const rx = side < 0 ? 88 : cx + 68;
      const rw = w * 0.5 - 156;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(rx, baseY - 168, rw, 14);
      ctx.strokeRect(rx, baseY - 168, rw, 14);
      for (let bx = rx + 18; bx < rx + rw - 10; bx += 26) {
        ctx.fillRect(bx, baseY - 154, 10, 56);
        ctx.strokeRect(bx, baseY - 154, 10, 56);
      }
    }

    if (b.style === 'casa_familia' || b.style === 'casa_ribeirinha') {
      // Rede de varanda colorida esticada no alpendre direito
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 85, 345);
      ctx.quadraticCurveTo(w - 190, 425, w - 105, 340);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // 7. Telhado colonial de barro com telhas desenhadas uma a uma
    const roofGrad = ctx.createLinearGradient(cx, 54, cx, 232);
    roofGrad.addColorStop(0, roofTop);
    roofGrad.addColorStop(1, roofBot);
    ctx.fillStyle = roofGrad;
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(cx - 195, 58);
    ctx.lineTo(cx + 195, 58);
    ctx.lineTo(w - 38, 228);
    ctx.lineTo(38, 228);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ondulações das telhas de barro
    ctx.strokeStyle = 'rgba(67, 20, 7, 0.45)';
    ctx.lineWidth = 3;
    for (let ty = 92; ty <= 204; ty += 28) {
      const inset = ((228 - ty) / 170) * 145;
      ctx.beginPath();
      ctx.moveTo(48 + inset, ty);
      ctx.lineTo(w - 48 - inset, ty);
      ctx.stroke();
    }
  });
}

export function buildBuilding3DGroup(b: MapBuilding, castShadows: boolean): THREE.Group {
  const group = new THREE.Group();
  void castShadows;
  const w = b.width * WORLD_TILE_SIZE;
  const d = b.height * WORLD_TILE_SIZE;

  const bTex = getBuildingIllustratedTexture2D(b);
  const bSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: bTex, transparent: true })
  );
  bSprite.center.set(0.5, 0.05);

  if (b.style === 'poco_agua') {
    bSprite.scale.set(3.4, 3.1, 1);
    bSprite.position.set(0, 0.02, 0);
    group.add(bSprite);

    const label = createLabelSprite3D(b.name, '#74c0fc', 'rgba(18, 33, 46, 0.94)', '#e7f5ff', 2.8);
    label.position.set(0, 3.35, 0);
    group.add(label);
    return group;
  }

  const spriteW = Math.max(4.6, w * 1.08);
  const spriteH = Math.max(4.2, spriteW * (640 / 768));
  bSprite.scale.set(spriteW, spriteH, 1);
  bSprite.position.set(0, 0.02, d * 0.06);
  group.add(bSprite);

  const sign = createLabelSprite3D(b.name, '#f5d076', 'rgba(34, 19, 9, 0.94)', '#fff8e7', 2.9);
  sign.position.set(0, spriteH * 0.92, d * 0.2);
  group.add(sign);

  return group;
}

// ============================================================================
// 5. PERSONAGENS 2.5D HD COM ROUPAS RURAIS EM CAMADAS (JARDINEIRA + CAMISA XADREZ)
// ============================================================================

export interface CharacterSpriteState {
  shirtColor: string;
  overallsColor: string;
  hatColor?: string;
  hairColor: string;
  isElder: boolean;
  isFemale: boolean;
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  lastKey: string;
  clothingVerified?: boolean;
}

/**
 * Garante que NENHUM personagem tenha camisa cor de pele/bege/marrom-claro:
 * converte qualquer tom terroso em cores vibrantes de camisa xadrez rural!
 */
function normalizeVibrantShirtColor(rawHex: string, isElder: boolean, isFemale: boolean): string {
  const lower = rawHex.toLowerCase();
  if (isElder && !isFemale) return '#15803d'; // Verde-floresta vibrante para Seu Raimundo
  if (isElder && isFemale) return '#be123c'; // Carmim vibrante para Dona Francisca
  if (
    lower.includes('8d5b3c') ||
    lower.includes('a66e4a') ||
    lower.includes('c48a5a') ||
    lower.includes('d49b6a') ||
    lower.includes('b87b4b')
  ) {
    return '#1d4ed8'; // Azul royal vibrante
  }
  return rawHex;
}

function drawRealisticCharacterSprite25D(
  state: CharacterSpriteState,
  facing: Direction,
  stridePhase: number,
  toolId: ToolId | undefined,
  toolSwing: number
) {
  const ctx = state.canvas.getContext('2d');
  if (!ctx) return;
  const w = state.canvas.width;
  const h = state.canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w * 0.5;
  const flipX = facing === 'left' ? -1 : 1;

  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(flipX, 1);

  // Sombra projetada no chão sob as botas
  const shadowGrad = ctx.createRadialGradient(0, h - 38, 10, 0, h - 38, 92);
  shadowGrad.addColorStop(0, 'rgba(15, 8, 3, 0.52)');
  shadowGrad.addColorStop(1, 'rgba(15, 8, 3, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(0, h - 38, 86, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  const legOffsetL = stridePhase * 20;
  const legOffsetR = -stridePhase * 20;

  // 1. BASE PÉLVICA / QUADRIL E PERNAS DA JARDINEIRA JEANS (100% Sólido, sem fresta ou transparência no meio)
  // Bloco de união pélvica central (garante opacidade absoluta entre o tronco e as pernas)
  const crotchGrad = ctx.createLinearGradient(-36, 368, 36, 448);
  crotchGrad.addColorStop(0, '#172554');
  crotchGrad.addColorStop(0.5, state.overallsColor);
  crotchGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = crotchGrad;
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-58, 368);
  ctx.lineTo(58, 368);
  ctx.lineTo(44, 442);
  ctx.quadraticCurveTo(0, 452, -44, 442);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Costura central reforçada da braguilha do macacão rural
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 370);
  ctx.lineTo(0, 436);
  ctx.stroke();

  // Pernas (Calça Jeans Azul-Escura da Jardineira conectada diretamente à pélvis com costura dupla)
  const drawLeg = (lx: number, liftY: number) => {
    ctx.save();
    ctx.translate(lx, 374 + liftY * 0.35);
    ctx.rotate((liftY / 20) * 0.16);

    const pantGrad = ctx.createLinearGradient(-26, 0, 26, 0);
    pantGrad.addColorStop(0, '#172554');
    pantGrad.addColorStop(0.5, state.overallsColor);
    pantGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = pantGrad;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(-26, 0, 52, 158, 14);
    ctx.fill();
    ctx.stroke();

    // Costura lateral amarela de calça jeans
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 134);
    ctx.stroke();

    // Barra dobrada da calça jeans
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(-27, 132, 54, 15);
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(-27, 132, 54, 15);

    // Bota de couro tratorada
    const bootGrad = ctx.createLinearGradient(-28, 144, 32, 195);
    bootGrad.addColorStop(0, '#451a03');
    bootGrad.addColorStop(0.5, '#78350f');
    bootGrad.addColorStop(1, '#270e02');
    ctx.fillStyle = bootGrad;
    ctx.beginPath();
    ctx.moveTo(-25, 144);
    ctx.lineTo(25, 144);
    ctx.quadraticCurveTo(44, 162, 40, 186);
    ctx.lineTo(-27, 186);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#140802';
    ctx.fillRect(-28, 180, 68, 10);
    ctx.restore();
  };

  drawLeg(-33, legOffsetL);
  drawLeg(33, legOffsetR);

  // 2. PESCOÇO (Desenhado ANTES do tronco para a gola da roupa cobrir a base com perfeição!)
  ctx.fillStyle = '#d49260';
  ctx.strokeStyle = '#241308';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(-22, 198, 44, 44, 10);
  ctx.fill();
  ctx.stroke();

  // 3. BRAÇO ESQUERDO (Manga comprida dobrada da camisa + antebraço)
  ctx.save();
  ctx.translate(-68, 248);
  ctx.rotate(-stridePhase * 0.3);
  ctx.fillStyle = state.shirtColor;
  ctx.strokeStyle = '#170f08';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-22, -6, 44, 84, 18);
  ctx.fill();
  ctx.stroke();

  // Punho dobrado da manga da camisa
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-22, 66, 44, 14);
  ctx.strokeRect(-22, 66, 44, 14);

  // Antebraço e mão
  ctx.fillStyle = '#d89664';
  ctx.beginPath();
  ctx.roundRect(-15, 80, 30, 40, 12);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 124, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. TRONCO VESTIDO EM CAMADAS: CAMISETA BRANCA + CAMISA XADREZ + JARDINEIRA JEANS (MACACÃO RURAL)
  ctx.save();
  ctx.translate(0, 228);

  // 4A. Corpo da Camisa de Trabalho Vibrante
  ctx.fillStyle = state.shirtColor;
  ctx.strokeStyle = '#140c06';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-62, 6);
  ctx.quadraticCurveTo(0, -8, 62, 6);
  ctx.lineTo(68, 172);
  ctx.quadraticCurveTo(0, 184, -68, 172);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Listras sutis de tecido xadrez na camisa para textura de roupa autêntica
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 3;
  for (const sx of [-42, -20, 20, 42]) {
    ctx.beginPath();
    ctx.moveTo(sx, 8);
    ctx.lineTo(sx, 165);
    ctx.stroke();
  }
  for (const sy of [34, 68, 102]) {
    ctx.beginPath();
    ctx.moveTo(-60, sy);
    ctx.lineTo(60, sy);
    ctx.stroke();
  }

  // 4B. Camiseta Branca Interna visível no colarinho + Gola Dobrada da Camisa
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-26, 2);
  ctx.lineTo(26, 2);
  ctx.lineTo(0, 38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Abas da gola da camisa
  ctx.fillStyle = state.shirtColor;
  ctx.strokeStyle = '#140c06';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-8, 32);
  ctx.lineTo(-38, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(8, 32);
  ctx.lineTo(38, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4C. JARDINEIRA / MACACÃO JEANS RURAL SOBRE A CAMISA (Alças + Peitilho + Fivelas Douradas + Bolso)
  const bibGrad = ctx.createLinearGradient(-56, 45, 56, 175);
  bibGrad.addColorStop(0, '#1e3a8a');
  bibGrad.addColorStop(0.5, state.overallsColor);
  bibGrad.addColorStop(1, '#172554');
  ctx.fillStyle = bibGrad;
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 4;

  // Alças da jardineira subindo até os ombros
  ctx.fillRect(-48, 4, 22, 62);
  ctx.strokeRect(-48, 4, 22, 62);
  ctx.fillRect(26, 4, 22, 62);
  ctx.strokeRect(26, 4, 22, 62);

  // Peitilho e cintura da jardineira jeans
  ctx.beginPath();
  ctx.moveTo(-48, 52);
  ctx.lineTo(48, 52);
  ctx.lineTo(66, 122);
  ctx.lineTo(66, 172);
  ctx.lineTo(-66, 172);
  ctx.lineTo(-66, 122);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Botões de latão dourado nas alças da jardineira
  for (const bx of [-37, 37]) {
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#422006';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bx, 58, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Bolso central da jardineira com costura amarela
  ctx.fillStyle = '#172554';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-28, 76, 56, 46, 8);
  ctx.fill();
  ctx.stroke();

  // Cinto de couro na cintura com fivela dourada
  ctx.fillStyle = '#3b200e';
  ctx.strokeStyle = '#140802';
  ctx.lineWidth = 3.5;
  ctx.fillRect(-66, 148, 132, 22);
  ctx.strokeRect(-66, 148, 132, 22);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(-16, 145, 32, 28);
  ctx.strokeRect(-16, 145, 32, 28);
  ctx.fillStyle = '#3b200e';
  ctx.fillRect(-8, 151, 16, 16);

  // Aba pélvica inferior da jardineira conectando o peitilho ao entrepernas com costura dupla
  ctx.fillStyle = bibGrad;
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-56, 170);
  ctx.lineTo(56, 170);
  ctx.lineTo(40, 222);
  ctx.quadraticCurveTo(0, 230, -40, 222);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Costura dupla de jeans no gancho frontal
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.lineTo(0, 220);
  ctx.stroke();

  ctx.restore(); // Fim do tronco

  // 5. CABEÇA E ROSTO 2.5D HD REALISTA E EXPRESSIVO
  ctx.save();
  ctx.translate(0, 136);

  for (const side of [-1, 1]) {
    ctx.fillStyle = '#d49260';
    ctx.strokeStyle = '#241308';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(side * 76, 8, 15, 24, side * -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const faceGrad = ctx.createRadialGradient(-18, -16, 14, 0, 6, 88);
  faceGrad.addColorStop(0, '#f5c69c');
  faceGrad.addColorStop(0.58, '#df9f6d');
  faceGrad.addColorStop(1, '#b57445');
  ctx.fillStyle = faceGrad;
  ctx.strokeStyle = '#241308';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(-74, -18);
  ctx.bezierCurveTo(-78, -82, 78, -82, 74, -18);
  ctx.bezierCurveTo(76, 46, 42, 84, 0, 86);
  ctx.bezierCurveTo(-42, 84, -76, 46, -74, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const hairHex = state.isElder ? '#e2e8f0' : state.hairColor;
  ctx.fillStyle = hairHex;
  ctx.strokeStyle = '#1e120a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-76, -8);
  ctx.bezierCurveTo(-82, -88, 82, -88, 76, -8);
  ctx.quadraticCurveTo(58, -34, 32, -26);
  ctx.quadraticCurveTo(0, -38, -32, -26);
  ctx.quadraticCurveTo(-58, -34, -76, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const drawRealisticEye = (ex: number, ey: number) => {
    ctx.save();
    ctx.translate(ex, ey);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1f1108';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-19, 0);
    ctx.quadraticCurveTo(0, -15, 19, 0);
    ctx.quadraticCurveTo(0, 14, -19, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const irisGrad = ctx.createRadialGradient(2, 2, 2, 2, 0, 11);
    irisGrad.addColorStop(0, '#7c431e');
    irisGrad.addColorStop(0.7, '#45220c');
    irisGrad.addColorStop(1, '#1c0d04');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(2, 0, 10.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#090502';
    ctx.beginPath();
    ctx.arc(2, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5.5, -4, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2.5, 3.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#170b04';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -1);
    ctx.quadraticCurveTo(0, -16, 20, -1);
    ctx.stroke();

    ctx.restore();
  };

  drawRealisticEye(-31, 4);
  drawRealisticEye(31, 4);

  ctx.fillStyle = state.isElder ? '#cbd5e1' : state.hairColor;
  ctx.strokeStyle = '#1c1008';
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 31, -18);
    ctx.rotate(side * -0.08);
    ctx.beginPath();
    ctx.roundRect(-19, -5, 38, 9, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(166, 98, 54, 0.55)';
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-9, 26);
  ctx.quadraticCurveTo(0, 32, 9, 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6e3b1b';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(2, 4);
  ctx.lineTo(8, 25);
  ctx.quadraticCurveTo(0, 30, -7, 25);
  ctx.stroke();

  ctx.fillStyle = 'rgba(214, 102, 78, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-44, 24, 14, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(44, 24, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.isElder && !state.isFemale) {
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.quadraticCurveTo(-28, 30, -34, 48);
    ctx.quadraticCurveTo(-14, 46, 0, 42);
    ctx.quadraticCurveTo(14, 46, 34, 48);
    ctx.quadraticCurveTo(28, 30, 0, 34);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#7c2d23';
  ctx.strokeStyle = '#2b0f0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-20, 46);
  ctx.quadraticCurveTo(0, 49, 20, 46);
  ctx.quadraticCurveTo(0, 66, -20, 46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-14, 47);
  ctx.quadraticCurveTo(0, 50, 14, 47);
  ctx.quadraticCurveTo(0, 56, -14, 47);
  ctx.fill();

  if (state.hatColor) {
    ctx.save();
    ctx.translate(0, -48);

    const hatGrad = ctx.createLinearGradient(-65, -55, 65, 10);
    hatGrad.addColorStop(0, '#fae19c');
    hatGrad.addColorStop(0.5, state.hatColor);
    hatGrad.addColorStop(1, '#b58532');
    ctx.fillStyle = hatGrad;
    ctx.strokeStyle = '#362009';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(-64, 4);
    ctx.quadraticCurveTo(-58, -56, 0, -56);
    ctx.quadraticCurveTo(58, -56, 64, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.roundRect(-65, -10, 130, 14, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hatGrad;
    ctx.beginPath();
    ctx.ellipse(0, 6, 118, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(92, 54, 14, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 6, 96, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 6, 72, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore(); // Fim da cabeça

  // 6. BRAÇO DIREITO (Manga comprida com punho dobrado + Ferramenta)
  ctx.save();
  ctx.translate(68, 248);
  const swingAngle = toolSwing > 0 ? -0.65 + Math.sin(toolSwing * Math.PI) * 1.15 : stridePhase * 0.3;
  ctx.rotate(swingAngle);

  ctx.fillStyle = state.shirtColor;
  ctx.strokeStyle = '#170f08';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-22, -6, 44, 84, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-22, 66, 44, 14);
  ctx.strokeRect(-22, 66, 44, 14);

  ctx.fillStyle = '#df9e6b';
  ctx.beginPath();
  ctx.roundRect(-15, 80, 30, 40, 12);
  ctx.fill();
  ctx.stroke();

  if (toolId) {
    ctx.save();
    ctx.translate(6, 118);
    ctx.rotate(0.45);

    if (toolId === 'regador') {
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#0c4a6e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-18, -22, 54, 48, 10);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(36, 4);
      ctx.lineTo(68, -18);
      ctx.lineTo(72, -8);
      ctx.lineTo(36, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (toolId === 'semente') {
      ctx.fillStyle = '#a16207';
      ctx.strokeStyle = '#422006';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(14, 4, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.arc(14, -14, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (toolId === 'colheita') {
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-16, -12, 56, 42, 12);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#291002';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-8, -68, 14, 142, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = toolId === 'vara_pesca' ? '#eab308' : '#cbd5e1';
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-6, 52, 48, 24, 5);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.fillStyle = '#df9e6b';
  ctx.strokeStyle = '#170f08';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 124, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  state.texture.needsUpdate = true;
}

export interface CharacterVisualValidationResult {
  isValid: boolean;
  reason?: string;
  hasSolidClothingPixels?: boolean;
}

/**
 * Valida o estado visual do personagem para assegurar que o sprite, o canvas,
 * a textura e as camadas de vestuário (camisa xadrez e jardineira jeans)
 * foram desenhados com integridade e sem transparência ou estado incompleto.
 */
export function validateCharacterVisualState(charGroup: THREE.Group): CharacterVisualValidationResult {
  if (!charGroup) {
    return { isValid: false, reason: 'Grupo do personagem é nulo ou indefinido' };
  }
  const charSprite = charGroup.getObjectByName('charSprite25D') as THREE.Sprite | undefined;
  if (!charSprite || !(charSprite instanceof THREE.Sprite)) {
    return { isValid: false, reason: 'Sprite charSprite25D ausente no grupo' };
  }
  const charState = charGroup.userData.charSpriteState as CharacterSpriteState | undefined;
  if (!charState) {
    return { isValid: false, reason: 'charSpriteState ausente em userData' };
  }
  const { canvas, texture, shirtColor, overallsColor } = charState;
  if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
    return { isValid: false, reason: 'Canvas inválido ou dimensões zeradas' };
  }
  if (!texture || !(texture instanceof THREE.CanvasTexture)) {
    return { isValid: false, reason: 'Textura THREE.CanvasTexture ausente ou inválida' };
  }
  if (!shirtColor || !overallsColor) {
    return { isValid: false, reason: 'Cores de vestuário ausentes no estado' };
  }

  // Verifica se a cor da camisa foi indevidamente atribuída a tom terroso/cor de pele desprovida de roupa
  const lowerShirt = shirtColor.toLowerCase();
  if (
    lowerShirt.includes('8d5b3c') ||
    lowerShirt.includes('a66e4a') ||
    lowerShirt.includes('c48a5a') ||
    lowerShirt.includes('d49b6a') ||
    lowerShirt.includes('b87b4b')
  ) {
    return { isValid: false, reason: 'Cor da camisa atribuída a tom terroso/cor de pele desprovida de roupa' };
  }

  // Amostragem de pixels na região do tronco/jardineira no canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { isValid: false, reason: 'Não foi possível obter contexto 2d do canvas' };
  }
  try {
    // Amostra a região da jardineira/camisa (x: 236..276, y: 280..330 em canvas 512x640)
    const imgData = ctx.getImageData(236, 280, 40, 50);
    const data = imgData.data;
    let solidPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 60) {
        solidPixels++;
      }
    }
    // 40*50 = 2000 pixels. Se menos de 800 forem sólidos, o canvas está em branco ou incompleto.
    if (solidPixels < 800) {
      return {
        isValid: false,
        reason: `Região de vestuário incompleta ou não desenhada (${solidPixels}/2000 pixels sólidos)`,
        hasSolidClothingPixels: false
      };
    }

    // Amostra a região pélvica central / entrepernas (x: 246..266, y: 388..428 em canvas 512x640)
    // para assegurar que não haja transparência no meio do personagem!
    const crotchData = ctx.getImageData(246, 388, 20, 40);
    const cData = crotchData.data;
    let solidCrotchPixels = 0;
    for (let i = 0; i < cData.length; i += 4) {
      if (cData[i + 3] > 60) {
        solidCrotchPixels++;
      }
    }
    // 20*40 = 800 pixels. Garante preenchimento sólido sem corte no meio
    if (solidCrotchPixels < 350) {
      return {
        isValid: false,
        reason: `Região pélvica/meio do personagem transparente ou incompleta (${solidCrotchPixels}/800 pixels)`,
        hasSolidClothingPixels: false
      };
    }
  } catch {
    if (!charState.lastKey) {
      return { isValid: false, reason: 'Primeira passagem de renderização não executada' };
    }
  }

  return { isValid: true, hasSolidClothingPixels: true };
}

/**
 * Força a re-renderização das camadas de vestuário do personagem (camisa interna branca,
 * camisa de mangas compridas, jardineira rural com botões e botas), atualizando a textura
 * antes de permitir a exibição do sprite na tela.
 */
export function forceRerenderCharacterClothing(
  charGroup: THREE.Group,
  facing: Direction = 'down',
  toolId?: ToolId,
  renderer?: THREE.WebGLRenderer
): boolean {
  const charState = charGroup.userData.charSpriteState as CharacterSpriteState | undefined;
  if (!charState) return false;

  const charSprite = charGroup.getObjectByName('charSprite25D') as THREE.Sprite | undefined;

  // Garante normalização de cores vibrantes de vestuário rural
  charState.shirtColor = normalizeVibrantShirtColor(
    charState.shirtColor,
    charState.isElder,
    charState.isFemale
  );
  if (!charState.overallsColor || charState.overallsColor === '#8d5b3c') {
    charState.overallsColor = charState.isElder ? '#334155' : '#1d4ed8';
  }

  // Reseta a chave para forçar desenho completo e limpo das camadas de vestuário
  charState.lastKey = '';
  drawRealisticCharacterSprite25D(charState, facing, 0, toolId, 0);
  charState.clothingVerified = true;
  charState.texture.needsUpdate = true;

  if (charSprite) {
    if (charSprite.material.map !== charState.texture) {
      charSprite.material.map = charState.texture;
      charSprite.material.needsUpdate = true;
    }
    charSprite.visible = true;
  }

  // Se o renderer estiver disponível, pré-carrega a textura na GPU antes da exibição
  if (renderer && typeof (renderer as any).initTexture === 'function') {
    try {
      renderer.initTexture(charState.texture);
    } catch {
      // Ignora se o contexto ainda estiver inicializando
    }
  }

  return true;
}

export function buildCharacter3DGroup(
  shirtColor: string,
  hatColor: string | undefined,
  hairColor: string,
  labelName?: string,
  castShadows = true
): THREE.Group {
  const group = new THREE.Group();
  if (typeof document === 'undefined') {
    return group;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const isElder = labelName ? /Raimundo|Francisca|Bento/i.test(labelName) : false;
  const isFemale = labelName ? /Francisca|Helena|Sofia|Iara|Clara|Luzia/i.test(labelName) : false;
  const vibrantShirt = normalizeVibrantShirtColor(shirtColor, isElder, isFemale);
  const overallsColor = isElder ? '#334155' : '#1d4ed8';

  const charState: CharacterSpriteState = {
    shirtColor: vibrantShirt,
    overallsColor,
    hatColor,
    hairColor,
    isElder,
    isFemale,
    canvas,
    texture,
    lastKey: '',
    clothingVerified: false
  };

  drawRealisticCharacterSprite25D(charState, 'down', 0, 'enxada', 0);

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });
  const charSprite = new THREE.Sprite(spriteMat);
  charSprite.name = 'charSprite25D';
  charSprite.scale.set(2.05, 2.56, 1);
  charSprite.position.set(0, 1.24, 0);
  charSprite.renderOrder = 12;
  // Inicialmente oculto até validação de vestuário concluída
  charSprite.visible = false;
  group.add(charSprite);

  if (castShadows) {
    const shadowProxy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 1.5, 8),
      new THREE.ShadowMaterial({ opacity: 0.25 })
    );
    shadowProxy.position.set(0, 0.75, 0);
    shadowProxy.castShadow = true;
    group.add(shadowProxy);
  }

  group.userData.charSpriteState = charState;

  // Imediatamente valida e garante que a textura de vestuário esteja carregada e completa
  const initialCheck = validateCharacterVisualState(group);
  if (!initialCheck.isValid) {
    forceRerenderCharacterClothing(group, 'down', 'enxada');
  } else {
    charSprite.visible = true;
    charState.clothingVerified = true;
  }

  if (labelName) {
    const label = createLabelSprite3D(labelName, '#f5e1a4', 'rgba(28, 16, 8, 0.94)', '#fff7e6', 2.75);
    label.position.set(0, 2.52, 0);
    group.add(label);
  }

  return group;
}

export function animateCharacter3D(
  charGroup: THREE.Group,
  facing: Direction,
  walkDistance: number,
  isMoving: boolean,
  selectedTool?: ToolId,
  toolSwingPhase = 0
) {
  const charState = charGroup.userData.charSpriteState as CharacterSpriteState | undefined;
  if (!charState) return;

  const rawStride = isMoving ? Math.sin(walkDistance * 6.5) : 0;
  const quantStride = Math.round(rawStride * 5) / 5;
  const quantSwing = Math.round(toolSwingPhase * 6) / 6;
  const key = `${facing}_${quantStride}_${selectedTool ?? 'none'}_${quantSwing}`;

  if (charState.lastKey !== key) {
    charState.lastKey = key;
    drawRealisticCharacterSprite25D(charState, facing, quantStride, selectedTool, quantSwing);
  }

  const sp = charGroup.getObjectByName('charSprite25D');
  if (sp) {
    sp.position.y = 1.24 + (isMoving ? Math.abs(Math.sin(walkDistance * 6.5)) * 0.06 : 0);
  }
}

// ============================================================================
// 6. CANOAS RIBEIRINHAS DO JURUÁ, ÔNIBUS RURAL E ANIMAIS EM SPRITES 2D/2.5D HD
// ============================================================================

export function buildBus3DGroup(castShadows: boolean): THREE.Group {
  const group = new THREE.Group();
  void castShadows;

  const busTex = getOrCreateTexture('bus_rural_2d_v3', 512, 384, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const baseY = h - 42;

    // Sombra da carroceria na estrada
    ctx.fillStyle = 'rgba(15, 8, 3, 0.48)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, baseY + 6, 218, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bagageiro de teto com sacas de farinha e caixotes de feira
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(86, 66, 290, 24);
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(110, 52, 75, 36, 10);
    ctx.roundRect(195, 48, 84, 40, 8);
    ctx.roundRect(290, 54, 65, 34, 8);
    ctx.fill();
    ctx.stroke();

    // Carroceria clássica do Ônibus da Linha Rural de Cruzeiro do Sul
    const bodyGrad = ctx.createLinearGradient(42, 88, 42, baseY - 26);
    bodyGrad.addColorStop(0, '#fef08a');
    bodyGrad.addColorStop(0.35, '#facc15');
    bodyGrad.addColorStop(0.75, '#eab308');
    bodyGrad.addColorStop(1, '#a16207');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(46, baseY - 26);
    ctx.lineTo(46, 114);
    ctx.quadraticCurveTo(46, 88, 76, 88);
    ctx.lineTo(426, 88);
    ctx.quadraticCurveTo(464, 88, 472, 146);
    ctx.lineTo(472, baseY - 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Faixa lateral azul-marinho e vermelha tradicional + letreiro "CRUZEIRO DO SUL - RAMAL"
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(48, 212, 422, 34);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(48, 246, 422, 12);

    ctx.fillStyle = '#fef9c3';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIAÇÃO VALE DO JURUÁ', 245, 235);

    // Janelas panorâmicas com reflexo celeste e para-brisa dianteiro
    for (let i = 0; i < 5; i++) {
      const wx = 68 + i * 68;
      const winGrad = ctx.createLinearGradient(wx, 112, wx + 54, 188);
      winGrad.addColorStop(0, '#e0f2fe');
      winGrad.addColorStop(0.5, '#38bdf8');
      winGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = winGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(wx, 112, 56, 76, 8);
      ctx.fill();
      ctx.stroke();
    }

    // Para-brisa dianteiro inclinado + farol aceso + para-choque cromado
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.roundRect(412, 108, 52, 82, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(466, 266, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rodas tratoradas com aros metálicos
    for (const rx of [136, 376]) {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, baseY - 12, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(rx, baseY - 12, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  const busSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: busTex, transparent: true }));
  busSprite.center.set(0.5, 0.08);
  busSprite.scale.set(4.1, 3.05, 1);
  busSprite.position.set(0, 0.02, 0);
  group.add(busSprite);

  return group;
}

export function buildCanoe3DGroup(castShadows: boolean): THREE.Group {
  const group = new THREE.Group();
  void castShadows;

  // Canoa Ribeirinha Autêntica do Rio Juruá (Montaria / Batelão de Itaúba esculpido em 2D/2.5D HD)
  const canoeTex = getOrCreateTexture('canoe_montaria_jurua_2d_v4', 512, 320, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.58;

    // 1. Marolas cristalinas e espuma d'água ao redor do casco no Rio Juruá
    for (const [rx, ry, a] of [
      [228, 56, 0.35],
      [204, 44, 0.55]
    ]) {
      ctx.strokeStyle = `rgba(186, 230, 253, ${a})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sombra aquática profunda sob a quilha da canoa
    ctx.fillStyle = 'rgba(7, 42, 64, 0.58)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 196, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Interior côncavo da canoa (fundo de tábuas de itaúba, cavernas e bancos de madeira)
    const innerGrad = ctx.createLinearGradient(cx, cy - 38, cx, cy + 12);
    innerGrad.addColorStop(0, '#451a03');
    innerGrad.addColorStop(0.5, '#78350f');
    innerGrad.addColorStop(1, '#271001');
    ctx.fillStyle = innerGrad;
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 212, cy - 28);
    ctx.quadraticCurveTo(cx, cy - 64, cx + 212, cy - 28);
    ctx.quadraticCurveTo(cx, cy + 6, cx - 212, cy - 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cavernas internas (costelas de madeira da embarcação)
    ctx.strokeStyle = '#271001';
    ctx.lineWidth = 4;
    for (const rx of [-125, -75, -25, 25, 75, 125]) {
      ctx.beginPath();
      ctx.moveTo(cx + rx, cy - 44);
      ctx.lineTo(cx + rx, cy - 10);
      ctx.stroke();
    }

    // Três bancos de prancha de madeira clara (proa, meio e popa)
    for (const [bx, bw, bh] of [
      [cx - 105, 26, 40],
      [cx, 30, 48],
      [cx + 105, 26, 40]
    ]) {
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#271001';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bx - bw * 0.5, cy - bh * 0.85, bw, bh, 5);
      ctx.fill();
      ctx.stroke();
    }

    // Paneiro de cipó com frutas/peixes e rolo de corda dentro da canoa
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - 48, cy - 28, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(cx - 48, cy - 32, 11, 0, Math.PI * 2);
    ctx.fill();

    // 3. Costado externo esculpido da Canoa Ribeirinha (proa e popa lançadas com pintura regional)
    const hullGrad = ctx.createLinearGradient(cx, cy - 32, cx, cy + 28);
    hullGrad.addColorStop(0, '#d97706');
    hullGrad.addColorStop(0.45, '#92400e');
    hullGrad.addColorStop(0.82, '#5c3416');
    hullGrad.addColorStop(1, '#271001');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#140700';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    // Proa esquerda afilada e erguida
    ctx.moveTo(cx - 222, cy - 38);
    ctx.quadraticCurveTo(cx, cy - 2, cx + 222, cy - 38);
    // Linha d'água e quilha curvada
    ctx.quadraticCurveTo(cx + 178, cy + 26, cx, cy + 28);
    ctx.quadraticCurveTo(cx - 178, cy + 26, cx - 222, cy - 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Faixa viva da borda (borda pintada em azul-celeste e amarelo-ouro típica dos barcos do Juruá)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 210, cy - 32);
    ctx.quadraticCurveTo(cx, cy + 2, cx + 210, cy - 32);
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(cx - 206, cy - 26);
    ctx.quadraticCurveTo(cx, cy + 8, cx + 206, cy - 26);
    ctx.stroke();

    // 4. Remo amazônico de madeira de faia apoiado na borda da canoa
    ctx.save();
    ctx.translate(cx + 52, cy - 8);
    ctx.rotate(0.28);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-75, 0);
    ctx.lineTo(55, 0);
    ctx.stroke();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Pá ovalada do remo pintada de vermelho e amarelo
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(72, 0, 26, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Espuma branca viva da linha d'água batendo no casco
    ctx.strokeStyle = 'rgba(240, 249, 255, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 176, cy + 16);
    ctx.quadraticCurveTo(cx, cy + 32, cx + 176, cy + 16);
    ctx.stroke();
  });

  const canoeSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: canoeTex, transparent: true })
  );
  canoeSprite.center.set(0.5, 0.35);
  canoeSprite.scale.set(3.25, 2.04, 1);
  canoeSprite.position.set(0, 0.22, 0);
  canoeSprite.renderOrder = 8;
  group.add(canoeSprite);

  return group;
}

export function buildAnimal3DGroup(categoryId: AnimalCategoryId, castShadows: boolean): THREE.Group {
  const group = new THREE.Group();
  void castShadows;

  const tex = getOrCreateTexture(`animal_sprite_hd_${categoryId}`, 256, 256, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.62;

    if (categoryId === 'peixe_viveiro') {
      const fGrad = ctx.createLinearGradient(40, cy - 30, 210, cy + 30);
      fGrad.addColorStop(0, '#166534');
      fGrad.addColorStop(0.6, '#4ade80');
      fGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = fGrad;
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return;
    }

    let bodyColor = '#fffbeb';
    let accentColor = '#dc2626';
    if (categoryId === 'pato') {
      bodyColor = '#d6b286';
      accentColor = '#15803d';
    } else if (categoryId === 'porco') {
      bodyColor = '#fbcfe8';
      accentColor = '#f472b6';
    } else if (categoryId === 'cabra') {
      bodyColor = '#e7d4b5';
      accentColor = '#78350f';
    } else if (categoryId === 'vaca') {
      bodyColor = '#f8fafc';
      accentColor = '#334155';
    }

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(cx, h - 24, 58, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#27170a';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy + 12, 54, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = categoryId === 'pato' ? accentColor : bodyColor;
    ctx.beginPath();
    ctx.arc(cx + 38, cy - 22, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(cx + 48, cy - 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 50, cy - 28, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(cx + 70, cy - 18, 14, 9, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  const scale = categoryId === 'vaca' ? 1.85 : categoryId === 'porco' || categoryId === 'cabra' ? 1.45 : 1.15;
  sp.scale.set(scale, scale, 1);
  sp.position.set(0, scale * 0.45, 0);
  group.add(sp);

  const gemTex = getOrCreateTexture('harvest_ready_badge_2d', 128, 128, 1, 1, true, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  const readyGem = new THREE.Sprite(new THREE.SpriteMaterial({ map: gemTex, transparent: true }));
  readyGem.name = 'readyGem';
  readyGem.scale.set(0.42, 0.42, 1);
  readyGem.position.set(0, scale + 0.2, 0);
  group.add(readyGem);

  return group;
}

