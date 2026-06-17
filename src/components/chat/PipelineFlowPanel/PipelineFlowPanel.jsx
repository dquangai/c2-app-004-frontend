import React from 'react';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import './PipelineFlowPanel.css';

export function PipelineFlowPanel({
  steps,
  loading = false,
  phase = null,
  defaultOpen = true,
  title,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(defaultOpen);
  const panelTitle = title ?? t('chat.pipeline.defaultTitle');
  const statusLabels = {
    passed: t('chat.pipeline.pass'),
    done: t('chat.pipeline.done'),
    blocked: t('chat.pipeline.block'),
    skipped: t('chat.pipeline.skip'),
    active: t('chat.pipeline.running'),
    pending: t('chat.pipeline.pending'),
  };
  if (!steps?.length && !loading) {
    return null;
  }

  const doneCount = steps.filter((step) =>
    ['done', 'passed', 'blocked', 'skipped'].includes(step.status),
  ).length;

  return (
    <div className={`pipeline-flow${loading ? ' pipeline-flow--loading' : ''}`}>
      <button
        type="button"
        className="pipeline-flow-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="pipeline-flow-toggle-title">{panelTitle}</span>
        <span className="pipeline-flow-toggle-meta">
          {loading
            ? phase
              ? `${doneCount}/${steps.length} · ${phase}`
              : `${doneCount}/${steps.length} ${t('chat.pipeline.steps')}`
            : t('chat.pipeline.complete')}
        </span>
      </button>
      {open && (
        <ol className="pipeline-flow-steps">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`pipeline-flow-step pipeline-flow-step--${step.status}${
                index < steps.length - 1 ? ' pipeline-flow-step--has-next' : ''
              }`}
            >
              <div className="pipeline-flow-step-track" aria-hidden>
                <span className="pipeline-flow-step-dot" />
                {index < steps.length - 1 ? <span className="pipeline-flow-step-line" /> : null}
              </div>
              <div className="pipeline-flow-step-body">
                <span className="pipeline-flow-step-label">{step.label}</span>
                <span className="pipeline-flow-step-status">{statusLabels[step.status] || step.status}</span>
                {step.detail ? <span className="pipeline-flow-step-detail">{step.detail}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default PipelineFlowPanel;
