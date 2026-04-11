# Agentes

> Os 4 agentes do pipeline + QA. Inputs, outputs, modelos e parsers.

Ver também: [[pipeline]] · [[voz-do-atlas]] · [[estilos-visuais]]

---

## Modelo Usado

Todos os agentes usam **Gemini 2.5 Flash** (`gemini-2.5-flash`).

---

## Agente 1 — Estrategista

**Arquivo:** `prompts.js` → `promptEstrategista()`

Analista de contexto. Define a estratégia completa antes de qualquer linha de roteiro ser escrita.

### Inputs
- `tema` — obrigatório (vem do StartForm ou do plano semanal)
- `objetivo` — crescimento / retencao / conversao
- `formato` — Shorts / Carrossel / Stories
- `contextoExtra` — instrução extra do CMO
- `narrativaContexto` — contexto completo da memória narrativa (fase, ciclo, arcos, ganchos)
- Data atual + dias até o ENEM (automático)

### Output (YAML)
```yaml
ESTRATEGIA:
  tema: "título"
  formato_imposto: "Shorts"
  angulo: "ângulo específico"
  objetivo: "crescimento"
  duracao_alvo: "30-60s"
  cenas_estimadas: 12
  estilo_visual: "padrao | sketch | impacto | pintura"
  justificativa: "..."
  hook_sugerido: "..."
  cta_sugerido: "..."
```

### Parser
`parseEstrategia()` — extrai campos com regex campo por campo.

---

## Agente 2 — Roteirista + QA

**Arquivo:** `prompts.js` → `promptRoteirista()` + `promptRevisor()`

Escreve na **voz do Atlas** — professor particular que fala diretamente com o aluno. Ver [[voz-do-atlas]].

### Inputs
- Output bruto do Estrategista (YAML completo)

### Output por cena
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CENA 01 | HOOK | 2s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NARRAÇÃO:
"texto falado — máx 1-2 frases"

TEXTO NA TELA:
2-5 palavras de impacto

DURAÇÃO: 2s
---
```

Ao final: `ROTEIRO COMPLETO PARA TTS` + `DURAÇÃO TOTAL ESTIMADA`.

### Regra de Corte Inteligente
Corta para nova cena quando a **imagem mental muda**, não no relógio.
- Maioria das cenas: 2-4s
- Cenas de explicação densa: até 6s
- Target: 10-15 cenas para 30-45s / 15-20 cenas para 45-60s

### QA Invisível
Após gerar o roteiro, o Revisor QA verifica:
1. Fugiu do tema? → reescreve
2. Vendeu quando deveria crescer? → remove CTA
3. Hook fraco? → reformula

Retorna JSON: `{ status, nota, motivo, roteiro_final }`

### Parsers
- `parseCenas()` — array de cenas por regex (robusto, não depende de separador)
- `parseTTS()` — script limpo para ElevenLabs
- `parseMetaRoteiro()` — duração total e número de cenas

---

## Agente 3 — Diretor Visual

**Arquivo:** `prompts.js` → `promptDiretorVisual()`

Gera descrição visual em PT-BR para cada cena. O estilo e câmera são injetados em código pelo `buildImagePrompt.js`.

### Inputs
- Output bruto do Roteirista

### Output por cena
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL — CENA 01 | HOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIÇÃO: o que o espectador vê em 1 frase
IMAGEM_PT: 2-4 frases descrevendo sujeito, ação, elementos e contexto
NARRACAO: cópia exata da narração desta cena
TEXTO: "1-4 palavras visíveis na imagem"
```

Ao final: `GUIA DE CONSISTÊNCIA VISUAL` com personagem recorrente e elementos.

### buildImagePrompt
O `buildImagePrompt.js` recebe `IMAGEM_PT` e adiciona:
- Estilo seed completo (padrao/sketch/impacto/pintura)
- Enquadramento de câmera por posição (opening/middle/closing/final)
- Dica visual automática baseada na narração
- Regras fixas de composição, texto, fundo e proporção

Ver detalhes em [[estilos-visuais]].

### Parsers
- `parseVisuais()` — array com `imagePrompt` (IMAGEM_PT) + `opcaoA` (prompt final montado)
- `parseConsistencia()` — guia de consistência visual

---

## Agente 4 — Distribuidor

**Arquivo:** `prompts.js` → `promptDistribuidor()`

Gera pacote completo de metadados para publicação em 3 plataformas.

### Inputs
- Output bruto do Estrategista
- Output bruto do Roteirista

### Output

| Plataforma | Campos |
|---|---|
| TikTok | Título (100 chars), Descrição, Hashtags (20-25) |
| Instagram Reels | Legenda completa (2.200 chars), Hashtags (30) |
| YouTube Shorts | Título (100 chars), Descrição (250 chars), Tags (15-20) |
| Geral | Melhor horário, Thumbnail sugerida, Aviso de tendência |

### Parser
`parseDistribuicao()` — objeto com chaves `tiktok`, `instagram`, `youtube`, `geral`.

---

## Formatos Suportados

| Formato | Estrutura do roteiro | Proporção da imagem |
|---|---|---|
| Shorts | CENA XX | NOME | DURAÇÃOs | 9:16 vertical (1080x1920px) |
| Carrossel | LÂMINA XX | NOME | 1:1 ou 4:5 |
| Stories | TELA XX | NOME | 9:16 vertical |
