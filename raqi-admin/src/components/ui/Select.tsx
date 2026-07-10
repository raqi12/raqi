import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, id, className = '', children, ...props }: SelectProps) {
  const selectId = id ?? label?.replace(/\s+/g, '-');
  return (
    <label className={`field ${className}`.trim()} htmlFor={selectId}>
      {label ? <span className="field__label">{label}</span> : null}
      <select id={selectId} className="select" {...props}>
        {children}
      </select>
    </label>
  );
}
