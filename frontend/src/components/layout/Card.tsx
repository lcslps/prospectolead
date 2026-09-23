import type { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export default function Card({ className = '', children }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#e4e7ec] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
