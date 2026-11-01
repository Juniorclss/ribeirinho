/**
 * FASE 1: DIREÇÃO DE ARTE & PALETA VISUAL (16-BIT SNES — VALE DO JURUÁ, ACRE)
 * Referências de design: Harvest Moon (SNES 1996), Zelda: A Link to the Past, Stardew Valley.
 * Proibido: filtro verde global, cores neon fluorescentes, contornos pretos grossos demais,
 * cabeças gigantes caricaturais ou árvores de círculos empilhados.
 */

export const JURUA_PALETTE = {
  // Vegetação (distribuída com equilíbrio, sem filtro verde global)
  forestDeep: '#1d4d2b',      // Verde-floresta profundo (copa densa de Samaúma/Castanheira)
  forestMid: '#2e6f3e',       // Verde-mata intermediário
  oliveLeaf: '#4b833b',       // Verde-oliva amazônico
  sunlitLeaf: '#7cb342',      // Verde-claro para vegetação iluminada pelo sol
  highlightLeaf: '#a5cf61',   // Brilho suave de folhagem no topo

  // Rios, Igarapés e Céu (distinguíveis imediatamente da vegetação)
  juruaDeep: '#1d4e6e',       // Azul profundo do Rio Juruá e canais navegáveis
  juruaSilty: '#326d8c',      // Azul-acinzentado barrento típico das águas do Juruá
  igarapeClear: '#4b8da8',    // Água mais rasa/cristalina de igarapé (Croa / Miritizal)
  waterFoam: '#b3dce8',       // Espuma e reflexo de correnteza
  skyMorning: '#7ec0ee',      // Azul suave para o céu da manhã
  skyGolden: '#e89954',       // Entardecer amazônico sobre o rio

  // Terra, Estradas e Barro (alto contraste com a grama)
  earthDry: '#8c583a',        // Terra firme / caminho rural compactado
  earthLight: '#ab734f',      // Estrada de barro seco iluminada
  soilTilled: '#5c3824',      // Roçado capinado e arado (legível por textura de sulcos + cor)
  soilWatered: '#3d2214',     // Solo irrigado / úmido de chuva
  sandBank: '#d9be8b',        // Praia de rio / barranco arenoso do Juruá

  // Madeira Regional, Palafitas e Telhados
  woodDark: '#4a2e1b',        // Itaúba / Maçaranduba escura (vigas e esteios de palafita)
  woodMid: '#73482b',         // Tábuas de madeira de lei serrada
  woodLight: '#9c663e',       // Assoalho e cercas de madeira clara
  terracottaDark: '#8f3926',  // Telhado de barro queimado (sombra)
  terracottaMid: '#b84d35',   // Terracota para barro, fornos e telhados coloniais/regionais
  terracottaLight: '#d66b4e', // Telha iluminada
  strawDark: '#b89644',       // Palha de buriti/ouricuri (sombra)
  strawYellow: '#dfc16d',     // Amarelo-palha para fibras, cestos e coberturas naturais
  wallCream: '#f2e5c9',       // Bege e creme para paredes caiadas e interiores
  wallBeige: '#d8c5a3',       // Sombra suave de parede

  // Frutas, Flores, Roupas e Objetos (pontos cromáticos vibrantes mas naturais)
  acaiPurple: '#3b1c47',      // Roxo intenso do cacho de açaí
  acaiBerry: '#5a2d6b',
  cupuacuBrown: '#6e4726',    // Casca aveludada do cupuaçu
  cupuacuPulp: '#f7efd2',     // Polpa creme aromática
  cassavaRoot: '#69442c',     // Casca da mandioca/macaxeira
  cassavaFlesh: '#f5ecd7',    // Interior branco da raiz
  farinhaGold: '#e8c86b',     // Farinha de mandioca torrada de Cruzeiro do Sul
  cornGold: '#f0b938',        // Milho regional
  pepperRed: '#c9342b',       // Pimenta-de-cheiro madura
  pepperOrange: '#e3772b',    // Pimenta-de-cheiro alaranjada
  cocoaGold: '#d4892a',       // Cacau nativo maduro
  bananaYellow: '#ebca44',    // Banana comprida
  shirtRiverBlue: '#2c6896',  // Roupa do protagonista (azul ribeirinho)
  hatStraw: '#e3c36f',        // Chapéu de palha regional
  skinWarm: '#c68659',        // Pele morena amazônica
  skinShadow: '#995e38',
  outlineSoft: '#241811',     // Contorno sépia escuro suave (1px, nunca preto grosso pesado)
} as const;

export interface ArtSampleSpec {
  id: string;
  number: number;
  title: string;
  dimensions: string;
  paletteKeys: (keyof typeof JURUA_PALETTE)[];
  designNotes: string;
}

