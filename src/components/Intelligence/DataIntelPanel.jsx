import React, { useState, useEffect } from 'react';
import { Card, Button } from '../UI/index.jsx';
import { analyzePerformanceData, getCurrentIntel, extractNarrativeInsights, extractAccountMetrics } from '../../services/dataAnalyst.js';
import { useNarrativeMemory } from '../../hooks/useNarrativeMemory.js';
import { updateMemory, getMemory, salvarHistoricoMetricas } from '../../services/narrativeMemory.js';
import { iniciarOAuthYouTube, buscarMetricas, getPlataformasConectadas, desconectarPlataforma } from '../../services/socialMetrics.js';
import './DataIntelPanel.css';

const FASES = [
  { value: 'awareness', label: 'Awareness', desc: 'Crescimento e descoberta', color: '#3b82f6' },
  { value: 'consideracao', label: 'Consideração', desc: 'Autoridade e valor', color: '#8b5cf6' },
  { value: 'conversao', label: 'Conversão', desc: 'CTAs e vendas', color: '#22c55e' },
];

const ARCO_FORM_VAZIO = { nome_arco: '', posts_planejados: 4, proximo_passo: '' };

function diasParaExpirar(adicionadoEm) {
  const diff = 30 - (new Date() - new Date(adicionadoEm)) / 86400000;
  return Math.max(0, Math.ceil(diff));
}

