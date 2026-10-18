# Infinite Mahjong Solitaire

Jogo completo de Mahjong Solitaire para navegador e PWA, escrito em **HTML, CSS e JavaScript modular (ES Modules)**, sem dependências externas nem necessidade de build.

## Jogar localmente

Como o projeto utiliza módulos nativos (`<script type="module">`), sirva a pasta com qualquer servidor HTTP estático:

```bash
python3 -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

## Modos de Jogo e Layouts Clássicos

- **Modo Infinito:** campanha progressiva infinita com aumento gradual de peças, símbolos e camadas.
- **Desafio Diário:** utiliza a data do dia como semente determinística (`Mulberry32`). Todos jogam exatamente a mesma mesa no dia, com contagem de ofensiva diária (Streak) e recompensa dobrada de moedas.
- **Contra o Relógio (Time Attack):** partida de alta velocidade com 150 segundos iniciais. Cada par combinado adiciona `+2s` (`+4s` em combos altos) e concluir a fase adiciona `+25s`.
- **Modo Zen:** experiência relaxante sem pressão de tempo, sem perda de pontos e com usos ilimitados de Desfazer, Dica e Embaralhar.
- **5 Formações Clássicas:** Tartaruga Imperial, Dragão Sinuoso, Fortaleza Real, Pirâmide Escalonada e Asas de Borboleta, além do modo Automático e geração por Semente personalizada.

## Power-ups e Controles Táticos

Disponíveis na barra inferior e por atalhos de teclado:

- **Desfazer (`Z` ou `U`):** restaura o último par removido ao tabuleiro.
- **Dica (`H`):** destaca um par disponível na mesa.
- **Tocha Raio-X (`T`):** ilumina todas as peças livres por 12 segundos, marca pares prontos e escurece peças bloqueadas.
- **Congelar (`F`):** congela a barra de tempo do Combo por 15 segundos.
- **Ímã de Par (`M`):** atrai e combina automaticamente um par disponível priorizando o topo da pilha.
- **Bomba Tripla (`B`):** detona até 3 pares livres em reação em cadeia.
- **Embaralhar (`S`):** reorganiza os símbolos restantes garantindo jogadas disponíveis.

## Metagame, Loja e Conquistas

- **Moedas e Nível de Perfil (XP):** ganhe moedas e experiência a cada combinação e conclusão de fase para subir de patente (de *Aprendiz* até *Lenda do Mahjong*).
- **Loja Imperial:** desbloqueie 5 Temas de Mesa (*Noite de Safira*, *Jade Imperial*, *Templo de Kyoto*, *Jardim de Sakura*, *Cyber Neon*), 5 Estilos de Peça (*Marfim Clássico*, *Obsidiana Dourada*, *Porcelana Ming*, *Bambu Artesanal*, *Cristal de Quartzo*) e 4 Coleções de Símbolos.
- **Conquistas e Estatísticas:** 16 troféus desbloqueáveis com recompensas em moedas e painel completo de recordes por modo.
- **Interatividade no Tabuleiro:** inspetor ao vivo de peças (mostra quantas peças iguais restam e quantas estão livres), controle de Zoom e Pan (arraste com botão direito ou Shift+arraste) e áudio Web Audio API com botão de silenciar (`🔊 / 🔇`).

## Estrutura do Projeto

```text
index.html                 Interface principal, HUD e modais
css/styles.css             Estilos responsivos, temas e animações
js/main.js                 Ponto de entrada da aplicação
js/game.js                 Ciclo de jogo, modos, power-ups e eventos
js/board.js                Layouts clássicos, regras de peça livre e gerador solucionável
js/renderer.js             Renderizador Canvas 2D, skins, partículas e ondas de choque
js/ui.js                   Modais interativos (Modos, Loja, Conquistas e Perfil)
js/state.js                Persistência e validação de perfil e sessões no localStorage
js/data.js                 Catálogo de temas, skins, símbolos, power-ups e conquistas
js/prng.js                 Gerador pseudoaleatório determinístico (Mulberry32)
js/sound.js                Sintetizador Web Audio API e vibração háptica
js/pwa.js                  Instalação como aplicativo e registro do Service Worker
tests/game.test.mjs        Suíte de testes automatizados (Node.js test runner)
```

## Executar testes automatizados

```bash
node --test tests/game.test.mjs
```
