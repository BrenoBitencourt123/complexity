import React, { useState, useEffect } from 'react';
import { Card, Button } from '../UI/index.jsx';
import { analyzePerformanceData, getCurrentIntel } from '../../services/dataAnalyst.js';
import './DataIntelPanel.css';

export default function DataIntelPanel({ onBack }) {
  const [rawData, setRawData] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load existing intel on mount
    async function loadIntel() {
      const savedIntel = await getCurrentIntel();
      if (savedIntel) {
        setIntel(savedIntel);
      }
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
    </div>
  );
}
