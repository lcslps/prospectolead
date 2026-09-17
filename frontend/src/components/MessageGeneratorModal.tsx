import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { useEffect, useState } from 'react';
import { Copy, Check, MessageSquareText, PhoneCall } from 'lucide-react';
import { getData, postData } from '../services/api';
import type { MessageTemplate } from '../types';
import { Modal } from './Modal';
import { Spinner } from './UI';
import { useToast } from './Toast';
import { whatsAppLink } from '../lib/utils';

export interface MessageLeadRef {
  telefone?: string | null;
  telefoneInternacional?: string | null;
}

export function MessageGeneratorModal({
  open,
  onClose,
  leadIds,
  leadRef,
}: {
  open: boolean;
  onClose: () => void;
  leadIds: string[] | string;
  leadRef?: MessageLeadRef | null;
}) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selected, setSelected] = useState<string>('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setTemplatesLoading(true);
    setSelected('');
    setMessage('');
    getData<MessageTemplate[]>('/templates')
      .then((data) => {
        setTemplates(data);
        if (data.length > 0) setSelected(data[0].id);
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setTemplatesLoading(false));
  }, [open, toast]);

  const generate = async () => {
    if (!selected) {
      toast.error('Crie um template antes de gerar mensagens');
      return;
    }
    setGenerating(true);
    setMessage('');
    setCopied(false);
    try {
      if (Array.isArray(leadIds) && leadIds.length > 1) {
        const first = leadIds[0];
        const result = await postData<{ message: string }>('/messages/generate', {
          templateId: selected,
          leadId: first,
        });
        setMessage(result.message);
        toast.success('Mensagem gerada (amostra do primeiro lead selecionado)');
      } else {
        const leadId = Array.isArray(leadIds) ? leadIds[0] : leadIds;
        const result = await postData<{ message: string }>('/messages/generate', {
          templateId: selected,
          leadId,
        });
        setMessage(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar mensagem');
    } finally {
      setGenerating(false);
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const waLink = leadRef ? whatsAppLink(leadRef.telefone, leadRef.telefoneInternacional, message) : null;

  return (
    <Modal open={open} onClose={onClose} title="Gerar mensagem" size="lg">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Template
          </label>
          {templatesLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Spinner className="h-4 w-4" /> Carregando templates...
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-amber-600">Nenhum template. Crie em Templates.</p>
          ) : (
            <Select
              className="input"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={generating}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          )}
        </div>

        {Array.isArray(leadIds) && leadIds.length > 1 && (
          <p className="text-xs text-slate-500">
            Mensagem gerada com dados do primeiro lead para você copiar e adaptar aos demais selecionados.
          </p>
        )}

        <Button variant="unstyled" className="btn-primary w-full" onClick={generate} disabled={generating || !selected}>
          {generating ? <Spinner className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
          {generating ? 'Gerando...' : 'Gerar mensagem'}
        </Button>

        {message && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mensagem</span>
              <div className="flex gap-2">
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !px-3 !py-1.5 text-xs"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    Abrir WhatsApp
                  </a>
                )}
                <Button variant="unstyled" className="btn-secondary !px-3 !py-1.5 text-xs" onClick={copyMessage}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copiado!' : 'COPIAR MENSAGEM'}
                </Button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-white p-3 font-sans text-sm text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100">
              {message}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}