# Atlas Agency — Content Studio

> Sistema multiagente de produção de conteúdo para a marca Atlas ENEM.

## O Que É

Atlas Agency é uma aplicação web que automatiza a criação de pacotes completos de vídeos curtos (Reels, TikTok, Shorts) para a plataforma educacional **Atlas** — focada em preparação para o ENEM.

O sistema usa **4 agentes de IA sequenciais** (powered by Gemini 1.5) que transformam um tema em um pacote pronto para produção: estratégia → roteiro → direção visual → distribuição.

## Objetivo

Eliminar o gargalo criativo na produção de conteúdo educativo para redes sociais. Um produtor de conteúdo insere um tema, e o sistema entrega:

- Estratégia de conteúdo com ângulo viral
- Roteiro cena a cena com script para TTS (ElevenLabs)
- Prompts de imagem para cada cena (Opção A: API / Opção B: manual)
- Pacote de distribuição (títulos, descrições, hashtags por plataforma)
- Checklist de montagem final

## Stack Técnica

| Camada       | Tecnologia                      |
| ------------ | ------------------------------- |
| Framework    | React 19 + Vite 8               |
| IA           | Google Gemini 1.5 (Pro + Flash) |
| Estilo       | Vanilla CSS (Design System próprio) |
| Persistência | localStorage                    |
| Build        | Vite (ESModules)                |
| Linting      | ESLint 9                        |

## Marca Alvo

- **Produto:** Atlas — plataforma de preparação para o ENEM
- **Público:** Estudantes brasileiros 15–22 anos
- **Preço PRO:** R$49,90/mês
- **Tom:** Direto, encorajador, sem enrolação

## Links Internos

- [[arquitetura]] — Estrutura de pastas e decisões técnicas
- [[agentes]] — Detalhamento de cada agente do pipeline
- [[fluxo-estado]] — State machine completa do pipeline
- [[decisoes]] — Log de decisões técnicas importantes
