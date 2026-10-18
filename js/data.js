// Catálogo de dados do jogo: conjuntos de símbolos, temas de mesa, estilos de peça, modos, layouts, modificadores de fase, power-ups e conquistas.

export const WILDCARD_SYMBOL = '🃏';

export const SYMBOL_SETS = {
  classic: {
    id: 'classic',
    name: 'Mix Clássico',
    desc: 'A coleção original de ícones orientais, animais e elementos.',
    cost: 0,
    symbols: [
      '🐉','🀄','🎋','🏮','🌸','⛩️','🎎','🎏','🍵','🍙',
      '🦊','🐼','🐯','🦁','🐸','🐢','🦋','🐞','🦀','🐙',
      '🌙','☀️','⭐','⚡','🔥','💧','❄️','🌪️','🌈','💎',
      '⚔️','🛡️','👑','🔔','🎲','🎯'
    ]
  },
  oriental: {
    id: 'oriental',
    name: 'Tradição Oriental',
    desc: 'Peças de Mahjong, dragões, bambus, lanternas e símbolos imperiais.',
    cost: 150,
    symbols: [
      '🀄','🀅','🀆','🀀','🀁','🀂','🀃','🀇','🀈','🀉',
      '🀐','🀑','🀒','🀙','🀚','🀛','🐉','🏮','🎋','⛩️',
      '🌸','🌺','🪷','🍵','🍶','🍙','🥟','🥢','🪭','🎎',
      '🎏','🎐','🧧','🪙','☯️','🏯'
    ]
  },
  nature: {
    id: 'nature',
    name: 'Fauna & Jardim',
    desc: 'Criaturas da floresta, flores raras, oceanos e astros.',
    cost: 200,
    symbols: [
      '🦊','🐼','🐯','🦁','🐸','🐢','🦋','🐞','🦀','🐙',
      '🦉','🦚','🦩','🦢','🐝','🐬','🐳','🦄','🦌','🐿️',
      '🌸','🌻','🌺','🌷','🌹','🪷','🍀','🍁','🍄','🌵',
      '🌙','☀️','⭐','🌈','❄️','🌊'
    ]
  },
  arcane: {
    id: 'arcane',
    name: 'Arcano & RPG',
    desc: 'Relíquias místicas, espadas, poções, cristais e grimórios.',
    cost: 250,
    symbols: [
      '⚔️','🛡️','👑','💎','🔮','🧪','📜','🗝️','🏹','🪓',
      '🔱','🪄','🧿','⚗️','🕯️','🧭','⏳','⚖️','🪙','🏆',
      '🔥','⚡','❄️','🌪️','☄️','🌙','☀️','⭐','🌌','👁️',
      '🐉','🦅','🐺','🐍','🦂','💀'
    ]
  }
};

export const TABLE_THEMES = {
  sapphire: {
    id: 'sapphire',
    name: 'Noite de Safira',
    desc: 'Azul ardósia profundo com destaques esmeralda.',
    cost: 0,
    bgStart: '#1e293b',
    bgEnd: '#0f172a',
    accent: '#10b981',
    gridColor: 'rgba(148, 163, 184, 0.05)'
  },
  jade: {
    id: 'jade',
    name: 'Jade Imperial',
    desc: 'Mesa clássica de feltro verde-jade com detalhes dourados.',
    cost: 120,
    bgStart: '#064e3b',
    bgEnd: '#022c22',
    accent: '#34d399',
    gridColor: 'rgba(52, 211, 153, 0.06)'
  },
  kyoto: {
    id: 'kyoto',
    name: 'Templo de Kyoto',
    desc: 'Madeira escura aquecida por lanternas carmesim e ouro.',
    cost: 180,
    bgStart: '#451a03',
    bgEnd: '#1c0a00',
    accent: '#f59e0b',
    gridColor: 'rgba(245, 158, 11, 0.06)'
  },
  sakura: {
    id: 'sakura',
    name: 'Jardim de Sakura',
    desc: 'Crepúsculo púrpura com brisa suave de flor de cerejeira.',
    cost: 220,
    bgStart: '#3b0764',
    bgEnd: '#1e1b4b',
    accent: '#f472b6',
    gridColor: 'rgba(244, 114, 182, 0.06)'
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon',
    desc: 'Grade synthwave escura com contrastes elétricos.',
    cost: 300,
    bgStart: '#090d16',
    bgEnd: '#030712',
    accent: '#38bdf8',
    gridColor: 'rgba(56, 189, 248, 0.09)'
  }
};

