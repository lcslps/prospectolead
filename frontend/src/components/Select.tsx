import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, PenLine, Plus, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  // Permite criar um valor novo digitando (ex.: nicho fora da lista).
  creatable?: boolean;
  createLabel?: (query: string) => string;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  creatable = false,
  createLabel = (q: string) => `Usar "${q}"`,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const displayLabel = options.find((o) => o.value === value)?.label || (creatable && value ? value : null);
  const trimmedQuery = query.trim();
  const filtered = trimmedQuery
    ? options.filter((o) => o.label.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : options;
  const exactMatch =
    trimmedQuery &&
    options.some(
      (o) =>
        o.label.toLowerCase() === trimmedQuery.toLowerCase() ||
        o.value.toLowerCase() === trimmedQuery.toLowerCase()
    );
  const showCreate = creatable && searchable && trimmedQuery && !exactMatch;
  // Quando a busca não retorna nada, o ícone vira escrita (criação).
  const noResults = searchable && trimmedQuery && filtered.length === 0;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlight(Math.max(0, filtered.findIndex((o) => o.value === value)));
      const t = setTimeout(() => {
        if (searchable) searchRef.current?.focus();
        else listRef.current?.focus();
      }, 30);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onTriggerKey(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (rowCount ? (h + 1) % rowCount : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (rowCount ? (h - 1 + rowCount) % rowCount : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showCreate && highlight === filtered.length) choose(trimmedQuery);
      else {
        const opt = filtered[highlight];
        if (opt) choose(opt.value);
      }
    }
  }

  const rowCount = filtered.length + (showCreate ? 1 : 0);

  const list = searchable ? filtered : options;

  function renderCreateRow() {
    if (!showCreate) return null;
    const i = filtered.length;
    const isHighlight = i === highlight;
    return (
      <li key="__create">
        <button
          type="button"
          onMouseEnter={() => setHighlight(i)}
          onClick={() => choose(trimmedQuery)}
          className={
            'w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left font-medium transition-colors ' +
            (isHighlight ? 'bg-[#eef4ff] text-[#2f5fe0]' : 'text-[#2f5fe0]')
          }
        >
          <Plus size={15} className="shrink-0" />
          <span className="flex-1 truncate">{createLabel(trimmedQuery)}</span>
        </button>
      </li>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          'w-full flex items-center justify-between gap-2 bg-white border border-[#d4d9e0] rounded-[10px] ' +
          'px-3 py-2.5 text-[13.5px] text-left outline-none transition-colors ' +
          (open ? 'border-[#5b8cff] ' : '') +
          (disabled ? 'bg-[#f4f6f9] text-[#9aa0ab] cursor-not-allowed ' : 'hover:border-[#9aa0ab] ')
        }
      >
        <span className={'flex-1 truncate ' + (displayLabel ? 'text-[#1a1d21]' : 'text-[#9aa0ab]')}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={'shrink-0 text-[#9aa0ab] transition-transform ' + (open ? 'rotate-180' : '')}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-[#d4d9e0] rounded-[10px] shadow-[0_12px_32px_rgba(16,24,40,0.14)] overflow-hidden">
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#e8ebf0]">
              {noResults ? (
                <PenLine size={14} className="shrink-0 text-[#2f5fe0]" />
              ) : (
                <Search size={14} className="shrink-0 text-[#9aa0ab]" />
              )}
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onListKey}
                placeholder={searchPlaceholder}
                className="w-full text-[13px] text-[#1a1d21] placeholder:text-[#9aa0ab] outline-none bg-transparent"
              />
            </div>
          )}
          <ul
            ref={listRef}
            role="listbox"
            id={listId}
            aria-label={placeholder}
            onKeyDown={searchable ? undefined : onListKey}
            tabIndex={searchable ? undefined : 0}
            className="max-h-60 overflow-y-auto py-1 outline-none"
          >
            {list.length === 0 && !showCreate && (
              <li className="px-3 py-2.5 text-[13px] text-[#9aa0ab]">Nenhum resultado</li>
            )}
            {list.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlight = i === highlight;
              return (
                <li key={opt.value + opt.label}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(opt.value)}
                    className={
                      'w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left transition-colors ' +
                      (isSelected ? 'text-[#1a1d21] font-semibold ' : 'text-[#3b4252] ') +
                      (isHighlight ? 'bg-[#f1f5ff] ' : '')
                    }
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <Check size={15} className="shrink-0 text-[#2f5fe0]" />}
                  </button>
                </li>
              );
            })}
            {renderCreateRow()}
          </ul>
        </div>
      )}
    </div>
  );
}
