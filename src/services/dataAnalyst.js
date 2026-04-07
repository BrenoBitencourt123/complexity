import { getGenAI } from './gemini.js';
import { ATLAS_BRAND } from '../utils/constants.js';
import { supabase } from '../lib/supabase.js';

/**
 * Analisa os dados crus de performance do usuário e gera um sumário de inteligência.
 * O resultado é salvo no Supabase para orientar o CMO (Content Planner).
 */
export async function analyzePerformanceData(rawData) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const systemPrompt = `Você é o CIENTISTA DE DADOS CHEFE E ANALISTA DE PERFORMANCE da marca: ${ATLAS_BRAND.nome} (${ATLAS_BRAND.descricao}).

SUA MISSÃO: Ler os dados de performance de redes sociais recentes da marca e extrair inteligência acionável.
Seu output ditará a estratégia de conteúdo da próxima quinzena.

REGRAS OBRIGATÓRIAS DE ANÁLISE:
1. FOCO NO ALGORITMO: Para TikTok/Shorts/Reels, observe as taxas de retenção e comentários. Para Stories, respostas a enquetes.
2. ENCONTRE PADRÕES: O que os vídeos que performaram bem têm em comum? (Gancho, dor do aluno abordada, duração).
3. APRENDA COM OS ERROS: O que "flopou"? Identifique e tire do foco da marca.

A saída deve ser RIGOROSAMENTE UM JSON VALIDADO com os seguintes campos:
{
  "conclusoes_matadoras": ["Conclusão 1", "Conclusão 2"],
  "formatos_em_alta": ["Formato 1", "Formato 2"],
  "topicos_quentes": ["Tema 1", "Tema 2", "Tema 3"],
  "o_que_evitar": ["Erro 1", "Erro 2"],
  "recomedacao_cmo": "Um parágrafo de estratégia nua e crua e direta para o Diretor de Marketing (neste caso, o Planner Diário) aplicar imediatamente para converter matrículas e atenção."
}`;

  const userPrompt = `Abaixo estão os dados crus dos conteúdos recentes da marca analisados do TikTok/Instagram/YouTube:
  
DADOS:
${rawData}

Gere seu Relatório de Inteligência de Performance APENAS NO FORMATO JSON solicitado acima, sem formatação \`\`\`json ou texto extra.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    
    const text = result.response.text();
    const parsedIntel = JSON.parse(text);
    
    // Salva na nuvem (Supabase)
    const { error } = await supabase
      .from('brand_intel')
      .insert([{
        raw_data: rawData,
        formatos_em_alta: parsedIntel.formatos_em_alta || [],
        topicos_quentes: parsedIntel.topicos_quentes || [],
        o_que_evitar: parsedIntel.o_que_evitar || [],
        recomedacao_cmo: parsedIntel.recomedacao_cmo || '',
      }]);

    if (error) {
      console.error('Falha ao salvar no banco Supabase:', error);
    }
    
    return parsedIntel;
  } catch (error) {
    console.error('Erro na analise de performance:', error);
    throw new Error('Falha ao processar dados de inteligência com a IA. Tente colar um formato mais limpo.');
  }
}

/**
 * Retorna O MAIS RECENTE relatório de performance salvo no DB na nuvem.
 */
export async function getCurrentIntel() {
  try {
    const { data, error } = await supabase
      .from('brand_intel')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }
    return data;
  } catch (error) {
    console.error("Supabase Error ao buscar Intel:", error);
    return null;
  }
}
