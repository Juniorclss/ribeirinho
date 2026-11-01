/**
 * FASE 3, 6, 7, 8 & 9: OITO MAPAS FIXOS E PLANEJADOS MANUALMENTE
 * Identidade geográfica inspirada em Cruzeiro do Sul, Acre (Vale do Juruá):
 * - Mapa A: Fazenda da Família (Casa em palafita, Quintal, Roçado, Pomar, Abrigos de Animais, Casa de Farinha, Poço, Viveiro)
 * - Mapa B: Estrada Rural (Conexão Fazenda <-> Vila <-> Rodoviária com curvas planejadas e rota de ônibus)
 * - Mapa C: Vila Ribeirinha (Região do Miritizal / Margem com casas de madeira, praça, pequeno comércio e acesso ao rio)
 * - Mapa D: Centro Comercial de Cruzeiro do Sul (Referência à Ponte da União sobre o Juruá, Mercado, Sementes, Ferramentas, Peixaria, Animais)
 * - Mapa E: Porto do Juruá / Trapiche (Embarcadouro, canoas em canal navegável, Oficina de Barcos, área de carga)
 * - Mapa F: Floresta e Igarapé (Trilhas desenhadas manualmente, coletas sustentáveis, pontes de madeira e pontos de pesca)
 * - Mapa G: Feira e Mercado do Produtor (Bancas cobertas, vendedores, contratos comerciais e gastronomia)
 * - Mapa H: Rodoviária de Cruzeiro do Sul (Terminal rodoviário integrado à malha viária, plataformas de ônibus e calçadas)
 *
 * NENHUM MAPA USA GERAÇÃO PROCEDURAL OU DISTRIBUIÇÃO ALEATÓRIA.
 */

export type MapId =
  | 'fazenda'
  | 'estrada'
  | 'vila'
  | 'centro'
  | 'porto'
  | 'floresta'
  | 'feira'
  | 'rodoviaria';

export type TileType =
  | 'grass'          // Grama / Terreiro limpo transitável
  | 'tall_grass'     // Vegetação baixa / borda decorativa transitável
  | 'dirt_path'      // Caminho de terra batida / quintal
  | 'road_asphalt'   // Estrada / Rua pavimentada ou ramal principal (válida para Ônibus)
  | 'wood_floor'     // Passarela de madeira / Trapiche / Ponte (transitável)
  | 'bridge_road'    // Ponte rodoviária (válida para Ônibus e Pedestres)
  | 'farm_plot'      // Área exclusiva de plantio (Roçado / Horta / Pomar)
  | 'water_deep'     // Canal navegável do Rio Juruá / Igarapé (válido para Canoas)
  | 'water_shallow'  // Margem d'água / Viveiro (pescável da beira)
  | 'sand_bank'      // Praia fluvial / Barranco arenoso transitável
  | 'fence'          // Cerca de madeira (sólida / colisão)
  | 'tree_solid'     // Floresta densa / Árvore nativa nas bordas (sólida / colisão)
  | 'building_footprint'; // Base ocupada por edifício (sólida exceto na porta)

export interface MapBuilding {
  id: string;
  name: string;
  subtitle: string;
  style:
    | 'casa_familia'
    | 'casa_farinha'
    | 'abrigo_animais'
    | 'poco_agua'
    | 'casa_ribeirinha'
    | 'loja_sementes'
    | 'loja_ferramentas'
    | 'mercado_municipal'
    | 'oficina_barcos'
    | 'banca_feira'
    | 'terminal_rodoviaria'
    | 'comercio_animais';
  x: number; // Tile X superior esquerdo
  y: number; // Tile Y superior esquerdo
  width: number;
  height: number;
  doorX: number;
  doorY: number;
  interactionAction:
    | 'sleep_home'
    | 'open_processing'
    | 'open_animals'
    | 'refill_water'
    | 'open_shop_seeds'
    | 'open_shop_tools'
    | 'open_market'
    | 'open_boat_shop'
    | 'open_bus_terminal'
    | 'open_animal_shop'
    | 'visit_neighbor';
}

export interface MapPortal {
  x: number;
  y: number;
  targetMap: MapId;
  targetX: number;
  targetY: number;
  label: string;
}

export interface Waypoint {
  x: number;
  y: number;
  stopPauseSeconds?: number;
  stopName?: string;
}

export interface ForageNode {
  id: string;
  x: number;
  y: number;
  itemId: string;
  itemName: string;
  dailyLimit: number;
}

export interface PlannedMapLayout {
  id: MapId;
  name: string;
  subtitle: string;
  geographicReference: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  musicTheme: 'fazenda' | 'vila' | 'centro' | 'floresta' | 'rio' | 'feira';
  tiles: TileType[][];
  buildings: MapBuilding[];
  portals: MapPortal[];
  busRoute: Waypoint[];
  canoeRoute: Waypoint[];
  forageNodes: ForageNode[];
  decorativeTrees: { x: number; y: number; kind: 'samauma' | 'acai' | 'buriti' | 'cupuacu' | 'bananeira' }[];
}

export const MAP_WIDTH = 28;
export const MAP_HEIGHT = 18;

/**
 * Construtor determinístico de grade de tiles a partir de retângulos planejados manualmente
 * (garante que todo mapa tenha coordenadas exatas documentadas e verificáveis).
 */
