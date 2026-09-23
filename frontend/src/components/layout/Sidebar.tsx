import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  desc?: string;
}

interface SidebarProps {
  title: string;
  items: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}

export default function Sidebar({ title, items, activeId, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-[#e4e7ec] bg-white px-5 py-6 sticky top-0 h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-blue-600 flex items-center justify-center font-extrabold font-['Poppins',_sans-serif] text-white">
          AI
        </div>
        <div>
          <h1 className="text-[15px] font-['Poppins',_sans-serif] font-semibold tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6570] mb-2 px-2">
        Menu
      </p>
      <nav className="flex flex-col gap-1.5">
        {items.map((item) => {
          const active = item.id === activeId;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-left rounded-[10px] px-3.5 py-3 border transition ${
                active
                  ? 'bg-blue-600 text-white border-transparent font-semibold'
                  : 'bg-[#f1f3f6] text-[#1a1d21] border-[#e4e7ec] hover:bg-[#e8ebf0]'
              }`}
            >
              <span className="flex items-center gap-2 text-[14px]">
                {Icon && <Icon size={16} strokeWidth={2.25} />}
                {item.label}
              </span>
              {item.desc && (
                <span
                  className={`block text-[11.5px] mt-0.5 font-normal ${
                    active ? 'text-white/80' : 'text-[#5f6570]'
                  }`}
                >
                  {item.desc}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
