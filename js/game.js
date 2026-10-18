// Controlador principal do Infinite Mahjong: ciclo de jogo, modos, power-ups, conquistas, zoom/pan e eventos.

import {
  SYMBOL_SETS,
  TABLE_THEMES,
  TILE_SKINS,
  GAME_MODES,
  BOARD_LAYOUTS,
  POWERUPS,
  ACHIEVEMENTS,
  getPlayerLevelInfo
} from './data.js';
import { getTodayKey, getYesterdayKey } from './prng.js';
import { SoundManager } from './sound.js';
import {
  resolveLayoutId,
  isTileFree,
  getAvailablePairs,
  sortTilesForRender,
  buildSolvableBoard,
  shuffleRemainingTiles
} from './board.js';
import {
  loadProfile,
  saveProfile,
  loadModeSession,
  saveModeSession,
  clearModeSession
} from './state.js';
import { BoardRenderer } from './renderer.js';
import { UIManager } from './ui.js';

export class InfiniteMahjong {
  constructor() {
    this.canvas = document.getElementById('mahjong-canvas');
    this.renderer = new BoardRenderer(this.canvas);
    this.profile = loadProfile();
    this.sound = new SoundManager(this.profile.muted);
    this.ui = new UIManager(this);

    this.mode = this.profile.selectedMode || 'infinite';
    this.level = 1;
    this.score = 0;
    this.currentLayoutId = 'turtle';
    this.currentSeed = '1';

    this.tiles = [];
    this.undoStack = [];
    this.selectedTile = null;
    this.hoveredTile = null;
    this.hintPair = [];
    this.particles = [];
    this.rings = [];
    this.floatingTexts = [];

    this.combo = 0;
    this.comboTimer = 0;
    this.comboMaxTime = 4500;
    this.torchTimer = 0;
    this.freezeTimer = 0;
    this.screenShake = 0;

    // Cronômetros de fase e Time Attack
    this.levelStartTime = performance.now();
    this.timeAttackRemainingMs = 150000;
    this.usedAssistInLevel = false;

    this.gameOverPending = false;
    this.boardGeneration = 0;
    this.lastFrameTime = performance.now();

    // Escala, Zoom e Pan
    this.tileW = 54;
    this.tileH = 72;
    this.depthOffset = 7;
    this.boardOffsetX = 0;
    this.boardOffsetY = 0;
    this.userZoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    this.achievementQueue = [];
    this.achievementShowing = false;

    this.applyThemeCSS();
    this.bindEvents();
    this.resize();
    this.restoreOrStartMode(this.mode);
    this.syncSoundButton();

    requestAnimationFrame((t) => this.loop(t));
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      const gc = document.getElementById('game-container');
      if (gc) this.resizeObserver.observe(gc);
    }

    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    window.addEventListener('pointerup', () => { this.isPanning = false; });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      this.adjustZoom(delta);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const key = e.key.toUpperCase();
      if (key === 'Z' || key === 'U') this.usePowerup('undo');
      else if (key === 'H') this.usePowerup('hint');
      else if (key === 'T') this.usePowerup('torch');
      else if (key === 'F') this.usePowerup('freeze');
      else if (key === 'M') this.usePowerup('magnet');
      else if (key === 'B') this.usePowerup('bomb');
      else if (key === 'S') this.usePowerup('shuffle');
      else if (key === 'ESCAPE') {
        this.selectedTile = null;
        this.ui.closeModal();
      }
    });
  }

  applyThemeCSS() {
    const theme = TABLE_THEMES[this.profile.selectedTheme] || TABLE_THEMES.sapphire;
    const root = document.documentElement;
    root.style.setProperty('--bg-grad-start', theme.bgStart);
    root.style.setProperty('--bg-grad-end', theme.bgEnd);
    root.style.setProperty('--accent', theme.accent);
  }

  syncSoundButton() {
    const btn = document.getElementById('btn-mute');
    if (btn) {
      btn.textContent = this.sound.muted ? '🔇' : '🔊';
      btn.title = this.sound.muted ? 'Ativar Som' : 'Silenciar Som';
    }
  }

  toggleSound() {
    const muted = this.sound.toggleMute();
    this.profile.muted = muted;
    saveProfile(this.profile);
    this.syncSoundButton();
  }

  adjustZoom(delta) {
    this.userZoom = Math.max(0.65, Math.min(1.65, Number((this.userZoom + delta).toFixed(2))));
    this.fitBoard();
  }

  resetView() {
    this.userZoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.fitBoard();
  }

  resize() {
    const container = document.getElementById('game-container');
    if (!container) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    this.fitBoard();
  }

  fitBoard() {
    const active = this.tiles.filter(t => !t.removed);
    if (!active.length) return;
    const extents = (w, h, depth) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const t of active) {
        const x = t.x * w / 2 - w / 2 - t.z * depth;
        const y = t.y * h / 2 - h / 2 - t.z * depth;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
      return { minX, minY, maxX, maxY };
    };
    const base = extents(54, 72, 7);
    const autoScale = Math.max(0.01, Math.min(1.35,
      Math.max(1, this.canvas.width - 36) / Math.max(1, base.maxX - base.minX),
      Math.max(1, this.canvas.height - 56) / Math.max(1, base.maxY - base.minY)
    ));
    const scale = autoScale * this.userZoom;
    this.tileW = 54 * scale;
    this.tileH = 72 * scale;
    this.depthOffset = 7 * scale;
    const bounds = extents(this.tileW, this.tileH, this.depthOffset);
    this.boardOffsetX = -(bounds.minX + bounds.maxX) / 2 + this.panX;
    this.boardOffsetY = -(bounds.minY + bounds.maxY) / 2 + this.panY + 10;
  }

  switchMode(newMode) {
    if (!GAME_MODES[newMode]) return;
    this.mode = newMode;
    this.profile.selectedMode = newMode;
    saveProfile(this.profile);
    this.restoreOrStartMode(newMode);
  }

  setLayoutPreference(layoutId) {
    if (!BOARD_LAYOUTS[layoutId]) return;
    this.profile.selectedLayout = layoutId;
    saveProfile(this.profile);
    this.startLevel(this.level);
    this.showToast(`Layout: ${BOARD_LAYOUTS[layoutId].name}`);
  }

  startCustomSeed(seedText) {
    this.startLevel(this.level, seedText);
    this.showToast(`Mesa gerada com a semente "${seedText}"!`);
  }

  restoreOrStartMode(mode) {
    const saved = loadModeSession(mode);
    const today = getTodayKey();

    if (saved) {
      if (mode === 'daily' && saved.dateKey !== today) {
        clearModeSession('daily');
        this.score = 0;
        this.startLevel(1);
        return;
      }
      const activeCount = saved.tiles.filter(t => !t.removed).length;
      if (activeCount === 0) {
        this.score = saved.score || 0;
        this.startLevel(saved.level + 1);
        return;
      }
      this.boardGeneration++;
      this.gameOverPending = false;
      this.level = saved.level;
      this.score = saved.score;
      this.currentLayoutId = saved.layoutId || resolveLayoutId(this.profile.selectedLayout, this.level);
      this.tiles = sortTilesForRender(saved.tiles);
      this.undoStack = [];
      this.selectedTile = null;
      this.hintPair = [];
      if (mode === 'time_attack') {
        this.timeAttackRemainingMs = saved.timeLeftMs || 150000;
      }
      this.fitBoard();
      this.updateUI(false);
      this.showToast(`${GAME_MODES[mode].name} restaurado na Fase ${this.level}!`);
    } else {
      this.score = 0;
      if (mode === 'time_attack') {
        this.timeAttackRemainingMs = 150000;
      }
      this.startLevel(1);
    }
  }

  getActiveSymbolsList() {
    const setObj = SYMBOL_SETS[this.profile.selectedSymbolSet] || SYMBOL_SETS.classic;
    return setObj.symbols;
  }

  startLevel(lvl, customSeed = null) {
    this.boardGeneration++;
    this.gameOverPending = false;
    this.level = Math.max(1, lvl);
    this.selectedTile = null;
    this.hoveredTile = null;
    this.hintPair = [];
    this.undoStack = [];
    this.usedAssistInLevel = false;
    this.levelStartTime = performance.now();
    this.resetCombo();

    if (this.mode === 'time_attack' && this.level === 1 && this.score === 0) {
      this.timeAttackRemainingMs = 150000;
    }

    const symbolsList = this.getActiveSymbolsList();
    let numPairs = Math.min(72, 6 + Math.floor(this.level * 2));
    let uniqueSymbols = Math.min(symbolsList.length, 4 + Math.floor(this.level * 0.8));
    let maxLayers = Math.min(6, 2 + Math.floor(this.level / 3));

    if (this.mode === 'daily') {
      // Desafio Diário já começa com um tabuleiro denso e tático
      numPairs = Math.min(54, 24 + (this.level - 1) * 10);
      uniqueSymbols = Math.min(symbolsList.length, 16 + (this.level - 1) * 4);
      maxLayers = Math.min(5, 3 + Math.floor(this.level / 2));
    }

    this.currentLayoutId = resolveLayoutId(this.profile.selectedLayout, this.level);
    const today = getTodayKey();
    this.currentSeed = customSeed
      ? String(customSeed)
      : (this.mode === 'daily'
        ? `daily-${today}-L${this.level}`
        : `${this.mode}-L${this.level}-${Date.now().toString(36)}`);

    this.tiles = buildSolvableBoard({
      numPairs,
      symbols: symbolsList.slice(0, uniqueSymbols),
      maxLayers,
      seed: this.currentSeed,
      layoutId: this.currentLayoutId
    });

    if (this.mode === 'infinite' && this.level > this.profile.stats.highestLevel) {
      this.profile.stats.highestLevel = this.level;
      saveProfile(this.profile);
    }

    this.checkAchievements();
    this.fitBoard();
    this.updateUI(true);
  }

  triggerCombo() {
    this.combo = Math.min(10, this.combo + 1);
    this.comboMaxTime = Math.max(2200, 5000 - (this.combo * 280));
    this.comboTimer = this.comboMaxTime;

    if (this.combo > this.profile.stats.bestCombo) {
      this.profile.stats.bestCombo = this.combo;
    }

    // Recompensa de carga extra ao atingir Combo x8
    if (this.combo === 8) {
      this.profile.powerups.magnet = (this.profile.powerups.magnet || 0) + 1;
      this.showToast('🔥 Combo x8! +1 Ímã de Par ganho!');
    }

    this.updateComboUI();
  }

  resetCombo() {
    if (this.combo > 0) {
      this.combo = 0;
      this.comboTimer = 0;
      this.updateComboUI();
    }
  }

  updateComboUI() {
    const mult = Math.max(1, this.combo);
    const comboEl = document.getElementById('ui-combo');
    const boxEl = document.getElementById('ui-combo-box');
    const fillEl = document.getElementById('combo-bar-fill');

    if (comboEl) comboEl.textContent = this.freezeTimer > 0 ? `❄️ x${mult}` : `x${mult}`;
    if (boxEl) {
      boxEl.classList.toggle('active', this.combo > 1);
      boxEl.classList.toggle('frozen', this.freezeTimer > 0);
    }
    if (fillEl) {
      fillEl.classList.toggle('frozen', this.freezeTimer > 0);
      if (this.combo === 0) fillEl.style.width = '0%';
    }
  }

  saveGameState() {
    saveModeSession(this.mode, {
      level: this.level,
      score: this.score,
      layoutId: this.currentLayoutId,
      timeLeftMs: this.mode === 'time_attack' ? this.timeAttackRemainingMs : null,
      dateKey: this.mode === 'daily' ? getTodayKey() : null,
      tiles: this.tiles.map(t => ({
        id: t.id,
        x: t.x,
        y: t.y,
        z: t.z,
        symbol: t.symbol,
        removed: t.removed
      }))
    });
    saveProfile(this.profile);
    this.flashSaveIndicator();
  }

  flashSaveIndicator() {
    const el = document.getElementById('save-indicator');
    if (!el) return;
    el.classList.add('visible');
    clearTimeout(this.saveIndicatorTimer);
    this.saveIndicatorTimer = setTimeout(() => {
      el.classList.remove('visible');
    }, 1000);
  }

  resetProgress() {
    if (confirm(`Deseja reiniciar a partida atual do ${GAME_MODES[this.mode].name} e voltar para a Fase 1? (Suas moedas, temas e conquistas serão mantidos)`)) {
      clearModeSession(this.mode);
      this.score = 0;
      if (this.mode === 'time_attack') this.timeAttackRemainingMs = 150000;
      this.resetCombo();
      this.startLevel(1);
      this.sound.playError();
      this.showToast('Partida reiniciada!', true);
    }
  }

  consumePowerupResource(powerupId) {
    const cfg = POWERUPS[powerupId];
    if (!cfg) return false;

    // No modo Zen, Desfazer, Dica e Embaralhar são livres
    if (this.mode === 'zen' && ['undo', 'hint', 'shuffle'].includes(powerupId)) {
      return true;
    }

    const currentCharges = this.profile.powerups[powerupId] || 0;
    if (currentCharges > 0) {
      this.profile.powerups[powerupId] = currentCharges - 1;
      saveProfile(this.profile);
      return true;
    }

    if (this.profile.coins >= cfg.coinCost) {
      this.profile.coins -= cfg.coinCost;
      saveProfile(this.profile);
      return true;
    }

    // Fallback clássico por pontos para dica e embaralhar
    if (powerupId === 'hint') {
      this.score = Math.max(0, this.score - 20);
      return true;
    }
    if (powerupId === 'shuffle') {
      this.score = Math.max(0, this.score - 50);
      return true;
    }

    this.sound.playError();
    this.showToast(`Moedas insuficientes (precisa de 🪙 ${cfg.coinCost})!`, true);
    return false;
  }

  usePowerup(powerupId) {
    if (this.gameOverPending) return;

    if (powerupId === 'undo') {
      if (this.undoStack.length === 0) {
        this.sound.playError();
        this.showToast('Nenhuma jogada para desfazer!', true);
        return;
      }
      if (!this.consumePowerupResource('undo')) return;
      const last = this.undoStack.pop();
      const t1 = this.tiles.find(t => t.id === last.id1);
      const t2 = this.tiles.find(t => t.id === last.id2);
      if (t1) t1.removed = false;
      if (t2) t2.removed = false;
      this.selectedTile = null;
      this.hintPair = [];
      this.sound.playUndo();
      this.fitBoard();
      this.updateUI(true);
      this.showToast('↩️ Último par restaurado!');
      return;
    }

    if (powerupId === 'hint') {
      this.showHint();
      return;
    }

    if (powerupId === 'shuffle') {
      this.shuffleBoard(true);
      return;
    }

    if (powerupId === 'torch') {
      if (!this.consumePowerupResource('torch')) return;
      this.torchTimer = 12000;
      this.sound.playPowerup('torch');
      this.updateUI(true);
      this.showToast('🔦 Visão Raio-X ativada por 12s!');
      return;
    }

    if (powerupId === 'freeze') {
      if (!this.consumePowerupResource('freeze')) return;
      this.freezeTimer = 15000;
      if (this.combo === 0) {
        this.combo = 2;
      }
      this.comboMaxTime = 5000;
      this.comboTimer = 5000;
      this.sound.playPowerup('freeze');
      this.updateComboUI();
      this.updateUI(true);
      this.showToast('❄️ Combo congelado por 15s!');
      return;
    }

    if (powerupId === 'magnet') {
      const pairs = getAvailablePairs(this.tiles);
      if (pairs.length === 0) {
        this.shuffleBoard(false);
        return;
      }
      if (!this.consumePowerupResource('magnet')) return;
      // Prioriza o par da camada mais alta
      pairs.sort((a, b) => Math.max(b[0].z, b[1].z) - Math.max(a[0].z, a[1].z));
      const [t1, t2] = pairs[0];
      this.sound.playPowerup('magnet');
      this.executePairMatch(t1, t2, '🧲 Ímã');
      return;
    }

    if (powerupId === 'bomb') {
      let pairs = getAvailablePairs(this.tiles);
      if (pairs.length === 0) {
        this.shuffleBoard(false);
        return;
      }
      if (!this.consumePowerupResource('bomb')) return;
      this.profile.stats.bombsUsed = (this.profile.stats.bombsUsed || 0) + 1;
      this.sound.playPowerup('bomb');
      this.screenShake = 18;

      const generation = this.boardGeneration;
      let detonated = 0;
      const detonateNext = () => {
        if (generation !== this.boardGeneration || this.gameOverPending) return;
        const currentPairs = getAvailablePairs(this.tiles);
        if (currentPairs.length === 0 || detonated >= 3) return;
        const [a, b] = currentPairs[0];
        this.executePairMatch(a, b, '💥');
        detonated++;
        if (detonated < 3) {
          setTimeout(detonateNext, 160);
        }
      };
      detonateNext();
    }
  }

  showHint() {
    if (this.gameOverPending) return;
    const pairs = getAvailablePairs(this.tiles);
    if (pairs.length > 0) {
      if (!this.consumePowerupResource('hint')) return;
      this.usedAssistInLevel = true;
      this.hintPair = pairs[Math.floor(Math.random() * pairs.length)];
      this.sound.playClick();
      this.updateUI(true);
    } else {
      this.shuffleBoard(false);
    }
  }

  shuffleBoard(isManual = true) {
    if (this.gameOverPending) return;
    const remaining = this.tiles.filter(t => !t.removed);
    if (remaining.length === 0) return;

    if (isManual) {
      if (!this.consumePowerupResource('shuffle')) return;
      this.usedAssistInLevel = true;
      if (this.mode !== 'zen') this.resetCombo();
      this.sound.playPowerup('shuffle');
    }

    this.selectedTile = null;
    this.hintPair = [];
    shuffleRemainingTiles(this.tiles, Date.now());
    this.showToast('🔀 Tabuleiro Embaralhado!', isManual);
    this.updateUI(true);
  }

  nextLevel() {
    this.sound.playWin();
    this.startLevel(this.level + 1);
    this.showToast(`Fase ${this.level} Gerada!`);
  }

  buyPowerupCharge(powerupId) {
    const cfg = POWERUPS[powerupId];
    if (!cfg) return false;
    if (this.profile.coins < cfg.coinCost) {
      this.sound.playError();
      this.showToast('Moedas insuficientes!', true);
      return false;
    }
    this.profile.coins -= cfg.coinCost;
    this.profile.powerups[powerupId] = (this.profile.powerups[powerupId] || 0) + 1;
    this.sound.playClick();
    this.updateUI(true);
    return true;
  }

  buyOrSelectCosmetic(type, id, cost) {
    const listKey = type === 'theme'
      ? 'unlockedThemes'
      : (type === 'skin' ? 'unlockedSkins' : 'unlockedSymbolSets');
    const selectedKey = type === 'theme'
      ? 'selectedTheme'
      : (type === 'skin' ? 'selectedSkin' : 'selectedSymbolSet');

    const unlockedList = this.profile[listKey];
    if (!unlockedList.includes(id)) {
      if (this.profile.coins < cost) {
        this.sound.playError();
        this.showToast(`Você precisa de 🪙 ${cost} moedas!`, true);
        return false;
      }
      this.profile.coins -= cost;
      unlockedList.push(id);
      this.sound.playAchievement();
      this.showToast('✨ Item desbloqueado na Loja!');
    } else {
      this.sound.playClick();
    }

    this.profile[selectedKey] = id;
    if (type === 'theme') {
      this.applyThemeCSS();
    } else if (type === 'symbolSet') {
      // Atualiza os símbolos da mesa atual mantendo os pares
      this.remapBoardSymbols();
    }

    this.checkAchievements();
    this.updateUI(true);
    return true;
  }

  remapBoardSymbols() {
    const newSymbols = this.getActiveSymbolsList();
    const map = {};
    let idx = 0;
    for (const t of this.tiles) {
      if (!map[t.symbol]) {
        map[t.symbol] = newSymbols[idx % newSymbols.length];
        idx++;
      }
      t.symbol = map[t.symbol];
    }
  }

  awardCoinsAndXP(coins, xp) {
    if (coins > 0) {
      this.profile.coins += coins;
      this.profile.totalCoinsEarned = (this.profile.totalCoinsEarned || 0) + coins;
    }
    if (xp > 0) {
      this.profile.xp = (this.profile.xp || 0) + xp;
    }
  }

  checkAchievements() {
    const s = this.profile.stats;
    const totalCosmetics =
      (this.profile.unlockedThemes.length - 1) +
      (this.profile.unlockedSkins.length - 1) +
      (this.profile.unlockedSymbolSets.length - 1);

    const classicFour = ['turtle', 'dragon', 'fortress', 'pyramid'];
    const wonAllClassic = classicFour.every(l => s.layoutsWon.includes(l));

    const checks = {
      first_match: s.pairsMatched >= 1,
      combo_5: s.bestCombo >= 5,
      combo_10: s.bestCombo >= 10,
      eagle_eye: Boolean(this._justWonWithoutAssist),
      speedrunner: s.fastestWinSeconds !== null && s.fastestWinSeconds <= 45,
      level_10: s.highestLevel >= 10,
      level_25: s.highestLevel >= 25,
      daily_hero: s.dailyWins >= 1,
      time_lord: s.highScoreTimeAttack >= 2500,
      zen_master: s.zenLevelsWon >= 3,
      demoman: s.bombsUsed >= 5,
      collector: totalCosmetics >= 3,
      pairs_100: s.pairsMatched >= 100,
      pairs_500: s.pairsMatched >= 500,
      architect: wonAllClassic,
      tycoon: this.profile.totalCoinsEarned >= 1000
    };

    for (const ach of ACHIEVEMENTS) {
      if (!this.profile.achievements.includes(ach.id) && checks[ach.id]) {
        this.profile.achievements.push(ach.id);
        this.awardCoinsAndXP(ach.reward, 50);
        this.queueAchievementBanner(ach);
      }
    }
  }

  queueAchievementBanner(ach) {
    this.achievementQueue.push(ach);
    if (!this.achievementShowing) {
      this.displayNextAchievement();
    }
  }

  displayNextAchievement() {
    if (this.achievementQueue.length === 0) {
      this.achievementShowing = false;
      return;
    }
    this.achievementShowing = true;
    const ach = this.achievementQueue.shift();
    const banner = document.getElementById('achievement-banner');
    const iconEl = document.getElementById('ach-banner-icon');
    const titleEl = document.getElementById('ach-banner-title');

    if (banner && iconEl && titleEl) {
      iconEl.textContent = ach.icon;
      titleEl.textContent = `${ach.title} (+🪙${ach.reward})`;
      banner.classList.add('show');
      this.sound.playAchievement();
      setTimeout(() => {
        banner.classList.remove('show');
        setTimeout(() => this.displayNextAchievement(), 450);
      }, 3200);
    } else {
      this.achievementShowing = false;
    }
  }

  showToast(msg, isWarn = false) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = isWarn ? 'show warn' : 'show';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { t.className = ''; }, 2300);
  }

  updateInspectorHUD() {
    const pill = document.getElementById('hud-inspector');
    if (!pill) return;

    const target = this.hoveredTile || this.selectedTile;
    const layoutObj = BOARD_LAYOUTS[this.currentLayoutId] || BOARD_LAYOUTS.turtle;

    if (!target || target.removed) {
      pill.innerHTML = `${layoutObj.icon} <strong>${layoutObj.name}</strong> · Passe o cursor ou toque em uma peça`;
      return;
    }

    const sameActive = this.tiles.filter(t => !t.removed && t.symbol === target.symbol);
    const sameFree = sameActive.filter(t => isTileFree(t, this.tiles));
    const freeStatus = isTileFree(target, this.tiles) ? 'Livre' : 'Bloqueada';
    pill.innerHTML = `${target.symbol} <strong>${freeStatus}</strong> (Camada L${target.z + 1}) · Restam <strong>${sameActive.length}</strong> na mesa (<strong>${sameFree.length}</strong> livres)`;
  }

  updatePowerupDockUI() {
    for (const [id, cfg] of Object.entries(POWERUPS)) {
      const badgeEl = document.getElementById(`pwr-badge-${id}`);
      const btnEl = document.getElementById(`pwr-btn-${id}`);
      if (!badgeEl || !btnEl) continue;

      const charges = this.profile.powerups[id] || 0;
      if (this.mode === 'zen' && ['undo', 'hint', 'shuffle'].includes(id)) {
        badgeEl.textContent = '∞';
        badgeEl.classList.remove('coin-cost');
      } else if (charges > 0) {
        badgeEl.textContent = `${charges}`;
        badgeEl.classList.remove('coin-cost');
      } else {
        badgeEl.textContent = `🪙${cfg.coinCost}`;
        badgeEl.classList.add('coin-cost');
      }

      if (id === 'torch') {
        btnEl.classList.toggle('active-effect', this.torchTimer > 0);
      } else if (id === 'freeze') {
        btnEl.classList.toggle('active-effect', this.freezeTimer > 0);
      }
    }
  }

  updateUI(shouldSave = true) {
    const remainingTiles = this.tiles.filter(t => !t.removed).length;
    const pairs = getAvailablePairs(this.tiles);
    const lvlInfo = getPlayerLevelInfo(this.profile.xp);

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl('ui-mode-badge', GAME_MODES[this.mode]?.badge || 'Infinito');
    setEl('ui-level', this.level);
    setEl('ui-pairs', remainingTiles / 2);
    setEl('ui-moves', pairs.length);
    setEl('ui-score', this.score);
    setEl('ui-coins', this.profile.coins);
    setEl('ui-player-level', `Nv.${lvlInfo.level}`);

    const timerBox = document.getElementById('ui-timer-box');
    const timerVal = document.getElementById('ui-timer');
    if (timerBox && timerVal) {
      if (this.mode === 'time_attack') {
        timerBox.hidden = false;
        const sec = Math.max(0, Math.ceil(this.timeAttackRemainingMs / 1000));
        const m = Math.floor(sec / 60);
        const s = String(sec % 60).padStart(2, '0');
        timerVal.textContent = `${m}:${s}`;
        timerBox.classList.toggle('urgent', sec <= 20);
      } else {
        timerBox.hidden = true;
      }
    }

    this.updateComboUI();
    this.updatePowerupDockUI();
    this.updateInspectorHUD();

    if (this.mode === 'infinite' && this.score > this.profile.stats.highScoreInfinite) {
      this.profile.stats.highScoreInfinite = this.score;
    }
    if (this.mode === 'time_attack' && this.score > this.profile.stats.highScoreTimeAttack) {
      this.profile.stats.highScoreTimeAttack = this.score;
    }

    if (shouldSave) {
      this.saveGameState();
    }

    if (remainingTiles === 0 && this.tiles.length > 0 && !this.gameOverPending) {
      this.handleLevelVictory();
      return;
    }

    if (pairs.length === 0 && remainingTiles > 0 && !this.gameOverPending) {
      if (this.mode === 'zen') {
        // No modo Zen, reorganiza suavemente sem penalidade
        this.shuffleBoard(false);
        return;
      }
      this.gameOverPending = true;
      const generation = this.boardGeneration;
      const penalty = 50;
      const lost = Math.min(this.score, penalty);
      this.score -= lost;
      this.resetCombo();
      this.sound.playError();
      setEl('ui-score', this.score);
      this.saveGameState();
      this.showToast(`💀 Sem movimentos! -${lost} pts. Gerando nova mesa...`, true);

      setTimeout(() => {
        if (generation !== this.boardGeneration || !this.gameOverPending) return;
        this.startLevel(this.level);
      }, 2200);
    }
  }

  handleLevelVictory() {
    this.gameOverPending = true;
    const generation = this.boardGeneration;
    const elapsedSec = Math.max(1, Math.round((performance.now() - this.levelStartTime) / 1000));

    const levelBonus = this.level * 100;
    const coinsWon = 15 + Math.min(45, this.level * 3) + (this.mode === 'daily' ? 30 : 0);
    const xpWon = 40 + this.level * 10;

    this.score += levelBonus;
    this.awardCoinsAndXP(coinsWon, xpWon);

    const s = this.profile.stats;
    s.levelsCompleted = (s.levelsCompleted || 0) + 1;
    if (s.fastestWinSeconds === null || elapsedSec < s.fastestWinSeconds) {
      s.fastestWinSeconds = elapsedSec;
    }
    if (!s.layoutsWon.includes(this.currentLayoutId)) {
      s.layoutsWon.push(this.currentLayoutId);
    }
    if (this.mode === 'zen') {
      s.zenLevelsWon = (s.zenLevelsWon || 0) + 1;
    }
    if (this.mode === 'time_attack') {
      this.timeAttackRemainingMs += 25000;
    }
    if (this.mode === 'daily') {
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      if (s.lastDailyWinDate !== today) {
        s.dailyWins = (s.dailyWins || 0) + 1;
        s.dailyStreak = (s.lastDailyWinDate === yesterday) ? (s.dailyStreak || 0) + 1 : 1;
        s.lastDailyWinDate = today;
      }
    }

    // A cada 3 fases concluídas, ganha 1 carga de Desfazer e 1 de Dica
    if (s.levelsCompleted % 3 === 0) {
      this.profile.powerups.undo = (this.profile.powerups.undo || 0) + 1;
      this.profile.powerups.hint = (this.profile.powerups.hint || 0) + 1;
    }

    this._justWonWithoutAssist = !this.usedAssistInLevel;
    this.checkAchievements();
    this._justWonWithoutAssist = false;

    this.resetCombo();
    this.saveGameState();
    this.sound.playWin();
    this.showToast(`🎉 Fase ${this.level} Concluída! +${levelBonus} pts · +🪙${coinsWon}`);

    setTimeout(() => {
      if (generation !== this.boardGeneration) return;
      this.startLevel(this.level + 1);
    }, 1500);
  }

  getTileScreenRect(tile) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const sx = cx + (tile.x * (this.tileW / 2)) - (this.tileW / 2) - (tile.z * this.depthOffset);
    const sy = cy + (tile.y * (this.tileH / 2)) - (this.tileH / 2) - (tile.z * this.depthOffset);
    return { x: sx + this.boardOffsetX, y: sy + this.boardOffsetY, w: this.tileW, h: this.tileH };
  }

  findTopTileAt(mx, my) {
    for (let i = this.tiles.length - 1; i >= 0; i--) {
      const tile = this.tiles[i];
      if (tile.removed) continue;
      const r = this.getTileScreenRect(tile);
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        return tile;
      }
    }
    return null;
  }

  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.isPanning) {
      this.panX += mx - this.panStartX;
      this.panY += my - this.panStartY;
      this.panStartX = mx;
      this.panStartY = my;
      this.fitBoard();
      return;
    }

    const hovered = this.findTopTileAt(mx, my);
    if (hovered !== this.hoveredTile) {
      this.hoveredTile = hovered;
      this.updateInspectorHUD();
    }
  }

  handlePointerDown(e) {
    if (this.gameOverPending) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Botão direito ou botão do meio faz Pan do tabuleiro
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      this.isPanning = true;
      this.panStartX = mx;
      this.panStartY = my;
      return;
    }

    const tile = this.findTopTileAt(mx, my);
    if (!tile) {
      this.selectedTile = null;
      this.updateInspectorHUD();
      return;
    }

    if (!isTileFree(tile, this.tiles)) {
      tile.shake = 10;
      this.sound.playError();
      this.updateInspectorHUD();
      return;
    }

    this.hintPair = [];
    if (this.selectedTile && this.selectedTile.id === tile.id) {
      this.selectedTile = null;
      this.sound.playClick();
    } else if (this.selectedTile && this.selectedTile.symbol === tile.symbol) {
      this.executePairMatch(this.selectedTile, tile);
    } else {
      this.selectedTile = tile;
      this.sound.playClick();
    }
    this.updateInspectorHUD();
  }

  executePairMatch(tileA, tileB, badgePrefix = '') {
    const r1 = this.getTileScreenRect(tileA);
    const r2 = this.getTileScreenRect(tileB);

    this.triggerCombo();
    this.sound.playMatch(this.combo);

    const basePoints = 25 + (Math.max(tileA.z, tileB.z) * 5);
    const earnedPoints = basePoints * this.combo;
    const earnedCoins = this.combo >= 5 ? 3 : (this.combo >= 2 ? 2 : 1);

    this.spawnParticles(r1.x + r1.w / 2, r1.y + r1.h / 2);
    this.spawnParticles(r2.x + r2.w / 2, r2.y + r2.h / 2);
    this.spawnRing(r1.x + r1.w / 2, r1.y + r1.h / 2, '#10b981');
    this.spawnRing(r2.x + r2.w / 2, r2.y + r2.h / 2, '#fbbf24');

    const label = `${badgePrefix ? `${badgePrefix} ` : ''}+${earnedPoints}${this.combo > 1 ? ` (x${this.combo}!)` : ''}`;
    this.spawnFloatingText(
      r2.x + r2.w / 2,
      r2.y,
      label,
      this.combo > 1 ? '#fcd34d' : '#10b981'
    );

    this.undoStack.push({ id1: tileA.id, id2: tileB.id });
    tileA.removed = true;
    tileB.removed = true;
    this.selectedTile = null;

    this.score += earnedPoints;
    this.profile.stats.pairsMatched = (this.profile.stats.pairsMatched || 0) + 1;
    this.awardCoinsAndXP(earnedCoins, 8 + this.combo * 2);

    if (this.mode === 'time_attack') {
      const bonusMs = this.combo >= 5 ? 4000 : 2000;
      this.timeAttackRemainingMs = Math.min(240000, this.timeAttackRemainingMs + bonusMs);
    }

    this.checkAchievements();
    this.updateUI(true);
  }

  spawnParticles(x, y) {
    const colors = ['#10b981', '#fcd34d', '#38bdf8', '#f472b6'];
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1.0,
        size: 3.5 + Math.random() * 2.5,
        color: colors[i % colors.length]
      });
    }
  }

  spawnRing(x, y, color = '#10b981') {
    this.rings.push({ x, y, radius: 8, life: 1.0, color });
  }

  spawnFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, life: 1.0 });
  }

  loop(now = performance.now()) {
    const dt = Math.min(100, Math.max(0, now - this.lastFrameTime));
    this.lastFrameTime = now;

    if (this.torchTimer > 0) {
      this.torchTimer = Math.max(0, this.torchTimer - dt);
      if (this.torchTimer === 0) this.updatePowerupDockUI();
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - dt);
      if (this.freezeTimer === 0) {
        this.updateComboUI();
        this.updatePowerupDockUI();
      }
    } else if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      const pct = (this.comboTimer / this.comboMaxTime) * 100;
      const fillEl = document.getElementById('combo-bar-fill');
      if (fillEl) fillEl.style.width = `${pct}%`;

      if (this.comboTimer === 0) {
        this.resetCombo();
      }
    }

    // Contagem regressiva do modo Contra o Relógio
    if (this.mode === 'time_attack' && !this.gameOverPending && this.tiles.some(t => !t.removed)) {
      this.timeAttackRemainingMs = Math.max(0, this.timeAttackRemainingMs - dt);
      const sec = Math.ceil(this.timeAttackRemainingMs / 1000);
      if (sec !== this._lastRenderedSec) {
        this._lastRenderedSec = sec;
        const timerVal = document.getElementById('ui-timer');
        const timerBox = document.getElementById('ui-timer-box');
        if (timerVal) {
          const m = Math.floor(sec / 60);
          const s = String(sec % 60).padStart(2, '0');
          timerVal.textContent = `${m}:${s}`;
        }
        if (timerBox) timerBox.classList.toggle('urgent', sec <= 20);
      }

      if (this.timeAttackRemainingMs === 0) {
        this.gameOverPending = true;
        const generation = this.boardGeneration;
        this.sound.playError();
        this.showToast(`⏰ Tempo Esgotado! Pontuação final: ${this.score} pts`, true);
        clearModeSession('time_attack');
        setTimeout(() => {
          if (generation !== this.boardGeneration) return;
          this.score = 0;
          this.timeAttackRemainingMs = 150000;
          this.startLevel(1);
        }, 2800);
      }
    }

    this.renderer.render(this, dt, now);
    requestAnimationFrame((t) => this.loop(t));
  }
}

