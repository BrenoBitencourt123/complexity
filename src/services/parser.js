// ═══════════════════════════════════════════════════
// ATLAS AGENCY — Parser de outputs dos agentes
// ═══════════════════════════════════════════════════

/**
 * Parseia o output YAML do Estrategista
 */
export function parseEstrategia(texto) {
  try {
    const result = {};
    const campos = [
      'tema', 'angulo', 'objetivo', 'duracao_alvo',
      'duracao_segundos', 'estilo_visual', 'justificativa',
      'cenas_estimadas', 'hook_sugerido', 'cta_sugerido',
    ];

    for (const campo of campos) {
      const regex = new RegExp(`${campo}:\\s*"?([^"\\n]+)"?`, 'i');
      const match = texto.match(regex);
      if (match) {
        let valor = match[1].trim().replace(/^"/, '').replace(/"$/, '');
        // Converter números
        if (['duracao_segundos', 'cenas_estimadas'].includes(campo)) {
          valor = parseInt(valor, 10) || 0;
        }
        result[campo] = valor;
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao parsear estratégia:', error);
    return null;
  }
}

/**
 * Parseia as cenas do Roteirista
 */
export function parseCenas(texto) {
  try {
    const cenas = [];
    // Split por delimitadores de cena
    const blocos = texto.split(/━{4,}/);

    for (let i = 0; i < blocos.length; i++) {
      const bloco = blocos[i].trim();

      // Detectar header de cena
      const headerMatch = bloco.match(/CENA\s+(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)s?/i);
      if (headerMatch) {
        const cena = {
          numero: parseInt(headerMatch[1]),
          nome: headerMatch[2].trim(),
          duracaoHeader: parseInt(headerMatch[3]),
        };

        // Pegar o conteúdo da cena (próximo bloco)
        const conteudo = blocos[i + 1] || bloco;

        // Narração
        const narracaoMatch = conteudo.match(/NARRAÇÃO:\s*\n?"([^"]*(?:"[^"]*)*?)"/is);
        if (narracaoMatch) {
          cena.narracao = narracaoMatch[1].trim();
        }

        // Texto na tela
        const textoTelaMatch = conteudo.match(/TEXTO NA TELA:\s*\n?(.+?)(?=\n\n|\nEMOÇÃO|\nDURAÇÃO)/is);
        if (textoTelaMatch) {
          cena.textoNaTela = textoTelaMatch[1].trim();
        }

        // Emoção
        const emocaoMatch = conteudo.match(/EMOÇÃO\s*\/?\s*ENERGIA:\s*\n?(.+?)(?=\n\n|\nDURAÇÃO)/is);
        if (emocaoMatch) {
          cena.emocao = emocaoMatch[1].trim();
        }

        // Duração
        const duracaoMatch = conteudo.match(/DURAÇÃO:\s*(\d+)s?/i);
        if (duracaoMatch) {
          cena.duracao = parseInt(duracaoMatch[1]);
        } else {
          cena.duracao = cena.duracaoHeader;
        }

        if (cena.narracao || cena.textoNaTela) {
          cenas.push(cena);
        }
      }
    }

    return cenas;
  } catch (error) {
    console.error('Erro ao parsear cenas:', error);
    return [];
  }
}

/**
 * Extrai o script TTS do output do Roteirista
 */
