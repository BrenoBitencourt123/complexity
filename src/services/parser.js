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
      'cenas_estimadas', 'laminas_estimadas', 'telas_estimadas',
      'formato_imposto', 'hook_sugerido', 'cta_sugerido',
    ];

    for (const campo of campos) {
      const regex = new RegExp(`${campo}:\\s*"?([^"\\n]+)"?`, 'i');
      const match = texto.match(regex);
      if (match) {
        let valor = match[1].trim().replace(/^"/, '').replace(/"$/, '');
        // Converter números
        if (['duracao_segundos', 'cenas_estimadas', 'laminas_estimadas', 'telas_estimadas'].includes(campo)) {
          valor = parseInt(valor, 10) || 0;
        }
        result[campo] = valor;
      }
    }

    // Fix: duracao_segundos pode não ser gerado pelo LLM — extrair de duracao_alvo
    if (!result.duracao_segundos && result.duracao_alvo) {
      const numeros = result.duracao_alvo.match(/\d+/g);
      if (numeros) {
        const vals = numeros.map(Number);
        result.duracao_segundos = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao parsear estratégia:', error);
    return null;
  }
}

/**
 * Parseia as cenas do Roteirista (Ou Lâminas/Telas)
 */
export function parseCenas(texto) {
  try {
    const cenas = [];
    const blocos = texto.split(/━{4,}/);

    for (let i = 0; i < blocos.length; i++) {
      const bloco = blocos[i].trim();

      // Detectar header de cena/lâmina/tela
      const headerMatch = bloco.match(/(?:CENA|LÂMINA|TELA)\s+(\d+)\s*\|\s*(.+?)(?:\s*\|\s*(\d+)s?)?(?=\n|$)/i);
      if (headerMatch) {
        const cena = {
          numero: parseInt(headerMatch[1]),
          nome: headerMatch[2].trim(),
          duracaoHeader: headerMatch[3] ? parseInt(headerMatch[3]) : null,
        };

        const conteudo = blocos[i + 1] || bloco;

        const narracaoMatch = conteudo.match(/(?:NARRAÇÃO|CONTEÚDO):\s*\n?"?([^"]*(?:"[^"]*)*?)"?(?=\n\n|\nTEXTO|\nEMOÇÃO|\nDURAÇÃO|$)/is);
        if (narracaoMatch) cena.narracao = narracaoMatch[1].trim();

        const textoTelaMatch = conteudo.match(/(?:TEXTO NA TELA|TÍTULO NA IMAGEM):\s*\n?([\s\S]+?)(?=\n\n|\nEMOÇÃO|\nDURAÇÃO|$)/is);
        if (textoTelaMatch) cena.textoNaTela = textoTelaMatch[1].trim();

        const emocaoMatch = conteudo.match(/EMOÇÃO\s*\/?\s*ENERGIA:\s*\n?([\s\S]+?)(?=\n\n|\nDURAÇÃO|$)/is);
        if (emocaoMatch) cena.emocao = emocaoMatch[1].trim();

        const duracaoMatch = conteudo.match(/DURAÇÃO:\s*(\d+)s?/i);
        if (duracaoMatch) cena.duracao = parseInt(duracaoMatch[1]);
        else cena.duracao = cena.duracaoHeader || 5; // Fallback para visuais sem narração

        if (cena.narracao || cena.textoNaTela) cenas.push(cena);
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

    // Localiza cada header "VISUAL — CENA XX | NOME" diretamente, sem depender
    // do tipo de separador que o LLM gerou (━, ─, —, etc.) e com | opcional.
    // Flag 'm' garante que ^ só bate no início de linha, evitando falsos matches no conteúdo.
    const headerRegex = /^VISUAL\s*[—–\-]{1,3}\s*CENA\s+(\d+)\s*[|:]?\s*([^\n]+)/gim;
    const positions = [];
    let m;
    while ((m = headerRegex.exec(texto)) !== null) {
      positions.push({
        start: m.index,
        num: parseInt(m[1]),
        nome: m[2].trim().replace(/[━─—\-\s]+$/, ''),
      });
    }

    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].start;
      const end = i + 1 < positions.length ? positions[i + 1].start : texto.length;
      const bloco = texto.slice(start, end);

      const visual = { numero: positions[i].num, nome: positions[i].nome };

      // Descrição da cena — para antes de OPÇÃO A/B ou de qualquer separador
      const descMatch = bloco.match(/DESCRIÇÃO DA CENA[^:]*:\s*\n([\s\S]*?)(?=\s*[-—–]{2,}\s*OPÇÃO|\s*OPÇÃO [AB]|$)/i);
      if (descMatch) visual.descricao = descMatch[1].trim();

      // opcaoA / opcaoB — aceita variações como "—— OPÇÃO A ——", "OPÇÃO A:", etc.
      const opcaoAIdx = bloco.search(/[-—–]*\s*OPÇÃO\s+A\b/i);
      const opcaoBIdx = bloco.search(/[-—–]*\s*OPÇÃO\s+B\b/i);
      if (opcaoAIdx !== -1) {
        const endIdx = opcaoBIdx !== -1 ? opcaoBIdx : bloco.length;
        visual.opcaoA = bloco.slice(opcaoAIdx, endIdx).trim();
      }
      if (opcaoBIdx !== -1) {
        visual.opcaoB = bloco.slice(opcaoBIdx).trim();
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

    const SEP = '[-─—]+';

    // TikTok
    const tiktokSection = texto.match(new RegExp(`${SEP}\\s*TIKTOK\\s*${SEP}\\s*\\n([\\s\\S]*?)(?=${SEP}\\s*INSTAGRAM|$)`, 'i'));
    if (tiktokSection) {
      const s = tiktokSection[1];
      const titulo = s.match(/TÍTULO:\s*\n?(.+)/i);
      const desc = s.match(/DESCRIÇÃO:\s*\n?([\s\S]*?)(?=\nHASHTAGS|\n[-─—]|$)/i);
      const hashtags = s.match(/HASHTAGS\s*(?:TIKTOK)?:\s*\n?([\s\S]*?)(?=\n[-─—]|$)/i);

      result.tiktok = {
        titulo: titulo?.[1]?.trim() || '',
        descricao: desc?.[1]?.trim() || '',
        hashtags: hashtags?.[1]?.trim() || '',
      };
    }

    // Instagram
    const instaSection = texto.match(new RegExp(`${SEP}\\s*INSTAGRAM\\s*(?:REELS)?\\s*${SEP}\\s*\\n([\\s\\S]*?)(?=${SEP}\\s*YOUTUBE|$)`, 'i'));
    if (instaSection) {
      const s = instaSection[1];
      const legenda = s.match(/LEGENDA\s*(?:COMPLETA)?:\s*\n?([\s\S]*?)(?=\nHASHTAGS|\n[-─—]|$)/i);
      const hashtags = s.match(/HASHTAGS\s*(?:INSTAGRAM)?:\s*\n?([\s\S]*?)(?=\n[-─—]|$)/i);

      result.instagram = {
        legenda: legenda?.[1]?.trim() || '',
        hashtags: hashtags?.[1]?.trim() || '',
      };
    }

    // YouTube
    const ytSection = texto.match(new RegExp(`${SEP}\\s*YOUTUBE\\s*(?:SHORTS)?\\s*${SEP}\\s*\\n([\\s\\S]*?)(?=${SEP}\\s*GERAL|$)`, 'i'));
    if (ytSection) {
      const s = ytSection[1];
      const titulo = s.match(/TÍTULO:\s*\n?(.+)/i);
      const desc = s.match(/DESCRIÇÃO:\s*\n?([\s\S]*?)(?=\nTAGS|\n[-─—]|$)/i);
      const tags = s.match(/TAGS:\s*\n?([\s\S]*?)(?=\n[-─—]|$)/i);

      result.youtube = {
        titulo: titulo?.[1]?.trim() || '',
        descricao: desc?.[1]?.trim() || '',
        tags: tags?.[1]?.trim() || '',
      };
    }

    // Geral
    const geralSection = texto.match(new RegExp(`${SEP}\\s*GERAL\\s*${SEP}\\s*\\n([\\s\\S]*?)$`, 'i'));
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
    return { tiktok: {}, instagram: {}, youtube: {}, geral: {} };
  }
}
