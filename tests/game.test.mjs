import test from 'node:test';
import assert from 'node:assert/strict';

import { createPRNG, getTodayKey } from '../js/prng.js';
import { SYMBOL_SETS, getPlayerLevelInfo } from '../js/data.js';
import {
  CLASSIC_LAYOUT_CYCLE,
  isTileFree,
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

  // Peça 1 cercada na esquerda (x=-2) e direita (x=2) na mesma camada z=0
  assert.equal(isTileFree(tiles[0], tiles), false);
  // Peças 2 e 3 têm apenas um lado bloqueado -> livres
  assert.equal(isTileFree(tiles[1], tiles), true);
  assert.equal(isTileFree(tiles[2], tiles), true);
  // Peça 4 tem a peça 5 imediatamente acima (z=1) -> bloqueada
  assert.equal(isTileFree(tiles[3], tiles), false);
  // Peça 5 no topo -> livre
  assert.equal(isTileFree(tiles[4], tiles), true);
});

test('Geração de tabuleiro cria mesas determinísticas e com pares válidos em todos os layouts', () => {
  const symbols = SYMBOL_SETS.classic.symbols.slice(0, 12);

  for (const layoutId of CLASSIC_LAYOUT_CYCLE) {
    const board1 = buildSolvableBoard({
      numPairs: 18,
      symbols,
      maxLayers: 4,
      seed: 'seed-teste-42',
      layoutId
    });
    const board2 = buildSolvableBoard({
      numPairs: 18,
      symbols,
      maxLayers: 4,
      seed: 'seed-teste-42',
      layoutId
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
    layoutId: 'turtle'
  });

  // Remove 2 pares
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

  // Testa validação de array de peças inválido (ímpar)
  assert.equal(validateTileArray([{ id: 1, x: 0, y: 0, z: 0, symbol: '🐉', removed: false }]), false);

  const validTiles = [
    { id: 1, x: 0, y: 0, z: 0, symbol: '🐉', removed: false },
    { id: 2, x: 4, y: 0, z: 0, symbol: '🐉', removed: false }
  ];
  saveModeSession('infinite', { level: 4, score: 850, layoutId: 'dragon', tiles: validTiles }, storage);
  const loadedSession = loadModeSession('infinite', storage);
  assert.equal(loadedSession.level, 4);
  assert.equal(loadedSession.score, 850);
  assert.equal(loadedSession.layoutId, 'dragon');
  assert.equal(loadedSession.tiles.length, 2);
});

