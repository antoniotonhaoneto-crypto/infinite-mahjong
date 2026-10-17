# Roadmap

As propostas abaixo **não estão implementadas**.

## Alta prioridade

- [ ] Separar CSS e JavaScript em módulos testáveis.
- [ ] Testar regras de peças livres, geração, embaralhamento e salvamento.
- [ ] Garantir tabuleiros solucionáveis com algoritmo verificável.
- [ ] Adaptar escala e posicionamento a telas pequenas.
- [ ] Validar integralmente dados recuperados de localStorage.
- [ ] Evitar callbacks atrasados alterarem fases posteriores.

## Média prioridade

- [ ] Teclado, leitores de tela e acessibilidade.
- [ ] Alternar/mutar sons e salvar preferências.
- [ ] Testes end-to-end desktop e mobile.
- [ ] Sementes reproduzíveis e compartilhamento de tabuleiros.
- [ ] Histórico de partidas e estatísticas.

## Notas

A contagem de movimentos na interface é de pares disponíveis, não cliques totais. `generateGeometry()` recebe um argumento denominado `seed`, mas a geração ainda usa `Math.random()`.