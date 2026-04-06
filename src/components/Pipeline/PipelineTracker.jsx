import { AGENT_STEPS } from '../../utils/constants.js';
import './PipelineTracker.css';

export default function PipelineTracker({ currentStep, status }) {
  const getStepState = (index) => {
    if (status === 'package_ready') return 'completed';
    if (index < currentStep) return 'completed';
    if (index === currentStep) {
      if (status.includes('review')) return 'review';
      if (status.includes('running')) return 'active';
      return 'active';
    }
    return 'pending';
  };

  const getConnectorState = (index) => {
    if (status === 'package_ready') return 'completed';
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return '';
  };

  if (status === 'idle') return null;

  return (
    <div className="pipeline-tracker">
      {AGENT_STEPS.map((step, index) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`pipeline-step ${getStepState(index)}`}>
            <div className="pipeline-step-number">
              {getStepState(index) === 'completed' ? '✓' : step.emoji}
            </div>
            <div className="pipeline-step-info">
              <span className="pipeline-step-name">{step.nome}</span>
              <span className="pipeline-step-model">
                {step.modelo.replace('gemini-1.5-', '')}
              </span>
            </div>
          </div>
          {index < AGENT_STEPS.length - 1 && (
            <div className={`pipeline-connector ${getConnectorState(index)}`} />
          )}
        </div>
      ))}

      {status === 'package_ready' && (
        <>
          <div className="pipeline-connector completed" />
          <div className="pipeline-step package">
            <div className="pipeline-step-number">📦</div>
            <div className="pipeline-step-info">
              <span className="pipeline-step-name" style={{ color: 'var(--text-primary)' }}>
                Pacote Final
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