function createPlannedGrid(
  defaultTile: TileType,
  rects: { x1: number; y1: number; x2: number; y2: number; tile: TileType }[],
  buildings: MapBuilding[]
): TileType[][] {
  const grid: TileType[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => defaultTile)
  );

  // Bordas externas de mata amazônica planejada
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        grid[y][x] = 'tree_solid';
      }
    }
  }

  for (const r of rects) {
    for (let y = Math.max(0, r.y1); y <= Math.min(MAP_HEIGHT - 1, r.y2); y++) {
      for (let x = Math.max(0, r.x1); x <= Math.min(MAP_WIDTH - 1, r.x2); x++) {
        grid[y][x] = r.tile;
      }
    }
  }

  // Aplica a pegada (colisão) dos edifícios, deixando a coordenada da porta livre
  for (const b of buildings) {
    for (let y = b.y; y < b.y + b.height; y++) {
      for (let x = b.x; x < b.x + b.width; x++) {
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
          if (x === b.doorX && y === b.doorY) {
            grid[y][x] = 'dirt_path';
          } else {
            grid[y][x] = 'building_footprint';
          }
        }
      }
    }
    // Garante tile livre exatamente em frente à porta (y + 1)
    if (b.doorY + 1 < MAP_HEIGHT) {
      grid[b.doorY + 1][b.doorX] = grid[b.doorY + 1][b.doorX] === 'tree_solid' ? 'dirt_path' : grid[b.doorY + 1][b.doorX];
    }
  }

  return grid;
}

// ============================================================================
// MAPA A — FAZENDA DA FAMÍLIA
// ============================================================================
const fazendaBuildings: MapBuilding[] = [
  {
    id: 'casa_principal',
    name: 'Casa da Família',
    subtitle: 'Dormir & Salvar Dia',
    style: 'casa_familia',
    x: 3,
    y: 2,
    width: 5,
    height: 3,
    doorX: 5,
    doorY: 4,
    interactionAction: 'sleep_home'
  },
  {
    id: 'poco_fazenda',
    name: 'Poço de Água Cristalina',
    subtitle: 'Encher Regador',
    style: 'poco_agua',
    x: 10,
    y: 3,
    width: 2,
    height: 2,
    doorX: 10,
    doorY: 4,
    interactionAction: 'refill_water'
  },
  {
    id: 'casa_de_farinha',
    name: 'Casa de Farinha & Despolpadeira',
    subtitle: 'Beneficiamento Regional',
    style: 'casa_farinha',
    x: 19,
    y: 2,
    width: 5,
    height: 3,
    doorX: 21,
    doorY: 4,
    interactionAction: 'open_processing'
  },
  {
    id: 'abrigo_animais',
    name: 'Curral, Galinheiro & Viveiro',
    subtitle: 'Manejo das 6 Criações',
    style: 'abrigo_animais',
    x: 19,
    y: 9,
    width: 5,
    height: 3,
    doorX: 21,
    doorY: 11,
    interactionAction: 'open_animals'
  }
];

const fazendaLayout: PlannedMapLayout = {
  id: 'fazenda',
  name: 'Fazenda da Família',
  subtitle: 'Sítio Boa Esperança no Vale do Juruá',
  geographicReference: 'Propriedade familiar às margens de um braço do Rio Juruá, conectada ao ramal rural de Cruzeiro do Sul.',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 5,
  spawnY: 9,
  musicTheme: 'fazenda',
  buildings: fazendaBuildings,
  tiles: createPlannedGrid(
    'grass',
    [
      // Terreiro em frente à Casa da Família e caminho central até o Trapiche do Rio Juruá
      { x1: 3, y1: 5, x2: 23, y2: 6, tile: 'dirt_path' },
      { x1: 5, y1: 5, x2: 6, y2: 12, tile: 'dirt_path' },
      { x1: 12, y1: 6, x2: 14, y2: 16, tile: 'dirt_path' },
      { x1: 14, y1: 11, x2: 22, y2: 12, tile: 'dirt_path' },
      // Saída sul para Estrada Rural
      { x1: 12, y1: 16, x2: 14, y2: 17, tile: 'road_asphalt' },
      // Saída oeste para Floresta e Igarapé
      { x1: 0, y1: 8, x2: 1, y2: 9, tile: 'dirt_path' },
      // Roçado Esquerdo (Canteiro de Hortaliças e Raízes)
      { x1: 2, y1: 7, x2: 4, y2: 12, tile: 'farm_plot' },
      // Roçado Direito (Canteiro Principal e Fruteiras — inclui (8,9))
      { x1: 7, y1: 7, x2: 10, y2: 12, tile: 'farm_plot' },
      // Margem Sul do Rio Juruá e Trapiche de Madeira da Fazenda
      { x1: 1, y1: 13, x2: 10, y2: 13, tile: 'sand_bank' },
      { x1: 1, y1: 14, x2: 10, y2: 14, tile: 'water_shallow' },
      { x1: 1, y1: 15, x2: 10, y2: 17, tile: 'water_deep' },
      { x1: 5, y1: 13, x2: 6, y2: 15, tile: 'wood_floor' },
      // Cercado e Pátio dos Animais
      { x1: 7, y1: 2, x2: 9, y2: 2, tile: 'fence' },
      { x1: 18, y1: 8, x2: 25, y2: 8, tile: 'fence' },
      { x1: 25, y1: 8, x2: 25, y2: 14, tile: 'fence' },
      // Viveiro escavado de peixes & margem sul-leste
      { x1: 19, y1: 14, x2: 24, y2: 15, tile: 'water_shallow' },
      { x1: 18, y1: 13, x2: 25, y2: 13, tile: 'sand_bank' }
    ],
    fazendaBuildings
  ),
  portals: [
    { x: 13, y: 17, targetMap: 'estrada', targetX: 13, targetY: 2, label: 'Estrada Rural' },
    { x: 12, y: 17, targetMap: 'estrada', targetX: 13, targetY: 2, label: 'Estrada Rural' },
    { x: 14, y: 17, targetMap: 'estrada', targetX: 13, targetY: 2, label: 'Estrada Rural' },
    { x: 0, y: 8, targetMap: 'floresta', targetX: 25, targetY: 9, label: 'Floresta & Igarapé' },
    { x: 0, y: 9, targetMap: 'floresta', targetX: 25, targetY: 9, label: 'Floresta & Igarapé' },
    { x: 10, y: 15, targetMap: 'vila', targetX: 3, targetY: 15, label: 'Rio Juruá → Vila' },
    { x: 10, y: 16, targetMap: 'vila', targetX: 3, targetY: 15, label: 'Rio Juruá → Vila' },
    { x: 1, y: 15, targetMap: 'floresta', targetX: 20, targetY: 14, label: 'Rio → Igarapé' }
  ],
  busRoute: [],
  canoeRoute: [
    { x: 2, y: 16, stopPauseSeconds: 2.5, stopName: 'Margem Oeste do Sítio' },
    { x: 9, y: 16, stopPauseSeconds: 3.0, stopName: 'Trapiche da Família' }
  ],
  forageNodes: [
    { id: 'f_faz_1', x: 16, y: 3, itemId: 'acai', itemName: 'Cacho de Açaí Nativo', dailyLimit: 1 },
    { id: 'f_faz_2', x: 11, y: 13, itemId: 'cheiro_verde', itemName: 'Maço de Cheiro-Verde', dailyLimit: 1 }
  ],
  decorativeTrees: [
    { x: 1, y: 2, kind: 'samauma' },
    { x: 1, y: 5, kind: 'acai' },
    { x: 1, y: 11, kind: 'buriti' },
    { x: 8, y: 2, kind: 'bananeira' },
    { x: 11, y: 6, kind: 'acai' },
    { x: 11, y: 10, kind: 'cupuacu' },
    { x: 15, y: 2, kind: 'acai' },
    { x: 17, y: 2, kind: 'cupuacu' },
    { x: 25, y: 3, kind: 'bananeira' },
    { x: 11, y: 14, kind: 'buriti' }
  ]
};

