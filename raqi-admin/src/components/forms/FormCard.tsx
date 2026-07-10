import type { FormEvent, ReactNode } from 'react';
import { Button } from '../ui/Button';

type FormCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  loading?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function FormCard({
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'حفظ',
  loading = false,
}: FormCardProps) {
  const content = (
    <>
      <header className="form-card__header">
        <div>
          <h2 className="form-card__title">{title}</h2>
          {description ? <p className="form-card__description">{description}</p> : null}
        </div>
      </header>
      <div className="form-card__body">{children}</div>
      {onSubmit ? (
        <footer className="form-card__footer">
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : submitLabel}
          </Button>
        </footer>
      ) : null}
    </>
  );

  if (onSubmit) {
    return (
      <section className="form-card">
        <form className="form-card__form" onSubmit={onSubmit} noValidate>
          {content}
        </form>
      </section>
    );
  }

  return <section className="form-card">{content}</section>;
}
