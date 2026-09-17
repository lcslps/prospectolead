import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

export function Checkbox({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-center gap-2.5 text-sm ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition ${
          checked
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : 'border-slate-300 bg-white text-transparent group-hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-800'
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-medium text-slate-700 dark:text-slate-300">{children}</span>
    </label>
  );
}