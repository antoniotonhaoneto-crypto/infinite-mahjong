# Arquitetura técnica

O Infinite Mahjong é uma aplicação web progressiva (PWA) sem dependências externas, estruturada em módulos ES nativos (`js/*.js`) e folha de estilo dedicada (`css/styles.css`).

## Componentes principais

- **`index.html` e `css/styles.css`:** estrutura semântica, barra superior de status, barra inferior de power-ups táticos, inspetor flutuante de peças e janelas modais.
- **`js/prng.js`:** gerador pseudoaleatório determinístico (`Mulberry32`) para sementes reproduzíveis e Desafio Diário.
- **`js/board.js`:** algoritmos de geometria para 5 layouts clássicos (*Tartaruga*, *Dragão*, *Fortaleza*, *Pirâmide* e *Borboleta*), verificação de peças livres (`isTileFree`) e construção reversa solucionável (`buildSolvableBoard`).
- **`js/renderer.js`:** motor de renderização Canvas 2D com suporte a Temas de Mesa, Skins de Peças, efeitos visuais de Tocha e Congelamento, anéis de onda de choque, partículas com gravidade e textos flutuantes.
- **`js/game.js`:** controlador `InfiniteMahjong` responsável pelo ciclo de partida, 4 modos de jogo, execução dos 7 power-ups, controle de Zoom/Pan e verificação de conquistas.
- **`js/ui.js`:** renderização dinâmica dos modais de Modos/Layouts, Loja Imperial, Conquistas e Estatísticas.
- **`js/state.js`:** camada de persistência e validação de esquema no `localStorage`, mantendo o perfil global (`infinite_mahjong_profile_v2`), sessões independentes por modo e compatibilidade com `infinite_mahjong_save_v1`.
- **`js/sound.js`:** sintetizador Web Audio API com controle de mudo persistente e vibração háptica.
- **`tests/game.test.mjs`:** testes unitários automatizados executados via `node --test`.