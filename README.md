# 🪙 Coin Rush — Edição Galáxia

Jogo de plataforma 2D em HTML5 Canvas + JavaScript puro, estrelado por uma boneca de cabelos loiros e vestido azul em uma jornada por três nebulosas.

**Autor:** Livia Nazar  
**Versão:** 1.1 (Parte 2 — Testes, Correção de Bugs e Documentação)  
**Tecnologias:** HTML5 Canvas, JavaScript ES2020, CSS custom properties

---

## 📖 História

A pequena **Luna**, uma boneca de cabelos dourados e vestido azul, acordou sozinha em uma estação espacial abandonada. Para voltar para casa, ela precisa atravessar **três nebulosas**, coletando **estrelas douradas**, derrotando **aliens gelatinosos** e encontrando o **portal de salto** ao final de cada fase.

---

## 🎮 Regras do Jogo

- **Objetivo:** chegar ao portal ao final de cada fase.
- **Estrelas douradas:** cada uma vale **+10 pontos**.
- **Aliens:** pisar neles vale **+100 pontos**; tocá-los de lado custa **1 vida**.
- **Vidas:** você começa com **3 vidas**. Perder todas = Game Over.
- **Tempo:** cada fase tem **120 segundos**. Acabou o tempo = Game Over.
- **Checkpoint:** ao cruzar a metade da fase, você renasce ali se cair.
- **Bônus de fim de fase:** `tempo restante × 5` + `vidas restantes × 100`.
- **Cair no vazio** custa 1 vida (respawn no último checkpoint).

---

## 🕹️ Controles

| Ação | Teclado | Toque |
|------|---------|-------|
| Mover para a esquerda | `←` ou `A` | Botão ◀ |
| Mover para a direita | `→` ou `D` | Botão ▶ |
| Pular | `Espaço`, `↑` ou `W` | Botão PULAR |
| Reiniciar (checkpoint) | `R` | — |
| Começar / Avançar fase | `Enter` ou `Espaço` | — |

**Dicas de física:**
- **Coyote Time (0,10 s):** ainda é possível pular por um instante após sair da borda.
- **Jump Buffer (0,12 s):** o pulo apertado pouco antes de tocar o chão é guardado.
- **Pulo variável:** solte a tecla no meio do pulo para cortar a altura.

---

## 🧠 Mapeamento da Lógica

### 🔢 Variáveis principais
| Variável | Tipo | Função |
|----------|------|--------|
| `player` | objeto | Posição, velocidade, estado do jogador |
| `solids` | array | Chão + plataformas com colisão |
| `coins` | array | Estrelas coletáveis |
| `enemies` | array | Aliens patrulhadores |
| `state` | string | `menu` \| `playing` \| `won` \| `lost` |
| `currentLevel` | number | Fase atual (1 a 3) |
| `lives`, `score`, `timeLeft` | number | Valores do HUD |
| `checkpoint` | objeto | Último ponto de respawn |
| `jumpBuffer`, `player.coyote` | number | Timers de física |

### 🔀 Condicionais (exemplos)
- **Colisão AABB:** `overlap(a, b)` compara bordas de dois retângulos.
- **Pulo válido:** `if (jumpBuffer > 0 && player.coyote > 0) { ... }`
- **Pisão em inimigo:** `if (stomp) { e.alive = false; ... }`
- **Transição de fase:** `if (state === 'won') { currentLevel++; ... }`
- **Queda no vazio:** `if (player.y > H + 80) loseLife();`

### 🔁 Laços de repetição
- `for (const s of solids)` — colisão do jogador com cada plataforma.
- `for (const c of coins)` — verificação de coleta circular.
- `for (const e of enemies)` — patrulha e colisão de inimigos.
- `while (acc >= STEP)` — loop de passo fixo (física a 60 FPS).
- `for (let i = 0; i < 140; i++)` — geração procedural das estrelas.
- `for (let i = 0; i < 10; i++)` — desenho da estrela de 5 pontas.

### 🎯 Transição de fases
1. Ao colidir com `goal`, calcula bônus e define `state = 'won'`.
2. O overlay mostra a pontuação e a instrução para pressionar ENTER.
3. No `keydown`, se `state === 'won'`:
   - Se `currentLevel < TOTAL_LEVELS` → `currentLevel++` e `resetGame(false)`.
   - Senão → reinicia do zero na fase 1.
4. `resetGame(fullReset)` restaura moedas, inimigos e tempo; se `fullReset`, zera pontos e vidas.

---

## ▶️ Como executar

1. Salve o arquivo como `index.html`.
2. Abra no navegador (Chrome, Firefox, Edge ou Safari).
3. Clique no canvas e pressione **ENTER** para começar.

Ou acesse via GitHub Pages: `https://seuusuario.github.io/coin-rush/`

---

## 📝 Changelog resumido

**v1.1** — Correção de 3 bugs (transição de fase, crash em vitória, reset de animações) + colisão horizontal reforçada + README técnico.  
**v1.0** — Protótipo jogável da Fase 1 (Parte 1).
