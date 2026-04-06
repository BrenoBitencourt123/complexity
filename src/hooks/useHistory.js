// ═══════════════════════════════════════════════════
// useHistory — CRUD de produções no localStorage
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { gerarId } from '../utils/formatters.js';

const STORAGE_KEY = 'atlas-agency-history';

export function useHistory() {
  const [producoes, setProducoes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(producoes));
    } catch (e) {
      console.warn('Erro ao salvar histórico:', e);
    }
  }, [producoes]);

  const criarProducao = useCallback((tema, objetivo) => {
    const nova = {
      id: gerarId(),
      tema,
      objetivo,
      status: 'rascunho',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      etapaAtual: 0,
      dados: {},
    };
    setProducoes(prev => [nova, ...prev]);
    return nova;
  }, []);

  const atualizarProducao = useCallback((id, updates) => {
    setProducoes(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, ...updates, atualizadoEm: new Date().toISOString() }
          : p
      )
    );
  }, []);

  const deletarProducao = useCallback((id) => {
    setProducoes(prev => prev.filter(p => p.id !== id));
  }, []);

  const getProducao = useCallback((id) => {
    return producoes.find(p => p.id === id);
  }, [producoes]);

  const alterarStatus = useCallback((id, novoStatus) => {
    atualizarProducao(id, { status: novoStatus });
  }, [atualizarProducao]);

  return {
    producoes,
    criarProducao,
    atualizarProducao,
    deletarProducao,
    getProducao,
    alterarStatus,
  };
}
