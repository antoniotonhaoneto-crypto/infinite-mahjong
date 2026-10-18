import test from 'node:test';
import assert from 'node:assert/strict';

import { createPRNG, getTodayKey } from '../js/prng.js';
import { WILDCARD_SYMBOL, SYMBOL_SETS, getPlayerLevelInfo } from '../js/data.js';
import {
  CLASSIC_LAYOUT_CYCLE,
  resolveLayoutId,
  resolveStageModifier,
  isTileFree,
  isTileSelectable,
  canTilesMatch,
  getAvailablePairs,
  buildSolvableBoard,
  shuffleRemainingTiles
} from '../js/board.js';
import {
  validateTileArray,
  loadProfile,
  saveProfile,
  saveModeSession,
  loadModeSession
} from '../js/state.js';

function createMockStorage() {
  const store = new Map();
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); }
  };
}

test('PRNG determinístico gera a mesma sequência para a mesma semente', () => {
  const a = createPRNG('daily-2026-10-18');
  const b = createPRNG('daily-2026-10-18');
  const c = createPRNG('daily-2026-10-19');

  const seqA = Array.from({ length: 10 }, () => a.next());
  const seqB = Array.from({ length: 10 }, () => b.next());
  const seqC = Array.from({ length: 10 }, () => c.next());

  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, seqC);
  assert.match(getTodayKey(new Date('2026-10-18T12:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
});

test('Regras de peça livre verificam bloqueio superior e bloqueio lateral duplo', () => {
  const tiles = [
    { id: 1, x: 0, y: 0, z: 0, symbol: '🐉', removed: false },
    { id: 2, x: -2, y: 0, z: 0, symbol: '🀄', removed: false },
    { id: 3, x: 2, y: 0, z: 0, symbol: '🎋', removed: false },
    { id: 4, x: 6, y: 0, z: 0, symbol: '🏮', removed: false },
    { id: 5, x: 6, y: 0, z: 1, symbol: '🌸', removed: false }
  ];

  assert.equal(isTileFree(tiles[0], tiles), false);
  assert.equal(isTileFree(tiles[1], tiles), true);
  assert.equal(isTileFree(tiles[2], tiles), true);
  assert.equal(isTileFree(tiles[3], tiles), false);
  assert.equal(isTileFree(tiles[4], tiles), true);
});

test('Progressão de fases alterna os 8 layouts e seleciona modificadores dinâmicos e chefes', () => {
  assert.equal(CLASSIC_LAYOUT_CYCLE.length, 8);
  const seenLayouts = new Set();
  for (let lvl = 1; lvl <= 8; lvl++) {
    seenLayouts.add(resolveLayoutId('auto', lvl));
  }
  assert.equal(seenLayouts.size, 8);

  assert.equal(resolveStageModifier(1, 'infinite'), 'classic');
  assert.equal(resolveStageModifier(2, 'infinite'), 'gold_rush');
  assert.equal(resolveStageModifier(3, 'infinite'), 'mist');
  assert.equal(resolveStageModifier(4, 'infinite'), 'chains');
  assert.equal(resolveStageModifier(5, 'infinite'), 'boss');
  assert.equal(resolveStageModifier(10, 'infinite'), 'boss');
});

test('Peças Especiais (Coringa, Acorrentada e Mistério) funcionam nas regras de combinação', () => {
  const wild = { id: 1, x: 0, y: 0, z: 0, symbol: WILDCARD_SYMBOL, special: 'wildcard', locked: false, removed: false };
  const normal = { id: 2, x: 4, y: 0, z: 0, symbol: '🐉', locked: false, removed: false };
  const locked = { id: 3, x: 8, y: 0, z: 0, symbol: '🐉', locked: true, removed: false };

  assert.equal(canTilesMatch(wild, normal), true);
  assert.equal(canTilesMatch(normal, locked), false);
  assert.equal(isTileSelectable(locked, [wild, normal, locked]), false);

  const bossBoard = buildSolvableBoard({
    numPairs: 16,
    symbols: SYMBOL_SETS.classic.symbols.slice(0, 10),
    maxLayers: 4,
    seed: 'boss-seed',
    layoutId: 'arena',
    modifierId: 'boss'
  });

  assert.ok(bossBoard.some(t => t.symbol === WILDCARD_SYMBOL));
  assert.ok(bossBoard.some(t => t.locked));
  assert.ok(bossBoard.some(t => t.bonus === 'coin'));
  assert.ok(getAvailablePairs(bossBoard).length >= 1, 'Fase Chefe deve iniciar com pares livres destrancados');
});

test('Geração de tabuleiro cria mesas determinísticas e com pares válidos em todos os 8 layouts', () => {
  const symbols = SYMBOL_SETS.classic.symbols.slice(0, 12);

  for (const layoutId of CLASSIC_LAYOUT_CYCLE) {
    const board1 = buildSolvableBoard({
      numPairs: 18,
      symbols,
      maxLayers: 4,
      seed: 'seed-teste-42',
      layoutId,
      modifierId: 'gold_rush'
    });
    const board2 = buildSolvableBoard({
      numPairs: 18,
      symbols,
      maxLayers: 4,
      seed: 'seed-teste-42',
      layoutId,
      modifierId: 'gold_rush'
    });

    assert.equal(board1.length, 36);
    assert.deepEqual(board1, board2);

    const pairs = getAvailablePairs(board1);
    assert.ok(pairs.length >= 1, `Layout ${layoutId} deve iniciar com pelo menos 1 par disponível`);
  }
});

test('Embaralhamento preserva contagem de pares e garante movimentos válidos', () => {
  const symbols = SYMBOL_SETS.classic.symbols.slice(0, 8);
  const board = buildSolvableBoard({
    numPairs: 12,
    symbols,
    maxLayers: 3,
    seed: 'shuffle-test',
    layoutId: 'turtle',
    modifierId: 'chains'
  });

  board[0].removed = true;
  const partnerIdx = board.findIndex((t, idx) => idx > 0 && t.symbol === board[0].symbol);
  board[partnerIdx].removed = true;

  shuffleRemainingTiles(board, 'nova-seed');
  const active = board.filter(t => !t.removed);
  assert.equal(active.length, 22);
  assert.equal(validateTileArray(board), true);
  assert.ok(getAvailablePairs(board).length >= 1);
});

test('Persistência valida dados corrompidos e preserva sessão por modo', () => {
  const storage = createMockStorage();
  const profile = loadProfile(storage);
  assert.equal(profile.coins, 100);

  profile.coins = 250;
  profile.xp = 320;
  saveProfile(profile, storage);

  const reloaded = loadProfile(storage);
  assert.equal(reloaded.coins, 250);
  const lvl = getPlayerLevelInfo(reloaded.xp);
  assert.ok(lvl.level >= 2);

  assert.equal(validateTileArray([{ id: 1, x: 0, y: 0, z: 0, symbol: '🐉', removed: false }]), false);

  const validTiles = [
    { id: 1, x: 0, y: 0, z: 0, symbol: '🐉', locked: true, mystery: false, bonus: 'coin', removed: false },
    { id: 2, x: 4, y: 0, z: 0, symbol: '🐉', locked: false, mystery: true, bonus: null, removed: false }
  ];
  saveModeSession('infinite', { level: 4, score: 850, layoutId: 'bridges', modifierId: 'chains', tiles: validTiles }, storage);
  const loadedSession = loadModeSession('infinite', storage);
  assert.equal(loadedSession.level, 4);
  assert.equal(loadedSession.score, 850);
  assert.equal(loadedSession.layoutId, 'bridges');
  assert.equal(loadedSession.modifierId, 'chains');
  assert.equal(loadedSession.tiles[0].locked, true);
  assert.equal(loadedSession.tiles[0].bonus, 'coin');
  assert.equal(loadedSession.tiles[1].mystery, true);
});
