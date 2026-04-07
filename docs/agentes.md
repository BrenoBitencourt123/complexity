# Agentes do Pipeline

> Cada agente, o que faz, seus inputs, outputs e modelo utilizado.

Ver também: [[CLAUDE]] · [[fluxo-estado]] · [[arquitetura]]

---

## Visão Geral

O Atlas Agency opera com **4 agentes sequenciais**, cada um especializado em uma fase da produção de conteúdo. Os agentes se comunicam passando seus outputs como input do próximo.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 🎯           │    │ ✍️           │    │ 🎨           │    │ 📡           │
│ ESTRATEGISTA │───▶│  ROTEIRISTA  │───▶│DIRETOR VISUAL│───▶│ DISTRIBUIDOR │
│  (Pro)       │    │   (Pro)      │    │  (Flash)     │    │  (Flash)     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

Cada agente passa por um ciclo de **review humano**: o resultado é exibido, e o usuário pode **Aprovar** (avançar) ou **Regenerar** (rodar novamente).

---

## Agente 1 — Estrategista 🎯

**Arquivo:** `src/services/prompts.js` → `promptEstrategista()`  
**Modelo:** `gemini-1.5-pro`  
**Temperature:** `0.7`

### Papel

Analista de contexto e tomador de decisões de conteúdo. Define a estratégia completa de um vídeo curto, analisando o tema, o momento (dias até o ENEM), e decidindo o melhor ângulo viral.

### Inputs

| Campo           | Origem                  | Obrigatório |
| --------------- | ----------------------- | ----------- |
| `tema`          | Formulário (StartForm)  | ✅           |
| `objetivo`      | Formulário              | ❌           |
| `contextoExtra` | Formulário              | ❌           |
| `dataAtual`     | Gerado automaticamente  | ✅           |
| Contexto ENEM   | `utils/enem.js`         | ✅ (auto)    |
| Dados da marca  | `utils/constants.js`    | ✅ (auto)    |

### Output (formato YAML)

```yaml
ESTRATEGIA:
  tema: "título definido"
  angulo: "o que diferencia este vídeo"
  objetivo: "crescimento | conversao | retencao | awareness"
  duracao_alvo: "15-30s | 30-60s | 60-90s"
  duracao_segundos: 45
  estilo_visual: "SKETCH | PINTURA"
  justificativa: "2-3 frases"
  cenas_estimadas: 5
  hook_sugerido: "frase de hook"
  cta_sugerido: "call to action"
```

### Parser

`parser.js` → `parseEstrategia()` — Extrai campos com regex simples campo-por-campo.

### Decisões de Design dos Estilos Visuais

| Estilo   | Quando Usar                                         |
| -------- | --------------------------------------------------- |
| SKETCH   | Conteúdo explicativo, matemático, científico        |
| PINTURA  | Conteúdo emocional, motivacional, histórico         |

---

## Agente 2 — Roteirista ✍️

**Arquivo:** `src/services/prompts.js` → `promptRoteirista()`  
**Modelo:** `gemini-1.5-pro`  
**Temperature:** `0.8`

### Papel

Escritor de roteiros de vídeo curto educativo. Especializado em hooks que param o scroll, narração natural (como fala, não como texto), e ritmo adequado para vídeo curto.

### Inputs

| Campo        | Origem                          |
| ------------ | ------------------------------- |
| `estrategia` | Output bruto do Agente 1        |

### Output (formato estruturado)

Cada cena segue este formato:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CENA [XX] | [NOME DA CENA] | [DURAÇÃO]s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NARRAÇÃO:
"texto exato para narração em voz alta"

TEXTO NA TELA:
palavra-chave ou frase curta

EMOÇÃO / ENERGIA:
como o narrador deve soar

