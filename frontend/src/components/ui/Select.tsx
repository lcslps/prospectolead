import { ChevronDown, Loader2 } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  loading?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, loading = false, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <div className={`relative ${className}`}>
      <select
        ref={ref}
        className={`input w-full appearance-none !pr-9 cursor-pointer ${
          invalid ? '!border-red-500 !ring-red-500/30' : ''
        }`}
        disabled={disabled || loading}
        {...rest}
      >
        {children}
      </select>
      {loading ? (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
    </div>
  );
});