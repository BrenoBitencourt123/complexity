# Planner Semanal (CMO)

> O CMO Estratégico que gera o plano de 7 dias com regras de negócio hard-coded.

Ver também: [[memoria-narrativa]] · [[banco-de-dados]]

---

## O que é

O `contentPlanner.js` contém o **CMO Estratégico** — um agente Gemini que monta o plano de conteúdo completo da semana. Ele decide frequência, formatos, horários e temas com autonomia total.

---

## Regra 70/20/10

Hard-coded em código antes de chamar o LLM:

```js
const POSTS_BASE = 9; // estimativa conservadora por semana
const limites = {
  crescimento: Math.round(POSTS_BASE * 0.70), // 6 posts
  retencao:    Math.round(POSTS_BASE * 0.20), // 2 posts (menção suave)
  conversao:   Math.max(1, Math.round(POSTS_BASE * 0.10)), // 1 post
};
```

| Objetivo | O que é | % |
|---|---|---|
| `crescimento` | Valor puro, sem mencionar o Atlas | 70% |
| `retencao` | Menciona o Atlas de passagem, sem CTA | 20% |
| `conversao` | CTA direto para assinar/comprar | 10% |

Os limites são injetados no prompt como números concretos, não como sugestão.

---

## enforcarMix()

Após o LLM retornar o plano, `enforcarMix()` valida e corrige:

```
Se conversao > limite → degrada excesso para retencao
Se retencao > limite  → degrada excesso para crescimento
```

O LLM não tem a última palavra sobre o mix. O código tem.

---

## Contexto que o CMO Recebe

O CMO recebe em cada chamada:

1. **Memória narrativa completa** (`getContextoParaCMO()`):
   - Fase da audiência (awareness / consideracao / conversao)
   - Métricas da conta (seguidores, crescimento, engajamento)
   - Ciclo dos últimos 14 dias (quantos crescimento/retencao/conversao)
   - Temas cobertos recentemente (não repetir)
   - Arcos narrativos ativos (continuar próximo passo)
   - Ganchos aprovados (referência de estilo)
   - Temas proibidos (bloquear)

2. **Inteligência de performance** (`getCurrentIntel()`):
   - Formatos em alta
   - Tópicos quentes
   - O que evitar
   - Recomendação do Cientista

3. **Datas da semana** (Seg → Dom com datas reais)

4. **Contexto ENEM** (dias restantes)

---

## Ciclo de Conversão

O sistema calcula automaticamente se o CMO "ganhou o direito" de vender:

```
Posts nos últimos 14 dias: 8 crescimento + 1 retencao + 0 conversao
Total: 9 posts → direito a 0.9 conversão → arredonda para 0 já usados
Conversões pendentes: max(0, floor(9/10) - 0) = 0

→ "equilibrado. Priorize crescimento agora."
```

```
Posts nos últimos 14 dias: 12 crescimento + 2 retencao + 0 conversao
Total: 14 posts → direito a 1 conversão → 0 usadas
Conversões pendentes: 1

→ "VOCÊ PODE/DEVE fazer 1 post de conversão neste plano."
```

---

## Output do CMO

JSON com schema:

```json
{
  "estrategia_semanal": "Parágrafo com lógica da semana",
  "total_posts": 9,
  "mix": { "crescimento": 6, "retencao": 2, "conversao": 1 },
  "dias": [
    {
      "dia": "Segunda-feira",
      "data": "2026-04-13",
      "narrativa": "Fio condutor do dia",
      "tarefas": [
        {
          "horario": "07h45",
          "formato": "Shorts",
          "tema": "Título chamativo",
          "angulo": "Psicologia da abordagem",
          "objetivo": "crescimento",
          "pilar": "Dicas de Estudo",
          "contextoExtra": "Instruções para o roteirista"
        }
      ]
    }
  ]
}
```

O plano é salvo no Supabase (`content_plans`) e exibido no calendário semanal.

---

## Princípios do CMO

1. Autonomia total — decide frequência, formato, horário, tema
2. Frequência variável — 1 a 4 posts por dia
3. Mix de formatos: Shorts > Carrossel > Stories
4. Mix 70/20/10 obrigatório
5. Horários brasileiros: 7-9h / 12-14h / 19-22h
6. Narrativa semanal coesa
7. Fim de semana leve (sáb máx 2, dom máx 1)
8. Não repetir temas cobertos recentemente
