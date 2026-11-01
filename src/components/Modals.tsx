/**
 * TELAS E JANELAS DO JOGO (Mochila, Feira & Loja Sazonal, Criações, Diário, Evento Semanal, Salvamento e Pausa)
 * Interface limpa e pronta para apresentação pública, sem menus de teleporte de mapas e sem comentários técnicos.
 */

import React, { useState } from 'react';
import {
  GameState,
  SEASON_ORDER,
  WEEKLY_MECHANIC_EVENTS,
  getItemSellPrice,
  getUnlockedWeek,
  isSeedAvailableInSeason
} from '../game/rules';
import { CROP_LIST, SEASONS_INFO } from '../data/crops';
import { ANIMAL_CATEGORY_LIST, ANIMAL_CATEGORIES, AnimalCategoryId } from '../data/animals';
import { FISH_LIST, RECIPE_LIST } from '../data/fishingAndRecipes';
import {
  CAMPAIGN_YEARS,
  CHARACTERS_DATA,
  FESTIVALS_DATA,
  QUESTS_DATA
} from '../data/charactersAndQuests';
import { MAPS_DATA } from '../data/maps';
import { PixelIconCanvas } from './PixelArtWidgets';

export type ActiveModalType =
  | null
  | 'inventory'
  | 'market'
  | 'animals'
  | 'journal'
  | 'weekly_event'
  | 'save'
  | 'credits'
  | 'pause';

export interface SaveSlotSummary {
  slotIndex: 1 | 2 | 3;
  exists: boolean;
  savedAt?: string;
  year?: number;
  day?: number;
  money?: number;
  farmName?: string;
}

