import { diasAteEnem } from '../../utils/enem.js';
import { formatarDataCurta, truncar } from '../../utils/formatters.js';
import './Sidebar.css';

const STATUS_BADGE = {
  aprovado:    { label: 'Completo',     bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  rascunho:    { label: 'Em progresso', bg: 'rgba(234,179,8,0.12)',  color: '#eab308' },
  publicado:   { label: 'Publicado',    bg: 'rgba(59,130,246,0.12)', color: 'var(--brand-primary)' },
};

export default function Sidebar({
  producoes = [],
  onNewProduction,
  onSelectProduction,
  onOpenSettings,
  onOpenIntel,
  onOpenCalendar,
  weekProgress = { done: 0, total: 0 },
  sessionUsage = { calls: 0, estimatedCostBRL: 0 },
  currentView,
}) {
  const dias = diasAteEnem();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">A</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">Atlas Agency</span>
            <span className="sidebar-logo-sub">Content Studio</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${currentView === 'production' ? 'active' : ''}`}
            onClick={onNewProduction}
          >
            <span className="sidebar-nav-item-icon">⚡</span>
            Nova Produção
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={onOpenCalendar}
          >
            <span className="sidebar-nav-item-icon">📅</span>
            <span style={{ flex: 1 }}>Calendário</span>
            {weekProgress.total > 0 && (
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                background: weekProgress.done === weekProgress.total ? 'rgba(34,197,94,0.15)' : 'var(--bg-primary)',
                color: weekProgress.done === weekProgress.total ? '#22c55e' : 'var(--text-muted)',
                border: `1px solid ${weekProgress.done === weekProgress.total ? 'rgba(34,197,94,0.3)' : 'var(--surface-border)'}`,
                borderRadius: '999px',
                padding: '1px 7px',
              }}>
                {weekProgress.done}/{weekProgress.total}
              </span>
            )}
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'intel' ? 'active' : ''}`}
            onClick={onOpenIntel}
          >
            <span className="sidebar-nav-item-icon">🧠</span>
            Estratégia & Dados
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={onOpenSettings}
          >
            <span className="sidebar-nav-item-icon">⚙️</span>
            Configurações
          </button>
        </nav>
      </div>

      {/* History */}
      <div className="sidebar-section" style={{ paddingBottom: 0 }}>
        <div className="sidebar-section-title">Histórico</div>
      </div>
      <div className="sidebar-history">
        {producoes.length === 0 ? (
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            padding: 'var(--space-3)',
            textAlign: 'center',
          }}>
            Nenhuma produção ainda
          </p>
        ) : (
          producoes.map((p) => {
            const temDados = !!p.dados?.pipelineStatus;
            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.rascunho;
            return (
              <button
                key={p.id}
                className="sidebar-history-item"
                onClick={() => temDados && onSelectProduction?.(p.id)}
                style={{ opacity: temDados ? 1 : 0.55, cursor: temDados ? 'pointer' : 'default' }}
                title={temDados ? 'Clique para abrir' : 'Produção sem dados salvos'}
              >
                <div className="sidebar-history-item-main">
                  <span className="sidebar-history-item-text">
                    {truncar(p.tema || 'Sem tema', 28)}
                  </span>
                  <span className="sidebar-history-item-date">
                    {formatarDataCurta(p.criadoEm)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: badge.bg,
                    color: badge.color,
                    whiteSpace: 'nowrap',
                  }}>
                    {badge.label}
                  </span>
                  {p.formato && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      · {p.formato}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ENEM Counter */}
      <div className="sidebar-footer">
        <div className="sidebar-enem-badge">
          <div>
            <div className="sidebar-enem-days">{dias}</div>
            <div className="sidebar-enem-label">dias pro ENEM</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '24px' }}>📚</div>
        </div>

        {/* Custo da sessão */}
        {sessionUsage.calls > 0 && (
          <div style={{
            marginTop: 'var(--space-2)',
            padding: '6px 10px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              💰 Sessão ({sessionUsage.calls} {sessionUsage.calls === 1 ? 'chamada' : 'chamadas'})
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: sessionUsage.estimatedCostBRL > 0.5 ? '#f59e0b' : 'var(--text-secondary)',
            }}>
              R$ {sessionUsage.estimatedCostBRL.toFixed(3)}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