export function parseTTS(texto) {
  try {
    const ttsMatch = texto.match(
      /ROTEIRO COMPLETO PARA TTS:\s*\n([\s\S]*?)(?=\nDURAÇÃO TOTAL|\n━|$)/i
    );
    if (ttsMatch) {
      return ttsMatch[1].trim();
    }

    // Fallback: tentar outra variação
    const altMatch = texto.match(
      /SCRIPT\s*(?:TTS|PARA\s*TTS):\s*\n([\s\S]*?)(?=\nDURAÇÃO|\nCENAS|\n━|$)/i
    );
    if (altMatch) {
      return altMatch[1].trim();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extrai duração total e número de cenas
 */
export function parseMetaRoteiro(texto) {
  const duracaoMatch = texto.match(/DURAÇÃO TOTAL\s*(?:ESTIMADA)?:\s*(\d+)s?/i);
  const cenasMatch = texto.match(/CENAS TOTAIS:\s*(\d+)/i);

  return {
    duracaoTotal: duracaoMatch ? parseInt(duracaoMatch[1]) : null,
    totalCenas: cenasMatch ? parseInt(cenasMatch[1]) : null,
  };
}

/**
 * Parseia os visuais do Diretor Visual — separa por cena
 */
export function parseVisuais(texto) {
  try {
    const visuais = [];
    // Split por headers de cena visual
    const blocos = texto.split(/━{4,}.*?VISUAL\s*—\s*CENA/i);

    for (let i = 1; i < blocos.length; i++) {
      const bloco = 'VISUAL — CENA' + blocos[i];

      const headerMatch = bloco.match(/CENA\s+(\d+)\s*\|\s*(.+)/i);
      if (!headerMatch) continue;

      const visual = {
        numero: parseInt(headerMatch[1]),
        nome: headerMatch[2].trim().replace(/━+$/, '').trim(),
      };

      // Descrição da cena
      const descMatch = bloco.match(/DESCRIÇÃO DA CENA:\s*\n([\s\S]*?)(?=───\s*OPÇÃO A|$)/i);
      if (descMatch) visual.descricao = descMatch[1].trim();

      // Opção A (tudo entre OPÇÃO A e OPÇÃO B)
      const opcaoAMatch = bloco.match(/OPÇÃO A[\s\S]*?───\s*\n([\s\S]*?)(?=───\s*OPÇÃO B|$)/i);
      if (opcaoAMatch) visual.opcaoA = opcaoAMatch[0].trim();

      // Alternativa: capturar Opção A de forma mais ampla
      if (!visual.opcaoA) {
        const altA = bloco.match(/OPÇÃO A[^─]*([\s\S]*?)(?=OPÇÃO B|$)/i);
        if (altA) visual.opcaoA = altA[0].trim();
      }

      // Opção B
      const opcaoBMatch = bloco.match(/OPÇÃO B[\s\S]*?───\s*\n([\s\S]*?)(?=━{4,}|$)/i);
      if (opcaoBMatch) visual.opcaoB = opcaoBMatch[0].trim();

      if (!visual.opcaoB) {
        const altB = bloco.match(/OPÇÃO B[^─]*([\s\S]*?)$/i);
        if (altB) visual.opcaoB = altB[0].trim();
      }

      visuais.push(visual);
    }

    return visuais;
  } catch (error) {
    console.error('Erro ao parsear visuais:', error);
    return [];
  }
}

/**
 * Extrai o guia de consistência visual
 */
export function parseConsistencia(texto) {
  try {
    const match = texto.match(
      /GUIA DE CONSISTÊNCIA VISUAL\s*━*\s*\n([\s\S]*?)$/i
    );
    if (match) {
      return match[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parseia o pacote de distribuição
 */
export function parseDistribuicao(texto) {
  try {
    const result = { tiktok: {}, instagram: {}, youtube: {}, geral: {} };

    // TikTok
    const tiktokSection = texto.match(/─+\s*TIKTOK\s*─+\s*\n([\s\S]*?)(?=─+\s*INSTAGRAM|$)/i);
    if (tiktokSection) {
      const s = tiktokSection[1];
      const titulo = s.match(/TÍTULO:\s*\n?(.+)/i);
      const desc = s.match(/DESCRIÇÃO:\s*\n?([\s\S]*?)(?=\nHASHTAGS|\n─|$)/i);
      const hashtags = s.match(/HASHTAGS\s*(?:TIKTOK)?:\s*\n?([\s\S]*?)(?=\n─|$)/i);

      result.tiktok = {
        titulo: titulo?.[1]?.trim() || '',
        descricao: desc?.[1]?.trim() || '',
        hashtags: hashtags?.[1]?.trim() || '',
      };
    }

    // Instagram
    const instaSection = texto.match(/─+\s*INSTAGRAM\s*(?:REELS)?\s*─+\s*\n([\s\S]*?)(?=─+\s*YOUTUBE|$)/i);
    if (instaSection) {
      const s = instaSection[1];
      const legenda = s.match(/LEGENDA\s*(?:COMPLETA)?:\s*\n?([\s\S]*?)(?=\nHASHTAGS|\n─|$)/i);
      const hashtags = s.match(/HASHTAGS\s*(?:INSTAGRAM)?:\s*\n?([\s\S]*?)(?=\n─|$)/i);

      result.instagram = {
        legenda: legenda?.[1]?.trim() || '',
        hashtags: hashtags?.[1]?.trim() || '',
      };
    }

    // YouTube
    const ytSection = texto.match(/─+\s*YOUTUBE\s*(?:SHORTS)?\s*─+\s*\n([\s\S]*?)(?=─+\s*GERAL|$)/i);
    if (ytSection) {
      const s = ytSection[1];
      const titulo = s.match(/TÍTULO:\s*\n?(.+)/i);
      const desc = s.match(/DESCRIÇÃO:\s*\n?([\s\S]*?)(?=\nTAGS|\n─|$)/i);
      const tags = s.match(/TAGS:\s*\n?([\s\S]*?)(?=\n─|$)/i);

      result.youtube = {
        titulo: titulo?.[1]?.trim() || '',
        descricao: desc?.[1]?.trim() || '',
        tags: tags?.[1]?.trim() || '',
      };
    }

    // Geral
    const geralSection = texto.match(/─+\s*GERAL\s*─+\s*\n([\s\S]*?)$/i);
    if (geralSection) {
      const s = geralSection[1];
      const horarios = s.match(/MELHOR HORÁRIO[\s\S]*?(?=\nTHUMBNAIL|$)/i);
      const thumbnail = s.match(/THUMBNAIL\s*(?:SUGERIDA)?:\s*\n?([\s\S]*?)(?=\nAVISO|$)/i);
      const aviso = s.match(/AVISO\s*(?:DE TENDÊNCIA)?:\s*\n?([\s\S]*?)$/i);

      result.geral = {
        horarios: horarios?.[0]?.trim() || '',
        thumbnail: thumbnail?.[1]?.trim() || '',
        avisoTendencia: aviso?.[1]?.trim() || '',
      };
    }

    return result;
  } catch (error) {
    console.error('Erro ao parsear distribuição:', error);
    return null;
  }
}
