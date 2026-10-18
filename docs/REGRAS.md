# Regras, modos e pontuação

## Objetivo

Remover todas as peças do tabuleiro selecionando pares de símbolos idênticos.

## Peças livres

Uma peça está livre quando não possui nenhuma peça imediatamente acima (`z + 1` sobrepondo em `x, y`) e tem pelo menos um dos lados horizontais (`x - 2` ou `x + 2` na mesma camada `z`) desbloqueado.

## Modos de Jogo

1. **Modo Infinito:** progressão contínua de fases, com até 72 pares, 36 símbolos e 6 camadas.
2. **Desafio Diário:** tabuleiro determinístico baseado na data atual (`YYYY-MM-DD`), garantindo a mesma mesa para todos os jogadores no dia e bônus extra de moedas.
3. **Contra o Relógio:** inicia com 150 segundos. Cada combinação adiciona `+2s` (`+4s` se o Combo for `>= x5`) e concluir a fase adiciona `+25s`.
4. **Modo Zen:** sem limite de tempo, sem perda de pontos e com usos livres de Desfazer, Dica e Embaralhar.

## Power-ups Táticos

- **Desfazer (`Z`):** devolve o último par removido ao tabuleiro.
- **Dica (`H`):** destaca um par livre disponível.
- **Tocha Raio-X (`T`):** destaca todas as peças livres e marca pares prontos por 12 segundos.
- **Congelar (`F`):** congela o tempo da barra de Combo por 15 segundos.
- **Ímã de Par (`M`):** remove automaticamente um par livre priorizando as camadas mais altas.
- **Bomba Tripla (`B`):** detona até 3 pares livres consecutivos.
- **Embaralhar (`S`):** redistribui os símbolos restantes de forma solucionável.

## Pontuação e Economia

- **Base por par:** `25 + 5 × max(camada z do par)`, multiplicada pelo nível de Combo (até `x10`).
- **Conclusão de fase:** bônus de `fase × 100` pontos, além de Moedas e XP proporcionais à fase.
- **Moedas e XP:** usados para subir de patente e desbloquear Temas de Mesa, Estilos de Peça, Coleções de Símbolos e cargas de power-ups na Loja Imperial.