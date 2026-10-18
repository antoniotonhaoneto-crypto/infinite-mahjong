// Gerenciador de interface e janelas modais: Modos e Layouts, Loja de Temas, Conquistas e Estatísticas.

import {
  GAME_MODES,
  BOARD_LAYOUTS,
  TABLE_THEMES,
  TILE_SKINS,
  SYMBOL_SETS,
  ACHIEVEMENTS,
  POWERUPS,
  getPlayerLevelInfo
} from './data.js';
import { getTodayKey } from './prng.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.modalOverlay = document.getElementById('app-modal-overlay');
    this.modalTitle = document.getElementById('app-modal-title');
    this.modalBody = document.getElementById('app-modal-body');
    this.modalClose = document.getElementById('app-modal-close');

    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) this.closeModal();
      });
    }
  }

  openModal(titleHtml, renderFn) {
    if (!this.modalOverlay) return;
    this.modalTitle.innerHTML = titleHtml;
    this.modalBody.innerHTML = '';
    renderFn(this.modalBody);
    this.modalOverlay.classList.add('visible');
  }

  closeModal() {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.remove('visible');
  }

  openModesModal() {
    const g = this.game;
    const today = getTodayKey();
    const dailyDoneToday = g.profile.stats.lastDailyWinDate === today;

    this.openModal('🎮 Modos de Jogo & Layouts', (container) => {
      const modeSection = document.createElement('div');
      modeSection.innerHTML = `<div class="section-title">Escolha o Modo de Jogo</div>`;
      const modeGrid = document.createElement('div');
      modeGrid.className = 'card-grid';

      for (const m of Object.values(GAME_MODES)) {
        const card = document.createElement('div');
        const isCurrent = g.mode === m.id;
        card.className = `option-card ${isCurrent ? 'selected' : ''}`;
        let extraTag = isCurrent ? 'Ativo' : 'Jogar';
        if (m.id === 'daily') {
          extraTag = dailyDoneToday ? `✅ Concluído (${today})` : `📅 ${today}`;
        }
        card.innerHTML = `
          <div>
            <div class="option-card-header">
              <span class="option-card-title">${m.icon} ${m.name}</span>
            </div>
            <p class="option-card-desc">${m.desc}</p>
          </div>
          <div class="option-card-footer">
            <span style="color: var(--accent)">${extraTag}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          g.switchMode(m.id);
          this.closeModal();
        });
        modeGrid.appendChild(card);
      }
      modeSection.appendChild(modeGrid);
      container.appendChild(modeSection);

      // Seção de Layouts Clássicos
      const layoutSection = document.createElement('div');
      layoutSection.innerHTML = `<div class="section-title">Formação do Tabuleiro (Layout)</div>`;
      const layoutGrid = document.createElement('div');
      layoutGrid.className = 'card-grid';

      for (const l of Object.values(BOARD_LAYOUTS)) {
        const card = document.createElement('div');
        const isCurrent = g.profile.selectedLayout === l.id;
        const wonThis = g.profile.stats.layoutsWon.includes(l.id);
        card.className = `option-card ${isCurrent ? 'selected' : ''}`;
        card.innerHTML = `
          <div>
            <div class="option-card-header">
              <span class="option-card-title">${l.icon} ${l.name}</span>
              ${wonThis ? '<span title="Layout já vencido!">🏅</span>' : ''}
            </div>
            <p class="option-card-desc">${l.desc}</p>
          </div>
          <div class="option-card-footer">
            <span style="color: ${isCurrent ? 'var(--accent)' : 'var(--text-muted)'}">
              ${isCurrent ? 'Selecionado' : 'Aplicar na nova mesa'}
            </span>
          </div>
        `;
        card.addEventListener('click', () => {
          g.setLayoutPreference(l.id);
          this.closeModal();
        });
        layoutGrid.appendChild(card);
      }
      layoutSection.appendChild(layoutGrid);
      container.appendChild(layoutSection);

      // Semente Personalizada
      const seedSection = document.createElement('div');
      seedSection.innerHTML = `
        <div class="section-title">Semente da Mesa (Compartilhar / Repetir Desafio)</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <input id="custom-seed-input" type="text" value="${g.currentSeed || ''}"
            placeholder="Digite qualquer código ou palavra..."
            style="flex:1; min-width:180px; padding:8px 12px; border-radius:8px; border:1px solid #475569; background:#0f172a; color:#fff; font-weight:600;" />
          <button id="apply-seed-btn" class="primary" type="button">🎲 Gerar com Semente</button>
        </div>
      `;
      container.appendChild(seedSection);
      const applyBtn = seedSection.querySelector('#apply-seed-btn');
      const seedInput = seedSection.querySelector('#custom-seed-input');
      applyBtn.addEventListener('click', () => {
        const val = seedInput.value.trim();
        if (val) {
          g.startCustomSeed(val);
          this.closeModal();
        }
      });
    });
  }

  openShopModal() {
    const g = this.game;

    const renderShop = (container) => {
      container.innerHTML = '';

      const balanceBar = document.createElement('div');
      balanceBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.8); padding:10px 16px; border-radius:12px; border:1px solid rgba(251,191,36,0.35);';
      balanceBar.innerHTML = `
        <span>Personalize sua mesa, peças e símbolos com as moedas conquistadas nas partidas.</span>
        <strong style="color:var(--gold); font-size:1.05rem;">🪙 ${g.profile.coins} Moedas</strong>
      `;
      container.appendChild(balanceBar);

      // 1. Temas de Mesa
      const themeSec = document.createElement('div');
      themeSec.innerHTML = `<div class="section-title">Temas de Mesa</div>`;
      const themeGrid = document.createElement('div');
      themeGrid.className = 'card-grid';

      for (const t of Object.values(TABLE_THEMES)) {
        const unlocked = g.profile.unlockedThemes.includes(t.id);
        const selected = g.profile.selectedTheme === t.id;
        const card = document.createElement('div');
        card.className = `option-card ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
        card.innerHTML = `
          <div>
            <div class="option-card-header">
              <span class="option-card-title">${t.name}</span>
              <div class="color-preview">
                <span class="color-dot" style="background:${t.bgStart}"></span>
                <span class="color-dot" style="background:${t.accent}"></span>
              </div>
            </div>
            <p class="option-card-desc">${t.desc}</p>
          </div>
          <div class="option-card-footer">
            <span style="color:${unlocked ? 'var(--accent)' : 'var(--gold)'}">
              ${selected ? '✓ Em uso' : (unlocked ? 'Usar Tema' : `🔓 Desbloquear (🪙 ${t.cost})`)}
            </span>
          </div>
        `;
        card.addEventListener('click', () => {
          if (g.buyOrSelectCosmetic('theme', t.id, t.cost)) {
            renderShop(container);
          }
        });
        themeGrid.appendChild(card);
      }
      themeSec.appendChild(themeGrid);
      container.appendChild(themeSec);

      // 2. Estilos de Peça
      const skinSec = document.createElement('div');
      skinSec.innerHTML = `<div class="section-title">Estilos de Peça (Skins)</div>`;
      const skinGrid = document.createElement('div');
      skinGrid.className = 'card-grid';

      for (const s of Object.values(TILE_SKINS)) {
        const unlocked = g.profile.unlockedSkins.includes(s.id);
        const selected = g.profile.selectedSkin === s.id;
        const card = document.createElement('div');
        card.className = `option-card ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
        card.innerHTML = `
          <div>
            <div class="option-card-header">
              <span class="option-card-title">${s.name}</span>
              <div class="color-preview">
                <span class="color-dot" style="background:${s.faceFree}"></span>
                <span class="color-dot" style="background:${s.sideColor}"></span>
              </div>
            </div>
            <p class="option-card-desc">${s.desc}</p>
          </div>
          <div class="option-card-footer">
            <span style="color:${unlocked ? 'var(--accent)' : 'var(--gold)'}">
              ${selected ? '✓ Em uso' : (unlocked ? 'Usar Estilo' : `🔓 Desbloquear (🪙 ${s.cost})`)}
            </span>
          </div>
        `;
        card.addEventListener('click', () => {
          if (g.buyOrSelectCosmetic('skin', s.id, s.cost)) {
            renderShop(container);
          }
        });
        skinGrid.appendChild(card);
      }
      skinSec.appendChild(skinGrid);
      container.appendChild(skinSec);

      // 3. Conjuntos de Símbolos
      const symSec = document.createElement('div');
      symSec.innerHTML = `<div class="section-title">Coleções de Símbolos</div>`;
      const symGrid = document.createElement('div');
      symGrid.className = 'card-grid';

      for (const symSet of Object.values(SYMBOL_SETS)) {
        const unlocked = g.profile.unlockedSymbolSets.includes(symSet.id);
        const selected = g.profile.selectedSymbolSet === symSet.id;
        const previewIcons = symSet.symbols.slice(0, 5).join(' ');
        const card = document.createElement('div');
        card.className = `option-card ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
        card.innerHTML = `
          <div>
            <div class="option-card-header">
              <span class="option-card-title">${symSet.name}</span>
            </div>
            <div style="font-size:1.15rem; margin:4px 0;">${previewIcons}</div>
            <p class="option-card-desc">${symSet.desc}</p>
          </div>
          <div class="option-card-footer">
            <span style="color:${unlocked ? 'var(--accent)' : 'var(--gold)'}">
              ${selected ? '✓ Em uso' : (unlocked ? 'Ativar Coleção' : `🔓 Desbloquear (🪙 ${symSet.cost})`)}
            </span>
          </div>
        `;
        card.addEventListener('click', () => {
          if (g.buyOrSelectCosmetic('symbolSet', symSet.id, symSet.cost)) {
            renderShop(container);
          }
        });
        symGrid.appendChild(card);
      }
      symSec.appendChild(symGrid);
      container.appendChild(symSec);

      // 4. Recarga de Power-ups
      const pwrSec = document.createElement('div');
      pwrSec.innerHTML = `<div class="section-title">Recarregar Power-ups Táticos</div>`;
      const pwrGrid = document.createElement('div');
      pwrGrid.className = 'card-grid';

      for (const p of Object.values(POWERUPS)) {
        const count = g.profile.powerups[p.id] || 0;
        const card = document.createElement('div');
        card.className = 'option-card';
        card.innerHTML = `
          <div>
            <div class="option-card-header">
              <span class="option-card-title">${p.icon} ${p.name}</span>
              <span class="powerup-badge">${count}x</span>
            </div>
            <p class="option-card-desc">${p.desc}</p>
          </div>
          <div class="option-card-footer">
            <span style="color:var(--gold)">+1 Carga (🪙 ${p.coinCost})</span>
          </div>
        `;
        card.addEventListener('click', () => {
          if (g.buyPowerupCharge(p.id)) {
            renderShop(container);
          }
        });
        pwrGrid.appendChild(card);
      }
      pwrSec.appendChild(pwrGrid);
      container.appendChild(pwrSec);
    };

    this.openModal('🎨 Loja Imperial & Personalização', renderShop);
  }

  openAchievementsModal() {
    const g = this.game;
    const unlockedCount = g.profile.achievements.length;

    this.openModal(`🏆 Conquistas (${unlockedCount}/${ACHIEVEMENTS.length})`, (container) => {
      const list = document.createElement('div');
      list.className = 'ach-list';

      for (const ach of ACHIEVEMENTS) {
        const isUnlocked = g.profile.achievements.includes(ach.id);
        const item = document.createElement('div');
        item.className = `ach-item ${isUnlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
          <div class="ach-item-icon">${ach.icon}</div>
          <div class="ach-item-info">
            <div class="ach-item-title">${ach.title}</div>
            <div class="ach-item-desc">${ach.desc}</div>
            <div class="ach-reward">${isUnlocked ? '✓ Desbloqueada' : `Recompensa: 🪙 +${ach.reward}`}</div>
          </div>
        `;
        list.appendChild(item);
      }
      container.appendChild(list);
    });
  }

  openStatsModal() {
    const g = this.game;
    const s = g.profile.stats;
    const lvlInfo = getPlayerLevelInfo(g.profile.xp);
    const pct = Math.min(100, Math.round((lvlInfo.currentXp / lvlInfo.neededXp) * 100));

    this.openModal('📊 Perfil & Estatísticas', (container) => {
      const rankBox = document.createElement('div');
      rankBox.style.cssText = 'background:rgba(15,23,42,0.8); padding:16px; border-radius:14px; border:1px solid rgba(139,92,246,0.35);';
      rankBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div>
            <span style="font-size:0.78rem; color:#c4b5fd; text-transform:uppercase; font-weight:700;">Título Atual</span>
            <h3 style="font-size:1.2rem;">⭐ Nível ${lvlInfo.level}: ${lvlInfo.rankTitle}</h3>
          </div>
          <div style="text-align:right;">
            <strong style="color:var(--gold)">🪙 ${g.profile.coins} Moedas</strong>
            <div style="font-size:0.78rem; color:var(--text-muted);">${lvlInfo.currentXp} / ${lvlInfo.neededXp} XP para o Nível ${lvlInfo.level + 1}</div>
          </div>
        </div>
        <div style="height:8px; background:#0f172a; border-radius:999px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, #8b5cf6, #10b981);"></div>
        </div>
      `;
      container.appendChild(rankBox);

      const grid = document.createElement('div');
      grid.className = 'stats-grid';
      const metrics = [
        { label: 'Pares Combinados', val: s.pairsMatched },
        { label: 'Fases Concluídas', val: s.levelsCompleted },
        { label: 'Maior Fase (Infinito)', val: s.highestLevel },
        { label: 'Recorde Infinito', val: s.highScoreInfinite },
        { label: 'Recorde Contra o Relógio', val: s.highScoreTimeAttack },
        { label: 'Combo Máximo', val: `x${s.bestCombo}` },
        { label: 'Fase Mais Rápida', val: s.fastestWinSeconds ? `${s.fastestWinSeconds}s` : '-' },
        { label: 'Sequência Diária', val: `${s.dailyStreak} 🔥` },
        { label: 'Desafios Diários', val: s.dailyWins },
        { label: 'Fases no Modo Zen', val: s.zenLevelsWon },
        { label: 'Layouts Clássicos Vencidos', val: `${s.layoutsWon.length}/5` },
        { label: 'Total de Moedas Ganhas', val: g.profile.totalCoinsEarned }
      ];

      for (const m of metrics) {
        const card = document.createElement('div');
        card.className = 'stat-metric-card';
        card.innerHTML = `
          <div class="stat-metric-val">${m.val}</div>
          <div class="stat-metric-label">${m.label}</div>
        `;
        grid.appendChild(card);
      }
      container.appendChild(grid);
    });
  }
}

