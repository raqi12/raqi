import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

type DetailPanelProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function DetailPanel({ title, subtitle, onClose, children, footer }: DetailPanelProps) {
  return (
    <aside className="detail-panel" aria-label={title}>
      <header className="detail-panel__header">
        <div>
          <h3 className="detail-panel__title">{title}</h3>
          {subtitle ? <p className="detail-panel__subtitle">{subtitle}</p> : null}
        </div>
        <Button type="button" variant="ghost" onClick={onClose} aria-label="إغلاق">
          ✕
        </Button>
      </header>
      <div className="detail-panel__body">{children}</div>
      {footer ? <footer className="detail-panel__footer">{footer}</footer> : null}
    </aside>
  );
}
