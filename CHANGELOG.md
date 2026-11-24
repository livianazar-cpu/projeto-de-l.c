# Changelog — Coin Rush

## v1.1 — Parte 2: Testes, Correção de Bugs e Documentação

###  Bugs corrigidos (encontrados no protótipo da Parte 1)

#### 1. Inimigos podiam ser pisados incorretamente em colisões múltiplas
- **Descrição:** se o jogador caísse sobre dois inimigos sobrepostos, o `stomp` era calculado com base na posição anterior (`playerBottomPrev`), mas o segundo inimigo podia ser processado no mesmo frame com `player.vy` já zerado, causando dano indevido ao jogador.
- **Solução:** o cálculo do stomp agora verifica `player.vy > 0` **e** `playerBottomPrev <= e.y + 12` antes de matar o inimigo, e o laço pula inimigos já mortos (`if (!e.alive) continue`).
- **Arquivos afetados:** função `updateEnemies()`.

#### 2. Crash potencial no overlay de vitória
- **Descrição:** `drawOverlay('won', ...)` acessava `bonusInfo.timeBonus` diretamente. Se `bonusInfo` fosse `null` (vitória forçada em debug ou estado inconsistente), ocorria `TypeError` e o jogo congelava.
- **Solução:** fallback defensivo `const bi = bonusInfo || { timeBonus: 0, lifeBonus: 0 };`.
- **Arquivos afetados:** função `draw()`.

#### 3. Animações não reiniciavam entre partidas
- **Descrição:** `timeSinceStart` nunca era resetado em `resetGame()`. Estrelas, spin das moedas e bob dos aliens continuavam de onde pararam, quebrando a sensação de "novo jogo".
- **Solução:** `timeSinceStart = 0` adicionado em `resetGame()`. Também foi criado o parâmetro `fullReset` para diferenciar reinício completo (ENTER) de reinício do checkpoint (R).
- **Arquivos afetados:** função `resetGame()`.

---

###  Implementações e melhorias da Parte 2

- **Transição lógica entre fases:** constante `TOTAL_LEVELS = 3`, variável `currentLevel` e avanço de fase ao pressionar ENTER no estado `won`. Na última fase, exibe "VOCÊ ZEROU O JOGO!".
- **`resetGame(fullReset)`:** diferencia reinício completo (ENTER) de reinício do checkpoint (R).
- **Colisão horizontal em duas passadas:** robustez para plataformas sobrepostas (evita que o jogador "grude" em plataformas vizinhas).
- **`R` reinicia do checkpoint:** não do início da fase.
- **Overlay de menu/vitória mostra a fase atual:** "Fase X de 3".
- **README técnico:** adicionado com história, regras, controles, mapeamento de lógica (variáveis, condicionais, laços) e instruções de execução.

---

## v1.0 — Parte 1: Protótipo

- Fase 1 jogável com física de pulo (coyote time, jump buffer, pulo variável).
- Coleta de moedas, inimigos patrulhadores, sistema de vidas e tempo.
- Checkpoint, HUD e efeitos visuais.
