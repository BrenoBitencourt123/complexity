import { Card, Badge, Button, CopyBlock, StreamingDots, Spinner } from '../UI/index.jsx';
import { AGENT_STEPS } from '../../utils/constants.js';
import './AgentViews.css';

// ═══════════════════════════════════════════════════
// Agent Loading State (shared)
// ═══════════════════════════════════════════════════
export function AgentLoading({ agentName, streamingText }) {
  return (
    <div className="agent-loading">
      <Spinner size="lg" />
      <div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
          {agentName} está trabalhando
          <StreamingDots />
        </p>
        <p className="agent-loading-text">Processando com Gemini...</p>
      </div>
      {streamingText && (
        <div className="agent-streaming-preview">{streamingText.slice(-800)}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Agent Error State (shared)
// ═══════════════════════════════════════════════════
export function AgentError({ error, onRetry }) {
  return (
    <div className="agent-error">
      <span>❌</span>
      <div style={{ flex: 1 }}>
        <strong>Erro</strong>
        <p style={{ marginTop: 4 }}>{error}</p>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AGENTE 1 — ESTRATEGISTA
// ═══════════════════════════════════════════════════
export function EstrategistaView({ data, rawOutput, onApprove, onRegenerate, isPreview = false }) {
  if (!data && !rawOutput) return null;

  const estrategia = data || {};

  return (
    <div className="agent-view">
      <div className="agent-header">
        <div className="agent-icon estrategista">🎯</div>
        <div>
          <h2 className="agent-title">Estrategista</h2>
          <p className="agent-subtitle">Análise de contexto e decisões estratégicas</p>
        </div>
        <span className="agent-model-badge">{AGENT_STEPS[0].modelo.toUpperCase()}</span>
      </div>

      <Card>
        {data ? (
          <>
            <div className="estrategia-grid">
              <div className="estrategia-field full">
                <div className="estrategia-field-label">Tema</div>
                <div className="estrategia-field-value highlight">
                  {estrategia.tema || '—'}
                </div>
              </div>

              <div className="estrategia-field full">
                <div className="estrategia-field-label">Ângulo</div>
                <div className="estrategia-field-value">{estrategia.angulo || '—'}</div>
              </div>

              <div className="estrategia-field">
                <div className="estrategia-field-label">Objetivo</div>
                <div className="estrategia-field-value">
                  <Badge color={
                    estrategia.objetivo === 'crescimento' ? 'green' :
                    estrategia.objetivo === 'conversao' ? 'blue' :
                    estrategia.objetivo === 'retencao' ? 'purple' : 'yellow'
                  }>
                    {estrategia.objetivo || '—'}
                  </Badge>
                </div>
              </div>

              <div className="estrategia-field">
                <div className="estrategia-field-label">Estilo Visual</div>
                <div className="estrategia-field-value">
                  <Badge color={estrategia.estilo_visual === 'SKETCH' ? 'blue' : 'purple'}>
                    {estrategia.estilo_visual === 'SKETCH' ? '✏️ Sketch' : '🎨 Pintura'}
                  </Badge>
                </div>
              </div>

              <div className="estrategia-field">
                <div className="estrategia-field-label">Duração</div>
                <div className="estrategia-field-value">
                  {estrategia.duracao_alvo || '—'}
                  {estrategia.duracao_segundos ? ` (${estrategia.duracao_segundos}s)` : ''}
                </div>
              </div>

              <div className="estrategia-field">
                <div className="estrategia-field-label">Cenas Estimadas</div>
                <div className="estrategia-field-value">
                  {estrategia.cenas_estimadas || '—'} cenas
                </div>
              </div>

              {estrategia.hook_sugerido && (
                <div className="estrategia-field full">
                  <div className="estrategia-field-label">Hook Sugerido</div>
                  <div className="estrategia-field-value" style={{ fontStyle: 'italic' }}>
                    "{estrategia.hook_sugerido}"
                  </div>
                </div>
              )}

              {estrategia.cta_sugerido && (
                <div className="estrategia-field full">
                  <div className="estrategia-field-label">CTA Sugerido</div>
                  <div className="estrategia-field-value">
                    {estrategia.cta_sugerido}
                  </div>
                </div>
              )}

              {estrategia.justificativa && (
                <div className="estrategia-field full">
                  <div className="estrategia-field-label">Justificativa</div>
                  <div className="estrategia-field-value" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    {estrategia.justificativa}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <CopyBlock text={rawOutput} />
        )}

        {!isPreview && (
          <div className="agent-actions">
            <Button variant="ghost" onClick={onRegenerate} icon="🔄">
              Regenerar
            </Button>
            <Button variant="primary" onClick={onApprove} icon="✓">
              Aprovar Estratégia
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AGENTE 2 — ROTEIRISTA
// ═══════════════════════════════════════════════════
export function RoteiristaView({ cenas, tts, metaRoteiro, rawOutput, onApprove, onRegenerate, isPreview = false }) {
  const hasParsed = cenas && cenas.length > 0;

  return (
    <div className="agent-view">
      <div className="agent-header">
        <div className="agent-icon roteirista">✍️</div>
        <div>
          <h2 className="agent-title">Roteirista</h2>
          <p className="agent-subtitle">Roteiro cena a cena para vídeo curto</p>
        </div>
        <span className="agent-model-badge">{AGENT_STEPS[1].modelo.toUpperCase()}</span>
      </div>

      <Card>
        {hasParsed ? (
          <>
            {/* Meta */}
            {metaRoteiro && (
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                {metaRoteiro.duracaoTotal && (
                  <Badge color="blue">⏱ {metaRoteiro.duracaoTotal}s total</Badge>
                )}
                {metaRoteiro.totalCenas && (
                  <Badge color="neutral">🎬 {metaRoteiro.totalCenas} cenas</Badge>
                )}
              </div>
            )}

            {/* Cenas */}
            <div className="cena-list">
              {cenas.map((cena, i) => {
                const isHook = i === 0;
                const isCta = i === cenas.length - 1;
                return (
                  <div
                    key={i}
                    className={`cena-card ${isHook ? 'hook' : ''} ${isCta ? 'cta' : ''}`}
                  >
                    <div className="cena-card-header">
                      <div className="cena-number">
                        {String(cena.numero || i + 1).padStart(2, '0')}
                      </div>
                      <span className="cena-name">{cena.nome || `Cena ${i + 1}`}</span>
                      <span className="cena-duration">{cena.duracao || '?'}s</span>
                    </div>
                    <div className="cena-body">
                      {cena.narracao && (
                        <div className="cena-narracao">"{cena.narracao}"</div>
                      )}
                      <div className="cena-meta">
                        {cena.textoNaTela && (
                          <Badge color="blue">📝 {cena.textoNaTela}</Badge>
                        )}
                        {cena.emocao && (
                          <Badge color="purple">🎭 {cena.emocao}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TTS Script */}
            {tts && (
              <div className="tts-section">
                <h3 className="tts-title">🎤 Script TTS (ElevenLabs)</h3>
                <CopyBlock text={tts} />
              </div>
            )}
          </>
        ) : (
          <CopyBlock text={rawOutput || 'Sem dados'} />
        )}

        {!isPreview && (
          <div className="agent-actions">
            <Button variant="ghost" onClick={onRegenerate} icon="🔄">
              Regenerar
            </Button>
            <Button variant="primary" onClick={onApprove} icon="✓">
              Aprovar Roteiro
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AGENTE 3 — DIRETOR VISUAL
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import { Tabs } from '../UI/index.jsx';

export function DiretorVisualView({ visuais, consistencia, rawOutput, onApprove, onRegenerate, isPreview = false }) {
  const [activeTabs, setActiveTabs] = useState({});
  const hasParsed = visuais && visuais.length > 0;

  const handleTabChange = (cenaNum, tabId) => {
    setActiveTabs(prev => ({ ...prev, [cenaNum]: tabId }));
  };

  return (
    <div className="agent-view">
      <div className="agent-header">
        <div className="agent-icon diretor-visual">🎨</div>
        <div>
          <h2 className="agent-title">Diretor Visual</h2>
          <p className="agent-subtitle">Prompts de imagem por cena (Opção A + B)</p>
        </div>
        <span className="agent-model-badge">{AGENT_STEPS[2].modelo.toUpperCase()}</span>
      </div>

      <Card>
        {hasParsed ? (
          <>
            {visuais.map((visual, i) => (
              <div key={i} className="visual-cena">
                <h4 style={{ marginBottom: 'var(--space-3)' }}>
                  <Badge color="purple" style={{ marginRight: 8 }}>
                    Cena {String(visual.numero || i + 1).padStart(2, '0')}
                  </Badge>
                  {visual.nome}
                </h4>

                {visual.descricao && (
                  <div className="visual-cena-desc">{visual.descricao}</div>
                )}

                <div className="visual-tabs">
                  <Tabs
                    tabs={[
                      { id: 'a', label: 'Opção A — API', emoji: '🤖' },
                      { id: 'b', label: 'Opção B — Manual', emoji: '✋' },
                    ]}
                    activeTab={activeTabs[visual.numero] || 'a'}
                    onChange={(tabId) => handleTabChange(visual.numero, tabId)}
                  />
                </div>

                <div className="visual-prompt-content">
                  {(activeTabs[visual.numero] || 'a') === 'a' ? (
                    <CopyBlock text={visual.opcaoA || 'Prompt não disponível'} />
                  ) : (
                    <CopyBlock text={visual.opcaoB || 'Prompt não disponível'} />
                  )}
                </div>
              </div>
            ))}

            {consistencia && (
              <div className="consistencia-section">
                <h3 className="tts-title">🔗 Guia de Consistência Visual</h3>
                <CopyBlock text={consistencia} />
              </div>
            )}
          </>
        ) : (
          <CopyBlock text={rawOutput || 'Sem dados'} />
        )}

        {!isPreview && (
          <div className="agent-actions">
            <Button variant="ghost" onClick={onRegenerate} icon="🔄">
              Regenerar
            </Button>
            <Button variant="primary" onClick={onApprove} icon="✓">
              Aprovar Visuais
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AGENTE 4 — DISTRIBUIDOR
// ═══════════════════════════════════════════════════

export function DistribuidorView({ distribuicao, rawOutput, onApprove, onRegenerate, isPreview = false }) {
  const [activeTab, setActiveTab] = useState('tiktok');
  const hasParsed = distribuicao && (distribuicao.tiktok || distribuicao.instagram || distribuicao.youtube);

  const platformTabs = [
    { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
    { id: 'instagram', label: 'Instagram', emoji: '📸' },
    { id: 'youtube', label: 'YouTube', emoji: '▶️' },
    { id: 'geral', label: 'Geral', emoji: '📋' },
  ];

  const renderTikTok = () => {
    const d = distribuicao?.tiktok || {};
    return (
      <div className="distribuicao-platform">
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">📌 Título</div>
          <CopyBlock text={d.titulo || '—'} />
        </div>
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">📝 Descrição</div>
          <CopyBlock text={d.descricao || '—'} />
        </div>
        <div className="distribuicao-field">
          <div className="distribuicao-field-label"># Hashtags</div>
          <CopyBlock text={d.hashtags || '—'} />
        </div>
      </div>
    );
  };

  const renderInstagram = () => {
    const d = distribuicao?.instagram || {};
    return (
      <div className="distribuicao-platform">
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">📝 Legenda Completa</div>
          <CopyBlock text={d.legenda || '—'} maxHeight="300px" />
        </div>
        <div className="distribuicao-field">
          <div className="distribuicao-field-label"># Hashtags</div>
          <CopyBlock text={d.hashtags || '—'} />
        </div>
      </div>
    );
  };

  const renderYouTube = () => {
    const d = distribuicao?.youtube || {};
    return (
      <div className="distribuicao-platform">
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">📌 Título</div>
          <CopyBlock text={d.titulo || '—'} />
        </div>
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">📝 Descrição</div>
          <CopyBlock text={d.descricao || '—'} />
        </div>
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">🏷 Tags</div>
          <CopyBlock text={d.tags || '—'} />
        </div>
      </div>
    );
  };

  const renderGeral = () => {
    const d = distribuicao?.geral || {};
    return (
      <div className="distribuicao-platform">
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">⏰ Melhor Horário para Postar</div>
          <CopyBlock text={d.horarios || '—'} />
        </div>
        <div className="distribuicao-field">
          <div className="distribuicao-field-label">🖼 Thumbnail Sugerida</div>
          <CopyBlock text={d.thumbnail || '—'} />
        </div>
        {d.avisoTendencia && (
          <div className="distribuicao-field">
            <div className="distribuicao-field-label">🔥 Aviso de Tendência</div>
            <div style={{
              padding: 'var(--space-3)',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--warning)',
              fontSize: 'var(--text-sm)',
            }}>
              {d.avisoTendencia}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="agent-view">
      <div className="agent-header">
        <div className="agent-icon distribuidor">📡</div>
        <div>
          <h2 className="agent-title">Distribuidor</h2>
          <p className="agent-subtitle">Pacote de distribuição para todas as plataformas</p>
        </div>
        <span className="agent-model-badge">{AGENT_STEPS[3].modelo.toUpperCase()}</span>
      </div>

      <Card>
        {hasParsed ? (
          <>
            <Tabs
              tabs={platformTabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === 'tiktok' && renderTikTok()}
            {activeTab === 'instagram' && renderInstagram()}
            {activeTab === 'youtube' && renderYouTube()}
            {activeTab === 'geral' && renderGeral()}
          </>
        ) : (
          <CopyBlock text={rawOutput || 'Sem dados'} />
        )}

        {!isPreview && (
          <div className="agent-actions">
            <Button variant="ghost" onClick={onRegenerate} icon="🔄">
              Regenerar
            </Button>
            <Button variant="primary" onClick={onApprove} icon="✓">
              Aprovar Distribuição
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
