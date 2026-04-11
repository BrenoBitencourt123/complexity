# Arquitetura

> Estrutura de pastas, responsabilidades de cada camada e stack técnica.

Ver também: [[Home]] · [[pipeline]] · [[agentes]] · [[banco-de-dados]]

---

## Estrutura de Pastas

```
src/
├── App.jsx                        # Raiz: orquestra pipeline, views e navegação
│
├── components/
│   ├── Agents/
│   │   ├── StartForm.jsx          # Formulário: tema, objetivo, formato, contexto
│   │   └── AgentViews.jsx         # Views de cada agente (Estrategista, Roteirista, etc.)
│   │
│   ├── Intelligence/
│   │   ├── DataIntelPanel.jsx     # Painel: análise de performance + memória narrativa
│   │   └── DataIntelPanel.css
│   │
│   ├── WeeklyPlanner/             # Calendário semanal gerado pelo CMO
│   ├── Production/                # Tela final: TTS, prompts de imagem, pacote
│   ├── Layout/                    # Sidebar com navegação e countdown ENEM
│   └── UI/                        # Design system (Button, Card, Badge, etc.)
│
├── hooks/
│   ├── usePipeline.js             # State machine dos 4 agentes (core do app)
│   ├── useNarrativeMemory.js      # CRUD da memória narrativa via Supabase
│   ├── useHistory.js              # Histórico de produções
│   └── useSettings.js             # API keys e preferências
│
├── services/
│   ├── gemini.js                  # Client Gemini (init, runAgent, streaming)
│   ├── prompts.js                 # System prompts dos 4 agentes + QA + Distribuidor
│   ├── parser.js                  # Parsers regex dos outputs de cada agente
│   ├── contentPlanner.js          # CMO Estratégico: gera plano semanal 7 dias
│   ├── narrativeMemory.js         # CRUD da memória narrativa no Supabase
│   └── dataAnalyst.js             # Agente Cientista: analisa performance, extrai insights
│
└── utils/
    ├── constants.js               # Marca Atlas, estilos visuais, objetivos, formatos
    ├── buildImagePrompt.js        # Monta prompt final de imagem (estilo + câmera + regras)
    └── enem.js                    # Cálculo dinâmico de dias até o ENEM
```

---

## Camadas

### Apresentação (`components/`)
Componentes React sem lógica de negócio. Recebem dados via props, disparam callbacks.

### Estado (`hooks/`)
Toda a lógica de estado encapsulada em custom hooks. O `usePipeline` é a state machine central que orquestra os 4 agentes em sequência.

### Serviços (`services/`)
Integrações com APIs externas (Gemini, Supabase) e processamento de texto. Funções assíncronas puras, sem estado próprio.

### Utilitários (`utils/`)
Funções puras sem side effects. `buildImagePrompt` é o mais importante: monta o prompt de imagem completo em código, sem depender do LLM para estilo.

---

## Stack Técnica

| Tecnologia | Uso |
|---|---|
| React + Vite | Frontend SPA |
| JavaScript (sem TypeScript) | Linguagem |
| CSS nativo | Estilização (sem Tailwind) |
| Google Gemini 2.5 Flash | Todos os agentes LLM |
| Supabase (PostgreSQL) | Banco de dados, persistência |
| ElevenLabs | Geração de áudio (narrador Thiago) |
| `@google/generative-ai` | SDK Gemini |

---

## Persistência

Dois destinos:

| Dado | Onde |
|---|---|
| Produções passadas | Supabase (`productions`) |
| Plano semanal | Supabase (`content_plans`) |
| Memória narrativa | Supabase (`narrative_memory`) |
| Inteligência de performance | Supabase (`brand_intel`) |
| API keys / settings | localStorage |

Ver detalhes em [[banco-de-dados]].
