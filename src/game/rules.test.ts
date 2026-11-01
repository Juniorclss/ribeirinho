import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceDayState,
  buyAnimal,
  buySeed,
  canMoveTo,
  catchFishAtSpot,
  createInitialGameState,
  feedAndCollectAnimal,
  fulfillCommercialContract,
  harvestPlot,
  plantCrop,
  processRecipe,
  sellItem,
  stepVehicleOnRoute,
  tillPlot,
  validateBusRoute,
  validateSaveData,
  validateWaterRoute,
  VehicleRuntimeState,
  waterPlot
} from './rules';
import { MAPS_DATA } from '../data/maps';
import { CROPS_DATA } from '../data/crops';
import { CHARACTERS_DATA } from '../data/charactersAndQuests';
import { ANIMAL_CATEGORIES } from '../data/animals';
import * as THREE from 'three';
import {
  validateCharacterVisualState,
  forceRerenderCharacterClothing
} from './threeWorldEngine';

test('All 16 regional crops and 18 original Acrean characters exist', () => {
  assert.equal(Object.keys(CROPS_DATA).length, 16);
  assert.equal(CHARACTERS_DATA.length, 18);
  assert.equal(Object.keys(ANIMAL_CATEGORIES).length, 6);
  assert.equal(Object.keys(MAPS_DATA).length, 8);
});

test('Bus routes across all 8 maps strictly stay on valid road/bridge tiles without cutting corners', () => {
  for (const map of Object.values(MAPS_DATA)) {
    const check = validateBusRoute(map, map.busRoute);
    assert.equal(check.valid, true, `Bus route failed on ${map.id}: ${check.reason}`);
  }

  // Test that an invalid route crossing grass is rejected
  const invalidRouteCheck = validateBusRoute(MAPS_DATA.fazenda, [
    { x: 3, y: 5 },
    { x: 10, y: 5 }
  ]);
  assert.equal(invalidRouteCheck.valid, false);
});

test('Canoe routes across all maps strictly stay on navigable water_deep tiles', () => {
  for (const map of Object.values(MAPS_DATA)) {
    const check = validateWaterRoute(map, map.canoeRoute);
    assert.equal(check.valid, true, `Canoe route failed on ${map.id}: ${check.reason}`);
  }

  // Test that a canoe route onto land is rejected
  const invalidWaterCheck = validateWaterRoute(MAPS_DATA.porto, [
    { x: 3, y: 14 },
    { x: 3, y: 6 }
  ]);
  assert.equal(invalidWaterCheck.valid, false);
});

test('Vehicle stepping interpolates along road waypoints and pauses at stops', () => {
  const route = MAPS_DATA.estrada.busRoute;
  let bus: VehicleRuntimeState = {
    x: route[0].x,
    y: route[0].y,
    targetWaypointIndex: 1,
    direction: 'right',
    pauseTimer: 0,
    isValidRoute: true
  };

  bus = stepVehicleOnRoute(bus, route, 4, 0.5);
  assert.ok(bus.x > route[0].x);
  assert.equal(bus.y, route[0].y);
  assert.equal(bus.direction, 'right');
});

test('Player collisions prevent walking through buildings, solid trees, or deep water', () => {
  const farm = MAPS_DATA.fazenda;
  // Spawn point is walkable
  assert.equal(canMoveTo(farm, farm.spawnX, farm.spawnY), true);
  // Map border tree_solid is blocked
  assert.equal(canMoveTo(farm, 0, 0), false);
  // Building footprint is blocked, but door coordinate is walkable
  assert.equal(canMoveTo(farm, 4, 3), false);
  assert.equal(canMoveTo(farm, 5, 4), true);
});

test('Farming lifecycle: cannot plant on road, can till, plant, water, advance days, and harvest mandioca', () => {
  let state = createInitialGameState();

  // Attempt to till outside farm_plot fails
  const badTill = tillPlot(state, 'fazenda', 6, 5);
  assert.equal(badTill.ok, false);

  // Till a valid plot at (8, 9)
  const tillRes = tillPlot(state, 'fazenda', 8, 9);
  assert.equal(tillRes.ok, true);
  state = tillRes.state;

  // Plant Mandioca
  const plantRes = plantCrop(state, 'fazenda', 8, 9, 'mandioca');
  assert.equal(plantRes.ok, true);
  state = plantRes.state;

  // Water plot and advance 5 days
  for (let d = 0; d < 5; d++) {
    const waterRes = waterPlot(state, 'fazenda', 8, 9);
    if (waterRes.ok) state = waterRes.state;
    const dayRes = advanceDayState(state);
    state = dayRes.state;
  }

  const plot = state.plots['fazenda:8,9'];
  assert.equal(plot.readyToHarvest, true);

  const beforeMandioca = state.inventory.mandioca ?? 0;
  const harvRes = harvestPlot(state, 'fazenda', 8, 9);
  assert.equal(harvRes.ok, true);
  assert.ok((harvRes.state.inventory.mandioca ?? 0) > beforeMandioca);
});