DURAÇÃO: Xs
```

Ao final, inclui:
- **Script TTS**: texto de narração completo, formatado para ElevenLabs
- **Duração total estimada** e **total de cenas**

### Parsers

- `parseCenas()` — Extrai array de cenas (número, nome, narração, textoNaTela, emoção, duração)
- `parseTTS()` — Extrai o script TTS limpo
- `parseMetaRoteiro()` — Extrai duração total e número de cenas

### Estrutura Obrigatória

```
CENA 01 — HOOK       (2–4s)
CENA 02 — PROBLEMA   (3–6s)
CENA 03..N-1 — DESENVOLVIMENTO
CENA  N — CTA        (3–5s)
```

---

## Agente 3 — Diretor Visual 🎨

**Arquivo:** `src/services/prompts.js` → `promptDiretorVisual()`  
**Modelo:** `gemini-1.5-flash`  
**Temperature:** `0.8`

### Papel

Diretor de arte que gera prompts de imagem para IA generativa. Cada cena recebe duas versões de prompt (A e B) com especificações detalhadas.

### Inputs

| Campo        | Origem                          |
| ------------ | ------------------------------- |
| `estrategia` | Output bruto do Agente 1        |
| `roteiro`    | Output bruto do Agente 2        |

### Output

Para cada cena:

**Opção A — Geração Automática (API):**
- Estilo Mestre (bloco completo)
- Cena (descrição visual em inglês)
- Enquadramento + justificativa
- Dica Visual, Composição
- Texto na Imagem (máx 4 palavras PT-BR)
- Fundo, Proporção (9:16)
- Prompt Negativo
- Modelo sugerido (flux-dev / ideogram-v2 / dalle-3)
- Seed

**Opção B — Prompt Manual (Ideogram / Midjourney / Canva AI):**
- Versão simplificada em português
- Referência de mood
- Lista de elementos a evitar

**Ao final:** Guia de Consistência Visual (paleta, personagens recorrentes, seed global)

### Parsers

- `parseVisuais()` — Array de visuais por cena (número, nome, descrição, opcaoA, opcaoB)
- `parseConsistencia()` — Guia de consistência visual

### Blocos Mestres

Os blocos mestres de estilo são definidos em `utils/constants.js` → `ESTILOS_VISUAIS`:

- **SKETCH:** "Ilustração de traço azul sobre papel branco, estilo caderno de estudante..."
- **PINTURA:** "Pintura digital texturizada, estilo arte conceitual de mesa digitalizadora..."

Cada estilo inclui: `blocoMestre`, `blocoMestreSimplificado` e `promptNegativo`.

---

## Agente 4 — Distribuidor 📡

**Arquivo:** `src/services/prompts.js` → `promptDistribuidor()`  
**Modelo:** `gemini-1.5-flash`  
**Temperature:** `0.8`

### Papel

Especialista em crescimento orgânico de canais educativos. Gera o pacote completo de metadados para distribuição em múltiplas plataformas.

### Inputs

| Campo        | Origem                          |
| ------------ | ------------------------------- |
| `estrategia` | Output bruto do Agente 1        |
| `roteiro`    | Output bruto do Agente 2        |

### Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PACOTE DE DISTRIBUIÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| Plataforma       | Campos                                    |
| ---------------- | ----------------------------------------- |
| **TikTok**       | Título (100 chars), Descrição, Hashtags (20-25) |
| **Instagram Reels** | Legenda (2.200 chars), Hashtags (25-30)  |
| **YouTube Shorts**  | Título (70 chars), Descrição, Tags (15-20) |
| **Geral**        | Horários por plataforma, Thumbnail, Aviso de tendência |

### Parser

- `parseDistribuicao()` — Objeto com chaves `tiktok`, `instagram`, `youtube`, `geral`, cada uma com seus subcampos.

---

## Tabela Resumo

| #  | Agente          | Modelo           | Temp | Input Principal                | Output Principal                  |
| -- | --------------- | ---------------- | ---- | ------------------------------ | --------------------------------- |
| 1  | Estrategista    | gemini-1.5-pro   | 0.7  | tema, objetivo, contexto       | Estratégia YAML                   |
| 2  | Roteirista      | gemini-1.5-pro   | 0.8  | estratégia (raw)               | Cenas + Script TTS                |
| 3  | Diretor Visual  | gemini-1.5-flash | 0.8  | estratégia + roteiro (raw)     | Prompts de imagem A/B + guia      |
| 4  | Distribuidor    | gemini-1.5-flash | 0.8  | estratégia + roteiro (raw)     | Pacote TikTok/IG/YT               |

---

## Configurações de Geração (compartilhadas)

```js
{
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
}
```

## Dados da Marca Injetados

Todos os system prompts recebem automaticamente:
- Nome da marca, descrição, público-alvo
- Tom de voz, diferenciais
- Preço PRO (R$49,90/mês)
- Contexto ENEM (dias restantes, urgência)
