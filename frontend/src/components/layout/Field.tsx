import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export const inputClassName =
  'bg-white border border-[#d4d9e0] focus:border-[#5b8cff] rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#1a1d21] placeholder:text-[#9aa0ab] outline-none';

export default function Field({ label, children, className = '' }: FieldProps) {
  return (
    <div className={`mt-3.5 first:mt-0 ${className}`}>
      <label className="block text-[12.5px] text-[#5f6570] font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}
