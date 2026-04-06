import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar.jsx';
import PipelineTracker from './components/Pipeline/PipelineTracker.jsx';
import StartForm from './components/Agents/StartForm.jsx';
import {
  AgentLoading,
  AgentError,
  EstrategistaView,
  RoteiristaView,
  DiretorVisualView,
  DistribuidorView,
} from './components/Agents/AgentViews.jsx';
import PacoteFinal from './components/Production/PacoteFinal.jsx';
import { Card, Button, Modal } from './components/UI/index.jsx';
import { usePipeline } from './hooks/usePipeline.js';
import { useHistory } from './hooks/useHistory.js';
import { useSettings } from './hooks/useSettings.js';
import { initGemini, testConnection } from './services/gemini.js';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('production');
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);

  const pipeline = usePipeline();
  const history = useHistory();
  const { settings, setApiKey, hasApiKey } = useSettings();

  // ─── Start production ───
  const handleStart = useCallback((tema, objetivo, contextoExtra) => {
    history.criarProducao(tema, objetivo);
    pipeline.iniciar(tema, objetivo, contextoExtra);
    setCurrentView('production');
  }, [history, pipeline]);

  // ─── Approve & advance ───
  const handleApproveStep = useCallback((stepIndex) => {
    pipeline.aprovarStep(stepIndex);
  }, [pipeline]);

  // ─── Regenerate step ───
  const handleRegenerateStep = useCallback((stepIndex) => {
    pipeline.regenerarStep(stepIndex);
  }, [pipeline]);

  // ─── Reset ───
  const handleReset = useCallback(() => {
    pipeline.reset();
    setCurrentView('production');
  }, [pipeline]);

  // ─── Test API Key ───
  const handleTestApi = useCallback(async () => {
    if (!settings.apiKey) return;
    setTestingApi(true);
    setApiTestResult(null);
    try {
      initGemini(settings.apiKey);
      const ok = await testConnection();
      setApiTestResult(ok ? 'success' : 'error');
    } catch (err) {
      setApiTestResult('error');
    }
    setTestingApi(false);
  }, [settings.apiKey]);

  // ─── Determine what to render ───
  const renderContent = () => {
    if (currentView === 'settings') {
      return renderSettings();
    }

    const { status, currentStep, error, isStreaming, streamingText, parsedOutputs, rawOutputs } = pipeline;

    // Idle → show start form
    if (status === 'idle') {
      return (
        <StartForm
          onStart={handleStart}
          hasApiKey={hasApiKey}
          onOpenSettings={() => setCurrentView('settings')}
        />
      );
    }

    // Package Ready
    if (status === 'package_ready') {
      return (
        <PacoteFinal
          pipeline={pipeline}
          onReset={handleReset}
        />
      );
    }

    // Agent running → loading
    if (isStreaming || status.includes('running')) {
      const agentNames = ['Estrategista', 'Roteirista', 'Diretor Visual', 'Distribuidor'];
      return (
        <div className="agent-view">
          <AgentLoading
            agentName={agentNames[currentStep] || 'Agente'}
            streamingText={streamingText}
          />
        </div>
      );
    }

    // Agent review states
    if (status === 'agent_1_review') {
      return (
        <div>
          {error && <div className="agent-view"><AgentError error={error} onRetry={() => handleRegenerateStep(0)} /></div>}
          <EstrategistaView
            data={parsedOutputs.estrategia}
            rawOutput={rawOutputs.estrategia}
            onApprove={() => handleApproveStep(0)}
            onRegenerate={() => handleRegenerateStep(0)}
          />
        </div>
      );
    }

    if (status === 'agent_2_review') {
      return (
        <div>
          {error && <div className="agent-view"><AgentError error={error} onRetry={() => handleRegenerateStep(1)} /></div>}
          <RoteiristaView
            cenas={parsedOutputs.cenas}
            tts={parsedOutputs.tts}
            metaRoteiro={parsedOutputs.metaRoteiro}
            rawOutput={rawOutputs.roteiro}
            onApprove={() => handleApproveStep(1)}
            onRegenerate={() => handleRegenerateStep(1)}
          />
        </div>
      );
    }

    if (status === 'agent_3_review') {
      return (
        <div>
          {error && <div className="agent-view"><AgentError error={error} onRetry={() => handleRegenerateStep(2)} /></div>}
          <DiretorVisualView
            visuais={parsedOutputs.visuais}
            consistencia={parsedOutputs.consistencia}
            rawOutput={rawOutputs.visuais}
            onApprove={() => handleApproveStep(2)}
            onRegenerate={() => handleRegenerateStep(2)}
          />
        </div>
      );
    }

    if (status === 'agent_4_review') {
      return (
        <div>
          {error && <div className="agent-view"><AgentError error={error} onRetry={() => handleRegenerateStep(3)} /></div>}
          <DistribuidorView
            distribuicao={parsedOutputs.distribuicao}
            rawOutput={rawOutputs.distribuicao}
            onApprove={() => handleApproveStep(3)}
            onRegenerate={() => handleRegenerateStep(3)}
          />
        </div>
      );
    }

    return (
      <StartForm
        onStart={handleStart}
        hasApiKey={hasApiKey}
        onOpenSettings={() => setCurrentView('settings')}
      />
    );
  };

  // ─── Settings View ───
  const renderSettings = () => (
    <div className="settings-view">
      <h2 className="settings-title">⚙️ Configurações</h2>

      <Card className="settings-card">
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
            🔑 API Key do Gemini
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
            Necessária para os agentes funcionarem. Obtenha em{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              aistudio.google.com
            </a>
          </p>
        </div>

        <div className="form-group">
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Cole sua API key aqui"
          />
          <div className="api-key-status">
            <span className={`api-key-dot ${hasApiKey ? 'connected' : 'disconnected'}`} />
            <span style={{ color: hasApiKey ? 'var(--success)' : 'var(--text-muted)' }}>
              {hasApiKey ? 'Chave configurada' : 'Não configurada'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="secondary"
            onClick={handleTestApi}
            loading={testingApi}
            disabled={!hasApiKey}
          >
            Testar Conexão
          </Button>
          {apiTestResult === 'success' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 'var(--text-sm)' }}>
              ✓ Conectado!
            </span>
          )}
          {apiTestResult === 'error' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--error)', fontSize: 'var(--text-sm)' }}>
              ✗ Falhou
            </span>
          )}
        </div>
      </Card>

      <Card className="settings-card">
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          🤖 Modelos por Agente
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          {[
            { name: 'Estrategista', model: 'gemini-1.5-pro', emoji: '🎯' },
            { name: 'Roteirista', model: 'gemini-1.5-pro', emoji: '✍️' },
            { name: 'Diretor Visual', model: 'gemini-1.5-flash', emoji: '🎨' },
            { name: 'Distribuidor', model: 'gemini-1.5-flash', emoji: '📡' },
          ].map((a) => (
            <div key={a.name} style={{
              padding: 'var(--space-3)',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-border)',
            }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {a.emoji} {a.name}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 2,
              }}>
                {a.model}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button
        variant="ghost"
        onClick={() => setCurrentView('production')}
        icon="←"
        style={{ marginTop: 'var(--space-4)' }}
      >
        Voltar
      </Button>
    </div>
  );

  return (
    <div className="app-layout">
      {/* Background glow */}
      <div className="bg-radial-glow" />

      {/* Sidebar */}
      <Sidebar
        producoes={history.producoes}
        onNewProduction={handleReset}
        onSelectProduction={() => {}}
        onOpenSettings={() => setCurrentView('settings')}
        currentView={currentView}
      />

      {/* Main area */}
      <main className="app-main">
        {/* Pipeline tracker (only when pipeline is active) */}
        {pipeline.status !== 'idle' && (
          <PipelineTracker
            currentStep={pipeline.currentStep}
            status={pipeline.status}
          />
        )}

        {/* Content */}
        <div className="app-content bg-grid">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
