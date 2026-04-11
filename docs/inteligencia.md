# Inteligência de Performance

> O Cientista de Dados analisa performance real e alimenta o sistema com aprendizado.

Ver também: [[memoria-narrativa]] · [[planner]] · [[banco-de-dados]]

---

## O que é

O **Agente Cientista** (`dataAnalyst.js`) lê dados brutos de performance colados pelo usuário e gera inteligência estruturada. Essa inteligência alimenta o CMO no próximo plano semanal.

**Arquivo:** `dataAnalyst.js`  
**Componente:** `DataIntelPanel.jsx`  
**Tabela Supabase:** `brand_intel`

---

## Fluxo

```
Usuário cola dados brutos (CSV, relato, números)
    ↓
analyzePerformanceData()
    ↓
Gemini analisa e gera JSON estruturado
    ↓
Salva em brand_intel no Supabase
    ↓
extractNarrativeInsights() (em paralelo, não bloqueia)
    ↓
Sugere: fase da audiência + ganchos que performaram
```

---

## analyzePerformanceData()

Recebe qualquer texto com dados de performance e retorna:

```json
{
  "formatos_em_alta": ["Shorts com hook provocativo", "Carrossel de dicas"],
  "topicos_quentes": ["Logaritmos", "Redação nota 1000"],
  "o_que_evitar": ["Vídeos longos de mais de 60s", "Tom muito formal"],
  "recomedacao_cmo": "Priorizar Shorts com dados concretos e hooks de desafio",
  "conclusoes_matadoras": [
    "Vídeos com número no título têm 40% mais retenção",
    "Posts às 19h têm 2x mais alcance que manhã"
  ]
}
```

Esse JSON é salvo no Supabase e injetado no CMO na próxima geração de plano.

---

## extractNarrativeInsights()

Roda após a análise principal, extrai sugestões para a memória narrativa:

```json
{
  "ganchos_sugeridos": [
    "Você está estudando do jeito errado",
    "Isso cai todo ENEM e ninguém te conta"
  ],
  "fase_sugerida": "consideracao",
  "justificativa_fase": "Engajamento alto com conteúdo de dica prática indica audiência que já confia"
}
```

O usuário pode:
- **Aplicar fase sugerida** — atualiza `fase_audiencia` na memória
- **Salvar gancho** — adiciona em `ganchos_aprovados`

---

## UI no DataIntelPanel

O painel tem 3 áreas:

### 1. Upload de Performance
Textarea para colar dados brutos. Aceita qualquer formato: CSV, relato em texto, números avulsos.

### 2. Relatório Ativo
Exibe a inteligência salva atualmente:
- Tópicos quentes
- Formatos em alta
- O que evitar
- Conclusões matadoras
- Orientação pro CMO

Após nova análise: card de "Insights para Memória Narrativa" com fase sugerida + ganchos.

### 3. Memória Narrativa
Cards para gerenciar:
- **Fase da audiência** — 3 botões (awareness/consideracao/conversao)
- **Temas cobertos** — lista dos últimos 10
- **Temas proibidos** — adicionar/remover com expiração de 30 dias
- **Arcos narrativos** — criar série, +1 post feito, concluir
- **Ganchos aprovados** — adicionar manualmente ou via sugestão
- **Métricas da conta** — seguidores, crescimento semanal, engajamento
