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
export async function addTemaCoberto(tema, formato, data, performanceScore = null) {
  const mem = await getMemory();
  if (!mem) return;
  const existing = mem.temas_cobertos || [];
  if (existing.some(t => t.tema === tema && t.data === data)) return;
  const next = [...existing, { tema, formato, data, performance_score: performanceScore }];
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

// ─── Gera string formatada para injeção nos prompts ───
export async function getContextoParaCMO() {
  const mem = await getMemory();
  if (!mem) return '';

  const agora = new Date();
  const proibidosAtivos = (mem.temas_proibidos || []).filter(t => {
    const dias = (agora - new Date(t.adicionado_em)) / 86400000;
    return dias < DIAS_EXPIRACAO_PROIBIDO;
  });

  const recentes = (mem.temas_cobertos || [])
    .slice(-10)
    .map(t => `• ${t.tema} (${t.formato}, ${t.data})`)
    .join('\n');

  const arcos = (mem.arcos_ativos || [])
    .map(a => `• ${a.nome_arco}: ${a.posts_feitos}/${a.posts_planejados} posts feitos — próximo: ${a.proximo_passo}`)
    .join('\n');

  const proibidos = proibidosAtivos.map(t => t.tema).join(', ');
  const ganchos = (mem.ganchos_aprovados || []).slice(-5).join(', ');

  return `MEMÓRIA NARRATIVA — contexto acumulado

FASE ATUAL DA AUDIÊNCIA: ${mem.fase_audiencia || 'awareness'}
${mem.notas_cmo ? `NOTAS DO CMO: ${mem.notas_cmo}\n` : ''}ÚLTIMOS TEMAS COBERTOS (não repetir):
${recentes || 'Nenhum ainda.'}
${arcos ? `\nARCOS NARRATIVOS ATIVOS:\n${arcos}\n` : ''}
TEMAS PROIBIDOS nos próximos 30 dias: ${proibidos || 'nenhum'}
${ganchos ? `\nGANCHOS QUE PERFORMARAM BEM (use como referência de estilo):\n${ganchos}` : ''}`.trim();
}