test('Processing chain: Mandioca -> Casa de Farinha -> Farinha de Mandioca increases economic value', () => {
  let state = createInitialGameState();
  const procRes = processRecipe(state, 'farinha_mandioca');
  assert.equal(procRes.ok, true);
  state = procRes.state;
  assert.equal(state.inventory.farinha_mandioca, 2);

  // Fulfill commercial contract with processed Farinha
  const moneyBefore = state.money;
  const contractRes = fulfillCommercialContract(state, 'cnt_farinha_1');
  assert.equal(contractRes.ok, true);
  assert.ok(contractRes.state.money > moneyBefore);
});

test('Animal categories, feeding, product collection, fishing, and save validation work reliably', () => {
  let state = createInitialGameState();

  // Collect egg from starter chicken
  const collectRes = feedAndCollectAnimal(state, 'anim_1');
  assert.equal(collectRes.ok, true);
  state = collectRes.state;
  assert.equal(state.inventory.ovo_caipira, 1);

  // Buy a pig
  state = { ...state, money: 1000 };
  const buyRes = buyAnimal(state, 'porco', 'Rosado');
  assert.equal(buyRes.ok, true);
  state = buyRes.state;

  // Catch fish in Rio Juruá
  const fishRes = catchFishAtSpot(state, 'rio_jurua');
  assert.equal(fishRes.ok, true);
  state = fishRes.state;
  assert.equal(state.stats.fishCaughtCount, 1);

  // Buy seed and sell item
  const seedRes = buySeed(state, 'acai', 1);
  assert.equal(seedRes.ok, true);
  state = seedRes.state;

  const sellRes = sellItem(state, 'ovo_caipira', 1);
  assert.equal(sellRes.ok, true);
  state = sellRes.state;

  // Validate save data
  const saveCheck = validateSaveData(state);
  assert.equal(saveCheck.valid, true);
  assert.equal(validateSaveData(null).valid, false);
});

test('Seasonal climate effect generates rain during chuva and river mist during nublado/vazante', async () => {
  const { getSeasonalClimateEffect } = await import('./rules');
  const rainWinter = getSeasonalClimateEffect(0, 'chuva');
  assert.equal(rainWinter.isRaining, true);
  assert.equal(rainWinter.mode, 'rain_heavy');

  const mistVazante = getSeasonalClimateEffect(1, 'nublado');
  assert.equal(mistVazante.isRaining, false);
  assert.equal(mistVazante.mode, 'mist');

  const summerSun = getSeasonalClimateEffect(2, 'sol');
  assert.equal(summerSun.isRaining, false);
  assert.equal(summerSun.mode, 'breeze');
});

test('Initial game state starts with 10 identical Mandioca seeds and enforces seasonal seed buying + weekly unlocks', async () => {
  const { getUnlockedWeek, isSeedAvailableInSeason, WEEKLY_MECHANIC_EVENTS } = await import('./rules');
  let state = createInitialGameState();

  // Strictly 10 identical starter seeds (seed_mandioca) and zero other seeds
  const seedKeys = Object.keys(state.inventory).filter((k) => k.startsWith('seed_') && state.inventory[k] > 0);
  assert.deepEqual(seedKeys, ['seed_mandioca']);
  assert.equal(state.inventory.seed_mandioca, 10);
  assert.equal(state.selectedSeedId, 'mandioca');

  // Season 0 (Inverno Amazônico): cupuaçu is in season, melancia is out of season
  assert.equal(isSeedAvailableInSeason('cupuacu', 0), true);
  assert.equal(isSeedAvailableInSeason('melancia', 0), false);

  const outOfSeasonBuy = buySeed(state, 'melancia', 1);
  assert.equal(outOfSeasonBuy.ok, false);

  const inSeasonBuy = buySeed(state, 'cupuacu', 1);
  assert.equal(inSeasonBuy.ok, true);

  // Weekly mechanic unlocking starts at Week 1 and unlocks Week 2 after harvesting 4 crops or reaching Day 8
  assert.equal(WEEKLY_MECHANIC_EVENTS.length, 5);
  assert.equal(getUnlockedWeek(state), 1);

  const week2ByHarvest = { ...state, stats: { ...state.stats, cropsHarvestedCount: 4 } };
  assert.equal(getUnlockedWeek(week2ByHarvest), 2);

  // Canoe navigation on water_deep is allowed when inCanoe=true and blocked on foot
  const farm = MAPS_DATA.fazenda;
  assert.equal(canMoveTo(farm, 2, 16, false), false);
  assert.equal(canMoveTo(farm, 2, 16, true), true);
});

