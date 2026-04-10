// ═══════════════════════════════════════════════════
// ATLAS AGENCY — Constantes do Sistema
// Style seeds portados do project-bridge
// ═══════════════════════════════════════════════════

// Portado de project-bridge/src/lib/buildImagePrompt.ts
export const STYLE_SEEDS = {
  padrao: `ESTILO MESTRE (aplique em todos os elementos): Ilustração desenhada à mão, estilo esboço educacional clean, papel bege/creme suave (#F5F0E8). Paleta: tons de cinza (#444444 traços) com APENAS azul (#4A90E2) como cor de destaque — use o azul somente para o elemento mais importante da cena. Técnica: hachura leve a lápis, linhas limpas, aspecto de material didático profissional. Feel: startup de educação, clean, moderno e confiável. NUNCA use cores fora desta paleta.`,

  sketch: `ESTILO MESTRE (aplique em todos os elementos): Ilustração desenhada à mão, estilo esboço educacional, papel bege/creme texturizado (#E8E0D0). Paleta restrita: preto, branco e cinza (#2C2C2C traços) com APENAS laranja (#E8610A) como cor de destaque — use o laranja somente para o elemento mais importante da cena. Técnica: hachura a lápis, ligeira aspereza, traços irregulares que parecem feitos à mão. Feel: caderno de estudante, anotação de aula, didático e acessível. NUNCA use cores fora desta paleta.`,

  impacto: `ESTILO MESTRE (aplique em todos os elementos): Ilustração cartoon/quadrinho com texturas de meio-tom (halftone) e sombreamento pop-art retrô. Paleta quente e rica: âmbar (#F5A623), laranja (#E8610A), azul-teal (#1A9E9E), marrom (#7B4F2E), verde terroso (#5A7A3A). Técnica: contornos pretos espessos, halftone nas sombras, alto contraste dramático. Feel: quadrinho educacional, energia, impacto visual imediato. NUNCA use neon, NUNCA use pastel, NUNCA use realismo fotográfico.`,

  pintura: `ESTILO MESTRE (aplique em todos os elementos): Pintura digital texturizada, estilo arte conceitual de mesa digitalizadora. Visíveis pinceladas de tinta digital e texturas de superfície. Técnica: sobreposição de camadas de cores e pinceladas expressivas e não polidas. O acabamento não é liso; é texturizado e tátil. Feel: arte conceitual imersiva, artesanal, focada na inspeção de dados. NUNCA use renderização 3D lisa ou estilo de animação limpo.`,
};

export const ESTILO_PADRAO = 'padrao';

export const OBJETIVOS = [
  { value: 'crescimento', label: 'Crescimento Orgânico', emoji: '📈', desc: 'Valor puro, sem mencionar o Atlas' },
  { value: 'retencao', label: 'Menção Suave', emoji: '🔄', desc: 'Menciona o Atlas de passagem, sem CTA' },
  { value: 'conversao', label: 'Conversão', emoji: '💰', desc: 'CTA direto para assinar o Atlas' },
];

export const DURACOES = [
  { value: '15-30s', label: '15–30s', desc: 'Hook puro, fact rápido, meme educativo' },
  { value: '30-60s', label: '30–60s', desc: 'Dica prática com demonstração' },
  { value: '60-90s', label: '60–90s', desc: 'Explicação com profundidade, lista, passo a passo' },
];

export const EMOCOES = [
  'urgente', 'calmo', 'empolgado', 'reflexivo', 'direto',
  'motivacional', 'provocativo', 'acolhedor', 'determinado',
];

export const ENQUADRAMENTOS = [
  { value: 'plano-aberto', label: 'Plano Aberto', desc: 'Mostrar o ambiente completo, personagem pequeno no contexto' },
  { value: 'plano-medio', label: 'Plano Médio', desc: 'Pessoa ou elemento principal interagindo com ambiente' },
  { value: 'plano-aproximado', label: 'Plano Aproximado', desc: 'Foco no rosto ou objeto principal, contexto desfocado' },
  { value: 'plano-detalhe', label: 'Plano Detalhe', desc: 'Close extremo em um elemento específico' },
];

export const MODELOS_IMAGEM = [
  { value: 'flux-dev', label: 'Flux Dev' },
  { value: 'ideogram-v2', label: 'Ideogram V2' },
  { value: 'dalle-3', label: 'DALL·E 3' },
];

export const PLATAFORMAS = {
  tiktok: { nome: 'TikTok', emoji: '🎵', cor: '#ff0050' },
  instagram: { nome: 'Instagram Reels', emoji: '📸', cor: '#e1306c' },
  youtube: { nome: 'YouTube Shorts', emoji: '▶️', cor: '#ff0000' },
};

export const ELEVENLABS_CONFIG = {
  voice: 'Mateus',
  model: 'eleven_multilingual_v2',
  stability: 0.45,
  similarityBoost: 0.82,
  style: 0.30,
  speakerBoost: true,
};

