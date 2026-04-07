import { makeTaskId } from '../../hooks/useContentSchedule.js';
import { FORMAT_CONFIG, OBJETIVO_CONFIG } from '../../utils/constants.js';
import './WeeklyCalendar.css';

function formatShortDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function formatDayName(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
}

export default function WeeklyCalendar({ schedule, onSelectDay }) {
  const {
    weekPlan,
    taskStatuses,
    isGenerating,
    selectedDate,
    setSelectedDate,
    regeneratePlan,
    getDayProgress,
  } = schedule;

  const today = new Date().toISOString().slice(0, 10);

  const handleSelectDay = (date) => {
    setSelectedDate(date);
    onSelectDay?.(date);
  };

  return (
    <div className="weekly-calendar">
      {/* Header */}
      <div className="wc-header">
        <div>
          <h2 className="wc-title">Calendário da Semana</h2>
          {weekPlan && (
            <p className="wc-total">
              {weekPlan.total_posts} posts planejados ·{' '}
              {weekPlan.mix?.crescimento || 0} crescimento ·{' '}
              {weekPlan.mix?.autoridade || 0} autoridade ·{' '}
              {weekPlan.mix?.conversao || 0} conversão
            </p>
          )}
        </div>
        <button
          className="wc-regen-btn"
          onClick={regeneratePlan}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳ Gerando...' : '🔄 Refazer Semana'}
        </button>
      </div>

      {/* Estratégia semanal */}
      {weekPlan?.estrategia_semanal && (
        <div className="wc-strategy">
          <span className="wc-strategy-label">🧠 Estratégia da Semana</span>
          <p className="wc-strategy-text">{weekPlan.estrategia_semanal}</p>
        </div>
      )}

      {/* Grid dos 7 dias */}
      <div className="wc-grid">
        {isGenerating
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="wc-day-col skeleton" />
            ))
          : weekPlan?.dias?.map((day) => {
              const isToday = day.data === today;
              const isSelected = day.data === selectedDate;
              const { done, total } = getDayProgress(day.data);
              const allDone = total > 0 && done === total;

              return (
                <div
                  key={day.data}
                  className={`wc-day-col ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectDay(day.data)}
                >
                  {/* Cabeçalho do dia */}
                  <div className="wc-day-header">
                    <span className="wc-day-name">{formatDayName(day.data)}</span>
                    <span className={`wc-day-date ${isToday ? 'today' : ''}`}>
                      {formatShortDate(day.data)}
                    </span>
                    {isToday && <span className="wc-today-badge">Hoje</span>}
                  </div>

                  {/* Progresso */}
                  {total > 0 && (
                    <div className="wc-day-progress">
                      <div
                        className="wc-day-progress-fill"
                        style={{ width: `${(done / total) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Pills de tarefas */}
                  <div className="wc-task-pills">
                    {day.tarefas?.map((task, i) => {
                      const taskId = makeTaskId(day.data, i);
                      const isDone = taskStatuses[taskId] === 'done';
                      const color = (OBJETIVO_CONFIG[task.objetivo] || {}).color || '#6b7280';

                      return (
                        <div
                          key={taskId}
                          className={`wc-task-pill ${isDone ? 'done' : ''}`}
                          style={{
                            borderLeftColor: color,
                            background: isDone
                              ? 'rgba(34,197,94,0.08)'
                              : 'var(--bg-primary)',
                          }}
                          title={task.tema}
                        >
                          <span className="wc-pill-time">{task.horario}</span>
                          <span className="wc-pill-icon">
                            {(FORMAT_CONFIG[task.formato] || {}).icon || '📄'}
                          </span>
                          <span className="wc-pill-tema">{task.tema}</span>
                          {isDone && <span className="wc-pill-check">✓</span>}
                        </div>
                      );
                    })}

                    {(!day.tarefas || day.tarefas.length === 0) && (
                      <div className="wc-day-empty">Livre</div>
                    )}
                  </div>

                  {/* Rodapé: X/Y */}
                  {total > 0 && (
                    <div className={`wc-day-footer ${allDone ? 'all-done' : ''}`}>
                      {allDone ? '✓ Tudo feito' : `${done}/${total}`}
                    </div>
                  )}
                </div>
              );
            })}
      </div>

      {/* Legenda */}
      <div className="wc-legend">
        {Object.entries(OBJETIVO_CONFIG).map(([obj, cfg]) => (
          <span key={obj} className="wc-legend-item">
            <span className="wc-legend-dot" style={{ background: cfg.color }} />
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
