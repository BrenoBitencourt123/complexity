# Pipeline de Produção

> Fluxo completo de uma produção: do formulário ao pacote final.

Ver também: [[agentes]] · [[arquitetura]] · [[voz-do-atlas]]

---

## Visão Geral

```
StartForm
    ↓
Agente 1 — Estrategista    → review humano
    ↓ (aprovado)
Agente 2 — Roteirista      → QA invisível → review humano
    ↓ (aprovado)
Agente 3 — Diretor Visual  → review humano
    ↓ (aprovado)
Agente 4 — Distribuidor    → pacote final
    ↓
addTemaCoberto() → memória narrativa atualizada
```

---

## Estados do Pipeline

Definidos em `usePipeline.js`:

```
idle
  → starting
  → agent_1_running → agent_1_review
  → agent_2_running → agent_2_review
  → agent_3_running → agent_3_review
  → agent_4_running → agent_4_review
  → package_ready
```

Em cada `_review`, o usuário pode:
- **Aprovar** → dispara o próximo agente
- **Regenerar** → roda o mesmo agente novamente

---

## Comunicação Entre Agentes

Cada agente lê o output bruto do anterior via `rawOutputsRef` (ref do React, não state). Isso evita stale closure — o valor é sempre o mais recente independente de re-renders.

```js
rawOutputsRef.current = {
  estrategia: '...',  // YAML do Estrategista
  roteiro: '...',     // texto estruturado do Roteirista
  visuais: '...',     // blocos do Diretor Visual
  distribuicao: '...', // pacote do Distribuidor
}
```

> **Bug histórico corrigido:** o Roteirista salvava `finalRoteiro` só no React state, não na ref. O Diretor Visual lia da ref e recebia `null`. Corrigido com `rawOutputsRef.current.roteiro = finalRoteiro` antes do setState.

---

## Agente 2: QA Invisível

O Roteirista tem uma segunda etapa que o usuário não vê:

```
Gera roteiro inicial (com stream)
    ↓
QA Checker roda sem stream (rápido)
    ↓
Se status === 'reprovado_e_corrigido':
    usa roteiro_final do QA
Senão:
    usa roteiro inicial
    ↓
Exibe resultado para review
```

O QA verifica:
1. Aderência ao tema original
2. Funil correto (não vende quando objetivo é crescimento)
3. Qualidade do hook e ritmo do formato

---

## Agente 3: buildImagePrompt

O Diretor Visual gera apenas `IMAGEM_PT` — descrição em PT-BR do que deve aparecer na imagem. O estilo, câmera e regras de composição são injetados **em código** pelo `buildImagePrompt.js`:

```
IMAGEM_PT (gerado pelo LLM em PT-BR)
    +
estilo visual (extraído do YAML do Estrategista)
    +
enquadramento de câmera (baseado na posição da cena)
    +
regras fixas (composição, texto, fundo, proporção)
    ↓
prompt final pronto para API de imagem
```

Ver detalhes em [[estilos-visuais]].

---

## Finalização

Quando o Agente 4 é aprovado:

1. `addTemaCoberto(tema, formato, data, objetivo)` registra na memória narrativa
2. Estado muda para `package_ready`
3. Tela final exibe: cenas, script TTS, prompts de imagem, pacote de distribuição
