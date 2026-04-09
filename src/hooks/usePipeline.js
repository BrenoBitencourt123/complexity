// ═══════════════════════════════════════════════════
// usePipeline — State Machine do Pipeline de Produção
// ═══════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { runAgent, resetSessionUsage } from '../services/gemini.js';
import {
  promptEstrategista,
  promptRoteirista,
  promptDiretorVisual,
  promptDistribuidor,
} from '../services/prompts.js';
import { getContextoParaCMO, addTemaCoberto } from '../services/narrativeMemory.js';

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
    formato: '',
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

export function usePipeline({ onAgentComplete } = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const abortRef = useRef(false);
  // Refs: sempre contêm o valor mais recente sem stale closure
  const inputsRef = useRef(INITIAL_STATE.inputs);
  const rawOutputsRef = useRef(INITIAL_STATE.rawOutputs);
  const estiloForcadoRef = useRef('AUTO');

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
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

      // Atualiza ref de rawOutputs imediatamente para os próximos agentes lerem sem stale closure
      rawOutputsRef.current = { ...rawOutputsRef.current, [outputKey]: resultado };

      onAgentComplete?.();

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

    // Lê da ref — sempre tem o valor mais recente, sem stale closure
    const inputs = inputsRef.current;
    const temaOriginal = inputs.tema;

    const narrativaContexto = await getContextoParaCMO().catch(() => '');

    await executarAgente(
      'estrategista',
      promptEstrategista,
      { ...inputs, dataAtual, narrativaContexto },
      'estrategia',
      0,
      (text) => {
        const parsed = parseEstrategia(text);
        if (parsed && temaOriginal) parsed.tema = temaOriginal;
        // Override do estilo se o usuário forçou manualmente
        const forcado = estiloForcadoRef.current;
        if (forcado && forcado !== 'AUTO' && parsed) {
          parsed.estilo_visual = forcado;
        }
        return { estrategia: parsed };
      }
    );

    // Patch no raw YAML para que o Diretor Visual também receba o estilo forçado
    const forcado = estiloForcadoRef.current;
    if (forcado && forcado !== 'AUTO' && rawOutputsRef.current.estrategia) {
      rawOutputsRef.current.estrategia = rawOutputsRef.current.estrategia.replace(
        /estilo_visual:\s*"?[^\n"]+/i,
        `estilo_visual: "${forcado}"`
      );
    }
  }, [executarAgente]);

  // ─── Executar Agente 2: Roteirista + Revisor (QA) ───
  const executarRoteirista = useCallback(async () => {
    const { parseCenas, parseTTS, parseMetaRoteiro } = await import('../services/parser.js');
    const { promptRevisor } = await import('../services/prompts.js');

    if (!rawOutputsRef.current.estrategia) {
      updateState({ status: 'agent_2_review', isStreaming: false, error: 'Estratégia não disponível. Aprove o Agente 1 primeiro.' });
      return;
    }

    abortRef.current = false;
    updateState({
      status: `agent_2_running`,
      currentStep: 1,
      isStreaming: true,
      streamingText: '',
      error: null,
    });

    try {
      const { system, user } = promptRoteirista({ estrategia: rawOutputsRef.current.estrategia });

      // Passo 1: Gera roteiro com stream
      let roteiroInicial = await runAgent('roteirista', system, user, (chunk, fullText) => {
        if (abortRef.current) return;
        setState(prev => ({ ...prev, streamingText: fullText }));
      });

      if (abortRef.current) return;

      // Passo 2: QA Checker (Invisível)
      setState(prev => ({ ...prev, streamingText: roteiroInicial + '\n\n[🔄 Revisor QA: Auditando a aderência ao funil...]' }));

      const qaPrompt = promptRevisor({ estrategia: rawOutputsRef.current.estrategia, roteiro: roteiroInicial });
      const qaResultText = await runAgent('roteirista', qaPrompt.system, qaPrompt.user, null); // runs without stream to be fast
      
      let finalRoteiro = roteiroInicial;
      try {
        const jsonMatch = qaResultText.match(/\{[\s\S]*\}/);
        const qaJson = JSON.parse(jsonMatch ? jsonMatch[0] : qaResultText);
        if (qaJson.status === 'reprovado_e_corrigido' && qaJson.roteiro_final) {
          finalRoteiro = qaJson.roteiro_final;
          console.log('[QA] Roteiro consertado automaticamente. Motivo: ', qaJson.motivo);
        } else {
          console.log('[QA] Roteiro aprovado de primeira! Motivo: ', qaJson.motivo);
        }
      } catch (err) {
        console.error('[QA] Falha ao processar JSON da revisão', err);
      }

      if (abortRef.current) return;

      const parsed = {
        cenas: parseCenas(finalRoteiro),
        tts: parseTTS(finalRoteiro),
        metaRoteiro: parseMetaRoteiro(finalRoteiro),
      };

      setState(prev => ({
        ...prev,
        status: `agent_2_review`,
        isStreaming: false,
        streamingText: '',
        rawOutputs: {
          ...prev.rawOutputs,
          roteiro: finalRoteiro,
        },
        parsedOutputs: {
          ...prev.parsedOutputs,
          ...parsed,
        },
      }));
    } catch (error) {
      if (abortRef.current) return;
      updateState({
        status: `agent_2_review`,
        isStreaming: false,
        error: error.message,
      });
    }
  }, [updateState]);

  // ─── Executar Agente 3: Diretor Visual ───
  const executarDiretorVisual = useCallback(async () => {
    const { parseVisuais, parseConsistencia } = await import('../services/parser.js');
    const { buildImagePrompt } = await import('../utils/buildImagePrompt.js');

    // Extrai estilo e formato da estratégia salva
    const estrategiaRaw = rawOutputsRef.current.estrategia || '';
    const estiloMatch  = estrategiaRaw.match(/estilo_visual:\s*["']?(\w+)["']?/i);
    const formatoMatch = estrategiaRaw.match(/formato_imposto:\s*["']?(\w+)["']?/i);
    const estilo  = estiloMatch?.[1]?.toLowerCase() || 'padrao';
    const formato = formatoMatch?.[1]?.toLowerCase() || 'shorts';

    await executarAgente(
      'diretor-visual',
      promptDiretorVisual,
      { roteiro: rawOutputsRef.current.roteiro },
      'visuais',
      2,
      (text) => {
        const parsed = parseVisuais(text);
        const total = parsed.length;
        const visuais = parsed.map((v, idx) => ({
          ...v,
          opcaoA: buildImagePrompt({
            imagePrompt: v.imagePrompt,
            narracao:    v.narracao,
            styleName:   estilo,
            indiceCena:  idx,
            totalCenas:  total,
            formato,
          }),
        }));
        return { visuais, consistencia: parseConsistencia(text) };
      }
    );
  }, [executarAgente]);

  // ─── Executar Agente 4: Distribuidor ───
  const executarDistribuidor = useCallback(async () => {
    const { parseDistribuicao } = await import('../services/parser.js');

    await executarAgente(
      'distribuidor',
      promptDistribuidor,
      {
        estrategia: rawOutputsRef.current.estrategia,
        roteiro: rawOutputsRef.current.roteiro,
      },
      'distribuicao',
      3,
      (text) => ({ distribuicao: parseDistribuicao(text) })
    );
  }, [executarAgente]);

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
      // Registra tema na memória narrativa em background
      const inputs = inputsRef.current;
      addTemaCoberto(
        inputs.tema,
        inputs.formato || 'Shorts',
        new Date().toISOString().slice(0, 10)
      ).catch(() => {});

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
    updateState({ error: null });
    runners[stepIndex]();
  }, [executarEstrategista, executarRoteirista, executarDiretorVisual, executarDistribuidor, updateState]);

  // ─── Reset ───
  const reset = useCallback(() => {
    abortRef.current = true;
    resetSessionUsage();
    inputsRef.current = INITIAL_STATE.inputs;
    rawOutputsRef.current = INITIAL_STATE.rawOutputs;
    setState(INITIAL_STATE);
  }, []);

  // ─── Restaurar estado salvo (carrega produção do histórico sem chamar API) ───
  const restaurar = useCallback((dados) => {
    const inputs = dados.inputs || INITIAL_STATE.inputs;
    const rawOutputs = dados.rawOutputs || INITIAL_STATE.rawOutputs;
    inputsRef.current = inputs;
    rawOutputsRef.current = rawOutputs;
    setState({
      ...INITIAL_STATE,
      status: dados.pipelineStatus || 'package_ready',
      currentStep: dados.currentStep ?? -1,
      inputs,
      rawOutputs,
      parsedOutputs: dados.parsedOutputs || INITIAL_STATE.parsedOutputs,
    });
  }, []);

  // ─── Iniciar o pipeline (formulário → agente 1) ───
  const iniciar = useCallback((tema, objetivo, contextoExtra, formato, estiloForcado = 'AUTO') => {
    const novoInputs = { tema, objetivo, contextoExtra, formato };
    // Atualiza ref imediatamente — sem depender do ciclo de render do React
    inputsRef.current = novoInputs;
    estiloForcadoRef.current = estiloForcado;
    setState(prev => ({
      ...INITIAL_STATE,
      inputs: novoInputs,
    }));
    setTimeout(() => {
      executarEstrategista();
    }, 100);
  }, [executarEstrategista]);

  // ─── Troca estilo visual após revisão do Agente 1 ───
  const setEstiloVisual = useCallback((estilo) => {
    setState(prev => ({
      ...prev,
      parsedOutputs: {
        ...prev.parsedOutputs,
        estrategia: prev.parsedOutputs.estrategia
          ? { ...prev.parsedOutputs.estrategia, estilo_visual: estilo }
          : prev.parsedOutputs.estrategia,
      },
    }));
    if (rawOutputsRef.current.estrategia) {
      rawOutputsRef.current.estrategia = rawOutputsRef.current.estrategia.replace(
        /estilo_visual:\s*"?[^\n"]+/i,
        `estilo_visual: "${estilo}"`
      );
    }
  }, []);

  return {
    ...state,
    iniciar,
    restaurar,
    executarEstrategista,
    aprovarStep,
    regenerarStep,
    reset,
    setEstiloVisual,
  };
}
