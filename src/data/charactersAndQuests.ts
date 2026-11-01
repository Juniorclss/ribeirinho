/**
 * FASE 7, 10, 17, 18 & 19: 18 PERSONAGENS ORIGINAIS, MISSÕES VERIFICÁVEIS,
 * CAMPANHA DE QUATRO ANOS E FESTIVAIS ANUAIS DE CRUZEIRO DO SUL.
 */

import { MapId } from './maps';

export interface CharacterDefinition {
  id: string;
  name: string;
  role: string;
  homeMap: MapId;
  x: number;
  y: number;
  shirtColor: string;
  hatColor: string | null;
  hairColor: string;
  personality: string;
  scheduleSummary: string;
  favoriteItems: string[];
  dialogues: {
    greeting: string;
    year1: string;
    year2: string;
    year3: string;
    year4: string;
  };
  personalQuestId: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  giverId: string;
  giverName: string;
  yearUnlock: 1 | 2 | 3 | 4;
  category: 'historia' | 'comercio' | 'comunidade' | 'ambiental';
  description: string;
  objectiveText: string;
  requirementType: 'till_soil' | 'harvest_crop' | 'deliver_item' | 'catch_fish' | 'raise_animal' | 'process_food' | 'earn_money';
  targetId?: string;
  targetCount: number;
  rewardMoney: number;
  rewardReputation: number;
  rewardUnlockText: string;
}

export interface CampaignYearInfo {
  year: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  theme: string;
  milestones: string[];
  worldChanges: string[];
}

export interface FestivalDefinition {
  id: string;
  name: string;
  seasonIndex: 0 | 1 | 2 | 3; // 0=Inverno, 1=Vazante, 2=Verão, 3=Enchente
  dayOfMonth: number;
  locationMap: MapId;
  description: string;
  featuredItem: string;
  rewardMoney: number;
  bonusHeartPoints: number;
}

export const CAMPAIGN_YEARS: CampaignYearInfo[] = [
  {
    year: 1,
    title: 'Ano 1 — Raízes',
    subtitle: 'O Retorno ao Vale do Juruá',
    theme: 'Recuperar o sítio da família, limpar o roçado, aprender o ciclo da mandioca, pescar no Juruá e realizar as primeiras entregas na feira.',
    milestones: [
      'Preparar e plantar as primeiras covas de Mandioca e Milho no roçado familiar',
      'Reativar o forno da Casa de Farinha com ajuda de Seu Raimundo',
      'Conhecer os comerciantes da Vila do Miritizal e do Mercado Municipal',
      'Realizar a primeira entrega de Farinha de Mandioca na Feira'
    ],
    worldChanges: [
      'O terreiro da fazenda fica limpo de capim alto',
      'A Casa de Farinha volta a soltar fumaça perfumada de torra',
      'A banca da família é reaberta na Feira de Cruzeiro do Sul'
    ]
  },
  {
    year: 2,
    title: 'Ano 2 — Colheita',
    subtitle: 'Agrofloresta, Criação e Beneficiamento',
    theme: 'Expandir o pomar de açaí e cupuaçu, iniciar a criação das 6 categorias de animais, despolpar frutas e firmar contratos comerciais.',
    milestones: [
      'Colher cachos de Açaí Solteiro e Cupuaçu no pomar agroflorestal',
      'Criar aves, pequenos ruminantes, gado leiteiro e tambaquis em viveiro',
      'Processar Polpa de Açaí e Queijo Manteiga da Colônia',
      'Cumprir contratos de fornecimento para o Mercado e Porto'
    ],
    worldChanges: [
      'Novas bancas e fachada revitalizada no Centro Comercial',
      'Linha de ônibus rural ganha horários ampliados na Rodoviária',
      'Viveiro escavado da propriedade fica repleto de tambaquis'
    ]
  },
  {
    year: 3,
    title: 'Ano 3 — Comunidade',
    subtitle: 'Cooperação Ribeirinha e Manejo Sustentável',
    theme: 'Fortalecer a cooperativa dos produtores do Juruá, apoiar o manejo sustentável do pirarucu e proteger os igarapés durante a grande cheia.',
    milestones: [
      'Auxiliar Mestre Zé Bento no reparo das canoas comunitárias do Porto',
      'Atingir a cota sustentável de manejo nos lagos e igarapés',
      'Fornecer alimentos para a Comunidade durante as chuvas intensas',
      'Alcançar amizade elevada com os moradores da região'
    ],
    worldChanges: [
      'Trapiche do Porto do Juruá recebe madeira nova e iluminação',
      'Trilha ecológica da Floresta e Igarapé ganha ponte de madeira restaurada',
      'Selo de Indicação Geográfica valoriza produtos processados em +20%'
    ]
  },
  {
    year: 4,
    title: 'Ano 4 — Legado',
    subtitle: 'O Futuro de Cruzeiro do Sul',
    theme: 'Consolidar a propriedade modelo do Alto Juruá, celebrar a Grande Festa da Farinha e escolher o foco do legado comunitário.',
    milestones: [
      'Completar a coleção do Livro Agrícola e Receitas Regionais',
      'Organizar a Grande Celebração do Vale do Juruá no Centro e Feira',
      'Escolher a vocação do Legado Familiar (Escola Agroflorestal, Cooperativa de Farinha IG ou Centro de Manejo Fluvial)',
      'Continuar expandindo a fazenda livremente após os créditos'
    ],
    worldChanges: [
      'Monumento e placa de homenagem na Praça de Cruzeiro do Sul',
      'Propriedade familiar completa com todas as estruturas em pleno vigor'
    ]
  }
];

