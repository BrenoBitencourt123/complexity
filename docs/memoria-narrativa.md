# Memória Narrativa

> Como o sistema acumula contexto e aprende ao longo do tempo.

Ver também: [[planner]] · [[inteligencia]] · [[banco-de-dados]]

---

## O que é

A memória narrativa é um registro singleton por conta no Supabase. Ela acumula tudo que o CMO precisa saber para não repetir, não vender na hora errada, e dar continuidade à narrativa da marca.

**Arquivo:** `narrativeMemory.js`  
**Tabela Supabase:** `narrative_memory`

---

## Campos

| Campo | Tipo | O que guarda |
|---|---|---|
| `fase_audiencia` | string | `awareness` / `consideracao` / `conversao` |
| `temas_cobertos` | jsonb array | Histórico de produções com tema, formato, data, objetivo |
| `temas_proibidos` | jsonb array | Temas bloqueados manualmente por 30 dias |
| `arcos_ativos` | jsonb array | Séries de posts em andamento |
| `ganchos_aprovados` | jsonb array | Frases de abertura que performaram bem |
| `metricas_conta` | jsonb | Seguidores, crescimento semanal, engajamento |
| `notas_cmo` | string | Anotações livres para o CMO |

---

## Fase da Audiência

Controla o peso do mix de conteúdo:

| Fase | Descrição | Impacto no CMO |
|---|---|---|
| `awareness` | Conta crescendo, audiência nova | Máximo crescimento, mínimo conversão |
| `consideracao` | Audiência engajada, construindo autoridade | Mix equilibrado |
| `conversao` | Audiência confia, hora de vender | Pode aumentar CTAs |

Definida manualmente no DataIntelPanel ou sugerida automaticamente pelo Cientista após análise de performance.

---

## Temas Cobertos

Registrado automaticamente ao final de cada produção:

```js
addTemaCoberto(tema, formato, data, objetivo)
// Ex: addTemaCoberto('Logaritmos', 'Shorts', '2026-04-11', 'crescimento')
```

Cada entrada: `{ tema, formato, data, objetivo, performance_score }`.

O CMO recebe os últimos 10 temas para evitar repetição.

---

## Ciclo de Conversão

Calculado em `getContextoParaCMO()` com base nos últimos 14 dias:

```
1 conversão permitida a cada 10 posts
conversoesPendentes = max(0, floor(totalPosts/10) - conversoesFeitasNoperiodo)
```

Injetado no prompt do CMO como instrução direta:
- *"VOCÊ PODE/DEVE fazer 1 post de conversão neste plano."*
- *"equilibrado. Priorize crescimento agora."*

---

## Arcos Narrativos

Séries de posts conectados. O CMO recebe os arcos ativos e dá continuidade ao `proximo_passo`.

```json
{
  "nome_arco": "Série de Matemática do ENEM",
  "posts_planejados": 5,
  "posts_feitos": 2,
  "proximo_passo": "post de conversão final com CTA para o Atlas"
}
```

Gerenciado via UI no DataIntelPanel: criar, +1 post, concluir.

---

## Ganchos Aprovados

Frases de abertura que performaram bem. O CMO usa como referência de tom e estilo.

- Máximo 10 ganchos (os mais recentes)
- Adicionados manualmente ou sugeridos pelo Cientista após análise
- Exemplo: *"Você está estudando do jeito completamente errado"*

---

## Métricas da Conta

Salvas manualmente pelo usuário no DataIntelPanel:

```json
{
  "seguidores": 2400,
  "crescimento_semanal": 8.5,
  "taxa_engajamento": 4.2,
  "atualizado_em": "2026-04-11T..."
}
```

Injetado no CMO: *"MÉTRICAS DA CONTA: 2400 seguidores | +8.5% semana | 4.2% engajamento"*

---

## getContextoParaCMO()

Função que monta a string completa de contexto injetada no CMO. Inclui:

```
MEMÓRIA NARRATIVA — contexto acumulado

FASE ATUAL DA AUDIÊNCIA: awareness
MÉTRICAS DA CONTA: 2400 seguidores | +8.5% semana | 4.2% engajamento
CICLO (últimos 14 dias): 8 crescimento + 1 menção suave + 0 conversão → equilibrado. Priorize crescimento agora.

ÚLTIMOS TEMAS COBERTOS (não repetir):
• Logaritmos (Shorts, 2026-04-11, objetivo: crescimento)
• Crise Hídrica (Shorts, 2026-04-10, objetivo: crescimento)
...

ARCOS NARRATIVOS ATIVOS:
• Série de Matemática: 2/5 posts feitos — próximo: revisão de funções

TEMAS PROIBIDOS nos próximos 30 dias: redação nota mil

GANCHOS QUE PERFORMARAM BEM (use como referência de estilo):
Você está estudando do jeito errado, Isso cai todo ENEM e ninguém ensina...
```
