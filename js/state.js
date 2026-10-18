// Gerenciamento de estado persistente, perfil do jogador, validação de localStorage e migração da v1.

import { POWERUPS, TABLE_THEMES, TILE_SKINS, SYMBOL_SETS } from './data.js';

export const LEGACY_SAVE_KEY = 'infinite_mahjong_save_v1';
export const PROFILE_KEY = 'infinite_mahjong_profile_v2';
export const SESSION_KEY_PREFIX = 'infinite_mahjong_session_v2_';

export function createDefaultProfile() {
  const initialCharges = {};
  for (const [k, v] of Object.entries(POWERUPS)) {
    initialCharges[k] = v.initialCharges;
  }

  return {
    coins: 100,
    totalCoinsEarned: 100,
    xp: 0,
    muted: false,
    selectedMode: 'infinite',
    selectedLayout: 'auto',
    selectedTheme: 'sapphire',
    selectedSkin: 'ivory',
    selectedSymbolSet: 'classic',
    unlockedThemes: ['sapphire'],
    unlockedSkins: ['ivory'],
    unlockedSymbolSets: ['classic'],
    powerups: initialCharges,
    achievements: [],
    stats: {
      pairsMatched: 0,
      levelsCompleted: 0,
      highestLevel: 1,
      highScoreInfinite: 0,
      highScoreTimeAttack: 0,
      bestCombo: 1,
      fastestWinSeconds: null,
      bombsUsed: 0,
      zenLevelsWon: 0,
      dailyWins: 0,
      dailyStreak: 0,
      lastDailyWinDate: null,
      layoutsWon: [],
      chainsBroken: 0,
      wildcardsUsed: 0,
      bossesDefeated: 0
    }
  };
}

export function validateTileArray(tiles) {
  if (!Array.isArray(tiles) || tiles.length === 0 || tiles.length > 300) return false;
  for (const t of tiles) {
    if (!t || typeof t !== 'object') return false;
    if (typeof t.id !== 'number' || !Number.isFinite(t.x) || !Number.isFinite(t.y) || !Number.isFinite(t.z)) {
      return false;
    }
    if (typeof t.symbol !== 'string' || t.symbol.length === 0) return false;
  }
  const activeCount = tiles.filter(t => !t.removed).length;
  if (activeCount % 2 !== 0) return false;
  return true;
}

export function loadProfile(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  const defaults = createDefaultProfile();
  if (!storage) return defaults;

  try {
    const raw = storage.getItem(PROFILE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    const merged = {
      ...defaults,
      ...parsed,
      coins: Number.isFinite(parsed.coins) && parsed.coins >= 0 ? Math.floor(parsed.coins) : defaults.coins,
      totalCoinsEarned: Number.isFinite(parsed.totalCoinsEarned) ? Math.floor(parsed.totalCoinsEarned) : defaults.totalCoinsEarned,
      xp: Number.isFinite(parsed.xp) && parsed.xp >= 0 ? Math.floor(parsed.xp) : 0,
      muted: Boolean(parsed.muted),
      selectedTheme: TABLE_THEMES[parsed.selectedTheme] ? parsed.selectedTheme : 'sapphire',
      selectedSkin: TILE_SKINS[parsed.selectedSkin] ? parsed.selectedSkin : 'ivory',
      selectedSymbolSet: SYMBOL_SETS[parsed.selectedSymbolSet] ? parsed.selectedSymbolSet : 'classic',
      unlockedThemes: Array.isArray(parsed.unlockedThemes) ? [...new Set(['sapphire', ...parsed.unlockedThemes])] : ['sapphire'],
      unlockedSkins: Array.isArray(parsed.unlockedSkins) ? [...new Set(['ivory', ...parsed.unlockedSkins])] : ['ivory'],
      unlockedSymbolSets: Array.isArray(parsed.unlockedSymbolSets) ? [...new Set(['classic', ...parsed.unlockedSymbolSets])] : ['classic'],
      powerups: { ...defaults.powerups, ...(parsed.powerups || {}) },
      achievements: Array.isArray(parsed.achievements) ? [...new Set(parsed.achievements)] : [],
      stats: {
        ...defaults.stats,
        ...(parsed.stats || {}),
        layoutsWon: Array.isArray(parsed.stats?.layoutsWon) ? [...new Set(parsed.stats.layoutsWon)] : []
      }
    };
    return merged;
  } catch {
    return defaults;
  }
}

export function saveProfile(profile, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Não foi possível salvar o perfil:', err);
  }
}

export function saveModeSession(mode, sessionData, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return;
  try {
    const payload = {
      ...sessionData,
      updatedAt: Date.now()
    };
    storage.setItem(`${SESSION_KEY_PREFIX}${mode}`, JSON.stringify(payload));
    if (mode === 'infinite') {
      storage.setItem(LEGACY_SAVE_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    console.warn('Não foi possível salvar a sessão:', err);
  }
}

export function loadModeSession(mode, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return null;
  try {
    let raw = storage.getItem(`${SESSION_KEY_PREFIX}${mode}`);
    if (!raw && mode === 'infinite') {
      raw = storage.getItem(LEGACY_SAVE_KEY);
    }
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || typeof state.level !== 'number' || state.level < 1) return null;
    if (!validateTileArray(state.tiles)) return null;

    return {
      level: Math.floor(state.level),
      score: Number.isFinite(state.score) && state.score >= 0 ? Math.floor(state.score) : 0,
      layoutId: state.layoutId || 'turtle',
      modifierId: state.modifierId || 'classic',
      timeLeftMs: Number.isFinite(state.timeLeftMs) ? state.timeLeftMs : null,
      blitzLeftMs: Number.isFinite(state.blitzLeftMs) ? state.blitzLeftMs : null,
      dateKey: state.dateKey || null,
      tiles: state.tiles.map(t => ({
        id: t.id,
        x: t.x,
        y: t.y,
        z: t.z,
        symbol: t.symbol,
        special: t.special || null,
        locked: Boolean(t.locked),
        mystery: Boolean(t.mystery),
        bonus: t.bonus || null,
        removed: Boolean(t.removed),
        shake: 0
      }))
    };
  } catch {
    return null;
  }
}

export function clearModeSession(mode, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return;
  try {
    storage.removeItem(`${SESSION_KEY_PREFIX}${mode}`);
    if (mode === 'infinite') {
      storage.removeItem(LEGACY_SAVE_KEY);
    }
  } catch {
    // Ignora falha de limpeza
  }
}
