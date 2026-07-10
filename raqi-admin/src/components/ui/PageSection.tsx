import type { ReactNode } from 'react';

type PageSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageSection({
  title,
  description,
  actions,
  children,
  className = '',
}: PageSectionProps) {
  return (
    <section className={`section ${className}`.trim()}>
      <header className="section__header">
        <div>
          <h2 className="section__title">{title}</h2>
          {description ? <p className="section__description">{description}</p> : null}
        </div>
        {actions ? <div className="section__actions">{actions}</div> : null}
      </header>
      <div className="section__body">{children}</div>
    </section>
  );
}
