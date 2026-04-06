// ═══════════════════════════════════════════════════
// ATLAS AGENCY — Gemini API Client
// Model switching: Pro (agentes 1-2) / Flash (agentes 3-4)
// ═══════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

/**
 * Inicializa o client Gemini com a API key
 */
export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Verifica se o Gemini está inicializado
 */
export function isGeminiReady() {
  return genAI !== null;
}

/**
 * Seleciona o modelo baseado no agente
 * Agentes 1-2 (Estrategista, Roteirista): gemini-1.5-pro → raciocínio estratégico
 * Agentes 3-4 (Diretor Visual, Distribuidor): gemini-1.5-flash → mais rápido, mecânico
 */
function getModelForAgent(agentId) {
  const proAgents = ['estrategista', 'roteirista'];
  if (proAgents.includes(agentId)) {
    return 'gemini-1.5-pro';
  }
  return 'gemini-1.5-flash';
}

/**
 * Executa um agente com streaming
 * @param {string} agentId - ID do agente (estrategista, roteirista, diretor-visual, distribuidor)
 * @param {string} systemPrompt - System prompt do agente
 * @param {string} userMessage - Mensagem do usuário (inputs + context)
 * @param {function} onChunk - Callback para cada chunk de texto recebido
 * @returns {Promise<string>} - Resposta completa
 */
export async function runAgent(agentId, systemPrompt, userMessage, onChunk = null) {
  if (!genAI) {
    throw new Error('Gemini não inicializado. Configure sua API key.');
  }

  const modelName = getModelForAgent(agentId);

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: agentId === 'estrategista' ? 0.7 : 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });

  try {
    if (onChunk) {
      // Streaming mode
      const result = await model.generateContentStream(userMessage);
      let fullText = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          onChunk(text, fullText);
        }
      }

      return fullText;
    } else {
      // Non-streaming mode
      const result = await model.generateContent(userMessage);
      return result.response.text();
    }
  } catch (error) {
    console.error(`[Atlas Agency] Erro no agente ${agentId} (${modelName}):`, error);

    if (error.message?.includes('API_KEY')) {
      throw new Error('API key inválida. Verifique sua chave do Gemini.');
    }
    if (error.message?.includes('QUOTA')) {
      throw new Error('Cota da API excedida. Tente novamente em alguns minutos.');
    }
    if (error.message?.includes('SAFETY')) {
      throw new Error('Conteúdo bloqueado pelo filtro de segurança. Tente reformular o tema.');
    }

    throw new Error(`Erro ao executar agente ${agentId}: ${error.message}`);
  }
}

/**
 * Testa a conexão com a API
 */
export async function testConnection() {
  if (!genAI) {
    throw new Error('API key não configurada.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Responda apenas: ok');
    const text = result.response.text();
    return text.toLowerCase().includes('ok');
  } catch (error) {
    throw new Error(`Falha na conexão: ${error.message}`);
  }
}