// ============================================================================
// MAPA B — ESTRADA RURAL
// ============================================================================
const estradaBuildings: MapBuilding[] = [
  {
    id: 'carpintaria_valdir',
    name: 'Carpintaria Terra Firme',
    subtitle: 'Seu Valdir Marceneiro',
    style: 'casa_ribeirinha',
    x: 13,
    y: 4,
    width: 4,
    height: 3,
    doorX: 14,
    doorY: 6,
    interactionAction: 'visit_neighbor'
  },
  {
    id: 'ponto_onibus_rural',
    name: 'Parada do Ramal Rural',
    subtitle: 'Embarque Linha Ônibus',
    style: 'banca_feira',
    x: 7,
    y: 7,
    width: 3,
    height: 2,
    doorX: 8,
    doorY: 8,
    interactionAction: 'open_bus_terminal'
  }
];

const estradaLayout: PlannedMapLayout = {
  id: 'estrada',
  name: 'Estrada do Ramal Rural',
  subtitle: 'Caminho entre a Fazenda, a Vila e a Rodoviária',
  geographicReference: 'Estrada vicinal com curvas planejadas, bueiro sobre córrego e acesso entre os sítios, a Vila do Miritizal e a Rodoviária.',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 13,
  spawnY: 3,
  musicTheme: 'fazenda',
  buildings: estradaBuildings,
  tiles: createPlannedGrid(
    'grass',
    [
      // Entrada norte vinda da Fazenda
      { x1: 12, y1: 0, x2: 14, y2: 4, tile: 'dirt_path' },
      // Estrada pavimentada com curvas bem desenhadas (Oeste: Rodoviária -> Centro -> Curva Sul -> Leste: Vila/Centro)
      { x1: 0, y1: 10, x2: 10, y2: 11, tile: 'road_asphalt' },
      { x1: 9, y1: 10, x2: 11, y2: 14, tile: 'road_asphalt' },
      { x1: 10, y1: 13, x2: 27, y2: 14, tile: 'road_asphalt' },
      // Caminho conectando entrada da fazenda e carpintaria até a rodovia
      { x1: 8, y1: 9, x2: 15, y2: 9, tile: 'dirt_path' },
      { x1: 11, y1: 4, x2: 12, y2: 10, tile: 'dirt_path' },
      // Pequeno igarapé cruzando sob ponte rodoviária
      { x1: 19, y1: 1, x2: 20, y2: 12, tile: 'water_shallow' },
      { x1: 19, y1: 13, x2: 20, y2: 14, tile: 'bridge_road' },
      { x1: 19, y1: 15, x2: 20, y2: 16, tile: 'water_shallow' }
    ],
    estradaBuildings
  ),
  portals: [
    { x: 13, y: 0, targetMap: 'fazenda', targetX: 13, targetY: 15, label: 'Fazenda da Família' },
    { x: 12, y: 0, targetMap: 'fazenda', targetX: 13, targetY: 15, label: 'Fazenda da Família' },
    { x: 14, y: 0, targetMap: 'fazenda', targetX: 13, targetY: 15, label: 'Fazenda da Família' },
    { x: 0, y: 10, targetMap: 'rodoviaria', targetX: 25, targetY: 10, label: 'Rodoviária' },
    { x: 0, y: 11, targetMap: 'rodoviaria', targetX: 25, targetY: 10, label: 'Rodoviária' },
    { x: 27, y: 13, targetMap: 'vila', targetX: 2, targetY: 9, label: 'Vila do Miritizal' },
    { x: 27, y: 14, targetMap: 'vila', targetX: 2, targetY: 9, label: 'Vila do Miritizal' }
  ],
  // Rota de ônibus estritamente sobre 'road_asphalt' e 'bridge_road'
  busRoute: [
    { x: 2, y: 10, stopPauseSeconds: 2, stopName: 'Acesso Rodoviária' },
    { x: 10, y: 10, stopPauseSeconds: 3, stopName: 'Parada Ramal da Fazenda' },
    { x: 10, y: 13 },
    { x: 25, y: 13, stopPauseSeconds: 2, stopName: 'Entrada da Vila' },
    { x: 10, y: 13 },
    { x: 10, y: 10 }
  ],
  canoeRoute: [],
  forageNodes: [
    { id: 'f_est_1', x: 5, y: 4, itemId: 'cupuacu', itemName: 'Cupuaçu Caído no Ramal', dailyLimit: 1 },
    { id: 'f_est_2', x: 23, y: 5, itemId: 'banana', itemName: 'Cacho de Banana Nativa', dailyLimit: 1 }
  ],
  decorativeTrees: [
    { x: 3, y: 3, kind: 'samauma' },
    { x: 6, y: 3, kind: 'cupuacu' },
    { x: 22, y: 3, kind: 'acai' },
    { x: 24, y: 7, kind: 'buriti' },
    { x: 4, y: 14, kind: 'bananeira' }
  ]
};