export const TILE_SKINS = {
  ivory: {
    id: 'ivory',
    name: 'Marfim Clássico',
    desc: 'Face creme tradicional com base verde-esmeralda.',
    cost: 0,
    faceFree: '#fffbeb',
    faceBlocked: '#94a3b8',
    faceSelected: '#fef08a',
    faceHint: '#a7f3d0',
    sideColor: '#0f766e',
    sideSelected: '#059669',
    borderFree: '#cbd5e1',
    borderSelected: '#eab308',
    textColor: '#1e293b'
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidiana Dourada',
    desc: 'Peças vulcânicas escuras com filigranas em ouro.',
    cost: 160,
    faceFree: '#1e293b',
    faceBlocked: '#0f172a',
    faceSelected: '#422006',
    faceHint: '#064e3b',
    sideColor: '#b45309',
    sideSelected: '#f59e0b',
    borderFree: '#fbbf24',
    borderSelected: '#fde047',
    textColor: '#f8fafc'
  },
  porcelain: {
    id: 'porcelain',
    name: 'Porcelana Ming',
    desc: 'Branco puro esmaltado com lateral azul-cobalto.',
    cost: 180,
    faceFree: '#f8fafc',
    faceBlocked: '#94a3b8',
    faceSelected: '#e0f2fe',
    faceHint: '#bae6fd',
    sideColor: '#1d4ed8',
    sideSelected: '#0284c7',
    borderFree: '#93c5fd',
    borderSelected: '#38bdf8',
    textColor: '#0f172a'
  },
  bamboo: {
    id: 'bamboo',
    name: 'Bambu Artesanal',
    desc: 'Tonalidade amadeirada quente com entalhe âmbar.',
    cost: 200,
    faceFree: '#fef3c7',
    faceBlocked: '#a8a29e',
    faceSelected: '#fde68a',
    faceHint: '#d9f99d',
    sideColor: '#78350f',
    sideSelected: '#b45309',
    borderFree: '#d97706',
    borderSelected: '#f59e0b',
    textColor: '#451a03'
  },
  quartz: {
    id: 'quartz',
    name: 'Cristal de Quartzo',
    desc: 'Superfície rosada luminosa com base ametista.',
    cost: 260,
    faceFree: '#fdf2f8',
    faceBlocked: '#9ca3af',
    faceSelected: '#fce7f3',
    faceHint: '#f5d0fe',
    sideColor: '#701a75',
    sideSelected: '#a21caf',
    borderFree: '#f9a8d4',
    borderSelected: '#e879f9',
    textColor: '#4a044e'
  }
};

export const GAME_MODES = {
  infinite: {
    id: 'infinite',
    name: 'Modo Infinito',
    badge: 'Infinito',
    icon: '♾️',
    desc: 'Fases evolutivas: a cada nível mudam os layouts, surgem peças especiais e eventos dinâmicos.'
  },
  daily: {
    id: 'daily',
    name: 'Desafio Diário',
    badge: 'Diário',
    icon: '📅',
    desc: 'Tabuleiro único por dia (mesma semente para todos) com peças especiais e recompensa dobrada.'
  },
  time_attack: {
    id: 'time_attack',
    name: 'Contra o Relógio',
    badge: 'Relógio',
    icon: '⏱️',
    desc: 'Comece com 150s! Cada par adiciona +2s (+4s em super combo) e limpar a fase dá +25s.'
  },
  zen: {
    id: 'zen',
    name: 'Modo Zen',
    badge: 'Zen',
    icon: '🧘',
    desc: 'Sem pressão de tempo, sem perda de pontos ao embaralhar e dicas gratuitas.'
  }
};

