import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Layout/Sidebar.jsx';
import PipelineTracker from './components/Pipeline/PipelineTracker.jsx';
import {
  AgentLoading,
  AgentError,
  EstrategistaView,
  RoteiristaView,
  DiretorVisualView,
  DistribuidorView,
} from './components/Agents/AgentViews.jsx';
import PacoteFinal from './components/Production/PacoteFinal.jsx';
import { Card, Button } from './components/UI/index.jsx';
import { usePipeline } from './hooks/usePipeline.js';
import { useHistory } from './hooks/useHistory.js';
import { useSettings } from './hooks/useSettings.js';
import { useContentSchedule } from './hooks/useContentSchedule.js';
import { initGemini, testConnection, getSessionUsage } from './services/gemini.js';
import DataIntelPanel from './components/Intelligence/DataIntelPanel.jsx';
import { AGENT_STEPS } from './utils/constants.js';
import DailyDashboard from './components/Dashboard/DailyDashboard.jsx';
import WeeklyCalendar from './components/Dashboard/WeeklyCalendar.jsx';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('production');
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [sessionUsage, setSessionUsage] = useState(() => getSessionUsage());
  const [previewStep, setPreviewStep] = useState(null);

  // Ref para rastrear o ID da produção em andamento sem causar re-renders
  const currentProductionIdRef = useRef(null);

  const pipeline = usePipeline({
    onAgentComplete: () => setSessionUsage(getSessionUsage()),
  });
  const history = useHistory();
  const { settings, setApiKey, hasApiKey } = useSettings();
  const schedule = useContentSchedule();

  // ─── Start production ───
  const handleStart = useCallback((tema, objetivo, contextoExtra, formato) => {
    const producao = history.criarProducao(tema, objetivo, formato);
    currentProductionIdRef.current = producao.id;
    pipeline.iniciar(tema, objetivo, contextoExtra, formato);
    setCurrentView('production');
  }, [history, pipeline]);

  // ─── Fecha preview quando o pipeline avança para nova etapa ───
  useEffect(() => {
    setPreviewStep(null);
  }, [pipeline.status]);

  // ─── Salva estado no Supabase ao completar cada agente ───
  useEffect(() => {
    const estadosDeSave = ['agent_1_review', 'agent_2_review', 'agent_3_review', 'package_ready'];
    if (!currentProductionIdRef.current) return;
    if (!estadosDeSave.includes(pipeline.status)) return;

    history.atualizarProducao(currentProductionIdRef.current, {
      status: pipeline.status === 'package_ready' ? 'aprovado' : 'rascunho',
      dados: {
        pipelineStatus: pipeline.status,
        currentStep: pipeline.currentStep,
        inputs: pipeline.inputs,
        rawOutputs: pipeline.rawOutputs,
        parsedOutputs: pipeline.parsedOutputs,
      },
    });
  }, [pipeline.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Carregar produção salva do histórico ───
  const handleSelectProduction = useCallback((id) => {
    const producao = history.getProducao(id);
    if (!producao?.dados?.pipelineStatus) return;
    currentProductionIdRef.current = id;
    pipeline.restaurar(producao.dados);
    setCurrentView('production');
  }, [history, pipeline]);

  // ─── Produzir a partir de uma tarefa do schedule ───
  const handleProduzirTask = useCallback((task) => {
    handleStart(task.tema, task.objetivo, task.contextoExtra || '', task.formato);
  }, [handleStart]);

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
    if (currentView === 'intel') {
      return <DataIntelPanel onBack={() => setCurrentView('production')} />;
    }

    if (currentView === 'calendar') {
      return (
        <WeeklyCalendar
          schedule={schedule}
          onSelectDay={(date) => {
            schedule.setSelectedDate(date);
            setCurrentView('production');
          }}
        />
      );
    }

    const { status, currentStep, error, isStreaming, streamingText, parsedOutputs, rawOutputs } = pipeline;

    // Preview de step anterior
    if (previewStep !== null) {
      const previewViews = [
        <EstrategistaView
          key="preview-0"
          data={parsedOutputs.estrategia}
          rawOutput={rawOutputs.estrategia}
          isPreview
        />,
        <RoteiristaView
          key="preview-1"
          cenas={parsedOutputs.cenas}
          tts={parsedOutputs.tts}
          metaRoteiro={parsedOutputs.metaRoteiro}
          rawOutput={rawOutputs.roteiro}
          isPreview
        />,
        <DiretorVisualView
          key="preview-2"
          visuais={parsedOutputs.visuais}
          consistencia={parsedOutputs.consistencia}
          rawOutput={rawOutputs.visuais}
          isPreview
        />,
        <DistribuidorView
          key="preview-3"
          distribuicao={parsedOutputs.distribuicao}
          rawOutput={rawOutputs.distribuicao}
          isPreview
        />,
      ];
      return (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
          }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)' }}>
              👁 Visualizando etapa anterior
            </span>
            <button
              onClick={() => setPreviewStep(null)}
              style={{
                marginLeft: 'auto',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                background: 'none',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              ← Voltar ao atual
            </button>
          </div>
          {previewViews[previewStep]}
        </div>
      );
    }

    // Idle → Daily Dashboard
    if (status === 'idle') {
      return (
        <DailyDashboard
          schedule={schedule}
          onProduzir={handleProduzirTask}
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
            onChangeEstilo={pipeline.setEstiloVisual}
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
      <DailyDashboard
        schedule={schedule}
        onProduzir={handleProduzirTask}
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
          {AGENT_STEPS.map((a) => (
            <div key={a.id} style={{
              padding: 'var(--space-3)',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-border)',
            }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {a.emoji} {a.nome}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 2,
              }}>
                {a.modelo}
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
        onNewProduction={() => {
          if (pipeline.status !== 'idle' && pipeline.status !== 'package_ready') {
            setCurrentView('production');
          } else {
            handleReset();
          }
        }}
        onSelectProduction={handleSelectProduction}
        onOpenSettings={() => setCurrentView('settings')}
        onOpenIntel={() => setCurrentView('intel')}
        onOpenCalendar={() => setCurrentView('calendar')}
        weekProgress={schedule.getWeekProgress()}
        sessionUsage={sessionUsage}
        currentView={currentView}
      />

      {/* Main area */}
      <main className="app-main">
        {/* Pipeline tracker (only when pipeline is active) */}
        {pipeline.status !== 'idle' && (
          <PipelineTracker
            currentStep={pipeline.currentStep}
            status={pipeline.status}
            previewStep={previewStep}
            onStepClick={(step) => setPreviewStep(previewStep === step ? null : step)}
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