// ============================================================================
// MAPA C — VILA RIBEIRINHA (MIRITIZAL)
// ============================================================================
const vilaBuildings: MapBuilding[] = [
  {
    id: 'casa_dona_francisca',
    name: 'Casa de Dona Francisca',
    subtitle: 'Guardiã de Sementes',
    style: 'casa_ribeirinha',
    x: 5,
    y: 3,
    width: 4,
    height: 3,
    doorX: 7,
    doorY: 5,
    interactionAction: 'visit_neighbor'
  },
  {
    id: 'escola_ribeirinha',
    name: 'Escola & Associação do Miritizal',
    subtitle: 'Profa. Bianca & Vovô Benedito',
    style: 'casa_familia',
    x: 13,
    y: 3,
    width: 5,
    height: 3,
    doorX: 15,
    doorY: 5,
    interactionAction: 'visit_neighbor'
  },
  {
    id: 'venda_ribeirinha',
    name: 'Quitanda & Artesanato da Vila',
    subtitle: 'Comércio Local',
    style: 'banca_feira',
    x: 20,
    y: 4,
    width: 4,
    height: 3,
    doorX: 21,
    doorY: 6,
    interactionAction: 'open_market'
  }
];

const vilaLayout: PlannedMapLayout = {
  id: 'vila',
  name: 'Vila Ribeirinha do Miritizal',
  subtitle: 'Comunidade Tradicional à Beira do Juruá',
  geographicReference: 'Inspirada no bairro ribeirinho do Miritizal em Cruzeiro do Sul, com casas de madeira, praça comunitária e descida para o rio.',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 3,
  spawnY: 9,
  musicTheme: 'vila',
  buildings: vilaBuildings,
  tiles: createPlannedGrid(
    'grass',
    [
      // Pátios e caminhos de acesso das casas e praça
      { x1: 11, y1: 6, x2: 18, y2: 11, tile: 'dirt_path' },
      { x1: 6, y1: 6, x2: 8, y2: 8, tile: 'dirt_path' },
      // Estrada conectando Oeste (Estrada Rural) -> Praça Central -> Leste
      { x1: 0, y1: 8, x2: 24, y2: 9, tile: 'road_asphalt' },
      { x1: 13, y1: 0, x2: 15, y2: 2, tile: 'bridge_road' },
      // Margem sul banhada pelo Rio Juruá e trapiche rumo ao Porto
      { x1: 1, y1: 13, x2: 26, y2: 13, tile: 'sand_bank' },
      { x1: 1, y1: 14, x2: 26, y2: 16, tile: 'water_deep' },
      // Trapiche de madeira na beira do rio
      { x1: 13, y1: 11, x2: 15, y2: 14, tile: 'wood_floor' },
      // Saída leste para o Porto
      { x1: 24, y1: 8, x2: 27, y2: 9, tile: 'dirt_path' }
    ],
    vilaBuildings
  ),
  portals: [
    { x: 0, y: 8, targetMap: 'estrada', targetX: 25, targetY: 13, label: 'Estrada Rural' },
    { x: 0, y: 9, targetMap: 'estrada', targetX: 25, targetY: 13, label: 'Estrada Rural' },
    { x: 14, y: 0, targetMap: 'centro', targetX: 14, targetY: 15, label: 'Ponte → Centro' },
    { x: 13, y: 0, targetMap: 'centro', targetX: 14, targetY: 15, label: 'Ponte → Centro' },
    { x: 15, y: 0, targetMap: 'centro', targetX: 14, targetY: 15, label: 'Ponte → Centro' },
    { x: 27, y: 8, targetMap: 'porto', targetX: 2, targetY: 8, label: 'Porto do Juruá' },
    { x: 27, y: 9, targetMap: 'porto', targetX: 2, targetY: 8, label: 'Porto do Juruá' },
    { x: 1, y: 15, targetMap: 'fazenda', targetX: 8, targetY: 15, label: 'Rio → Fazenda' },
    { x: 26, y: 15, targetMap: 'porto', targetX: 3, targetY: 14, label: 'Rio → Porto' }
  ],
  busRoute: [
    { x: 2, y: 8, stopPauseSeconds: 2, stopName: 'Entrada do Miritizal' },
    { x: 14, y: 8, stopPauseSeconds: 3, stopName: 'Praça da Vila Ribeirinha' },
    { x: 22, y: 8, stopPauseSeconds: 2, stopName: 'Quitanda da Vila' },
    { x: 14, y: 8 }
  ],
  canoeRoute: [
    { x: 3, y: 15 },
    { x: 14, y: 15, stopPauseSeconds: 3, stopName: 'Trapiche da Vila' },
    { x: 24, y: 15 },
    { x: 14, y: 15 }
  ],
  forageNodes: [
    { id: 'f_vil_1', x: 3, y: 12, itemId: 'pimenta_de_cheiro', itemName: 'Pimenta-de-Cheiro da Horta', dailyLimit: 1 }
  ],
  decorativeTrees: [
    { x: 2, y: 3, kind: 'acai' },
    { x: 10, y: 3, kind: 'buriti' },
    { x: 25, y: 3, kind: 'samauma' }
  ]
};