test('Planting graphics state machine: watered soil, planted seed (stage 0), and progressive stages 1, 2, 3, 4', () => {
  let state = createInitialGameState();

  // Verify initial farm showcases dry tilled, watered tilled, stage 0 planted seed, and stages 1..4
  assert.equal(state.plots['fazenda:2,7']?.tilled, true);
  assert.equal(state.plots['fazenda:2,7']?.watered, false);
  assert.equal(state.plots['fazenda:3,7']?.watered, true);
  assert.equal(state.plots['fazenda:4,7']?.cropId, 'mandioca');
  assert.equal(state.plots['fazenda:4,7']?.stage, 0);
  assert.equal(state.plots['fazenda:2,8']?.stage, 0);
  assert.equal(state.plots['fazenda:2,8']?.watered, true);
  assert.equal(state.plots['fazenda:3,8']?.stage, 1);
  assert.equal(state.plots['fazenda:4,8']?.stage, 2);
  assert.equal(state.plots['fazenda:2,9']?.stage, 3);
  assert.equal(state.plots['fazenda:4,10']?.stage, 4);

  // Till and plant on a fresh plot (9, 9) -> must start at stage 0 (planted seed) and dry
  state = tillPlot(state, 'fazenda', 9, 9).state;
  state = plantCrop(state, 'fazenda', 9, 9, 'mandioca').state;
  const plantedPlot = state.plots['fazenda:9,9'];
  assert.equal(plantedPlot.cropId, 'mandioca');
  assert.equal(plantedPlot.stage, 0);
  assert.equal(plantedPlot.watered, false);

  // Watering sets watered = true
  state = waterPlot(state, 'fazenda', 9, 9).state;
  assert.equal(state.plots['fazenda:9,9'].watered, true);

  // Advance days while watering to observe stages 1, 2, 3, and 4
  const seenStages = new Set<number>([state.plots['fazenda:9,9'].stage]);
  for (let d = 0; d < 5; d++) {
    if (!state.plots['fazenda:9,9'].watered) {
      state = waterPlot(state, 'fazenda', 9, 9).state;
    }
    state = advanceDayState({ ...state, weather: 'sol' }).state;
    seenStages.add(state.plots['fazenda:9,9'].stage);
  }

  assert.equal(seenStages.has(0), true);
  assert.equal(seenStages.has(1), true);
  assert.equal(seenStages.has(2), true);
  assert.equal(seenStages.has(3), true);
  assert.equal(seenStages.has(4), true);
  assert.equal(state.plots['fazenda:9,9'].readyToHarvest, true);
});

test('Character visual state validation detects incomplete/incorrect clothing and forces re-render', () => {
  // Test with invalid / null group
  assert.equal(validateCharacterVisualState(null as any).isValid, false);

  // Test with group missing sprite
  const emptyGroup = new THREE.Group();
  assert.equal(validateCharacterVisualState(emptyGroup).isValid, false);

  // Test with group having disallowed skin-tone shirt color
  const mockCharGroup = new THREE.Group();
  const mockSprite = new THREE.Sprite();
  mockSprite.name = 'charSprite25D';
  mockCharGroup.add(mockSprite);

  mockCharGroup.userData.charSpriteState = {
    shirtColor: '#8d5b3c', // Disallowed flesh/tan color
    overallsColor: '#1d4ed8',
    hatColor: '#f2c138',
    hairColor: '#361e10',
    isElder: false,
    isFemale: false,
    canvas: { width: 512, height: 640, getContext: () => null } as any,
    texture: new THREE.CanvasTexture({ width: 512, height: 640 } as any),
    lastKey: 'test_key'
  };

  const resSkinTone = validateCharacterVisualState(mockCharGroup);
  assert.equal(resSkinTone.isValid, false);
  assert.match(resSkinTone.reason || '', /tom terroso|cor de pele/i);

  // forceRerenderCharacterClothing updates shirtColor away from tan/skin
  forceRerenderCharacterClothing(mockCharGroup, 'down', 'enxada');
  assert.equal(mockCharGroup.userData.charSpriteState.shirtColor, '#1d4ed8'); // Normalized to vibrant blue
  assert.equal(mockCharGroup.userData.charSpriteState.clothingVerified, true);
});

