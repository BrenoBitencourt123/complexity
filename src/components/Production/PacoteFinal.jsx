import { useState } from 'react';
import { Card, Button, CopyBlock } from '../UI/index.jsx';
import { ELEVENLABS_CONFIG } from '../../utils/constants.js';
import { formatarData, formatarDuracao, exportarComoMd, copiarTexto } from '../../utils/formatters.js';
import VideoAssembler from './VideoAssembler.jsx';
import '../Agents/AgentViews.css';
import './Production.css';

export default function PacoteFinal({ pipeline, onReset, onExport }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyPrompt = async (texto, index) => {
    await copiarTexto(texto);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const estrategia = pipeline.parsedOutputs.estrategia || {};
  const tts = pipeline.parsedOutputs.tts;
  const metaRoteiro = pipeline.parsedOutputs.metaRoteiro || {};
  const cenas = pipeline.parsedOutputs.cenas || [];
  const visuais = pipeline.parsedOutputs.visuais || [];
  const consistencia = pipeline.parsedOutputs.consistencia;

  const handleExport = () => {
    const content = gerarMarkdownPacote(pipeline);
    exportarComoMd(content, `atlas-agency-${estrategia.tema?.replace(/\s+/g, '-').toLowerCase() || 'pacote'}`);
  };

  return (
    <div className="agent-view">
      {/* Header */}
      <div className="pacote-header">
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-3)' }}>📦</div>
        <h1 className="pacote-title">Pacote de Produção</h1>

        <div className="pacote-meta">
          <div className="pacote-meta-item">
            <span className="pacote-meta-value">{estrategia.estilo_visual === 'SKETCH' ? '✏️' : '🎨'}</span>
            <span className="pacote-meta-label">{estrategia.estilo_visual || 'Estilo'}</span>
          </div>
          <div className="pacote-meta-item">
            <span className="pacote-meta-value">{formatarDuracao(estrategia.duracao_segundos || metaRoteiro.duracaoTotal)}</span>
            <span className="pacote-meta-label">Duração</span>
          </div>
          <div className="pacote-meta-item">
            <span className="pacote-meta-value">{metaRoteiro.totalCenas || estrategia.cenas_estimadas || '?'}</span>
            <span className="pacote-meta-label">Cenas</span>
          </div>
          <div className="pacote-meta-item">
            <span className="pacote-meta-value">4/4</span>
            <span className="pacote-meta-label">Agentes</span>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="pacote-section">
        <div className="estrategia-grid">
          <div className="estrategia-field full">
            <div className="estrategia-field-label">Tema</div>
            <div className="estrategia-field-value highlight">{estrategia.tema || pipeline.inputs.tema}</div>
          </div>
          <div className="estrategia-field">
            <div className="estrategia-field-label">Objetivo</div>
            <div className="estrategia-field-value">{estrategia.objetivo || pipeline.inputs.objetivo || '—'}</div>
          </div>
          <div className="estrategia-field">
            <div className="estrategia-field-label">Data</div>
            <div className="estrategia-field-value">{formatarData(new Date())}</div>
          </div>
        </div>
      </Card>

      {/* TTS Script */}
      {tts && (
        <div className="pacote-section">
          <h3 className="pacote-section-title">🎤 Script TTS para ElevenLabs</h3>
          <CopyBlock text={tts} />

          <h4 style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Configurações Recomendadas
          </h4>
          <div className="elevenlabs-grid">
            <div className="elevenlabs-field">
              <div className="elevenlabs-field-label">Voice</div>
              <div className="elevenlabs-field-value">{ELEVENLABS_CONFIG.voice}</div>
            </div>
            <div className="elevenlabs-field">
              <div className="elevenlabs-field-label">Model</div>
              <div className="elevenlabs-field-value">{ELEVENLABS_CONFIG.model}</div>
            </div>
            <div className="elevenlabs-field">
              <div className="elevenlabs-field-label">Stability</div>
              <div className="elevenlabs-field-value">{ELEVENLABS_CONFIG.stability}</div>
            </div>
            <div className="elevenlabs-field">
              <div className="elevenlabs-field-label">Similarity</div>
              <div className="elevenlabs-field-value">{ELEVENLABS_CONFIG.similarityBoost}</div>
            </div>
            <div className="elevenlabs-field">
              <div className="elevenlabs-field-label">Style</div>
              <div className="elevenlabs-field-value">{ELEVENLABS_CONFIG.style}</div>
            </div>
            <div className="elevenlabs-field">
              <div className="elevenlabs-field-label">Speaker Boost</div>
              <div className="elevenlabs-field-value">{ELEVENLABS_CONFIG.speakerBoost ? 'true' : 'false'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Guia de 3 passos */}
      <div className="pacote-section">
        <h3 className="pacote-section-title">🚀 Como montar o vídeo</h3>
        <div className="montagem-guide">
          <div className="montagem-step">
            <div className="montagem-step-num">1</div>
            <div>
              <strong>Gere o áudio</strong>
              <p>Copie o script TTS acima → cole no <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">ElevenLabs</a> com a voz Mateus → baixe o MP3.</p>
            </div>
          </div>
          <div className="montagem-step">
            <div className="montagem-step-num">2</div>
            <div>
              <strong>Gere as imagens</strong>
              <p>Copie cada prompt abaixo → gere no ChatGPT ou Gemini → baixe os PNGs em ordem.</p>
            </div>
          </div>
          <div className="montagem-step">
            <div className="montagem-step-num">3</div>
            <div>
              <strong>Monte aqui</strong>
              <p>Suba o MP3 + as imagens no painel abaixo. O sistema monta o .mp4 automaticamente.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consistência visual */}
      {consistencia && (
        <div className="pacote-section">
          <h3 className="pacote-section-title">🎨 Guia de Consistência Visual</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            Cole este bloco no início de cada prompt de imagem para manter o estilo uniforme.
          </p>
          <CopyBlock text={consistencia} />
        </div>
      )}

      {/* Prompts de imagem por cena */}
      {visuais.length > 0 && (
        <div className="pacote-section">
          <h3 className="pacote-section-title">🖼️ Prompts de Imagem por Cena</h3>
          <div className="prompts-cenas-list">
            {visuais.map((visual, i) => {
              const cena = cenas.find(c => c.numero === visual.numero) || {};
              return (
                <div key={i} className="prompt-cena-card">
                  <div className="prompt-cena-header">
                    <span className="prompt-cena-num">Cena {visual.numero}</span>
                    <span className="prompt-cena-nome">{visual.nome}</span>
                    {cena.duracao && (
                      <span className="prompt-cena-dur">{cena.duracao}s</span>
                    )}
                    <button
                      className={`prompt-copy-btn ${copiedIndex === i ? 'copied' : ''}`}
                      onClick={() => handleCopyPrompt(visual.opcaoA || '', i)}
                    >
                      {copiedIndex === i ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="prompt-cena-text">{visual.opcaoA}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Assembler */}
      <div className="pacote-section">
        <VideoAssembler
          cenas={cenas}
          visuais={visuais}
          estrategia={estrategia}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
        <Button variant="ghost" onClick={onReset} icon="↩">
          Nova Produção
        </Button>
        <Button variant="primary" onClick={handleExport} icon="📥" style={{ marginLeft: 'auto' }}>
          Exportar como .md
        </Button>
      </div>
    </div>
  );
}

// ─── Gerar arquivo .md com todo o pacote ───
function gerarMarkdownPacote(pipeline) {
  const e = pipeline.parsedOutputs.estrategia || {};
  const tts = pipeline.parsedOutputs.tts || '';

  let md = `# PACOTE DE PRODUÇÃO — ATLAS AGENCY\n\n`;
  md += `**Tema:** ${e.tema || pipeline.inputs.tema}\n`;
  md += `**Objetivo:** ${e.objetivo || pipeline.inputs.objetivo}\n`;
  md += `**Estilo:** ${e.estilo_visual || '—'}\n`;
  md += `**Duração:** ${e.duracao_segundos || '?'}s\n`;
  md += `**Data:** ${formatarData(new Date())}\n\n`;

  md += `---\n\n## ESTRATÉGIA\n\n`;
  md += pipeline.rawOutputs.estrategia || '';
  md += `\n\n---\n\n## ROTEIRO\n\n`;
  md += pipeline.rawOutputs.roteiro || '';
  md += `\n\n---\n\n## DIREÇÃO VISUAL\n\n`;
  md += pipeline.rawOutputs.visuais || '';
  md += `\n\n---\n\n## DISTRIBUIÇÃO\n\n`;
  md += pipeline.rawOutputs.distribuicao || '';

  if (tts) {
    md += `\n\n---\n\n## SCRIPT TTS\n\n\`\`\`\n${tts}\n\`\`\`\n`;
  }

  return md;
}
