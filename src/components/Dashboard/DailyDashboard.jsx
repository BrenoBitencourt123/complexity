import { useState, useEffect } from 'react';
import { Card } from '../UI/index.jsx';
import { makeTaskId } from '../../hooks/useContentSchedule.js';
import { FORMAT_CONFIG, OBJETIVO_CONFIG } from '../../utils/constants.js';
import StartForm from '../Agents/StartForm.jsx';
import './DailyDashboard.css';

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function SkeletonTask() {
  return (
    <div className="task-card skeleton">
      <div className="task-skeleton-time" />
      <div className="task-skeleton-body">
        <div className="task-skeleton-line wide" />
        <div className="task-skeleton-line narrow" />
      </div>
    </div>
  );
}

export default function DailyDashboard({
  schedule,
  onProduzir,
  hasApiKey,
  onOpenSettings,
}) {
  const [showManual, setShowManual] = useState(false);
  const {
    weekPlan,
    taskStatuses,
    isGenerating,
    isLoadingFromDB,
    selectedDate,
    generatePlan,
    regeneratePlan,
    toggleTaskDone,
    getTasksForDate,
    getDayProgress,
  } = schedule;

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const tasks = getTasksForDate(selectedDate);
  const { done, total } = getDayProgress(selectedDate);

  // Gera plano automaticamente APENAS se não há dados no Supabase (aguarda load terminar)
  useEffect(() => {
    if (!isLoadingFromDB && !weekPlan && !isGenerating && hasApiKey) {
      generatePlan();
    }
  }, [isLoadingFromDB, weekPlan, isGenerating, hasApiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ordena por horário
  const sortedTasks = [...tasks].sort((a, b) =>
    (a.horario || '').localeCompare(b.horario || '')
  );

  if (showManual) {
    return (
      <div className="daily-dashboard">
        <button className="manual-back-btn" onClick={() => setShowManual(false)}>
          ← Voltar para a Pauta
        </button>
        <StartForm
          onStart={(tema, objetivo, contextoExtra, formato) => {
            setShowManual(false);
            onProduzir({ tema, objetivo, contextoExtra, formato });
          }}
          hasApiKey={hasApiKey}
          onOpenSettings={onOpenSettings}
        />
      </div>
    );
  }

  return (
    <div className="daily-dashboard">
      {/* Header */}
      <div className="dashboard-date-header">
        <div>
          <h1 className="dashboard-date-title">
            {isToday ? 'Hoje' : formatDate(selectedDate)}
          </h1>
          {isToday && (
            <p className="dashboard-date-sub">{formatDate(today)}</p>
          )}
        </div>
        <div className="dashboard-header-actions">
          {weekPlan && (
            <button
              className="regen-btn"
              onClick={regeneratePlan}
              disabled={isGenerating}
              title="Regerar pauta da semana"
            >
              🔄
            </button>
          )}
          <button
            className="manual-toggle-btn"
            onClick={() => setShowManual(true)}
          >
            ✏️ Manual
          </button>
        </div>
      </div>

      {/* API key warning */}
      {!hasApiKey && (
        <div className="dashboard-apikey-warning" onClick={onOpenSettings}>
          ⚠️ <strong>Configure sua API Key do Gemini</strong> para gerar a pauta automaticamente.
        </div>
      )}

      {/* Estratégia da semana */}
      {weekPlan?.estrategia_semanal && isToday && (
        <div className="dashboard-strategy-card">
          <span className="dashboard-strategy-icon">🧠</span>
          <p className="dashboard-strategy-text">{weekPlan.estrategia_semanal}</p>
        </div>
      )}

      {/* Progresso */}
      {total > 0 && (
        <div className="dashboard-progress">
          <div className="dashboard-progress-bar">
            <div
              className="dashboard-progress-fill"
              style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <span className="dashboard-progress-label">
            {done}/{total} {done === total && total > 0 ? '✓ Tudo feito!' : 'tarefas'}
          </span>
        </div>
      )}

      {/* Lista de tarefas */}
      <div className="task-list">
        {isGenerating && (
          <>
            <SkeletonTask />
            <SkeletonTask />
            <SkeletonTask />
          </>
        )}

        {!isGenerating && sortedTasks.length === 0 && weekPlan && (
          <div className="task-empty">
            {isToday ? '🎉 Dia livre! Nenhuma tarefa hoje.' : 'Nenhuma tarefa planejada para este dia.'}
          </div>
        )}

        {!isGenerating && sortedTasks.map((task, i) => {
          const taskId = makeTaskId(selectedDate, i);
          const isDone = taskStatuses[taskId] === 'done';
          const fmt = FORMAT_CONFIG[task.formato] || FORMAT_CONFIG.Shorts;
          const obj = OBJETIVO_CONFIG[task.objetivo] || OBJETIVO_CONFIG.crescimento;

          return (
            <div key={taskId} className={`task-card ${isDone ? 'done' : ''}`}>
              {/* Horário */}
              <div className="task-time" style={{ borderColor: fmt.color }}>
                🕐 {task.horario || '—'}
              </div>

              {/* Corpo */}
              <div className="task-body">
                <div className="task-badges">
                  <span
                    className="task-format-badge"
                    style={{ background: `${fmt.color}22`, color: fmt.color, borderColor: `${fmt.color}44` }}
                  >
                    {fmt.icon} {fmt.label}
                  </span>
                  <span className="task-obj-badge">
                    {obj.emoji} {obj.label}
                  </span>
                  {task.pilar && (
                    <span className="task-pilar-badge">📦 {task.pilar}</span>
                  )}
                </div>

                <h3 className={`task-tema ${isDone ? 'done-text' : ''}`}>
                  {task.tema}
                </h3>
                {task.angulo && (
                  <p className="task-angulo">{task.angulo}</p>
                )}
              </div>

              {/* Ações */}
              <div className="task-actions">
                {!isDone && (
                  <button
                    className="task-btn-produzir"
                    onClick={() => onProduzir(task)}
                    disabled={!hasApiKey}
                  >
                    ▶ PRODUZIR
                  </button>
                )}
                <button
                  className={`task-btn-done ${isDone ? 'is-done' : ''}`}
                  onClick={() => toggleTaskDone(taskId)}
                  title={isDone ? 'Desmarcar' : 'Marcar como feito'}
                >
                  {isDone ? '✓ Feito' : 'Feito'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
