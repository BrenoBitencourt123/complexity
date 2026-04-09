// ═══════════════════════════════════════════════════
// ATLAS AGENCY — buildImagePrompt
// Portado de project-bridge/src/lib/buildImagePrompt.ts
// O LLM gera só o conteúdo (IMAGEM_PT em PT-BR).
// Este módulo aplica estilo, câmera e regras fixas em código.
// ═══════════════════════════════════════════════════

import { STYLE_SEEDS, ESTILO_PADRAO } from './constants.js';

// Câmera por posição semântica — igual ao bridge
const CAMERA_INSTRUCTIONS = {
  opening: 'Enquadramento: PLANO MÉDIO — mostre a pessoa ou elemento principal interagindo com o ambiente.',
  middle:  'Enquadramento: CLOSE-UP — foco em um único objeto, número ou símbolo-chave que represente esse momento.',
  closing: 'Enquadramento: VISÃO AMPLA — metáfora panorâmica ou visão de conjunto que sintetize o bloco.',
  final:   'Enquadramento: PERSPECTIVA CRIATIVA — composição diferente de tudo que veio antes.',
};

const POS_LABELS = {
  opening: 'ABERTURA',
  middle:  'MEIO',
  closing: 'FECHAMENTO',
  final:   'FINAL',
};

/**
 * Detecta palavras-chave na narração e retorna uma dica visual automática.
 * Portado de project-bridge/src/lib/buildImagePrompt.ts — detectVisualHint()
 */
function detectVisualHint(narracao) {
  if (!narracao) return '';
  const lower = narracao.toLowerCase();
  if (/dias?|semanas?|meses?|anos?|prazo|tempo|calendário/.test(lower))
    return 'Dica visual: elementos de passagem do tempo (calendário, relógio ou linha do tempo) como metáfora central.';
  if (/por cento|%|porcentagem|crescimento|número|dado|estatística/.test(lower))
    return 'Dica visual: dado numérico em destaque — gráfico de barras, barra de progresso ou fatia de pizza.';
  if (/erro|armadilha|ilusão|engano|perigo|cuidado|atenção/.test(lower))
    return 'Dica visual: lupa expondo verdade oculta ou armadilha sendo revelada.';
  if (/soma|total|acumulado|pilha|montanha|resultado|efeito/.test(lower))
    return 'Dica visual: elementos pequenos se acumulando — efeito bola de neve ou montanha crescente.';
  if (/transformação|evolução|mudança|antes|depois|virada/.test(lower))
    return 'Dica visual: contraste antes/depois ou linha divisória de transformação.';
  if (/comparação|diferença|versus|vs\.?|melhor|pior|escolha/.test(lower))
    return 'Dica visual: dois caminhos, opções ou resultados lado a lado.';
  if (/pessoa|alguém|ela|ele|trabalhador|profissional|estudante/.test(lower))
    return 'Dica visual: personagem expressivo representando a situação narrada em posição de destaque.';
  return '';
}

/**
 * Deriva posição semântica pelo índice (0-based).
 * Portado de project-bridge — deriveSubPosition()
 */
function deriveSubPosition(indiceCena, totalCenas) {
  if (totalCenas === 1) return 'opening';
  if (indiceCena === 0) return 'opening';
  if (totalCenas <= 3) return indiceCena === totalCenas - 1 ? 'closing' : 'middle';
  return indiceCena === totalCenas - 1 ? 'final' : 'middle';
}

/**
 * Monta o prompt final de imagem.
 * Equivalente ao buildImagePrompt() do project-bridge, adaptado para 9:16.
 *
 * @param {object} params
 * @param {string} params.imagePrompt  - Descrição visual em PT-BR (gerada pelo LLM — sem estilo nem câmera)
 * @param {string} [params.narracao]   - Texto narrado (usado para detectVisualHint)
 * @param {string} [params.styleName]  - 'padrao' | 'sketch' | 'impacto' | 'pintura'
 * @param {number} [params.indiceCena] - Índice 0-based da cena
 * @param {number} [params.totalCenas] - Total de cenas no episódio
 * @param {string} [params.formato]    - 'shorts' | 'carrossel' | 'stories'
 * @returns {string} Prompt completo pronto para enviar à API de imagem
 */
export function buildImagePrompt({
  imagePrompt,
  narracao = '',
  styleName = ESTILO_PADRAO,
  indiceCena = 0,
  totalCenas = 1,
  formato = 'shorts',
}) {
  const styleSeed = STYLE_SEEDS[styleName] || STYLE_SEEDS[ESTILO_PADRAO];
  const subPosition = deriveSubPosition(indiceCena, totalCenas);
  const camera = CAMERA_INSTRUCTIONS[subPosition];
  const visualHint = detectVisualHint(narracao);
  const posLabel = totalCenas > 1
    ? `[${POS_LABELS[subPosition]} — sub-cena ${indiceCena + 1} de ${totalCenas}] `
    : '';
  const proporcao = formato?.toLowerCase().includes('carrossel')
    ? '1:1 quadrado (1080x1080px) ou 4:5 (1080x1350px)'
    : '9:16 vertical (1080x1920px)';

  const lines = [
    styleSeed,
    '',
    `CENA: ${posLabel}${imagePrompt || ''}`,
    camera,
    visualHint,
    '',
    'COMPOSIÇÃO: Elemento principal centralizado, ocupando 60-70% do frame. Contexto de suporte nas bordas.',
    'TEXTO: Máximo 1-4 palavras visíveis em Português Brasileiro (PT-BR) — títulos ou rótulos curtos. Nunca transcrever frases completas da narração.',
    'FUNDO: Textura do papel do estilo mestre, leves linhas de esboço de contexto. Sem logotipos ou marcas.',
    `PROPORÇÃO: ${proporcao}`,
  ];

  // Remove linhas vazias duplicadas
  return lines
    .filter((l, i) => !(l === '' && lines[i - 1] === ''))
    .join('\n');
}