export const BOARD_LAYOUTS = {
  auto: {
    id: 'auto',
    name: 'Progressivo (Muda a cada Fase)',
    icon: '🎲',
    desc: 'Evolui automaticamente entre as 8 formações conforme as fases avançam.'
  },
  turtle: {
    id: 'turtle',
    name: 'Tartaruga Imperial',
    icon: '🐢',
    desc: 'O layout clássico do Mahjong Solitaire com casco em camadas e extremidades.'
  },
  dragon: {
    id: 'dragon',
    name: 'Dragão Sinuoso',
    icon: '🐉',
    desc: 'Formação alongada em S com crista central elevada.'
  },
  fortress: {
    id: 'fortress',
    name: 'Fortaleza Real',
    icon: '🏯',
    desc: 'Muralhas simétricas e quatro torres altas nos cantos.'
  },
  pyramid: {
    id: 'pyramid',
    name: 'Pirâmide Escalonada',
    icon: '🔺',
    desc: 'Degraus concêntricos subindo até o topo central.'
  },
  butterfly: {
    id: 'butterfly',
    name: 'Asas de Borboleta',
    icon: '🦋',
    desc: 'Duas grandes asas simétricas unidas por uma ponte delicada.'
  },
  bridges: {
    id: 'bridges',
    name: 'Pontes Gêmeas',
    icon: '🌉',
    desc: 'Duas ilhas altas conectadas por passarelas suspensas.'
  },
  arena: {
    id: 'arena',
    name: 'Coliseu Imperial',
    icon: '🏟️',
    desc: 'Anel circular elevado ao redor de um santuário interno.'
  },
  hourglass: {
    id: 'hourglass',
    name: 'Ampulheta do Tempo',
    icon: '⏳',
    desc: 'Duas câmaras amplas que se afunilam no nexo central.'
  }
};

export const STAGE_MODIFIERS = {
  classic: {
    id: 'classic',
    name: 'Harmonia Clássica',
    icon: '🎋',
    desc: 'Regras tradicionais puras de Mahjong Solitaire.',
    bonusCoins: 0
  },
  gold_rush: {
    id: 'gold_rush',
    name: 'Corrida do Ouro',
    icon: '🃏',
    desc: 'Peças Coringa (combinam com tudo) e Peças de Tesouro (+🪙) surgem na mesa!',
    bonusCoins: 15
  },
  mist: {
    id: 'mist',
    name: 'Névoa do Oráculo',
    icon: '🔮',
    desc: 'Peças Mistério (❓) ocultam seu símbolo até ficarem livres ou sob luz da Tocha.',
    bonusCoins: 20
  },
  chains: {
    id: 'chains',
    name: 'Correntes Imperiais',
    icon: '⛓️',
    desc: 'Peças Acorrentadas precisam que pares próximos sejam combinados para quebrar o cadeado!',
    bonusCoins: 25
  },
  blitz: {
    id: 'blitz',
    name: 'Relâmpago Imperial',
    icon: '⚡',
    desc: 'Meta de tempo bônus! Limpe a mesa antes do relógio bônus zerar para ganhar baú extra.',
    bonusCoins: 30
  },
  boss: {
    id: 'boss',
    name: 'Desafio do Dragão (Chefe)',
    icon: '🐉',
    desc: 'Fase Chefe! Combina Correntes, Peças Mistério, Coringas Dourados e Recompensa Tripla!',
    bonusCoins: 50
  }
};

export const POWERUPS = {
  undo: {
    id: 'undo',
    name: 'Desfazer',
    icon: '↩️',
    shortcut: 'Z',
    coinCost: 15,
    initialCharges: 3,
    desc: 'Devolve o último par removido ao tabuleiro.'
  },
  hint: {
    id: 'hint',
    name: 'Dica',
    icon: '💡',
    shortcut: 'H',
    coinCost: 15,
    initialCharges: 3,
    desc: 'Destaca um par disponível na mesa.'
  },
  torch: {
    id: 'torch',
    name: 'Tocha Raio-X',
    icon: '🔦',
    shortcut: 'T',
    coinCost: 25,
    initialCharges: 2,
    desc: 'Ilumina peças livres, revela Peças Mistério (❓) e escurece bloqueadas por 12s.'
  },
  freeze: {
    id: 'freeze',
    name: 'Congelar',
    icon: '❄️',
    shortcut: 'F',
    coinCost: 25,
    initialCharges: 2,
    desc: 'Congela a barra de tempo do Combo e da Meta Blitz por 15 segundos.'
  },
  magnet: {
    id: 'magnet',
    name: 'Ímã de Par',
    icon: '🧲',
    shortcut: 'M',
    coinCost: 35,
    initialCharges: 2,
    desc: 'Atrai e combina automaticamente um par da camada mais alta.'
  },
  bomb: {
    id: 'bomb',
    name: 'Bomba Tripla',
    icon: '💣',
    shortcut: 'B',
    coinCost: 50,
    initialCharges: 1,
    desc: 'Quebra cadeados e detona até 3 pares livres em cadeia.'
  },
  shuffle: {
    id: 'shuffle',
    name: 'Embaralhar',
    icon: '🔀',
    shortcut: 'S',
    coinCost: 20,
    initialCharges: 2,
    desc: 'Reorganiza os símbolos restantes garantindo jogadas válidas.'
  }
};