// ============================================================================
// MAPA D — CENTRO COMERCIAL DE CRUZEIRO DO SUL
// ============================================================================
const centroBuildings: MapBuilding[] = [
  {
    id: 'loja_sementes_nazare',
    name: 'Casa Agrícola Juruá',
    subtitle: 'Sementes & Mudas (Dona Nazaré)',
    style: 'loja_sementes',
    x: 3,
    y: 3,
    width: 5,
    height: 3,
    doorX: 5,
    doorY: 5,
    interactionAction: 'open_shop_seeds'
  },
  {
    id: 'loja_ferramentas_tiago',
    name: 'Ferragens & Equipamentos',
    subtitle: 'Melhorias (Tiago)',
    style: 'loja_ferramentas',
    x: 10,
    y: 3,
    width: 5,
    height: 3,
    doorX: 12,
    doorY: 5,
    interactionAction: 'open_shop_tools'
  },
  {
    id: 'comercio_animais_helena',
    name: 'Agropecuária Vale do Juruá',
    subtitle: 'Compra de Animais & Ração',
    style: 'comercio_animais',
    x: 17,
    y: 3,
    width: 6,
    height: 3,
    doorX: 20,
    doorY: 5,
    interactionAction: 'open_animal_shop'
  },
  {
    id: 'mercado_central',
    name: 'Mercado Municipal de Cruzeiro do Sul',
    subtitle: 'Compra, Venda & Contratos',
    style: 'mercado_municipal',
    x: 4,
    y: 10,
    width: 6,
    height: 3,
    doorX: 7,
    doorY: 12,
    interactionAction: 'open_market'
  }
];

const centroLayout: PlannedMapLayout = {
  id: 'centro',
  name: 'Centro de Cruzeiro do Sul',
  subtitle: 'Comércio e Avenidas do Alto Juruá',
  geographicReference: 'Representação artística das avenidas centrais de Cruzeiro do Sul conectando o Mercado Municipal, o Boulevard/Praça, a descida da Ponte do Juruá, a Feira e a Rodoviária.',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 14,
  spawnY: 8,
  musicTheme: 'centro',
  buildings: centroBuildings,
  tiles: createPlannedGrid(
    'grass',
    [
      // Avenida principal leste-oeste (Rodoviária <-> Centro <-> Feira)
      { x1: 0, y1: 7, x2: 27, y2: 8, tile: 'road_asphalt' },
      // Avenida norte-sul rumo à Ponte sobre o Rio Juruá (Vila Miritizal)
      { x1: 13, y1: 7, x2: 15, y2: 17, tile: 'road_asphalt' },
      // Calçadas e Praça Central arborizada
      { x1: 3, y1: 6, x2: 24, y2: 6, tile: 'dirt_path' },
      { x1: 3, y1: 9, x2: 24, y2: 9, tile: 'dirt_path' },
      { x1: 4, y1: 13, x2: 12, y2: 14, tile: 'dirt_path' },
      { x1: 17, y1: 10, x2: 24, y2: 14, tile: 'wood_floor' }
    ],
    centroBuildings
  ),
  portals: [
    { x: 14, y: 17, targetMap: 'vila', targetX: 14, targetY: 2, label: 'Ponte → Vila Miritizal' },
    { x: 13, y: 17, targetMap: 'vila', targetX: 14, targetY: 2, label: 'Ponte → Vila Miritizal' },
    { x: 15, y: 17, targetMap: 'vila', targetX: 14, targetY: 2, label: 'Ponte → Vila Miritizal' },
    { x: 27, y: 7, targetMap: 'feira', targetX: 2, targetY: 8, label: 'Feira do Produtor' },
    { x: 27, y: 8, targetMap: 'feira', targetX: 2, targetY: 8, label: 'Feira do Produtor' },
    { x: 0, y: 7, targetMap: 'rodoviaria', targetX: 25, targetY: 7, label: 'Rodoviária' },
    { x: 0, y: 8, targetMap: 'rodoviaria', targetX: 25, targetY: 7, label: 'Rodoviária' }
  ],
  busRoute: [
    { x: 2, y: 7, stopPauseSeconds: 2, stopName: 'Acesso Rodoviária' },
    { x: 14, y: 7, stopPauseSeconds: 3, stopName: 'Parada Central — Mercado' },
    { x: 25, y: 7, stopPauseSeconds: 2, stopName: 'Acesso Feira Municipal' },
    { x: 14, y: 7 }
  ],
  canoeRoute: [],
  forageNodes: [],
  decorativeTrees: [
    { x: 18, y: 11, kind: 'buriti' },
    { x: 23, y: 11, kind: 'acai' },
    { x: 25, y: 3, kind: 'samauma' }
  ]
};

