import React, { useState, useEffect } from 'react';
import { Card, Button } from '../UI/index.jsx';
import { analyzePerformanceData, getCurrentIntel } from '../../services/dataAnalyst.js';
import { useNarrativeMemory } from '../../hooks/useNarrativeMemory.js';
import './DataIntelPanel.css';

const FASES = [
  { value: 'awareness', label: 'Awareness', desc: 'Crescimento e descoberta', color: '#3b82f6' },
  { value: 'consideracao', label: 'Consideração', desc: 'Autoridade e valor', color: '#8b5cf6' },
  { value: 'conversao', label: 'Conversão', desc: 'CTAs e vendas', color: '#22c55e' },
];

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

  const { memory, loading: loadingMemory, updateFase, addProibido, resetMemory } = useNarrativeMemory();

  useEffect(() => {
    async function loadIntel() {
      const savedIntel = await getCurrentIntel();
      if (savedIntel) setIntel(savedIntel);
    }
    loadIntel();
  }, []);

  const handleAnalyze = async () => {
    if (!rawData.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzePerformanceData(rawData);
      setIntel(result);
      setRawData('');
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

      <div className="intel-grid">
        {/* Upload de Dados */}
        <Card className="intel-input-card">
          <h3>📊 Upload de Performance</h3>
          <p>Dica: Cole as linhas do CSV do Relatório do TikTok/Youtube ou relate manualmente.</p>

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

            {/* Arcos ativos */}
            {arcosAtivos.length > 0 && (
              <Card className="narrative-card">
                <h4 className="narrative-card-title">🎯 Arcos Narrativos Ativos</h4>
                <ul className="arco-list">
                  {arcosAtivos.map((a, i) => (
                    <li key={i} className="arco-item">
                      <div className="arco-nome">{a.nome_arco}</div>
                      <div className="arco-progress">
                        {a.posts_feitos}/{a.posts_planejados} posts · próximo: {a.proximo_passo}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Ganchos aprovados */}
            {ganchosAprovados.length > 0 && (
              <Card className="narrative-card">
                <h4 className="narrative-card-title">⚡ Ganchos Aprovados</h4>
                <p className="narrative-card-desc">Estilo de referência para novos hooks.</p>
                <div className="gancho-tags">
                  {ganchosAprovados.map((g, i) => (
                    <span key={i} className="gancho-tag">{g}</span>
                  ))}
                </div>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