export const FESTIVALS_DATA: FestivalDefinition[] = [
  {
    id: 'festival_pesca',
    name: 'Festival da Pesca Sustentável do Juruá',
    seasonIndex: 0,
    dayOfMonth: 7,
    locationMap: 'porto',
    description: 'Pescadores ribeirinhos reúnem suas canoas no Porto para celebrar o manejo consciente do tambaqui e do pirarucu.',
    featuredItem: 'tambaqui',
    rewardMoney: 350,
    bonusHeartPoints: 20
  },
  {
    id: 'feira_colheita',
    name: 'Feira da Colheita e Agricultura Familiar',
    seasonIndex: 1,
    dayOfMonth: 7,
    locationMap: 'feira',
    description: 'Exposição das melhores raízes, grãos e frutas colhidas nos roçados e praias de várzea da região.',
    featuredItem: 'mandioca',
    rewardMoney: 400,
    bonusHeartPoints: 25
  },
  {
    id: 'festival_farinha',
    name: 'Festival da Farinha e Gastronomia Acreana',
    seasonIndex: 2,
    dayOfMonth: 7,
    locationMap: 'centro',
    description: 'Grande festa no Centro de Cruzeiro do Sul celebrando a tradicional farinha torrada, caldeiradas, açaí grosso e gramixote.',
    featuredItem: 'farinha_mandioca',
    rewardMoney: 550,
    bonusHeartPoints: 30
  },
  {
    id: 'celebracao_comunitaria',
    name: 'Celebração Comunitária do Miritizal',
    seasonIndex: 3,
    dayOfMonth: 7,
    locationMap: 'vila',
    description: 'Encontro anual de música, histórias familiares e partilha de sementes para o novo ciclo agrícola.',
    featuredItem: 'polpa_acai',
    rewardMoney: 450,
    bonusHeartPoints: 30
  }
];

