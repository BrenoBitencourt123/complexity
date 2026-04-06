// ═══════════════════════════════════════════════════
// Formatação de outputs para display e export
// ═══════════════════════════════════════════════════

/**
 * Formata data para exibição BR
 */
export function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

export function formatarDataCurta(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(data));
}

/**
 * Copia texto para o clipboard
 */
export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
}

/**
 * Gera ID único simples
 */
export function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Trunca texto com reticências
 */
export function truncar(texto, max = 100) {
  if (!texto || texto.length <= max) return texto;
  return texto.substring(0, max).trim() + '...';
}

/**
 * Exporta conteúdo como arquivo .md
 */
export function exportarComoMd(conteudo, nomeArquivo = 'atlas-agency-pacote') {
  const blob = new Blob([conteudo], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeArquivo}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formata duração em segundos para texto
 */
export function formatarDuracao(segundos) {
  if (!segundos) return '—';
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
}
