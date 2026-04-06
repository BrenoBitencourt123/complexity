// ═══════════════════════════════════════════════════
// ATLAS AGENCY — Constantes do Sistema
// Blocos mestres SKETCH/PINTURA, prompts negativos
// ═══════════════════════════════════════════════════

export const ESTILOS_VISUAIS = {
  SKETCH: {
    nome: 'Sketch',
    descricao: 'Traço azul sobre fundo branco — estilo caderno/esboço',
    emoji: '✏️',
    cor: '#3b82f6',
    usoIdeal: 'Conteúdo explicativo, matemático, científico, diagramas',
    blocoMestre: `ESTILO MESTRE (aplique em todos os elementos): Ilustração de traço azul sobre papel branco,
estilo caderno de anotações de um estudante inteligente. Linhas orgânicas feitas à mão com
caneta esferográfica azul escuro. Técnica: esboço rápido e expressivo, com variações de
espessura nas linhas — mais grossas nos contornos principais, mais finas nos detalhes internos.
O acabamento não é polido; é vivo, humano e impreciso de forma intencional. Elementos podem
ter hachuras leves para sombreamento, nunca preenchimento sólido. Feel: caderno de um aluno
aplicado, diagrama didático feito na hora, anotação de aula com energia.
NUNCA use cor além de tons de azul e cinza claro. NUNCA use renderização 3D, gradientes
ou estilo de animação limpo.`,
    blocoMestreSimplificado: `Ilustração de traço azul sobre papel branco, estilo caderno de estudante. 
Linhas feitas à mão com caneta azul escuro, esboço rápido e expressivo. 
Variações de espessura — grossas nos contornos, finas nos detalhes. 
Acabamento vivo e humano, não polido. Hachuras leves para sombra, sem preenchimento sólido.
Apenas tons de azul e cinza claro. Sem 3D, gradientes ou animação limpa.`,
    promptNegativo: `photorealistic, photograph, 3D render, smooth shading, colorful, painted, digital art,
gradient, flat design, vector, clip art, cartoon, anime, watercolor, oil painting,
blurry, low quality, text overlay, watermark, logo`,
  },

  PINTURA: {
    nome: 'Pintura',
    descricao: 'Pintura digital texturizada — cores vibrantes, estilo artístico moderno',
    emoji: '🎨',
    cor: '#8b5cf6',
    usoIdeal: 'Conteúdo emocional, motivacional, histórico, literário',
    blocoMestre: `ESTILO MESTRE (aplique em todos os elementos): Pintura digital texturizada, estilo arte
conceitual de mesa digitalizadora. Visíveis pinceladas de tinta digital e texturas de
superfície rugosa. Técnica: sobreposição de camadas de cores e pinceladas expressivas,
não polidas. O acabamento não é liso — é texturizado e tátil, como se houvesse tinta
física na tela. Paleta rica e saturada, com contraste entre luz e sombra pronunciado.
Feel: arte conceitual imersiva, artesanal, com peso visual e profundidade.
NUNCA use renderização 3D lisa, estilo de animação limpo ou flat design sem textura.`,
    blocoMestreSimplificado: `Pintura digital texturizada, estilo arte conceitual. 
Pinceladas visíveis de tinta digital e superfície rugosa. 
Sobreposição de camadas de cores expressivas, não polidas. 
Texturizado e tátil, como tinta física na tela. 
Paleta rica e saturada, contraste luz/sombra pronunciado.
Sem 3D lisa, animação limpa ou flat design sem textura.`,
    promptNegativo: `photorealistic, photograph, 3D render, smooth CGI, flat design, vector art, line art,
sketch, pencil drawing, anime, cartoon, blurry, low quality, text overlay, watermark,
logo, clipart, stock photo`,
  },
};

export const OBJETIVOS = [
  { value: 'crescimento', label: 'Crescimento Orgânico', emoji: '📈', desc: 'Aumentar alcance e seguidores' },
  { value: 'conversao', label: 'Conversão para PRO', emoji: '💰', desc: 'Gerar trials e assinaturas' },
  { value: 'retencao', label: 'Retenção', emoji: '🔄', desc: 'Engajar quem já usa o Atlas' },
  { value: 'awareness', label: 'Awareness', emoji: '👁️', desc: 'Fazer a marca ser conhecida' },
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
  descricao: 'Plataforma de preparação para o ENEM com questões adaptativas, redação com feedback de IA e repetição espaçada.',
  publico: 'Estudantes brasileiros entre 15 e 22 anos que vão fazer o ENEM',
  preco: 'R$49,90/mês',
  diferenciais: [
    'Questões adaptativas que identificam onde o aluno precisa melhorar',
    'Feedback de IA na redação (instantâneo, detalhado)',
    'Repetição espaçada para fixação real',
  ],
  tom: 'Direto, encorajador, sem enrolação. Fala como um professor jovem que já passou pelo ENEM.',
};

export const STATUS_PRODUCAO = {
  RASCUNHO: 'rascunho',
  APROVADO: 'aprovado',
  PUBLICADO: 'publicado',
};

export const AGENT_STEPS = [
  { id: 'estrategista', nome: 'Estrategista', emoji: '🎯', numero: 1, modelo: 'gemini-1.5-pro' },
  { id: 'roteirista', nome: 'Roteirista', emoji: '✍️', numero: 2, modelo: 'gemini-1.5-pro' },
  { id: 'diretor-visual', nome: 'Diretor Visual', emoji: '🎨', numero: 3, modelo: 'gemini-1.5-flash' },
  { id: 'distribuidor', nome: 'Distribuidor', emoji: '📡', numero: 4, modelo: 'gemini-1.5-flash' },
];
