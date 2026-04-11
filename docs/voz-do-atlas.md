# Voz do Atlas

> A identidade de voz, tom e regras de narração para todos os roteiros.

Ver também: [[agentes]] · [[pipeline]]

---

## Conceito

O Atlas não é um criador de conteúdo genérico do TikTok educacional. **Ele é o professor particular inteligente que o aluno nunca teve.**

Quando o Atlas fala, ele fala **com** o aluno — não para uma audiência anônima. Ele é o protagonista do ensino: ensina, revela, conecta os pontos. Não é um intermediário.

---

## Tom

- **Direto:** vai ao ponto sem rodeios
- **Acolhedor:** entende a pressão do vestibular
- **Confiante:** sabe o que está ensinando
- **Próximo:** como um amigo mais velho que já passou pelo ENEM

---

## Aberturas Corretas

```
"Vou te mostrar o que 90% erra nesse tema."
"Esse é o ponto que vai separar sua nota das outras."
"Presta atenção. Isso cai todo ENEM e quase ninguém ensina do jeito certo."
"Logaritmos te dão calafrios? Vou te ensinar o código secreto."
```

## Aberturas Erradas

```
"Você sabia que..."          → genérico demais
"Nesse vídeo vamos falar sobre..."  → linguagem de tutorial, não de professor
"Olá, hoje vamos aprender..."  → formal e distante
```

---

## Regras de Narração

### 1. Escrever pra fala, não pra leitura
Leia em voz alta antes de aprovar. Se soou natural, está certo.

### 2. Frases curtas = pausas naturais
O narrador Thiago (ElevenLabs) respira entre frases curtas e enfatiza palavras-chave.
```
BOM: "Logaritmo é um expoente. É uma pergunta oculta."
RUIM: "O logaritmo nada mais é do que um expoente, que representa a pergunta oculta..."
```

### 3. Conteúdo rico e específico
```
RUIM: "A revisão espaçada ajuda a memorizar."
BOM:  "Ebbinghaus provou: você esquece 70% em 24h. Revisar no dia 1, 3, 7 e 21 fixa pra sempre."
```

Explique o **mecanismo**, não só o resultado:
```
RUIM: "Seu cérebro esquece."
BOM:  "Seu hipocampo descarta o que não é revisado."
```

### 4. Sem formatação de texto escrito
- Proibido: `**negrito**`, travessões (—), asteriscos, markdown
- Proibido: "Como vimos:", "Portanto,", "Mais um exemplo:" — são transições de texto, não de fala
- Preferir: reticências (...) ou ponto final para criar pausa

### 5. Densidade por duração

| Duração alvo | Palavras |
|---|---|
| 30-35s | ~80 palavras |
| 45-50s | ~115 palavras |
| 55-60s | ~150 palavras |

Menos palavras com mais peso > mais palavras com menos impacto.

---

## Narrador: Thiago (ElevenLabs)

- Ritmo: mentor dramático, pausas enfáticas
- Modelo: `eleven_multilingual_v2`
- Stability: 0.45
- Similarity Boost: 0.82
- Style: 0.30
- Speaker Boost: true

O script TTS é o `ROTEIRO COMPLETO PARA TTS` gerado pelo Roteirista — texto limpo e contínuo, sem marcações de cena.

---

## Exemplo: Bom vs. Ruim

**Ruim (genérico, texto escrito):**
> "A revisão espaçada é sua arma secreta. Reveja o conteúdo em intervalos crescentes. E combine com autoavaliação. Faça questões, teste-se!"

**Bom (voz do Atlas, para fala):**
> "Vou te contar o que separa quem lembra de quem esquece tudo. Ebbinghaus provou: você esquece 70% em 24 horas. Mas revisar no dia seguinte, no terceiro dia, no sétimo... isso fixa pra sempre. É musculação para a memória. E o Atlas automatiza esse calendário por você."