interface ModalsProps {
  activeModal: ActiveModalType;
  onClose: () => void;
  gameState: GameState;
  activeWeekEventNumber?: 1 | 2 | 3 | 4 | 5;
  onSelectSeed: (cropId: string) => void;
  onConsumeItem: (itemId: string) => void;
  onProcessRecipe: (recipeId: string) => void;
  onBuySeed: (cropId: string, qty: number) => void;
  onSellItem: (itemId: string, qty: number) => void;
  onFulfillContract: (contractId: string) => void;
  onBuyAnimal: (categoryId: AnimalCategoryId) => void;
  onFeedAndCollectAnimal: (animalId: string) => void;
  onSleepAdvanceDay: () => void;
  onGiftCharacter: (charId: string) => void;
  onChooseLegacy: (choice: 'escola_agroflorestal' | 'cooperativa_farinha_ig' | 'centro_manejo_jurua') => void;
  saveSlots: SaveSlotSummary[];
  onSaveToSlot: (slotIndex: 1 | 2 | 3) => void;
  onLoadFromSlot: (slotIndex: 1 | 2 | 3) => void;
  onReturnToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameModals: React.FC<ModalsProps> = ({
  activeModal,
  onClose,
  gameState,
  activeWeekEventNumber,
  onSelectSeed,
  onConsumeItem,
  onProcessRecipe,
  onBuySeed,
  onSellItem,
  onFulfillContract,
  onBuyAnimal,
  onFeedAndCollectAnimal,
  onSleepAdvanceDay,
  onGiftCharacter,
  onChooseLegacy,
  saveSlots,
  onSaveToSlot,
  onLoadFromSlot,
  onReturnToTitle,
  isMuted,
  onToggleMute
}) => {
  const [invTab, setInvTab] = useState<'mochila' | 'beneficiamento' | 'peixes'>('mochila');
  const [marketTab, setMarketTab] = useState<'sementes' | 'vender' | 'contratos' | 'historico'>('sementes');
  const [journalTab, setJournalTab] = useState<'semanas' | 'missoes' | 'personagens' | 'livro_agricola'>('semanas');

  if (!activeModal) return null;

  const currentSeasonId = SEASON_ORDER[gameState.seasonIndex];
  const currentSeasonInfo = SEASONS_INFO[currentSeasonId];
  const unlockedWeek = getUnlockedWeek(gameState);
  const weekMilestone =
    WEEKLY_MECHANIC_EVENTS.find((w) => w.week === (activeWeekEventNumber ?? unlockedWeek)) ??
    WEEKLY_MECHANIC_EVENTS[0];

  const inSeasonCrops = CROP_LIST.filter((c) => isSeedAvailableInSeason(c.id, gameState.seasonIndex));
  const outOfSeasonCrops = CROP_LIST.filter((c) => !isSeedAvailableInSeason(c.id, gameState.seasonIndex));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4"
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.82)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Cabeçalho Moderno Slate/Oceanic */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              {activeModal === 'inventory' && 'Mochila & Casa de Farinha'}
              {activeModal === 'market' && 'Casa Agrícola & Feira de Cruzeiro do Sul'}
              {activeModal === 'animals' && 'Curral, Galinheiro & Viveiro do Sítio'}
              {activeModal === 'journal' && 'Diário do Sítio, Etapas Semanais & Comunidade'}
              {activeModal === 'weekly_event' && `${weekMilestone.title}`}
              {activeModal === 'save' && 'Salvar Jogo & Opções'}
              {activeModal === 'credits' && 'Amazônia: Chamado Ribeirinho Acreano'}
              {activeModal === 'pause' && 'Jogo Pausado — Vale do Juruá'}
            </h2>
            <p className="text-xs text-cyan-300/90 font-medium">
              Ano {gameState.year} · {currentSeasonInfo.name} · Dia {gameState.dayOfMonth} · Semana {unlockedWeek} · R$ {gameState.money}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="min-h-[38px] min-w-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs cursor-pointer transition-colors"
          >
            ✕ [Esc]
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* ================================================================
              0. EVENTO DE NOVA SEMANA & NOVA MECÂNICA DESBLOQUEADA
             ================================================================ */}
          {activeModal === 'weekly_event' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#331f12] border-2 border-[#dfc16d] space-y-2.5">
                <div className="text-xs font-extrabold text-[#ffdf78]">
                  NOVO EVENTO SEMANAL NO VALE DO JURUÁ · {weekMilestone.eventSpeaker}
                </div>
                <h3 className="text-lg font-extrabold text-[#fff8e7]">
                  {weekMilestone.eventTitle}
                </h3>
                <p className="text-xs sm:text-sm text-[#eddcc4] leading-relaxed">
                  "{weekMilestone.eventNarrative}"
                </p>

                <div className="p-3 rounded-xl bg-[#1f2e1b] border border-[#7bc47f] space-y-1">
                  <div className="text-xs font-extrabold text-[#a5cf61]">
                    Nova Mecânica Liberada nesta Semana:
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    {weekMilestone.mechanicUnlockedLabel}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#1c1109] border border-[#8c6239] space-y-1">
                  <div className="text-xs font-extrabold text-[#dfc16d]">
                    Objetivo da Semana {weekMilestone.week}:
                  </div>
                  <div className="text-xs sm:text-sm text-[#f7e7c4]">
                    {weekMilestone.objectiveLabel} ({weekMilestone.progressText(gameState)})
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#3b7a3e] hover:bg-[#49914d] text-white font-extrabold text-xs sm:text-sm cursor-pointer"
                >
                  Continuar Jornada na Fazenda ▶
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              1. INVENTÁRIO E BENEFICIAMENTO (CASA DE FARINHA / DESPOLPADEIRA)
             ================================================================ */}
          {activeModal === 'inventory' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 bg-[#1c1109] p-1.5 rounded-xl border border-[#5c3824]">
                <button
                  type="button"
                  onClick={() => setInvTab('mochila')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                    invTab === 'mochila' ? 'bg-[#3b7a3e] text-white' : 'text-[#d8c5a3] hover:text-white'
                  }`}
                >
                  Itens na Mochila ({Object.keys(gameState.inventory).length})
                </button>
                <button
                  type="button"
                  onClick={() => setInvTab('beneficiamento')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                    invTab === 'beneficiamento' ? 'bg-[#b84d35] text-white' : 'text-[#d8c5a3] hover:text-white'
                  }`}
                >
                  Casa de Farinha & Polpas ({RECIPE_LIST.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInvTab('peixes')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                    invTab === 'peixes' ? 'bg-[#2c6896] text-white' : 'text-[#d8c5a3] hover:text-white'
                  }`}
                >
                  Peixes do Rio Juruá ({FISH_LIST.length})
                </button>
              </div>

              {invTab === 'mochila' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(gameState.inventory).map(([itemId, qty]) => {
                    const isSeed = itemId.startsWith('seed_');
                    const cropId = isSeed ? itemId.replace('seed_', '') : itemId;
                    const info = getItemSellPrice(itemId);
                    return (
                      <div
                        key={itemId}
                        className="p-3 rounded-xl bg-[#331f12] border border-[#6e4726] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#1c2e16] border border-[#5c9142] flex items-center justify-center shrink-0">
                            <PixelIconCanvas kind={cropId} size={22} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#f7e7c4]">
                              {info.name} <span className="text-[#a5cf61] tabular-nums">×{qty}</span>
                            </div>
                            <div className="text-xs text-[#d8c5a3] tabular-nums">
                              Valor na feira: R$ {info.price}
                              {!isSeed && info.energy > 0 ? ` · +${info.energy} Energia` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isSeed ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSeed(cropId);
                                onClose();
                              }}
                              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                                gameState.selectedSeedId === cropId
                                  ? 'bg-[#a5cf61] text-[#1a2912]'
                                  : 'bg-[#3b7a3e] text-white'
                              }`}
                            >
                              {gameState.selectedSeedId === cropId ? 'Equipada' : 'Equipar'}
                            </button>
                          ) : (
                            <>
                              {info.energy > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onConsumeItem(itemId)}
                                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-[#2c6896] hover:bg-[#3980b5] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                                >
                                  Consumir (+{info.energy})
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onSellItem(itemId, 1)}
                                className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-[#8c583a] hover:bg-[#a86b47] text-[#fff8e7] text-xs font-semibold cursor-pointer whitespace-nowrap"
                              >
                                Vender (R$ {info.price})
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {invTab === 'beneficiamento' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-[#dfc16d]">
                    Transforme a mandioca colhida na tradicional Farinha de Cruzeiro do Sul, extraia goma de tapioca e bata polpas de açaí e cupuaçu.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {RECIPE_LIST.map((rec) => {
                      const canCraft = rec.inputs.every(
                        (inp) => (gameState.inventory[inp.itemId] ?? 0) >= inp.quantity
                      );
                      return (
                        <div
                          key={rec.id}
                          className="p-3 rounded-xl bg-[#331f12] border border-[#73482b] flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs text-[#dfc16d] font-semibold">
                              {rec.stationLabel} · Produz {rec.outputQuantity}x (R$ {rec.sellPrice} un.)
                            </div>
                            <div className="text-sm font-bold text-[#f7e7c4] mt-0.5">{rec.name}</div>
                            <p className="text-xs text-[#d8c5a3] mt-1">{rec.description}</p>
                            <div className="text-xs text-[#a5cf61] mt-1.5">
                              Ingredientes:{' '}
                              {rec.inputs
                                .map(
                                  (i) =>
                                    `${i.quantity}x ${i.itemName} (você tem ${gameState.inventory[i.itemId] ?? 0})`
                                )
                                .join(' + ')}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!canCraft}
                            onClick={() => onProcessRecipe(rec.id)}
                            className={`min-h-[40px] w-full px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                              canCraft
                                ? 'bg-[#b84d35] hover:bg-[#cf593e] text-white'
                                : 'bg-[#22150c] text-[#7a6452] cursor-not-allowed'
                            }`}
                          >
                            {canCraft ? `Preparar ${rec.name}` : 'Ingredientes Insuficientes'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {invTab === 'peixes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FISH_LIST.map((fish) => (
                    <div
                      key={fish.id}
                      className="p-3 rounded-xl bg-[#1f2f3d] border border-[#4b8da8] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#f7e7c4]">{fish.name}</span>
                        <span className="text-xs font-mono text-[#a5cf61] tabular-nums">
                          R$ {fish.basePrice} · {fish.minSizeCm}–{fish.maxSizeCm} cm
                        </span>
                      </div>
                      <div className="text-xs text-[#b3dce8]">
                        Isca preferida: {fish.preferredBait.replace('_', ' ')} · Raridade: {fish.rarity}
                      </div>
                      <p className="text-xs text-[#d8c5a3]">{fish.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              2. LOJA DE SEMENTES POR ESTAÇÃO & FEIRA DE CRUZEIRO DO SUL
             ================================================================ */}
          {activeModal === 'market' && (
            <div className="space-y-4">
              {/* Banner da Estação Atual explicando o que pode ser comprado */}
              <div className="p-3 rounded-xl bg-[#1f2e1b] border border-[#7bc47f] space-y-1">
                <div className="text-xs font-extrabold text-[#a5cf61]">
                  Safra da Estação Atual: {currentSeasonInfo.name} ({currentSeasonInfo.months})
                </div>
                <p className="text-xs text-[#e2f5d5]">
                  {currentSeasonInfo.description} Você começou com 10 manivas de Mandioca Mansa e pode comprar abaixo todas as sementes disponíveis para plantio nesta estação:
                </p>
              </div>

              <div className="flex flex-wrap gap-2 bg-[#1c1109] p-1.5 rounded-xl border border-[#5c3824]">
                <button
                  type="button"
                  onClick={() => setMarketTab('sementes')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    marketTab === 'sementes' ? 'bg-[#3b7a3e] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Sementes da Estação ({inSeasonCrops.length} disponíveis)
                </button>
                <button
                  type="button"
                  onClick={() => setMarketTab('vender')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    marketTab === 'vender' ? 'bg-[#d4892a] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Vender Colheita
                </button>
                <button
                  type="button"
                  onClick={() => setMarketTab('contratos')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    marketTab === 'contratos' ? 'bg-[#2c6896] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Encomendas ({gameState.contracts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMarketTab('historico')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    marketTab === 'historico' ? 'bg-[#8c583a] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Livro Caixa ({gameState.transactions.length})
                </button>
              </div>

              {marketTab === 'sementes' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#a5cf61] mb-2">
                      Disponíveis para Compra em {currentSeasonInfo.name} ({inSeasonCrops.length} Culturas)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {inSeasonCrops.map((crop) => {
                        const ownedSeeds = gameState.inventory[`seed_${crop.id}`] ?? 0;
                        return (
                          <div
                            key={crop.id}
                            className="p-3 rounded-xl bg-[#331f12] border border-[#6e4726] flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-[#1c2e16] border border-[#5c9142] flex items-center justify-center shrink-0">
                                <PixelIconCanvas
                                  kind={crop.id}
                                  size={24}
                                  isSwaying={gameState.weather === 'chuva'}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[#f7e7c4]">{crop.seedName}</div>
                                <div className="text-xs text-[#d8c5a3] tabular-nums">
                                  Ciclo: {crop.growthDays}d · Venda: R$ {crop.sellPrice} · Na bolsa: {ownedSeeds}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onBuySeed(crop.id, 1)}
                              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#3b7a3e] hover:bg-[#49914d] text-white text-xs font-bold cursor-pointer whitespace-nowrap tabular-nums"
                            >
                              Comprar R$ {crop.seedPrice}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {outOfSeasonCrops.length > 0 && (
                    <div>
                      <h3 className="text-xs font-extrabold text-[#dfc16d] mb-2">
                        Sementes de Outras Estações Amazônicas ({outOfSeasonCrops.length} Culturas)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {outOfSeasonCrops.map((crop) => {
                          const seasonLabels = crop.preferredSeasons
                            .map((s) => SEASONS_INFO[s].name)
                            .join(', ');
                          return (
                            <div
                              key={crop.id}
                              className="p-3 rounded-xl bg-[#1c1109] border border-[#4a2e1b] flex items-center justify-between gap-2 opacity-80"
                            >
                              <div>
                                <div className="text-sm font-bold text-[#d8c5a3]">{crop.seedName}</div>
                                <div className="text-[11px] text-[#dfc16d]">
                                  Estação de Compra: {seasonLabels}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#9c826b] whitespace-nowrap">
                                Aguarde a Estação
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {marketTab === 'vender' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(gameState.inventory)
                    .filter(([k]) => !k.startsWith('seed_'))
                    .map(([itemId, qty]) => {
                      const info = getItemSellPrice(itemId);
                      return (
                        <div
                          key={itemId}
                          className="p-3 rounded-xl bg-[#331f12] border border-[#6e4726] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-sm font-bold text-[#f7e7c4]">
                              {info.name} <span className="text-[#a5cf61] tabular-nums">×{qty}</span>
                            </div>
                            <div className="text-xs text-[#dfc16d] tabular-nums">
                              Valor na Feira: R$ {info.price} un.
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSellItem(itemId, 1)}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#d4892a] text-[#1f1208] text-xs font-bold cursor-pointer tabular-nums"
                            >
                              Vender 1 (R$ {info.price})
                            </button>
                            {qty > 1 && (
                              <button
                                type="button"
                                onClick={() => onSellItem(itemId, qty)}
                                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#3b7a3e] text-white text-xs font-bold cursor-pointer tabular-nums"
                              >
                                Tudo (R$ {info.price * qty})
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {marketTab === 'contratos' && (
                <div className="space-y-2.5">
                  {gameState.contracts.map((cnt) => {
                    const have = gameState.inventory[cnt.itemId] ?? 0;
                    const ready = have >= cnt.quantityRequired && !cnt.completed;
                    return (
                      <div
                        key={cnt.id}
                        className="p-3.5 rounded-xl bg-[#331f12] border border-[#73482b] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs text-[#dfc16d] font-semibold">{cnt.clientName}</div>
                          <div className="text-sm font-bold text-[#f7e7c4]">
                            Encomenda: {cnt.quantityRequired}x {cnt.itemName} (Em estoque: {have})
                          </div>
                          <div className="text-xs text-[#a5cf61] tabular-nums">
                            Pagamento: R$ {cnt.rewardMoney} · +{cnt.bonusReputation} Reputação
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() => onFulfillContract(cnt.id)}
                          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                            cnt.completed
                              ? 'bg-[#2a3b2b] text-[#a5cf61] cursor-default'
                              : ready
                              ? 'bg-[#2c6896] hover:bg-[#3a7fb5] text-white'
                              : 'bg-[#22150c] text-[#7a6452] cursor-not-allowed'
                          }`}
                        >
                          {cnt.completed ? 'Encomenda Entregue' : ready ? 'Entregar Encomenda' : 'Faltam Produtos'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {marketTab === 'historico' && (
                <div className="space-y-1.5">
                  {gameState.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="px-3 py-2 rounded-lg bg-[#1c1109] border border-[#4a2e1b] flex items-center justify-between text-xs"
                    >
                      <span>
                        Ano {tx.year}, Dia {tx.day} · {tx.description}
                      </span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          tx.amount >= 0 ? 'text-[#a5cf61]' : 'text-[#e3772b]'
                        }`}
                      >
                        {tx.amount >= 0 ? `+R$ ${tx.amount}` : `-R$ ${Math.abs(tx.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              3. CRIAÇÕES DO SÍTIO E VIVEIRO DE PEIXES
             ================================================================ */}
          {activeModal === 'animals' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#dfc16d] mb-2">
                  Criações & Viveiros na Propriedade ({gameState.animals.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {gameState.animals.map((anim) => {
                    const def = ANIMAL_CATEGORIES[anim.categoryId];
                    return (
                      <div
                        key={anim.id}
                        className="p-3 rounded-xl bg-[#331f12] border border-[#73482b] flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-sm font-bold text-[#f7e7c4]">
                            {anim.customName} ({def.singularName})
                          </div>
                          <div className="text-xs text-[#d8c5a3] tabular-nums">
                            Saúde: {anim.health}% · {anim.fedToday ? 'Alimentado hoje' : 'Com fome'} ·{' '}
                            {anim.hasProductReady ? `Pronto: ${def.productName}` : 'Em produção'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onFeedAndCollectAnimal(anim.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#3b7a3e] hover:bg-[#49914d] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          {anim.hasProductReady ? 'Coletar & Alimentar' : 'Alimentar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#dfc16d] mb-2">
                  Adquirir Novas Criações na Agropecuária
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ANIMAL_CATEGORY_LIST.map((cat) => {
                    const count = gameState.animals.filter((a) => a.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 rounded-xl bg-[#1c1109] border border-[#5c3824] flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#f7e7c4]">{cat.name}</span>
                            <span className="text-xs text-[#a5cf61] tabular-nums">
                              Abrigo: {count}/{cat.maxPerShelter}
                            </span>
                          </div>
                          <div className="text-xs text-[#dfc16d] mt-0.5">
                            Produz: {cat.productName} (R$ {cat.productSellPrice})
                          </div>
                          <p className="text-xs text-[#d8c5a3] mt-1">{cat.behaviorNotes}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onBuyAnimal(cat.id)}
                          className="min-h-[38px] w-full px-3 py-1.5 rounded-lg bg-[#2c6896] hover:bg-[#3a7fb5] text-white text-xs font-bold cursor-pointer tabular-nums"
                        >
                          Adquirir {cat.singularName} — R$ {cat.buyPrice}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              4. DIÁRIO RIBEIRINHO: ETAPAS SEMANAIS, MISSÕES, MORADORES & CULTURAS
             ================================================================ */}
          {activeModal === 'journal' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 bg-[#1c1109] p-1.5 rounded-xl border border-[#5c3824]">
                <button
                  type="button"
                  onClick={() => setJournalTab('semanas')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    journalTab === 'semanas' ? 'bg-[#3b7a3e] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Jornada Semanal (Semana {unlockedWeek}/5)
                </button>
                <button
                  type="button"
                  onClick={() => setJournalTab('missoes')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    journalTab === 'missoes' ? 'bg-[#2c6896] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Missões ({gameState.completedQuests.length}/{QUESTS_DATA.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJournalTab('personagens')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    journalTab === 'personagens' ? 'bg-[#b84d35] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Moradores ({CHARACTERS_DATA.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJournalTab('livro_agricola')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    journalTab === 'livro_agricola' ? 'bg-[#8c583a] text-white' : 'text-[#d8c5a3]'
                  }`}
                >
                  Almanaque Agrícola & Estações
                </button>
              </div>

              {journalTab === 'semanas' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#d8c5a3]">
                    A cada semana (ou ao cumprir o objetivo da semana atual), um novo evento no sítio apresenta uma nova mecânica e atividade:
                  </p>
                  {WEEKLY_MECHANIC_EVENTS.map((ev) => {
                    const isUnlocked = ev.week <= unlockedWeek;
                    const isDone = ev.isObjectiveComplete(gameState);
                    return (
                      <div
                        key={ev.week}
                        className={`p-3.5 rounded-xl border space-y-1.5 ${
                          isDone
                            ? 'bg-[#21361e] border-[#a5cf61]'
                            : isUnlocked
                            ? 'bg-[#331f12] border-[#dfc16d]'
                            : 'bg-[#1c1109] border-[#4a2e1b] opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#f7e7c4]">{ev.title}</span>
                          <span className="text-xs font-bold text-[#dfc16d]">
                            {isDone ? 'Concluída' : isUnlocked ? 'Semana Ativa' : 'Próxima Etapa'}
                          </span>
                        </div>
                        <div className="text-xs text-[#a5cf61] font-semibold">
                          Mecânica: {ev.mechanicUnlockedLabel}
                        </div>
                        <p className="text-xs text-[#d8c5a3]">{ev.eventNarrative}</p>
                        <div className="text-xs font-bold text-[#fff5d6]">
                          Objetivo: {ev.objectiveLabel} —{' '}
                          <span className="text-[#ffd56b]">{ev.progressText(gameState)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Escolha do Legado Familiar */}
                  {unlockedWeek >= 5 && (
                    <div className="p-3.5 rounded-xl bg-[#1c1109] border border-[#9c663e] space-y-2">
                      <div className="text-sm font-bold text-[#f0d88b]">
                        Vocação do Legado Familiar em Cruzeiro do Sul
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => onChooseLegacy('escola_agroflorestal')}
                          className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                            gameState.legacyChoice === 'escola_agroflorestal'
                              ? 'bg-[#3b7a3e] border-[#a5cf61] text-white'
                              : 'bg-[#331f12] border-[#6e4726] text-[#f4ebd9]'
                          }`}
                        >
                          Escola Agroflorestal do Juruá
                        </button>
                        <button
                          type="button"
                          onClick={() => onChooseLegacy('cooperativa_farinha_ig')}
                          className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                            gameState.legacyChoice === 'cooperativa_farinha_ig'
                              ? 'bg-[#b84d35] border-[#f0d88b] text-white'
                              : 'bg-[#331f12] border-[#6e4726] text-[#f4ebd9]'
                          }`}
                        >
                          Cooperativa da Casa de Farinha
                        </button>
                        <button
                          type="button"
                          onClick={() => onChooseLegacy('centro_manejo_jurua')}
                          className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                            gameState.legacyChoice === 'centro_manejo_jurua'
                              ? 'bg-[#2c6896] border-[#b3dce8] text-white'
                              : 'bg-[#331f12] border-[#6e4726] text-[#f4ebd9]'
                          }`}
                        >
                          Centro de Manejo Fluvial
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {journalTab === 'missoes' && (
                <div className="space-y-2.5">
                  {QUESTS_DATA.map((q) => {
                    const done = gameState.completedQuests.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border ${
                          done ? 'bg-[#243822] border-[#a5cf61]' : 'bg-[#331f12] border-[#73482b]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#f7e7c4]">{q.title}</span>
                          <span className="text-xs font-bold text-[#dfc16d]">
                            {done ? 'Concluída' : `Recompensa: R$ ${q.rewardMoney}`}
                          </span>
                        </div>
                        <div className="text-xs text-[#a5cf61] mt-0.5">
                          Morador: {q.giverName} · Meta: {q.objectiveText}
                        </div>
                        <p className="text-xs text-[#d8c5a3] mt-1">{q.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {journalTab === 'personagens' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CHARACTERS_DATA.map((ch) => {
                    const rel = gameState.relationships[ch.id] ?? 20;
                    const homeName = MAPS_DATA[ch.homeMap].name;
                    return (
                      <div
                        key={ch.id}
                        className="p-3 rounded-xl bg-[#331f12] border border-[#6e4726] flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#f7e7c4]">{ch.name}</span>
                            <span className="text-xs text-[#a5cf61] tabular-nums">Amizade: {rel}/100</span>
                          </div>
                          <div className="text-xs text-[#dfc16d]">{ch.role} · {homeName}</div>
                          <p className="text-xs text-[#d8c5a3] mt-1 italic">"{ch.dialogues.greeting}"</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onGiftCharacter(ch.id)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-[#8c583a] hover:bg-[#a86b47] text-white text-xs font-semibold cursor-pointer"
                        >
                          Conversar (+Amizade)
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {journalTab === 'livro_agricola' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CROP_LIST.map((crop) => {
                      const seasonsText = crop.preferredSeasons
                        .map((s) => SEASONS_INFO[s].name)
                        .join(', ');
                      return (
                        <div key={crop.id} className="p-3 rounded-xl bg-[#331f12] border border-[#6e4726] space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <PixelIconCanvas
                                kind={crop.id}
                                size={22}
                                isSwaying={gameState.weather === 'chuva'}
                              />
                              <span className="text-sm font-bold text-[#f7e7c4]">{crop.name}</span>
                            </div>
                            <span className="text-xs text-[#dfc16d]">Venda: R$ {crop.sellPrice}</span>
                          </div>
                          <div className="text-xs text-[#a5cf61]">
                            Estações de Compra: {seasonsText}
                          </div>
                          <p className="text-xs text-[#d8c5a3]">{crop.bookDescription}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              5. SALVAMENTO EM 3 ESPAÇOS E OPÇÕES DE ÁUDIO
             ================================================================ */}
          {activeModal === 'save' && (
            <div className="space-y-4">
              <p className="text-xs text-[#d8c5a3]">
                Escolha um dos 3 espaços abaixo para salvar ou carregar sua jornada no Vale do Juruá.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {saveSlots.map((slot) => (
                  <div
                    key={slot.slotIndex}
                    className="p-3.5 rounded-xl bg-[#331f12] border border-[#8c663e] flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#f7e7c4]">
                        Espaço #{slot.slotIndex}
                      </div>
                      {slot.exists ? (
                        <div className="text-xs text-[#a5cf61] mt-1 space-y-0.5 tabular-nums">
                          <div>{slot.farmName}</div>
                          <div>Ano {slot.year} · Dia {slot.day}</div>
                          <div>Saldo: R$ {slot.money}</div>
                          <div className="text-[11px] text-[#d8c5a3]">Salvo às {slot.savedAt}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#9c826b] mt-2">Espaço disponível</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSaveToSlot(slot.slotIndex)}
                        className="min-h-[38px] w-full px-3 py-1.5 rounded-lg bg-[#3b7a3e] hover:bg-[#49914d] text-white text-xs font-bold cursor-pointer"
                      >
                        Salvar no Espaço #{slot.slotIndex}
                      </button>
                      {slot.exists && (
                        <button
                          type="button"
                          onClick={() => {
                            onLoadFromSlot(slot.slotIndex);
                            onClose();
                          }}
                          className="min-h-[38px] w-full px-3 py-1.5 rounded-lg bg-[#2c6896] hover:bg-[#3a7fb5] text-white text-xs font-bold cursor-pointer"
                        >
                          Carregar Espaço #{slot.slotIndex}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-[#1c1109] border border-[#5c3824] flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#f7e7c4]">Trilha Sonora & Sons da Floresta</div>
                  <div className="text-xs text-[#d8c5a3]">
                    Música ambiente regional do Vale do Juruá e sons das ferramentas
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#8c583a] text-white text-xs font-bold cursor-pointer"
                >
                  {isMuted ? 'Ativar Áudio' : 'Silenciar Áudio'}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              6. SOBRE O JOGO & CRÉDITOS (PÚBLICO)
             ================================================================ */}
          {activeModal === 'credits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#331f12] border border-[#73482b] space-y-2">
                <h3 className="text-base font-bold text-[#ffdf78]">
                  Uma Homenagem a Cruzeiro do Sul e ao Vale do Juruá (Acre)
                </h3>
                <p className="text-xs sm:text-sm text-[#f4ebd9] leading-relaxed">
                  <strong>Amazônia: Chamado Ribeirinho Acreano</strong> celebra a vida rural e fluvial das famílias produtoras do Alto Juruá — a tradição centenária das Casas de Farinha, o manejo sustentável dos açaizais e igarapés, as feiras populares e a navegação pelas águas sinuosas do Rio Juruá.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAMPAIGN_YEARS.map((cy) => (
                  <div key={cy.year} className="p-3 rounded-xl bg-[#1c1109] border border-[#5c3824]">
                    <div className="text-xs font-bold text-[#a5cf61]">{cy.title} — {cy.subtitle}</div>
                    <p className="text-xs text-[#d8c5a3] mt-1">{cy.theme}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#dfc16d] mb-2">Festivais Tradicionais do Calendário</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FESTIVALS_DATA.map((fest) => (
                    <div key={fest.id} className="p-2.5 rounded-xl bg-[#331f12] border border-[#6e4726]">
                      <div className="text-xs font-bold text-[#f7e7c4]">{fest.name}</div>
                      <p className="text-xs text-[#d8c5a3] mt-0.5">{fest.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              7. MODAL DE PAUSA
             ================================================================ */}
          {activeModal === 'pause' && (
            <div className="space-y-3 text-center py-2">
              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-3">
                <div className="p-2.5 rounded-xl bg-[#331f12] border border-[#73482b]">
                  <div className="text-[11px] text-[#dfc16d]">SALDO</div>
                  <div className="text-base font-bold text-[#a5cf61] tabular-nums">R$ {gameState.money}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#331f12] border border-[#73482b]">
                  <div className="text-[11px] text-[#dfc16d]">SEMANA</div>
                  <div className="text-base font-bold text-[#f7e7c4] tabular-nums">
                    Semana {unlockedWeek} · Dia {gameState.dayOfMonth}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#331f12] border border-[#73482b]">
                  <div className="text-[11px] text-[#dfc16d]">MISSÕES</div>
                  <div className="text-base font-bold text-[#b3dce8] tabular-nums">
                    {gameState.completedQuests.length}/{QUESTS_DATA.length}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3b7a3e] text-white font-bold text-sm cursor-pointer"
                >
                  Continuar Jogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSleepAdvanceDay();
                    onClose();
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2c6896] text-white font-bold text-sm cursor-pointer"
                >
                  Descansar & Avançar para o Próximo Dia
                </button>
                <button
                  type="button"
                  onClick={onReturnToTitle}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#8f3926] text-white font-bold text-sm cursor-pointer"
                >
                  Voltar ao Menu Principal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
