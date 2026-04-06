import { useState } from 'react';
import { Card, Button, CopyBlock, Badge } from '../UI/index.jsx';
import { ELEVENLABS_CONFIG } from '../../utils/constants.js';
import { formatarData, formatarDuracao, exportarComoMd } from '../../utils/formatters.js';
import '../Agents/AgentViews.css';

const CHECKLIST_ITEMS = [
  'Gerar imagens (Opção A ou B) para cada cena',
  'Gerar áudio TTS com o script limpo',
  'Montar no editor: 1 imagem por cena, sincronizar com o áudio',
  'Adicionar texto na tela conforme indicado em cada cena',
  'Adicionar música de fundo (instrumental, baixo volume)',
  'Exportar em 1080x1920px, MP4, 30fps',
  'Postar no horário indicado com legenda e hashtags do Distribuidor',
];

export default function PacoteFinal({ pipeline, onReset, onExport }) {
  const [checkedItems, setCheckedItems] = useState(new Set());

  const toggleItem = (index) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const estrategia = pipeline.parsedOutputs.estrategia || {};
  const tts = pipeline.parsedOutputs.tts;
  const metaRoteiro = pipeline.parsedOutputs.metaRoteiro || {};

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

      {/* Checklist */}
      <div className="pacote-section">
        <h3 className="pacote-section-title">✅ Checklist de Montagem</h3>
        <div className="checklist">
          {CHECKLIST_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`checklist-item ${checkedItems.has(i) ? 'done' : ''}`}
              onClick={() => toggleItem(i)}
            >
              <div className="checklist-checkbox">
                {checkedItems.has(i) ? '✓' : ''}
              </div>
              <span>{i + 1}. {item}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {checkedItems.size}/{CHECKLIST_ITEMS.length} concluídos
        </p>
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
