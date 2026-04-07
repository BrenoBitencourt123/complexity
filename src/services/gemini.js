// ═══════════════════════════════════════════════════
// ATLAS AGENCY — Gemini API Client
// Model switching: Pro (agentes 1-2) / Flash (agentes 3-4)
// ═══════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

// ─── Preços por milhão de tokens (R$, câmbio ~5,70) ───
const PRECOS_POR_MODELO = {
  'gemini-2.5-pro':   { input: 7.125, output: 57.00 },
  'gemini-2.5-flash': { input: 0.855, output:  3.42 },
};

// ─── Acumulador de uso da sessão ───
let sessionUsage = { promptTokens: 0, outputTokens: 0, calls: 0, estimatedCostBRL: 0 };

export function getSessionUsage() {
  return { ...sessionUsage };
}

export function resetSessionUsage() {
  sessionUsage = { promptTokens: 0, outputTokens: 0, calls: 0, estimatedCostBRL: 0 };
}

function acumularUsage(modelName, usageMetadata) {
  if (!usageMetadata) return;
  const preco = PRECOS_POR_MODELO[modelName] || PRECOS_POR_MODELO['gemini-2.5-flash'];
  const prompt = usageMetadata.promptTokenCount || 0;
  const output = usageMetadata.candidatesTokenCount || 0;
  const custo = (prompt / 1_000_000) * preco.input + (output / 1_000_000) * preco.output;
  sessionUsage.promptTokens += prompt;
  sessionUsage.outputTokens += output;
  sessionUsage.calls += 1;
  sessionUsage.estimatedCostBRL += custo;
}

/**
 * Inicializa o client Gemini com a API key
 */
export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Retorna a instância inicializada do genAI
 */
export function getGenAI() {
  if (!genAI) throw new Error('Gemini não inicializado. API key ausente.');
  return genAI;
}

/**
 * Verifica se o Gemini está inicializado
 */
export function isGeminiReady() {
  return genAI !== null;
}

/**
 * Seleciona o modelo baseado no agente
 * Agentes 1-2 (Estrategista, Roteirista): gemini-2.5-pro → raciocínio estratégico
 * Agentes 3-4 (Diretor Visual, Distribuidor): gemini-2.5-flash → mais rápido, mecânico
 */
function getModelForAgent(_agentId) {
  return 'gemini-2.5-flash';
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

      // usageMetadata disponível após consumir o stream
      const response = await result.response;
      acumularUsage(modelName, response.usageMetadata);

      return fullText;
    } else {
      // Non-streaming mode
      const result = await model.generateContent(userMessage);
      acumularUsage(modelName, result.response.usageMetadata);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Responda apenas: ok');
    const text = result.response.text();
    return text.toLowerCase().includes('ok');
  } catch (error) {
    throw new Error(`Falha na conexão: ${error.message}`);
  }
}
