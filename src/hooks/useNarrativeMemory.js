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

  return { memory, loading, updateFase, addProibido, resetMemory, refreshMemory };
}