export const PHASE_2_ART_SAMPLES: ArtSampleSpec[] = [
  {
    id: 'protagonist',
    number: 1,
    title: 'Protagonista Ribeirinho 32-Bits (32×48 px HD)',
    dimensions: '32×48 px em True-Color 32-Bits RGBA',
    paletteKeys: ['hatStraw', 'shirtRiverBlue', 'skinWarm', 'woodDark', 'outlineSoft'],
    designNotes: 'Modelagem 32-bits com sombreamento volumétrico: chapéu de palha trançado com fita vermelha, camisa azul de trabalho, calça de brim, botas de couro e mochila costurada.'
  },
  {
    id: 'amazon_tree',
    number: 2,
    title: 'Árvore Amazônica — Samaúma & Açaizeiro 32-Bits (64×64 px)',
    dimensions: '64×64 px em 32-Bits com 7 camadas de folhagem',
    paletteKeys: ['forestDeep', 'forestMid', 'oliveLeaf', 'sunlitLeaf', 'woodDark', 'acaiPurple'],
    designNotes: 'Sapopemas (raízes tabulares) esculpidas em 3D na base, tronco com casca iluminada e copa folhosa multi-esférica orgânica em 32-bits.'
  },
  {
    id: 'road_segment',
    number: 3,
    title: 'Tileset 32-Bits: Estrada Rural, Grama & Terra Preta (32×32 px)',
    dimensions: '32×32 px modular com autotiling orgânico e gradientes RGBA',
    paletteKeys: ['earthDry', 'earthLight', 'soilTilled', 'oliveLeaf', 'sandBank'],
    designNotes: 'Transições orgânicas de capim sobreposto, sulcos de roda suavizados e leiras esculpidas em Terra Preta de Índio sem ruído de xadrez.'
  },
  {
    id: 'river_segment',
    number: 4,
    title: 'Rio Juruá, Trapiche & Canoa em 32-Bits (64×64 px)',
    dimensions: '32×32 px animado com cáusticas e reflexos especulares',
    paletteKeys: ['juruaDeep', 'juruaSilty', 'igarapeClear', 'waterFoam', 'sandBank'],
    designNotes: 'Água 32-bits com gradiente de profundidade, espuma na margem, trapiche em madeira de lei chanfrada e canoa com esteira hidrodinâmica.'
  },
  {
    id: 'wooden_house',
    number: 5,
    title: 'Casa Ribeirinha em Palafitas 32-Bits (Perspectiva 3/4)',
    dimensions: '64×64 px com telhas coloniais boleadas e luz quente',
    paletteKeys: ['woodDark', 'woodMid', 'woodLight', 'terracottaMid', 'terracottaLight', 'wallCream'],
    designNotes: 'Arquitetura tradicional do Juruá em 32-bits: esteios de madeira elevados, escada frontal em 3D, janelas iluminadas com halo quente e telhado cerâmico.'
  },
  {
    id: 'crop_mandioca',
    number: 6,
    title: 'Ciclo Botânico 32-Bits da Mandioca em 4 Estágios',
    dimensions: '32×32 px por estágio (Broto → Touceira → Floração → Safra Madura)',
    paletteKeys: ['soilTilled', 'soilWatered', 'oliveLeaf', 'sunlitLeaf', 'cassavaRoot', 'cassavaFlesh'],
    designNotes: 'Leiras agrícolas 3D com diferenciação de umidade, folhas palmadas de 5 pontas da maniva e raízes tuberosas aparentes na colheita.'
  },
  {
    id: 'animal_duck_cow',
    number: 7,
    title: 'Criações da Fazenda em 32-Bits — Vaca Malhada & Galinha Carijó',
    dimensions: '32×32 px com silhuetas anatômicas arredondadas',
    paletteKeys: ['wallCream', 'woodMid', 'earthDry', 'bananaYellow', 'outlineSoft'],
    designNotes: 'Modelagem orgânica 32-bits com pelagem malhada, penas na asa, crista vermelha, chifres, focinho rosado e animação de passos.'
  },
  {
    id: 'ui_frame_set',
    number: 8,
    title: 'Retrato 32-Bits HD & Interface em Madeira de Lei (64×64 px)',
    dimensions: 'Retratos 64×64 px + Ícones Botânicos 32×32 px',
    paletteKeys: ['woodDark', 'woodMid', 'strawYellow', 'wallCream', 'outlineSoft'],
    designNotes: 'Retratos detalhados em 32-bits para o protagonista e todos os 18 moradores de Cruzeiro do Sul, integrados às molduras em madeira e dourado.'
  }
];