test('Character visual state enforces zero transparency in middle pelvis/groin region', () => {
  // Test mock with transparent middle pixels
  const mockCharGroup = new THREE.Group();
  const mockSprite = new THREE.Sprite();
  mockSprite.name = 'charSprite25D';
  mockCharGroup.add(mockSprite);

  // Mock canvas context that returns solid torso but transparent middle
  const mockContext = {
    getImageData: (x: number, y: number, w: number, h: number) => {
      // If torso (y: 280), return solid pixels
      if (y === 280) {
        const arr = new Uint8ClampedArray(w * h * 4);
        for (let i = 0; i < arr.length; i += 4) {
          arr[i] = 30;
          arr[i + 1] = 60;
          arr[i + 2] = 200;
          arr[i + 3] = 255;
        }
        return { data: arr };
      }
      // If middle / pelvis (y: 388), return transparent pixels (alpha = 0)
      const emptyArr = new Uint8ClampedArray(w * h * 4);
      return { data: emptyArr };
    }
  };

  mockCharGroup.userData.charSpriteState = {
    shirtColor: '#1d4ed8',
    overallsColor: '#1e3a8a',
    hatColor: '#f2c138',
    hairColor: '#361e10',
    isElder: false,
    isFemale: false,
    canvas: { width: 512, height: 640, getContext: () => mockContext } as any,
    texture: new THREE.CanvasTexture({ width: 512, height: 640 } as any),
    lastKey: 'test_key'
  };

  const validation = validateCharacterVisualState(mockCharGroup);
  assert.equal(validation.isValid, false);
  assert.match(validation.reason || '', /Região pélvica\/meio do personagem transparente ou incompleta/i);
});

test('Active toolbar reordering supports move_up, move_down, move_top, move_bottom, and reset', async () => {
  const { DEFAULT_TOOL_ORDER, reorderActiveTools } = await import('./rules');

  let order = [...DEFAULT_TOOL_ORDER];
  assert.equal(order[0], 'enxada');
  assert.equal(order[2], 'regador');

  // Move 'regador' to top
  order = reorderActiveTools(order, 'regador', 'move_top');
  assert.equal(order[0], 'regador');
  assert.equal(order[1], 'enxada');

  // Move 'enxada' down
  order = reorderActiveTools(order, 'enxada', 'move_down');
  assert.equal(order[1], 'semente');
  assert.equal(order[2], 'enxada');

  // Move 'colheita' up
  order = reorderActiveTools(order, 'colheita', 'move_up');
  assert.equal(order[2], 'colheita');

  // Move 'regador' to bottom
  order = reorderActiveTools(order, 'regador', 'move_bottom');
  assert.equal(order[order.length - 1], 'regador');

  // Reset returns DEFAULT_TOOL_ORDER
  order = reorderActiveTools(order, 'regador', 'reset');
  assert.deepEqual(order, DEFAULT_TOOL_ORDER);
});

test('Interactive dialogue choices provide natural human conversation and authentic NPC responses', async () => {
  const { getFirstPersonDialogueChoices } = await import('./rules');
  const npc = CHARACTERS_DATA[0];
  const choices = getFirstPersonDialogueChoices(npc.id, npc.name, npc.role, 1);

  assert.equal(choices.length, 3);
  for (const choice of choices) {
    assert.ok(choice.playerFirstPersonText.length > 30);
    assert.ok(!/^Eu quero acertar/i.test(choice.playerFirstPersonText));
    assert.ok(choice.npcFollowUpText.length > 40);
    assert.ok(choice.playerClosingThought.length > 20);
    assert.ok(choice.relationshipBonus > 0);
    assert.ok(choice.energyBonus > 0);
  }
});



