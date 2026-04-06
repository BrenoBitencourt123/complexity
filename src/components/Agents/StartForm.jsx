import { useState } from 'react';
import { OBJETIVOS } from '../../utils/constants.js';
import { diasAteEnem } from '../../utils/enem.js';
import { Card } from '../UI/index.jsx';
import './StartForm.css';

export default function StartForm({ onStart, hasApiKey, onOpenSettings }) {
  const [tema, setTema] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [contextoExtra, setContextoExtra] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tema.trim()) return;
    onStart(tema.trim(), objetivo, contextoExtra.trim());
  };

  const dias = diasAteEnem();

  return (
    <div className="start-form-container">
      <form className="start-form" onSubmit={handleSubmit}>
        {/* Hero */}
        <div className="start-form-hero">
          <span className="start-form-emoji">🎬</span>
          <h1 className="start-form-title">Nova Produção</h1>
          <p className="start-form-subtitle">
            O sistema de 4 agentes vai criar um pacote completo de vídeo curto para o Atlas.
          </p>
        </div>

        {/* API Key Warning */}
        {!hasApiKey && (
          <div className="start-form-apikey-warning" onClick={onOpenSettings}>
            ⚠️
            <div>
              <strong>API Key não configurada.</strong>
              <br />
              Clique aqui para adicionar sua chave do Gemini antes de começar.
            </div>
          </div>
        )}

        <Card className="start-form-card">
          {/* Tema */}
          <div className="form-group">
            <label className="form-label">🎯 Tema do vídeo</label>
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Como usar repetição espaçada pra estudar pro ENEM"
              autoFocus
            />
            <span className="form-hint">
              Descreva o tema ou deixe genérico para o Estrategista decidir o ângulo
            </span>
          </div>

          {/* Objetivo */}
          <div className="form-group">
            <label className="form-label">📊 Objetivo</label>
            <div className="start-form-objectives">
              {OBJETIVOS.map((obj) => (
                <div
                  key={obj.value}
                  className={`objective-option ${objetivo === obj.value ? 'selected' : ''}`}
                  onClick={() => setObjetivo(obj.value === objetivo ? '' : obj.value)}
                >
                  <span className="objective-option-emoji">{obj.emoji}</span>
                  <span className="objective-option-label">{obj.label}</span>
                  <span className="objective-option-desc">{obj.desc}</span>
                </div>
              ))}
            </div>
            <span className="form-hint">
              Deixe vazio para o sistema decidir baseado no tema
            </span>
          </div>

          {/* Contexto Extra */}
          <div className="form-group">
            <label className="form-label">💡 Contexto extra (opcional)</label>
            <textarea
              value={contextoExtra}
              onChange={(e) => setContextoExtra(e.target.value)}
              placeholder={`Ex: Faltam ${dias} dias pro ENEM, focar em dicas práticas de última hora`}
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="start-form-submit"
            disabled={!tema.trim() || !hasApiKey}
          >
            ⚡ INICIAR PRODUÇÃO
          </button>
        </Card>
      </form>
    </div>
  );
}
