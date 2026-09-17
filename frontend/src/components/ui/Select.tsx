import { Check, ChevronDown, Search, X } from 'lucide-react';
import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type SelectHTMLAttributes, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Input } from './Input';
import './controls.css';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  loading?: boolean;
  placeholder?: string;
}
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, loading, className = '', children, disabled, placeholder = 'Selecione...', id, ...rest }, ref,
) {
  const uid = useId();
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [label, setLabel] = useState('');
  const [options, setOptions] = useState<{ value: string; label: string; disabled: boolean; selected: boolean }[]>([]);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 320 });
  useImperativeHandle(ref, () => native.current!);
  // Read rendered options to support existing fragments, optgroups and native form events.
  useLayoutEffect(() => {
    const wrapper = trigger.current?.parentElement;
    const labelElement = wrapper?.closest('label') ?? wrapper?.parentElement?.querySelector(':scope > label');
    const labelText = labelElement?.querySelector('span')?.textContent ?? (labelElement?.contains(wrapper ?? null) ? '' : labelElement?.textContent);
    if (labelText) setLabel(labelText.trim());
    const next = Array.from(native.current?.options ?? []).map(o => ({ value: o.value, label: o.text, disabled: o.disabled || (o.parentElement instanceof HTMLOptGroupElement && o.parentElement.disabled), selected: o.selected }));
    setOptions(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
  });
  const filtered = options.filter(o => normalize(o.label).includes(normalize(query)));
  const enabled = filtered.filter(o => !o.disabled);
  const close = (focus = false) => { setOpen(false); setQuery(''); if (focus) trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = trigger.current!.getBoundingClientRect();
      const below = innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const height = Math.min(320, Math.max(below, above));
      const width = Math.min(Math.max(rect.width, 220), innerWidth - 24);
      setPosition({ left: Math.max(12, Math.min(rect.left, innerWidth - width - 12)), top: below >= Math.min(320, above) ? rect.bottom + 6 : rect.top - height - 6, width, maxHeight: height });
    };
    update(); search.current?.focus();
    const outside = (e: PointerEvent) => { if (!popup.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close(); };
    const focusOutside = (e: FocusEvent) => { if (!popup.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', focusOutside);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', focusOutside); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open]);
  useEffect(() => { if (disabled || loading) setOpen(false); }, [disabled, loading]);
  useEffect(() => { popup.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active, query]);
  const pick = (value: string) => {
    const element = native.current!;
    for (const option of element.options) option.selected = rest.multiple ? option.value === value ? !option.selected : option.selected : option.value === value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    setOptions(old => old.map(o => ({ ...o, selected: Array.from(element.selectedOptions).some(s => s.value === o.value) })));
    if (!rest.multiple) close(true);
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      setActive(i => e.key === 'Home' ? 0 : e.key === 'End' ? Math.max(0, enabled.length - 1) : Math.max(0, Math.min(enabled.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))));
    }
    if (e.key === 'Enter' && open) { e.preventDefault(); if (enabled[active]) pick(enabled[active].value); }
    if (e.key === 'Tab') { close(true); }
  };
  const selected = options.filter(o => o.selected);
  return <div className={`ui-select ${className}`}>
    <select {...rest} id={undefined} ref={native} tabIndex={-1} aria-hidden="true" className="ui-select-native" disabled={disabled || loading} onInvalid={e => { e.preventDefault(); trigger.current?.focus(); setOpen(true); }}>{children}</select>
    <Button variant="unstyled" type="button" ref={trigger} id={id} className="ui-select-trigger" disabled={disabled || loading} role="combobox" aria-label={rest['aria-label'] || label || undefined} aria-labelledby={rest['aria-labelledby']} aria-describedby={rest['aria-describedby']} aria-required={rest.required} aria-invalid={invalid} aria-expanded={open} aria-controls={open ? `${uid}-list` : undefined} aria-haspopup="listbox" onKeyDown={keys} onClick={() => { setOpen(!open); setQuery(''); setActive(0); }}>
      <span>{loading ? 'Carregando...' : selected.length ? selected.map(o => o.label).join(', ') : placeholder}</span><ChevronDown size={16} className={open ? 'rotate-180' : ''} />
    </Button>
    {open && !disabled && createPortal(<div ref={popup} className="ui-select-popup" style={position} onKeyDown={keys}>
      <div className="ui-select-search"><Search size={16} /><Input ref={search} value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} placeholder="Filtrar..." aria-label="Filtrar opções" role="combobox" aria-expanded="true" aria-controls={`${uid}-list`} aria-activedescendant={enabled[active] ? `${uid}-option-${options.indexOf(enabled[active])}` : undefined} autoComplete="off" /><Button variant="unstyled" type="button" aria-label="Limpar busca" disabled={!query} onClick={() => { setQuery(''); setActive(0); search.current?.focus(); }}><X size={16} /></Button></div>
      <div className="ui-select-options" id={`${uid}-list`} role="listbox" aria-label={rest['aria-label'] || 'Opções'} aria-multiselectable={rest.multiple || undefined}>
        {filtered.map(option => <div id={`${uid}-option-${options.indexOf(option)}`} role="option" aria-selected={option.selected} aria-disabled={option.disabled} data-active={enabled[active] === option} key={option.value} className="ui-select-option" onPointerMove={() => { if (!option.disabled) setActive(enabled.indexOf(option)); }} onMouseDown={e => e.preventDefault()} onClick={() => { if (!option.disabled) pick(option.value); }}><span>{option.label}</span>{option.selected && <Check size={16} />}</div>)}
        {!filtered.length && <p className="ui-select-empty" role="status">Nenhum resultado encontrado.</p>}
      </div>
      {rest.multiple && <div className="ui-select-footer">{selected.length} selecionados<Button variant="unstyled" type="button" onClick={() => close(true)}>Concluir</Button></div>}
    </div>, document.body)}
  </div>;
});

export const MultiSelect = forwardRef<HTMLSelectElement, SelectProps>(function MultiSelect(props, ref) {
  return <Select {...props} multiple ref={ref} />;
});
