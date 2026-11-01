/**
 * FASE 4, 5, 6, 8, 10 & 22: NÚCLEO DE REGRAS DESACOPLADAS DA INTERFACE
 * Testável com `node:test` sem dependência do DOM.
 */

import { CROPS_DATA, SEASONS_INFO, SeasonId } from '../data/crops';
import { ANIMAL_CATEGORIES, AnimalCategoryId } from '../data/animals';
import { FISH_SPECIES, PROCESSING_RECIPES } from '../data/fishingAndRecipes';
import { CHARACTERS_DATA, FESTIVALS_DATA, QUESTS_DATA } from '../data/charactersAndQuests';
import { MAPS_DATA, MapId, PlannedMapLayout, TileType, Waypoint } from '../data/maps';

export type { AnimalCategoryId } from '../data/animals';
export type { TileType } from '../data/maps';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type ToolId =
  | 'enxada'
  | 'regador'
  | 'semente'
  | 'colheita'
  | 'vara_pesca'
  | 'machado_limpeza';

export interface FarmPlotState {
  key: string; // `${mapId}:${x},${y}`
  mapId: MapId;
  x: number;
  y: number;
  tilled: boolean;
  watered: boolean;
  cropId: string | null;
  daysGrown: number;
  stage: 0 | 1 | 2 | 3 | 4; // 0=semente, 1=broto, 2=crescimento, 3=quase maduro, 4=pronto para colher
  readyToHarvest: boolean;
}

export interface OwnedAnimal {
  id: string;
  categoryId: AnimalCategoryId;
  customName: string;
  daysOld: number;
  isAdult: boolean;
  fedToday: boolean;
  health: number; // 0..100
  daysSinceLastProduct: number;
  hasProductReady: boolean;
}

export interface CommercialContract {
  id: string;
  clientName: string;
  itemId: string;
  itemName: string;
  quantityRequired: number;
  rewardMoney: number;
  bonusReputation: number;
  completed: boolean;
}

export interface TransactionRecord {
  id: string;
  day: number;
  year: number;
  type: 'compra' | 'venda' | 'contrato' | 'missao';
  description: string;
  amount: number;
}

export interface VehicleRuntimeState {
  x: number;
  y: number;
  targetWaypointIndex: number;
  direction: Direction;
  pauseTimer: number;
  isValidRoute: boolean;
}

export interface GameState {
  version: number;
  playerName: string;
  farmName: string;
  currentMap: MapId;
  playerX: number;
  playerY: number;
  facing: Direction;
  selectedTool: ToolId;
  toolOrder: ToolId[];
  selectedSeedId: string;
  selectedBait: 'minhoca' | 'fruto_mata' | 'isca_peixe';
  waterCanCharges: number;
  maxWaterCanCharges: number;

  // Tempo e Calendário (4 Anos de Campanha)
  year: 1 | 2 | 3 | 4;
  seasonIndex: 0 | 1 | 2 | 3;
  dayOfMonth: number; // 1..10 por estação (40 dias por ano)
  totalDaysPlayed: number;
  minuteOfDay: number; // 360 (06:00) .. 1320 (22:00)
  weather: 'sol' | 'nublado' | 'chuva';

  // Atributos e Economia
  energy: number;
  maxEnergy: number;
  money: number;
  totalMoneyEarned: number;
  reputation: number;

  // Inventário: itemId -> quantidade (sementes usam prefixo `seed_`)
  inventory: Record<string, number>;

  // Mundo Agrícola, Animais e Coleta
  plots: Record<string, FarmPlotState>;
  animals: OwnedAnimal[];
  forageCollectedToday: Record<string, number>;

  // Relacionamentos, Missões e Estatísticas Verificáveis
  relationships: Record<string, number>; // characterId -> 0..100
  talkedToday: Record<string, boolean>;
  completedQuests: string[];
  contracts: CommercialContract[];
  transactions: TransactionRecord[];

  stats: {
    soilTilledCount: number;
    cropsHarvestedCount: number;
    fishCaughtCount: number;
    foodProcessedCount: number;
    animalProductsCollectedCount: number;
    festivalsAttended: string[];
  };

  legacyChoice: null | 'escola_agroflorestal' | 'cooperativa_farinha_ig' | 'centro_manejo_jurua';
}

export const SEASON_ORDER: SeasonId[] = [
  'inverno_amazonico',
  'transicao_vazante',
  'verao_amazonico',
  'transicao_enchente'
];

export function isTileWalkableForPlayer(tile: TileType): boolean {
  return (
    tile === 'grass' ||
    tile === 'tall_grass' ||
    tile === 'dirt_path' ||
    tile === 'road_asphalt' ||
    tile === 'wood_floor' ||
    tile === 'bridge_road' ||
    tile === 'farm_plot' ||
    tile === 'sand_bank'
  );
}

export function isTileValidForBus(tile: TileType): boolean {
  return tile === 'road_asphalt' || tile === 'bridge_road';
}

export function isTileValidForCanoe(tile: TileType): boolean {
  return tile === 'water_deep';
}

export function getTileAt(map: PlannedMapLayout, x: number, y: number): TileType {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (iy < 0 || iy >= map.height || ix < 0 || ix >= map.width) {
    return 'tree_solid';
  }
  return map.tiles[iy][ix];
}

export function isTileNavigableByCanoeOrShore(tile: TileType): boolean {
  return (
    tile === 'water_deep' ||
    tile === 'water_shallow' ||
    tile === 'sand_bank' ||
    tile === 'wood_floor'
  );
}

export function canMoveTo(map: PlannedMapLayout, x: number, y: number, inCanoe = false): boolean {
  const margin = 0.26;
  const checkPoints = [
    { px: x - margin, py: y - margin },
    { px: x + margin, py: y - margin },
    { px: x - margin, py: y + margin },
    { px: x + margin, py: y + margin }
  ];
  for (const pt of checkPoints) {
    const tile = getTileAt(map, Math.round(pt.px), Math.round(pt.py));
    if (inCanoe) {
      if (!isTileNavigableByCanoeOrShore(tile)) {
        return false;
      }
    } else if (!isTileWalkableForPlayer(tile)) {
      return false;
    }
  }
  return true;
}

export function getTargetTileCoords(
  playerX: number,
  playerY: number,
  facing: Direction
): { x: number; y: number } {
  const baseX = Math.round(playerX);
  const baseY = Math.round(playerY);
  switch (facing) {
    case 'up':
      return { x: baseX, y: baseY - 1 };
    case 'down':
      return { x: baseX, y: baseY + 1 };
    case 'left':
      return { x: baseX - 1, y: baseY };
    case 'right':
      return { x: baseX + 1, y: baseY };
  }
}

export function resolveBestActionTileCoords(
  map: PlannedMapLayout,
  playerX: number,
  playerY: number,
  facing: Direction
): { x: number; y: number } {
  const direct = getTargetTileCoords(playerX, playerY, facing);
  const directTile = getTileAt(map, direct.x, direct.y);
  if (
    directTile === 'farm_plot' ||
    directTile === 'water_shallow' ||
    directTile === 'water_deep'
  ) {
    return direct;
  }

  const baseX = Math.round(playerX);
  const baseY = Math.round(playerY);
  if (getTileAt(map, baseX, baseY) === 'farm_plot') {
    return { x: baseX, y: baseY };
  }

  const candidates = [
    { x: baseX + 1, y: baseY },
    { x: baseX - 1, y: baseY },
    { x: baseX, y: baseY + 1 },
    { x: baseX, y: baseY - 1 }
  ];
  let bestPlot: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    if (getTileAt(map, c.x, c.y) === 'farm_plot') {
      const d = Math.hypot(c.x - playerX, c.y - playerY);
      if (d < bestDist) {
        bestDist = d;
        bestPlot = c;
      }
    }
  }
  return bestPlot ?? direct;
}


/**
 * FASE 8: VALIDAÇÃO DE CONECTIVIDADE DE ROTA DO ÔNIBUS
 * Garante que dois pontos consecutivos sejam ortogonais (sem diagonal pelo mato)
 * e que absolutamente todos os tiles ao longo do segmento sejam 'road_asphalt' ou 'bridge_road'.
 */
