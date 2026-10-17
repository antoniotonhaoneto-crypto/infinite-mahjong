# Regras e pontuação

## Objetivo

Remover todas as peças selecionando pares de símbolos iguais.

## Peças disponíveis

Uma peça precisa estar presente, sem bloqueio imediatamente acima, e ter pelo menos um lado horizontal livre. Peças bloqueadas aparecem esmaecidas.

## Progressão

- Pares por fase: `min(72, 6 + floor(fase × 2))`.
- Símbolos distintos: `min(36, 4 + floor(fase × 0.8))`.
- Camadas máximas: `min(6, 2 + floor(fase / 3))`.

## Pontuação

- Base: `25 + 5 × max(camada z do par)`.
- Pontos recebidos: base multiplicada pelo combo, até x10.
- Janela do combo: `max(2200, 5000 - combo × 280)` milissegundos.
- Conclusão da fase: bônus de `fase × 100`.
- Dica: custa 20 pontos (mínimo 0).
- Embaralhar: custa 50 pontos (mínimo 0).
- Pular fase: sem penalidade atualmente.
- Reorganização automática sem movimentos: gratuita.

## Salvamento

A fase, a pontuação e o estado das peças são salvos localmente no navegador. Reiniciar apaga o progresso.