/**
 * FASE 8 & 13: SEIS CATEGORIAS DE ANIMAIS DA PROPRIEDADE RIBEIRINHA
 * Categorias obrigatórias:
 * 1. Galinhas
 * 2. Patos
 * 3. Porcos
 * 4. Cabras
 * 5. Vacas ou bois de criação
 * 6. Peixes em viveiros
 */

export type AnimalCategoryId = 'galinha' | 'pato' | 'porco' | 'cabra' | 'vaca' | 'peixe_viveiro';

export interface AnimalCategoryDefinition {
  id: AnimalCategoryId;
  name: string;
  singularName: string;
  shelterName: string;
  buyPrice: number;
  sellAdultPrice: number;
  maxPerShelter: number;
  daysToMature: number;
  feedItem: string;
  dailyFeedCost: number;
  productId: string | null;
  productName: string;
  productSellPrice: number;
  productionIntervalDays: number;
  canReproduce: boolean;
  behaviorNotes: string;
  primaryColor: string;
  accentColor: string;
}

export const ANIMAL_CATEGORIES: Record<AnimalCategoryId, AnimalCategoryDefinition> = {
  galinha: {
    id: 'galinha',
    name: 'Galinhas Caipiras',
    singularName: 'Galinha Caipira',
    shelterName: 'Galinheiro de Madeira',
    buyPrice: 90,
    sellAdultPrice: 130,
    maxPerShelter: 6,
    daysToMature: 3,
    feedItem: 'Milho Regional / Ração',
    dailyFeedCost: 5,
    productId: 'ovo_caipira',
    productName: 'Ovo Caipira',
    productSellPrice: 28,
    productionIntervalDays: 1,
    canReproduce: true,
    behaviorNotes: 'Ciscam no terreiro durante o dia, recolhem-se ao poleiro à noite e põem ovos frescos toda manhã quando bem alimentadas.',
    primaryColor: '#c97a3e',
    accentColor: '#c9342b'
  },
  pato: {
    id: 'pato',
    name: 'Patos Ribeirinhos (Pato-do-Mato)',
    singularName: 'Pato Ribeirinho',
    shelterName: 'Lagoa & Abrigo de Aves',
    buyPrice: 120,
    sellAdultPrice: 185,
    maxPerShelter: 5,
    daysToMature: 4,
    feedItem: 'Milho & Farelo de Mandioca',
    dailyFeedCost: 6,
    productId: 'ovo_pato',
    productName: 'Ovo de Pato Regional',
    productSellPrice: 44,
    productionIntervalDays: 2,
    canReproduce: true,
    behaviorNotes: 'Adoram dias chuvosos e nadam próximo à margem. Essenciais para a culinária tradicional (Pato no Tucupi).',
    primaryColor: '#2e573a',
    accentColor: '#e8c86b'
  },
  porco: {
    id: 'porco',
    name: 'Porcos de Criação',
    singularName: 'Porco da Roça',
    shelterName: 'Chiqueiro Cercado',
    buyPrice: 220,
    sellAdultPrice: 540,
    maxPerShelter: 4,
    daysToMature: 5,
    feedItem: 'Macaxeira, Milho & Restos de Polpa',
    dailyFeedCost: 12,
    productId: 'carne_suina_banha',
    productName: 'Corte Suíno & Banha Artesanal',
    productSellPrice: 95,
    productionIntervalDays: 3,
    canReproduce: true,
    behaviorNotes: 'Crescem rapidamente quando alimentados com macaxeira e milho, alcançando alto valor de venda no mercado municipal.',
    primaryColor: '#d99682',
    accentColor: '#8c583a'
  },
  cabra: {
    id: 'cabra',
    name: 'Cabras Leiteiras',
    singularName: 'Cabra Leiteira',
    shelterName: 'Aprisco Elevado',
    buyPrice: 280,
    sellAdultPrice: 420,
    maxPerShelter: 4,
    daysToMature: 4,
    feedItem: 'Capim, Folhagem & Milho',
    dailyFeedCost: 10,
    productId: 'leite_cabra',
    productName: 'Leite de Cabra Fresco',
    productSellPrice: 68,
    productionIntervalDays: 2,
    canReproduce: true,
    behaviorNotes: 'Adaptadas ao clima quente; o aprisco suspenso em madeira evita a umidade do inverno amazônico. Produzem leite rico para queijos.',
    primaryColor: '#e8dcc5',
    accentColor: '#69442c'
  },
  vaca: {
    id: 'vaca',
    name: 'Vacas & Bois de Criação',
    singularName: 'Vaca Leiteira Girolando',
    shelterName: 'Curral & Pasto Sombreado',
    buyPrice: 480,
    sellAdultPrice: 820,
    maxPerShelter: 4,
    daysToMature: 6,
    feedItem: 'Pasto, Cana Picada & Sal Mineral',
    dailyFeedCost: 18,
    productId: 'leite_vaca',
    productName: 'Leite Fresco da Fazenda',
    productSellPrice: 85,
    productionIntervalDays: 1,
    canReproduce: true,
    behaviorNotes: 'Fornecem leite diário para manteiga e queijo regional e podem gerar bezerros até o limite máximo do curral.',
    primaryColor: '#f2e5c9',
    accentColor: '#4a2e1b'
  },
  peixe_viveiro: {
    id: 'peixe_viveiro',
    name: 'Peixes em Viveiro Escavado (Tambaqui)',
    singularName: 'Lote de Tambaqui de Viveiro',
    shelterName: 'Açude / Viveiro Piscícola',
    buyPrice: 160,
    sellAdultPrice: 360,
    maxPerShelter: 6,
    daysToMature: 4,
    feedItem: 'Ração de Frutas & Milho',
    dailyFeedCost: 8,
    productId: 'tambaqui_viveiro',
    productName: 'Tambaqui Gordo de Viveiro',
    productSellPrice: 110,
    productionIntervalDays: 3,
    canReproduce: false, // Alevinos são adquiridos; cresce ao longo do tempo sem superpopulação
    behaviorNotes: 'Diferente da pesca extrativa no rio, a piscicultura em viveiro garante fornecimento planejado de tambaquis para a feira e contratos.',
    primaryColor: '#326d8c',
    accentColor: '#4b833b'
  }
};

export const ANIMAL_CATEGORY_LIST = Object.values(ANIMAL_CATEGORIES);
