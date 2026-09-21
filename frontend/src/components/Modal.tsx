import { Button } from './ui/Button';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (
    <div className="anim-modal-overlay fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`anim-modal-panel relative z-10 my-8 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 ${sizes[size]}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <Button variant="unstyled"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="unstyled" className="btn-secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="unstyled"
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}