// ============================================================================
// MAPA E — PORTO DO RIO JURUÁ / TRAPICHE
// ============================================================================
const portoBuildings: MapBuilding[] = [
  {
    id: 'peixaria_porto',
    name: 'Entreposto & Peixaria do Juruá',
    subtitle: 'Compra e Venda de Pescado (Rafael)',
    style: 'mercado_municipal',
    x: 4,
    y: 3,
    width: 5,
    height: 3,
    doorX: 6,
    doorY: 5,
    interactionAction: 'open_market'
  },
  {
    id: 'oficina_barcos_bento',
    name: 'Estaleiro & Oficina de Canoas',
    subtitle: 'Mestre Zé Bento & Travessias',
    style: 'oficina_barcos',
    x: 13,
    y: 3,
    width: 6,
    height: 3,
    doorX: 16,
    doorY: 5,
    interactionAction: 'open_boat_shop'
  }
];

const portoLayout: PlannedMapLayout = {
  id: 'porto',
  name: 'Porto do Rio Juruá',
  subtitle: 'Trapiche de Canoas e Comércio Fluvial',
  geographicReference: 'Área portuária e trapiche de Cruzeiro do Sul, onde batelões e canoas descarregam farinha, açaí, banana e pescado vindos dos rios e igarapés.',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 3,
  spawnY: 8,
  musicTheme: 'rio',
  buildings: portoBuildings,
  tiles: createPlannedGrid(
    'grass',
    [
      // Caminho de chegada oeste (Vila Ribeirinha) e norte (Feira)
      { x1: 0, y1: 7, x2: 22, y2: 8, tile: 'dirt_path' },
      { x1: 21, y1: 0, x2: 22, y2: 8, tile: 'dirt_path' },
      // Grande Trapiche e Passarelas de Madeira sobre o barranco
      { x1: 5, y1: 9, x2: 22, y2: 10, tile: 'wood_floor' },
      { x1: 8, y1: 11, x2: 10, y2: 13, tile: 'wood_floor' },
      { x1: 17, y1: 11, x2: 19, y2: 13, tile: 'wood_floor' },
      // Praia de areia e águas profundas navegáveis do Rio Juruá
      { x1: 1, y1: 11, x2: 26, y2: 11, tile: 'sand_bank' },
      { x1: 1, y1: 12, x2: 26, y2: 16, tile: 'water_deep' },
      // Reaplica os píeres de madeira sobre a água
      { x1: 8, y1: 11, x2: 10, y2: 13, tile: 'wood_floor' },
      { x1: 17, y1: 11, x2: 19, y2: 13, tile: 'wood_floor' }
    ],
    portoBuildings
  ),
  portals: [
    { x: 0, y: 7, targetMap: 'vila', targetX: 25, targetY: 8, label: 'Vila do Miritizal' },
    { x: 0, y: 8, targetMap: 'vila', targetX: 25, targetY: 8, label: 'Vila do Miritizal' },
    { x: 21, y: 0, targetMap: 'feira', targetX: 21, targetY: 15, label: 'Feira do Produtor' },
    { x: 22, y: 0, targetMap: 'feira', targetX: 21, targetY: 15, label: 'Feira do Produtor' },
    { x: 1, y: 14, targetMap: 'vila', targetX: 24, targetY: 15, label: 'Rio → Vila' },
    { x: 1, y: 15, targetMap: 'vila', targetX: 24, targetY: 15, label: 'Rio → Vila' }
  ],
  busRoute: [],
  // Rota fluvial de canoas estritamente dentro de 'water_deep'
  canoeRoute: [
    { x: 3, y: 14, stopPauseSeconds: 2, stopName: 'Canal Oeste' },
    { x: 9, y: 14, stopPauseSeconds: 3, stopName: 'Píer da Peixaria' },
    { x: 18, y: 14, stopPauseSeconds: 3, stopName: 'Píer das Canoas (Pedro)' },
    { x: 24, y: 14, stopPauseSeconds: 2, stopName: 'Curva do Juruá' },
    { x: 18, y: 14 },
    { x: 9, y: 14 }
  ],
  forageNodes: [],
  decorativeTrees: [
    { x: 2, y: 3, kind: 'buriti' },
    { x: 24, y: 4, kind: 'acai' }
  ]
};

// ============================================================================
// MAPA F — FLORESTA E IGARAPÉ
// ============================================================================
const florestaBuildings: MapBuilding[] = [
  {
    id: 'posto_agroecologia',
    name: 'Refúgio Florestal do Igarapé',
    subtitle: 'Iara Nogueira & Líder Kawa',
    style: 'casa_ribeirinha',
    x: 11,
    y: 3,
    width: 4,
    height: 3,
    doorX: 12,
    doorY: 5,
    interactionAction: 'visit_neighbor'
  }
];

