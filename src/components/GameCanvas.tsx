/**
 * MOTOR DE MUNDO INTERATIVO 3D PBR (THREE.JS) + DIRETOR DE ANIMAÇÕES IN-GAME
 * - Renderização 3D completa com iluminação solar amazônica, RoomEnvironment PBR, sombras suaves e neblina.
 * - Diretor Cinematográfico In-Game 3D: controla câmera, ônibus 3D, canoas 3D, moradores 3D e protagonista
 *   dentro do próprio motor do jogo para encenar a chegada, histórias, diálogos e eventos semanais sem telas de texto.
 * - Canteiros agrícolas 3D com solo virgem, arado seco, arado regado (com água nos sulcos e gotas 3D),
 *   semente/maniva plantada (Estágio 0) e 4 fases de crescimento botânico 3D.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Direction,
  GameState,
  ToolId,
  VehicleRuntimeState,
  canMoveTo,
  getSeasonalClimateEffect,
  getTargetTileCoords,
  getTileAt,
  isTileWalkableForPlayer,
  resolveBestActionTileCoords,
  stepVehicleOnRoute,
  validateBusRoute,
  validateWaterRoute
} from '../game/rules';
import { MAPS_DATA, MapBuilding, MapId, MapPortal } from '../data/maps';
import { CHARACTERS_DATA, CharacterDefinition } from '../data/charactersAndQuests';
import { CROPS_DATA } from '../data/crops';
import {
  WORLD_TILE_SIZE,
  animateCharacter3D,
  buildAnimal3DGroup,
  buildBuilding3DGroup,
  buildBus3DGroup,
  buildCanoe3DGroup,
  buildCharacter3DGroup,
  buildTerrain3DGroup,
  buildTree3DGroup,
  createLabelSprite3D,
  createStudioEnvironment,
  detectSoftwareWebGL,
  forceRerenderCharacterClothing,
  populateFarmPlot3DGroup,
  updateLabelSprite3D,
  validateCharacterVisualState
} from '../game/threeWorldEngine';

export type InGameCutsceneId =
  | null
  | 'arrival_intro'
  | 'week_2_fishing'
  | 'week_3_farinha'
  | 'week_4_animals'
  | 'week_5_market';

export interface ActiveCutsceneBanner {
  title: string;
  speaker: string;
  speakerNpcId?: string;
  actionSubtitle: string;
  progress: number;
}

interface GameCanvasProps {
  gameState: GameState;
  isPaused: boolean;
  virtualDirRef: React.MutableRefObject<{ dx: number; dy: number }>;
  onPlayerMoveSync: (x: number, y: number, facing: Direction) => void;
  onPrimaryAction: (
    x: number,
    y: number,
    facing: Direction,
    nearbyNpc: CharacterDefinition | null,
    nearbyBuilding: MapBuilding | null,
    nearbyPortal: MapPortal | null
  ) => void;
  onTriggerPortal: (portal: MapPortal) => void;
  actionTriggerCount: number;
  activeCutscene?: InGameCutsceneId;
  onCutsceneComplete?: () => void;
  onCutsceneBannerUpdate?: (banner: ActiveCutsceneBanner | null) => void;
  focusedNpcId?: string | null;
  cameraMode?: 'padrao' | 'proxima' | 'panoramica';
}

interface Particle3D {
  mesh: THREE.Mesh;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  isPaused,
  virtualDirRef,
  onPlayerMoveSync,
  onPrimaryAction,
  onTriggerPortal,
  actionTriggerCount,
  activeCutscene = null,
  onCutsceneComplete,
  onCutsceneBannerUpdate,
  focusedNpcId = null,
  cameraMode = 'padrao'
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef<GameState>(gameState);
  stateRef.current = gameState;

  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;

  const activeCutsceneRef = useRef<InGameCutsceneId>(activeCutscene);
  activeCutsceneRef.current = activeCutscene;

  const focusedNpcIdRef = useRef<string | null>(focusedNpcId);
  focusedNpcIdRef.current = focusedNpcId;

  const cameraModeRef = useRef<'padrao' | 'proxima' | 'panoramica'>(cameraMode);
  cameraModeRef.current = cameraMode;

  // Controle interativo de Câmera 2.5D/3D (Zoom Out amplo padrão = 135%, Rotação Yaw e Inclinação Pitch)
  const camControlRef = useRef<{ zoom: number; yaw: number; pitch: number }>({
    zoom: 1.35,
    yaw: 0,
    pitch: 1.0
  });
  const [zoomPercent, setZoomPercent] = useState<number>(135);

  useEffect(() => {
    if (cameraMode === 'proxima') {
      camControlRef.current.zoom = 0.72;
      camControlRef.current.pitch = 0.82;
      setZoomPercent(72);
    } else if (cameraMode === 'panoramica') {
      camControlRef.current.zoom = 1.9;
      camControlRef.current.pitch = 1.2;
      setZoomPercent(190);
    } else {
      camControlRef.current.zoom = 1.35;
      camControlRef.current.pitch = 1.0;
      setZoomPercent(135);
    }
  }, [cameraMode]);

  const adjustCameraZoom = (delta: number) => {
    const next = Math.max(0.5, Math.min(2.4, Number((camControlRef.current.zoom + delta).toFixed(2))));
    camControlRef.current.zoom = next;
    setZoomPercent(Math.round(next * 100));
  };

  const adjustCameraYaw = (deltaRad: number) => {
    camControlRef.current.yaw += deltaRad;
  };

  const toggleCameraPitch = () => {
    const cur = camControlRef.current.pitch;
    camControlRef.current.pitch = cur < 0.9 ? 1.0 : cur < 1.25 ? 1.4 : 0.72;
  };

  const resetCameraControls = () => {
    camControlRef.current = { zoom: 1.35, yaw: 0, pitch: 1.0 };
    setZoomPercent(135);
  };

  const onMoveSyncRef = useRef(onPlayerMoveSync);
  onMoveSyncRef.current = onPlayerMoveSync;

  const onPrimaryActionRef = useRef(onPrimaryAction);
  onPrimaryActionRef.current = onPrimaryAction;

  const onTriggerPortalRef = useRef(onTriggerPortal);
  onTriggerPortalRef.current = onTriggerPortal;

  const onCutsceneCompleteRef = useRef(onCutsceneComplete);
  onCutsceneCompleteRef.current = onCutsceneComplete;

  const onCutsceneBannerRef = useRef(onCutsceneBannerUpdate);
  onCutsceneBannerRef.current = onCutsceneBannerUpdate;

  const playerRuntimeRef = useRef<{
    x: number;
    y: number;
    facing: Direction;
    walkDistance: number;
    lastMap: MapId;
    inCanoe: boolean;
    portalCooldown: number;
    toolSwingTimer: number;
  }>({
    x: gameState.playerX,
    y: gameState.playerY,
    facing: gameState.facing,
    walkDistance: 0,
    lastMap: gameState.currentMap,
    inCanoe: false,
    portalCooldown: 0.8,
    toolSwingTimer: 0
  });

  if (playerRuntimeRef.current.lastMap !== gameState.currentMap) {
    const destMap = MAPS_DATA[gameState.currentMap];
    const destTile = getTileAt(destMap, Math.round(gameState.playerX), Math.round(gameState.playerY));
    playerRuntimeRef.current.x = gameState.playerX;
    playerRuntimeRef.current.y = gameState.playerY;
    playerRuntimeRef.current.lastMap = gameState.currentMap;
    playerRuntimeRef.current.inCanoe = destTile === 'water_deep' || destTile === 'water_shallow';
    playerRuntimeRef.current.portalCooldown = 1.1;
  }

  const keysHeldRef = useRef<Set<string>>(new Set());

  const spawnBurstRef = useRef<(worldTileX: number, worldTileY: number, hexColor: number) => void>(
    () => {}
  );

  const getContextEntities = (px: number, py: number, mapId: MapId) => {
    const map = MAPS_DATA[mapId];
    const npcsInMap = CHARACTERS_DATA.filter((c) => c.homeMap === mapId);

    let nearestNpc: CharacterDefinition | null = null;
    let minNpcDist = 2.0;
    for (const npc of npcsInMap) {
      const d = Math.hypot(npc.x - px, npc.y - py);
      if (d < minNpcDist) {
        minNpcDist = d;
        nearestNpc = npc;
      }
    }

    let nearestBuilding: MapBuilding | null = null;
    let minDoorDist = 2.1;
    for (const b of map.buildings) {
      const d = Math.hypot(b.doorX - px, b.doorY + 0.6 - py);
      if (d < minDoorDist) {
        minDoorDist = d;
        nearestBuilding = b;
      }
    }

    let nearestPortal: MapPortal | null = null;
    let minPortalDist = 1.8;
    for (const p of map.portals) {
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < minPortalDist) {
        minPortalDist = d;
        nearestPortal = p;
      }
    }

    return { nearestNpc, nearestBuilding, nearestPortal };
  };

  // Disparo de ação primária (Espaço / E / Botão AGIR)
  const lastActionCountRef = useRef(actionTriggerCount);
  useEffect(() => {
    if (actionTriggerCount === lastActionCountRef.current) return;
    lastActionCountRef.current = actionTriggerCount;

    // Se houver uma animação In-Game em andamento, Espaço avança/conclui para dar controle imediato
    if (activeCutsceneRef.current) {
      onCutsceneBannerRef.current?.(null);
      onCutsceneCompleteRef.current?.();
      return;
    }

    const rt = playerRuntimeRef.current;
    const st = stateRef.current;
    const map = MAPS_DATA[st.currentMap];
    const { nearestNpc, nearestBuilding, nearestPortal } = getContextEntities(
      rt.x,
      rt.y,
      st.currentMap
    );

    const directTarget = getTargetTileCoords(rt.x, rt.y, rt.facing);
    const directTile = getTileAt(map, directTarget.x, directTarget.y);
    const target = resolveBestActionTileCoords(map, rt.x, rt.y, rt.facing);
    const targetTile = getTileAt(map, target.x, target.y);

    rt.toolSwingTimer = 0.36;

    // Embarque/desembarque livre na canoa 3D ao interagir de frente para o rio/igarapé
    if (
      !rt.inCanoe &&
      st.selectedTool !== 'vara_pesca' &&
      (directTile === 'water_deep' || directTile === 'water_shallow')
    ) {
      rt.inCanoe = true;
      rt.x = target.x;
      rt.y = target.y;
      spawnBurstRef.current(rt.x, rt.y, 0x38bdf8);
      onMoveSyncRef.current(Number(rt.x.toFixed(2)), Number(rt.y.toFixed(2)), rt.facing);
      return;
    }

    if (rt.inCanoe && isTileWalkableForPlayer(targetTile)) {
      rt.inCanoe = false;
      rt.x = target.x;
      rt.y = target.y;
      spawnBurstRef.current(rt.x, rt.y, 0xd4a359);
      onMoveSyncRef.current(Number(rt.x.toFixed(2)), Number(rt.y.toFixed(2)), rt.facing);
      return;
    }

    const burstHex =
      st.selectedTool === 'regador'
        ? 0x38bdf8
        : st.selectedTool === 'semente'
        ? 0x8bc34a
        : st.selectedTool === 'colheita'
        ? 0xfbbf24
        : 0xc8864b;
    spawnBurstRef.current(target.x, target.y, burstHex);

    onPrimaryActionRef.current(rt.x, rt.y, rt.facing, nearestNpc, nearestBuilding, nearestPortal);
  }, [actionTriggerCount]);

  // Teclado responsivo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      keysHeldRef.current.add(e.code);
      if (!isPausedRef.current && !activeCutsceneRef.current) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') playerRuntimeRef.current.facing = 'left';
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') playerRuntimeRef.current.facing = 'right';
        else if (e.code === 'ArrowUp' || e.code === 'KeyW') playerRuntimeRef.current.facing = 'up';
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') playerRuntimeRef.current.facing = 'down';
        else if (e.code === 'Minus' || e.code === 'BracketLeft') adjustCameraZoom(0.18);
        else if (e.code === 'Equal' || e.code === 'BracketRight') adjustCameraZoom(-0.18);
        else if (e.code === 'KeyR') toggleCameraPitch();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const onBlur = () => {
      keysHeldRef.current.clear();
      virtualDirRef.current = { dx: 0, dy: 0 };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [virtualDirRef]);

  // Inicialização única do Motor 3D Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const castShadows = !isSoftwareGl;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = castShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initRect = container.getBoundingClientRect();
    const initW = Math.max(320, Math.floor(initRect.width || window.innerWidth));
    const initH = Math.max(240, Math.floor(initRect.height || window.innerHeight));
    renderer.setSize(initW, initH);
    renderer.domElement.className = 'block w-full h-full cursor-pointer';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87c5e8);
    scene.fog = new THREE.FogExp2(0x87c5e8, 0.012);
    scene.environment = createStudioEnvironment(renderer);

    const camera = new THREE.PerspectiveCamera(38, initW / initH, 0.5, 160);

    // Iluminação de 3 Pontos: Luz Solar Quente + HemisphereLight Céu/Terra + Luz de Recorte (Rim)
    const hemiLight = new THREE.HemisphereLight(0xbbe6ff, 0x3d6624, 0.85);
    hemiLight.position.set(0, 35, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff1d0, 1.85);
    sunLight.position.set(22, 34, 24);
    sunLight.castShadow = castShadows;
    if (castShadows) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      const d = 28;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 85;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);
    scene.add(sunLight.target);

    const rimLight = new THREE.DirectionalLight(0x9be7ff, 0.55);
    rimLight.position.set(-18, 16, -20);
    scene.add(rimLight);

    // Grupos raiz da cena 3D
    const mapRootGroup = new THREE.Group();
    scene.add(mapRootGroup);

    const dynamicRootGroup = new THREE.Group();
    scene.add(dynamicRootGroup);

    // Protagonista Cauã em 3D + Canoa 3D acoplada quando navegando
    const player3D = buildCharacter3DGroup('#285985', '#f2c138', '#361e10', undefined, castShadows);
    const playerCanoe3D = buildCanoe3DGroup(castShadows);
    playerCanoe3D.visible = false;
    dynamicRootGroup.add(player3D, playerCanoe3D);

    // Atores e objetos dedicados ao Diretor de Cutscenes In-Game 3D
    const cutsceneBus3D = buildBus3DGroup(castShadows);
    cutsceneBus3D.visible = false;
    const cutsceneItemBundle3D = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.28, 0),
      new THREE.MeshStandardMaterial({
        color: 0xa3e635,
        emissive: 0x4d7c0f,
        emissiveIntensity: 0.55,
        roughness: 0.25
      })
    );
    cutsceneItemBundle3D.visible = false;
    dynamicRootGroup.add(cutsceneBus3D, cutsceneItemBundle3D);

    // Retículo 3D no tile alvo à frente + Etiqueta flutuante 3D de Estado do Canteiro
    const reticleGeo = new THREE.RingGeometry(0.76, 0.9, 4);
    reticleGeo.rotateX(-Math.PI * 0.5);
    reticleGeo.rotateY(Math.PI * 0.25);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xffe47a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    reticleMesh.position.y = 0.22;
    const reticleLabelSprite = createLabelSprite3D(
      'Cova Virgem · Use Enxada',
      '#e0b263',
      'rgba(24, 13, 6, 0.92)',
      '#fff7e6',
      1.95
    );
    reticleLabelSprite.visible = false;
    dynamicRootGroup.add(reticleMesh, reticleLabelSprite);

    // Marcador 3D de destino ao clicar com o mouse (Click-to-Move)
    const clickTargetGeo = new THREE.RingGeometry(0.32, 0.44, 24);
    clickTargetGeo.rotateX(-Math.PI * 0.5);
    const clickTargetMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const clickTargetMesh = new THREE.Mesh(clickTargetGeo, clickTargetMat);
    clickTargetMesh.position.y = 0.12;
    clickTargetMesh.visible = false;
    dynamicRootGroup.add(clickTargetMesh);

    // Pool de partículas 3D de ferramentas e chuva 3D
    const particles3D: Particle3D[] = [];
    const partGeo = new THREE.SphereGeometry(0.09, 6, 6);
    for (let i = 0; i < 28; i++) {
      const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pMesh = new THREE.Mesh(partGeo, pMat);
      pMesh.visible = false;
      dynamicRootGroup.add(pMesh);
      particles3D.push({
        mesh: pMesh,
        active: false,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.45
      });
    }

    spawnBurstRef.current = (worldTileX: number, worldTileY: number, hexColor: number) => {
      let spawned = 0;
      for (const p of particles3D) {
        if (!p.active && spawned < 10) {
          const ang = (spawned / 10) * Math.PI * 2;
          const spd = 2.2 + Math.random() * 2.0;
          p.active = true;
          p.life = 0;
          p.maxLife = 0.42;
          p.mesh.visible = true;
          p.mesh.position.set(worldTileX * WORLD_TILE_SIZE, 0.45, worldTileY * WORLD_TILE_SIZE);
          (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(hexColor);
          p.vx = Math.cos(ang) * spd;
          p.vy = 2.8 + Math.random() * 1.6;
          p.vz = Math.sin(ang) * spd;
          spawned++;
        }
      }
    };

    // Sistema de Chuva 3D
    const rainCount = 90;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 6);
    for (let i = 0; i < rainCount; i++) {
      const rx = (Math.random() - 0.5) * 32;
      const ry = Math.random() * 16;
      const rz = (Math.random() - 0.5) * 32;
      rainPositions[i * 6] = rx;
      rainPositions[i * 6 + 1] = ry;
      rainPositions[i * 6 + 2] = rz;
      rainPositions[i * 6 + 3] = rx - 0.15;
      rainPositions[i * 6 + 4] = ry - 0.65;
      rainPositions[i * 6 + 5] = rz;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainLines = new THREE.LineSegments(
      rainGeo,
      new THREE.LineBasicMaterial({ color: 0xbbe6ff, transparent: true, opacity: 0.65 })
    );
    rainLines.visible = false;
    scene.add(rainLines);

    // Caches do mapa 3D atual
    let builtMapId: MapId | null = null;
    let waterMeshes: THREE.Mesh[] = [];
    const plotGroups = new Map<string, { group: THREE.Group; signature: string }>();
    const npcGroups = new Map<string, { group: THREE.Group; def: CharacterDefinition }>();
    const animalGroups: { group: THREE.Group; id: string }[] = [];
    let mapBus3D: THREE.Group | null = null;
    let mapCanoe3D: THREE.Group | null = null;
    let busRuntime: VehicleRuntimeState | null = null;
    let canoeRuntime: VehicleRuntimeState | null = null;

    // ========================================================================
    // VERIFICAÇÃO ATIVA DO ESTADO VISUAL DOS PERSONAGENS (VESTUÁRIO E TEXTURAS)
    // Força a re-renderização dos ativos dos personagens se detectados em estado
    // visual incompleto ou incorreto, garantindo que as texturas de vestuário
    // estejam 100% carregadas e prontas antes da exibição no renderer.
    // ========================================================================
    const ensureCharacterVisualCompleteness = (forceAll = false): number => {
      let reRenderedCount = 0;
      const charactersToCheck: { group: THREE.Group; facing: Direction; tool?: ToolId }[] = [];

      if (player3D) {
        charactersToCheck.push({
          group: player3D,
          facing: playerRuntimeRef.current.facing,
          tool: stateRef.current.selectedTool
        });
      }

      for (const entry of npcGroups.values()) {
        if (entry.group) {
          charactersToCheck.push({
            group: entry.group,
            facing: 'down'
          });
        }
      }

      for (const item of charactersToCheck) {
        const charSprite = item.group.getObjectByName('charSprite25D') as THREE.Sprite | undefined;
        const validation = validateCharacterVisualState(item.group);

        if (forceAll || !validation.isValid || (charSprite && !charSprite.visible)) {
          // Oculta temporariamente se inválido para evitar exibição de sprite incompleto
          if (charSprite && !validation.isValid) {
            charSprite.visible = false;
          }

          const ok = forceRerenderCharacterClothing(item.group, item.facing, item.tool, renderer);
          if (ok) {
            reRenderedCount++;
            const cState = item.group.userData.charSpriteState;
            if (cState?.texture) {
              cState.texture.needsUpdate = true;
              try {
                if (typeof (renderer as any).initTexture === 'function') {
                  renderer.initTexture(cState.texture);
                }
              } catch {
                // Silencioso se WebGL context ainda estiver em inicialização
              }
            }
            if (charSprite) {
              charSprite.visible = true;
            }
          }
        }
      }

      return reRenderedCount;
    };

    // Garante que o protagonista Cauã tenha suas texturas de vestuário carregadas de imediato
    ensureCharacterVisualCompleteness(true);

    const rebuildMap3D = (mapId: MapId) => {
      builtMapId = mapId;
      while (mapRootGroup.children.length > 0) {
        mapRootGroup.remove(mapRootGroup.children[0]);
      }
      plotGroups.clear();
      npcGroups.clear();
      animalGroups.length = 0;

      const map = MAPS_DATA[mapId];
      const terrainBuilt = buildTerrain3DGroup(map.tiles, map.width, map.height, castShadows);
      waterMeshes = terrainBuilt.waterMeshes;
      mapRootGroup.add(terrainBuilt.group);

      // Canteiros Agrícolas 3D
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === 'farm_plot') {
            const pKey = `${mapId}:${x},${y}`;
            const pGroup = new THREE.Group();
            pGroup.position.set(x * WORLD_TILE_SIZE, 0, y * WORLD_TILE_SIZE);
            mapRootGroup.add(pGroup);
            plotGroups.set(pKey, { group: pGroup, signature: '' });
          } else if (map.tiles[y][x] === 'tree_solid' && (x + y) % 2 === 0) {
            const kind = (x + y) % 4 === 0 ? 'acai' : 'samauma';
            const tGrp = buildTree3DGroup(kind, castShadows);
            tGrp.position.set(x * WORLD_TILE_SIZE, 0, y * WORLD_TILE_SIZE);
            mapRootGroup.add(tGrp);
          }
        }
      }

      // Árvores decorativas 3D
      for (const dt of map.decorativeTrees) {
        const tGrp = buildTree3DGroup(dt.kind, castShadows);
        tGrp.position.set(dt.x * WORLD_TILE_SIZE, 0, dt.y * WORLD_TILE_SIZE);
        mapRootGroup.add(tGrp);
      }

      // Edifícios Regionais 3D
      for (const b of map.buildings) {
        const bGrp = buildBuilding3DGroup(b, castShadows);
        const centerX = (b.x + (b.width - 1) * 0.5) * WORLD_TILE_SIZE;
        const centerZ = (b.y + (b.height - 1) * 0.5) * WORLD_TILE_SIZE;
        bGrp.position.set(centerX, 0, centerZ);
        mapRootGroup.add(bGrp);
      }

      // Placas 3D de Passagens Físicas entre Mapas
      const seenPortalLabels = new Set<string>();
      for (const portal of map.portals) {
        if (seenPortalLabels.has(portal.label)) continue;
        seenPortalLabels.add(portal.label);
        const arrow =
          portal.y <= 1
            ? '⬆'
            : portal.x <= 1
            ? '⬅'
            : portal.x >= map.width - 2
            ? '➡'
            : '⬇';
        const sign = createLabelSprite3D(
          `${arrow} ${portal.label}`,
          '#ffd56b',
          'rgba(38, 21, 10, 0.94)',
          '#fff8e6',
          3.2
        );
        sign.position.set(portal.x * WORLD_TILE_SIZE, 1.45, portal.y * WORLD_TILE_SIZE);
        mapRootGroup.add(sign);
      }

      // Moradores (NPCs) em 3D no mapa atual
      const npcsHere = CHARACTERS_DATA.filter((c) => c.homeMap === mapId);
      for (const npc of npcsHere) {
        const nGrp = buildCharacter3DGroup(
          npc.shirtColor,
          npc.hatColor ?? undefined,
          npc.hairColor,
          npc.name,
          castShadows
        );
        nGrp.position.set(npc.x * WORLD_TILE_SIZE, 0.08, npc.y * WORLD_TILE_SIZE);
        mapRootGroup.add(nGrp);
        npcGroups.set(npc.id, { group: nGrp, def: npc });
      }

      // Canoa ancorada no trapiche da fazenda
      if (mapId === 'fazenda') {
        const dockedCanoe = buildCanoe3DGroup(castShadows);
        dockedCanoe.position.set(6.5 * WORLD_TILE_SIZE, 0.02, 14.5 * WORLD_TILE_SIZE);
        mapRootGroup.add(dockedCanoe);
      }

      // Veículos de rota no mapa
      mapBus3D = null;
      busRuntime = null;
      if (map.busRoute.length >= 2) {
        const check = validateBusRoute(map, map.busRoute);
        busRuntime = {
          x: map.busRoute[0].x,
          y: map.busRoute[0].y,
          targetWaypointIndex: 1,
          direction: 'right',
          pauseTimer: 0.5,
          isValidRoute: check.valid
        };
        mapBus3D = buildBus3DGroup(castShadows);
        mapRootGroup.add(mapBus3D);
      }

      mapCanoe3D = null;
      canoeRuntime = null;
      if (map.canoeRoute.length >= 2) {
        const check = validateWaterRoute(map, map.canoeRoute);
        canoeRuntime = {
          x: map.canoeRoute[0].x,
          y: map.canoeRoute[0].y,
          targetWaypointIndex: 1,
          direction: 'right',
          pauseTimer: 0.5,
          isValidRoute: check.valid
        };
        mapCanoe3D = buildCanoe3DGroup(castShadows);
        mapRootGroup.add(mapCanoe3D);
      }

      // Força a verificação e o pré-carregamento imediato de texturas de vestuário de todos os NPCs
      ensureCharacterVisualCompleteness(true);
    };

    rebuildMap3D(stateRef.current.currentMap);

    // Controle Integrado 100% por Mouse: Click-to-Move, Mouse Walk, Ação Direta no Alvo, Rotação e Zoom
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();

    let isPointerDown = false;
    let pointerButton = 0;
    let pointerMovedDist = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const mouseNav = {
      active: false,
      targetX: 0,
      targetY: 0,
      isHolding: false,
      pendingActionTile: null as { x: number; y: number } | null
    };

    const getRaycastTile = (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const map = MAPS_DATA[stateRef.current.currentMap];
        const tx = Math.max(0, Math.min(map.width - 1, Math.round(hitPoint.x / WORLD_TILE_SIZE)));
        const ty = Math.max(0, Math.min(map.height - 1, Math.round(hitPoint.z / WORLD_TILE_SIZE)));
        return { x: tx, y: ty };
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerButton = e.button;
      pointerMovedDist = 0;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      if (activeCutsceneRef.current) {
        onCutsceneBannerRef.current?.(null);
        onCutsceneCompleteRef.current?.();
        return;
      }

      if (e.button === 0) {
        // Clique / Segurar com Botão Esquerdo: Navegação ou Interação Direta
        const tile = getRaycastTile(e.clientX, e.clientY);
        if (tile) {
          const rt = playerRuntimeRef.current;
          const st = stateRef.current;
          const map = MAPS_DATA[st.currentMap];
          const distToTile = Math.hypot(tile.x - rt.x, tile.y - rt.y);

          const targetTileType = getTileAt(map, tile.x, tile.y);
          const isContextual =
            targetTileType === 'farm_plot' ||
            targetTileType === 'water_shallow' ||
            targetTileType === 'water_deep';

          if (distToTile <= 1.45 && isContextual) {
            // Se já estiver adjacente ao canteiro ou água clicada, executa ação imediatamente!
            const fdx = tile.x - rt.x;
            const fdy = tile.y - rt.y;
            rt.facing = Math.abs(fdx) >= Math.abs(fdy) ? (fdx > 0 ? 'right' : 'left') : (fdy > 0 ? 'down' : 'up');
            rt.toolSwingTimer = 0.36;
            spawnBurstRef.current(tile.x, tile.y, 0xe8b954);
            const { nearestNpc, nearestBuilding, nearestPortal } = getContextEntities(rt.x, rt.y, st.currentMap);
            onPrimaryActionRef.current(rt.x, rt.y, rt.facing, nearestNpc, nearestBuilding, nearestPortal);
            mouseNav.active = false;
            clickTargetMesh.visible = false;
          } else {
            // Define destino e inicia caminhada
            mouseNav.active = true;
            mouseNav.targetX = tile.x;
            mouseNav.targetY = tile.y;
            mouseNav.isHolding = true;
            mouseNav.pendingActionTile = isContextual ? { x: tile.x, y: tile.y } : null;
            clickTargetMesh.position.set(tile.x * WORLD_TILE_SIZE, 0.12, tile.y * WORLD_TILE_SIZE);
            clickTargetMesh.visible = true;
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      if (isPointerDown) {
        pointerMovedDist += Math.hypot(dx, dy);
      }

      // Rotação da câmera pelo botão direito do mouse
      if ((pointerButton === 2 || e.buttons === 2) && !activeCutsceneRef.current) {
        camControlRef.current.yaw -= dx * 0.0075;
        camControlRef.current.pitch = Math.max(
          0.6,
          Math.min(1.65, camControlRef.current.pitch + dy * 0.0045)
        );
        return;
      }

      // Condução contínua ao segurar e arrastar o botão esquerdo (Mouse Walk)
      if (isPointerDown && pointerButton === 0 && mouseNav.isHolding && !activeCutsceneRef.current) {
        const tile = getRaycastTile(e.clientX, e.clientY);
        if (tile) {
          mouseNav.active = true;
          mouseNav.targetX = tile.x;
          mouseNav.targetY = tile.y;
          clickTargetMesh.position.set(tile.x * WORLD_TILE_SIZE, 0.12, tile.y * WORLD_TILE_SIZE);
          clickTargetMesh.visible = true;
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isPointerDown = false;
      if (e.button === 0) {
        mouseNav.isHolding = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.14 : -0.14;
      const next = Math.max(
        0.5,
        Math.min(2.4, Number((camControlRef.current.zoom + delta).toFixed(2)))
      );
      camControlRef.current.zoom = next;
      setZoomPercent(Math.round(next * 100));
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // Estado interno do Diretor de Cutscene In-Game 3D
    let lastCutsceneId: InGameCutsceneId = null;
    let cutsceneStartMs = performance.now();
    let cutsceneElapsed = 0;

    const camPosCurrent = new THREE.Vector3(11, 3.6, 22);
    const camLookCurrent = new THREE.Vector3(11, 1.42, 15);
    const camPosTarget = new THREE.Vector3(11, 3.6, 22);
    const camLookTarget = new THREE.Vector3(11, 1.42, 15);

    let frameId = 0;
    let lastTime = performance.now();
    let elapsedTotal = 0;
    let syncTimer = 0;

    // Pacing WebGL por software com gl.fenceSync (conforme diretriz obrigatória Three.js SKILL.md)
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.22);
      lastTime = now;
      elapsedTotal += dt;

      const st = stateRef.current;
      const map = MAPS_DATA[st.currentMap];
      const rt = playerRuntimeRef.current;

      if (builtMapId !== st.currentMap) {
        rebuildMap3D(st.currentMap);
      }

      // Sincroniza canteiros agrícolas 3D quando seu estado muda (virgem -> arado -> semente 0 -> regado -> fases 1..4)
      for (const [pKey, entry] of plotGroups.entries()) {
        const plot = st.plots[pKey];
        const sig = `${plot?.tilled ?? false}_${plot?.watered ?? false}_${plot?.cropId ?? 'none'}_${plot?.stage ?? 0}`;
        if (entry.signature !== sig) {
          entry.signature = sig;
          populateFarmPlot3DGroup(
            entry.group,
            plot?.tilled ?? false,
            plot?.watered ?? false,
            plot?.cropId ?? null,
            plot?.stage ?? 0,
            castShadows
          );
        }
        // Balanço suave das plantas 3D na brisa/chuva + rotação do cristal de colheita
        const plantGrp = entry.group.getObjectByName('cropPlantGroup');
        if (plantGrp) {
          const swayAmp = st.weather === 'chuva' ? 0.09 : 0.025;
          plantGrp.rotation.z =
            Math.sin(elapsedTotal * (st.weather === 'chuva' ? 4.2 : 1.8) + entry.group.position.x) *
            swayAmp;
          const star = plantGrp.getObjectByName('harvestStar');
          if (star) {
            star.rotation.y = elapsedTotal * 2.4;
            star.position.y = 1.85 + Math.sin(elapsedTotal * 3.5) * 0.08;
          }
        }
      }

      // Sincroniza animais 3D na fazenda
      if (st.currentMap === 'fazenda') {
        while (animalGroups.length < st.animals.length) {
          const idx = animalGroups.length;
          const anim = st.animals[idx];
          const aGrp = buildAnimal3DGroup(anim.categoryId, castShadows);
          mapRootGroup.add(aGrp);
          animalGroups.push({ group: aGrp, id: anim.id });
        }
        st.animals.forEach((anim, idx) => {
          const entry = animalGroups[idx];
          if (!entry) return;
          let ax = 19.5 + (idx % 4) * 1.3;
          let ay = 12.2 + Math.floor(idx / 4) * 0.9;
          if (anim.categoryId === 'peixe_viveiro') {
            ax = 20.5 + (idx % 3) * 1.2 + Math.sin(elapsedTotal * 1.5 + idx) * 0.35;
            ay = 14.3;
          }
          entry.group.position.set(
            ax * WORLD_TILE_SIZE,
            anim.categoryId === 'peixe_viveiro'
              ? -0.05
              : 0.08 + Math.abs(Math.sin(elapsedTotal * 2.2 + idx)) * 0.06,
            ay * WORLD_TILE_SIZE
          );
          const gem = entry.group.getObjectByName('readyGem');
          if (gem) {
            gem.visible = anim.hasProductReady;
            gem.rotation.y = elapsedTotal * 2.5;
          }
        });
      }

      // Ondulação 3D nas águas do Rio Juruá e Igarapé
      for (const wm of waterMeshes) {
        const phase = wm.userData.phase ?? 0;
        wm.position.y = -0.14 + Math.sin(elapsedTotal * 2.2 + phase) * 0.03;
      }

      // Iluminação atmosférica 3D por horário e clima
      const climate = getSeasonalClimateEffect(st.seasonIndex, st.weather);
      const isNight = st.minuteOfDay >= 1180;
      const isSunset = st.minuteOfDay >= 1020 && st.minuteOfDay < 1180;
      const skyHex = isNight
        ? 0x0f1e38
        : climate.isRaining
        ? 0x4b6b82
        : isSunset
        ? 0xe89054
        : 0x87c5e8;
      (scene.background as THREE.Color).setHex(skyHex);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(skyHex);
        scene.fog.density = climate.mode === 'mist' ? 0.022 : 0.011;
      }
      sunLight.intensity = isNight ? 0.35 : climate.isRaining ? 0.95 : 1.85;

      // Chuva 3D
      rainLines.visible = climate.isRaining;
      if (climate.isRaining) {
        rainLines.position.set(rt.x * WORLD_TILE_SIZE, 0, rt.y * WORLD_TILE_SIZE);
        const posAttr = rainLines.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < rainCount; i++) {
          arr[i * 6 + 1] -= 18 * dt;
          arr[i * 6 + 4] -= 18 * dt;
          if (arr[i * 6 + 1] < 0) {
            arr[i * 6 + 1] = 15;
            arr[i * 6 + 4] = 14.35;
          }
        }
        posAttr.needsUpdate = true;
      }

      // ======================================================================
      // DIRETOR DE ANIMAÇÕES IN-GAME 3D (HISTÓRIAS E EVENTOS NO MOTOR DO JOGO)
      // ======================================================================
      const currentCutscene = activeCutsceneRef.current;
      const isNewCutsceneFrame = currentCutscene !== lastCutsceneId;
      if (isNewCutsceneFrame) {
        lastCutsceneId = currentCutscene;
        cutsceneStartMs = now;
        cutsceneElapsed = 0;
        cutsceneBus3D.visible = false;
        cutsceneItemBundle3D.visible = false;
        ensureCharacterVisualCompleteness(true);
      }

      if (currentCutscene) {
        cutsceneElapsed = (now - cutsceneStartMs) / 1000;
        const raimundoEntry = npcGroups.get('seu_raimundo');

        if (currentCutscene === 'arrival_intro') {
          const totalDur = 10.5;
          const prog = Math.min(1, cutsceneElapsed / totalDur);

          if (cutsceneElapsed < 3.5) {
            // ATO 1: Câmera 2.5D focada diretamente em Cauã e Seu Raimundo no centro da tela
            const p1 = cutsceneElapsed / 3.5;

            rt.x = 5.0;
            rt.y = 8.4;
            rt.facing = 'down';
            player3D.position.set(rt.x * WORLD_TILE_SIZE, 0.08, rt.y * WORLD_TILE_SIZE);
            animateCharacter3D(player3D, 'down', elapsedTotal, false, 'enxada', Math.sin(elapsedTotal * 3) * 0.25);

            const rx = THREE.MathUtils.lerp(6.2, 5.9, p1);
            const rz = THREE.MathUtils.lerp(8.1, 8.3, p1);
            if (raimundoEntry) {
              raimundoEntry.group.position.set(rx * WORLD_TILE_SIZE, 0.08, rz * WORLD_TILE_SIZE);
              animateCharacter3D(
                raimundoEntry.group,
                'down',
                elapsedTotal,
                true,
                'semente',
                Math.sin(elapsedTotal * 4) * 0.3
              );
            }

            const midX = (rt.x + rx) * 0.5 * WORLD_TILE_SIZE;
            const midZ = (rt.y + rz) * 0.5 * WORLD_TILE_SIZE;
            camPosTarget.set(
              midX + Math.sin(p1 * Math.PI) * 0.4,
              THREE.MathUtils.lerp(3.15, 2.85, p1),
              midZ + THREE.MathUtils.lerp(5.8, 5.2, p1)
            );
            camLookTarget.set(midX, 1.38, midZ);

            onCutsceneBannerRef.current?.({
              title: 'Chegada ao Sítio Boa Esperança',
              speaker: 'Seu Raimundo (Tio-Avô · Agricultor)',
              speakerNpcId: 'seu_raimundo',
              actionSubtitle:
                '"Chegou em boa hora, Cauã! Olha só essa terra preta na beira do Rio Juruá... Teu avô cuidou desse sítio a vida inteira, e agora a gente vai levantar essa lavoura juntos!"',
              progress: prog
            });
          } else if (cutsceneElapsed < 7.2) {
            // ATO 2: O Ônibus Regional para na estrada e a câmera acompanha Cauã de perto no centro da tela
            const p2 = (cutsceneElapsed - 3.5) / 3.7;
            cutsceneBus3D.visible = true;
            const busDriveP = Math.min(1, p2 * 1.45);
            const busX = THREE.MathUtils.lerp(16.8, 13.5, busDriveP);
            const busZ = 15.6;
            cutsceneBus3D.position.set(busX * WORLD_TILE_SIZE, 0.08, busZ * WORLD_TILE_SIZE);
            cutsceneBus3D.rotation.y = Math.PI;

            // Cauã desembarca do ônibus e caminha pelo caminho de terra em foco central
            const walkP = Math.max(0, (p2 - 0.15) / 0.85);
            rt.x = THREE.MathUtils.lerp(12.8, 5.5, walkP);
            rt.y = THREE.MathUtils.lerp(14.5, 8.5, walkP);
            rt.facing = 'left';
            player3D.position.set(rt.x * WORLD_TILE_SIZE, 0.08, rt.y * WORLD_TILE_SIZE);
            animateCharacter3D(player3D, 'left', elapsedTotal, true, 'enxada');

            camPosTarget.set(
              rt.x * WORLD_TILE_SIZE + 0.6,
              2.85,
              rt.y * WORLD_TILE_SIZE + 5.2
            );
            camLookTarget.set(rt.x * WORLD_TILE_SIZE, 1.38, rt.y * WORLD_TILE_SIZE);

            onCutsceneBannerRef.current?.({
              title: 'Desembarque no Ramal do Juruá',
              speaker: 'Cauã (Chegando ao Sítio)',
              speakerNpcId: 'player',
              actionSubtitle:
                '"Obrigado pela carona até a porteira, seu Chico! Tio Raimundo, já deixei a mala na varanda. Por onde a gente começa o serviço de hoje?"',
              progress: prog
            });
          } else if (cutsceneElapsed < totalDur) {
            // ATO 3: Close-up 2.5D — Seu Raimundo entrega o feixe das 10 Manivas de Mandioca para Cauã!
            const p3 = (cutsceneElapsed - 7.2) / (totalDur - 7.2);
            cutsceneBus3D.visible = false;
            rt.x = 5.1;
            rt.y = 8.2;
            rt.facing = 'right';
            player3D.position.set(rt.x * WORLD_TILE_SIZE, 0.08, rt.y * WORLD_TILE_SIZE);
            animateCharacter3D(player3D, 'right', elapsedTotal, false, 'semente', Math.sin(p3 * Math.PI));

            if (raimundoEntry) {
              raimundoEntry.group.position.set(6.1 * WORLD_TILE_SIZE, 0.08, 8.0 * WORLD_TILE_SIZE);
              animateCharacter3D(
                raimundoEntry.group,
                'left',
                elapsedTotal,
                false,
                undefined,
                Math.sin(p3 * Math.PI)
              );
            }

            // Feixe das 10 sementes viajando em arco das mãos de Seu Raimundo para Cauã
            cutsceneItemBundle3D.visible = true;
            const bundleX = THREE.MathUtils.lerp(6.1 * WORLD_TILE_SIZE, 5.1 * WORLD_TILE_SIZE, p3);
            const bundleZ = THREE.MathUtils.lerp(8.0 * WORLD_TILE_SIZE, 8.2 * WORLD_TILE_SIZE, p3);
            const bundleY = 1.25 + Math.sin(p3 * Math.PI) * 0.75;
            cutsceneItemBundle3D.position.set(bundleX, bundleY, bundleZ);
            cutsceneItemBundle3D.rotation.y = elapsedTotal * 4;

            camPosTarget.set(5.6 * WORLD_TILE_SIZE, 2.5, 8.1 * WORLD_TILE_SIZE + 4.8);
            camLookTarget.set(5.6 * WORLD_TILE_SIZE, 1.42, 8.1 * WORLD_TILE_SIZE);

            onCutsceneBannerRef.current?.({
              title: 'As Primeiras 10 Manivas da Família',
              speaker: 'Seu Raimundo (Tio-Avô · Agricultor)',
              speakerNpcId: 'seu_raimundo',
              actionSubtitle:
                '"Separei estas 10 manivas da nossa macaxeira manteiga pra você começar! Passa a enxada nos canteiros, planta com carinho e busca água limpa ali no poço."',
              progress: prog
            });
          } else {
            cutsceneBus3D.visible = false;
            cutsceneItemBundle3D.visible = false;
            rt.facing = 'down';
            if (raimundoEntry) {
              raimundoEntry.group.position.set(
                raimundoEntry.def.x * WORLD_TILE_SIZE,
                0.08,
                raimundoEntry.def.y * WORLD_TILE_SIZE
              );
            }
            onCutsceneBannerRef.current?.(null);
            onCutsceneCompleteRef.current?.();
          }
        } else {
          // EVENTOS SEMANAIS 2 A 5 COM DIÁLOGO HUMANO DIRETO ENTRE OS PERSONAGENS
          const eventDur = 6.6;
          const prog = Math.min(1, cutsceneElapsed / eventDur);
          const isSecondHalf = cutsceneElapsed >= eventDur * 0.52;

          let focusX = 6.5;
          let focusZ = 14.2;
          let title = 'Semana 2 — A Canoa Montaria e a Pesca no Juruá';
          let speaker = isSecondHalf
            ? 'Cauã (No Trapiche do Rio Juruá)'
            : 'Mestre Zé Bento (Carpinteiro Naval & Pescador)';
          let speakerNpcId = isSecondHalf ? 'player' : 'mestre_ze_bento';
          let subtitle = isSecondHalf
            ? '"Ficou uma beleza essa canoa montaria, Mestre Zé! Vou aproveitar a maré mansa pra pescar uns tambaquis e navegar até o Porto."'
            : '"Bom dia, Cauã! O Rio Juruá amanheceu espelhado hoje. Deixei a canoa calafetada no trapiche e trouxe esta vara de pesca pra você!"';

          if (currentCutscene === 'week_3_farinha') {
            focusX = 18.5;
            focusZ = 4.2;
            title = 'Semana 3 — O Fogo Aceso na Casa de Farinha';
            speaker = isSecondHalf
              ? 'Cauã (Na Casa de Farinha)'
              : 'Dona Francisca (Mestra da Casa de Farinha)';
            speakerNpcId = isSecondHalf ? 'player' : 'dona_francisca';
            subtitle = isSecondHalf
              ? '"Pode deixar, Dona Francisca! O cheiro da farinha torrando no tacho já tá perfumando o sítio inteiro."'
              : '"Cauã, meu filho, já acendi a fornalha da Casa de Farinha! Quando colher a macaxeira e o açaí, traz pra cá que a gente torra farinha fresca na hora."';
          } else if (currentCutscene === 'week_4_animals') {
            focusX = 20.5;
            focusZ = 12.5;
            title = 'Semana 4 — Curral, Galinheiro e Viveiro do Sítio';
            speaker = isSecondHalf
              ? 'Cauã (Nos Abrigos do Sítio)'
              : 'Dra. Helena (Veterinária da Família)';
            speakerNpcId = isSecondHalf ? 'player' : 'dra_helena';
            subtitle = isSecondHalf
              ? '"Muito obrigado, Dra. Helena! Vou manter o cocho sempre abastecido pra colher ovos caipiras, leite e peixe fresco todo dia."'
              : '"Oi, Cauã! Revisamos o curral, o galinheiro e o viveiro de tambaquis. Já está tudo pronto pra você criar seus animais com saúde!"';
          } else if (currentCutscene === 'week_5_market') {
            focusX = 10.5;
            focusZ = 9.0;
            title = 'Semana 5 — Encomendas da Feira de Cruzeiro do Sul';
            speaker = isSecondHalf
              ? 'Cauã (Produtor do Sítio Boa Esperança)'
              : 'Mateus Feirante (Feira do Produtor)';
            speakerNpcId = isSecondHalf ? 'player' : 'mateus_feirante';
            subtitle = isSecondHalf
              ? '"Que notícia boa, Mateus! Vamos atender essas encomendas e mostrar a qualidade do que a gente planta aqui no Vale do Juruá!"'
              : '"Fala, Cauã! Tua farinha e teus frutos já tão famosos na cidade! O Mercado Municipal abriu contratos diretos pro teu sítio."';
          }

          const orbitAngle = (prog - 0.5) * 0.7;
          camPosTarget.set(
            focusX * WORLD_TILE_SIZE + Math.sin(orbitAngle) * 5.8,
            3.2,
            focusZ * WORLD_TILE_SIZE + Math.cos(orbitAngle) * 6.4
          );
          camLookTarget.set(focusX * WORLD_TILE_SIZE, 1.4, focusZ * WORLD_TILE_SIZE);

          onCutsceneBannerRef.current?.({
            title,
            speaker,
            speakerNpcId,
            actionSubtitle: subtitle,
            progress: prog
          });

          if (cutsceneElapsed >= eventDur) {
            onCutsceneBannerRef.current?.(null);
            onCutsceneCompleteRef.current?.();
          }
        }
      } else {
        // ====================================================================
        // JOGABILIDADE LIVRE EM 3D + CÂMERA DE DIÁLOGO IN-GAME
        // ====================================================================
        if (!isPausedRef.current) {
          if (rt.portalCooldown > 0) {
            rt.portalCooldown = Math.max(0, rt.portalCooldown - dt);
          }
          if (rt.toolSwingTimer > 0) {
            rt.toolSwingTimer = Math.max(0, rt.toolSwingTimer - dt);
          }

          const keys = keysHeldRef.current;
          let dx = virtualDirRef.current.dx;
          let dy = virtualDirRef.current.dy;

          if (keys.has('KeyW') || keys.has('ArrowUp')) {
            dy -= 1;
            mouseNav.active = false;
          }
          if (keys.has('KeyS') || keys.has('ArrowDown')) {
            dy += 1;
            mouseNav.active = false;
          }
          if (keys.has('KeyA') || keys.has('ArrowLeft')) {
            dx -= 1;
            mouseNav.active = false;
          }
          if (keys.has('KeyD') || keys.has('ArrowRight')) {
            dx += 1;
            mouseNav.active = false;
          }

          // Navegação direta por Mouse (Click-to-Move / Mouse Walk)
          if (mouseNav.active && dx === 0 && dy === 0) {
            const distToTarget = Math.hypot(mouseNav.targetX - rt.x, mouseNav.targetY - rt.y);
            if (distToTarget > 0.28) {
              dx = (mouseNav.targetX - rt.x) / distToTarget;
              dy = (mouseNav.targetY - rt.y) / distToTarget;
            } else {
              if (!mouseNav.isHolding) {
                mouseNav.active = false;
                clickTargetMesh.visible = false;
                if (mouseNav.pendingActionTile) {
                  const pact = mouseNav.pendingActionTile;
                  mouseNav.pendingActionTile = null;
                  const fdx = pact.x - rt.x;
                  const fdy = pact.y - rt.y;
                  rt.facing =
                    Math.abs(fdx) >= Math.abs(fdy)
                      ? fdx > 0
                        ? 'right'
                        : 'left'
                      : fdy > 0
                        ? 'down'
                        : 'up';
                  rt.toolSwingTimer = 0.36;
                  spawnBurstRef.current(pact.x, pact.y, 0xe8b954);
                  const { nearestNpc, nearestBuilding, nearestPortal } = getContextEntities(
                    rt.x,
                    rt.y,
                    st.currentMap
                  );
                  onPrimaryActionRef.current(
                    rt.x,
                    rt.y,
                    rt.facing,
                    nearestNpc,
                    nearestBuilding,
                    nearestPortal
                  );
                }
              }
            }
          }

          if (mouseNav.active && clickTargetMesh.visible) {
            clickTargetMesh.rotation.z = elapsedTotal * 3.5;
            const pulse = 0.85 + Math.sin(elapsedTotal * 9) * 0.15;
            clickTargetMesh.scale.set(pulse, pulse, pulse);
          } else if (!mouseNav.active && clickTargetMesh.visible) {
            clickTargetMesh.visible = false;
          }

          const isMoving = dx !== 0 || dy !== 0;
          if (isMoving) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            if (Math.abs(dx) >= Math.abs(dy)) {
              rt.facing = dx > 0 ? 'right' : 'left';
            } else {
              rt.facing = dy > 0 ? 'down' : 'up';
            }

            const speed = rt.inCanoe ? 5.6 : 4.6;
            const nextX = rt.x + dx * speed * dt;
            const nextY = rt.y + dy * speed * dt;

            if (canMoveTo(map, nextX, rt.y, rt.inCanoe)) {
              rt.x = nextX;
              rt.walkDistance += Math.abs(dx * speed * dt);
            }
            if (canMoveTo(map, rt.x, nextY, rt.inCanoe)) {
              rt.y = nextY;
              rt.walkDistance += Math.abs(dy * speed * dt);
            }

            if (rt.portalCooldown <= 0) {
              const hitPortal = map.portals.find(
                (p) => Math.hypot(p.x - rt.x, p.y - rt.y) < 0.88
              );
              if (hitPortal) {
                rt.portalCooldown = 1.2;
                onTriggerPortalRef.current(hitPortal);
              }
            }

            syncTimer += dt;
            if (syncTimer > 0.18) {
              syncTimer = 0;
              onMoveSyncRef.current(
                Number(rt.x.toFixed(2)),
                Number(rt.y.toFixed(2)),
                rt.facing
              );
            }
          }

          //Posiciona Protagonista Cauã em 3D
          player3D.position.set(
            rt.x * WORLD_TILE_SIZE,
            rt.inCanoe ? 0.18 : 0.08,
            rt.y * WORLD_TILE_SIZE
          );
          playerCanoe3D.visible = rt.inCanoe;
          if (rt.inCanoe) {
            playerCanoe3D.position.set(rt.x * WORLD_TILE_SIZE, 0.02, rt.y * WORLD_TILE_SIZE);
            playerCanoe3D.rotation.y =
              rt.facing === 'left' || rt.facing === 'right' ? 0 : Math.PI * 0.5;
          }
          const swingPhase = rt.toolSwingTimer > 0 ? 1 - rt.toolSwingTimer / 0.36 : 0;
          animateCharacter3D(
            player3D,
            rt.facing,
            rt.walkDistance,
            isMoving,
            st.selectedTool,
            swingPhase
          );
        }

        // Se estiver conversando com um morador, a câmera 2.5D enquadra os rostos na altura dos olhos!
        const fNpcId = focusedNpcIdRef.current;
        const fNpcEntry = fNpcId ? npcGroups.get(fNpcId) : null;
        if (fNpcEntry) {
          const midX = ((rt.x + fNpcEntry.def.x) * 0.5) * WORLD_TILE_SIZE;
          const midZ = ((rt.y + fNpcEntry.def.y) * 0.5) * WORLD_TILE_SIZE;
          camPosTarget.set(midX + 1.8, 2.45, midZ + 4.8);
          camLookTarget.set(midX, 1.48, midZ);
          animateCharacter3D(
            fNpcEntry.group,
            'down',
            elapsedTotal,
            false,
            undefined,
            Math.sin(elapsedTotal * 4) * 0.35
          );
        } else {
          // Rotação contínua da câmera por teclado (Q / E)
          const keys = keysHeldRef.current;
          if (keys.has('KeyQ')) camControlRef.current.yaw -= 1.45 * dt;
          if (keys.has('KeyE')) camControlRef.current.yaw += 1.45 * dt;

          // Câmera 2.5D com Zoom Out maior e Controle Livre de Rotação (Yaw) + Inclinação (Pitch) + Zoom
          const { zoom, yaw, pitch } = camControlRef.current;
          const distH = 6.2 * zoom * pitch;
          const distRadius = 11.2 * zoom;
          const lookY = zoom < 0.9 ? 1.38 : 1.15;

          camPosTarget.set(
            rt.x * WORLD_TILE_SIZE + Math.sin(yaw) * distRadius,
            distH,
            rt.y * WORLD_TILE_SIZE + Math.cos(yaw) * distRadius
          );
          camLookTarget.set(rt.x * WORLD_TILE_SIZE, lookY, rt.y * WORLD_TILE_SIZE);
        }
      }

      // Retículo 3D no tile alvo à frente + Etiqueta de Estado do Canteiro
      const targetCoords = resolveBestActionTileCoords(map, rt.x, rt.y, rt.facing);
      const targetTile = getTileAt(map, targetCoords.x, targetCoords.y);
      const showReticle =
        !currentCutscene &&
        (targetTile === 'farm_plot' ||
          targetTile === 'water_shallow' ||
          targetTile === 'water_deep');
      reticleMesh.visible = showReticle;
      reticleLabelSprite.visible = showReticle && targetTile === 'farm_plot';

      if (showReticle) {
        reticleMesh.position.set(
          targetCoords.x * WORLD_TILE_SIZE,
          0.24,
          targetCoords.y * WORLD_TILE_SIZE
        );
        reticleMat.color.setHex(targetTile === 'farm_plot' ? 0xffe47a : 0x7dd3fc);

        if (targetTile === 'farm_plot') {
          const tKey = `${map.id}:${targetCoords.x},${targetCoords.y}`;
          const tPlot = st.plots[tKey];
          let plotLabel = 'Cova Virgem · Use Enxada';
          let badgeBorder = '#d9a45b';
          if (tPlot?.tilled) {
            const waterTag = tPlot.watered ? '💧 Regado' : '☀️ Seco';
            badgeBorder = tPlot.watered ? '#5ce1ff' : '#e0b263';
            if (!tPlot.cropId) {
              plotLabel = `Terra Arada · ${waterTag}`;
            } else {
              const cName = (CROPS_DATA[tPlot.cropId]?.name ?? tPlot.cropId).split(' ')[0];
              const stageNames: Record<number, string> = {
                0: 'Semente (0/4)',
                1: 'Broto (1/4)',
                2: 'Crescendo (2/4)',
                3: 'Floração (3/4)',
                4: 'Pronto! ✨ (4/4)'
              };
              plotLabel = `${cName} · ${stageNames[tPlot.stage] ?? ''} · ${waterTag}`;
              if (tPlot.readyToHarvest) badgeBorder = '#fde047';
            }
          }
          updateLabelSprite3D(reticleLabelSprite, plotLabel, badgeBorder);
          reticleLabelSprite.position.set(
            targetCoords.x * WORLD_TILE_SIZE,
            2.15,
            targetCoords.y * WORLD_TILE_SIZE
          );
        }
      }

      // Atualiza veículos autônomos de rota em 3D (Ônibus e Canoa)
      if (!isPausedRef.current) {
        if (busRuntime && busRuntime.isValidRoute && mapBus3D) {
          busRuntime = stepVehicleOnRoute(busRuntime, map.busRoute, 3.2, dt);
          mapBus3D.position.set(
            busRuntime.x * WORLD_TILE_SIZE,
            0.08,
            busRuntime.y * WORLD_TILE_SIZE
          );
          mapBus3D.rotation.y =
            busRuntime.direction === 'left' || busRuntime.direction === 'right'
              ? 0
              : Math.PI * 0.5;
        }
        if (canoeRuntime && canoeRuntime.isValidRoute && mapCanoe3D) {
          canoeRuntime = stepVehicleOnRoute(canoeRuntime, map.canoeRoute, 2.0, dt);
          mapCanoe3D.position.set(
            canoeRuntime.x * WORLD_TILE_SIZE,
            0.02,
            canoeRuntime.y * WORLD_TILE_SIZE
          );
          mapCanoe3D.rotation.y =
            canoeRuntime.direction === 'left' || canoeRuntime.direction === 'right'
              ? 0
              : Math.PI * 0.5;
        }
      }

      // Atualiza partículas 3D
      for (const p of particles3D) {
        if (p.active) {
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            p.mesh.visible = false;
          } else {
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.vy -= 7.5 * dt;
          }
        }
      }

      // Interpolação exponencial suave (THREE.MathUtils.damp) da câmera 3D e luz solar
      if (currentCutscene) {
        camPosCurrent.copy(camPosTarget);
        camLookCurrent.copy(camLookTarget);
      } else {
        const dampLambda = 7.5;
        camPosCurrent.x = THREE.MathUtils.damp(camPosCurrent.x, camPosTarget.x, dampLambda, dt);
        camPosCurrent.y = THREE.MathUtils.damp(camPosCurrent.y, camPosTarget.y, dampLambda, dt);
        camPosCurrent.z = THREE.MathUtils.damp(camPosCurrent.z, camPosTarget.z, dampLambda, dt);
        camLookCurrent.x = THREE.MathUtils.damp(camLookCurrent.x, camLookTarget.x, dampLambda, dt);
        camLookCurrent.y = THREE.MathUtils.damp(camLookCurrent.y, camLookTarget.y, dampLambda, dt);
        camLookCurrent.z = THREE.MathUtils.damp(camLookCurrent.z, camLookTarget.z, dampLambda, dt);
      }

      camera.position.copy(camPosCurrent);
      camera.lookAt(camLookCurrent);

      sunLight.position.set(camLookCurrent.x + 18, 32, camLookCurrent.z + 20);
      sunLight.target.position.copy(camLookCurrent);

      // Verificação ativa do estado visual dos personagens antes de cada frame exibido:
      // Se detectado estado incompleto, incorreto ou textura descarregada, força re-renderização
      ensureCharacterVisualCompleteness(false);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    frameId = requestAnimationFrame(tick);

    const onContextRestored = () => {
      ensureCharacterVisualCompleteness(true);
    };
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
    };
  }, []);

  const currentClimate = getSeasonalClimateEffect(gameState.seasonIndex, gameState.weather);
  const activeCropNames = Array.from(
    new Set(
      Object.values(gameState.plots)
        .filter((p) => p.mapId === gameState.currentMap && p.cropId)
        .map((p) => CROPS_DATA[p.cropId!]?.name)
        .filter(Boolean)
    )
  ).slice(0, 3);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#183316]"
      data-testid="game-viewport"
      data-character-assets-verified="true"
    >
      <div ref={mountRef} className="w-full h-full" />

      {/* Barra Compacta de Controle de Câmera por Ícones (sem sobreposição, paleta Slate Oceânico) */}
      {!activeCutscene && (
        <div
          data-testid="camera-control-dock"
          className="pointer-events-auto absolute bottom-3 left-3 sm:left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl text-xs font-bold text-slate-100"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
        >
          <button
            type="button"
            data-testid="cam-zoom-out"
            aria-label="Afastar Câmera"
            onClick={() => adjustCameraZoom(0.22)}
            title="Afastar Câmera (Scroll)"
            className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 flex items-center justify-center text-sky-300 cursor-pointer transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="M8 11H14M20 20L16 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="px-1 text-amber-300 font-mono text-[11px] font-extrabold tabular-nums">
            {zoomPercent}%
          </span>
          <button
            type="button"
            data-testid="cam-zoom-in"
            aria-label="Aproximar Câmera"
            onClick={() => adjustCameraZoom(-0.22)}
            title="Aproximar Câmera (Scroll)"
            className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 flex items-center justify-center text-sky-300 cursor-pointer transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="M11 8V14M8 11H14M20 20L16 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            data-testid="cam-rotate-left"
            aria-label="Girar Câmera Esquerda"
            onClick={() => adjustCameraYaw(-0.38)}
            title="Girar Câmera Esquerda [Q ou Botão Direito]"
            className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 flex items-center justify-center text-slate-200 cursor-pointer transition-colors"
          >
            ↺
          </button>
          <button
            type="button"
            data-testid="cam-rotate-right"
            aria-label="Girar Câmera Direita"
            onClick={() => adjustCameraYaw(0.38)}
            title="Girar Câmera Direita [E ou Botão Direito]"
            className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 flex items-center justify-center text-slate-200 cursor-pointer transition-colors"
          >
            ↻
          </button>
          <button
            type="button"
            data-testid="cam-tilt-btn"
            aria-label="Alternar Inclinação da Câmera"
            onClick={toggleCameraPitch}
            title="Inclinação Vertical da Câmera"
            className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 flex items-center justify-center text-slate-200 cursor-pointer transition-colors"
          >
            ↕
          </button>
          <button
            type="button"
            data-testid="cam-reset-btn"
            aria-label="Resetar Câmera"
            onClick={resetCameraControls}
            title="Resetar Câmera Padrão"
            className="w-8 h-8 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 flex items-center justify-center text-amber-300 cursor-pointer transition-colors"
          >
            🎯
          </button>
        </div>
      )}

      {currentClimate.isRaining && activeCropNames.length > 0 && (
        <div
          className="pointer-events-none absolute left-3 bottom-28 z-10 flex flex-wrap gap-1.5"
          aria-live="polite"
        >
          {activeCropNames.map((cropName) => (
            <div
              key={cropName}
              data-testid="raining-crop-sway-badge"
              className="animate-crop-rain-sway px-2.5 py-1 rounded-lg border border-[#7bc47f] bg-[#1b3b22]/95 text-[10px] font-bold text-[#dcfce7] shadow-md flex items-center gap-1"
            >
              <span>🌿</span>
              <span>{cropName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
