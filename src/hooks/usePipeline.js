// ═══════════════════════════════════════════════════
// usePipeline — State Machine do Pipeline de Produção
// ═══════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { runAgent } from '../services/gemini.js';
import {
  promptEstrategista,
  promptRoteirista,
  promptDiretorVisual,
  promptDistribuidor,
} from '../services/prompts.js';

/**
 * Estados do pipeline:
 * idle → starting → agent_1_running → agent_1_review
 *   → agent_2_running → agent_2_review
 *   → agent_3_running → agent_3_review
 *   → agent_4_running → agent_4_review
 *   → package_ready
 */

const INITIAL_STATE = {
  status: 'idle',
  currentStep: -1,   // -1 = formulário, 0-3 = agentes
  error: null,
  isStreaming: false,
  streamingText: '',

  // Inputs
  inputs: {
    tema: '',
    objetivo: '',
    contextoExtra: '',
  },

  // Outputs brutos (texto completo)
  rawOutputs: {
    estrategia: null,
    roteiro: null,
    visuais: null,
    distribuicao: null,
  },

  // Outputs parseados
  parsedOutputs: {
    estrategia: null,
    cenas: null,
    tts: null,
    metaRoteiro: null,
    visuais: null,
    consistencia: null,
    distribuicao: null,
  },
};

export function usePipeline() {
  const [state, setState] = useState(INITIAL_STATE);
  const abortRef = useRef(false);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ─── Iniciar produção ───
  const iniciarProducao = useCallback((tema, objetivo, contextoExtra) => {
    setState({
      ...INITIAL_STATE,
      status: 'starting',
      currentStep: -1,
      inputs: { tema, objetivo, contextoExtra },
    });
  }, []);

  // ─── Executar um agente ───
  const executarAgente = useCallback(async (
    agentId,
    promptFn,
    promptArgs,
    outputKey,
    stepIndex,
    parseFn
  ) => {
    abortRef.current = false;

    updateState({
      status: `agent_${stepIndex + 1}_running`,
      currentStep: stepIndex,
      isStreaming: true,
      streamingText: '',
      error: null,
    });

    try {
      const { system, user } = promptFn(promptArgs);

      const resultado = await runAgent(
        agentId,
        system,
        user,
        (chunk, fullText) => {
          if (abortRef.current) return;
          setState(prev => ({
            ...prev,
            streamingText: fullText,
          }));
        }
      );

      if (abortRef.current) return;

      const parsed = parseFn ? parseFn(resultado) : resultado;

      setState(prev => ({
        ...prev,
        status: `agent_${stepIndex + 1}_review`,
        isStreaming: false,
        streamingText: '',
        rawOutputs: {
          ...prev.rawOutputs,
          [outputKey]: resultado,
        },
        parsedOutputs: {
          ...prev.parsedOutputs,
          ...(typeof parsed === 'object' && parsed !== null ? parsed : { [outputKey]: parsed }),
        },
      }));
    } catch (error) {
      if (abortRef.current) return;
      updateState({
        status: `agent_${stepIndex + 1}_review`,
        isStreaming: false,
        error: error.message,
      });
    }
  }, [updateState]);

  // ─── Executar Agente 1: Estrategista ───
  const executarEstrategista = useCallback(async () => {
    const { parseEstrategia } = await import('../services/parser.js');
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    await executarAgente(
      'estrategista',
      promptEstrategista,
      { ...state.inputs, dataAtual },
      'estrategia',
      0,
      (text) => ({ estrategia: parseEstrategia(text) })
    );
  }, [executarAgente, state.inputs]);

  // ─── Executar Agente 2: Roteirista ───
  const executarRoteirista = useCallback(async () => {
    const { parseCenas, parseTTS, parseMetaRoteiro } = await import('../services/parser.js');

    await executarAgente(
      'roteirista',
      promptRoteirista,
      { estrategia: state.rawOutputs.estrategia },
      'roteiro',
      1,
      (text) => ({
        cenas: parseCenas(text),
        tts: parseTTS(text),
        metaRoteiro: parseMetaRoteiro(text),
      })
    );
  }, [executarAgente, state.rawOutputs.estrategia]);

  // ─── Executar Agente 3: Diretor Visual ───
  const executarDiretorVisual = useCallback(async () => {
    const { parseVisuais, parseConsistencia } = await import('../services/parser.js');

    await executarAgente(
      'diretor-visual',
      promptDiretorVisual,
      {
        estrategia: state.rawOutputs.estrategia,
        roteiro: state.rawOutputs.roteiro,
      },
      'visuais',
      2,
      (text) => ({
        visuais: parseVisuais(text),
        consistencia: parseConsistencia(text),
      })
    );
  }, [executarAgente, state.rawOutputs]);

  // ─── Executar Agente 4: Distribuidor ───
  const executarDistribuidor = useCallback(async () => {
    const { parseDistribuicao } = await import('../services/parser.js');

    await executarAgente(
      'distribuidor',
      promptDistribuidor,
      {
        estrategia: state.rawOutputs.estrategia,
        roteiro: state.rawOutputs.roteiro,
      },
      'distribuicao',
      3,
      (text) => ({ distribuicao: parseDistribuicao(text) })
    );
  }, [executarAgente, state.rawOutputs]);

  // ─── Aprovar step e avançar ───
  const aprovarStep = useCallback((stepIndex) => {
    const runners = [
      executarEstrategista,
      executarRoteirista,
      executarDiretorVisual,
      executarDistribuidor,
    ];

    const nextStep = stepIndex + 1;

    if (nextStep < 4) {
      runners[nextStep]();
    } else {
      updateState({
        status: 'package_ready',
        currentStep: 4,
      });
    }
  }, [executarEstrategista, executarRoteirista, executarDiretorVisual, executarDistribuidor, updateState]);

  // ─── Regenerar step ───
  const regenerarStep = useCallback((stepIndex) => {
    const runners = [
      executarEstrategista,
      executarRoteirista,
      executarDiretorVisual,
      executarDistribuidor,
    ];
    runners[stepIndex]();
  }, [executarEstrategista, executarRoteirista, executarDiretorVisual, executarDistribuidor]);

  // ─── Cancelar ───
  const cancelar = useCallback(() => {
    abortRef.current = true;
    setState(INITIAL_STATE);
  }, []);

  // ─── Reset ───
  const reset = useCallback(() => {
    abortRef.current = true;
    setState(INITIAL_STATE);
  }, []);

  // ─── Iniciar o pipeline (formulário → agente 1) ───
  const iniciar = useCallback((tema, objetivo, contextoExtra) => {
    setState(prev => ({
      ...INITIAL_STATE,
      inputs: { tema, objetivo, contextoExtra },
    }));
    // Pequeno delay para state atualizar
    setTimeout(() => {
      executarEstrategista();
    }, 100);
  }, [executarEstrategista]);

  return {
    ...state,
    iniciar,
    iniciarProducao,
    executarEstrategista,
    aprovarStep,
    regenerarStep,
    cancelar,
    reset,
    updateState,
  };
}