export default function DataIntelPanel({ onBack }) {
  const [rawData, setRawData] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState(null);
  const [novoProibido, setNovoProibido] = useState('');

  // Insights pós-análise (sugestões de ganchos e fase)
  const [insights, setInsights] = useState(null);
  const [ganchosAdicionados, setGanchosAdicionados] = useState([]);

  // UI de ganchos
  const [novoGancho, setNovoGancho] = useState('');

  // UI de arcos
  const [showArcoForm, setShowArcoForm] = useState(false);
  const [arcoForm, setArcoForm] = useState(ARCO_FORM_VAZIO);

  // Métricas da conta
  const [metricasForm, setMetricasForm] = useState({ seguidores: '', crescimento_semanal: '', taxa_engajamento: '' });
  const [salvandoMetricas, setSalvandoMetricas] = useState(false);

  // Extração automática de métricas via CSV
  const [plataformaSelecionada, setPlataformaSelecionada] = useState('tiktok');
  const [metricasDetectadas, setMetricasDetectadas] = useState(null);

  // Conexões OAuth com plataformas
  const [plataformasConectadas, setPlataformasConectadas] = useState([]);
  const [buscandoMetricasApi, setBuscandoMetricasApi] = useState(false);
  const [oauthFeedback, setOauthFeedback] = useState(null); // { tipo: 'sucesso'|'erro', mensagem }

  const {
    memory, loading: loadingMemory,
    updateFase, addProibido, resetMemory,
    addGancho, removeGancho,
    novoArco, avancarArco, concluirArco,
  } = useNarrativeMemory();

  useEffect(() => {
    async function loadIntel() {
      const savedIntel = await getCurrentIntel();
      if (savedIntel) setIntel(savedIntel);
    }
    loadIntel();
  }, []);

  // Carrega quais plataformas estão conectadas e detecta retorno de OAuth
  useEffect(() => {
    async function inicializar() {
      // Verifica retorno do OAuth (parâmetros na URL)
      const params = new URLSearchParams(window.location.search);
      const sucesso = params.get('oauth_success');
      const erroOauth = params.get('oauth_error');

      if (sucesso) {
        setOauthFeedback({ tipo: 'sucesso', mensagem: `${sucesso} conectado com sucesso!` });
        window.history.replaceState({}, '', window.location.pathname);
      } else if (erroOauth) {
        setOauthFeedback({ tipo: 'erro', mensagem: `Falha na conexão: ${erroOauth}` });
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Carrega status das conexões
      const conectadas = await getPlataformasConectadas();
      setPlataformasConectadas(conectadas);
    }
    inicializar();
  }, []);

  // Busca métricas via API para uma plataforma conectada
  const handleBuscarMetricasApi = async (platform) => {
    setBuscandoMetricasApi(true);
    try {
      const resultado = await buscarMetricas(platform);
if (!resultado.conectado) {
        setOauthFeedback({ tipo: 'erro', mensagem: 'Token expirado. Reconecte a conta.' });
        return;
      }
      // Trata como "métricas detectadas" para confirmação antes de salvar
      setMetricasDetectadas({
        plataforma: platform,
        seguidores: resultado.inscritos ?? resultado.seguidores,
        crescimento_semanal: resultado.crescimento_semanal,
        taxa_engajamento: resultado.taxa_engajamento,
        views_7d: resultado.views_7d,
        melhor_horario: null,
        _canal_nome: resultado.canal_nome,
      });
    } catch (err) {
      setOauthFeedback({ tipo: 'erro', mensagem: err.message });
    } finally {
      setBuscandoMetricasApi(false);
    }
  };

  const handleDesconectar = async (platform) => {
    if (!window.confirm(`Desconectar ${platform}?`)) return;
    await desconectarPlataforma(platform);
    setPlataformasConectadas(prev => prev.filter(p => p.platform !== platform));
  };

  // ─── Análise de performance + extração de insights + extração de métricas ───
  const handleAnalyze = async () => {
    if (!rawData.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setInsights(null);
    setGanchosAdicionados([]);
    setMetricasDetectadas(null);
    try {
      // Roda análise de conteúdo e extração de métricas em paralelo
      const [result, metricas] = await Promise.all([
        analyzePerformanceData(rawData),
        extractAccountMetrics(rawData, plataformaSelecionada),
      ]);
      setIntel(result);
      setRawData('');

      // Mostra métricas detectadas se Gemini extraiu algo útil
      if (metricas && (metricas.seguidores || metricas.taxa_engajamento)) {
        setMetricasDetectadas({ ...metricas, plataforma: plataformaSelecionada });
      }

      // Extrai sugestões narrativas em paralelo (não bloqueia)
      extractNarrativeInsights(result)
        .then(sugestoes => setInsights(sugestoes))
        .catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddProibido = async (e) => {
    e.preventDefault();
    if (!novoProibido.trim()) return;
    await addProibido(novoProibido.trim());
    setNovoProibido('');
  };

  const handleReset = async () => {
    if (!window.confirm('Resetar toda a memória narrativa? Isso apaga temas cobertos, arcos, ganchos e temas proibidos.')) return;
    await resetMemory();
  };

  const handleSalvarGancho = async (gancho) => {
    await addGancho(gancho);
    setGanchosAdicionados(prev => [...prev, gancho]);
  };

  const handleAddGanchoManual = async () => {
    if (!novoGancho.trim()) return;
    await addGancho(novoGancho.trim());
    setNovoGancho('');
  };

  const handleCriarArco = async () => {
    if (!arcoForm.nome_arco.trim()) return;
    await novoArco(arcoForm);
    setArcoForm(ARCO_FORM_VAZIO);
    setShowArcoForm(false);
  };

  const handleAplicarFase = async (fase) => {
    await updateFase(fase);
    setInsights(prev => prev ? { ...prev, fase_sugerida: null } : prev);
  };

  // Sincroniza form de métricas quando a memória carrega
  useEffect(() => {
    if (memory?.metricas_conta) {
      const m = memory.metricas_conta;
      setMetricasForm({
        seguidores: m.seguidores ?? '',
        crescimento_semanal: m.crescimento_semanal ?? '',
        taxa_engajamento: m.taxa_engajamento ?? '',
      });
    }
  }, [memory?.metricas_conta]);

  const handleSalvarMetricas = async () => {
    setSalvandoMetricas(true);
    await updateMemory({
      metricas_conta: {
        seguidores: parseInt(metricasForm.seguidores) || 0,
        crescimento_semanal: parseFloat(metricasForm.crescimento_semanal) || 0,
        taxa_engajamento: parseFloat(metricasForm.taxa_engajamento) || 0,
        atualizado_em: new Date().toISOString(),
      },
    });
    setSalvandoMetricas(false);
  };

  // ─── Confirma e salva métricas extraídas automaticamente ───
  const handleConfirmarMetricas = async (novas) => {
    setSalvandoMetricas(true);
    const mem = await getMemory();
    const contaAtual = mem?.metricas_conta || {};

    const updatedConta = {
      ...contaAtual,
      [novas.plataforma]: novas,
      atualizado_em: new Date().toISOString(),
    };

    // Recalcula agregados somando/mediando todas as plataformas
    const plats = ['tiktok', 'instagram', 'youtube']
      .map(p => updatedConta[p])
      .filter(Boolean);

    if (plats.length) {
      updatedConta.seguidores = plats.reduce((s, p) => s + (p.seguidores ?? p.inscritos ?? 0), 0);
      updatedConta.crescimento_semanal = +(plats.reduce((s, p) => s + (p.crescimento_semanal ?? 0), 0) / plats.length).toFixed(1);
      updatedConta.taxa_engajamento = +(plats.reduce((s, p) => s + (p.taxa_engajamento ?? 0), 0) / plats.length).toFixed(1);
    }

    await updateMemory({ metricas_conta: updatedConta });
    await salvarHistoricoMetricas(novas.plataforma, novas);
    setMetricasDetectadas(null);
    setSalvandoMetricas(false);
  };

  const temasCobertos = memory?.temas_cobertos?.slice(-10).reverse() || [];
  const arcosAtivos = memory?.arcos_ativos || [];
  const temaProibidosAtivos = (memory?.temas_proibidos || []).filter(t => diasParaExpirar(t.adicionado_em) > 0);
  const ganchosAprovados = memory?.ganchos_aprovados || [];

  return (
    <div className="intel-panel-container">
      <div className="intel-panel-header">
        <Button variant="ghost" onClick={onBack} icon="←">
          Voltar
        </Button>
        <h2 className="intel-title">🧠 Laboratório de Inteligência</h2>
        <p className="intel-subtitle">O Agente Cientista lê seus dados e otimiza a estratégia do CMO automaticamente.</p>
      </div>

      {/* ─── Conexões com plataformas ─── */}
      <div className="social-connections">
        <h3 className="social-connections-title">Contas Conectadas</h3>
        <p className="social-connections-desc">
          Conecte suas contas para buscar métricas automaticamente. Os tokens ficam seguros no servidor.
        </p>

        {oauthFeedback && (
          <div className={`oauth-feedback oauth-feedback--${oauthFeedback.tipo}`}>
            {oauthFeedback.tipo === 'sucesso' ? '✓' : '✕'} {oauthFeedback.mensagem}
            <button className="oauth-feedback-close" onClick={() => setOauthFeedback(null)}>×</button>
          </div>
        )}

        <div className="social-platforms">
          {/* YouTube */}
          {(() => {
            const ytConectado = plataformasConectadas.find(p => p.platform === 'youtube');
            return (
              <div className="social-platform-card">
                <div className="social-platform-info">
                  <span className="platform-tag youtube">YouTube</span>
                  {ytConectado ? (
                    <span className="social-platform-status connected">
                      {ytConectado.channel_name || 'Conectado'}
                    </span>
                  ) : (
                    <span className="social-platform-status disconnected">Não conectado</span>
                  )}
                </div>
                <div className="social-platform-actions">
                  {ytConectado ? (
                    <>
                      <button
                        className="btn-fetch-metrics"
                        disabled={buscandoMetricasApi}
                        onClick={() => handleBuscarMetricasApi('youtube')}
                      >
                        {buscandoMetricasApi ? 'Buscando...' : 'Atualizar métricas'}
                      </button>
                      <button
                        className="btn-disconnect"
                        onClick={() => handleDesconectar('youtube')}
                      >
                        Desconectar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-connect youtube"
                      onClick={iniciarOAuthYouTube}
                    >
                      Conectar YouTube
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Instagram — em breve */}
          <div className="social-platform-card social-platform-card--soon">
            <div className="social-platform-info">
              <span className="platform-tag instagram">Instagram</span>
              <span className="social-platform-status disconnected">Em breve</span>
            </div>
          </div>

          {/* TikTok — em breve */}
          <div className="social-platform-card social-platform-card--soon">
            <div className="social-platform-info">
              <span className="platform-tag tiktok">TikTok</span>
              <span className="social-platform-status disconnected">Em breve</span>
            </div>
          </div>
        </div>
      </div>

      <div className="intel-grid">
        {/* Upload de Dados */}
        <Card className="intel-input-card">
          <h3>📊 Upload de Performance</h3>
          <p>Selecione a plataforma e cole o CSV exportado. O sistema extrai métricas de conta automaticamente.</p>

          <div className="platform-selector">
            {[
              { id: 'tiktok', label: 'TikTok' },
              { id: 'instagram', label: 'Instagram' },
              { id: 'youtube', label: 'YouTube' },
            ].map(p => (
              <button
                key={p.id}
                className={`platform-btn ${plataformaSelecionada === p.id ? 'active' : ''}`}
                onClick={() => setPlataformaSelecionada(p.id)}
                disabled={isAnalyzing}
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            className="intel-textarea"
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder="Ex: Video sobre 'cronograma', 50k views, 400 comentários (a retenção caiu no segundo 5). Video sobre 'Dicas de Chute', 2M views, 9k salvamentos..."
            disabled={isAnalyzing}
          />

          {error && <div className="intel-error">{error}</div>}

          <Button
            className="intel-submit-btn"
            onClick={handleAnalyze}
            loading={isAnalyzing}
            disabled={!rawData.trim()}
          >
            {isAnalyzing ? 'Analisando Padrões...' : 'Gerar Nova Inteligência'}
          </Button>

          {/* Card de métricas detectadas automaticamente */}
          {metricasDetectadas && (
            <div className="detected-metrics-card">
              <h4>Métricas detectadas — {metricasDetectadas.plataforma}</h4>
              <div className="detected-metrics-grid">
                {metricasDetectadas.seguidores != null && (
                  <span>{metricasDetectadas.seguidores.toLocaleString('pt-BR')} {metricasDetectadas.plataforma === 'youtube' ? 'inscritos' : 'seguidores'}</span>
                )}
                {metricasDetectadas.crescimento_semanal != null && (
                  <span>+{metricasDetectadas.crescimento_semanal}% semana</span>
                )}
                {metricasDetectadas.taxa_engajamento != null && (
                  <span>{metricasDetectadas.taxa_engajamento}% engajamento</span>
                )}
                {metricasDetectadas.views_7d != null && (
                  <span>{(metricasDetectadas.views_7d / 1000).toFixed(1)}k views/sem</span>
                )}
                {metricasDetectadas.melhor_horario && (
                  <span>Melhor horário: {metricasDetectadas.melhor_horario}</span>
                )}
              </div>
              <button
                className="btn-confirm-metrics"
                disabled={salvandoMetricas}
                onClick={() => handleConfirmarMetricas(metricasDetectadas)}
              >
                {salvandoMetricas ? 'Salvando...' : 'Confirmar e salvar métricas'}
              </button>
            </div>
          )}
        </Card>

        {/* Display do Relatório */}
        <Card className="intel-report-card">
          <h3>📑 Relatório Atual Ativo</h3>
          {!intel ? (
            <div className="intel-empty">
              Nenhuma inteligência carregada. A marca está usando o padrão.
            </div>
          ) : (
            <div className="intel-report-content">
              <div className="intel-section">
                <h4>🎯 Orientação pro CMO</h4>
                <p className="highlight">{intel.recomedacao_cmo}</p>
              </div>

              <div className="intel-section">
                <h4>🚀 Tópicos Quentes</h4>
                <ul className="tag-list">
                  {(intel.topicos_quentes || []).map(t => <li key={t}>{t}</li>)}
                </ul>
              </div>

              <div className="intel-section">
                <h4>📦 Formatos de Alta Retenção</h4>
                <ul className="tag-list">
                  {(intel.formatos_em_alta || []).map(t => <li key={t}>{t}</li>)}
                </ul>
              </div>

              <div className="intel-section">
                <h4>🚫 O que EVITAR</h4>
                <ul className="tag-list danger">
                  {(intel.o_que_evitar || []).map(t => <li key={t}>{t}</li>)}
                </ul>
              </div>

              <div className="intel-section">
                <h4>🧠 Conclusões Matadoras</h4>
                <ul>
                  {(intel.conclusoes_matadoras || []).map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* ─── Insights para Memória Narrativa (pós-análise) ─── */}
          {insights && (insights.fase_sugerida || insights.ganchos_sugeridos?.length > 0) && (
            <div className="intel-insights">
              <h4 className="intel-insights-title">💡 Insights para Memória Narrativa</h4>
              <p className="intel-insights-desc">A IA identificou padrões que podem calibrar a estratégia da agência.</p>

              {insights.fase_sugerida && (
                <div className="intel-fase-sugerida">
                  <div className="intel-fase-info">
                    <span className="intel-fase-label">Fase sugerida:</span>
                    <strong className="intel-fase-value">{insights.fase_sugerida}</strong>
                    {insights.justificativa_fase && (
                      <span className="intel-fase-justificativa">{insights.justificativa_fase}</span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleAplicarFase(insights.fase_sugerida)}>
                    Aplicar fase
                  </Button>
                </div>
              )}

              {insights.ganchos_sugeridos?.length > 0 && (
                <div className="intel-ganchos-sugeridos">
                  <span className="intel-ganchos-label">Ganchos que performaram bem:</span>
                  {insights.ganchos_sugeridos.map((g, i) => {
                    const jaSalvo = ganchosAdicionados.includes(g);
                    return (
                      <div key={i} className="intel-gancho-row">
                        <span className="intel-gancho-texto">{g}</span>
                        <Button
                          size="xs"
                          variant={jaSalvo ? 'ghost' : 'primary'}
                          disabled={jaSalvo}
                          onClick={() => handleSalvarGancho(g)}
                        >
                          {jaSalvo ? '✓ Salvo' : '+ Salvar'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ─── Memória Narrativa ─── */}
      <div className="narrative-section">
        <div className="narrative-header">
          <div>
            <h3 className="narrative-title">🗂️ Memória Narrativa</h3>
            <p className="narrative-subtitle">Contexto acumulado que o CMO e o Estrategista recebem automaticamente.</p>
          </div>
          <button className="reset-btn" onClick={handleReset} disabled={loadingMemory}>
            Resetar Memória
          </button>
        </div>

        {loadingMemory ? (
          <div className="intel-empty">Carregando memória...</div>
        ) : (
          <div className="narrative-grid">

            {/* Fase da audiência */}
            <Card className="narrative-card">
              <h4 className="narrative-card-title">📍 Fase da Audiência</h4>
              <p className="narrative-card-desc">Calibra o mix de posts do CMO automaticamente.</p>
              <div className="fase-buttons">
                {FASES.map(f => (
                  <button
                    key={f.value}
                    className={`fase-btn ${memory?.fase_audiencia === f.value ? 'active' : ''}`}
                    style={memory?.fase_audiencia === f.value ? { borderColor: f.color, color: f.color, background: `${f.color}18` } : {}}
                    onClick={() => updateFase(f.value)}
                  >
                    <span className="fase-btn-label">{f.label}</span>
                    <span className="fase-btn-desc">{f.desc}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Temas cobertos */}
            <Card className="narrative-card">
              <h4 className="narrative-card-title">✅ Temas Cobertos Recentemente</h4>
              <p className="narrative-card-desc">O CMO evita repetir estes temas.</p>
              {temasCobertos.length === 0 ? (
                <p className="narrative-empty">Nenhum tema registrado ainda. Conclua uma produção completa.</p>
              ) : (
                <ul className="tema-list">
                  {temasCobertos.map((t, i) => (
                    <li key={i} className="tema-item">
                      <span className="tema-nome">{t.tema}</span>
                      <span className="tema-meta">{t.formato} · {t.data}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Temas proibidos */}
            <Card className="narrative-card">
              <h4 className="narrative-card-title">🚫 Temas Proibidos (30 dias)</h4>
              <p className="narrative-card-desc">Bloqueados manualmente. Expiram automaticamente.</p>
              <form className="proibido-form" onSubmit={handleAddProibido}>
                <input
                  className="proibido-input"
                  value={novoProibido}
                  onChange={(e) => setNovoProibido(e.target.value)}
                  placeholder="Ex: repetição espaçada"
                />
                <button type="submit" className="proibido-add-btn" disabled={!novoProibido.trim()}>+</button>
              </form>
              {temaProibidosAtivos.length === 0 ? (
                <p className="narrative-empty">Nenhum tema proibido ativo.</p>
              ) : (
                <div className="proibido-tags">
                  {temaProibidosAtivos.map((t, i) => (
                    <span key={i} className="proibido-tag">
                      {t.tema}
                      <span className="proibido-expira">expira em {diasParaExpirar(t.adicionado_em)}d</span>
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Arcos narrativos */}
            <Card className="narrative-card">
              <div className="narrative-card-header">
                <h4 className="narrative-card-title">🎯 Arcos Narrativos</h4>
                <button className="arco-new-btn" onClick={() => setShowArcoForm(v => !v)}>
                  {showArcoForm ? '✕ Cancelar' : '+ Novo arco'}
                </button>
              </div>
              <p className="narrative-card-desc">Séries de posts conectados. O CMO dá continuidade automaticamente.</p>

              {showArcoForm && (
                <div className="arco-form">
                  <input
                    className="arco-input"
                    placeholder="Nome do arco (ex: Série de Técnicas de Estudo)"
                    value={arcoForm.nome_arco}
                    onChange={e => setArcoForm(f => ({ ...f, nome_arco: e.target.value }))}
                  />
                  <div className="arco-form-row">
                    <label className="arco-label">Posts planejados</label>
                    <input
                      className="arco-input arco-input-num"
                      type="number" min="2" max="10"
                      value={arcoForm.posts_planejados}
                      onChange={e => setArcoForm(f => ({ ...f, posts_planejados: parseInt(e.target.value) || 4 }))}
                    />
                  </div>
                  <input
                    className="arco-input"
                    placeholder="Próximo passo (ex: post de conversão final)"
                    value={arcoForm.proximo_passo}
                    onChange={e => setArcoForm(f => ({ ...f, proximo_passo: e.target.value }))}
                  />
                  <Button size="sm" disabled={!arcoForm.nome_arco.trim()} onClick={handleCriarArco}>
                    Criar arco
                  </Button>
                </div>
              )}

              {arcosAtivos.length === 0 && !showArcoForm ? (
                <p className="narrative-empty">Nenhum arco ativo. Crie séries de 3–5 posts com narrativa conectada.</p>
              ) : (
                <ul className="arco-list">
                  {arcosAtivos.map((a, i) => (
                    <li key={i} className="arco-item">
                      <div className="arco-info">
                        <div className="arco-nome">{a.nome_arco}</div>
                        <div className="arco-progress">
                          {a.posts_feitos}/{a.posts_planejados} posts
                          {a.proximo_passo && ` · próximo: ${a.proximo_passo}`}
                        </div>
                      </div>
                      <div className="arco-actions">
                        <button className="arco-btn arco-btn-advance" onClick={() => avancarArco(a.nome_arco)} title="+1 post feito">
                          +1
                        </button>
                        <button className="arco-btn arco-btn-done" onClick={() => concluirArco(a.nome_arco)} title="Concluir arco">
                          ✓
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Ganchos aprovados */}
            <Card className="narrative-card">
              <h4 className="narrative-card-title">⚡ Ganchos Aprovados</h4>
              <p className="narrative-card-desc">Frases de abertura que performaram bem — o CMO usa como referência de estilo.</p>

              {ganchosAprovados.length > 0 && (
                <div className="gancho-tags">
                  {ganchosAprovados.map((g, i) => (
                    <span key={i} className="gancho-tag">
                      {g}
                      <button className="gancho-remove" onClick={() => removeGancho(g)} title="Remover">×</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="gancho-add-row">
                <input
                  className="gancho-input"
                  placeholder="Ex: Você faz isso errado..."
                  value={novoGancho}
                  onChange={e => setNovoGancho(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && novoGancho.trim()) {
                      handleAddGanchoManual();
                    }
                  }}
                />
                <button
                  className="proibido-add-btn"
                  disabled={!novoGancho.trim()}
                  onClick={handleAddGanchoManual}
                >+</button>
              </div>
            </Card>

            {/* Métricas da conta */}
            <Card className="narrative-card metrics-card">
              <h4 className="narrative-card-title">📊 Métricas da Conta</h4>
              <p className="narrative-card-desc">O CMO usa esses dados para calibrar quando pode vender e qual o ritmo de crescimento.</p>
              <div className="metrics-form">
                <label className="metrics-label">
                  Seguidores totais
                  <input
                    className="metrics-input"
                    type="number"
                    placeholder="2400"
                    value={metricasForm.seguidores}
                    onChange={e => setMetricasForm(f => ({ ...f, seguidores: e.target.value }))}
                  />
                </label>
                <label className="metrics-label">
                  Crescimento últimos 7 dias (%)
                  <input
                    className="metrics-input"
                    type="number"
                    placeholder="8"
                    step="0.1"
                    value={metricasForm.crescimento_semanal}
                    onChange={e => setMetricasForm(f => ({ ...f, crescimento_semanal: e.target.value }))}
                  />
                </label>
                <label className="metrics-label">
                  Taxa de engajamento (%)
                  <input
                    className="metrics-input"
                    type="number"
                    placeholder="4.2"
                    step="0.1"
                    value={metricasForm.taxa_engajamento}
                    onChange={e => setMetricasForm(f => ({ ...f, taxa_engajamento: e.target.value }))}
                  />
                </label>
              </div>
              <Button size="sm" disabled={salvandoMetricas} onClick={handleSalvarMetricas}>
                {salvandoMetricas ? 'Salvando...' : 'Salvar métricas'}
              </Button>
              {memory?.metricas_conta?.atualizado_em && (
                <p className="metrics-updated">
                  Última atualização: {new Date(memory.metricas_conta.atualizado_em).toLocaleDateString('pt-BR')}
                </p>
              )}

              {/* Breakdown por plataforma (preenchido via CSV) */}
              {(memory?.metricas_conta?.tiktok || memory?.metricas_conta?.instagram || memory?.metricas_conta?.youtube) && (
                <div className="platform-breakdown">
                  {memory.metricas_conta.tiktok && (
                    <div className="platform-row">
                      <span className="platform-tag tiktok">TikTok</span>
                      <span>{(memory.metricas_conta.tiktok.seguidores ?? 0).toLocaleString('pt-BR')} seg · {memory.metricas_conta.tiktok.taxa_engajamento ?? '?'}% eng</span>
                    </div>
                  )}
                  {memory.metricas_conta.instagram && (
                    <div className="platform-row">
                      <span className="platform-tag instagram">Instagram</span>
                      <span>{(memory.metricas_conta.instagram.seguidores ?? 0).toLocaleString('pt-BR')} seg · {memory.metricas_conta.instagram.taxa_engajamento ?? '?'}% eng</span>
                    </div>
                  )}
                  {memory.metricas_conta.youtube && (
                    <div className="platform-row">
                      <span className="platform-tag youtube">YouTube</span>
                      <span>{((memory.metricas_conta.youtube.inscritos ?? memory.metricas_conta.youtube.seguidores ?? 0)).toLocaleString('pt-BR')} inscritos · {memory.metricas_conta.youtube.taxa_engajamento ?? '?'}% eng</span>
                    </div>
                  )}
                </div>
              )}
            </Card>

          </div>
        )}
      </div>
    </div>
  );
}