export const CHARACTERS_DATA: CharacterDefinition[] = [
  {
    id: 'dona_francisca',
    name: 'Dona Francisca',
    role: 'Matriarca & Guardiã de Sementes',
    homeMap: 'vila',
    x: 10,
    y: 8,
    shirtColor: '#b84d35',
    hatColor: '#dfc16d',
    hairColor: '#d8c5a3',
    personality: 'Acolhedora, bem-humorada e grande conhecedora do tempo das águas e das luas.',
    scheduleSummary: 'Pela manhã cuida da horta na Vila; à tarde toma café na varanda conversando com os vizinhos.',
    favoriteItems: ['macaxeira', 'polpa_cupuacu', 'cheiro_verde'],
    dialogues: {
      greeting: 'Deus te abençoe, Cauã! Que gosto me dá ver a janela da casa do teu avô aberta outra vez. Já tomou café hoje?',
      year1: 'Olha, o segredo no começo é não querer abraçar o mundo de uma vez. Limpa umas covas, planta tua mandioca e molha todo dia que a terra responde depressa!',
      year2: 'Passei perto da tua cerca ontem e vi os pés de açaí e cupuaçu espichando. Teu avô ia abrir um sorriso largo vendo esse capricho.',
      year3: 'Quando a chuva engrossa aqui no Juruá, quem tem vizinho bom não passa aperto. A cooperativa que vocês firmaram salvou muita gente.',
      year4: 'Quem diria, hein menino? Tu chegou aqui com uma mochila nas costas e hoje esse sítio é a alegria da nossa beira de rio!'
    },
    personalQuestId: 'q1_recuperar_rocado'
  },
  {
    id: 'seu_raimundo',
    name: 'Seu Raimundo Farinheiro',
    role: 'Mestre da Casa de Farinha',
    homeMap: 'fazenda',
    x: 18,
    y: 5,
    shirtColor: '#15803d',
    hatColor: '#e3c36f',
    hairColor: '#9e9e9e',
    personality: 'Mestre farinheiro veterano, conversa franca, ri alto e conhece o ponto da torra pelo cheiro.',
    scheduleSummary: 'Cuida da fornalha e do tacho de cobre na Casa de Farinha; à tarde leva sacas para a Feira.',
    favoriteItems: ['farinha_mandioca', 'mandioca', 'rapadura_gramixote'],
    dialogues: {
      greeting: 'Opa, chega mais perto do forno, rapaz! Sentiu esse cheirinho de massa torrando no tacho de cobre? Isso aqui levanta até defunto!',
      year1: 'Assim que tu arrancar as primeiras mandiocas lá do canteiro, traz pra cá. Vou te ensinar a espremer no tipiti e mexer no rodo sem deixar queimar!',
      year2: 'Rapaz, o pessoal lá do Mercado Municipal nem espera eu descarregar os sacos! Falou que a farinha é do Sítio Boa Esperança, vende tudo na hora.',
      year3: 'Quarenta anos mexendo tacho na beira do Juruá e nunca vi uma safra tão limpa e torradinha quanto a que a gente tirou esse mês.',
      year4: 'Trabalhei a vida inteira lado a lado com teu avô, Cauã... e vou te falar uma coisa: tu herdou a mão boa dele pra roça e pro forno!'
    },
    personalQuestId: 'q2_casa_de_farinha'
  },
  {
    id: 'mestre_ze_bento',
    name: 'Mestre Zé Bento',
    role: 'Carpinteiro Naval & Pescador',
    homeMap: 'porto',
    x: 11,
    y: 10,
    shirtColor: '#2c6896',
    hatColor: '#b89644',
    hairColor: '#5c3824',
    personality: 'Contador de histórias de beira de rio, paciente, conhece cada remanso do Juruá.',
    scheduleSummary: 'Calafeta canoas e batelões no Porto pela manhã; pesca na sombra do barranco à tarde.',
    favoriteItems: ['tambaqui', 'surubim', 'caldeirada_tambaqui'],
    dialogues: {
      greeting: 'Fala, meu garoto! Tá vendo como a água do Juruá tá barrenta e mansa hoje? Dia perfeito pra jogar a linha ali na ponta do trapiche.',
      year1: 'Deixei a canoa de madeira da tua família bem amarrada lá no trapiche do sítio. Quando quiser pescar ou cortar caminho pelo rio, é só pegar o remo!',
      year2: 'Passei breu e estopa nova nas tábuas do teu barco. Pode carregar de banana e farinha que ela corta o banzeiro macio que só.',
      year3: 'Depois que a gente combinou de respeitar a época de reprodução nos lagos, os tambaquis voltaram a bater pesado perto da margem!',
      year4: 'Tu já lê os redemoinhos da água feito caboclo nascido na canoa, Cauã. O rio te reconhece como amigo.'
    },
    personalQuestId: 'q3_reparo_canoa'
  },
  {
    id: 'iara_botanica',
    name: 'Iara Nogueira',
    role: 'Engenheira Florestal & Agroecóloga',
    homeMap: 'floresta',
    x: 13,
    y: 9,
    shirtColor: '#2e6f3e',
    hatColor: null,
    hairColor: '#241811',
    personality: 'Entusiasmada, conversa olhando as folhas e frutos, apaixonada pela mata nativa.',
    scheduleSummary: 'Percorre a trilha do igarapé coletando sementes pela manhã; passa na Vila ao entardecer.',
    favoriteItems: ['acai', 'cacau', 'polpa_acai'],
    dialogues: {
      greeting: 'Oi, Cauã! Que bom te encontrar por aqui. Repara só como a brisa fica fresquinha debaixo dessas samaúmas e açaizeiros!',
      year1: 'Se tu plantar fruteiras perto da roça de mandioca, as folhas que caem adubam a terra sozinhas e seguram a umidade nos dias quentes.',
      year2: 'Vim medir a água aqui do igarapé hoje cedo e fiquei boba de ver: limpa, geladinha e cheia de alevinos nadando na margem!',
      year3: 'Teu consórcio de açaí com cupuaçu ficou tão bonito que tirei fotos pra mostrar pros produtores lá de Mâncio Lima e Rodrigues Alves.',
      year4: 'Provar que dá pra produzir muito mantendo a floresta em pé era o nosso maior sonho. E tu fez acontecer bem aqui!'
    },
    personalQuestId: 'q5_agrofloresta_acai'
  },
  {
    id: 'mateus_feirante',
    name: 'Mateus do Mercado',
    role: 'Coordenador da Feira do Produtor',
    homeMap: 'feira',
    x: 12,
    y: 7,
    shirtColor: '#1d4ed8',
    hatColor: '#dfc16d',
    hairColor: '#4a2e1b',
    personality: 'Animado, cumprimenta todo mundo pelo nome e adora negociar uma boa safra.',
    scheduleSummary: 'Abre os galpões da Feira às 6h da manhã e organiza as entregas e contratos.',
    favoriteItems: ['farinha_mandioca', 'banana', 'abacaxi'],
    dialogues: {
      greeting: 'E aí, parceiro! Trouxe colheita nova hoje? O movimento aqui na feira começou cedo e o povo tá procurando produto da roça!',
      year1: 'Sempre que colher mandioca, milho ou fruta madura, passa aqui na banca. Se quiser ganhar um extra, olha os pedidos no quadro de encomendas!',
      year2: 'Cara, quando tu traz polpa batida e farinha quentinha, não dura meia hora no balcão. Os restaurantes da cidade compram tudo!',
      year3: 'A gente conseguiu fechar parceria com as escolas e mercados do Centro. Preço justo pra quem planta e comida boa na mesa do povo!',
      year4: 'Olha pra esse galpão cheio de cor e fartura, Cauã... A tua banca é o carro-chefe da Feira de Cruzeiro do Sul!'
    },
    personalQuestId: 'q4_banca_feira'
  },
  {
    id: 'dona_nazaré',
    name: 'Dona Nazaré das Sementes',
    role: 'Proprietária da Casa Agrícola Juruá',
    homeMap: 'centro',
    x: 8,
    y: 7,
    shirtColor: '#7cb342',
    hatColor: null,
    hairColor: '#69442c',
    personality: 'Atenciosa, conhece a época certa de cada semente e nunca deixa um produtor sair de mãos vazias.',
    scheduleSummary: 'Cuida das prateleiras de sementes e mudas na Casa Agrícola no Centro.',
    favoriteItems: ['pimenta_de_cheiro', 'maracuja', 'cupuacu'],
    dialogues: {
      greeting: 'Bom dia, querido! Entra, fica à vontade. Acabei de separar os pacotes de sementes novas que chegaram pra esta estação!',
      year1: 'Cada época do ano pede a planta certa, viu? No inverno as fruteiras e o arroz vão que é uma beleza; na vazante, feijão-de-praia e melancia não têm erro.',
      year2: 'Separei umas mudas enxertadas de cupuaçu e guaraná especialmente pro teu terreno. Vão carregar de fruto rapidinho!',
      year3: 'Meus clientes vivem perguntando qual adubo tu usa, e eu sempre respondo: é cuidado diário e respeito pelo tempo da terra!',
      year4: 'Ver todas as dezesseis culturas da nossa região crescendo viçosas lá no teu sítio é a melhor propaganda que minha loja podia ter!'
    },
    personalQuestId: 'q6_diversificacao_culturas'
  },
  {
    id: 'chico_motorista',
    name: 'Chico da Linha Rural',
    role: 'Motorista do Ônibus Rural & Rodoviária',
    homeMap: 'rodoviaria',
    x: 11,
    y: 9,
    shirtColor: '#326d8c',
    hatColor: '#241811',
    hairColor: '#241811',
    personality: 'Bem-humorado, buzina pra cumprimentar os vizinhos e ajuda a subir os sacos no bagageiro.',
    scheduleSummary: 'Dirige o ônibus amarelo da linha rural entre a Rodoviária, o Centro e a Estrada.',
    favoriteItems: ['bolo_macaxeira', 'garapa_cana', 'banana'],
    dialogues: {
      greeting: 'Diga lá, meu campeão! Vai pra cidade ou tá voltando pro ramal? Pode subir que no bagageiro sempre cabe mais um saco de farinha!',
      year1: 'Quando as pernas cansarem da lida, é só esperar na parada da estrada ou na Rodoviária que eu te deixo lá na frente rapidinho.',
      year2: 'Taparam os buracos lá da baixada e reforçaram a ponte de madeira. Agora o busão roda macio até debaixo de toró!',
      year3: 'Metade do frete que eu levo pro Centro hoje sai lá da tua porteira, rapaz. O Sítio Boa Esperança tá abastecendo a cidade inteira!',
      year4: 'Desde o dia que te trouxe naquela primeira viagem com dez manivas na bolsa, eu sabia que tu ia longe, Cauã!'
    },
    personalQuestId: 'q8_rota_transporte'
  },
  {
    id: 'clara_culinarista',
    name: 'Clara do Tacacá & Caldeirada',
    role: 'Cozinheira Tradicional da Feira',
    homeMap: 'feira',
    x: 17,
    y: 8,
    shirtColor: '#c9342b',
    hatColor: null,
    hairColor: '#4a2e1b',
    personality: 'Alegre, generosa, sempre mexendo uma panela perfumada de tucupi e pimenta-de-cheiro.',
    scheduleSummary: 'Cozinha tacacá, caldeirada de tambaqui e bolos regionais na Feira.',
    favoriteItems: ['caldeirada_tambaqui', 'goma_tapioca', 'pimenta_de_cheiro'],
    dialogues: {
      greeting: 'Chega pra cá, menino! Acabei de temperar o tucupi com chicória e pimenta-de-cheiro. Só o vapor já abre o apetite, né?',
      year1: 'Me traz pimenta-de-cheiro fresca e goma de tapioca quando tiver! Com ingrediente colhido no dia, meu tacacá faz sucesso dobrado.',
      year2: 'A caldeirada que fiz com o tambaqui e os temperos do teu sítio ganhou elogio até do prefeito ontem no almoço!',
      year3: 'No Festival Gastronômico deste ano vamos servir uma mesa inteira só com receitas tradicionais do Juruá.',
      year4: 'A tua roça e a minha cozinha formam a melhor dupla de Cruzeiro do Sul, pode acreditar!'
    },
    personalQuestId: 'q7_banquete_regional'
  },
  {
    id: 'tiago_ferreiro',
    name: 'Tiago das Ferramentas',
    role: 'Ferreiro & Mecânico Agrícola',
    homeMap: 'centro',
    x: 15,
    y: 7,
    shirtColor: '#1e40af',
    hatColor: null,
    hairColor: '#241811',
    personality: 'Prestativo, direto, gosta de ferramenta bem cuidada e conversa boa.',
    scheduleSummary: 'Afia lâminas, monta cabos de madeira e ajusta motores na oficina do Centro.',
    favoriteItems: ['chocolate_artesanal', 'queijo_regional'],
    dialogues: {
      greeting: 'Opa, tudo em cima? Como estão aguentando a enxada e o regador por lá? Se precisar dar um fio na lâmina, traz aqui!',
      year1: 'Uma dica pra não perder tempo na roça: tu pode arrumar a ordem das ferramentas na barra lateral clicando com o botão direito nelas, sabia?',
      year2: 'Ajustei as correias da tua despolpadeira lá na Casa de Farinha. Agora ela bate polpa de açaí e cupuaçu num instante.',
      year3: 'Forjei cabos novos de maçaranduba pras ferramentas da cooperativa. Aguentam serviço pesado sem dar calo na mão!',
      year4: 'Dá gosto ver um produtor que cuida tão bem das ferramentas quanto cuida da terra!'
    },
    personalQuestId: 'q1_recuperar_rocado'
  },
  {
    id: 'helena_veterinaria',
    name: 'Dra. Helena Moura',
    role: 'Zootecnista & Criadora Regional',
    homeMap: 'centro',
    x: 21,
    y: 8,
    shirtColor: '#0f766e',
    hatColor: '#b89644',
    hairColor: '#8f3926',
    personality: 'Carinhosa com os animais, prática e sempre pronta para orientar os produtores.',
    scheduleSummary: 'Atende no Centro Comercial e visita os currais e viveiros das propriedades.',
    favoriteItems: ['leite_cabra', 'ovo_caipira', 'queijo_cabra'],
    dialogues: {
      greeting: 'Olá, Cauã! Como está a bicharada lá no sítio hoje? As galinhas caipiras já botaram ovos cedo?',
      year1: 'Tratar das criações todo dia é sagrado: bicho de barriga cheia e água fresca no cocho retribui com ovo, leite e saúde!',
      year2: 'Quando puder, coloca umas cabras leiteiras e abre espaço pro viveiro de tambaquis. O esterco ainda ajuda a adubar o pomar!',
      year3: 'Fiz os exames no teu rebanho e no viveiro semana passada: nota dez! Nem sinal de estresse e produção lá no alto.',
      year4: 'Teu manejo integrado de lavoura, criação e piscicultura virou exemplo pra todo o Vale do Juruá!'
    },
    personalQuestId: 'q9_criacao_integrada'
  },
  {
    id: 'pedro_canoeiro',
    name: 'Pedro Canoeiro',
    role: 'Barqueiro da Travessia do Miritizal',
    homeMap: 'porto',
    x: 16,
    y: 12,
    shirtColor: '#4b8da8',
    hatColor: '#dfc16d',
    hairColor: '#241811',
    personality: 'Braço forte no remo, conhece cada praia de rio e adora um açaí grosso com farinha.',
    scheduleSummary: 'Faz a travessia de passageiros e cargas entre o Porto, a Vila e o Sítio.',
    favoriteItems: ['jaraqui', 'polpa_acai', 'farinha_mandioca'],
    dialogues: {
      greeting: 'Fala, comandante! Depois de tomar uma tigela daquele açaí grosso com a tua farinha, eu atravesso esse Juruá no remo até de olhos fechados!',
      year1: 'Sempre que quiser ir do Porto direto pro trapiche da tua fazenda pela água, fala comigo na oficina de barcos que a travessia é garantida.',
      year2: 'As praias de areia começaram a aparecer na vazante. Época boa pra plantar melancia e feijão na beira do rio!',
      year3: 'Nem na maior enchente do inverno a gente deixou faltar mantimento na Vila. Nossa frota de canoas deu conta do recado!',
      year4: 'Passar de barco todo dia e ver o teu trapiche cheio de vida deixa qualquer barqueiro feliz da vida.'
    },
    personalQuestId: 'q3_reparo_canoa'
  },
  {
    id: 'vovo_benedito',
    name: 'Vovô Benedito',
    role: 'Antigo Seringueiro & Contador de Histórias',
    homeMap: 'vila',
    x: 15,
    y: 10,
    shirtColor: '#3730a3',
    hatColor: '#9c663e',
    hairColor: '#f2e5c9',
    personality: 'Voz calma, olhar afetuoso, guarda na memória as histórias antigas dos seringais e rios.',
    scheduleSummary: 'Senta na sombra das árvores da Vila Ribeirinha contando histórias aos jovens.',
    favoriteItems: ['rapadura_gramixote', 'mingau_banana', 'macaxeira'],
    dialogues: {
      greeting: 'Puxa um banquinho e senta aqui na sombra um instante, meu neto. O vento que vem do rio hoje tá trazendo lembrança boa.',
      year1: 'Sabia que aquela samaúma gigante lá na entrada do teu sítio foi plantada pelo teu bisavô? Ela viu nossa comunidade inteira nascer.',
      year2: 'Provei um pedaço do gramixote que tu fez com a cana do roçado... Fechei os olhos e voltei pros tempos de menino na colocação.',
      year3: 'Muita gente achava que os jovens iam esquecer a roça, mas tu mostrou que a nossa tradição tem futuro brilhante.',
      year4: 'Minha missão era guardar essas histórias até alguém de coração firme assumir o legado. Agora posso descansar em paz, meu filho.'
    },
    personalQuestId: 'q10_legado_familiar'
  },
  {
    id: 'lucia_artesã',
    name: 'Lúcia das Fibras',
    role: 'Artesã de Cestaria de Buriti & Cipó',
    homeMap: 'vila',
    x: 7,
    y: 12,
    shirtColor: '#be123c',
    hatColor: null,
    hairColor: '#241811',
    personality: 'Mãos habilidosas, conversa suave, orgulhosa da arte tradicional das mulheres ribeirinhas.',
    scheduleSummary: 'Trança cestos, peneiras e tipitis na Vila Ribeirinha e leva peças para a Feira.',
    favoriteItems: ['acai', 'cupuacu', 'chocolate_artesanal'],
    dialogues: {
      greeting: 'Oi, Cauã! Olha só esse paneiro de cipó-titica que acabei de trançar. Aguenta trinta quilos de mandioca sem arriar a alça!',
      year1: 'Sem uma boa peneira de fibra e um tipiti bem trançado, nenhuma Casa de Farinha funciona direito. Tudo vem da nossa mata!',
      year2: 'Fiz umas cestinhas trançadas com palha de buriti pros teus doces de cupuaçu e chocolates. O pessoal na feira adorou!',
      year3: 'Juntamos doze artesãs aqui da Vila e abrimos nosso cantinho oficial lá no mercado. A renda das famílias cresceu muito!',
      year4: 'Quando a roça prospera, o artesanato floresce junto. Obrigada por caminhar sempre do nosso lado!'
    },
    personalQuestId: 'q4_banca_feira'
  },
  {
    id: 'padre_antonio',
    name: 'Padre Antônio',
    role: 'Organizador das Festas Comunitárias',
    homeMap: 'centro',
    x: 13,
    y: 11,
    shirtColor: '#334155',
    hatColor: null,
    hairColor: '#9e9e9e',
    personality: 'Acolhedor, puxa mutirões comunitários e conhece cada família das margens aos ramais.',
    scheduleSummary: 'Converse com os moradores na Praça do Centro e organiza os festivais de cada estação.',
    favoriteItems: ['bolo_macaxeira', 'queijo_regional', 'abacaxi'],
    dialogues: {
      greeting: 'A paz, meu jovem! Que alegria te ver por aqui. Como vão os trabalhos lá pelo Sítio Boa Esperança?',
      year1: 'Aqui no Juruá ninguém trabalha sozinho. Quando tiver um tempinho, aparece nos festivais da estação pra celebrar com a comunidade!',
      year2: 'Aquela mesa farta que vocês montaram na Festa da Colheita deixou todo mundo emocionado. A partilha multiplica tudo!',
      year3: 'Quando o rio encheu além da conta no inverno passado, os alimentos que teu sítio doou ampararam dezenas de famílias.',
      year4: 'Quatro anos de trabalho abençoado, Cauã. Você uniu a cidade, a vila e a floresta numa só família!'
    },
    personalQuestId: 'q7_banquete_regional'
  },
  {
    id: 'rafael_piscicultor',
    name: 'Rafael das Águas',
    role: 'Técnico em Piscicultura & Peixaria',
    homeMap: 'porto',
    x: 7,
    y: 8,
    shirtColor: '#1d4e6e',
    hatColor: '#dfc16d',
    hairColor: '#4a2e1b',
    personality: 'Prestativo, apaixonado pelos peixes amazônicos e pelo equilíbrio dos rios.',
    scheduleSummary: 'Cuida da Peixaria do Porto e dá assistência aos viveiros rurais.',
    favoriteItems: ['tambaqui_viveiro', 'tucunare', 'milho'],
    dialogues: {
      greeting: 'Fala, Cauã! Já viu o brilho das escamas desses tambaquis que chegaram cedo? Fresquinhos como a água da nascente!',
      year1: 'Pescar no rio é bom demais, mas criar tambaqui no viveiro do sítio te dá peixe gordo o ano inteiro e ainda poupa os cardumes!',
      year2: 'Joga um punhado de milho e pedaços de goiaba ou buriti na borda do viveiro que os tambaquis vêm comer na mão!',
      year3: 'Os pescadores do Porto e os criadores rurais trabalhando juntos zeraram a falta de peixe na entressafra.',
      year4: 'Nosso Rio Juruá continua vivo e cheio de peixe graças a quem produz com consciência como tu!'
    },
    personalQuestId: 'q9_criacao_integrada'
  },
  {
    id: 'bianca_professora',
    name: 'Professora Bianca',
    role: 'Professora da Escola Ribeirinha',
    homeMap: 'vila',
    x: 19,
    y: 7,
    shirtColor: '#5a2d6b',
    hatColor: null,
    hairColor: '#241811',
    personality: 'Inspiradora, paciente, ensina as crianças valorizando os saberes da floresta e da roça.',
    scheduleSummary: 'Dá aulas na escolinha da Vila Ribeirinha e leva os alunos para conhecer a horta.',
    favoriteItems: ['polpa_acai', 'banana', 'mamao'],
    dialogues: {
      greeting: 'Oi, Cauã! As crianças estavam agora mesmo perguntando quando a gente vai fazer outra visita lá na horta do teu sítio!',
      year1: 'Aqui na escolinha a gente aprende lendo e plantando: cada aluno plantou uma semente de açaí inspirada no teu roçado.',
      year2: 'Desde que as tuas frutas e polpas entraram na merenda escolar, a turma inteira estuda com muito mais disposição!',
      year3: 'Usamos as anotações das estações agrícolas do teu diário na aula de ciências hoje. Os meninos ficaram encantados!',
      year4: 'Hoje meus alunos dizem com orgulho que quando crescerem querem cuidar da terra igual ao Cauã!'
    },
    personalQuestId: 'q5_agrofloresta_acai'
  },
  {
    id: 'seu_valdir_carpinteiro',
    name: 'Seu Valdir Marceneiro',
    role: 'Mestre Carpinteiro de Terra Firme',
    homeMap: 'estrada',
    x: 14,
    y: 7,
    shirtColor: '#0369a1',
    hatColor: '#b89644',
    hairColor: '#5c3824',
    personality: 'Tranquilo, trabalha com régua e enxó precisa, respeita cada árvore de manejo.',
    scheduleSummary: 'Trabalha na Carpintaria à beira da Estrada Rural construindo cercas e telhados.',
    favoriteItems: ['farinha_mandioca', 'mujeca_peixe', 'cana'],
    dialogues: {
      greeting: 'Bom dia, vizinho! O cheiro de serragem de cedro e cumaru aqui na oficina tá bom demais hoje, né?',
      year1: 'Dei uma revisada nos esteios da tua casa e nas cercas do curral. Madeira boa, cortada na lua certa, dura uma vida inteira!',
      year2: 'Preparei umas tábuas reforçadas pros cochos das tuas cabras e vacas. Pode ampliar a criação sem medo.',
      year3: 'Refizemos o assoalho da ponte da estrada e o telhado da parada de ônibus. Faça chuva ou faça sol, o caminho tá firme!',
      year4: 'Cada viga e cada cerca daquele teu sítio tem um pingo do nosso suor e muita história boa pra contar.'
    },
    personalQuestId: 'q8_rota_transporte'
  },
  {
    id: 'cacique_kawa',
    name: 'Líder Kawa',
    role: 'Guardião da Trilha da Floresta & Igarapé',
    homeMap: 'floresta',
    x: 8,
    y: 12,
    shirtColor: '#4b833b',
    hatColor: '#c9342b',
    hairColor: '#241811',
    personality: 'Sábio, sereno, escuta os sinais da mata, dos pássaros e das nascentes.',
    scheduleSummary: 'Zela pelas trilhas e olhos d’água da Floresta e Igarapé.',
    favoriteItems: ['pirarucu', 'acai', 'mandioca'],
    dialogues: {
      greeting: 'Que teus passos sejam leves na mata, irmão. Escuta só o barulho da água limpa correndo entre as raízes do igarapé...',
      year1: 'A floresta é generosa com quem tira apenas o que precisa e deixa os frutos pras aves e pros peixes espalharem a vida.',
      year2: 'Os mais velhos da aldeia viram que tu planta sem derrubar a mata da beira do rio. Por isso a tua terra é tão fértil.',
      year3: 'Enquanto muitos lugares secaram no verão forte, a nossa nascente continuou jorrando água fria porque cuidamos dela juntos.',
      year4: 'Tua família honrou o pacto antigo com esta terra, Cauã. O espírito da floresta caminha contigo!'
    },
    personalQuestId: 'q10_legado_familiar'
  }
];

