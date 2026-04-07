# Log de Decisões Técnicas

> Registro das decisões técnicas importantes tomadas no projeto.

Ver também: [[CLAUDE]] · [[arquitetura]] · [[agentes]] · [[fluxo-estado]]

---

## D001 — React puro com hooks, sem state manager externo

**Contexto:** O app tem estado complexo (state machine com 10+ estados), mas todo concentrado em um único pipeline.

**Decisão:** Usar `useState` + `useCallback` + `useRef` via custom hooks (`usePipeline`, `useHistory`, `useSettings`). Sem Redux, Zustand ou Context API.

**Justificativa:**
- O estado do pipeline é isolado — não é compartilhado entre componentes distantes
- O `App.jsx` funciona como orquestrador central, passando props para baixo
- Três hooks cobrem todas as necessidades (pipeline, histórico, settings)
- Adicionar um state manager seria overengineering para o tamanho atual do app

**Trade-off:** Se o app crescer com múltiplos pipelines simultâneos ou colaboração, será necessário migrar para Context ou Zustand.

---

## D002 — Modelo dual: Pro para raciocínio, Flash para execução

**Contexto:** O Gemini oferece dois tiers — Pro (mais lento, mais capaz) e Flash (mais rápido, mais barato).

**Decisão:** Agentes 1-2 (Estrategista, Roteirista) usam `gemini-1.5-pro`. Agentes 3-4 (Diretor Visual, Distribuidor) usam `gemini-1.5-flash`.

**Justificativa:**
- Estrategista e Roteirista exigem **raciocínio criativo e estratégico** — beneficiam-se do modelo mais capaz
- Diretor Visual e Distribuidor são mais **mecânicos e templated** — Flash é suficiente e 2-3x mais rápido
- Custo por pipeline é reduzido em ~40% sem impacto perceptível na qualidade

Definido em: `services/gemini.js` → `getModelForAgent()`

---

## D003 — Streaming com callback, não SSE

**Contexto:** A API Gemini suporta streaming via `generateContentStream`.

**Decisão:** Usar streaming nativo do SDK com callback por chunk: `onChunk(chunk, fullText)`.

**Justificativa:**
- O app roda 100% client-side — não há server para SSE
- O streaming dá feedback visual imediato (o texto vai aparecendo)
- O `fullText` acumulado é o resultado final — sem necessidade de reassemblar chunks

**Trade-off:** Se um chunk falhar no meio, o resultado parcial é perdido. Não há retry parcial.

---

## D004 — Parsers baseados em regex, não em JSON estruturado

**Contexto:** Os outputs dos agentes são texto formatado (YAML, blocos com delimitadores), não JSON.

**Decisão:** Usar parsers regex específicos para cada agente (`parser.js`), ao invés de forçar output JSON nos prompts.

**Justificativa:**
- LLMs produzem texto mais natural e detalhado em formato livre do que em JSON estrito
- Forçar JSON aumenta a chance de erros de formatação (chaves faltando, escaping)
- Os parsers regex são resilientes — extraem o que conseguem e retornam `null` para campos faltantes
- A UI tem fallback: se o parsing falhar, mostra o output bruto via `CopyBlock`

**Trade-off:** Parsers regex são frágeis a mudanças de formato. Se o prompt mudar, o parser pode quebrar silenciosamente.

---

## D005 — localStorage como persistência única

**Contexto:** O app precisa salvar API key, preferências e histórico de produções.

**Decisão:** Usar `localStorage` para tudo, sem backend.

**Justificativa:**
- O app é uma ferramenta pessoal de produção de conteúdo, não multi-usuário
- Sem backend = zero custos de infraestrutura, deploy como static site
- A API key fica no browser — o usuário tem total controle
- Histórico é para referência rápida, não para backup de longo prazo

**Trade-off:**
- Dados perdidos se limpar o browser
- API key armazenada em plaintext no localStorage (não é ideal para segurança)
- Sem sincronização entre dispositivos

---

## D006 — Pipeline sequencial com human-in-the-loop

**Contexto:** Os 4 agentes poderiam rodar em paralelo ou em sequência automática.

**Decisão:** Pipeline estritamente sequencial, com review humano obrigatório entre cada etapa. O usuário deve **Aprovar** ou **Regenerar** antes de avançar.