export function validateBusRoute(map: PlannedMapLayout, route: Waypoint[]): { valid: boolean; reason?: string } {
  if (route.length === 0) return { valid: true };
  if (route.length < 2) return { valid: false, reason: 'Rota precisa de pelo menos 2 pontos.' };

  for (let i = 0; i < route.length; i++) {
    const a = route[i];
    const b = route[(i + 1) % route.length];

    // Impede corte diagonal através do terreno
    if (a.x !== b.x && a.y !== b.y) {
      return {
        valid: false,
        reason: `Segmento diagonal inválido entre (${a.x},${a.y}) e (${b.x},${b.y}) no mapa ${map.id}`
      };
    }

    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);

    for (let s = 0; s <= steps; s++) {
      const tx = a.x + dx * s;
      const ty = a.y + dy * s;
      const tile = getTileAt(map, tx, ty);
      if (!isTileValidForBus(tile)) {
        return {
          valid: false,
          reason: `Tile inválido (${tile}) para ônibus em (${tx},${ty}) no mapa ${map.id}`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * FASE 8: VALIDAÇÃO DE ROTA FLUVIAL DE CANOAS
 * Garante que canoas circulem exclusivamente em 'water_deep'.
 */
export function validateWaterRoute(map: PlannedMapLayout, route: Waypoint[]): { valid: boolean; reason?: string } {
  if (route.length === 0) return { valid: true };
  if (route.length < 2) return { valid: false, reason: 'Rota fluvial precisa de pelo menos 2 pontos.' };

  for (let i = 0; i < route.length; i++) {
    const a = route[i];
    const b = route[(i + 1) % route.length];

    if (a.x !== b.x && a.y !== b.y) {
      return {
        valid: false,
        reason: `Segmento fluvial diagonal inválido entre (${a.x},${a.y}) e (${b.x},${b.y})`
      };
    }

    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);

    for (let s = 0; s <= steps; s++) {
      const tx = a.x + dx * s;
      const ty = a.y + dy * s;
      const tile = getTileAt(map, tx, ty);
      if (!isTileValidForCanoe(tile)) {
        return {
          valid: false,
          reason: `Tile não navegável (${tile}) para canoa em (${tx},${ty}) no mapa ${map.id}`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Avança um veículo (ônibus ou canoa) respeitando paradas e direção visual coerente.
 */
export function stepVehicleOnRoute(
  vehicle: VehicleRuntimeState,
  route: Waypoint[],
  speedTilesPerSec: number,
  dt: number
): VehicleRuntimeState {
  if (!vehicle.isValidRoute || route.length < 2) {
    return vehicle;
  }

  if (vehicle.pauseTimer > 0) {
    return {
      ...vehicle,
      pauseTimer: Math.max(0, vehicle.pauseTimer - dt)
    };
  }

  const target = route[vehicle.targetWaypointIndex];
  const dx = target.x - vehicle.x;
  const dy = target.y - vehicle.y;
  const dist = Math.hypot(dx, dy);

  let direction: Direction = vehicle.direction;
  if (Math.abs(dx) > Math.abs(dy)) {
    direction = dx >= 0 ? 'right' : 'left';
  } else if (Math.abs(dy) > 0.001) {
    direction = dy >= 0 ? 'down' : 'up';
  }

  const maxStep = speedTilesPerSec * dt;
  if (dist <= maxStep) {
    const nextIndex = (vehicle.targetWaypointIndex + 1) % route.length;
    return {
      x: target.x,
      y: target.y,
      targetWaypointIndex: nextIndex,
      direction,
      pauseTimer: target.stopPauseSeconds ?? 0,
      isValidRoute: true
    };
  }

  return {
    ...vehicle,
    x: vehicle.x + (dx / dist) * maxStep,
    y: vehicle.y + (dy / dist) * maxStep,
    direction
  };
}

export function createInitialGameState(): GameState {
  const initialPlots: Record<string, FarmPlotState> = {};

  // Canteiros iniciais do Sítio Boa Esperança deixados pelo Avô Raimundo:
  // Roçado esquerdo (x: 2..4, y: 7..10) e topo do roçado direito (x: 7..11, y: 7..8) já cultivados,
  // enquanto (8,9) e demais covas ficam livres para lavrar e plantar as 10 manivas da mochila.
  const preplantedCrops: {
    x: number;
    y: number;
    cropId: string | null;
    stage: 0 | 1 | 2 | 3 | 4;
    watered: boolean;
  }[] = [
    { x: 2, y: 7, cropId: null, stage: 0, watered: false },
    { x: 3, y: 7, cropId: null, stage: 0, watered: true },
    { x: 4, y: 7, cropId: 'mandioca', stage: 0, watered: false },
    { x: 2, y: 8, cropId: 'mandioca', stage: 0, watered: true },
    { x: 3, y: 8, cropId: 'mandioca', stage: 1, watered: true },
    { x: 4, y: 8, cropId: 'mandioca', stage: 2, watered: true },
    { x: 2, y: 9, cropId: 'milho', stage: 3, watered: true },
    { x: 3, y: 9, cropId: 'abacaxi', stage: 3, watered: false },
    { x: 4, y: 9, cropId: 'pimenta_de_cheiro', stage: 4, watered: true },
    { x: 2, y: 10, cropId: 'feijao', stage: 0, watered: true },
    { x: 3, y: 10, cropId: 'macaxeira', stage: 1, watered: false },
    { x: 4, y: 10, cropId: 'mandioca', stage: 4, watered: true }
  ];

  for (const sp of preplantedCrops) {
    const key = `fazenda:${sp.x},${sp.y}`;
    const cropDef = sp.cropId ? CROPS_DATA[sp.cropId] : null;
    const daysGrown =
      sp.cropId && cropDef
        ? sp.stage === 0
          ? 0
          : sp.stage === 4
            ? cropDef.growthDays
            : Math.max(1, Math.ceil((sp.stage / 4) * cropDef.growthDays) - 1)
        : 0;
    initialPlots[key] = {
      key,
      mapId: 'fazenda',
      x: sp.x,
      y: sp.y,
      tilled: true,
      watered: sp.watered,
      cropId: sp.cropId,
      daysGrown,
      stage: sp.stage,
      readyToHarvest: sp.stage === 4
    };
  }

  const initialRelationships: Record<string, number> = {};
  for (const c of CHARACTERS_DATA) {
    initialRelationships[c.id] = 20;
  }

  return {
    version: 1,
    playerName: 'Cauã',
    farmName: 'Sítio Boa Esperança do Juruá',
    currentMap: 'fazenda',
    playerX: 5.5,
    playerY: 7.5,
    facing: 'down',
    selectedTool: 'enxada',
    toolOrder: ['enxada', 'semente', 'regador', 'colheita', 'vara_pesca', 'machado_limpeza'],
    selectedSeedId: 'mandioca',
    selectedBait: 'fruto_mata',
    waterCanCharges: 12,
    maxWaterCanCharges: 12,

    year: 1,
    seasonIndex: 0,
    dayOfMonth: 1,
    totalDaysPlayed: 1,
    minuteOfDay: 400, // 06:40 da manhã
    weather: 'sol',

    energy: 100,
    maxEnergy: 100,
    money: 350,
    totalMoneyEarned: 350,
    reputation: 10,

    // Começa estritamente com 10 sementes iguais de Mandioca Mansa (outras sementes apenas nas lojas!)
    inventory: {
      seed_mandioca: 10,
      mandioca: 2
    },

    plots: initialPlots,
    animals: [
      {
        id: 'anim_1',
        categoryId: 'galinha',
        customName: 'Carijó',
        daysOld: 4,
        isAdult: true,
        fedToday: true,
        health: 100,
        daysSinceLastProduct: 1,
        hasProductReady: true
      },
      {
        id: 'anim_2',
        categoryId: 'pato',
        customName: 'Juruá',
        daysOld: 5,
        isAdult: true,
        fedToday: true,
        health: 95,
        daysSinceLastProduct: 2,
        hasProductReady: true
      },
      {
        id: 'anim_3',
        categoryId: 'vaca',
        customName: 'Estrela',
        daysOld: 7,
        isAdult: true,
        fedToday: true,
        health: 100,
        daysSinceLastProduct: 1,
        hasProductReady: true
      },
      {
        id: 'anim_4',
        categoryId: 'peixe_viveiro',
        customName: 'Cardume Tambaqui #1',
        daysOld: 4,
        isAdult: true,
        fedToday: true,
        health: 100,
        daysSinceLastProduct: 3,
        hasProductReady: true
      }
    ],
    forageCollectedToday: {},
    relationships: initialRelationships,
    talkedToday: {},
    completedQuests: [],
    contracts: [
      {
        id: 'cnt_farinha_1',
        clientName: 'Mercado Municipal de Cruzeiro do Sul',
        itemId: 'farinha_mandioca',
        itemName: 'Farinha de Mandioca de Cruzeiro do Sul (IG)',
        quantityRequired: 2,
        rewardMoney: 320,
        bonusReputation: 20,
        completed: false
      },
      {
        id: 'cnt_acai_2',
        clientName: 'Associação do Miritizal',
        itemId: 'polpa_acai',
        itemName: 'Vinho / Polpa Grossa de Açaí',
        quantityRequired: 2,
        rewardMoney: 360,
        bonusReputation: 25,
        completed: false
      },
      {
        id: 'cnt_peixe_3',
        clientName: 'Restaurante Ribeirinho da Feira',
        itemId: 'tambaqui',
        itemName: 'Tambaqui Nativo',
        quantityRequired: 1,
        rewardMoney: 180,
        bonusReputation: 15,
        completed: false
      }
    ],
    transactions: [
      {
        id: 'tx_init',
        day: 1,
        year: 1,
        type: 'missao',
        description: 'Fundo inicial da família para reconstruir o Sítio no Juruá',
        amount: 280
      }
    ],
    stats: {
      soilTilledCount: 0,
      cropsHarvestedCount: 0,
      fishCaughtCount: 0,
      foodProcessedCount: 0,
      animalProductsCollectedCount: 0,
      festivalsAttended: []
    },
    legacyChoice: null
  };
}

/**
 * FASE 5: ARAR SOLO, PLANTAR, REGAR E COLHER
 */
export function tillPlot(
  state: GameState,
  mapId: MapId,
  x: number,
  y: number
): { state: GameState; ok: boolean; message: string } {
  const map = MAPS_DATA[mapId];
  const tile = getTileAt(map, x, y);

  if (tile !== 'farm_plot') {
    return {
      state,
      ok: false,
      message: 'Você só pode preparar a terra dentro das áreas de roçado ou pomar!'
    };
  }

  if (state.energy < 4) {
    return {
      state,
      ok: false,
      message: 'Energia insuficiente! Consuma um alimento regional ou durma em casa.'
    };
  }

  const key = `${mapId}:${x},${y}`;
  const existing = state.plots[key];
  if (existing && existing.tilled) {
    return {
      state,
      ok: false,
      message: 'Esta cova já está capinada e pronta para o plantio.'
    };
  }

  const nextState: GameState = {
    ...state,
    energy: Math.max(0, state.energy - 4),
    minuteOfDay: Math.min(1380, state.minuteOfDay + 5),
    plots: {
      ...state.plots,
      [key]: {
        key,
        mapId,
        x,
        y,
        tilled: true,
        watered: state.weather === 'chuva',
        cropId: null,
        daysGrown: 0,
        stage: 0,
        readyToHarvest: false
      }
    },
    stats: {
      ...state.stats,
      soilTilledCount: state.stats.soilTilledCount + 1
    }
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    message: 'Cova aberta e adubada no roçado!'
  };
}

export function plantCrop(
  state: GameState,
  mapId: MapId,
  x: number,
  y: number,
  cropId: string
): { state: GameState; ok: boolean; message: string } {
  const crop = CROPS_DATA[cropId];
  if (!crop) {
    return { state, ok: false, message: 'Cultura desconhecida.' };
  }

  const map = MAPS_DATA[mapId];
  const tile = getTileAt(map, x, y);
  if (tile !== 'farm_plot') {
    return { state, ok: false, message: 'Plante apenas nas áreas demarcadas de roçado/pomar.' };
  }

  const seedKey = `seed_${cropId}`;
  const seedQty = state.inventory[seedKey] ?? 0;
  if (seedQty <= 0) {
    return {
      state,
      ok: false,
      message: `Você não possui ${crop.seedName}. Compre na Casa Agrícola Juruá!`
    };
  }

  const key = `${mapId}:${x},${y}`;
  const existing = state.plots[key];
  if (existing && existing.cropId) {
    return { state, ok: false, message: 'Já existe uma planta crescendo nesta cova.' };
  }

  const nextInventory = { ...state.inventory, [seedKey]: seedQty - 1 };
  if (nextInventory[seedKey] <= 0) delete nextInventory[seedKey];

  const wasTilled = existing?.tilled ?? false;
  const nextState: GameState = {
    ...state,
    energy: Math.max(0, state.energy - 3),
    minuteOfDay: Math.min(1380, state.minuteOfDay + 5),
    inventory: nextInventory,
    plots: {
      ...state.plots,
      [key]: {
        key,
        mapId,
        x,
        y,
        tilled: true,
        watered: existing?.watered || state.weather === 'chuva',
        cropId,
        daysGrown: 0,
        stage: 0,
        readyToHarvest: false
      }
    },
    stats: {
      ...state.stats,
      soilTilledCount: wasTilled ? state.stats.soilTilledCount : state.stats.soilTilledCount + 1
    }
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    message: `${crop.seedName} plantada com sucesso!`
  };
}

export function waterPlot(
  state: GameState,
  mapId: MapId,
  x: number,
  y: number
): { state: GameState; ok: boolean; message: string } {
  const key = `${mapId}:${x},${y}`;
  const plot = state.plots[key];
  if (!plot || !plot.tilled) {
    return { state, ok: false, message: 'Prepare a terra com a Enxada antes de regar.' };
  }

  if (state.waterCanCharges <= 0) {
    return { state, ok: false, message: 'Regador vazio! Encha no Poço ou na margem do rio.' };
  }

  if (plot.watered) {
    return { state, ok: false, message: 'Esta cova já está úmida hoje.' };
  }

  return {
    state: {
      ...state,
      energy: Math.max(0, state.energy - 2),
      waterCanCharges: state.waterCanCharges - 1,
      plots: {
        ...state.plots,
        [key]: {
          ...plot,
          watered: true
        }
      }
    },
    ok: true,
    message: 'Solo irrigado com água fresca!'
  };
}

export function harvestPlot(
  state: GameState,
  mapId: MapId,
  x: number,
  y: number
): { state: GameState; ok: boolean; message: string; harvestedItem?: string; quantity?: number } {
  const key = `${mapId}:${x},${y}`;
  const plot = state.plots[key];
  if (!plot || !plot.cropId || !plot.readyToHarvest) {
    return { state, ok: false, message: 'Ainda não há colheita madura nesta cova.' };
  }

  const crop = CROPS_DATA[plot.cropId];
  const qty = crop.harvestYieldMax;
  const currentQty = state.inventory[crop.id] ?? 0;

  const updatedPlot: FarmPlotState = crop.regrowsAfterHarvest
    ? {
        ...plot,
        daysGrown: Math.max(0, crop.growthDays - crop.regrowDays),
        stage: 2,
        readyToHarvest: false,
        watered: state.weather === 'chuva'
      }
    : {
        ...plot,
        cropId: null,
        daysGrown: 0,
        stage: 0,
        readyToHarvest: false,
        watered: false
      };

  const nextState: GameState = {
    ...state,
    energy: Math.max(0, state.energy - 3),
    minuteOfDay: Math.min(1380, state.minuteOfDay + 5),
    inventory: {
      ...state.inventory,
      [crop.id]: currentQty + qty
    },
    plots: {
      ...state.plots,
      [key]: updatedPlot
    },
    stats: {
      ...state.stats,
      cropsHarvestedCount: state.stats.cropsHarvestedCount + 1
    }
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    harvestedItem: crop.id,
    quantity: qty,
    message: `Colheu ${qty}x ${crop.name}!`
  };
}

/**
 * FASE 6 & 11: AVANÇO DO DIA, SONO, CRESCIMENTO DE CULTURAS E ANIMAIS
 */
export function advanceDayState(state: GameState): { state: GameState; summary: string[] } {
  const summary: string[] = [];

  let nextDay = state.dayOfMonth + 1;
  let nextSeasonIndex = state.seasonIndex;
  let nextYear = state.year;

  if (nextDay > 10) {
    nextDay = 1;
    nextSeasonIndex = ((state.seasonIndex + 1) % 4) as 0 | 1 | 2 | 3;
    if (nextSeasonIndex === 0) {
      nextYear = Math.min(4, state.year + 1) as 1 | 2 | 3 | 4;
      summary.push(`Novo Ano iniciado: Ano ${nextYear}!`);
    }
  }

  const seasonId = SEASON_ORDER[nextSeasonIndex];
  const seasonMeta = SEASONS_INFO[seasonId];

  // Determina o clima de forma determinística-controlada pela estação
  const weatherRoll = ((state.totalDaysPlayed * 37 + nextDay * 13) % 100) / 100;
  const nextWeather: 'sol' | 'nublado' | 'chuva' =
    weatherRoll < seasonMeta.rainChance
      ? 'chuva'
      : weatherRoll < seasonMeta.rainChance + 0.25
      ? 'nublado'
      : 'sol';

  // Atualiza plantações
  const nextPlots: Record<string, FarmPlotState> = {};
  let maturedCount = 0;

  for (const [key, plot] of Object.entries(state.plots)) {
    if (plot.cropId) {
      const crop = CROPS_DATA[plot.cropId];
      // Cresce se foi regada hoje OU se a cultura tem baixa necessidade de água
      const canGrow = plot.watered || crop.waterNeeds === 'baixa';
      const newDays = canGrow ? plot.daysGrown + 1 : plot.daysGrown;
      const ratio = Math.min(1, newDays / crop.growthDays);
      const stage = (ratio >= 1 ? 4 : Math.max(1, Math.floor(ratio * 4))) as 0 | 1 | 2 | 3 | 4;
      const ready = newDays >= crop.growthDays;
      if (ready && !plot.readyToHarvest) maturedCount++;

      nextPlots[key] = {
        ...plot,
        daysGrown: newDays,
        stage,
        readyToHarvest: ready,
        watered: nextWeather === 'chuva'
      };
    } else {
      nextPlots[key] = {
        ...plot,
        watered: nextWeather === 'chuva'
      };
    }
  }

  if (maturedCount > 0) {
    summary.push(`${maturedCount} plantação(ões) atingiram o ponto de colheita!`);
  }

  // Atualiza as 6 categorias de animais
  let animalProductsReady = 0;
  const nextAnimals = state.animals.map((anim) => {
    const def = ANIMAL_CATEGORIES[anim.categoryId];
    const nextAge = anim.daysOld + 1;
    const isAdult = nextAge >= def.daysToMature;
    const daysSince = anim.fedToday ? anim.daysSinceLastProduct + 1 : anim.daysSinceLastProduct;
    const hasProduct =
      anim.hasProductReady || (isAdult && anim.fedToday && daysSince >= def.productionIntervalDays);

    if (hasProduct) animalProductsReady++;

    return {
      ...anim,
      daysOld: nextAge,
      isAdult,
      fedToday: false,
      health: anim.fedToday ? Math.min(100, anim.health + 5) : Math.max(40, anim.health - 10),
      daysSinceLastProduct: daysSince,
      hasProductReady: hasProduct
    };
  });

  if (animalProductsReady > 0) {
    summary.push(`${animalProductsReady} animal(is)/viveiro(s) têm produtos prontos para coleta.`);
  }

  if (nextWeather === 'chuva') {
    summary.push('A chuva amazônica da manhã já irrigou todo o seu roçado!');
  }

  const nextState: GameState = {
    ...state,
    year: nextYear,
    seasonIndex: nextSeasonIndex,
    dayOfMonth: nextDay,
    totalDaysPlayed: state.totalDaysPlayed + 1,
    minuteOfDay: 390, // 06:30 da manhã
    weather: nextWeather,
    energy: state.maxEnergy,
    plots: nextPlots,
    animals: nextAnimals,
    forageCollectedToday: {},
    talkedToday: {}
  };

  return {
    state: evaluateQuests(nextState),
    summary
  };
}

/**
 * FASE 8 & 13: COMPRA, ALIMENTAÇÃO E COLETA DE ANIMAIS
 */
export function buyAnimal(
  state: GameState,
  categoryId: AnimalCategoryId,
  customName?: string
): { state: GameState; ok: boolean; message: string } {
  const def = ANIMAL_CATEGORIES[categoryId];
  const currentInCategory = state.animals.filter((a) => a.categoryId === categoryId).length;

  if (currentInCategory >= def.maxPerShelter) {
    return {
      state,
      ok: false,
      message: `Limite máximo de ${def.maxPerShelter} ${def.name} no abrigo atingido (sem superpopulação)!`
    };
  }

  if (state.money < def.buyPrice) {
    return {
      state,
      ok: false,
      message: `Dinheiro insuficiente. Necessário R$ ${def.buyPrice}.`
    };
  }

  const newAnimal: OwnedAnimal = {
    id: `anim_${Date.now()}_${state.animals.length + 1}`,
    categoryId,
    customName: customName?.trim() || `${def.singularName} #${currentInCategory + 1}`,
    daysOld: 1,
    isAdult: false,
    fedToday: true,
    health: 100,
    daysSinceLastProduct: 0,
    hasProductReady: false
  };

  return {
    state: {
      ...state,
      money: state.money - def.buyPrice,
      animals: [...state.animals, newAnimal],
      transactions: [
        {
          id: `tx_${Date.now()}`,
          day: state.totalDaysPlayed,
          year: state.year,
          type: 'compra',
          description: `Aquisição de ${def.singularName}`,
          amount: -def.buyPrice
        },
        ...state.transactions.slice(0, 29)
      ]
    },
    ok: true,
    message: `${newAnimal.customName} adquirido(a) para o ${def.shelterName}!`
  };
}

export function feedAndCollectAnimal(
  state: GameState,
  animalId: string
): { state: GameState; ok: boolean; message: string } {
  const idx = state.animals.findIndex((a) => a.id === animalId);
  if (idx === -1) return { state, ok: false, message: 'Animal não encontrado.' };

  const anim = state.animals[idx];
  const def = ANIMAL_CATEGORIES[anim.categoryId];

  let nextInventory = { ...state.inventory };
  let collectedCount = 0;
  let actionMessages: string[] = [];

  if (anim.hasProductReady && def.productId) {
    nextInventory[def.productId] = (nextInventory[def.productId] ?? 0) + 1;
    collectedCount = 1;
    actionMessages.push(`Coletou 1x ${def.productName}`);
  }

  if (!anim.fedToday) {
    // Usa milho se tiver no inventário, ou alimenta com pasto/ração básica
    if ((nextInventory.milho ?? 0) > 0) {
      nextInventory.milho -= 1;
      if (nextInventory.milho <= 0) delete nextInventory.milho;
    }
    actionMessages.push(`${anim.customName} foi alimentado(a)`);
  }

  if (actionMessages.length === 0) {
    return {
      state,
      ok: true,
      message: `${anim.customName} já está alimentado(a) e descansando com ${anim.health}% de saúde.`
    };
  }

  const updatedAnimal: OwnedAnimal = {
    ...anim,
    fedToday: true,
    health: Math.min(100, anim.health + 5),
    hasProductReady: false,
    daysSinceLastProduct: collectedCount > 0 ? 0 : anim.daysSinceLastProduct
  };

  const nextAnimals = [...state.animals];
  nextAnimals[idx] = updatedAnimal;

  const nextState: GameState = {
    ...state,
    inventory: nextInventory,
    animals: nextAnimals,
    stats: {
      ...state.stats,
      animalProductsCollectedCount: state.stats.animalProductsCollectedCount + collectedCount
    }
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    message: actionMessages.join(' · ') + '!'
  };
}

/**
 * FASE 15: CADEIA PRODUTIVA E PROCESSAMENTO DE ALIMENTOS
 */
export function processRecipe(
  state: GameState,
  recipeId: string
): { state: GameState; ok: boolean; message: string } {
  const recipe = PROCESSING_RECIPES[recipeId];
  if (!recipe) return { state, ok: false, message: 'Receita não encontrada.' };

  for (const inp of recipe.inputs) {
    const have = state.inventory[inp.itemId] ?? 0;
    if (have < inp.quantity) {
      return {
        state,
        ok: false,
        message: `Insumo insuficiente: precisa de ${inp.quantity}x ${inp.itemName} (você tem ${have}).`
      };
    }
  }

  const nextInventory = { ...state.inventory };
  for (const inp of recipe.inputs) {
    nextInventory[inp.itemId] -= inp.quantity;
    if (nextInventory[inp.itemId] <= 0) delete nextInventory[inp.itemId];
  }

  nextInventory[recipe.outputId] = (nextInventory[recipe.outputId] ?? 0) + recipe.outputQuantity;

  const nextState: GameState = {
    ...state,
    energy: Math.max(0, state.energy - 5),
    minuteOfDay: Math.min(1380, state.minuteOfDay + recipe.processingHours * 20),
    inventory: nextInventory,
    stats: {
      ...state.stats,
      foodProcessedCount: state.stats.foodProcessedCount + 1
    }
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    message: `Produziu ${recipe.outputQuantity}x ${recipe.name} na ${recipe.stationLabel}!`
  };
}

/**
 * FASE 14: PESCA AMAZÔNICA CONSIDERANDO LOCAL, ISCA, HORÁRIO E CLIMA
 */
export function catchFishAtSpot(
  state: GameState,
  spotLocation: 'rio_jurua' | 'igarape_floresta' | 'porto_trapiche'
): { state: GameState; ok: boolean; message: string; fishId?: string; sizeCm?: number } {
  if (state.energy < 6) {
    return { state, ok: false, message: 'Você está sem energia para lançar a linha. Coma algo ou descanse!' };
  }

  const timeBucket: 'manha' | 'tarde' | 'noite' =
    state.minuteOfDay < 720 ? 'manha' : state.minuteOfDay < 1080 ? 'tarde' : 'noite';

  const candidates = Object.values(FISH_SPECIES).filter((f) => f.locations.includes(spotLocation));
  // Prioriza peixes compatíveis com a isca e clima selecionados
  const weighted = candidates.sort((a, b) => {
    const scoreA =
      (a.preferredBait === state.selectedBait ? 2 : 0) +
      (a.preferredWeather.includes(state.weather) ? 1 : 0) +
      (a.preferredTime.includes(timeBucket) ? 1 : 0);
    const scoreB =
      (b.preferredBait === state.selectedBait ? 2 : 0) +
      (b.preferredWeather.includes(state.weather) ? 1 : 0) +
      (b.preferredTime.includes(timeBucket) ? 1 : 0);
    return scoreB - scoreA;
  });

  const index = (state.totalDaysPlayed + state.stats.fishCaughtCount) % weighted.length;
  const caught = weighted[index] ?? candidates[0];
  const sizeCm = Math.round((caught.minSizeCm + caught.maxSizeCm) / 2);

  const nextState: GameState = {
    ...state,
    energy: Math.max(0, state.energy - 6),
    minuteOfDay: Math.min(1380, state.minuteOfDay + 20),
    inventory: {
      ...state.inventory,
      [caught.id]: (state.inventory[caught.id] ?? 0) + 1
    },
    stats: {
      ...state.stats,
      fishCaughtCount: state.stats.fishCaughtCount + 1
    }
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    fishId: caught.id,
    sizeCm,
    message: `Fisgou um ${caught.name} (${sizeCm} cm) usando ${state.selectedBait.replace('_', ' ')}!`
  };
}

/**
 * FASE 16: ECONOMIA, COMPRA DE SEMENTES, VENDA DE PRODUTOS E CONTRATOS
 */
export function getItemSellPrice(itemId: string): { name: string; price: number; energy: number } {
  if (CROPS_DATA[itemId]) {
    const c = CROPS_DATA[itemId];
    return { name: c.name, price: c.sellPrice, energy: c.energyRestored };
  }
  if (PROCESSING_RECIPES[itemId]) {
    const r = PROCESSING_RECIPES[itemId];
    return { name: r.name, price: r.sellPrice, energy: r.energyRestored };
  }
  if (FISH_SPECIES[itemId]) {
    const f = FISH_SPECIES[itemId];
    return { name: f.name, price: f.basePrice, energy: f.energyRestored };
  }
  for (const anim of Object.values(ANIMAL_CATEGORIES)) {
    if (anim.productId === itemId) {
      return { name: anim.productName, price: anim.productSellPrice, energy: 40 };
    }
  }
  if (itemId.startsWith('seed_')) {
    const cropId = itemId.replace('seed_', '');
    const c = CROPS_DATA[cropId];
    if (c) return { name: c.seedName, price: Math.floor(c.seedPrice * 0.6), energy: 0 };
  }
  return { name: itemId, price: 25, energy: 20 };
}

export function isSeedAvailableInSeason(cropId: string, seasonIndex: 0 | 1 | 2 | 3): boolean {
  const crop = CROPS_DATA[cropId];
  if (!crop) return false;
  const seasonId = SEASON_ORDER[seasonIndex];
  return crop.preferredSeasons.includes(seasonId);
}

export function buySeed(
  state: GameState,
  cropId: string,
  quantity: number
): { state: GameState; ok: boolean; message: string } {
  const crop = CROPS_DATA[cropId];
  if (!crop || quantity <= 0) return { state, ok: false, message: 'Semente inválida.' };

  if (!isSeedAvailableInSeason(cropId, state.seasonIndex)) {
    const allowedNames = crop.preferredSeasons.map((s) => SEASONS_INFO[s].name).join(' ou ');
    return {
      state,
      ok: false,
      message: `${crop.seedName} só está disponível para compra na estação: ${allowedNames}.`
    };
  }

  const totalCost = crop.seedPrice * quantity;
  if (state.money < totalCost) {
    return { state, ok: false, message: `Saldo insuficiente (R$ ${totalCost} necessários).` };
  }

  const seedKey = `seed_${cropId}`;
  return {
    state: {
      ...state,
      money: state.money - totalCost,
      selectedSeedId: cropId,
      inventory: {
        ...state.inventory,
        [seedKey]: (state.inventory[seedKey] ?? 0) + quantity
      },
      transactions: [
        {
          id: `tx_${Date.now()}`,
          day: state.totalDaysPlayed,
          year: state.year,
          type: 'compra',
          description: `Compra de ${quantity}x ${crop.seedName}`,
          amount: -totalCost
        },
        ...state.transactions.slice(0, 29)
      ]
    },
    ok: true,
    message: `Comprou ${quantity}x ${crop.seedName} por R$ ${totalCost}!`
  };
}

export function sellItem(
  state: GameState,
  itemId: string,
  quantity: number
): { state: GameState; ok: boolean; message: string } {
  const have = state.inventory[itemId] ?? 0;
  if (have < quantity || quantity <= 0) {
    return { state, ok: false, message: 'Quantidade insuficiente no inventário.' };
  }

  const info = getItemSellPrice(itemId);
  // Bônus de Indicação Geográfica se concluiu a missão da Casa de Farinha
  const bonusMultiplier =
    state.completedQuests.includes('q2_casa_de_farinha') && itemId === 'farinha_mandioca' ? 1.15 : 1;
  const totalEarned = Math.round(info.price * quantity * bonusMultiplier);

  const nextInventory = { ...state.inventory, [itemId]: have - quantity };
  if (nextInventory[itemId] <= 0) delete nextInventory[itemId];

  const nextState: GameState = {
    ...state,
    money: state.money + totalEarned,
    totalMoneyEarned: state.totalMoneyEarned + totalEarned,
    inventory: nextInventory,
    transactions: [
      {
        id: `tx_${Date.now()}`,
        day: state.totalDaysPlayed,
        year: state.year,
        type: 'venda',
        description: `Venda de ${quantity}x ${info.name}`,
        amount: totalEarned
      },
      ...state.transactions.slice(0, 29)
    ]
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    message: `Vendeu ${quantity}x ${info.name} por R$ ${totalEarned}!`
  };
}

export function fulfillCommercialContract(
  state: GameState,
  contractId: string
): { state: GameState; ok: boolean; message: string } {
  const contract = state.contracts.find((c) => c.id === contractId);
  if (!contract || contract.completed) {
    return { state, ok: false, message: 'Contrato inválido ou já concluído.' };
  }

  const have = state.inventory[contract.itemId] ?? 0;
  if (have < contract.quantityRequired) {
    return {
      state,
      ok: false,
      message: `Faltam itens para o contrato: entregue ${contract.quantityRequired}x ${contract.itemName}.`
    };
  }

  const nextInventory = {
    ...state.inventory,
    [contract.itemId]: have - contract.quantityRequired
  };
  if (nextInventory[contract.itemId] <= 0) delete nextInventory[contract.itemId];

  const nextContracts = state.contracts.map((c) =>
    c.id === contractId ? { ...c, completed: true } : c
  );

  const nextState: GameState = {
    ...state,
    money: state.money + contract.rewardMoney,
    totalMoneyEarned: state.totalMoneyEarned + contract.rewardMoney,
    reputation: state.reputation + contract.bonusReputation,
    inventory: nextInventory,
    contracts: nextContracts,
    transactions: [
      {
        id: `tx_${Date.now()}`,
        day: state.totalDaysPlayed,
        year: state.year,
        type: 'contrato',
        description: `Contrato cumprido: ${contract.clientName}`,
        amount: contract.rewardMoney
      },
      ...state.transactions.slice(0, 29)
    ]
  };

  return {
    state: evaluateQuests(nextState),
    ok: true,
    message: `Contrato com ${contract.clientName} concluído! Recebeu R$ ${contract.rewardMoney}.`
  };
}

/**
 * FASE 17: AVALIAÇÃO AUTOMÁTICA DE MISSÕES VERIFICÁVEIS
 */
export function evaluateQuests(state: GameState): GameState {
  let updatedMoney = state.money;
  let updatedTotalEarned = state.totalMoneyEarned;
  let updatedReputation = state.reputation;
  const updatedCompleted = [...state.completedQuests];
  const updatedTransactions = [...state.transactions];

  for (const q of QUESTS_DATA) {
    if (updatedCompleted.includes(q.id)) continue;

    let met = false;
    switch (q.requirementType) {
      case 'till_soil':
        met = state.stats.soilTilledCount >= q.targetCount;
        break;
      case 'harvest_crop':
        met = state.stats.cropsHarvestedCount >= q.targetCount;
        break;
      case 'catch_fish':
        met = state.stats.fishCaughtCount >= q.targetCount;
        break;
      case 'process_food':
        met = state.stats.foodProcessedCount >= q.targetCount;
        break;
      case 'raise_animal':
        met = state.stats.animalProductsCollectedCount >= q.targetCount;
        break;
      case 'earn_money':
        met = updatedTotalEarned >= q.targetCount;
        break;
      default:
        break;
    }

    if (met) {
      updatedCompleted.push(q.id);
      updatedMoney += q.rewardMoney;
      updatedTotalEarned += q.rewardMoney;
      updatedReputation += q.rewardReputation;
      updatedTransactions.unshift({
        id: `tx_q_${q.id}`,
        day: state.totalDaysPlayed,
        year: state.year,
        type: 'missao',
        description: `Recompensa de Missão: ${q.title}`,
        amount: q.rewardMoney
      });
    }
  }

  if (updatedCompleted.length === state.completedQuests.length) {
    return state;
  }

  return {
    ...state,
    money: updatedMoney,
    totalMoneyEarned: updatedTotalEarned,
    reputation: updatedReputation,
    completedQuests: updatedCompleted,
    transactions: updatedTransactions.slice(0, 30)
  };
}

/**
 * FASE 22: VALIDAÇÃO ESTRUTURAL DE SALVAMENTO PERSISTENTE
 */
export const DEFAULT_TOOL_ORDER: ToolId[] = [
  'enxada',
  'semente',
  'regador',
  'colheita',
  'vara_pesca',
  'machado_limpeza'
];

export function validateSaveData(raw: unknown): { valid: boolean; state?: GameState; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Arquivo de salvamento vazio ou malformado.' };
  }
  const candidate = raw as Partial<GameState>;
  if (typeof candidate.version !== 'number' || candidate.version !== 1) {
    return { valid: false, error: 'Versão de salvamento incompatível.' };
  }
  if (!candidate.currentMap || !MAPS_DATA[candidate.currentMap]) {
    return { valid: false, error: 'Mapa salvo inválido.' };
  }
  if (typeof candidate.money !== 'number' || candidate.money < 0) {
    return { valid: false, error: 'Dados financeiros corrompidos.' };
  }
  if (!candidate.inventory || typeof candidate.inventory !== 'object') {
    return { valid: false, error: 'Inventário ausente no salvamento.' };
  }
  const normalizedOrder =
    Array.isArray(candidate.toolOrder) && candidate.toolOrder.length > 0
      ? candidate.toolOrder
      : [...DEFAULT_TOOL_ORDER];
  return {
    valid: true,
    state: {
      ...(candidate as GameState),
      toolOrder: normalizedOrder
    }
  };
}

/**
 * Reordena a lista de ferramentas ativas (subir, descer, mover para o topo ou resetar ordem padrão)
 */
export function reorderActiveTools(
  currentOrder: ToolId[],
  toolId: ToolId,
  action: 'move_up' | 'move_down' | 'move_top' | 'move_bottom' | 'reset'
): ToolId[] {
  if (action === 'reset') {
    return [...DEFAULT_TOOL_ORDER];
  }
  const order = Array.isArray(currentOrder) && currentOrder.length > 0
    ? [...currentOrder]
    : [...DEFAULT_TOOL_ORDER];

  // Garante que todas as ferramentas existam
  for (const t of DEFAULT_TOOL_ORDER) {
    if (!order.includes(t)) {
      order.push(t);
    }
  }

  const idx = order.indexOf(toolId);
  if (idx === -1) return order;

  if (action === 'move_up' && idx > 0) {
    const temp = order[idx - 1];
    order[idx - 1] = order[idx];
    order[idx] = temp;
  } else if (action === 'move_down' && idx < order.length - 1) {
    const temp = order[idx + 1];
    order[idx + 1] = order[idx];
    order[idx] = temp;
  } else if (action === 'move_top' && idx > 0) {
    order.splice(idx, 1);
    order.unshift(toolId);
  } else if (action === 'move_bottom' && idx < order.length - 1) {
    order.splice(idx, 1);
    order.push(toolId);
  }

  return order;
}

export interface FirstPersonDialogueOption {
  id: 'work_advice' | 'valley_stories' | 'help_community';
  playerFirstPersonText: string;
  npcFollowUpText: string;
  playerClosingThought: string;
  relationshipBonus: number;
  energyBonus: number;
}

/**
 * Gera opções de resposta humana e natural para Cauã conversar com cada
 * morador do Vale do Juruá, retornando diálogos orgânicos e autênticos.
 */
export function getFirstPersonDialogueChoices(
  npcId: string,
  npcName: string,
  npcRole: string,
  year: 1 | 2 | 3 | 4
): FirstPersonDialogueOption[] {
  const parts = npcName.trim().split(/\s+/);
  const honorifics = new Set(['Seu', 'Dona', 'Mestre', 'Dra.', 'Dr.', 'Padre', 'Vovó', 'Vovô']);
  const firstName =
    parts.length > 1 && honorifics.has(parts[0]) ? `${parts[0]} ${parts[1]}` : parts[0];

  if (npcId === 'seu_raimundo') {
    return [
      {
        id: 'work_advice',
        playerFirstPersonText: `Seu Raimundo, como o senhor sabe a hora exata de puxar o rodo no tacho sem deixar a farinha queimar no fundo?`,
        npcFollowUpText: `O segredo está no ouvido e no pulso, Cauã! Quando a massa de mandioca para de chiar grosso e começa a estalar miudinho, soltando aquele perfume doce de torra, você puxa o rodo rápido das bordas pro centro. Assim cada grão fica crocante e douradinho!`,
        playerClosingThought: `Dá gosto ver o Seu Raimundo trabalhando no forno; na próxima fornada já sei escutar o ponto certo da massa.`,
        relationshipBonus: 6,
        energyBonus: 5
      },
      {
        id: 'valley_stories',
        playerFirstPersonText: `O cheiro de lenha acesa aqui na Casa de Farinha me lembra na hora o tempo em que meu avô mexia esse tacho com o senhor.`,
        npcFollowUpText: `Rapaz, seu avô tinha um braço de ferro pra mexer farinha! A gente começava de madrugada, tomando café coado na brasa, e quando o sol nascia no Juruá já tinha dez sacas quentinhas esperando no trapiche. Ele ia ter um orgulho danado de ver você tocando o sítio!`,
        playerClosingThought: `Saber que essa Casa de Farinha guarda tanta história da nossa família dá ainda mais ânimo pra cuidar da roça.`,
        relationshipBonus: 8,
        energyBonus: 4
      },
      {
        id: 'help_community',
        playerFirstPersonText: `Colhi umas raízes de macaxeira bem graúdas hoje cedo. Quer que eu já deixe descascadas na gamela pra adiantar a prensa?`,
        npcFollowUpText: `Ô, meu filho, aí você me tira metade do peso das costas! Deixe ali perto do tipiti que já botei lenha seca na fornalha. Hoje nossa farinhada vai render dobrado!`,
        playerClosingThought: `Trabalhando lado a lado com o Seu Raimundo o serviço rende que é uma beleza.`,
        relationshipBonus: 7,
        energyBonus: 6
      }
    ];
  }

  if (npcId === 'dona_francisca') {
    return [
      {
        id: 'work_advice',
        playerFirstPersonText: `Dona Francisca, o barro lá perto da curva do rio está bem úmido hoje. O que a senhora acha melhor plantar nessa lua?`,
        npcFollowUpText: `Se é pra criar raiz grossa debaixo da terra, como mandioca e cará roxo, plante na minguante sem medo, Cauã! Mas se quiser ver o milho crioulo, o feijão-de-praia e o açaí espigarem depressa buscando o sol, plante agora na crescente e regue cedinho!`,
        playerClosingThought: `Dona Francisca conhece o tempo da terra como ninguém; vou aproveitar essa lua pra reforçar os canteiros.`,
        relationshipBonus: 6,
        energyBonus: 8
      },
      {
        id: 'valley_stories',
        playerFirstPersonText: `Aqueles pés de cupuaçu antigos lá no fundo do sítio ainda dão fruta todo ano. Foi a senhora que plantou com a minha avó?`,
        npcFollowUpText: `Fomos nós duas mesmas, ainda mocinhas! Trouxemos as mudas numa canoa pequenininha subindo o Juruá depois de uma cheia grande. Cada árvore daquele quintal tem história e suor de quem amou muito esse pedaço de chão.`,
        playerClosingThought: `Cada árvore desse sítio tem memória viva; cuidar delas é manter nossa família por perto.`,
        relationshipBonus: 8,
        energyBonus: 5
      },
      {
        id: 'help_community',
        playerFirstPersonText: `Se a senhora precisar de lenha picada ou de água fresca lá do poço pra regar sua horta de cheiro-verde, é só me chamar!`,
        npcFollowUpText: `Deus te abençoe pela presteza, menino! Sente um pouquinho aí na varanda e tome essa tigela de açaí fresco com farinha torrada pra recarregar a força do braço.`,
        playerClosingThought: `O açaí da Dona Francisca levanta qualquer cansaço depois da lida no sol.`,
        relationshipBonus: 7,
        energyBonus: 10
      }
    ];
  }

  if (npcId === 'mestre_ze_bento') {
    return [
      {
        id: 'work_advice',
        playerFirstPersonText: `Mestre Zé, a água do rio deu uma clareada boa hoje perto do barranco. Onde é que os tambaquis estão batendo?`,
        npcFollowUpText: `Repare onde as frutinhas de jauari e buriti caem na água ali na sombra do remanso, Cauã! O tambaqui fica rondando quietinho esperando o baque da fruta. Jogue o anzol ali sem fazer barulho no casco da canoa que a fisgada é certa!`,
        playerClosingThought: `Boa dica do Mestre Zé Bento! Vou testar a vara de pesca naquele remanso fundo perto das árvores.`,
        relationshipBonus: 6,
        energyBonus: 5
      },
      {
        id: 'valley_stories',
        playerFirstPersonText: `A canoa lá do trapiche do sítio corta a correnteza do Juruá macia demais, Mestre Zé. O senhor lembra quando lavrou aquele casco?`,
        npcFollowUpText: `Como se fosse ontem, rapaz! Escolhi uma itaúba caída na mata com seu avô, cavamos no enxó e demos o ponto no fogo pra abrir a boca da montaria. Enquanto você passar óleo e cuidar das cavernas dela, você atravessa qualquer banzeiro em segurança!`,
        playerClosingThought: `Nossa canoa ribeirinha é uma obra de arte naval; atravessar o rio nela é sempre um prazer.`,
        relationshipBonus: 8,
        energyBonus: 4
      },
      {
        id: 'help_community',
        playerFirstPersonText: `Quando for puxar barco pesado aqui na rampa do estaleiro ou revisar as boias do acordo de pesca, pode contar comigo!`,
        npcFollowUpText: `Aí falou bonito, parceiro! Quando a comunidade cuida do lago e respeita o defeso, o rio devolve peixe graúdo o ano inteiro pra todo mundo.`,
        playerClosingThought: `Ajudar os pescadores do Porto mantém o rio vivo e fortalece toda a nossa beirada.`,
        relationshipBonus: 7,
        energyBonus: 6
      }
    ];
  }

  if (npcId === 'iara_botanica') {
    return [
      {
        id: 'work_advice',
        playerFirstPersonText: `Iara, notei que as folhas da mandioca e do guaraná ficam muito mais brilhantes perto da sombra das árvores. É por causa do solo?`,
        npcFollowUpText: `Exatamente, Cauã! Na agrofloresta amazônica as folhas que caem formam uma camada rica em húmus que segura a umidade mesmo no verão seco. Consorciar macaxeira, açaí e cupuaçu deixa a terra fértil o ano todo!`,
        playerClosingThought: `Combinar os cultivos regionais com o cuidado da terra faz toda a diferença na qualidade da colheita.`,
        relationshipBonus: 7,
        energyBonus: 6
      },
      {
        id: 'valley_stories',
        playerFirstPersonText: `Como vão as pesquisas com as sementes crioulas lá na Reserva do Rio Crôa? Encontrou alguma variedade rara essa semana?`,
        npcFollowUpText: `Encontrei um guaranazeiro nativo carregado de cachos vermelhos abertos na trilha das samaúmas! Estou catalogando as matrizes com os moradores antigos para garantir que essas variedades tradicionais do Juruá nunca se percam.`,
        playerClosingThought: `O trabalho da Iara catalogando a flora nativa inspira a cuidar ainda melhor das sementes do sítio.`,
        relationshipBonus: 8,
        energyBonus: 5
      },
      {
        id: 'help_community',
        playerFirstPersonText: `Separei um canteiro especial lá no Sítio Boa Esperança se você quiser testar o plantio dessas mudas nativas.`,
        npcFollowUpText: `Sério, Cauã?! Ter uma parcela agroflorestal num sítio tradicional como o seu vai ajudar demais nosso banco de sementes comunitário!`,
        playerClosingThought: `Transformar o sítio num exemplo de cultivo sustentável vai ser incrível para toda a região.`,
        relationshipBonus: 8,
        energyBonus: 6
      }
    ];
  }

  return [
    {
      id: 'work_advice',
      playerFirstPersonText: `Bom te encontrar, ${firstName}! Como estão as coisas no trabalho de ${npcRole.toLowerCase()} hoje? Algum conselho pra quem está tocando o sítio?`,
      npcFollowUpText: `A lida está animada, Cauã! Neste Ano ${year} aqui em Cruzeiro do Sul, o segredo é observar bem o clima da estação, manter as covas sempre úmidas e trazer farinha torrada e frutas frescas pra praça. O pessoal já elogia muito a colheita do seu roçado!`,
      playerClosingThought: `Conversar com quem conhece o dia a dia de Cruzeiro do Sul sempre traz boas ideias pro sítio.`,
      relationshipBonus: 6,
      energyBonus: 5
    },
    {
      id: 'valley_stories',
      playerFirstPersonText: `Gosto demais dessa correria boa da nossa terra, ${firstName}. Qual é a lembrança mais marcante que você guarda daqui do Juruá?`,
      npcFollowUpText: `Ah, Cauã, quem bebe da água do Juruá nunca esquece! Desde as manhãs de neblina vendo as canoas encostarem cheias de banana e açaí até as noites de novena e festa na praça, a força da nossa gente vem da união. E ver o Sítio Boa Esperança vivo de novo alegra todo mundo!`,
      playerClosingThought: `Voltar para Cruzeiro do Sul e fazer parte dessa comunidade foi a melhor decisão da minha vida.`,
      relationshipBonus: 8,
      energyBonus: 4
    },
    {
      id: 'help_community',
      playerFirstPersonText: `Se precisar de qualquer produto fresco da roça ou de uma mão amiga nos preparativos da semana, pode contar comigo, ${firstName}!`,
      npcFollowUpText: `Palavra de amigo vale ouro por aqui, Cauã! Muito obrigado mesmo. Quando passar aqui perto de novo, encoste pra gente tomar um cafezinho passado na hora!`,
      playerClosingThought: `A amizade sincera do povo acreano deixa qualquer dia de trabalho mais leve.`,
      relationshipBonus: 7,
      energyBonus: 7
    }
  ];
}

export function getActiveFestival(state: GameState) {
  return FESTIVALS_DATA.find(
    (f) => f.seasonIndex === state.seasonIndex && f.dayOfMonth === state.dayOfMonth
  );
}

export interface SeasonalClimateEffect {
  mode: 'rain_heavy' | 'rain_light' | 'mist' | 'breeze';
  isRaining: boolean;
  intensity: number;
  label: string;
}

export function getSeasonalClimateEffect(
  seasonIndex: 0 | 1 | 2 | 3,
  weather: 'sol' | 'nublado' | 'chuva'
): SeasonalClimateEffect {
  const seasonId: SeasonId = SEASON_ORDER[seasonIndex];
  if (weather === 'chuva') {
    const isCheia = seasonId === 'inverno_amazonico' || seasonId === 'transicao_enchente';
    return {
      mode: isCheia ? 'rain_heavy' : 'rain_light',
      isRaining: true,
      intensity: isCheia ? 1.0 : 0.65,
      label: isCheia ? 'Toró do Inverno Amazônico' : 'Chuva Fina Ribeirinha'
    };
  }

  if (weather === 'nublado' || seasonId === 'transicao_vazante') {
    return {
      mode: 'mist',
      isRaining: false,
      intensity: weather === 'nublado' ? 0.85 : 0.55,
      label: 'Cerração & Neblina do Rio Juruá'
    };
  }

  return {
    mode: 'breeze',
    isRaining: false,
    intensity: 0.35,
    label: 'Brisa Equatorial da Floresta'
  };
}

/**
 * SISTEMA DE PROGRESSÃO SEMANAL DE MECÂNICAS E OBJETIVOS
 * A cada semana (ou ao concluir a meta da semana atual), um novo evento introduz
 * uma nova mecânica e objetivo ao jogador sem sobrecarregar os primeiros dias.
 */
export interface WeeklyMechanicMilestone {
  week: 1 | 2 | 3 | 4 | 5;
  title: string;
  eventTitle: string;
  eventSpeaker: string;
  eventNarrative: string;
  mechanicUnlockedLabel: string;
  objectiveLabel: string;
  isObjectiveComplete: (state: GameState) => boolean;
  progressText: (state: GameState) => string;
}

export const WEEKLY_MECHANIC_EVENTS: WeeklyMechanicMilestone[] = [
  {
    week: 1,
    title: 'Semana 1 — As 10 Manivas do Roçado',
    eventTitle: 'Chegada ao Sítio Boa Esperança',
    eventSpeaker: 'Seu Raimundo (Mestre da Farinha)',
    eventNarrative:
      '"Que alegria te ver de volta na terra do seu avô, Cauã! Separei 10 manivas escolhidas a dedo de Mandioca Mansa pra você começar. Aproveite esses primeiros dias pra carpir as covas, plantar suas mudas e puxar água fresca do poço. Quando quiser variar a lavoura, dê um pulo na Casa Agrícola lá no Centro!"',
    mechanicUnlockedLabel: 'Agricultura Ribeirinha (Enxada, Plantio das 10 Sementes, Rega e Colheita)',
    objectiveLabel: 'Colha 4 cultivos ou lavre 3 novas covas no roçado da família',
    isObjectiveComplete: (state) => {
      return state.stats.cropsHarvestedCount >= 4 || state.stats.soilTilledCount >= 3;
    },
    progressText: (state) => {
      return `${Math.min(4, state.stats.cropsHarvestedCount)}/4 colheitas (${Math.min(3, state.stats.soilTilledCount)}/3 covas aradas)`;
    }
  },
  {
    week: 2,
    title: 'Semana 2 — O Chamado das Águas & Pesca',
    eventTitle: 'Presente do Mestre Zé Bento no Trapiche',
    eventSpeaker: 'Mestre Zé Bento (Carpinteiro Naval)',
    eventNarrative:
      '"Ô de casa, Cauã! Vi que a roça já está pegando força, então vim trazer um presente: preparei uma vara de pesca reforçada e deixei a canoa de madeira da sua família calafetada e amarrada ali no trapiche. Desça até a beira do Rio Juruá quando quiser pescar tambaqui ou navegar pelos igarapés!"',
    mechanicUnlockedLabel: 'Vara de Pesca & Navegação Livre de Canoa pelo Rio Juruá',
    objectiveLabel: 'Pesque seu primeiro peixe nas águas do Rio Juruá ou do Igarapé',
    isObjectiveComplete: (state) => state.stats.fishCaughtCount >= 1,
    progressText: (state) => `${Math.min(1, state.stats.fishCaughtCount)}/1 peixe fisgado`
  },
  {
    week: 3,
    title: 'Semana 3 — O Fogo da Casa de Farinha',
    eventTitle: 'Inauguração do Forno e Tacho de Torra',
    eventSpeaker: 'Dona Francisca & Seu Raimundo',
    eventNarrative:
      '"Sente só o cheiro da lenha queimando, menino! Acendemos a fornalha de barro, limpamos o tacho de cobre e deixamos o tipiti pronto na Casa de Farinha. Traga a mandioca que você colheu pra gente torrar a legítima Farinha de Cruzeiro do Sul e bater polpa fresca de açaí e cupuaçu!"',
    mechanicUnlockedLabel: 'Casa de Farinha & Beneficiamento Regional',
    objectiveLabel: 'Processe pelo menos 1 receita artesanal na Casa de Farinha',
    isObjectiveComplete: (state) => state.stats.foodProcessedCount >= 1,
    progressText: (state) => `${Math.min(1, state.stats.foodProcessedCount)}/1 lote beneficiado`
  },
  {
    week: 4,
    title: 'Semana 4 — Criação de Animais & Viveiro',
    eventTitle: 'Abertura dos Abrigos e Viveiro do Sítio',
    eventSpeaker: 'Dra. Helena & Seu Valdir',
    eventNarrative:
      '"Bom dia, Cauã! Revisamos as cercas do curral, forramos os ninhos do galinheiro e abrimos a comporta do viveiro de tambaquis. Alimentando a criação todo dia com milho e mandioca do sítio, não vai faltar ovo caipira, leite gordo nem peixe fresco pra vender na cidade!"',
    mechanicUnlockedLabel: 'Manejo de Criações & Viveiro de Peixes',
    objectiveLabel: 'Alimente e colete produtos das criações da fazenda',
    isObjectiveComplete: (state) => state.stats.animalProductsCollectedCount >= 1,
    progressText: (state) => `${Math.min(1, state.stats.animalProductsCollectedCount)}/1 coleta animal`
  },
  {
    week: 5,
    title: 'Semana 5 — Encomendas & Legado no Juruá',
    eventTitle: 'Acordo Comercial com o Mercado de Cruzeiro do Sul',
    eventSpeaker: 'Mateus Feirante & Lideranças do Miritizal',
    eventNarrative:
      '"Fala, parceiro! A fama da produção do Sítio Boa Esperança já correu Cruzeiro do Sul inteira. Os restaurantes e feirantes do Mercado Municipal abriram encomendas semanais pra você, e o conselho da comunidade quer saber qual projeto de legado você vai liderar no Vale!"',
    mechanicUnlockedLabel: 'Contratos Comerciais da Feira & Legado Comunitário',
    objectiveLabel: 'Entregue uma encomenda comercial na Feira e expanda seu patrimônio',
    isObjectiveComplete: (state) => state.contracts.some((c) => c.completed),
    progressText: (state) =>
      `${state.contracts.filter((c) => c.completed).length}/${state.contracts.length} contratos`
  }
];

export function getUnlockedWeek(state: GameState): 1 | 2 | 3 | 4 | 5 {
  const calendarWeek = Math.min(5, Math.floor((state.totalDaysPlayed - 1) / 7) + 1);
  let objectiveWeek = 1;
  for (const milestone of WEEKLY_MECHANIC_EVENTS) {
    if (milestone.isObjectiveComplete(state)) {
      objectiveWeek = Math.min(5, milestone.week + 1);
    } else {
      break;
    }
  }
  return Math.max(calendarWeek, objectiveWeek) as 1 | 2 | 3 | 4 | 5;
}
