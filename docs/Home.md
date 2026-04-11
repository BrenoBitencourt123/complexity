# Atlas Agency — Documentação

> Sistema multi-agente de produção de conteúdo educacional para o Atlas (app ENEM).

---

## Módulos

| Módulo | Descrição |
|---|---|
| [[arquitetura]] | Estrutura de pastas, camadas e stack técnica |
| [[pipeline]] | O fluxo de produção de ponta a ponta |
| [[agentes]] | Os 4 agentes + QA: inputs, outputs e prompts |
| [[planner]] | CMO Estratégico e regras 70/20/10 |
| [[memoria-narrativa]] | Como o sistema aprende e acumula contexto |
| [[inteligencia]] | Cientista de Dados e loop de performance |
| [[estilos-visuais]] | Estilos de imagem e buildImagePrompt |
| [[banco-de-dados]] | Tabelas Supabase e schema |
| [[voz-do-atlas]] | Identidade de voz, tom e regras de narração |

---

## Fluxo Resumido

```
Performance real
      ↓
Cientista analisa → Memória narrativa atualizada
      ↓
CMO planeja semana (70/20/10 + ciclo + métricas)
      ↓
Estrategista → Roteirista + QA → Diretor Visual → Distribuidor
      ↓
Pacote: roteiro + prompts de imagem + copy de distribuição
      ↓
Publica → performance real → loop fecha
```

---

## Stack

- **Frontend:** React + Vite + JavaScript
- **LLM:** Google Gemini 2.5 Flash
- **Banco:** Supabase (PostgreSQL)
- **Voz:** ElevenLabs (narrador Thiago)
- **Imagem:** Prompt gerado, API externa (Flux / DALL-E / Ideogram)
