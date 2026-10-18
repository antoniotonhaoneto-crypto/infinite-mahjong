# Roadmap

## Concluído na v2.0

- [x] Separar CSS e JavaScript em módulos ES testáveis (`css/`, `js/`).
- [x] Testar regras de peças livres, geração, embaralhamento e salvamento (`tests/game.test.mjs`).
- [x] Garantir tabuleiros solucionáveis e determinísticos com gerador `Mulberry32` (`js/prng.js` e `js/board.js`).
- [x] Adaptar escala, Zoom e Pan do tabuleiro para telas pequenas e grandes.
- [x] Validar integralmente dados recuperados de `localStorage` (`js/state.js`).
- [x] Evitar que callbacks atrasados alterem fases posteriores (`boardGeneration`).
- [x] Alternar/silenciar sons e salvar preferências no perfil.
- [x] Sementes reproduzíveis, Desafio Diário e 5 layouts clássicos.
- [x] Histórico de estatísticas, patentes de XP, 16 conquistas e Loja de Temas/Skins.
- [x] Power-ups táticos (Desfazer, Tocha Raio-X, Congelar Combo, Ímã de Par e Bomba Tripla) com atalhos de teclado.

## Próximos passos futuros

- [ ] Placar online opcional para o Desafio Diário.
- [ ] Criador visual de layouts personalizados pelo jogador.