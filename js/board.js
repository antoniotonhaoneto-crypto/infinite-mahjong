// Regras de geometria, verificação de peças livres, layouts clássicos e geração determinística solucionável.

import { createPRNG } from './prng.js';

export const CLASSIC_LAYOUT_CYCLE = ['turtle', 'dragon', 'fortress', 'pyramid', 'butterfly'];

export function resolveLayoutId(layoutPreference = 'auto', level = 1) {
  if (layoutPreference && layoutPreference !== 'auto' && CLASSIC_LAYOUT_CYCLE.includes(layoutPreference)) {
    return layoutPreference;
  }
  const idx = Math.max(0, (level - 1)) % CLASSIC_LAYOUT_CYCLE.length;
  return CLASSIC_LAYOUT_CYCLE[idx];
}

export function overlapsXY(a, b) {
  return Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
}

export function isTileFree(target, tileList, ignoreFlag = 'removed') {
  if (!target || target[ignoreFlag]) return false;
  let blockedLeft = false;
  let blockedRight = false;

  for (const other of tileList) {
    if (other.id === target.id || other[ignoreFlag]) continue;

    if (other.z === target.z + 1 && overlapsXY(target, other)) {
      return false;
    }

    if (other.z === target.z && Math.abs(target.y - other.y) < 2) {
      if (other.x === target.x - 2) blockedLeft = true;
      if (other.x === target.x + 2) blockedRight = true;
    }
  }
  return !(blockedLeft && blockedRight);
}

export function getAvailablePairs(tileList) {
  const free = tileList.filter(t => !t.removed && isTileFree(t, tileList));
  const pairs = [];
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (free[i].symbol === free[j].symbol) {
        pairs.push([free[i], free[j]]);
      }
    }
  }
  return pairs;
}

export function sortTilesForRender(tiles) {
  return tiles.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
}

function canPlacePosition(positions, c) {
  const exists = positions.some(p => p.x === c.x && p.y === c.y && p.z === c.z);
  if (exists) return false;
  const overlapSameZ = positions.some(
    p => p.z === c.z && Math.abs(p.x - c.x) < 2 && Math.abs(p.y - c.y) < 2
  );
  if (overlapSameZ) return false;
  const hasSupport = c.z === 0 || positions.some(
    p => p.z === c.z - 1 && Math.abs(p.x - c.x) < 2 && Math.abs(p.y - c.y) < 2
  );
  return hasSupport;
}

function generateLayoutCandidates(layoutId, maxLayers, radX, radY) {
  const pool = [];

  for (let z = 0; z < maxLayers; z++) {
    const shrink = Math.floor(z / 1.3);
    const limX = Math.max(2, radX - shrink);
    const limY = Math.max(2, radY - shrink);

    for (let yGrid = -limY; yGrid <= limY; yGrid++) {
      for (let xGrid = 0; xGrid <= limX; xGrid++) {
        const x = xGrid * 2;
        const y = yGrid * 2;

        if (layoutId === 'turtle') {
          // Casco ovalado com pontas laterais na camada 0
          const normDist = (xGrid * xGrid) / (limX * limX + 0.5) + (yGrid * yGrid) / (limY * limY + 0.5);
          if (z > 0 && normDist > 0.85) continue;
          if (z === 0 && normDist > 1.15 && Math.abs(yGrid) > 1) continue;
        } else if (layoutId === 'dragon') {
          // Onda longitudinal sinuosa
          const waveY = Math.round(Math.sin(xGrid * 0.65) * (limY * 0.55));
          if (Math.abs(yGrid - waveY) > Math.max(1, 3 - Math.floor(z / 2))) continue;
        } else if (layoutId === 'fortress') {
          // Muralhas externas e torres nos cantos, pátio central mais baixo
          const isOuter = xGrid >= limX - 1 || Math.abs(yGrid) >= limY - 1;
          const isCenterCross = xGrid === 0 || yGrid === 0;
          if (z >= 2 && !isOuter && !isCenterCross) continue;
          if (z === 0 && xGrid === 2 && Math.abs(yGrid) === 2) continue;
        } else if (layoutId === 'pyramid') {
          // Pirâmide estrita onde cada camada encolhe uniformemente
          if (xGrid > Math.max(1, radX - z) || Math.abs(yGrid) > Math.max(1, radY - z)) continue;
        } else if (layoutId === 'butterfly') {
          // Asas largas nas laterais e corpo fino no centro
          if (xGrid === 0 && Math.abs(yGrid) > Math.max(1, limY - 2)) continue;
          if (xGrid > 0 && Math.abs(yGrid) > Math.min(limY, xGrid + 1)) continue;
        }

        const group = x === 0 ? [{ x: 0, y, z }] : [{ x, y, z }, { x: -x, y, z }];
        pool.push({ z, priority: (limX - xGrid) + (limY - Math.abs(yGrid)), group });
      }
    }
  }
  return pool;
}