**Justificativa:**
- Cada agente depende do output do anterior — paralelismo não é possível
- Review humano previne desperdício de tokens (se a estratégia estiver errada, não gasta com roteiro, visuais e distribuição)
- O produtor pode ajustar a direção a qualquer momento regenerando um agente
- Reduz custo de API significativamente vs. rodar os 4 automaticamente

**Trade-off:** Mais lento — o usuário precisa clicar "Aprovar" 4 vezes. Possível adicionar modo "auto-approve" no futuro.

---

## D007 — CSS puro com Design System via custom properties

**Contexto:** Muitos projetos React usam Tailwind, CSS-in-JS ou styled-components.

**Decisão:** Vanilla CSS com design system definido em `index.css` via CSS custom properties (`:root`).

**Justificativa:**
- Controle total sobre estilos sem dependências extras
- Custom properties (`--brand-primary`, `--space-4`, etc.) funcionam como design tokens
- Zero overhead de runtime (vs. CSS-in-JS)
- Componentes em `UI/index.jsx` com CSS em `UI.css` mantêm encapsulamento
- Animações complexas (shimmer, glow, typing) são mais naturais em CSS puro

---

## D008 — Dois estilos visuais pré-configurados (SKETCH e PINTURA)

**Contexto:** O Diretor Visual precisa de um estilo consistente para cada vídeo.

**Decisão:** Definir dois blocos mestres de estilo (`SKETCH` e `PINTURA`) com prompts positivos, negativos e versões simplificadas. O Estrategista escolhe qual usar.

**Justificativa:**
- Limitar opções garante consistência visual entre cenas do mesmo vídeo
- Cada estilo tem um `blocoMestre` detalhado que é injetado em todos os prompts de imagem
- A escolha é contextual: SKETCH para STEM, PINTURA para humanidades/emocional
- Extensível: novos estilos podem ser adicionados em `constants.js`

---

## D009 — Import dinâmico dos parsers

**Contexto:** Os parsers (`parser.js`) são usados apenas quando um agente termina.

**Decisão:** Usar `await import('../services/parser.js')` dentro de cada `executarAgente()`.

**Justificativa:**
- Code splitting automático via Vite — parsers não entram no bundle inicial
- Cada função de agente importa apenas os parsers que precisa
- Reduz tamanho do bundle inicial (~8KB a menos)

**Trade-off:** Minor — a importação dinâmica adiciona ~5ms na primeira chamada de cada parser. Imperceptível na prática dado que o agente leva segundos.

---

## D010 — Cálculo dinâmico do ENEM

**Contexto:** O conteúdo do Atlas é fortemente sazonal — a urgência muda conforme se aproxima do ENEM.

**Decisão:** `utils/enem.js` calcula automaticamente a data do próximo ENEM (primeiro e segundo domingos de novembro) e os dias restantes.

**Justificativa:**
- O texto de urgência ("faltam X dias pro ENEM") é injetado nos prompts do Estrategista
- A Sidebar mostra um countdown permanente
- Se o ENEM deste ano já passou, calcula para o ano seguinte automaticamente
- O tom e a urgência dos prompts se ajustam automaticamente (normal → média → alta → crítica)

---

## D011 — Dual prompt para imagens (Opção A + Opção B)

**Contexto:** Nem todos os produtores têm acesso às mesmas ferramentas de geração de imagem.

**Decisão:** O Diretor Visual gera duas versões de prompt para cada cena:
- **Opção A** — prompt completo em inglês para APIs (Flux, Ideogram, DALL·E)
- **Opção B** — prompt simplificado em português para ferramentas manuais (Ideogram UI, Midjourney, Canva AI)

**Justificativa:**
- Flexibilidade: o produtor escolhe a ferramenta que tem acesso
- Opção A é otimizada para parsing por API (estruturada, em inglês)
- Opção B é otimizada para humanos (em português, com referência de mood)

---

## D012 — Exportação como .md

**Contexto:** O output final precisa ser portável.

**Decisão:** O `PacoteFinal` permite exportar todo o pacote como um único arquivo `.md`.

**Justificativa:**
- Markdown é universal — abre em qualquer editor, Obsidian, Notion, GitHub
- Inclui todos os 4 outputs brutos + script TTS
- Nome do arquivo é gerado automaticamente baseado no tema
- Implementado via `Blob` + `URL.createObjectURL` (zero dependências)
