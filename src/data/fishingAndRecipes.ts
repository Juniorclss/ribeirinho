/**
 * FASE 8, 14 & 15: PESCA AMAZÔNICA, EXPLORAÇÃO SUSTENTÁVEL DA FLORESTA E PROCESSAMENTO DE ALIMENTOS
 */

export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  locations: ('rio_jurua' | 'igarape_floresta' | 'porto_trapiche')[];
  preferredBait: 'minhoca' | 'fruto_mata' | 'isca_peixe';
  preferredTime: ('manha' | 'tarde' | 'noite')[];
  preferredWeather: ('sol' | 'chuva' | 'nublado')[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  rarity: 'comum' | 'incomum' | 'raro' | 'lendario';
  minSizeCm: number;
  maxSizeCm: number;
  basePrice: number;
  energyRestored: number;
  description: string;
  color: string;
}

export const FISH_SPECIES: Record<string, FishSpecies> = {
  jaraqui: {
    id: 'jaraqui',
    name: 'Jaraqui de Escama',
    scientificName: 'Semaprochilodus insignis',
    locations: ['rio_jurua', 'porto_trapiche', 'igarape_floresta'],
    preferredBait: 'minhoca',
    preferredTime: ['manha', 'tarde'],
    preferredWeather: ['sol', 'nublado', 'chuva'],
    difficulty: 1,
    rarity: 'comum',
    minSizeCm: 22,
    maxSizeCm: 36,
    basePrice: 38,
    energyRestored: 28,
    description: 'Diz o ditado: "Quem come jaraqui, não sai mais daqui". Peixe de cardume muito apreciado frito com farinha de Cruzeiro do Sul.',
    color: '#9db4c0'
  },
  mandim: {
    id: 'mandim',
    name: 'Mandim do Juruá',
    scientificName: 'Pimelodus blochii',
    locations: ['porto_trapiche', 'rio_jurua'],
    preferredBait: 'minhoca',
    preferredTime: ['tarde', 'noite'],
    preferredWeather: ['nublado', 'chuva'],
    difficulty: 2,
    rarity: 'comum',
    minSizeCm: 18,
    maxSizeCm: 30,
    basePrice: 44,
    energyRestored: 30,
    description: 'Bagre de couro muito comum nas margens barrentas do Juruá, ingrediente clássico das mujecas e caldos ribeirinhos.',
    color: '#c9a66b'
  },
  tambaqui: {
    id: 'tambaqui',
    name: 'Tambaqui Nativo',
    scientificName: 'Colossoma macropomum',
    locations: ['rio_jurua', 'igarape_floresta'],
    preferredBait: 'fruto_mata',
    preferredTime: ['manha', 'tarde'],
    preferredWeather: ['chuva', 'nublado'],
    difficulty: 3,
    rarity: 'incomum',
    minSizeCm: 45,
    maxSizeCm: 95,
    basePrice: 115,
    energyRestored: 55,
    description: 'Rei dos peixes de escama da Amazônia. Alimenta-se de frutos e sementes que caem na água durante a cheia.',
    color: '#3f5e4d'
  },
  tucunare: {
    id: 'tucunare',
    name: 'Tucunaré-Açú',
    scientificName: 'Cichla monoculus',
    locations: ['igarape_floresta'],
    preferredBait: 'isca_peixe',
    preferredTime: ['manha', 'tarde'],
    preferredWeather: ['sol'],
    difficulty: 3,
    rarity: 'incomum',
    minSizeCm: 35,
    maxSizeCm: 70,
    basePrice: 98,
    energyRestored: 48,
    description: 'Predador ágil das águas mais calmas de igarapés e lagos marginais, famoso pela mancha ocelar no rabo.',
    color: '#d4a024'
  },
  surubim: {
    id: 'surubim',
    name: 'Surubim Caparari',
    scientificName: 'Pseudoplatystoma tigrinum',
    locations: ['rio_jurua', 'porto_trapiche'],
    preferredBait: 'isca_peixe',
    preferredTime: ['noite', 'tarde'],
    preferredWeather: ['chuva', 'nublado'],
    difficulty: 4,
    rarity: 'raro',
    minSizeCm: 65,
    maxSizeCm: 130,
    basePrice: 165,
    energyRestored: 65,
    description: 'Grande bagre listrado dos canais fundos do Rio Juruá. Sua carne branca sem espinhas alcança ótimo preço na Peixaria.',
    color: '#5a6e7f'
  },
  pirarucu: {
    id: 'pirarucu',
    name: 'Pirarucu de Manejo Sustentável',
    scientificName: 'Arapaima gigas',
    locations: ['rio_jurua', 'igarape_floresta'],
    preferredBait: 'isca_peixe',
    preferredTime: ['manha', 'tarde'],
    preferredWeather: ['sol', 'nublado'],
    difficulty: 5,
    rarity: 'lendario',
    minSizeCm: 150,
    maxSizeCm: 240,
    basePrice: 280,
    energyRestored: 90,
    description: 'Gigante ancestral das águas amazônicas. Sua captura respeita tamanho mínimo e cotas de manejo comunitário.',
    color: '#8f3926'
  }
};