export function generateGeometry(totalTiles, maxLayers = 4, seed = 1, layoutId = 'turtle') {
  const total = Math.max(2, totalTiles % 2 === 0 ? totalTiles : totalTiles + 1);
  const prng = createPRNG(`${seed}:${layoutId}:${total}`);
  const positions = [];

  const radX = Math.min(10, 4 + Math.floor(total / 18));
  const radY = Math.min(6, 3 + Math.floor(total / 26));

  const structuredPool = generateLayoutCandidates(layoutId, maxLayers, radX, radY);

  // Embaralha dentro de cada camada z para preservar suporte de baixo para cima
  for (let z = 0; z < maxLayers; z++) {
    const layerItems = prng.shuffle(structuredPool.filter(item => item.z === z));
    // Ordena levemente pelo centro da forma com ruído determinístico
    layerItems.sort((a, b) => (b.priority - a.priority) + (prng.next() - 0.5) * 3);

    for (const item of layerItems) {
      if (positions.length >= total) break;
      if (positions.length + item.group.length > total) continue;
      if (item.group.every(c => canPlacePosition(positions, c))) {
        positions.push(...item.group);
      }
    }
  }

  // Tentativas aleatórias determinísticas extras se ainda faltar espaço
  let attempts = 0;
  while (positions.length < total && attempts < 4000) {
    attempts++;
    const z = prng.nextInt(0, maxLayers);
    const shrink = Math.floor(z / 1.5);
    const maxX = Math.max(2, radX - shrink);
    const maxY = Math.max(2, radY - shrink);

    const x = prng.nextInt(0, maxX) * 2;
    const y = (prng.nextInt(0, maxY * 2 + 1) - maxY) * 2;
    const candidates = x === 0 ? [{ x: 0, y, z }] : [{ x, y, z }, { x: -x, y, z }];

    if (positions.length + candidates.length > total) continue;
    if (candidates.every(c => canPlacePosition(positions, c))) {
      positions.push(...candidates);
    }
  }

  // Fallback determinístico em grade na camada 0 para garantir total exato
  let fallbackX = -radX * 2;
  let fallbackY = -radY * 2;
  while (positions.length < total) {
    const c = { x: fallbackX, y: fallbackY, z: 0 };
    if (!positions.some(p => p.x === c.x && p.y === c.y && p.z === c.z)) {
      positions.push(c);
    }
    fallbackX += 2;
    if (fallbackX > radX * 2) {
      fallbackX = -radX * 2;
      fallbackY += 2;
    }
  }

  return positions;
}

export function buildSolvableBoard({
  numPairs,
  symbols,
  maxLayers = 4,
  seed = 1,
  layoutId = 'turtle'
}) {
  const prng = createPRNG(`board:${seed}:${layoutId}:${numPairs}`);
  const positions = generateGeometry(numPairs * 2, maxLayers, seed, layoutId);

  const tempTiles = positions.map((p, idx) => ({
    id: idx,
    x: p.x,
    y: p.y,
    z: p.z,
    symbol: '',
    removed: false,
    shake: 0
  }));

  const uniqueSymbols = Math.max(1, symbols.length);

  for (let i = 0; i < numPairs; i++) {
    let free = tempTiles.filter(t => !t.removed && isTileFree(t, tempTiles, 'removed'));
    if (free.length < 2) {
      free = tempTiles.filter(t => !t.removed);
    }

    // Prioriza remover das camadas mais altas durante a escavação reversa
    free.sort((a, b) => (b.z - a.z) + (prng.next() - 0.5));

    const tileA = free[0];
    const remFree = prng.shuffle(free.slice(1));
    const tileB = remFree[0];

    const sym = symbols[i % uniqueSymbols];
    tileA.symbol = sym;
    tileB.symbol = sym;

    tileA.removed = true;
    tileB.removed = true;
  }

  const finalTiles = tempTiles.map(t => ({
    ...t,
    removed: false,
    shake: 0
  }));

  return sortTilesForRender(finalTiles);
}

export function shuffleRemainingTiles(tiles, seed = Date.now()) {
  const remaining = tiles.filter(t => !t.removed);
  if (remaining.length < 2) return tiles;

  const prng = createPRNG(`shuffle:${seed}:${remaining.length}`);
  const counts = {};
  for (const t of remaining) {
    counts[t.symbol] = (counts[t.symbol] || 0) + 1;
  }

  const symbolsPool = [];
  for (const sym of Object.keys(counts)) {
    const pairCount = Math.floor(counts[sym] / 2);
    for (let i = 0; i < pairCount; i++) {
      symbolsPool.push(sym);
    }
  }
  const shuffledPool = prng.shuffle(symbolsPool);

  for (const t of remaining) {
    t.tempRemoved = false;
  }

  const numPairs = Math.floor(remaining.length / 2);
  for (let i = 0; i < numPairs; i++) {
    let free = remaining.filter(t => !t.tempRemoved && isTileFree(t, remaining, 'tempRemoved'));
    if (free.length < 2) {
      free = remaining.filter(t => !t.tempRemoved);
    }
    free = prng.shuffle(free);
    const [a, b] = [free[0], free[1]];
    const sym = shuffledPool[i] || remaining[0].symbol;
    a.symbol = sym;
    b.symbol = sym;
    a.tempRemoved = true;
    b.tempRemoved = true;
  }

  for (const t of remaining) {
    delete t.tempRemoved;
  }

  return tiles;
}

