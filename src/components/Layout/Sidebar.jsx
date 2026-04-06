import { diasAteEnem } from '../../utils/enem.js';
import { formatarDataCurta, truncar } from '../../utils/formatters.js';
import './Sidebar.css';

const STATUS_COLORS = {
  rascunho: 'var(--warning)',
  aprovado: 'var(--success)',
  publicado: 'var(--brand-primary)',
};

export default function Sidebar({
  producoes = [],
  onNewProduction,
  onSelectProduction,
  onOpenSettings,
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
          producoes.map((p) => (
            <button
              key={p.id}
              className="sidebar-history-item"
              onClick={() => onSelectProduction(p.id)}
            >
              <span
                className="sidebar-history-item-dot"
                style={{ background: STATUS_COLORS[p.status] || 'var(--text-muted)' }}
              />
              <span className="sidebar-history-item-text">
                {truncar(p.tema || 'Sem tema', 30)}
              </span>
              <span className="sidebar-history-item-date">
                {formatarDataCurta(p.criadoEm)}
              </span>
            </button>
          ))
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
      </div>
    </aside>
  );
}
