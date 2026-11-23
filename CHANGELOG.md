# Changelog — Coin Rush

## v1.1 — Parte 2: Testes, Correção de Bugs e Documentação

### 🐛 Bugs corrigidos

#### 1. Ausência de transição entre fases
- **Descrição:** ao atingir o portal, o jogo exibia o overlay "PORTAL ATINGIDO!" e travava. Não havia lógica para carregar a próxima fase.
- **Solução:** adicionadas a constante `TOTAL_LEVELS = 3` e a variável `currentLevel`. Ao pressionar ENTER no estado `won`, o jogo incrementa a fase, chama `resetGame(false)` (mantendo vidas e pontos) e volta a `playing`. Na última fase, exibe "VOCÊ ZEROU O JOGO!".
- **Arquivos afetados:** bloco `keydown` e função `draw()`.

#### 2. Crash potencial no overlay de vitória
- **Descrição:** o overlay de vitória acessava `bonusInfo.timeBonus` diretamente. Se `bonusInfo` fosse `null`, ocorria um `TypeError`.
- **Solução:** fallback defensivo `const bi = bonusInfo || { timeBonus: 0, lifeBonus: 0 };`.
- **Arquivos afetados:** função `draw()`.

#### 3. Animações não reiniciavam entre partidas
- **Descrição:** `timeSinceStart` nunca era resetado em `resetGame()`, então estrelas, spin das moedas e bob dos aliens continuavam de onde pararam.
- **Solução:** `timeSinceStart = 0` adicionado em `resetGame()`. Também foi criado o parâmetro `fullReset` para diferenciar reinício completo (ENTER) de reinício do checkpoint (R).
- **Arquivos afetados:** função `resetGame()`.

### ✨ Melhorias adicionais
- Colisão horizontal em duas passadas (robustez para plataformas sobrepostas).
- `R` agora reinicia do checkpoint, não do início da fase.
- Overlay de menu/vitória mostra a fase atual (`Fase X de 3`).

---

## v1.0 — Parte 1: Protótipo
- Fase 1 jogável com física de pulo (coyote time, jump buffer, pulo variável).
- Coleta de moedas, inimigos patrulhadores, sistema de vidas e tempo.
- Checkpoint, HUD e efeitos visuais.