const florestaLayout: PlannedMapLayout = {
  id: 'floresta',
  name: 'Floresta & Igarapé',
  subtitle: 'Reserva Extrativista e Pesca Silvestre',
  geographicReference: 'Inspirada nas matas de várzea e terra firme e nos igarapés de águas escuras/claras (como o Croa e Rio Môa) nos arredores de Cruzeiro do Sul.',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 24,
  spawnY: 9,
  musicTheme: 'floresta',
  buildings: florestaBuildings,
  tiles: createPlannedGrid(
    'tall_grass',
    [
      // Trilha principal desenhada manualmente vinda da Fazenda (Leste)
      { x1: 12, y1: 8, x2: 27, y2: 9, tile: 'dirt_path' },
      { x1: 11, y1: 6, x2: 14, y2: 8, tile: 'dirt_path' },
      // Trilha oeste cruzando ponte de madeira sobre o Igarapé
      { x1: 4, y1: 8, x2: 11, y2: 9, tile: 'dirt_path' },
      { x1: 4, y1: 9, x2: 6, y2: 14, tile: 'dirt_path' },
      // Curso d'água do Igarapé serpenteando pelo mapa
      { x1: 8, y1: 2, x2: 10, y2: 7, tile: 'water_shallow' },
      { x1: 8, y1: 8, x2: 10, y2: 9, tile: 'wood_floor' }, // Ponte de madeira na trilha!
      { x1: 8, y1: 10, x2: 10, y2: 15, tile: 'water_deep' },
      { x1: 10, y1: 13, x2: 22, y2: 15, tile: 'water_deep' },
      // Margem arenosa para pesca no igarapé
      { x1: 11, y1: 12, x2: 22, y2: 12, tile: 'sand_bank' }
    ],
    florestaBuildings
  ),
  portals: [
    { x: 27, y: 8, targetMap: 'fazenda', targetX: 2, targetY: 8, label: 'Fazenda da Família' },
    { x: 27, y: 9, targetMap: 'fazenda', targetX: 2, targetY: 8, label: 'Fazenda da Família' },
    { x: 22, y: 14, targetMap: 'fazenda', targetX: 2, targetY: 15, label: 'Igarapé → Fazenda' }
  ],
  busRoute: [],
  canoeRoute: [
    { x: 11, y: 14, stopPauseSeconds: 2, stopName: 'Poço do Igarapé' },
    { x: 20, y: 14, stopPauseSeconds: 2, stopName: 'Remanso dos Tambaquis' }
  ],
  forageNodes: [
    { id: 'f_flo_1', x: 5, y: 5, itemId: 'acai', itemName: 'Açaí Nativo da Mata', dailyLimit: 2 },
    { id: 'f_flo_2', x: 18, y: 4, itemId: 'cupuacu', itemName: 'Cupuaçu Silvestre', dailyLimit: 2 },
    { id: 'f_flo_3', x: 5, y: 13, itemId: 'cacau', itemName: 'Cacau Nativo de Várzea', dailyLimit: 2 }
  ],
  decorativeTrees: [
    { x: 3, y: 2, kind: 'samauma' },
    { x: 6, y: 3, kind: 'acai' },
    { x: 16, y: 2, kind: 'samauma' },
    { x: 20, y: 3, kind: 'cupuacu' },
    { x: 23, y: 4, kind: 'buriti' },
    { x: 2, y: 12, kind: 'acai' },
    { x: 24, y: 12, kind: 'samauma' }
  ]
};

// ============================================================================
// MAPA G — FEIRA E MERCADO DO PRODUTOR
// ============================================================================
const feiraBuildings: MapBuilding[] = [
  {
    id: 'banca_farinha_mateus',
    name: 'Pavilhão da Farinha & Raízes',
    subtitle: 'Mateus Feirante (Venda & Contratos)',
    style: 'banca_feira',
    x: 4,
    y: 3,
    width: 5,
    height: 3,
    doorX: 6,
    doorY: 5,
    interactionAction: 'open_market'
  },
  {
    id: 'banca_gastronomia_clara',
    name: 'Barraca da Clara — Tacacá & Caldeirada',
    subtitle: 'Comidas Típicas & Encomendas',
    style: 'banca_feira',
    x: 11,
    y: 3,
    width: 5,
    height: 3,
    doorX: 13,
    doorY: 5,
    interactionAction: 'open_market'
  },
  {
    id: 'banca_frutas_artesanato',
    name: 'Feira de Polpas, Queijos & Cestaria',
    subtitle: 'Produtores Familiares do Juruá',
    style: 'banca_feira',
    x: 18,
    y: 3,
    width: 5,
    height: 3,
    doorX: 20,
    doorY: 5,
    interactionAction: 'open_market'
  }
];

