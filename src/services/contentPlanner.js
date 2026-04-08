import { getGenAI } from './gemini.js';
import { diasAteEnem, textoEnem } from '../utils/enem.js';
import { ATLAS_BRAND, PILARES_CONTEUDO } from '../utils/constants.js';
import { getCurrentIntel } from './dataAnalyst.js';
import { getContextoParaCMO } from './narrativeMemory.js';

const WEEK_DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// ─── Utilitário: datas da semana atual (Seg → Dom) ───
function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      data: d.toISOString().slice(0, 10),
      dia: WEEK_DAYS[d.getDay()],
      isToday: d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
    };
  });
}

/**
 * CMO Estratégico: gera o plano completo de 7 dias com total autonomia.
 * Decide frequência, formatos, horários e temas baseado no contexto da marca.
 */
export async function generateWeeklyPlan() {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const weekDates = getWeekDates();
  const [intel, memoriaCtx] = await Promise.all([
    getCurrentIntel(),
    getContextoParaCMO().catch(() => ''),
  ]);

  const intelBlock = intel
    ? `INTELIGÊNCIA DE PERFORMANCE (USE OBRIGATORIAMENTE):
- Formatos com alto engajamento: ${intel.formatos_em_alta?.join(', ') || '—'}
- Tópicos quentes: ${intel.topicos_quentes?.join(', ') || '—'}
- O que evitar: ${intel.o_que_evitar?.join(', ') || '—'}
- Recomendação do Cientista: ${intel.recomedacao_cmo || '—'}`
    : `FASE DA MARCA: Lançamento do zero. Prioridade máxima: crescimento orgânico e geração de confiança.`;

  const systemPrompt = `${memoriaCtx ? memoriaCtx + '\n\n---\n\n' : ''}Você é o CMO ESTRATÉGICO SÊNIOR da Atlas Agency.
Sua missão é montar o PLANO DE CONTEÚDO COMPLETO dos próximos 7 dias para a marca Atlas.

MARCA:
- Produto: ${ATLAS_BRAND.nome} — ${ATLAS_BRAND.tagline}
- Descrição: ${ATLAS_BRAND.descricao}
- Público: ${ATLAS_BRAND.publico}
- Tom: ${ATLAS_BRAND.tom}
- Dores: ${ATLAS_BRAND.doresPublico.join(' | ')}

PILARES DE CONTEÚDO:
${PILARES_CONTEUDO.map(p => `- ${p.nome}: ${p.angulo}`).join('\n')}

${intelBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINCÍPIOS INVIOLÁVEIS DO CMO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. AUTONOMIA TOTAL: Você decide tudo — frequência, formato, horário, tema. O cliente não decide.
2. FREQUÊNCIA VARIÁVEL: Cada dia pode ter entre 1 e 4 posts. Não é fixo. Pense estrategicamente.
3. MIX DE FORMATOS: Priorize Shorts (algoritmo de descoberta) > Carrossel (autoridade/salvamentos) > Stories (comunidade).
4. REGRA JAB/HOOK: A cada 3-4 posts de crescimento/valor, 1 de conversão direta. Nunca venda demais.
5. HORÁRIOS BRASILEIROS: Picos reais — 7h-9h (manhã de estudante), 12h-14h (almoço), 19h-22h (noite de semana).
6. NARRATIVA SEMANAL: Os posts da semana devem contar uma história coesa, não serem aleatórios.
7. FIM DE SEMANA LEVE: Sábado máx. 2 posts, Domingo máx. 1 (estudante descansa).
8. NÃO REPITA: Evite o mesmo formato em dias consecutivos. Varie temas entre os pilares.${memoriaCtx ? `
9. MEMÓRIA: NUNCA repita os temas proibidos listados na memória acima.
10. ARCOS: Se há arcos_ativos na memória, dê continuidade ao próximo passo descrito.
11. FASE: Calibre o mix conforme a fase_audiencia (awareness = mais crescimento, conversao = mais CTAs diretos).
12. GANCHOS: Use os ganchos_aprovados como referência de estilo e energia.` : ''}

FORMATOS PERMITIDOS: "Shorts", "Carrossel", "Stories"
OBJETIVOS PERMITIDOS: "crescimento", "conversao", "retencao", "awareness"

SAÍDA: JSON puro, sem markdown, seguindo EXATAMENTE este schema:
{
  "estrategia_semanal": "Parágrafo explicando a lógica da semana, temas e por que essa distribuição.",
  "total_posts": <número>,
  "mix": { "crescimento": <n>, "autoridade": <n>, "conversao": <n> },
  "dias": [
    {
      "dia": "Segunda-feira",
      "data": "YYYY-MM-DD",
      "narrativa": "Fio condutor deste dia específico",
      "tarefas": [
        {
          "horario": "HHhMM",
          "formato": "Shorts|Carrossel|Stories",
          "tema": "Título chamativo e concreto",
          "angulo": "Psicologia e diferencial desta abordagem",
          "objetivo": "crescimento|conversao|retencao|awareness",
          "pilar": "Nome do Pilar",
          "contextoExtra": "Instruções específicas para o roteirista"
        }
      ]
    }
  ]
}`;

  const userPrompt = `BRIEFING EXECUTIVO DA SEMANA

DATAS DA SEMANA:
${weekDates.map(d => `- ${d.dia} (${d.data})${d.isToday ? ' ← HOJE' : ''}`).join('\n')}

CONTEXTO ENEM: ${textoEnem()} (faltam ${diasAteEnem()} dias para o ENEM)

Monte o plano estratégico completo dos 7 dias. Retorne APENAS o JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Erro ao gerar plano semanal:', error);
    return generateWeeklyPlanFallback(weekDates);
  }
}

function generateWeeklyPlanFallback(weekDates) {
  const dates = weekDates || getWeekDates();
  const fallbackTasks = [
    [
      { horario: '08h00', formato: 'Carrossel', tema: 'O erro que 90% dos alunos comete no cronograma', angulo: 'Shock de realidade sobre método de estudo passivo', objetivo: 'crescimento', pilar: 'Dicas de Estudo', contextoExtra: 'Foco em salvamentos. Use bullet points claros.' },
      { horario: '19h30', formato: 'Shorts', tema: 'Por que você esquece tudo que estudou?', angulo: 'Neurociência da memória em 30 segundos', objetivo: 'crescimento', pilar: 'Dicas de Estudo', contextoExtra: 'Hook forte. Mostre o problema, não a solução.' },
    ],
    [
      { horario: '19h00', formato: 'Shorts', tema: 'Macete de Estequiometria que cai todo ENEM', angulo: 'Método visual que substitui 2h de aula', objetivo: 'retencao', pilar: 'Conteúdo de Matéria', contextoExtra: 'Mostre o cálculo sendo resolvido de forma visual.' },
    ],
    [
      { horario: '12h00', formato: 'Stories', tema: 'Qual matéria você mais tem medo na prova?', angulo: 'Enquete que vira pauta dos próximos posts', objetivo: 'awareness', pilar: 'Motivacional/Acolhimento', contextoExtra: 'Use enquete interativa. Responda os DMs.' },
      { horario: '19h30', formato: 'Shorts', tema: 'Isso é o que separa quem passa de quem não passa', angulo: 'Mentalidade vs. método — insight que muda perspectiva', objetivo: 'crescimento', pilar: 'Motivacional/Acolhimento', contextoExtra: 'Tom motivacional. Finalize com CTA suave.' },
    ],
    [
      { horario: '08h00', formato: 'Carrossel', tema: '5 questões de Redação que a IA do Atlas corrigiu hoje', angulo: 'Prova social de produto — conversão direta', objetivo: 'conversao', pilar: 'Feature PRO', contextoExtra: 'Mostre screenshots reais ou simulados da correção. CTA para Fundadores.' },
      { horario: '19h00', formato: 'Shorts', tema: 'Faltam X dias pro ENEM. O que fazer AGORA?', angulo: 'Urgência real baseada no calendário', objetivo: 'crescimento', pilar: 'Tendências ENEM', contextoExtra: `Use os ${diasAteEnem()} dias reais. Tom de urgência controlada.` },
    ],
    [
      { horario: '19h30', formato: 'Shorts', tema: 'Você está estudando do jeito errado', angulo: 'Provocação que gera comentários defensivos = alcance', objetivo: 'crescimento', pilar: 'Dicas de Estudo', contextoExtra: 'Título controverso mas verdadeiro. Explique o método correto no vídeo.' },
    ],
    [
      { horario: '10h00', formato: 'Carrossel', tema: 'Guia completo: Como estudar Redação em 30 dias', angulo: 'Conteúdo denso de autoridade para salvar e compartilhar', objetivo: 'retencao', pilar: 'Conteúdo de Matéria', contextoExtra: 'Sábado: aluno tem mais tempo para ler. Carrossel longo com valor denso.' },
    ],
    [
      { horario: '18h00', formato: 'Stories', tema: 'Semana encerrada — você avançou?', angulo: 'Reflexão de fim de semana + engajamento para semana seguinte', objetivo: 'retencao', pilar: 'Motivacional/Acolhimento', contextoExtra: 'Tom acolhedor. Sem venda. Pergunte sobre a semana deles.' },
    ],
  ];

  return {
    estrategia_semanal: 'Semana de lançamento. Foco em crescimento orgânico via Shorts e autoridade via Carrossel. Uma conversão direta na quinta-feira. Narrativa central: a diferença entre estudar muito e estudar certo.',
    total_posts: fallbackTasks.reduce((acc, d) => acc + d.length, 0),
    mix: { crescimento: 5, autoridade: 3, conversao: 1 },
    dias: dates.map((d, i) => ({
      dia: d.dia,
      data: d.data,
      narrativa: ['Estabelecer problema + autoridade', 'Conteúdo de matéria pura', 'Conexão emocional com o público', 'Converter + urgência ENEM', 'Provocação para alcance', 'Valor denso para fim de semana', 'Encerramento semanal'][i] || '',
      tarefas: fallbackTasks[i] || [],
    })),
  };
}
