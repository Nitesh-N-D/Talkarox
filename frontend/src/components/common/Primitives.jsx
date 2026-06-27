import { forwardRef } from 'react';
import clsx from 'clsx';

export function Card({ children, className = '', hover = false, padding = 'p-5', ...props }) {
  return (
    <div
      className={clsx(
        'bg-paper-card rounded-card shadow-card border border-gray-100',
        padding,
        hover && 'transition-all duration-200 hover:shadow-lifted hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, hint, className = '', id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-input border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors',
            Icon && 'pl-10',
            error ? 'border-danger' : 'border-gray-300',
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
    </div>
  );
});

export const TextArea = forwardRef(function TextArea(
  { label, error, className = '', id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full rounded-input border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors',
          error ? 'border-danger' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, options = [], className = '', id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full rounded-input border bg-white px-3.5 py-2.5 text-sm text-ink',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors',
          error ? 'border-danger' : 'border-gray-300',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
    </div>
  );
});
