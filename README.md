# Coin Rush – Edição Galáxia

Jogo de plataforma 2D feito com HTML, CSS e JavaScript puro (sem dependências).
Uma boneca de cabelos loiros e vestido azul atravessa a **Nebulosa Cintilante**, coletando estrelas, pisando em aliens e chegando ao portal de saída.

## Como jogar

Abra o `index.html` em qualquer navegador moderno.

| Ação | Teclas |
|---|---|
| Mover | ← → ou A D |
| Pular (segure para pular mais alto) | Espaço, ↑ ou W |
| Reiniciar | R |
| Começar / jogar de novo | Enter |

## Pontuação

- Estrela coletada: **10 pontos**
- Alien derrotado (pulando em cima): **100 pontos**
- Bônus ao chegar no portal: **5 pontos por segundo restante** e **100 por vida sobrando**
- Começa com **3 vidas** e **120 segundos**. Perde uma vida ao cair no vazio ou tocar em um alien pelo lado.

## Estrutura

- `index.html`: página e canvas do jogo
- `style.css`: estilo da página
- `game.js`: lógica do jogo (movimento, física, fase, pontuação e desenho)
- `ESCOPO.md`: declaração do escopo inicial
