# Arquitetura técnica

O Infinite Mahjong é uma aplicação de página única, sem dependências externas, organizada originalmente em `index.html`.

## Componentes

- **HTML/CSS:** cabeçalho, placar, controles e área de jogo.
- **Canvas 2D:** renderização das peças, seleção, partículas e mensagens.
- **SoundManager:** efeitos sonoros com Web Audio API.
- **InfiniteMahjong:** ciclo de jogo, geração de tabuleiro, regras, pontuação e persistência.
- **localStorage:** salva automaticamente fase, pontuação e peças usando `infinite_mahjong_save_v1`.

## Fluxo

1. Inicialização tenta restaurar a partida.
2. `startLevel()` gera posições e distribui símbolos.
3. `isTileFree()` verifica bloqueios laterais e superiores.
4. `handleClick()` seleciona pares livres do mesmo símbolo.
5. `updateUI()` recalcula movimentos e salva o progresso.
6. `loop()` desenha quadros e animações continuamente.

## Limitações atuais

O código concentra todas as responsabilidades em um arquivo. O gerador usa aleatoriedade não reproduzível e ainda não há teste formal garantindo solução de todas as distribuições. O dimensionamento do Canvas e as dimensões fixas das peças podem prejudicar tabuleiros grandes ou telas pequenas. Consulte [ROADMAP](ROADMAP.md).