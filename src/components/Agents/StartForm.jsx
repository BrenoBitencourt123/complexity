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
    onStart(tema.trim(), objetivo, contextoExtra.trim(), 'Shorts');
  };

  const dias = diasAteEnem();

  return (
    <div className="start-form-container">
      <div className="start-form">
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

        <form onSubmit={handleSubmit}>
          <Card className="start-form-card">
            <div className="form-group">
              <label className="form-label">🎯 Tema do vídeo</label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Como usar repetição espaçada pra estudar pro ENEM"
                autoFocus
              />
            </div>

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
            </div>

            <div className="form-group">
              <label className="form-label">💡 Contexto extra (opcional)</label>
              <textarea
                value={contextoExtra}
                onChange={(e) => setContextoExtra(e.target.value)}
                placeholder={`Ex: Faltam ${dias} dias pro ENEM, focar em dicas práticas de última hora`}
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="start-form-submit manual-btn"
              disabled={!tema.trim() || !hasApiKey}
            >
              ⚡ INICIAR PRODUÇÃO
            </button>
          </Card>
        </form>
      </div>
    </div>
  );
}