export const QUESTS_DATA: QuestDefinition[] = [
  {
    id: 'q1_recuperar_rocado',
    title: '1. Mãos na Terra: O Roçado do Avô',
    giverId: 'dona_francisca',
    giverName: 'Dona Francisca',
    yearUnlock: 1,
    category: 'historia',
    description: '"Menino, a terra do teu avô estava só esperando alguém de coragem voltar! Pega aquela enxada, abre três covas novas no canteiro e planta tuas manivas de mandioca com carinho."',
    objectiveText: 'Arar e preparar 3 novas covas no roçado do sítio',
    requirementType: 'till_soil',
    targetCount: 3,
    rewardMoney: 150,
    rewardReputation: 15,
    rewardUnlockText: 'Presente da Dona Francisca: Sementes de Feijão-de-Praia e café revigorante'
  },
  {
    id: 'q2_casa_de_farinha',
    title: '2. O Cheiro Quente da Primeira Fornada',
    giverId: 'seu_raimundo',
    giverName: 'Seu Raimundo Farinheiro',
    yearUnlock: 1,
    category: 'comercio',
    description: '"Cauã, o tacho de cobre já está limpo e a lenha seca! Assim que colher as mandiocas, traz aqui pra Casa de Farinha pra gente torrar o primeiro saco da tua safra!"',
    objectiveText: 'Torrar 1 lote de Farinha de Mandioca ou Goma na Casa de Farinha',
    requirementType: 'process_food',
    targetId: 'farinha_mandioca',
    targetCount: 1,
    rewardMoney: 250,
    rewardReputation: 25,
    rewardUnlockText: 'Fama de Mestre Farinheiro (+15% no preço da Farinha de Mandioca)'
  },
  {
    id: 'q3_reparo_canoa',
    title: '3. Puxão de Linha nas Águas do Juruá',
    giverId: 'mestre_ze_bento',
    giverName: 'Mestre Zé Bento',
    yearUnlock: 1,
    category: 'ambiental',
    description: '"Rapaz, o rio hoje tá pra peixe! Pega a vara de pesca que preparei pra ti, desce lá no trapiche ou na beira do igarapé e fisga dois peixes bonitos pro nosso almoço."',
    objectiveText: 'Pescar 2 peixes nas águas do Rio Juruá ou Igarapé',
    requirementType: 'catch_fish',
    targetCount: 2,
    rewardMoney: 200,
    rewardReputation: 20,
    rewardUnlockText: 'Canoa calafetada e travessias fluviais livres com os barqueiros'
  },
  {
    id: 'q4_banca_feira',
    title: '4. Reabrindo a Banca da Família na Feira',
    giverId: 'mateus_feirante',
    giverName: 'Mateus do Mercado',
    yearUnlock: 1,
    category: 'comercio',
    description: '"Parceiro, guardei o melhor ponto da Feira Municipal pra tua família! Vende tuas colheitas e junta R$ 500 em caixa pra gente inaugurar a placa oficial da tua banca."',
    objectiveText: 'Alcançar R$ 500 em caixa com vendas da roça e da feira',
    requirementType: 'earn_money',
    targetCount: 500,
    rewardMoney: 220,
    rewardReputation: 25,
    rewardUnlockText: 'Libera Contratos de Encomendas Regionais de alto valor'
  },
  {
    id: 'q5_agrofloresta_acai',
    title: '5. Sombra Boa e Fruto Maduro',
    giverId: 'iara_botanica',
    giverName: 'Iara Nogueira',
    yearUnlock: 2,
    category: 'ambiental',
    description: '"Cauã, ver teu roçado crescendo sem queimada dá uma alegria danada! Colhe quatro safras completas pra mostrarmos como a terra fica rica quando a gente trabalha junto com a natureza."',
    objectiveText: 'Colher 4 safras agrícolas maduras no sítio',
    requirementType: 'harvest_crop',
    targetCount: 4,
    rewardMoney: 320,
    rewardReputation: 30,
    rewardUnlockText: 'Selo Agroflorestal do Juruá (+10% no valor de frutas e polpas)'
  },
  {
    id: 'q6_diversificacao_culturas',
    title: '6. Fartura nas Quatro Estações',
    giverId: 'dona_nazaré',
    giverName: 'Dona Nazaré das Sementes',
    yearUnlock: 2,
    category: 'historia',
    description: '"Querido, bom agricultor não depende de uma planta só! Vai revezando as sementes de inverno e de verão até completar oito colheitas caprichadas no teu terreno."',
    objectiveText: 'Completar 8 colheitas acumuladas nas covas da fazenda',
    requirementType: 'harvest_crop',
    targetCount: 8,
    rewardMoney: 400,
    rewardReputation: 30,
    rewardUnlockText: 'Desconto especial de cliente fiel na Casa Agrícola'
  },
  {
    id: 'q7_banquete_regional',
    title: '7. Panela Cheia na Festa da Comunidade',
    giverId: 'clara_culinarista',
    giverName: 'Clara do Tacacá & Caldeirada',
    yearUnlock: 3,
    category: 'comunidade',
    description: '"Menino, o povo todo vem pra festa da colheita e eu preciso dos melhores ingredientes! Prepara três receitas lá na Casa de Farinha e Despolpadeira pra nossa barraca brilhar!"',
    objectiveText: 'Beneficiar 3 receitas artesanais (farinha, polpas ou doces)',
    requirementType: 'process_food',
    targetCount: 3,
    rewardMoney: 500,
    rewardReputation: 40,
    rewardUnlockText: 'Carinho e amizade elevada com toda a vizinhança de Cruzeiro do Sul'
  },
  {
    id: 'q8_rota_transporte',
    title: '8. Movimentando o Ramal e o Rio',
    giverId: 'chico_motorista',
    giverName: 'Chico da Linha Rural',
    yearUnlock: 3,
    category: 'comunidade',
    description: '"Campeão, quanto mais o teu sítio produz, mais forte fica a nossa linha rural e o movimento no Porto! Chega a R$ 1.200 em caixa pra gente comemorar o progresso do ramal."',
    objectiveText: 'Reunir R$ 1.200 em caixa com a produção da fazenda',
    requirementType: 'earn_money',
    targetCount: 1200,
    rewardMoney: 450,
    rewardReputation: 35,
    rewardUnlockText: 'Carona VIP vitalícia no ônibus do Chico e nas canoas do Porto'
  },
  {
    id: 'q9_criacao_integrada',
    title: '9. Curral Cheio e Viveiro Vivo',
    giverId: 'helena_veterinaria',
    giverName: 'Dra. Helena Moura',
    yearUnlock: 2,
    category: 'comercio',
    description: '"Cauã, os animais dão outra vida pro sítio! Trata bem das aves, cabras ou tambaquis do viveiro e recolhe três lotes de produção fresca com todo cuidado."',
    objectiveText: 'Alimentar e coletar 3 produtos das criações ou viveiro',
    requirementType: 'raise_animal',
    targetCount: 3,
    rewardMoney: 380,
    rewardReputation: 30,
    rewardUnlockText: 'Suplemento natural que revigora todas as criações'
  },
  {
    id: 'q10_legado_familiar',
    title: '10. Raízes Profundas no Vale do Juruá',
    giverId: 'vovo_benedito',
    giverName: 'Vovô Benedito',
    yearUnlock: 4,
    category: 'historia',
    description: '"Meu filho, tu fizeste o Sítio Boa Esperança brilhar mais forte do que nos tempos do teu avô. Consolida o patrimônio da família em R$ 2.000 e escolhe o legado que deixaremos para a comunidade!"',
    objectiveText: 'Alcançar R$ 2.000 e escolher o Legado Comunitário do Sítio',
    requirementType: 'earn_money',
    targetCount: 2000,
    rewardMoney: 1000,
    rewardReputation: 100,
    rewardUnlockText: 'Consagra o Legado da Família e o título de Guardião do Juruá'
  }
];
