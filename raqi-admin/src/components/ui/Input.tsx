import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, hint, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s+/g, '-');
  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      {label ? <span className="field__label">{label}</span> : null}
      <input id={inputId} className="input" {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}
