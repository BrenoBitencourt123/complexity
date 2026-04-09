import { useState } from 'react';
import { OBJETIVOS } from '../../utils/constants.js';
import { diasAteEnem } from '../../utils/enem.js';
import { Card } from '../UI/index.jsx';
import './StartForm.css';

const ESTILOS_OPCOES = [
  { value: 'AUTO', label: 'Auto', emoji: '🤖', desc: 'IA decide' },
  { value: 'SKETCH', label: 'Sketch', emoji: '✏️', desc: 'Esboço educacional' },
  { value: 'PINTURA', label: 'Pintura', emoji: '🎨', desc: 'Arte conceitual' },
];

const FORMATOS_OPCOES = [
  { value: 'Shorts', label: 'Shorts', emoji: '🎬', desc: 'Vídeo vertical 9:16' },
  { value: 'Carrossel', label: 'Carrossel', emoji: '🖼️', desc: 'Post com lâminas' },
  { value: 'Stories', label: 'Stories', emoji: '⭕', desc: 'Sequência de telas' },
];

export default function StartForm({ onStart, hasApiKey, onOpenSettings }) {
  const [tema, setTema] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [contextoExtra, setContextoExtra] = useState('');
  const [estiloForcado, setEstiloForcado] = useState('AUTO');
  const [formato, setFormato] = useState('Shorts');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tema.trim()) return;
    onStart(tema.trim(), objetivo, contextoExtra.trim(), formato, estiloForcado);
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
              <label className="form-label">🖼️ Estilo visual</label>
              <div className="start-form-estilos">
                {ESTILOS_OPCOES.map((est) => (
                  <div
                    key={est.value}
                    className={`estilo-option ${estiloForcado === est.value ? 'selected' : ''}`}
                    onClick={() => setEstiloForcado(est.value)}
                  >
                    <span className="estilo-option-emoji">{est.emoji}</span>
                    <span className="estilo-option-label">{est.label}</span>
                    <span className="estilo-option-desc">{est.desc}</span>
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

            <div className="form-group">
              <label className="form-label">📐 Formato</label>
              <div className="start-form-formatos">
                {FORMATOS_OPCOES.map((fmt) => (
                  <div
                    key={fmt.value}
                    className={`estilo-option ${formato === fmt.value ? 'selected' : ''}`}
                    onClick={() => setFormato(fmt.value)}
                  >
                    <span className="estilo-option-emoji">{fmt.emoji}</span>
                    <span className="estilo-option-label">{fmt.label}</span>
                    <span className="estilo-option-desc">{fmt.desc}</span>
                  </div>
                ))}
              </div>
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
