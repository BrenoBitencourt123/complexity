# Estilos Visuais e buildImagePrompt

> Como os prompts de imagem são montados e os 4 estilos disponíveis.

Ver também: [[agentes]] · [[pipeline]]

---

## Arquitetura do Prompt de Imagem

O Diretor Visual gera apenas o **conteúdo** da imagem em PT-BR (`IMAGEM_PT`). Todo o estilo, câmera e regras de composição são injetados **em código** pelo `buildImagePrompt.js`.

```
IMAGEM_PT (LLM)
    + style seed (código)
    + enquadramento de câmera (código, por posição)
    + dica visual automática (código, por palavras-chave na narração)
    + regras fixas (código)
    ↓
prompt final completo
```

Isso garante consistência visual independente do LLM variar.

---

## Os 4 Estilos

Definidos em `constants.js` → `STYLE_SEEDS`:

### padrao *(padrão ativo)*
Ilustração desenhada à mão, esboço educacional clean. Papel bege/creme. Tons de cinza com azul `#4A90E2` como único destaque. Feel: startup de educação, clean e confiável.

### sketch
Estilo caderno de estudante, traços irregulares. Papel texturizado. Preto/cinza com laranja `#E8610A` como único destaque. Feel: anotação de aula, didático e acessível.

### impacto
Cartoon/quadrinho com meio-tom (halftone) pop-art retrô. Paleta quente: âmbar, laranja, teal, marrom. Contornos pretos espessos, alto contraste. Feel: quadrinho educacional, energia imediata.

### pintura
Pintura digital texturizada, arte conceitual. Pinceladas expressivas visíveis, acabamento não liso. Feel: arte conceitual imersiva, artesanal.

---

## Enquadramento de Câmera por Posição

Cada cena recebe enquadramento automático baseado na sua posição na sequência:

| Posição | Enquadramento |
|---|---|
| `opening` (cena 1) | PLANO MÉDIO — pessoa ou elemento interagindo com ambiente |
| `middle` (cenas do meio) | CLOSE-UP — foco em objeto, número ou símbolo-chave |
| `closing` (penúltima) | VISÃO AMPLA — metáfora panorâmica ou visão de conjunto |
| `final` (última) | PERSPECTIVA CRIATIVA — composição diferente de tudo antes |

---

## Dica Visual Automática

O `buildImagePrompt.js` detecta palavras-chave na narração e adiciona uma dica visual:

| Palavras na narração | Dica visual |
|---|---|
| dias, semanas, prazo, tempo | calendário, relógio ou linha do tempo |
| %, porcentagem, crescimento | gráfico de barras, barra de progresso |
| erro, armadilha, perigo | lupa expondo verdade oculta |
| soma, acumulado, resultado | efeito bola de neve ou montanha crescente |
| transformação, antes, depois | contraste antes/depois |
| comparação, versus, escolha | dois caminhos lado a lado |
| pessoa, estudante, profissional | personagem expressivo em destaque |

---

## Proporção por Formato

| Formato | Proporção |
|---|---|
| Shorts / Stories | 9:16 vertical (1080x1920px) |
| Carrossel | 1:1 quadrado (1080x1080px) ou 4:5 (1080x1350px) |

---

## Prompt Final Montado

Exemplo de output do `buildImagePrompt`:

```
ESTILO MESTRE (aplique em todos os elementos): Ilustração desenhada à mão...

CENA: [ABERTURA — sub-cena 1 de 12] Estudante jovem olhando para livro aberto
Enquadramento: PLANO MÉDIO — mostre a pessoa ou elemento principal interagindo com o ambiente.
Dica visual: personagem expressivo representando a situação narrada em posição de destaque.

COMPOSIÇÃO: Elemento principal centralizado, ocupando 60-70% do frame. Contexto de suporte nas bordas.
TEXTO: Máximo 1-4 palavras visíveis em Português Brasileiro (PT-BR) — títulos ou rótulos curtos.
FUNDO: Textura do papel do estilo mestre, leves linhas de esboço de contexto. Sem logotipos ou marcas.
PROPORÇÃO: 9:16 vertical (1080x1920px)
```

---

## Como o Estilo é Escolhido

O Estrategista escolhe o estilo no campo `estilo_visual` do YAML. O usuário pode sobrescrever via `estiloForcadoRef` antes de aprovar o Estrategista.

O estilo é extraído do YAML em `executarDiretorVisual`:
```js
const estiloMatch = estrategiaRaw.match(/estilo_visual:\s*["']?(\w+)["']?/i);
const estilo = estiloMatch?.[1]?.toLowerCase() || 'padrao';
```
