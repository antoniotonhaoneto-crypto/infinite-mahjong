# Changelog

## [2.0.0] - 2026-10-18

### Adicionado

- Arquitetura modularizada em ES Modules (`js/main.js`, `js/game.js`, `js/board.js`, `js/renderer.js`, `js/ui.js`, `js/state.js`, `js/data.js`, `js/prng.js`, `js/sound.js`, `js/pwa.js`) e folha de estilos `css/styles.css`.
- 4 modos de jogo: **Modo Infinito**, **Desafio Diário** (semente determinística por data), **Contra o Relógio** e **Modo Zen**.
- 5 layouts clássicos: **Tartaruga Imperial**, **Dragão Sinuoso**, **Fortaleza Real**, **Pirâmide Escalonada** e **Asas de Borboleta**, além de suporte a sementes personalizadas.
- Barra tática com 7 power-ups e atalhos de teclado: **Desfazer (`Z`)**, **Dica (`H`)**, **Tocha Raio-X (`T`)**, **Congelar Combo (`F`)**, **Ímã de Par (`M`)**, **Bomba Tripla (`B`)** e **Embaralhar (`S`)**.
- Sistema de Metagame com Moedas, XP, Patentes de Jogador, **Loja Imperial** (5 temas de mesa, 5 skins de peça e 4 coleções de símbolos), **16 Conquistas** e painel de **Estatísticas**.
- Inspetor ao vivo de peças no HUD, controles de Zoom/Pan, ondas de choque no Canvas, botão de silenciar áudio e suíte de testes unitários automatizados (`tests/game.test.mjs`).