export const ATLAS_BRAND = {
  nome: 'Atlas',
  tagline: 'Inteligência aplicada ao seu estudo',
  descricao: 'Um hub unificado de estudos com IA focada no ENEM. Identifica pontos fracos e adapta o estudo do aluno.',
  publico: 'Estudantes brasileiros entre 15 e 22 anos prestando o ENEM, que se sentem perdidos com métodos tradicionais e exaustos com videoaulas.',
  modeloNegocio: 'Plano gratuito limitado + Plano PRO com acesso completo. Programa Fundadores com vagas limitadas a preço especial.',
  preco: 'R$49,90/mês',
  tom: 'Claro, acolhedor e objetivo. Tom de professor particular que entende a pressão do vestibular, mas vai direto ao ponto.',
  funcionalidades: {
    questoesAdaptativas: 'Banco de questões reais do ENEM com classificação por tema/subtópico. Identifica pontos fracos e prioriza o que revisar com mastery score.',
    redacaoIA: 'Análise detalhada por competência de redação, sugestões de melhoria e versão nota 1000 baseada no raciocínio do aluno.',
    flashcardsSRS: 'Gerados automaticamente a partir de questões erradas, adaptando intervalos ao ritmo do aluno (Repetição Espaçada).',
    cronograma: 'Cronograma inteligente que distribui as áreas de estudo ao longo da semana.',
    temaDiario: 'Tema de redação diário com texto motivador, perguntas norteadoras e guia de estrutura.',
    pwa: 'PWA progressivo — funciona igual app de celular e computador.'
  },
  doresPublico: [
    'Estudar por videoaulas e na hora das questões dar "branco" total',
    'Demora de dias para ter uma redação corrigida no cursinho',
    'Sensação de ter esquecido TUDO que estudou há um mês atrás',
    'Sentimento de atraso e ansiedade com o cronograma'
  ],
  diferenciais: [
    'Sistema que pensa por você: mapeia suas falhas automaticamente',
    'Correção de redação instantânea e personalizada',
    'Estudo ativo vs passivo (Adeus, playlist de videoaulas)'
  ]
};

export const PILARES_CONTEUDO = [
  {
    nome: 'Dicas de Estudo (Crescimento)',
    descricao: 'Hacks práticos, erros comuns desmascarados e dicas de produtividade. Alta probabilidade de salvar e compartilhar.',
    angulo: 'Mostre um erro comum que 90% faz (ex: resumão colorido) e ensine a forma inteligente e científica de resolver.'
  },
  {
    nome: 'Conteúdo de Matéria (Autoridade)',
    descricao: 'Resolver um tópico difícil do ENEM de forma visual, rápida e com macetes.',
    angulo: 'Substitua 50 min de aula chata por 40 segundos de "eureka". Foco na clareza.'
  },
  {
    nome: 'Motivacional/Acolhimento (Retenção)',
    descricao: 'Vídeos acolhedores e honestos sobre a pressão e saúde mental no vestibular.',
    angulo: 'Tire um peso das costas do aluno. "Não, você não está atrasado. Faça isso".'
  },
  {
    nome: 'Feature PRO (Conversão Direta)',
    descricao: 'Mostrar a tela da plataforma resolvendo uma dor insuportável (ex: redação travada).',
    angulo: 'Gere o sentimento de "eu preciso disso agora para economizar meu tempo". Termine com chamada para o Programa Fundadores.'
  },
  {
    nome: 'Tendências ENEM (Urgência)',
    descricao: 'Apostas de redação, prazos importantes do INEP, como lidar com a prova chegando.',
    angulo: 'Use dados ou análises para criar um senso de preparação vital.'
  }
];

export const FORMAT_CONFIG = {
  Shorts:    { icon: '📱', label: 'Reels / TikTok / Shorts', color: 'var(--brand-primary)' },
  Carrossel: { icon: '🖼️', label: 'Post Carrossel',          color: '#8b5cf6' },
  Stories:   { icon: '⭕', label: 'Stories',                  color: '#f59e0b' },
};

export const OBJETIVO_CONFIG = {
  crescimento: { emoji: '📈', label: 'Crescimento', color: '#3b82f6' },
  retencao:    { emoji: '🔄', label: 'Menção Suave', color: '#8b5cf6' },
  conversao:   { emoji: '💰', label: 'Conversão',   color: '#22c55e' },
};

export const STATUS_PRODUCAO = {
  RASCUNHO: 'rascunho',
  APROVADO: 'aprovado',
  PUBLICADO: 'publicado',
};

export const AGENT_STEPS = [
  { id: 'estrategista', nome: 'Estrategista', emoji: '🎯', numero: 1, modelo: 'gemini-2.5-flash' },
  { id: 'roteirista', nome: 'Roteirista', emoji: '✍️', numero: 2, modelo: 'gemini-2.5-flash' },
  { id: 'diretor-visual', nome: 'Diretor Visual', emoji: '🎨', numero: 3, modelo: 'gemini-2.5-flash' },
  { id: 'distribuidor', nome: 'Distribuidor', emoji: '📡', numero: 4, modelo: 'gemini-2.5-flash' },
];
