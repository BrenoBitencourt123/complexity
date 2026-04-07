# Arquitetura do Projeto

> Estrutura de pastas, responsabilidades de cada camada e decisões técnicas.

Ver também: [[CLAUDE]] · [[agentes]] · [[fluxo-estado]] · [[decisoes]]

---

## Estrutura de Pastas

```
Complexity/
├── index.html                  # Ponto de entrada HTML (pt-BR, meta SEO)
├── vite.config.js              # Configuração Vite (plugin React)
├── package.json                # Dependências (React 19, Gemini SDK, Vite 8)
│
├── src/
│   ├── main.jsx                # Bootstrap React (StrictMode → <App />)
│   ├── App.jsx                 # Componente raiz — orquestra pipeline, views e settings
│   ├── App.css                 # Estilos do layout principal e settings
│   ├── index.css               # Design System global (tokens, reset, animações)
│   │
│   ├── components/
│   │   ├── Agents/
│   │   │   ├── StartForm.jsx   # Formulário de input (tema, objetivo, contexto)
│   │   │   ├── StartForm.css
│   │   │   ├── AgentViews.jsx  # Views de cada agente (loading, error, resultado)
│   │   │   └── AgentViews.css
│   │   │
│   │   ├── Layout/
│   │   │   ├── Sidebar.jsx     # Sidebar com navegação, histórico e countdown ENEM
│   │   │   └── Sidebar.css
│   │   │
│   │   ├── Pipeline/
│   │   │   ├── PipelineTracker.jsx  # Barra visual de progresso dos 4 agentes
│   │   │   └── PipelineTracker.css
│   │   │
│   │   ├── Production/
│   │   │   └── PacoteFinal.jsx # Tela final com TTS, checklist e export .md
│   │   │
│   │   └── UI/
│   │       ├── index.jsx       # Componentes base (Button, Card, Badge, Tabs, Modal, etc.)
│   │       └── UI.css
│   │
│   ├── hooks/
│   │   ├── usePipeline.js      # State machine do pipeline (core do app)
│   │   ├── useHistory.js       # CRUD de produções no localStorage
│   │   └── useSettings.js      # API key e preferências persistidas
│   │
│   ├── services/
│   │   ├── gemini.js           # Client Gemini (init, runAgent com streaming, testConnection)
│   │   ├── prompts.js          # System prompts dos 4 agentes (parametrizados)
│   │   └── parser.js           # Parsers regex dos outputs de cada agente
│   │
│   └── utils/
│       ├── constants.js        # Configurações da marca, estilos visuais, constantes
│       ├── enem.js             # Cálculo dinâmico de dias até o ENEM
│       └── formatters.js       # Formatação de datas, clipboard, export .md, IDs
│
├── examples/node/              # (Vazio — espaço para exemplos futuros)
└── docs/                       # Documentação do projeto (este diretório)
```

---

## Camadas da Arquitetura

### 1. Apresentação (`components/`)

Componentes React puros, sem lógica de negócio. Divididos por domínio:

| Pasta        | Responsabilidade                                            |
| ------------ | ----------------------------------------------------------- |
| `Agents/`    | Formulário de entrada + views de resultado de cada agente   |
| `Layout/`    | Sidebar com navegação, histórico e countdown do ENEM        |
| `Pipeline/`  | Barra de progresso visual conectada ao status da pipeline   |
| `Production/`| Tela final com script TTS, checklist e export               |
| `UI/`        | Design system: Button, Card, Badge, Tabs, Modal, CopyBlock |

### 2. Estado (`hooks/`)

Custom hooks que encapsulam toda a lógica de estado:

| Hook           | Papel                                              |
| -------------- | -------------------------------------------------- |
| `usePipeline`  | State machine completa → ver [[fluxo-estado]]      |
| `useHistory`   | CRUD de produções com localStorage                  |
| `useSettings`  | Persistência da API key + inicialização do Gemini  |

### 3. Serviços (`services/`)

Camada de integração com APIs externas e processamento:

| Serviço     | Papel                                                    |
| ----------- | -------------------------------------------------------- |
| `gemini.js` | Abstração do SDK `@google/generative-ai` com streaming   |
| `prompts.js`| System prompts parametrizados dos 4 agentes              |
| `parser.js` | Parsers regex que extraem dados estruturados dos outputs  |

### 4. Utilitários (`utils/`)

Funções puras sem side effects:

| Módulo         | Papel                                        |
| -------------- | -------------------------------------------- |
| `constants.js` | Definições da marca Atlas, estilos, objetivos |
| `enem.js`      | Cálculo dinâmico de dias até o próximo ENEM  |
| `formatters.js`| Formatação de datas, clipboard, export .md    |

---

## Design System

Definido em `index.css` com CSS custom properties:

- **Paleta:** Dark mode com tons de azul/índigo (`#06060b` → `#3b82f6`)
- **Tipografia:** Inter (Google Fonts), escala de `0.75rem` a `2.5rem`
- **Glassmorphism:** Superfícies com `backdrop-filter: blur(12px)` e borders translúcidos
- **Animações:** `fadeIn`, `fadeInUp`, `shimmer`, `glow`, `spin`, `typing`, `gradientFlow`
- **Grid decorativo:** Background sutil com linhas 40×40px
- **Componentes base:** Button (4 variantes), Card, Badge (5 cores), Tabs, CopyBlock, Modal

---

## Fluxo de Dados

```
[StartForm] → tema, objetivo, contextoExtra
     ↓
[usePipeline.iniciar()] → dispara agente 1
     ↓
[gemini.runAgent()] → streaming chunks → callback no hook
     ↓
[parser.parseXxx()] → dados estruturados
     ↓
[AgentViews] → renderiza com botões Aprovar/Regenerar
     ↓ (aprovar)
[usePipeline.aprovarStep()] → dispara próximo agente
     ↓ ... (repete 4x)
[PacoteFinal] → TTS, checklist, export .md
```

---

## Integração com Gemini

- **SDK:** `@google/generative-ai` v0.24.1
- **Modelos:**
  - `gemini-1.5-pro` → Estrategista e Roteirista (raciocínio estratégico)
  - `gemini-1.5-flash` → Diretor Visual e Distribuidor (mais rápido, mecânico)
- **Streaming:** Todos os agentes usam `generateContentStream` com callback por chunk
- **Temperature:** 0.7 (Estrategista) / 0.8 (demais)
- **Max tokens:** 8192 por agente

---

## Persistência

Tudo no `localStorage` do browser:

| Chave                    | Conteúdo                   |
| ------------------------ | -------------------------- |
| `atlas-agency-settings`  | API key, voz ElevenLabs    |
| `atlas-agency-history`   | Array de produções passadas|

Não há backend. O app roda 100% client-side.
