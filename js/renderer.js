// Motor de renderização em Canvas 2D: temas, skins, peças especiais (Coringa, Mistério, Acorrentada, Bônus), partículas e ondas de choque.

import { TABLE_THEMES, TILE_SKINS, WILDCARD_SYMBOL } from './data.js';
import { isTileFree, canTilesMatch } from './board.js';

export class BoardRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  drawRoundedRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, r);
    this.ctx.closePath();
  }

  render(game, dt, now) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    const theme = TABLE_THEMES[game.profile.selectedTheme] || TABLE_THEMES.sapphire;
    const skin = TILE_SKINS[game.profile.selectedSkin] || TILE_SKINS.ivory;

    ctx.clearRect(0, 0, width, height);

    // Grade decorativa sutil do tema
    ctx.save();
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    const step = 48;
    for (let gx = (game.panX % step); gx < width; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = (game.panY % step); gy < height; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    if (game.screenShake > 0) {
      const mag = game.screenShake * 0.6;
      const sx = (Math.random() - 0.5) * mag;
      const sy = (Math.random() - 0.5) * mag;
      ctx.translate(sx, sy);
      game.screenShake = Math.max(0, game.screenShake - dt * 0.04);
    }

    const torchActive = game.torchTimer > 0;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.007);

    // Peças livres desbloqueadas para destaque da Tocha
    const freeUnlocked = game.tiles.filter(t => !t.removed && !t.locked && isTileFree(t, game.tiles));

    for (const tile of game.tiles) {
      if (tile.removed) continue;

      const isFree = isTileFree(tile, game.tiles);
      const isSelectable = isFree && !tile.locked;
      const isSelected = game.selectedTile && game.selectedTile.id === tile.id;
      const isHovered = game.hoveredTile && game.hoveredTile.id === tile.id;
      const isHinted = game.hintPair.some(h => h.id === tile.id);
      const isWild = tile.symbol === WILDCARD_SYMBOL || tile.special === 'wildcard';
      const isMysteryHidden = Boolean(tile.mystery && !isFree && !torchActive);

      const hasMatchNow = torchActive && isSelectable && freeUnlocked.some(
        other => other.id !== tile.id && canTilesMatch(tile, other)
      );

      let shakeOffset = 0;
      if (tile.shake > 0) {
        shakeOffset = Math.sin(tile.shake * 1.5) * 4;
        tile.shake = Math.max(0, tile.shake - 1);
      }

      const lift = (isSelected ? -4 : (isHovered && isSelectable ? -2.5 : 0));
      const r = game.getTileScreenRect(tile);
      const x = r.x + shakeOffset;
      const y = r.y + lift;
      const cornerRadius = Math.max(4, 8 * (r.w / 54));

      // Sombra projetada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      this.drawRoundedRect(x + 7 * (r.w / 54), y + 9 * (r.h / 72) - lift * 0.5, r.w, r.h, cornerRadius);
      ctx.fill();

      // Lateral 3D da peça
      ctx.fillStyle = isWild
        ? '#b45309'
        : (isSelected ? skin.sideSelected : skin.sideColor);
      this.drawRoundedRect(x + 3.5 * (r.w / 54), y + 4.5 * (r.h / 72), r.w, r.h, cornerRadius);
      ctx.fill();

      // Face principal
      if (isSelected) {
        ctx.fillStyle = skin.faceSelected;
      } else if (isHinted) {
        ctx.fillStyle = skin.faceHint;
      } else if (isWild && isSelectable) {
        ctx.fillStyle = '#fef3c7';
      } else if (isMysteryHidden) {
        ctx.fillStyle = '#312e81';
      } else if (isSelectable) {
        ctx.fillStyle = skin.faceFree;
      } else {
        ctx.fillStyle = skin.faceBlocked;
      }

      this.drawRoundedRect(x, y, r.w, r.h, cornerRadius);
      ctx.fill();

      // Borda da peça
      if (isSelected) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = skin.borderSelected;
      } else if (isHinted) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#10b981';
      } else if (isWild) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(251, 191, 36, ${0.65 + pulse * 0.35})`;
      } else if (tile.locked) {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#64748b';
      } else if (hasMatchNow) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(251, 191, 36, ${0.55 + pulse * 0.45})`;
      } else if (isHovered && isSelectable) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.accent;
      } else {
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = skin.borderFree;
      }
      ctx.stroke();

      // Símbolo central (ou ❓ se for Peça Mistério oculta)
      const displaySymbol = isMysteryHidden ? '❓' : tile.symbol;
      ctx.font = `${Math.max(8, 30 * (r.w / 54))}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = isSelectable ? 1.0 : (torchActive ? 0.3 : 0.48);
      ctx.fillText(displaySymbol, x + r.w / 2, y + r.h / 2 + 2);
      ctx.globalAlpha = 1.0;

      // Correntes metálicas sobre peças trancadas
      if (tile.locked) {
        ctx.save();
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.85)';
        ctx.lineWidth = Math.max(2, 3 * (r.w / 54));
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + r.w - 4, y + r.h - 4);
        ctx.moveTo(x + r.w - 4, y + 4);
        ctx.lineTo(x + 4, y + r.h - 4);
        ctx.stroke();
        ctx.restore();

        ctx.font = `${Math.max(8, 13 * (r.w / 54))}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.fillText('⛓️', x + r.w - 11 * (r.w / 54), y + r.h - 11 * (r.h / 72));
      }

      // Emblema de Moeda Bônus
      if (tile.bonus === 'coin' && !isMysteryHidden) {
        ctx.font = `${Math.max(7, 11 * (r.w / 54))}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.fillText('🪙', x + 11 * (r.w / 54), y + r.h - 10 * (r.h / 72));
      }

      // Indicador de camada (L2, L3...)
      if (tile.z > 0) {
        ctx.fillStyle = isSelectable ? skin.textColor : '#64748b';
        ctx.globalAlpha = isSelectable ? 0.72 : 0.45;
        ctx.font = `bold ${Math.max(7, 10 * (r.w / 54))}px system-ui, sans-serif`;
        ctx.fillText(`L${tile.z + 1}`, x + r.w - 11 * (r.w / 54), y + 11 * (r.h / 72));
        ctx.globalAlpha = 1.0;
      }

      // Marcador da Tocha para pares prontos
      if (hasMatchNow) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + 10 * (r.w / 54), y + 10 * (r.h / 72), Math.max(3, 4.5 * (r.w / 54)), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Anéis de onda de choque
    for (let i = game.rings.length - 1; i >= 0; i--) {
      const ring = game.rings[i];
      ring.radius += dt * 0.14;
      ring.life -= dt * 0.0028;
      if (ring.life <= 0) {
        game.rings.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = Math.max(0, ring.life);
      ctx.lineWidth = 3 * ring.life;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Partículas
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= 0.035;
      if (p.life <= 0) {
        game.particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.size || 4) * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Textos flutuantes
    for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
      const ft = game.floatingTexts[i];
      ft.y -= 1.25;
      ft.life -= 0.024;
      if (ft.life <= 0) {
        game.floatingTexts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.font = '800 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    if (game.freezeTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
      ctx.restore();
    }

    ctx.restore();
  }
}