export const ACHIEVEMENTS = [
  { id: 'first_match', icon: '🀄', title: 'Primeiro Par', desc: 'Combine seu primeiro par de peças.', reward: 25 },
  { id: 'combo_5', icon: '🔥', title: 'Mestre do Combo', desc: 'Alcance um multiplicador de Combo x5.', reward: 40 },
  { id: 'combo_10', icon: '☄️', title: 'Fúria do Dragão', desc: 'Alcance o Combo máximo x10!', reward: 100 },
  { id: 'eagle_eye', icon: '🦅', title: 'Olhos de Águia', desc: 'Conclua uma fase sem usar Dica nem Embaralhar.', reward: 50 },
  { id: 'speedrunner', icon: '⚡', title: 'Relâmpago', desc: 'Conclua uma fase em menos de 45 segundos.', reward: 60 },
  { id: 'level_10', icon: '🧭', title: 'Explorador', desc: 'Alcance a Fase 10 no Modo Infinito.', reward: 80 },
  { id: 'level_25', icon: '👑', title: 'Soberano da Mesa', desc: 'Alcance a Fase 25 no Modo Infinito.', reward: 180 },
  { id: 'daily_hero', icon: '📅', title: 'Desafiante Diário', desc: 'Vença o Desafio Diário pela primeira vez.', reward: 100 },
  { id: 'time_lord', icon: '⏱️', title: 'Senhor do Tempo', desc: 'Faça 2.500 pontos no modo Contra o Relógio.', reward: 90 },
  { id: 'zen_master', icon: '🧘', title: 'Mente Serena', desc: 'Complete 3 fases no Modo Zen.', reward: 60 },
  { id: 'demoman', icon: '💣', title: 'Demolidor', desc: 'Use a Bomba Tripla 5 vezes.', reward: 70 },
  { id: 'collector', icon: '🎨', title: 'Colecionador', desc: 'Desbloqueie 3 itens na Loja de Temas.', reward: 75 },
  { id: 'pairs_100', icon: '🎯', title: 'Centurião', desc: 'Combine 100 pares no total.', reward: 60 },
  { id: 'pairs_500', icon: '🏆', title: 'Grande Mestre', desc: 'Combine 500 pares no total.', reward: 150 },
  { id: 'architect', icon: '🏯', title: 'Arquiteto Clássico', desc: 'Vença em 5 formatos diferentes de tabuleiro.', reward: 120 },
  { id: 'tycoon', icon: '🪙', title: 'Tesouro Imperial', desc: 'Acumule um total histórico de 1.000 moedas ganhas.', reward: 120 },
  { id: 'chain_breaker', icon: '⛓️', title: 'Quebra-Correntes', desc: 'Destranque 10 peças acorrentadas em partidas.', reward: 80 },
  { id: 'wildcard_pro', icon: '🃏', title: 'Mestre do Coringa', desc: 'Combine 6 pares usando Peças Coringa.', reward: 75 },
  { id: 'boss_slayer', icon: '🐉', title: 'Domador do Dragão', desc: 'Vença uma Fase Chefe (múltiplo de 5).', reward: 110 }
];

export const PLAYER_RANKS = [
  { minLevel: 1, title: 'Aprendiz' },
  { minLevel: 3, title: 'Iniciado das Peças' },
  { minLevel: 6, title: 'Estrategista' },
  { minLevel: 10, title: 'Mestre do Tabuleiro' },
  { minLevel: 15, title: 'Sábio de Jade' },
  { minLevel: 22, title: 'Oráculo Imperial' },
  { minLevel: 30, title: 'Lenda do Mahjong' }
];

export function getPlayerLevelInfo(xp = 0) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  let needed = 150;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = 150 + (level - 1) * 60;
  }
  let rankTitle = PLAYER_RANKS[0].title;
  for (const r of PLAYER_RANKS) {
    if (level >= r.minLevel) rankTitle = r.title;
  }
  return {
    level,
    currentXp: remaining,
    neededXp: needed,
    rankTitle
  };
}
