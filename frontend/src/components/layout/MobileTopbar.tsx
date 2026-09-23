import type { ReactNode } from 'react';

interface MobileTopbarProps {
  label: string;
  icon?: ReactNode;
}

export default function MobileTopbar({ label, icon }: MobileTopbarProps) {
  return (
    <div className="md:hidden flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#e4e7ec] bg-white sticky top-0 z-10">
      <div className="w-[30px] h-[30px] rounded-[8px] bg-blue-600 flex items-center justify-center font-extrabold font-['Poppins',_sans-serif] text-white text-[13px]">
        AI
      </div>
      <span className="flex items-center gap-1.5 text-[14px] font-semibold">
        {icon}
        {label}
      </span>
    </div>
  );
}
