// ═══════════════════════════════════════════════════
// useNarrativeMemory — Hook React para a memória narrativa
// Fonte de verdade: Supabase (tabela narrative_memory, singleton)
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import {
  getMemory,
  updateMemory,
  addTemaProibido,
  updateFaseAudiencia,
  addGanchoAprovado,
  removeGanchoAprovado,
  createArco,
  incrementArco,
  removeArco,
} from '../services/narrativeMemory.js';

export function useNarrativeMemory() {
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMemory = useCallback(async () => {
    setLoading(true);
    const data = await getMemory();
    setMemory(data);
    setLoading(false);
  }, []);

  useEffect(() => { refreshMemory(); }, [refreshMemory]);

  // ─── Troca a fase da audiência (optimistic update) ───
  const updateFase = useCallback(async (fase) => {
    await updateFaseAudiencia(fase);
    setMemory(prev => prev ? { ...prev, fase_audiencia: fase } : prev);
  }, []);

  // ─── Adiciona tema proibido e recarrega ───
  const addProibido = useCallback(async (tema) => {
    await addTemaProibido(tema);
    await refreshMemory();
  }, [refreshMemory]);

  // ─── Ganchos aprovados ───
  const addGancho = useCallback(async (gancho) => {
    await addGanchoAprovado(gancho);
    await refreshMemory();
  }, [refreshMemory]);

  const removeGancho = useCallback(async (gancho) => {
    await removeGanchoAprovado(gancho);
    await refreshMemory();
  }, [refreshMemory]);

  // ─── Arcos narrativos ───
  const novoArco = useCallback(async (arco) => {
    await createArco(arco);
    await refreshMemory();
  }, [refreshMemory]);

  const avancarArco = useCallback(async (nomeArco) => {
    await incrementArco(nomeArco);
    await refreshMemory();
  }, [refreshMemory]);

  const concluirArco = useCallback(async (nomeArco) => {
    await removeArco(nomeArco);
    await refreshMemory();
  }, [refreshMemory]);

  // ─── Reseta toda a memória para o estado inicial ───
  const resetMemory = useCallback(async () => {
    await updateMemory({
      temas_cobertos: [],
      arcos_ativos: [],
      ultimo_cta_por_canal: {},
      fase_audiencia: 'awareness',
      ganchos_aprovados: [],
      temas_proibidos: [],
      notas_cmo: '',
    });
    await refreshMemory();
  }, [refreshMemory]);

  return {
    memory,
    loading,
    updateFase,
    addProibido,
    addGancho,
    removeGancho,
    novoArco,
    avancarArco,
    concluirArco,
    resetMemory,
    refreshMemory,
  };
}
