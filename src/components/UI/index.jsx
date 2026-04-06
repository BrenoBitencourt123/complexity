// ═══════════════════════════════════════════════════
// UI Components — Reusable base components
// ═══════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { copiarTexto } from '../../utils/formatters.js';
import './UI.css';

// ─── Button ───
export function Button({
  children,
  variant = 'secondary',
  size = '',
  onClick,
  disabled,
  loading,
  icon,
  className = '',
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" /> : icon ? <span>{icon}</span> : null}
      {children}
    </button>
  );
}

// ─── Card ───
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`card-title ${className}`}>{children}</h3>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}

// ─── Badge ───
export function Badge({ children, color = 'neutral', className = '' }) {
  return (
    <span className={`badge badge-${color} ${className}`}>
      {children}
    </span>
  );
}

// ─── CopyBlock ───
export function CopyBlock({ text, maxHeight, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await copiarTexto(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div className={`copy-block ${className}`} style={maxHeight ? { maxHeight } : undefined}>
      <button
        className={`copy-block-btn ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        title={copied ? 'Copiado!' : 'Copiar'}
      >
        {copied ? '✓' : '⧉'}
      </button>
      {text}
    </div>
  );
}

// ─── Tabs ───
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.emoji && <span>{tab.emoji} </span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Modal ───
export function Modal({ isOpen, onClose, title, description, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="modal-title">{title}</h2>}
        {description && <p className="modal-desc">{description}</p>}
        {children}
      </div>
    </div>
  );
}

// ─── StreamingDots ───
export function StreamingDots() {
  return (
    <span className="streaming-dots">
      <span />
      <span />
      <span />
    </span>
  );
}

// ─── Spinner ───
export function Spinner({ size = '' }) {
  return <span className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />;
}

// ─── EmptyState ───
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div style={{ marginTop: 'var(--space-6)' }}>{action}</div>}
    </div>
  );
}