export interface ProcessingRecipe {
  id: string;
  name: string;
  station: 'casa_de_farinha' | 'despolpadeira' | 'cozinha_ribeirinha' | 'queijaria';
  stationLabel: string;
  inputs: { itemId: string; itemName: string; quantity: number }[];
  outputId: string;
  outputQuantity: number;
  sellPrice: number;
  energyRestored: number;
  processingHours: number;
  description: string;
}

export const PROCESSING_RECIPES: Record<string, ProcessingRecipe> = {
  farinha_mandioca: {
    id: 'farinha_mandioca',
    name: 'Farinha de Mandioca de Cruzeiro do Sul (IG)',
    station: 'casa_de_farinha',
    stationLabel: 'Casa de Farinha',
    inputs: [{ itemId: 'mandioca', itemName: 'Mandioca Brava', quantity: 2 }],
    outputId: 'farinha_mandioca',
    outputQuantity: 2,
    sellPrice: 125, // 2 mandiocas = 130 bruta, 2 sacas de farinha = 250! Recompensa o trabalho
    energyRestored: 45,
    processingHours: 2,
    description: 'Patrimônio com Indicação Geográfica do Vale do Juruá. Torrada no tacho com coco de babaçu/buriti até ficar crocante e amarelinha.'
  },
  goma_tapioca: {
    id: 'goma_tapioca',
    name: 'Goma Fresca de Tapioca & Tucupi',
    station: 'casa_de_farinha',
    stationLabel: 'Casa de Farinha',
    inputs: [{ itemId: 'mandioca', itemName: 'Mandioca Brava', quantity: 2 }],
    outputId: 'goma_tapioca',
    outputQuantity: 2,
    sellPrice: 115,
    energyRestored: 50,
    processingHours: 2,
    description: 'Fécula decantada da prensagem da massa de mandioca, acompanhada do tucupi amarelo fervido com chicória e alho.'
  },
  polpa_acai: {
    id: 'polpa_acai',
    name: 'Vinho / Polpa Grossa de Açaí',
    station: 'despolpadeira',
    stationLabel: 'Despolpadeira de Frutas',
    inputs: [{ itemId: 'acai', itemName: 'Açaí Solteiro', quantity: 2 }],
    outputId: 'polpa_acai',
    outputQuantity: 2,
    sellPrice: 145,
    energyRestored: 75,
    processingHours: 1,
    description: 'Açaí amolecido em água morna e batido na hora. Consumido tradicionalmente com farinha torrada e peixe frito.'
  },
  polpa_cupuacu: {
    id: 'polpa_cupuacu',
    name: 'Polpa & Doce de Cupuaçu',
    station: 'despolpadeira',
    stationLabel: 'Despolpadeira de Frutas',
    inputs: [
      { itemId: 'cupuacu', itemName: 'Cupuaçu', quantity: 1 },
      { itemId: 'cana', itemName: 'Cana-de-Açúcar', quantity: 1 }
    ],
    outputId: 'polpa_cupuacu',
    outputQuantity: 2,
    sellPrice: 140,
    energyRestored: 65,
    processingHours: 2,
    description: 'Polpa extraída na tesoura e apurada no tacho com caldo de cana do próprio roçado.'
  },
  chocolate_artesanal: {
    id: 'chocolate_artesanal',
    name: 'Chocolate Artesanal 70% Juruá',
    station: 'despolpadeira',
    stationLabel: 'Beneficiamento Agroflorestal',
    inputs: [
      { itemId: 'cacau', itemName: 'Cacau Nativo', quantity: 2 },
      { itemId: 'cana', itemName: 'Cana-de-Açúcar', quantity: 1 }
    ],
    outputId: 'chocolate_artesanal',
    outputQuantity: 2,
    sellPrice: 185,
    energyRestored: 70,
    processingHours: 3,
    description: 'Amêndoas de cacau amazônico torradas e moídas com açúcar mascavo artesanal.'
  },
  caldeirada_tambaqui: {
    id: 'caldeirada_tambaqui',
    name: 'Caldeirada Ribeirinha de Tambaqui',
    station: 'cozinha_ribeirinha',
    stationLabel: 'Fogão a Lenha',
    inputs: [
      { itemId: 'tambaqui', itemName: 'Tambaqui', quantity: 1 },
      { itemId: 'pimenta_de_cheiro', itemName: 'Pimenta-de-Cheiro', quantity: 1 },
      { itemId: 'cheiro_verde', itemName: 'Cheiro-Verde', quantity: 1 }
    ],
    outputId: 'caldeirada_tambaqui',
    outputQuantity: 2,
    sellPrice: 175,
    energyRestored: 95,
    processingHours: 1,
    description: 'Postas suculentas de tambaqui cozidas com pimenta-de-cheiro, coentro, cebolinha e ovos caipiras.'
  },
  mujeca_peixe: {
    id: 'mujeca_peixe',
    name: 'Mujeca Acreana de Mandim com Farinha',
    station: 'cozinha_ribeirinha',
    stationLabel: 'Fogão a Lenha',
    inputs: [
      { itemId: 'mandim', itemName: 'Mandim do Juruá', quantity: 1 },
      { itemId: 'farinha_mandioca', itemName: 'Farinha de Mandioca', quantity: 1 }
    ],
    outputId: 'mujeca_peixe',
    outputQuantity: 2,
    sellPrice: 155,
    energyRestored: 85,
    processingHours: 1,
    description: 'Ensopado espesso e reconfortante de peixe de couro engrossado com farinha fina e temperos do quintal.'
  },
  queijo_regional: {
    id: 'queijo_regional',
    name: 'Queijo Manteiga da Colônia',
    station: 'queijaria',
    stationLabel: 'Prensa de Queijos',
    inputs: [{ itemId: 'leite_vaca', itemName: 'Leite Fresco da Fazenda', quantity: 2 }],
    outputId: 'queijo_regional',
    outputQuantity: 2,
    sellPrice: 160,
    energyRestored: 68,
    processingHours: 2,
    description: 'Queijo curado prensado em formas de madeira, muito disputado nas manhãs do Mercado Municipal.'
  },
  queijo_cabra: {
    id: 'queijo_cabra',
    name: 'Queijo Temperado de Cabra com Pimenta',
    station: 'queijaria',
    stationLabel: 'Prensa de Queijos',
    inputs: [
      { itemId: 'leite_cabra', itemName: 'Leite de Cabra Fresco', quantity: 1 },
      { itemId: 'pimenta_de_cheiro', itemName: 'Pimenta-de-Cheiro', quantity: 1 }
    ],
    outputId: 'queijo_cabra',
    outputQuantity: 2,
    sellPrice: 135,
    energyRestored: 60,
    processingHours: 2,
    description: 'Queijo macio de cabra aromatizado com pimenta-de-cheiro colhida na horta.'
  },
  rapadura_gramixote: {
    id: 'rapadura_gramixote',
    name: 'Gramixote & Garapa de Cana',
    station: 'casa_de_farinha',
    stationLabel: 'Engenho & Tacho de Cobre',
    inputs: [{ itemId: 'cana', itemName: 'Cana-de-Açúcar Caiana', quantity: 2 }],
    outputId: 'rapadura_gramixote',
    outputQuantity: 2,
    sellPrice: 110,
    energyRestored: 60,
    processingHours: 2,
    description: 'Doce tradicional de Cruzeiro do Sul feito do melado de cana batido no ponto exato.'
  }
};

export const RECIPE_LIST = Object.values(PROCESSING_RECIPES);
export const FISH_LIST = Object.values(FISH_SPECIES);
