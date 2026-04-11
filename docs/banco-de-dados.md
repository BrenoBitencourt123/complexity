# Banco de Dados

> Tabelas Supabase, schema e como cada uma é usada.

Ver também: [[arquitetura]] · [[memoria-narrativa]] · [[planner]]

---

## Tabelas

### `productions`
Histórico de produções completas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `created_at` | timestamp | Data de criação |
| `tema` | text | Tema do conteúdo |
| `objetivo` | text | crescimento / retencao / conversao |
| `formato` | text | Shorts / Carrossel / Stories |
| `estrategia` | jsonb | Output parseado do Estrategista |
| `roteiro` | text | Output bruto do Roteirista |
| `visuais` | jsonb | Array de visuais com prompts |
| `distribuicao` | jsonb | Pacote TikTok/IG/YT |
| `status` | text | rascunho / aprovado / publicado |

---

### `content_plans`
Plano semanal gerado pelo CMO.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `created_at` | timestamp | Data de geração |
| `week_start` | date | Segunda-feira da semana |
| `plan` | jsonb | JSON completo do plano (dias + tarefas) |
| `estrategia_semanal` | text | Parágrafo da lógica da semana |
| `mix` | jsonb | `{ crescimento, retencao, conversao }` |

---

### `narrative_memory`
Singleton por conta. Um único registro acumulado.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `fase_audiencia` | text | awareness / consideracao / conversao |
| `temas_cobertos` | jsonb | Array: `{ tema, formato, data, objetivo, performance_score }` |
| `temas_proibidos` | jsonb | Array: `{ tema, adicionado_em }` — expiram em 30 dias |
| `arcos_ativos` | jsonb | Array: `{ nome_arco, posts_planejados, posts_feitos, proximo_passo }` |
| `ganchos_aprovados` | jsonb | Array de strings (máx 10) |
| `metricas_conta` | jsonb | `{ seguidores, crescimento_semanal, taxa_engajamento, atualizado_em }` |
| `notas_cmo` | text | Anotações livres |

> **Migration necessária:**
> ```sql
> ALTER TABLE narrative_memory ADD COLUMN IF NOT EXISTS metricas_conta jsonb DEFAULT '{}';
> ```

---

### `brand_intel`
Inteligência de performance gerada pelo Cientista.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `created_at` | timestamp | Data da análise |
| `formatos_em_alta` | jsonb | Array de strings |
| `topicos_quentes` | jsonb | Array de strings |
| `o_que_evitar` | jsonb | Array de strings |
| `recomedacao_cmo` | text | Orientação direta para o CMO |
| `conclusoes_matadoras` | jsonb | Array de insights |

Sempre o registro mais recente é usado pelo CMO (`getCurrentIntel()`).

---

## Client Supabase

Configurado em `src/lib/supabase.js` (ou `services/supabase.js`):

```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Credenciais via `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
