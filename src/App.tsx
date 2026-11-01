/**
 * AMAZÔNIA: CHAMADO RIBEIRINHO ACREANO
 * Controlador Principal 2.5D HD, Progressão Semanal de Mecânicas e Objetivos,
 * Passagens Físicas entre Mapas e Navegação Livre.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_TOOL_ORDER,
  Direction,
  FirstPersonDialogueOption,
  GameState,
  SEASON_ORDER,
  ToolId,
  WEEKLY_MECHANIC_EVENTS,
  advanceDayState,
  buyAnimal,
  buySeed,
  catchFishAtSpot,
  createInitialGameState,
  evaluateQuests,
  feedAndCollectAnimal,
  fulfillCommercialContract,
  getFirstPersonDialogueChoices,
  getItemSellPrice,
  getSeasonalClimateEffect,
  getTileAt,
  getUnlockedWeek,
  harvestPlot,
  plantCrop,
  processRecipe,
  reorderActiveTools,
  resolveBestActionTileCoords,
  sellItem,
  tillPlot,
  validateSaveData,
  waterPlot
} from './game/rules';
import { CROPS_DATA, SEASONS_INFO } from './data/crops';
import { AnimalCategoryId } from './data/animals';
import { CHARACTERS_DATA, CharacterDefinition } from './data/charactersAndQuests';
import { MAPS_DATA, MapBuilding, MapPortal } from './data/maps';
import { TitleScreen } from './components/TitleScreen';
import { ActiveCutsceneBanner, GameCanvas, InGameCutsceneId } from './components/GameCanvas';
import { ActiveModalType, GameModals, SaveSlotSummary } from './components/Modals';
import {
  ModernHudSvgIcon,
  PixelIconCanvas,
  PixelNpcPortraitCanvas,
  PixelPortraitCanvas
} from './components/PixelArtWidgets';
import { soundEngine } from './game/soundEngine';

const SAVE_KEY_PREFIX = 'amazonia_ribeirinho_save_slot_';

const WEEKDAYS_PT = ['Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.', 'Dom.'];

const TOOLS_CONFIG: { id: ToolId; key: string; label: string; shortDesc: string; minWeek: number }[] = [
  { id: 'enxada', key: '1', label: 'Enxada', shortDesc: 'Preparar Cova', minWeek: 1 },
  { id: 'semente', key: '2', label: 'Plantar', shortDesc: 'Semear no Roçado', minWeek: 1 },
  { id: 'regador', key: '3', label: 'Regador', shortDesc: 'Irrigar Cova', minWeek: 1 },
  { id: 'colheita', key: '4', label: 'Colher', shortDesc: 'Colher Produção', minWeek: 1 },
  { id: 'vara_pesca', key: '5', label: 'Pesca', shortDesc: 'Pescar no Rio / Igarapé', minWeek: 2 },
  { id: 'machado_limpeza', key: '6', label: 'Manejo', shortDesc: 'Cuidar das Criações', minWeek: 4 }
];

function weekToCutsceneId(week: 1 | 2 | 3 | 4 | 5): InGameCutsceneId {
  if (week === 1) return 'arrival_intro';
  if (week === 2) return 'week_2_fishing';
  if (week === 3) return 'week_3_farinha';
  if (week === 4) return 'week_4_animals';
  return 'week_5_market';
}

export interface InteractiveDialogueState {
  npc: CharacterDefinition;
  speaker: 'npc' | 'player';
  fullText: string;
  phase: 'npc_greeting' | 'player_speaking' | 'npc_followup' | 'player_closing';
  choices: FirstPersonDialogueOption[];
  selectedOption?: FirstPersonDialogueOption;
}

export default function App() {
  const [screenMode, setScreenMode] = useState<'title' | 'playing' | 'paused'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });

  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [activeWeekEventNumber, setActiveWeekEventNumber] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [activeCutscene, setActiveCutscene] = useState<InGameCutsceneId>(null);
  const [cutsceneBanner, setCutsceneBanner] = useState<ActiveCutsceneBanner | null>(null);
  const [cameraMode, setCameraMode] = useState<'padrao' | 'proxima' | 'panoramica'>('padrao');
  const [, setToastMessage] = useState<string>(
    'Bem-vindo ao Sítio Boa Esperança! Use suas 10 manivas de Mandioca Mansa para iniciar o roçado.'
  );
  const [activeDialogue, setActiveDialogue] = useState<InteractiveDialogueState | null>(null);
  const [typedWordCount, setTypedWordCount] = useState<number>(0);

  // Menu de Contexto (Botão Direito / Long-Press) para Reordenar Ferramentas
  const [toolContextMenu, setToolContextMenu] = useState<{
    toolId: ToolId;
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const [actionTriggerCount, setActionTriggerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const virtualDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const highestSeenWeekRef = useRef<number>(1);

  const unlockedWeek = getUnlockedWeek(gameState);
  const currentWeekInfo =
    WEEKLY_MECHANIC_EVENTS.find((w) => w.week === unlockedWeek) ?? WEEKLY_MECHANIC_EVENTS[0];

  // Efeito de digitação PALAVRA POR PALAVRA com som de voz aleatória sintetizada
  const dialogueWords = useMemo(() => {
    if (!activeDialogue) return [];
    return activeDialogue.fullText.trim().split(/\s+/).filter(Boolean);
  }, [activeDialogue]);

  const isTypingDialogue = activeDialogue !== null && typedWordCount < dialogueWords.length;

  useEffect(() => {
    if (!activeDialogue) {
      setTypedWordCount(0);
      return;
    }
    setTypedWordCount(1);
    const words = activeDialogue.fullText.trim().split(/\s+/).filter(Boolean);
    const voiceId = activeDialogue.speaker === 'player' ? 'caua_protagonist' : activeDialogue.npc.id;
    if (words[0]) {
      soundEngine.playVoiceBlip(voiceId, words[0]);
    }

    if (words.length <= 1) return;

    let currentIdx = 1;
    const interval = window.setInterval(() => {
      currentIdx += 1;
      setTypedWordCount(currentIdx);
      const word = words[currentIdx - 1] ?? '';
      soundEngine.playVoiceBlip(voiceId, word);
      if (currentIdx >= words.length) {
        clearInterval(interval);
      }
    }, 105);

    return () => clearInterval(interval);
  }, [activeDialogue?.fullText, activeDialogue?.phase, activeDialogue?.speaker, activeDialogue?.npc.id]);

  // Fecha menu de contexto ao clicar fora
  useEffect(() => {
    if (!toolContextMenu) return;
    const closeMenu = () => setToolContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [toolContextMenu]);

  // Dispara automaticamente a ANIMAÇÃO IN-GAME 3D quando uma nova semana e nova mecânica são desbloqueadas!
  useEffect(() => {
    if (screenMode === 'playing' && unlockedWeek > highestSeenWeekRef.current) {
      highestSeenWeekRef.current = unlockedWeek;
      setActiveWeekEventNumber(unlockedWeek);
      setActiveCutscene(weekToCutsceneId(unlockedWeek));
      soundEngine.playSfx('quest_complete');
    }
  }, [screenMode, unlockedWeek]);

  // Espelha estado da máquina em document.body.dataset.state
  useEffect(() => {
    const effectiveState = activeModal === 'pause' ? 'paused' : screenMode;
    document.body.dataset.state = effectiveState;
  }, [screenMode, activeModal]);

  // Inicia trilha sonora regional correspondente ao mapa atual
  useEffect(() => {
    if (screenMode === 'playing' && !activeModal) {
      const mapTheme = MAPS_DATA[gameState.currentMap].musicTheme;
      soundEngine.startMusic(mapTheme);
    } else if (screenMode !== 'playing' || activeModal === 'pause') {
      soundEngine.stopMusic();
    }
  }, [screenMode, gameState.currentMap, activeModal]);

  // Relógio diário suave
  useEffect(() => {
    if (screenMode !== 'playing' || activeModal !== null || activeCutscene !== null) return;
    const timer = window.setInterval(() => {
      setGameState((prev) => {
        const nextMin = prev.minuteOfDay + 5;
        if (nextMin >= 1350) {
          const nextDayRes = advanceDayState(prev);
          setToastMessage(`Um novo dia amanheceu no Vale do Juruá! ${nextDayRes.summary.join(' ')}`);
          return nextDayRes.state;
        }
        return { ...prev, minuteOfDay: nextMin };
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [screenMode, activeModal, activeCutscene]);

  // Leitura dos 3 espaços de salvamento
  const getSaveSlotsSummary = useCallback((): SaveSlotSummary[] => {
    return ([1, 2, 3] as const).map((slotIndex) => {
      try {
        const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slotIndex}`);
        if (!raw) return { slotIndex, exists: false };
        const parsed = JSON.parse(raw);
        const check = validateSaveData(parsed.state);
        if (!check.valid || !check.state) return { slotIndex, exists: false };
        return {
          slotIndex,
          exists: true,
          savedAt: parsed.savedAt ?? 'Recente',
          year: check.state.year,
          day: check.state.totalDaysPlayed,
          money: check.state.money,
          farmName: check.state.farmName
        };
      } catch {
        return { slotIndex, exists: false };
      }
    });
  }, []);

  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>(() => getSaveSlotsSummary());

  const handleSaveToSlot = (slotIndex: 1 | 2 | 3) => {
    try {
      const payload = {
        savedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        state: gameState
      };
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slotIndex}`, JSON.stringify(payload));
      setSaveSlots(getSaveSlotsSummary());
      soundEngine.playSfx('coin');
      setToastMessage(`Progresso salvo no Espaço #${slotIndex}.`);
    } catch {
      setToastMessage('Não foi possível salvar no momento.');
    }
  };

  const handleLoadFromSlot = (slotIndex: 1 | 2 | 3) => {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slotIndex}`);
      if (!raw) {
        setToastMessage(`Espaço #${slotIndex} está vazio.`);
        return;
      }
      const parsed = JSON.parse(raw);
      const check = validateSaveData(parsed.state);
      if (!check.valid || !check.state) {
        setToastMessage(check.error ?? 'Salvamento inválido.');
        return;
      }
      highestSeenWeekRef.current = getUnlockedWeek(check.state);
      setGameState(check.state);
      setActiveCutscene(null);
      setCutsceneBanner(null);
      setScreenMode('playing');
      setActiveModal(null);
      soundEngine.playSfx('quest_complete');
    } catch {
      setToastMessage('Falha ao carregar o jogo.');
    }
  };

  const handleStartNewGame = useCallback((withInGameIntro = true) => {
    const fresh = createInitialGameState();
    highestSeenWeekRef.current = 1;
    setGameState(fresh);
    setActiveDialogue(null);
    setScreenMode('playing');
    document.body.dataset.state = 'playing';
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundEngine.playSfx('quest_complete');
    setActiveWeekEventNumber(1);
    setActiveModal(null);
    setActiveCutscene(withInGameIntro ? 'arrival_intro' : null);
    if (!withInGameIntro) setCutsceneBanner(null);
    setToastMessage('Você desembarcou no Sítio Boa Esperança com 10 sementes de Mandioca Mansa!');
  }, []);

  const handleContinueGame = useCallback(() => {
    const slots = getSaveSlotsSummary();
    const firstValid = slots.find((s) => s.exists);
    if (firstValid) {
      handleLoadFromSlot(firstValid.slotIndex);
    } else {
      handleStartNewGame(false);
    }
  }, [getSaveSlotsSummary, handleStartNewGame]);

  // Ferramentas ativas ordenadas de acordo com a preferência do jogador (Reordenação via Menu de Contexto)
  const orderedToolIds = gameState.toolOrder?.length ? gameState.toolOrder : DEFAULT_TOOL_ORDER;
  const availableTools = useMemo(() => {
    const unlocked = TOOLS_CONFIG.filter((t) => t.minWeek <= unlockedWeek);
    return [...unlocked].sort((a, b) => {
      const idxA = orderedToolIds.indexOf(a.id);
      const idxB = orderedToolIds.indexOf(b.id);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [orderedToolIds, unlockedWeek]);

  const handleReorderTool = useCallback(
    (toolId: ToolId, action: 'move_up' | 'move_down' | 'move_top' | 'move_bottom' | 'reset') => {
      setGameState((prev) => {
        const currentOrder = prev.toolOrder?.length ? prev.toolOrder : DEFAULT_TOOL_ORDER;
        const nextOrder = reorderActiveTools(currentOrder, toolId, action);
        return {
          ...prev,
          toolOrder: nextOrder
        };
      });
      soundEngine.playSfx('coin');
      setToolContextMenu(null);
    },
    []
  );

  const openDialogueWithNpc = useCallback(
    (npc: CharacterDefinition) => {
      const yearKey = `year${gameState.year}` as 'year1' | 'year2' | 'year3' | 'year4';
      const greetingLine = npc.dialogues[yearKey] || npc.dialogues.greeting;
      const choices = getFirstPersonDialogueChoices(npc.id, npc.name, npc.role, gameState.year);
      setActiveDialogue({
        npc,
        speaker: 'npc',
        fullText: greetingLine,
        phase: 'npc_greeting',
        choices
      });
      soundEngine.playSfx('coin');
      setGameState((prev) => ({
        ...prev,
        relationships: {
          ...prev.relationships,
          [npc.id]: Math.min(100, (prev.relationships[npc.id] ?? 20) + 5)
        }
      }));
    },
    [gameState.year]
  );

  // Atalhos globais de teclado (1..6 seguem a ordem customizada da barra de ferramentas)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (screenMode === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartNewGame(true);
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (toolContextMenu) {
          setToolContextMenu(null);
          return;
        }
        if (activeDialogue) {
          setActiveDialogue(null);
          return;
        }
        if (activeCutscene) {
          setActiveCutscene(null);
          setCutsceneBanner(null);
          return;
        }
        setActiveModal((prev) => (prev ? null : 'pause'));
        return;
      }

      if (activeModal) return;

      const digitMatch = e.code.match(/^Digit([1-6])$/);
      if (digitMatch) {
        const slotIdx = Number(digitMatch[1]) - 1;
        const targetTool = availableTools[slotIdx];
        if (targetTool) {
          setGameState((s) => ({ ...s, selectedTool: targetTool.id }));
        }
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setActionTriggerCount((c) => c + 1);
      }

      if (e.code === 'KeyV') {
        setCameraMode((prev) =>
          prev === 'padrao' ? 'proxima' : prev === 'proxima' ? 'panoramica' : 'padrao'
        );
      }

      if (e.code === 'KeyI') setActiveModal('inventory');
      if (e.code === 'KeyJ') setActiveModal('journal');
      if (e.code === 'KeyC') setActiveModal('market');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screenMode,
    activeModal,
    activeCutscene,
    activeDialogue,
    toolContextMenu,
    handleStartNewGame,
    availableTools
  ]);

  // Interação contextual no mundo
  const handlePrimaryAction = useCallback(
    (
      playerX: number,
      playerY: number,
      facing: Direction,
      nearbyNpc: CharacterDefinition | null,
      nearbyBuilding: MapBuilding | null,
      nearbyPortal: MapPortal | null
    ) => {
      const map = MAPS_DATA[gameState.currentMap];
      const target = resolveBestActionTileCoords(map, playerX, playerY, facing);
      const targetTile = getTileAt(map, target.x, target.y);

      // 0. Prioridade para Conversa com Morador próximo quando o jogador está perto dele
      if (nearbyNpc) {
        openDialogueWithNpc(nearbyNpc);
        return;
      }

      // 1. Interação com o roçado (Arar -> Plantar Semente Fase 0 -> Regar 💧 -> Colher ✨)
      if (targetTile === 'farm_plot') {
        const plotKey = `${map.id}:${target.x},${target.y}`;
        const plot = gameState.plots[plotKey];

        if (plot?.readyToHarvest || gameState.selectedTool === 'colheita') {
          const res = harvestPlot(gameState, map.id, target.x, target.y);
          if (res.ok) {
            soundEngine.playSfx('harvest');
            setGameState(res.state);
            setToastMessage(res.message);
            return;
          }
        }

        if (!plot || !plot.tilled) {
          const res = tillPlot(gameState, map.id, target.x, target.y);
          soundEngine.playSfx('hoe');
          setGameState(res.state);
          setToastMessage(res.message);
          return;
        }

        if (
          gameState.selectedTool === 'semente' ||
          (plot.tilled && !plot.cropId && gameState.selectedTool !== 'regador')
        ) {
          if (!plot.cropId) {
            const res = plantCrop(gameState, map.id, target.x, target.y, gameState.selectedSeedId);
            soundEngine.playSfx('plant');
            setGameState(res.state);
            setToastMessage(res.message);
            return;
          }
        }

        if (gameState.selectedTool === 'regador' || !plot.watered) {
          const res = waterPlot(gameState, map.id, target.x, target.y);
          soundEngine.playSfx('water');
          setGameState(res.state);
          setToastMessage(res.message);
          return;
        }

        if (plot.cropId && plot.watered && !plot.readyToHarvest) {
          const cropName = CROPS_DATA[plot.cropId]?.name ?? plot.cropId;
          const stageDesc: Record<number, string> = {
            0: 'Fase 0/4 (Semente/Maniva na cova)',
            1: 'Fase 1/4 (Broto emergindo)',
            2: 'Fase 2/4 (Crescimento vegetativo)',
            3: 'Fase 3/4 (Floração e pré-colheita)'
          };
          setToastMessage(
            `${cropName}: ${stageDesc[plot.stage] ?? `Fase ${plot.stage}/4`} — Canteiro já regado hoje 💧.`
          );
          return;
        }
      }

      // 2. Ponto de coleta na floresta
      const forageHit = map.forageNodes.find(
        (fn) => Math.hypot(fn.x - playerX, fn.y - playerY) <= 2.0
      );
      if (forageHit) {
        const collected = gameState.forageCollectedToday[forageHit.id] ?? 0;
        if (collected < forageHit.dailyLimit) {
          soundEngine.playSfx('harvest');
          setGameState((prev) => ({
            ...prev,
            inventory: {
              ...prev.inventory,
              [forageHit.itemId]: (prev.inventory[forageHit.itemId] ?? 0) + 1
            },
            forageCollectedToday: {
              ...prev.forageCollectedToday,
              [forageHit.id]: collected + 1
            }
          }));
          setToastMessage(`Coletou 1x ${forageHit.itemName}.`);
          return;
        }
      }

      // 3. Pesca no rio ou igarapé
      if (
        targetTile === 'water_deep' ||
        targetTile === 'water_shallow' ||
        gameState.selectedTool === 'vara_pesca'
      ) {
        const nearWater =
          targetTile === 'water_deep' ||
          targetTile === 'water_shallow' ||
          getTileAt(map, Math.round(playerX), Math.round(playerY) + 1) === 'water_deep' ||
          getTileAt(map, Math.round(playerX), Math.round(playerY) + 1) === 'water_shallow';

        if (nearWater) {
          const spot =
            map.id === 'floresta'
              ? 'igarape_floresta'
              : map.id === 'porto'
              ? 'porto_trapiche'
              : 'rio_jurua';
          const res = catchFishAtSpot(gameState, spot);
          soundEngine.playSfx(res.ok ? 'fish_catch' : 'fish_cast');
          setGameState(res.state);
          setToastMessage(res.message);
          return;
        }
      }

      // 4. Porta de edifício regional
      if (nearbyBuilding) {
        soundEngine.playSfx('door');
        switch (nearbyBuilding.interactionAction) {
          case 'sleep_home': {
            const res = advanceDayState(gameState);
            setGameState(res.state);
            setToastMessage(`Você descansou na Casa da Família. Dia ${res.state.dayOfMonth} começou!`);
            break;
          }
          case 'refill_water': {
            setGameState((prev) => ({ ...prev, waterCanCharges: prev.maxWaterCanCharges }));
            soundEngine.playSfx('water');
            setToastMessage('Regador abastecido no Poço de Água Cristalina!');
            break;
          }
          case 'open_processing':
            setActiveModal('inventory');
            break;
          case 'open_animals':
          case 'open_animal_shop':
            setActiveModal('animals');
            break;
          case 'open_shop_seeds':
          case 'open_shop_tools':
          case 'open_market':
            setActiveModal('market');
            break;
          case 'open_bus_terminal': {
            const nextBusMap =
              gameState.currentMap === 'estrada'
                ? 'centro'
                : gameState.currentMap === 'centro'
                ? 'rodoviaria'
                : 'estrada';
            const dest = MAPS_DATA[nextBusMap];
            setGameState((prev) => ({
              ...prev,
              currentMap: nextBusMap,
              playerX: dest.spawnX,
              playerY: dest.spawnY
            }));
            break;
          }
          case 'open_boat_shop': {
            const nextRiverMap = gameState.currentMap === 'porto' ? 'fazenda' : 'porto';
            const dest = MAPS_DATA[nextRiverMap];
            setGameState((prev) => ({
              ...prev,
              currentMap: nextRiverMap,
              playerX: dest.spawnX,
              playerY: dest.spawnY
            }));
            break;
          }
          case 'visit_neighbor':
            setActiveModal('journal');
            break;
        }
        return;
      }

      // 5. Passagem física para outro mapa
      if (nearbyPortal) {
        setGameState((prev) => ({
          ...prev,
          currentMap: nearbyPortal.targetMap,
          playerX: nearbyPortal.targetX,
          playerY: nearbyPortal.targetY
        }));
        return;
      }
    },
    [gameState, openDialogueWithNpc]
  );

  const hours = Math.floor(gameState.minuteOfDay / 60);
  const mins = gameState.minuteOfDay % 60;
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  const weekdayLabel = WEEKDAYS_PT[(gameState.totalDaysPlayed - 1) % 7];
  const currentSeasonId = SEASON_ORDER[gameState.seasonIndex];
  const currentSeason = SEASONS_INFO[currentSeasonId];
  const currentMapObj = MAPS_DATA[gameState.currentMap];
  const selectedCrop = CROPS_DATA[gameState.selectedSeedId] ?? CROPS_DATA.mandioca;
  const selectedSeedCount = gameState.inventory[`seed_${selectedCrop.id}`] ?? 0;
  const currentClimate = getSeasonalClimateEffect(gameState.seasonIndex, gameState.weather);

  // Morador mais próximo no mapa atual para botão rápido de diálogo
  const closestNpcInMap = useMemo(() => {
    const npcsInMap = CHARACTERS_DATA.filter((c) => c.homeMap === gameState.currentMap);
    const pool = npcsInMap.length > 0 ? npcsInMap : CHARACTERS_DATA;
    let best = pool[0];
    let bestDist = Infinity;
    for (const npc of pool) {
      const d = Math.hypot(npc.x - gameState.playerX, npc.y - gameState.playerY);
      if (d < bestDist) {
        bestDist = d;
        best = npc;
      }
    }
    return best;
  }, [gameState.currentMap, gameState.playerX, gameState.playerY]);

  if (screenMode === 'title') {
    const anySaveExists = saveSlots.some((s) => s.exists);
    return (
      <>
        <TitleScreen
          hasSavedGame={anySaveExists}
          onStartNewGame={handleStartNewGame}
          onContinueGame={handleContinueGame}
          onOpenLoadModal={() => setActiveModal('save')}
          onOpenArtSampleModal={() => setActiveModal('credits')}
          onOpenOptionsModal={() => setActiveModal('save')}
          onOpenCreditsModal={() => setActiveModal('credits')}
        />
        <GameModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          activeWeekEventNumber={activeWeekEventNumber}
          onSelectSeed={(id) => setGameState((s) => ({ ...s, selectedSeedId: id }))}
          onConsumeItem={() => {}}
          onProcessRecipe={() => {}}
          onBuySeed={() => {}}
          onSellItem={() => {}}
          onFulfillContract={() => {}}
          onBuyAnimal={() => {}}
          onFeedAndCollectAnimal={() => {}}
          onSleepAdvanceDay={() => {}}
          onGiftCharacter={() => {}}
          onChooseLegacy={() => {}}
          saveSlots={saveSlots}
          onSaveToSlot={handleSaveToSlot}
          onLoadFromSlot={handleLoadFromSlot}
          onReturnToTitle={() => setActiveModal(null)}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            soundEngine.setMuted(next);
          }}
        />
      </>
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      {/* 1. MUNDO DO JOGO EM 3D PBR (THREE.JS) + DIRETOR DE ANIMAÇÕES IN-GAME */}
      <GameCanvas
        gameState={gameState}
        isPaused={activeModal !== null}
        virtualDirRef={virtualDirRef}
        onPlayerMoveSync={(x, y, facing) => {
          setGameState((prev) =>
            prev.playerX === x && prev.playerY === y && prev.facing === facing
              ? prev
              : { ...prev, playerX: x, playerY: y, facing }
          );
        }}
        onPrimaryAction={handlePrimaryAction}
        onTriggerPortal={(portal) => {
          soundEngine.playSfx('step');
          setGameState((prev) => ({
            ...prev,
            currentMap: portal.targetMap,
            playerX: portal.targetX,
            playerY: portal.targetY
          }));
        }}
        actionTriggerCount={actionTriggerCount}
        activeCutscene={activeCutscene}
        onCutsceneComplete={() => {
          setActiveCutscene(null);
          setCutsceneBanner(null);
        }}
        onCutsceneBannerUpdate={setCutsceneBanner}
        focusedNpcId={activeDialogue?.npc.id ?? null}
        cameraMode={cameraMode}
      />

      {/* ====================================================================
          2. TOPO DO HUD MODERNO (Paleta Slate/Oceanic · Design Focado em Ícones)
         ==================================================================== */}
      {!activeCutscene && (
        <div className="fixed inset-x-0 top-0 z-20 pointer-events-none p-2.5 sm:p-3.5 flex items-start justify-between gap-2 max-w-6xl mx-auto">
          {/* Esquerda: Retrato Fotográfico + Barras de Status + Ícones Rápidos de Clima/Câmera/Cena */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl shadow-2xl border border-slate-700/80"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
            >
              <div
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden border-2 border-cyan-400/70 bg-slate-900 shrink-0 shadow-md"
                title="Cauã (Agricultor Ribeirinho)"
              >
                <PixelPortraitCanvas className="w-full h-full" />
              </div>

              <div className="flex flex-col gap-1.5 min-w-[96px] sm:min-w-[118px]">
                {/* Saúde */}
                <div className="flex items-center gap-1.5" title="Saúde (100%)">
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="currentColor">
                    <path d="M8 14s-5.5-3.3-5.5-7.2C2.5 4.5 4.3 3 6.2 3c1.2 0 2.1.6 1.8 1.5C7.7 3.6 8.6 3 9.8 3 11.7 3 13.5 4.5 13.5 6.8 13.5 10.7 8 14 8 14Z" />
                  </svg>
                  <div className="flex-1 h-2 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 w-full rounded-full" />
                  </div>
                </div>

                {/* Energia */}
                <div
                  className="flex items-center gap-1.5"
                  title={`Energia Diária: ${Math.round(gameState.energy)}/${gameState.maxEnergy}`}
                >
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor">
                    <path d="M9.5 1.5 3.5 9h4l-1 5.5 6-7.5h-4l1-5.5Z" />
                  </svg>
                  <div className="flex-1 h-2 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-transform origin-left rounded-full"
                      style={{
                        transform: `scaleX(${Math.max(0, gameState.energy / gameState.maxEnergy)})`
                      }}
                    />
                  </div>
                </div>

                {/* Água do Regador */}
                <div
                  className="flex items-center gap-1.5"
                  title={`Água do Regador: ${gameState.waterCanCharges}/${gameState.maxWaterCanCharges}`}
                >
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-sky-400 shrink-0" fill="currentColor">
                    <path d="M8 1.8S3.5 7.2 3.5 10.2a4.5 4.5 0 0 0 9 0C12.5 7.2 8 1.8 8 1.8Z" />
                  </svg>
                  <div className="flex-1 h-2 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-transform origin-left rounded-full"
                      style={{
                        transform: `scaleX(${Math.max(
                          0,
                          gameState.waterCanCharges / gameState.maxWaterCanCharges
                        )})`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pílula de Controles Rápidos Somente-Ícone (Clima, Ângulo 3D, Cutscene da Semana, Conversar com Morador) */}
            <div
              className="flex items-center gap-1 p-1 rounded-2xl border border-slate-700/80 shadow-xl"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)' }}
            >
              <button
                type="button"
                data-testid="weather-toggle-btn"
                aria-label={`Alternar clima (${currentClimate.label})`}
                title={`${currentMapObj.name} · ${currentClimate.label} (Clique para alternar clima)`}
                onClick={() => {
                  const nextWeather =
                    gameState.weather === 'chuva'
                      ? 'nublado'
                      : gameState.weather === 'nublado'
                      ? 'sol'
                      : 'chuva';
                  setGameState((prev) => ({ ...prev, weather: nextWeather }));
                }}
                className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-slate-600/70 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ModernHudSvgIcon
                  name={
                    gameState.weather === 'chuva'
                      ? 'chuva'
                      : gameState.weather === 'nublado'
                      ? 'nublado'
                      : 'sol'
                  }
                  size={18}
                />
              </button>

              <button
                type="button"
                data-testid="camera-mode-btn"
                aria-label={`Alternar câmera 3D (${cameraMode})`}
                title={`Câmera 3D: ${
                  cameraMode === 'padrao'
                    ? 'Padrão'
                    : cameraMode === 'proxima'
                    ? 'Próxima'
                    : 'Panorâmica'
                } [Tecla V]`}
                onClick={() =>
                  setCameraMode((prev) =>
                    prev === 'padrao' ? 'proxima' : prev === 'proxima' ? 'panoramica' : 'padrao'
                  )
                }
                className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-slate-600/70 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ModernHudSvgIcon name="camera" size={18} />
              </button>

              <button
                type="button"
                data-testid="weekly-in-game-scene-btn"
                aria-label={`Assistir cena 3D da Semana ${unlockedWeek}`}
                title={`Semana ${unlockedWeek}: ${currentWeekInfo.objectiveLabel} (${currentWeekInfo.progressText(
                  gameState
                )}) — Clique para animação 3D`}
                onClick={() => {
                  setActiveWeekEventNumber(unlockedWeek);
                  setActiveCutscene(weekToCutsceneId(unlockedWeek));
                }}
                className="h-9 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-slate-600/70 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" fillOpacity="0.25" />
                </svg>
                <span className="text-[11px] font-extrabold tracking-tight text-slate-100">
                  S{unlockedWeek}
                </span>
              </button>

              {closestNpcInMap && (
                <button
                  type="button"
                  data-testid="talk-nearest-npc-btn"
                  aria-label={`Conversar com ${closestNpcInMap.name}`}
                  title={`Conversar com ${closestNpcInMap.name} (${closestNpcInMap.role})`}
                  onClick={() => openDialogueWithNpc(closestNpcInMap)}
                  className="w-9 h-9 rounded-xl bg-indigo-950/90 hover:bg-indigo-800/90 text-indigo-300 border border-indigo-500/60 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Direita: Relógio Minimalista e Saldo em Slate/Cyan/Amber */}
          <div
            className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl tabular-nums"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-400">
                {weekdayLabel} {gameState.dayOfMonth}
              </span>
              <span className="text-xs sm:text-sm font-mono font-extrabold text-cyan-300">
                {formattedTime}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-mono font-extrabold text-amber-400">
              R$ {Math.round(gameState.money).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. BARRA DE FERRAMENTAS LATERAL (Ícones puros + Clique Direito / Long-Press para Reordenar)
         ==================================================================== */}
      {!activeCutscene && (
        <div className="fixed right-2.5 sm:right-3.5 top-20 z-20 pointer-events-auto flex flex-col gap-2 items-end">
          {/* Dock de Ferramentas Reordenáveis */}
          <div
            data-testid="active-tools-dock"
            className="flex flex-col gap-1.5 p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            {availableTools.map((tool, index) => {
              const active = gameState.selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  data-testid={`toolbar-tool-${tool.id}`}
                  data-tool-id={tool.id}
                  data-tool-index={index}
                  aria-label={`${tool.label} (${tool.shortDesc}) — Botão direito ou segurar para reordenar`}
                  title={`${tool.label}: ${tool.shortDesc} [Tecla ${index + 1}] • Botão direito ou segure para reordenar`}
                  onClick={() => setGameState((s) => ({ ...s, selectedTool: tool.id }))}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setToolContextMenu({
                      toolId: tool.id,
                      label: tool.label,
                      x: e.clientX,
                      y: e.clientY
                    });
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    const clientX = e.clientX;
                    const clientY = e.clientY;
                    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = window.setTimeout(() => {
                      setToolContextMenu({
                        toolId: tool.id,
                        label: tool.label,
                        x: clientX,
                        y: clientY
                      });
                    }, 450);
                  }}
                  onPointerUp={() => {
                    if (longPressTimerRef.current) {
                      window.clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onPointerLeave={() => {
                    if (longPressTimerRef.current) {
                      window.clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  className={`relative w-11 h-11 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                    active
                      ? 'bg-gradient-to-br from-cyan-500/30 to-indigo-600/40 border-cyan-400 text-cyan-200 shadow-lg ring-2 ring-cyan-400/30 scale-105'
                      : 'bg-slate-800/85 border-slate-700/80 text-slate-300 hover:bg-slate-700/90 hover:text-white'
                  }`}
                >
                  <ModernHudSvgIcon name={tool.id} size={22} />
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-slate-400 leading-none">
                    {index + 1}
                  </span>
                  <span
                    className="absolute bottom-0.5 right-1 text-[9px] text-slate-400/80 leading-none"
                    aria-hidden="true"
                  >
                    ⋮
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dock de Menus (Mochila, Feira/Loja, Diário) Somente-Ícone */}
          <div
            className="flex flex-col gap-1.5 p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <button
              type="button"
              data-testid="hud-bag-btn"
              aria-label="Mochila e Casa de Farinha [Tecla I]"
              title="Mochila & Beneficiamento [Tecla I]"
              onClick={() => setActiveModal('inventory')}
              className="w-11 h-11 rounded-xl border border-slate-700/80 bg-slate-800/85 hover:bg-slate-700 text-amber-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ModernHudSvgIcon name="mochila" size={21} />
            </button>

            <button
              type="button"
              data-testid="hud-market-btn"
              aria-label="Feira e Loja Agrícola [Tecla C]"
              title="Feira & Loja Sazonal [Tecla C]"
              onClick={() => setActiveModal('market')}
              className="w-11 h-11 rounded-xl border border-slate-700/80 bg-slate-800/85 hover:bg-slate-700 text-emerald-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ModernHudSvgIcon name="feira" size={21} />
            </button>

            <button
              type="button"
              data-testid="hud-journal-btn"
              aria-label="Diário da Comunidade e Missões [Tecla J]"
              title="Diário, Comunidade & Metas [Tecla J]"
              onClick={() => setActiveModal('journal')}
              className="w-11 h-11 rounded-xl border border-slate-700/80 bg-slate-800/85 hover:bg-slate-700 text-sky-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ModernHudSvgIcon name="diario" size={21} />
            </button>
          </div>
        </div>
      )}

      {/* MENU DE CONTEXTO (CLIQUE DIREITO / LONG-PRESS) PARA REORDENAR FERRAMENTAS */}
      {toolContextMenu && (
        <div
          data-testid="tool-reorder-context-menu"
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-56 rounded-2xl border border-cyan-500/50 shadow-2xl p-2 text-slate-100"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.97)',
            left: `${Math.max(12, Math.min(window.innerWidth - 236, toolContextMenu.x - 180))}px`,
            top: `${Math.max(12, Math.min(window.innerHeight - 250, toolContextMenu.y - 20))}px`
          }}
        >
          <div className="px-2.5 py-1.5 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">
                <ModernHudSvgIcon name={toolContextMenu.toolId} size={16} />
              </span>
              <span className="text-xs font-extrabold tracking-tight text-white">
                {toolContextMenu.label}
              </span>
            </div>
            <button
              type="button"
              aria-label="Fechar menu de ordem"
              onClick={() => setToolContextMenu(null)}
              className="text-xs text-slate-400 hover:text-white px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="py-1 flex flex-col gap-0.5 text-xs">
            <button
              type="button"
              data-testid="reorder-tool-up"
              onClick={() => handleReorderTool(toolContextMenu.toolId, 'move_up')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <span>Mover para Cima</span>
              <span className="text-cyan-400 font-bold">↑</span>
            </button>
            <button
              type="button"
              data-testid="reorder-tool-down"
              onClick={() => handleReorderTool(toolContextMenu.toolId, 'move_down')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <span>Mover para Baixo</span>
              <span className="text-cyan-400 font-bold">↓</span>
            </button>
            <button
              type="button"
              data-testid="reorder-tool-top"
              onClick={() => handleReorderTool(toolContextMenu.toolId, 'move_top')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <span>Fixar no Topo (Tecla 1)</span>
              <span className="text-amber-400 font-bold">⤒</span>
            </button>
            <button
              type="button"
              data-testid="reorder-tool-bottom"
              onClick={() => handleReorderTool(toolContextMenu.toolId, 'move_bottom')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <span>Enviar para o Final</span>
              <span className="text-slate-400 font-bold">⤓</span>
            </button>
            <div className="my-1 border-t border-slate-800" />
            <button
              type="button"
              data-testid="reorder-tool-reset"
              onClick={() => handleReorderTool(toolContextMenu.toolId, 'reset')}
              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-950/60 text-rose-300 flex items-center justify-between text-left cursor-pointer"
            >
              <span>Padrão da Fazenda</span>
              <span>↺</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. BARRA CINEMATOGRÁFICA DE CENA IN-GAME COM RETRATO FOTORREALISTA E DIÁLOGO HUMANO
         ==================================================================== */}
      {cutsceneBanner && (() => {
        const cutsceneNpc =
          cutsceneBanner.speakerNpcId && cutsceneBanner.speakerNpcId !== 'player'
            ? CHARACTERS_DATA.find((c) => c.id === cutsceneBanner.speakerNpcId) ?? CHARACTERS_DATA[0]
            : null;
        return (
          <div
            data-testid="in-game-cutscene-banner"
            className="fixed inset-x-3 bottom-4 z-30 max-w-2xl mx-auto rounded-2xl p-3.5 shadow-2xl border border-cyan-500/50 flex flex-col gap-2.5"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
          >
            <div className="flex items-start gap-3.5">
              <div
                data-testid="cutscene-speaker-portrait"
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 shrink-0 shadow-xl bg-slate-900 ${
                  cutsceneNpc ? 'border-cyan-400' : 'border-amber-400'
                }`}
              >
                {cutsceneNpc ? (
                  <PixelNpcPortraitCanvas
                    shirtColor={cutsceneNpc.shirtColor}
                    hatColor={cutsceneNpc.hatColor}
                    hairColor={cutsceneNpc.hairColor}
                    label={cutsceneNpc.name}
                    className="w-full h-full"
                  />
                ) : (
                  <PixelPortraitCanvas className="w-full h-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 truncate">
                      {cutsceneBanner.title}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-amber-300 truncate">
                      {cutsceneBanner.speaker}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="skip-cutscene-btn"
                    onClick={() => {
                      setActiveCutscene(null);
                      setCutsceneBanner(null);
                    }}
                    className="min-h-[34px] px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-extrabold border border-slate-600 cursor-pointer shrink-0"
                  >
                    Jogar ⏭
                  </button>
                </div>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed">
                  {cutsceneBanner.actionSubtitle}
                </p>
              </div>
            </div>

            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                style={{ width: `${Math.round(cutsceneBanner.progress * 100)}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* CAIXA DE DIÁLOGO COM RETRATO FOTORREALISTA DO PERSONAGEM, PALAVRA POR PALAVRA, VOZ E CONVERSA HUMANA NATURAL */}
      {activeDialogue && !cutsceneBanner && (
        <div
          data-testid="interactive-dialogue-box"
          className="fixed inset-x-3 bottom-4 z-30 max-w-2xl mx-auto rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-slate-600/90 text-slate-100 flex flex-col gap-3"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
        >
          <div className="flex items-start gap-3.5">
            {/* Retrato Fotorrealista do interlocutor ativo (Morador ou Cauã) */}
            <div className="relative shrink-0">
              <div
                data-testid="dialogue-character-photo"
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shadow-xl bg-slate-900 ${
                  activeDialogue.speaker === 'player'
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : 'border-cyan-400 ring-2 ring-cyan-400/30'
                }`}
              >
                {activeDialogue.speaker === 'player' ? (
                  <PixelPortraitCanvas className="w-full h-full" />
                ) : (
                  <PixelNpcPortraitCanvas
                    shirtColor={activeDialogue.npc.shirtColor}
                    hatColor={activeDialogue.npc.hatColor}
                    hairColor={activeDialogue.npc.hairColor}
                    label={activeDialogue.npc.name}
                    className="w-full h-full"
                  />
                )}
              </div>
              <span
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow ${
                  activeDialogue.speaker === 'player'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-cyan-400 text-slate-950'
                }`}
              >
                {activeDialogue.speaker === 'player' ? 'Cauã' : 'Morador'}
              </span>
            </div>

            {/* Cabeçalho do Falante + Texto digitado Uma Palavra por Vez */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm sm:text-base font-extrabold text-white truncate">
                    {activeDialogue.speaker === 'player'
                      ? 'Cauã'
                      : activeDialogue.npc.name}
                  </span>
                  <span className="text-[11px] font-semibold text-cyan-300/90 truncate">
                    ·{' '}
                    {activeDialogue.speaker === 'player'
                      ? 'Sítio Boa Esperança'
                      : activeDialogue.npc.role}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[11px] font-bold text-rose-400 flex items-center gap-1"
                    title="Nível de Amizade na Comunidade"
                  >
                    ♥ {gameState.relationships[activeDialogue.npc.id] ?? 25}%
                  </span>
                  <button
                    type="button"
                    data-testid="close-dialogue-btn"
                    aria-label="Encerrar conversa"
                    onClick={() => setActiveDialogue(null)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Texto sendo digitado uma palavra por vez com cursor vivo */}
              <div
                data-testid="dialogue-typed-text"
                onClick={() => {
                  if (isTypingDialogue) {
                    setTypedWordCount(dialogueWords.length);
                  }
                }}
                className="mt-1.5 min-h-[48px] p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-100 leading-relaxed cursor-pointer"
                title={isTypingDialogue ? 'Clique para mostrar toda a frase' : undefined}
              >
                <span>"{dialogueWords.slice(0, typedWordCount).join(' ')}"</span>
                {isTypingDialogue && (
                  <span className="inline-block ml-1.5 w-2 h-3.5 bg-cyan-400 animate-pulse align-middle" />
                )}
              </div>
            </div>
          </div>

          {/* Rodapé Interativo: Opções de Diálogo Humano ou Avanço da Conversa */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/90">
            {isTypingDialogue ? (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-cyan-300/90 font-semibold flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Falando ({typedWordCount}/{dialogueWords.length} palavras)...
                </span>
                <button
                  type="button"
                  data-testid="complete-typing-btn"
                  onClick={() => setTypedWordCount(dialogueWords.length)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold cursor-pointer"
                >
                  Completar Frase ⏭
                </button>
              </div>
            ) : activeDialogue.phase === 'npc_greeting' ? (
              <div className="space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Como você responde na conversa:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {activeDialogue.choices.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid="first-person-choice-btn"
                      onClick={() => {
                        setActiveDialogue({
                          ...activeDialogue,
                          speaker: 'player',
                          fullText: opt.playerFirstPersonText,
                          phase: 'player_speaking',
                          selectedOption: opt
                        });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/95 hover:bg-indigo-950/90 border border-slate-700 hover:border-amber-400/80 text-xs font-semibold text-amber-100 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <span className="line-clamp-2">💬 {opt.playerFirstPersonText}</span>
                      <span className="text-[10px] font-extrabold text-emerald-400 shrink-0">
                        +{opt.relationshipBonus} ♥
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : activeDialogue.phase === 'player_speaking' && activeDialogue.selectedOption ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-300/90 font-medium">
                  Conversando com {activeDialogue.npc.name}...
                </span>
                <button
                  type="button"
                  data-testid="dialogue-hear-npc-reply-btn"
                  onClick={() => {
                    const opt = activeDialogue.selectedOption!;
                    setActiveDialogue({
                      ...activeDialogue,
                      speaker: 'npc',
                      fullText: opt.npcFollowUpText,
                      phase: 'npc_followup'
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Ouvir {activeDialogue.npc.name.split(' ').slice(0, 2).join(' ')} →
                </button>
              </div>
            ) : activeDialogue.phase === 'npc_followup' && activeDialogue.selectedOption ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-cyan-300/90 font-medium">
                  {activeDialogue.npc.name} compartilhou dicas valiosas do Juruá.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="dialogue-player-closing-btn"
                    onClick={() => {
                      const opt = activeDialogue.selectedOption!;
                      setGameState((prev) => ({
                        ...prev,
                        energy: Math.min(prev.maxEnergy, prev.energy + opt.energyBonus),
                        relationships: {
                          ...prev.relationships,
                          [activeDialogue.npc.id]: Math.min(
                            100,
                            (prev.relationships[activeDialogue.npc.id] ?? 25) + opt.relationshipBonus
                          )
                        }
                      }));
                      setActiveDialogue({
                        ...activeDialogue,
                        speaker: 'player',
                        fullText: opt.playerClosingThought,
                        phase: 'player_closing'
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                  >
                    Despedir-se e Agradecer (+{activeDialogue.selectedOption.energyBonus}⚡) →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-300 font-semibold">
                  ✓ Amizade fortalecida e energia revigorada!
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDialogue({
                        ...activeDialogue,
                        speaker: 'npc',
                        fullText: activeDialogue.npc.dialogues.greeting,
                        phase: 'npc_greeting'
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Outro Assunto
                  </button>
                  <button
                    type="button"
                    data-testid="finish-dialogue-btn"
                    onClick={() => setActiveDialogue(null)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                  >
                    Concluir Conversa ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          5. CONTROLES INFERIORES DE AÇÃO (Ícones Puros, Sem Palavras Desnecessárias)
         ==================================================================== */}
      {!activeCutscene && !activeDialogue && (
        <div className="fixed right-2.5 sm:right-3.5 bottom-3 z-20 pointer-events-none flex justify-end">
          <div
            className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <button
              type="button"
              data-testid="seed-quick-btn"
              aria-label={`Semente selecionada: ${selectedCrop.name} (${selectedSeedCount})`}
              title={`Semente ativa: ${selectedCrop.name} (×${selectedSeedCount})`}
              onClick={() => {
                setGameState((s) => ({ ...s, selectedTool: 'semente' }));
                setActiveModal('inventory');
              }}
              className="relative w-11 h-11 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-slate-100 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <PixelIconCanvas
                kind={selectedCrop.id}
                size={20}
                isSwaying={currentClimate.isRaining}
              />
              <span className="absolute -bottom-1 -right-1 px-1 rounded-md bg-amber-400 text-slate-950 text-[9px] font-mono font-extrabold leading-tight shadow">
                {selectedSeedCount}
              </span>
            </button>

            <button
              type="button"
              data-testid="options-quick-btn"
              aria-label="Salvar e Opções"
              title="Salvar Jogo & Opções [Esc]"
              onClick={() => setActiveModal('save')}
              className="w-11 h-11 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <ModernHudSvgIcon name="opcoes" size={20} />
            </button>

            <button
              type="button"
              data-testid="primary-action-btn"
              aria-label="Executar ação da ferramenta ativa [Espaço]"
              title="Executar Ação no Mundo [Espaço ou Clique]"
              onClick={() => setActionTriggerCount((c) => c + 1)}
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 border-2 border-cyan-200/80 text-slate-950 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <ModernHudSvgIcon name="agir" size={26} />
            </button>
          </div>
        </div>
      )}

      {/* 6. JANELAS E MODAIS DO JOGO */}
      <GameModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        activeWeekEventNumber={activeWeekEventNumber}
        onSelectSeed={(cropId) => {
          setGameState((prev) => ({
            ...prev,
            selectedSeedId: cropId,
            selectedTool: 'semente'
          }));
        }}
        onConsumeItem={(itemId) => {
          const info = getItemSellPrice(itemId);
          const have = gameState.inventory[itemId] ?? 0;
          if (have <= 0) return;
          const nextInv = { ...gameState.inventory, [itemId]: have - 1 };
          if (nextInv[itemId] <= 0) delete nextInv[itemId];
          soundEngine.playSfx('harvest');
          setGameState((prev) => ({
            ...prev,
            energy: Math.min(prev.maxEnergy, prev.energy + info.energy),
            inventory: nextInv
          }));
        }}
        onProcessRecipe={(recipeId) => {
          const res = processRecipe(gameState, recipeId);
          if (res.ok) soundEngine.playSfx('coin');
          setGameState(res.state);
          setToastMessage(res.message);
        }}
        onBuySeed={(cropId, qty) => {
          const res = buySeed(gameState, cropId, qty);
          if (res.ok) soundEngine.playSfx('coin');
          setGameState(res.state);
          setToastMessage(res.message);
        }}
        onSellItem={(itemId, qty) => {
          const res = sellItem(gameState, itemId, qty);
          if (res.ok) soundEngine.playSfx('coin');
          setGameState(res.state);
          setToastMessage(res.message);
        }}
        onFulfillContract={(contractId) => {
          const res = fulfillCommercialContract(gameState, contractId);
          if (res.ok) soundEngine.playSfx('quest_complete');
          setGameState(res.state);
          setToastMessage(res.message);
        }}
        onBuyAnimal={(catId: AnimalCategoryId) => {
          const res = buyAnimal(gameState, catId);
          if (res.ok) soundEngine.playSfx('animal');
          setGameState(res.state);
          setToastMessage(res.message);
        }}
        onFeedAndCollectAnimal={(animId) => {
          const res = feedAndCollectAnimal(gameState, animId);
          if (res.ok) soundEngine.playSfx('animal');
          setGameState(res.state);
          setToastMessage(res.message);
        }}
        onSleepAdvanceDay={() => {
          const res = advanceDayState(gameState);
          soundEngine.playSfx('quest_complete');
          setGameState(res.state);
          setToastMessage(`Novo dia começou! ${res.summary.join(' ')}`);
        }}
        onGiftCharacter={(charId) => {
          const ch = CHARACTERS_DATA.find((c) => c.id === charId);
          if (!ch) return;
          soundEngine.playSfx('quest_complete');
          setGameState((prev) =>
            evaluateQuests({
              ...prev,
              relationships: {
                ...prev.relationships,
                [charId]: Math.min(100, (prev.relationships[charId] ?? 20) + 10)
              }
            })
          );
        }}
        onChooseLegacy={(choice) => {
          soundEngine.playSfx('quest_complete');
          setGameState((prev) => ({ ...prev, legacyChoice: choice }));
        }}
        saveSlots={saveSlots}
        onSaveToSlot={handleSaveToSlot}
        onLoadFromSlot={handleLoadFromSlot}
        onReturnToTitle={() => {
          setActiveModal(null);
          setScreenMode('title');
        }}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          soundEngine.setMuted(next);
        }}
      />
    </main>
  );
}
