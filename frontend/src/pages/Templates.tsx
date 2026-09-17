import { useCallback, useEffect, useState } from 'react';
import { MessageSquareText, Plus, Pencil, Trash2, Braces, Send, Eye } from 'lucide-react';
import { getData, postData, patchData, deleteData } from '../services/api';
import type { MessageTemplate } from '../types';
import { EmptyState, PageLoader } from '../components/UI';
import { Modal, ConfirmDialog } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Field } from '../components/ui/Field';
import { formatDate, previewTemplate } from '../lib/utils';

const VARIABLES = [
  '{empresa}',
  '{cidade}',
  '{estado}',
  '{nicho}',
  '{telefone}',
  '{site}',
  '{servico}',
];

interface TemplateForm {
  nome: string;
  conteudo: string;
  servico: string;
}

const EMPTY_FORM: TemplateForm = { nome: '', conteudo: '', servico: '' };

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: MessageTemplate;
  onEdit: (template: MessageTemplate) => void;
  onDelete: (template: MessageTemplate) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const content = showPreview ? previewTemplate(template.conteudo, template.servico) : template.conteudo;

  return (
    <div className="card flex flex-col p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{template.nome}</h3>
          <p className="text-xs text-slate-500">
            {template.servico ? `Serviço: ${template.servico}` : 'Sem serviço definido'}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => onEdit(template)}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => onDelete(template)}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={`mb-4 flex-1 whitespace-pre-wrap rounded-lg p-3 font-sans text-sm transition ${
          showPreview
            ? 'border border-indigo-200 bg-indigo-50/60 text-slate-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-slate-200'
            : 'bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
        }`}
      >
        {content}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>Criado em {formatDate(template.createdAt)}</span>
        <div className="flex items-center gap-1">
          {showPreview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-600 dark:text-indigo-400">
              <Eye className="h-3 w-3" /> prévia
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-semibold transition ${
              showPreview
                ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300'
            }`}
          >
            {showPreview ? (
              <>
                <Braces className="h-3 w-3" /> Ver variáveis
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" /> Ver prévia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MessageTemplate | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await getData<MessageTemplate[]>('/templates'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (template: MessageTemplate) => {
    setEditing(template);
    setForm({
      nome: template.nome,
      conteudo: template.conteudo,
      servico: template.servico ?? '',
    });
    setModalOpen(true);
  };

  const insertVariable = (variable: string) => {
    setForm((f) => ({ ...f, conteudo: `${f.conteudo} ${variable}` }));
  };

  const save = async () => {
    if (!form.nome.trim() || !form.conteudo.trim()) {
      toast.error('Preencha nome e conteúdo');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await patchData<MessageTemplate>(`/templates/${editing.id}`, {
          nome: form.nome.trim(),
          conteudo: form.conteudo.trim(),
          servico: form.servico.trim() || null,
        });
        toast.success('Template atualizado');
      } else {
        await postData<MessageTemplate>('/templates', {
          nome: form.nome.trim(),
          conteudo: form.conteudo.trim(),
          servico: form.servico.trim() || null,
        });
        toast.success('Template criado');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteData<null>(`/templates/${confirmDelete.id}`);
      toast.success('Template excluído');
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir template');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Modelos de mensagem com variáveis para personalização automática.</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="h-10 w-10" />}
          title="Nenhum template"
          description="Crie modelos de mensagem para usar na prospecção."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Criar template</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar template' : 'Novo template'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome" htmlFor="tp-nome" required>
              <Input
                id="tp-nome"
                placeholder="Ex: Primeiro contato - dentista"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </Field>
            <Field label="Serviço oferecido" htmlFor="tp-servico">
              <Input
                id="tp-servico"
                placeholder="Ex: marketing para clínicas"
                value={form.servico}
                onChange={(e) => setForm((f) => ({ ...f, servico: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Conteúdo" htmlFor="tp-conteudo" required>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500">Inserir variável:</span>
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-xs text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {v}
                </button>
              ))}
            </div>
            <Textarea
              id="tp-conteudo"
              className="min-h-[180px]"
              value={form.conteudo}
              onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
              placeholder="Oi, {empresa}! Encontrei vocês pesquisando por {nicho} em {cidade}..."
            />
          </Field>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Send className="h-3 w-3" /> Prévia
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-200">
              {previewTemplate(form.conteudo, form.servico)}
            </pre>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Salvar alterações' : 'Criar template'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir template"
        description={`Excluir o template "${confirmDelete?.nome}"?`}
      />
    </div>
  );
}