const feiraLayout: PlannedMapLayout = {
  id: 'feira',
  name: 'Feira do Produtor Rural',
  subtitle: 'Bancas Regionais, Encomendas e Gastronomia',
  geographicReference: 'Feira coberta e calçadão dos produtores rurais no centro de Cruzeiro do Sul, interligada ao Centro Comercial e à descida do Porto.',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 3,
  spawnY: 8,
  musicTheme: 'feira',
  buildings: feiraBuildings,
  tiles: createPlannedGrid(
    'grass',
    [
      // Via principal conectando o Centro Comercial (Oeste)
      { x1: 0, y1: 7, x2: 24, y2: 8, tile: 'road_asphalt' },
      // Pátio amplo das bancas e circulação de pedestres
      { x1: 3, y1: 6, x2: 24, y2: 6, tile: 'wood_floor' },
      { x1: 3, y1: 9, x2: 24, y2: 12, tile: 'dirt_path' },
      // Descida sul para o Porto do Juruá
      { x1: 20, y1: 12, x2: 22, y2: 17, tile: 'dirt_path' }
    ],
    feiraBuildings
  ),
  portals: [
    { x: 0, y: 7, targetMap: 'centro', targetX: 25, targetY: 7, label: 'Centro Comercial' },
    { x: 0, y: 8, targetMap: 'centro', targetX: 25, targetY: 7, label: 'Centro Comercial' },
    { x: 20, y: 17, targetMap: 'porto', targetX: 21, targetY: 2, label: 'Porto do Juruá' },
    { x: 21, y: 17, targetMap: 'porto', targetX: 21, targetY: 2, label: 'Porto do Juruá' },
    { x: 22, y: 17, targetMap: 'porto', targetX: 21, targetY: 2, label: 'Porto do Juruá' }
  ],
  busRoute: [
    { x: 2, y: 7, stopPauseSeconds: 2, stopName: 'Entrada da Feira' },
    { x: 13, y: 7, stopPauseSeconds: 4, stopName: 'Pavilhão do Produtor' },
    { x: 22, y: 7, stopPauseSeconds: 2, stopName: 'Acesso ao Porto' },
    { x: 13, y: 7 }
  ],
  canoeRoute: [],
  forageNodes: [],
  decorativeTrees: [
    { x: 5, y: 14, kind: 'acai' },
    { x: 12, y: 14, kind: 'buriti' },
    { x: 25, y: 4, kind: 'samauma' }
  ]
};

// ============================================================================
// MAPA H — RODOVIÁRIA DE CRUZEIRO DO SUL
// ============================================================================
const rodoviariaBuildings: MapBuilding[] = [
  {
    id: 'terminal_rodoviario',
    name: 'Terminal Rodoviário de Cruzeiro do Sul',
    subtitle: 'Embarque Regional (Chico Motorista)',
    style: 'terminal_rodoviaria',
    x: 7,
    y: 2,
    width: 10,
    height: 4,
    doorX: 12,
    doorY: 5,
    interactionAction: 'open_bus_terminal'
  },
  {
    id: 'lanchonete_rodoviaria',
    name: 'Café Regional & Passagens',
    subtitle: 'Salgados de Macaxeira & Sucos',
    style: 'banca_feira',
    x: 19,
    y: 3,
    width: 4,
    height: 3,
    doorX: 21,
    doorY: 5,
    interactionAction: 'open_market'
  }
];

const rodoviariaLayout: PlannedMapLayout = {
  id: 'rodoviaria',
  name: 'Rodoviária de Cruzeiro do Sul',
  subtitle: 'Terminal Regional de Ônibus',
  geographicReference: 'Terminal rodoviário integrado às vias de acesso urbano (Centro Comercial) e aos ramais rurais (Estrada da Fazenda).',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnX: 12,
  spawnY: 8,
  musicTheme: 'centro',
  buildings: rodoviariaBuildings,
  tiles: createPlannedGrid(
    'grass',
    [
      // Calçadas de embarque em frente ao Terminal
      { x1: 5, y1: 6, x2: 23, y2: 6, tile: 'wood_floor' },
      // Pista dupla de manobra e baia dos ônibus conectada ao Centro (Leste Superior) e Estrada Rural (Leste Inferior)
      { x1: 4, y1: 7, x2: 27, y2: 8, tile: 'road_asphalt' },
      { x1: 4, y1: 7, x2: 6, y2: 11, tile: 'road_asphalt' },
      { x1: 4, y1: 10, x2: 27, y2: 11, tile: 'road_asphalt' },
      // Praça ajardinada do terminal
      { x1: 7, y1: 12, x2: 21, y2: 14, tile: 'dirt_path' }
    ],
    rodoviariaBuildings
  ),
  portals: [
    { x: 27, y: 7, targetMap: 'centro', targetX: 2, targetY: 7, label: 'Centro Comercial' },
    { x: 27, y: 8, targetMap: 'centro', targetX: 2, targetY: 7, label: 'Centro Comercial' },
    { x: 27, y: 10, targetMap: 'estrada', targetX: 2, targetY: 10, label: 'Estrada Rural & Fazenda' },
    { x: 27, y: 11, targetMap: 'estrada', targetX: 2, targetY: 10, label: 'Estrada Rural & Fazenda' }
  ],
  // Circuito completo do ônibus pelas baias da Rodoviária (100% em 'road_asphalt')
  busRoute: [
    { x: 24, y: 7, stopPauseSeconds: 2, stopName: 'Entrada Urbana' },
    { x: 12, y: 7, stopPauseSeconds: 4, stopName: 'Plataforma Central de Embarque' },
    { x: 5, y: 7 },
    { x: 5, y: 10 },
    { x: 12, y: 10, stopPauseSeconds: 3, stopName: 'Plataforma Linha Rural' },
    { x: 24, y: 10, stopPauseSeconds: 2, stopName: 'Saída Ramal Rural' },
    { x: 5, y: 10 },
    { x: 5, y: 7 }
  ],
  canoeRoute: [],
  forageNodes: [],
  decorativeTrees: [
    { x: 2, y: 3, kind: 'buriti' },
    { x: 25, y: 3, kind: 'samauma' },
    { x: 9, y: 15, kind: 'acai' },
    { x: 19, y: 15, kind: 'cupuacu' }
  ]
};

export const MAPS_DATA: Record<MapId, PlannedMapLayout> = {
  fazenda: fazendaLayout,
  estrada: estradaLayout,
  vila: vilaLayout,
  centro: centroLayout,
  porto: portoLayout,
  floresta: florestaLayout,
  feira: feiraLayout,
  rodoviaria: rodoviariaLayout
};

export const MAP_LIST = Object.values(MAPS_DATA);
