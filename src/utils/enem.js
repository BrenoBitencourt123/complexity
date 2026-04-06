// ═══════════════════════════════════════════════════
// Cálculo de dias até o ENEM
// ═══════════════════════════════════════════════════

/**
 * Retorna a data estimada do próximo ENEM
 * ENEM geralmente ocorre nos dois primeiros domingos de novembro
 */
export function getProximoEnem() {
  const hoje = new Date();
  const ano = hoje.getFullYear();

  // Encontrar o primeiro domingo de novembro
  const novembro = new Date(ano, 10, 1); // mês 10 = novembro
  const primeiroDomingo = new Date(novembro);
  while (primeiroDomingo.getDay() !== 0) {
    primeiroDomingo.setDate(primeiroDomingo.getDate() + 1);
  }

  // Segundo domingo de novembro (dia 2 do ENEM)
  const segundoDomingo = new Date(primeiroDomingo);
  segundoDomingo.setDate(segundoDomingo.getDate() + 7);

  // Se já passou do ENEM deste ano, usar o do próximo
  if (hoje > segundoDomingo) {
    return getEnemDoAno(ano + 1);
  }

  return {
    dia1: primeiroDomingo,
    dia2: segundoDomingo,
    ano: ano,
  };
}

function getEnemDoAno(ano) {
  const novembro = new Date(ano, 10, 1);
  const primeiroDomingo = new Date(novembro);
  while (primeiroDomingo.getDay() !== 0) {
    primeiroDomingo.setDate(primeiroDomingo.getDate() + 1);
  }
  const segundoDomingo = new Date(primeiroDomingo);
  segundoDomingo.setDate(segundoDomingo.getDate() + 7);

  return { dia1: primeiroDomingo, dia2: segundoDomingo, ano };
}

/**
 * Calcula dias até o próximo ENEM (dia 1)
 */
export function diasAteEnem() {
  const enem = getProximoEnem();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diff = enem.dia1.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retorna texto formatado sobre dias até o ENEM
 */
export function textoEnem() {
  const dias = diasAteEnem();
  const enem = getProximoEnem();

  if (dias <= 0) return 'ENEM está acontecendo!';
  if (dias === 1) return 'ENEM é amanhã!';
  if (dias <= 7) return `${dias} dias para o ENEM — última semana!`;
  if (dias <= 30) return `${dias} dias para o ENEM ${enem.ano} — reta final!`;
  if (dias <= 90) return `${dias} dias para o ENEM ${enem.ano}`;
  return `${dias} dias para o ENEM ${enem.ano}`;
}

/**
 * Retorna a urgência baseada nos dias até o ENEM
 */
export function urgenciaEnem() {
  const dias = diasAteEnem();
  if (dias <= 7) return 'critica';
  if (dias <= 30) return 'alta';
  if (dias <= 90) return 'media';
  return 'normal';
}
