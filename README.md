# Infinite Mahjong Solitaire

Jogo de Mahjong Solitaire para navegador, escrito em **HTML, CSS e JavaScript puro**, sem dependências externas nem processo de compilação.

## Jogar

Abra `index.html` em um navegador moderno. Alternativamente, execute um servidor estático:

```bash
python3 -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

O jogo salva automaticamente o progresso no armazenamento local do navegador (`localStorage`). O salvamento não é sincronizado entre dispositivos.

## Como jogar

Selecione duas peças **livres** de mesmo símbolo para removê-las. Uma peça é considerada livre quando não está coberta pela camada imediatamente superior e tem ao menos um dos lados horizontais desbloqueado. Complete todas as peças para avançar de fase.

Os controles disponíveis são **Dica** (-20 pontos), **Embaralhar** (-50 pontos), **Pular Fase** (sem custo) e **Reiniciar** (apaga o progresso após confirmação). Quando não houver par disponível, o jogo tenta reorganizar o tabuleiro automaticamente, sem penalidade.

## Recursos

- Fases geradas proceduralmente, com quantidade de peças crescente (até 72 pares).
- Pontuação por pares, profundidade das peças e sequência de combos (até x10).
- Sons sintetizados via Web Audio API; animações e efeitos no Canvas 2D.
- Salvamento automático local com recuperação após atualizar a página.
- Interface em português.

## Estrutura

```text
index.html                 Código original completo do jogo
README.md                  Introdução e instruções de execução
CHANGELOG.md               Histórico das versões
CONTRIBUTING.md            Orientações para contribuições
.gitignore                 Arquivos ignorados pelo Git
docs/ARQUITETURA.md        Componentes e fluxos internos
docs/REGRAS.md             Regras e pontuação
docs/ROADMAP.md            Melhorias propostas e limitações atuais
.github/workflows/         Verificação estática no GitHub Actions
```

## Publicar no GitHub Pages

Em **Settings → Pages**, selecione **Deploy from a branch**, `main` e `/ (root)`. Como o ponto de entrada é `index.html`, não é necessário build.

## Estado do projeto

A versão inicial preserva o arquivo HTML recebido, sem refatorações ou mudanças de comportamento. Consulte [arquitetura](docs/ARQUITETURA.md), [regras](docs/REGRAS.md) e [roadmap](docs/ROADMAP.md). O jogo não dispõe de suíte de testes automatizados de gameplay; uma verificação sintática de JavaScript está configurada para GitHub Actions.

## Licença

**Não definida.** Antes de distribuir ou aceitar contribuições externas, escolha uma licença e confirme a titularidade e os direitos sobre o código e os elementos visuais.