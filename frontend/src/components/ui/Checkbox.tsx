import { Input } from './Input';
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
      <Input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-medium text-slate-700 dark:text-slate-300">{children}</span>
    </label>
  );
}
