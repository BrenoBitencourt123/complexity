// ═══════════════════════════════════════════════════
// useHistory — CRUD de produções via Supabase
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useHistory() {
  const [producoes, setProducoes] = useState([]);

  // Load inicial via Supabase
  useEffect(() => {
    async function loadProductions() {
      const { data, error } = await supabase
        .from('productions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setProducoes(data.map(d => ({
          id: d.id,
          tema: d.tema,
          objetivo: d.objetivo,
          formato: d.formato,
          status: d.metadata?.status || 'rascunho',
          criadoEm: d.created_at,
          atualizadoEm: d.created_at,
          dados: d.metadata?.dados || {}
        })));
      }
    }
    loadProductions();
  }, []);

  const criarProducao = useCallback((tema, objetivo, formato = 'Shorts') => {
    const nova = {
      id: crypto.randomUUID(), // Gera um UUID válido para o banco
      tema,
      objetivo,
      formato,
      status: 'rascunho',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      dados: {},
    };
    
    // Atualiza optimisticamente a UI
    setProducoes(prev => [nova, ...prev]);

    // Insere no banco em Background
    supabase.from('productions').insert([{
      id: nova.id,
      tema: nova.tema,
      objetivo: nova.objetivo,
      formato: nova.formato,
      metadata: { status: nova.status, dados: nova.dados }
    }]).then(({ error }) => {
      if (error) console.error("Erro ao salvar no Supabase:", error);
    });

    return nova;
  }, []);

  const atualizarProducao = useCallback((id, updates) => {
    setProducoes(prev => {
      const novoState = prev.map(p => {
        if (p.id === id) {
          const producaoAtualizada = { ...p, ...updates, atualizadoEm: new Date().toISOString() };
          
          // Dispara update no banco em background
          supabase.from('productions')
            .update({ metadata: { status: producaoAtualizada.status, dados: producaoAtualizada.dados } })
            .eq('id', id)
            .then(({ error }) => { if (error) console.error('Erro Update:', error) });
            
          return producaoAtualizada;
        }
        return p;
      });
      return novoState;
    });
  }, []);

  const deletarProducao = useCallback((id) => {
    setProducoes(prev => prev.filter(p => p.id !== id));
    
    supabase.from('productions')
      .delete()
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('Erro ao deletar:', error) });
  }, []);

  const getProducao = useCallback((id) => {
    return producoes.find(p => p.id === id);
  }, [producoes]);

  return {
    producoes,
    criarProducao,
    atualizarProducao,
    deletarProducao,
    getProducao,
  };
}
