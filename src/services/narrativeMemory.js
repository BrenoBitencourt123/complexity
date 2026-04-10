// ═══════════════════════════════════════════════════
// narrativeMemory — Memória narrativa persistente (singleton no Supabase)
// Acumula temas cobertos, arcos, fase da audiência e ganchos aprovados
// para injetar contexto no CMO e no Estrategista.
// ═══════════════════════════════════════════════════

import { supabase } from '../lib/supabase.js';

const SINGLETON_ID = 'singleton';
const DIAS_EXPIRACAO_PROIBIDO = 30;

// ─── Busca o singleton ───
export async function getMemory() {
  const { data, error } = await supabase
    .from('narrative_memory')
    .select('*')
    .eq('id', SINGLETON_ID)
    .maybeSingle();
  if (error) {
    console.error('Erro ao buscar memória narrativa:', error);
    return null;
  }
  return data;
}

// ─── Faz upsert de campos específicos ───
export async function updateMemory(patch) {
  const { error } = await supabase
    .from('narrative_memory')
    .upsert({ id: SINGLETON_ID, ...patch, updated_at: new Date().toISOString() });
  if (error) console.error('Erro ao atualizar memória narrativa:', error);
}

// ─── Adiciona tema ao histórico (sem duplicar mesmo tema+data) ───
export async function addTemaCoberto(tema, formato, data, objetivo = 'crescimento', performanceScore = null) {
  const mem = await getMemory();
  if (!mem) return;
  const existing = mem.temas_cobertos || [];
  if (existing.some(t => t.tema === tema && t.data === data)) return;
  const next = [...existing, { tema, formato, data, objetivo, performance_score: performanceScore }];
  await updateMemory({ temas_cobertos: next });
}

// ─── Adiciona tema proibido (remove expirados automaticamente) ───
export async function addTemaProibido(tema) {
  const mem = await getMemory();
  if (!mem) return;
  const agora = new Date();
  const ativos = (mem.temas_proibidos || []).filter(t => {
    const dias = (agora - new Date(t.adicionado_em)) / 86400000;
    return dias < DIAS_EXPIRACAO_PROIBIDO;
  });
  if (ativos.some(t => t.tema === tema)) return;
  await updateMemory({ temas_proibidos: [...ativos, { tema, adicionado_em: agora.toISOString() }] });
}

// ─── Atualiza fase da audiência ───
export async function updateFaseAudiencia(fase) {
  await updateMemory({ fase_audiencia: fase });
}

// ─── Adiciona gancho aprovado (evita duplicata, mantém últimos 10) ───
export async function addGanchoAprovado(gancho) {
  const mem = await getMemory();
  const atual = mem?.ganchos_aprovados || [];
  if (atual.includes(gancho)) return;
  const novos = [...atual, gancho].slice(-10);
  await updateMemory({ ganchos_aprovados: novos });
}

// ─── Remove gancho aprovado ───
export async function removeGanchoAprovado(gancho) {
  const mem = await getMemory();
  const novos = (mem?.ganchos_aprovados || []).filter(g => g !== gancho);
  await updateMemory({ ganchos_aprovados: novos });
}

// ─── Cria novo arco narrativo ───
export async function createArco({ nome_arco, posts_planejados, proximo_passo }) {
  const mem = await getMemory();
  const atual = mem?.arcos_ativos || [];
  await updateMemory({ arcos_ativos: [...atual, { nome_arco, posts_planejados, proximo_passo, posts_feitos: 0 }] });
}

// ─── Registra +1 post feito num arco ───
export async function incrementArco(nomeArco) {
  const mem = await getMemory();
  const novos = (mem?.arcos_ativos || []).map(a =>
    a.nome_arco === nomeArco ? { ...a, posts_feitos: (a.posts_feitos || 0) + 1 } : a
  );
  await updateMemory({ arcos_ativos: novos });
}

// ─── Remove arco concluído ───
export async function removeArco(nomeArco) {
  const mem = await getMemory();
  const novos = (mem?.arcos_ativos || []).filter(a => a.nome_arco !== nomeArco);
  await updateMemory({ arcos_ativos: novos });
}

// ─── Gera string formatada para injeção nos prompts ───
export async function getContextoParaCMO() {
  const mem = await getMemory();
  if (!mem) return '';

  const agora = new Date();

  // ─── Ciclo de conversão: últimos 14 dias ───
  const recentes14 = (mem.temas_cobertos || []).filter(t => {
    const dias = (agora - new Date(t.data)) / 86400000;
    return dias <= 14;
  });
  // 'awareness' era objetivo legado — agora é tratado como crescimento
  const nCrescimento = recentes14.filter(t => t.objetivo === 'crescimento' || t.objetivo === 'awareness').length;
  const nMencaoSuave = recentes14.filter(t => t.objetivo === 'retencao').length;
  const nConversao = recentes14.filter(t => t.objetivo === 'conversao').length;
  const totalRecente = recentes14.length;
  const conversoesPrevistas = Math.floor(totalRecente / 10);
  const conversoesPendentes = Math.max(0, conversoesPrevistas - nConversao);
  const cicloMsg = conversoesPendentes > 0
    ? `CICLO (últimos 14 dias): ${nCrescimento} crescimento + ${nMencaoSuave} menção suave + ${nConversao} conversão → VOCÊ PODE/DEVE incluir ${conversoesPendentes} post(s) de conversão neste plano.`
    : `CICLO (últimos 14 dias): ${nCrescimento} crescimento + ${nMencaoSuave} menção suave + ${nConversao} conversão → equilibrado. Priorize crescimento agora.`;

  // ─── Métricas de conta ───
  const m = mem.metricas_conta || {};
  const metricasMsg = m.seguidores
    ? `MÉTRICAS DA CONTA: ${m.seguidores} seguidores | +${m.crescimento_semanal ?? '?'}% semana | ${m.taxa_engajamento ?? '?'}% engajamento`
    : '';

  // ─── Temas proibidos (remove expirados) ───
  const proibidosAtivos = (mem.temas_proibidos || []).filter(t => {
    const dias = (agora - new Date(t.adicionado_em)) / 86400000;
    return dias < DIAS_EXPIRACAO_PROIBIDO;
  });

  const recentes = (mem.temas_cobertos || [])
    .slice(-10)
    .map(t => `• ${t.tema} (${t.formato}, ${t.data}, objetivo: ${t.objetivo || '—'})`)
    .join('\n');

  const arcos = (mem.arcos_ativos || [])
    .map(a => `• ${a.nome_arco}: ${a.posts_feitos}/${a.posts_planejados} posts feitos — próximo: ${a.proximo_passo}`)
    .join('\n');

  const proibidos = proibidosAtivos.map(t => t.tema).join(', ');
  const ganchos = (mem.ganchos_aprovados || []).slice(-5).join(', ');

  return `MEMÓRIA NARRATIVA — contexto acumulado

FASE ATUAL DA AUDIÊNCIA: ${mem.fase_audiencia || 'awareness'}
${metricasMsg ? `${metricasMsg}\n` : ''}${cicloMsg}
${mem.notas_cmo ? `\nNOTAS DO CMO: ${mem.notas_cmo}` : ''}

ÚLTIMOS TEMAS COBERTOS (não repetir):
${recentes || 'Nenhum ainda.'}
${arcos ? `\nARCOS NARRATIVOS ATIVOS:\n${arcos}` : ''}

TEMAS PROIBIDOS nos próximos 30 dias: ${proibidos || 'nenhum'}
${ganchos ? `\nGANCHOS QUE PERFORMARAM BEM (use como referência de estilo):\n${ganchos}` : ''}`.trim();
}
