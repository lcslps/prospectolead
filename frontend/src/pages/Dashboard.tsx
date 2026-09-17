import { Button } from '../components/ui/Button';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { getData } from '../services/api';
import type { DashboardData, CrmStage } from '../types';
import { CRM_PIPELINE_STAGES, CRM_STAGE_LABELS, pipelineStage } from '../lib/utils';
import { PageLoader } from '../components/UI';
import './dashboard.css';

const number = (value: number) => value.toLocaleString('pt-BR');
const rate = (value: number, total: number) => total ? value / total * 100 : 0;
const percent = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    getData<DashboardData>('/dashboard').then(result => { if (active) { setData(result); setError(''); } })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  if (loading) return <PageLoader />;
  if (error || !data) return <div className="panel !p-6" role="alert"><p>{error || 'Não foi possível carregar o dashboard.'}</p><Button variant="unstyled" className="btn-primary mt-4" onClick={() => setRefresh(v => v + 1)}>Tentar novamente</Button></div>;
  const counts: Record<string, number> = Object.fromEntries(CRM_PIPELINE_STAGES.map(stage => [stage, 0]));
  for (const [stage, count] of Object.entries(data.crmStats?.porStage ?? {})) {
    const key = pipelineStage(stage as CrmStage);
    counts[key] = (counts[key] ?? 0) + count;
  }
  const total = data.stats.totalLeads;
  const approached = total - counts.NEW;
  const scheduled = counts.SCHEDULED + counts.CLIENT;
  const conversion = rate(counts.CLIENT, total);
  const steps = [
    { label: 'Total', value: total, detail: 'Leads no CRM' },
    { label: 'Abordados', value: approached, detail: `${percent(rate(approached, total))} do total` },
    { label: 'Agendados', value: scheduled, detail: `${percent(rate(scheduled, approached))} dos abordados` },
    { label: 'Follow Up', value: counts.FOLLOW_UP, detail: `${percent(rate(counts.FOLLOW_UP, approached))} dos abordados` },
    { label: 'Perdidos', value: counts.LOST, detail: `${percent(rate(counts.LOST, approached))} dos abordados` },
    { label: 'Convertidos', value: counts.CLIENT, detail: `${percent(rate(counts.CLIENT, scheduled))} dos agendados` },
  ];
  const metrics = [
    ['Taxa de conversão', conversion, 'Convertidos / Total', 'Quanto da sua base se tornou cliente.'],
    ['Taxa de abordagem', rate(approached, total), 'Abordados / Total', 'Quanto da base está sendo trabalhado.'],
    ['Taxa de agendamento', rate(scheduled, approached), 'Agendados / Abordados', 'Proporção encaminhada para reunião.'],
    ['Taxa de follow up', rate(counts.FOLLOW_UP, approached), 'Follow Up / Abordados', 'Acompanhe para evitar oportunidades paradas.'],
    ['Taxa de perdidos', rate(counts.LOST, approached), 'Perdidos / Abordados', 'Revise a abordagem e o perfil dos leads.'],
  ] as const;
  const recommendations = [
    ...(data.activity.followUpsAtrasados ? [{ title: `${number(data.activity.followUpsAtrasados)} follow-ups atrasados`, text: 'Retome os contatos que passaram da data prevista.', to: '/crm' }] : []),
    ...(approached > 0 && conversion < 10 ? [{ title: 'Conversão abaixo de 10%', text: 'Revise a proposta e prepare uma demonstração antes do próximo contato.', to: '/crm' }] : []),
    ...(counts.NEW ? [{ title: `${number(counts.NEW)} leads aguardando abordagem`, text: 'Priorize as próximas conversas e registre o retorno no CRM.', to: '/crm' }] : []),
    ...(data.activity.semSiteGerado ? [{ title: `${number(data.activity.semSiteGerado)} leads sem site gerado`, text: 'Crie uma proposta visual para apresentar ao negócio.', to: '/sites' }] : []),
  ];
  return <div className="analytics-page">
    <div className="workspace-heading"><div><p className="workspace-eyebrow">Sua operação em números</p><h2>Dashboard</h2><p>Visão geral da sua operação comercial.</p></div><Button variant="unstyled" className="btn-secondary" onClick={() => setRefresh(v => v + 1)}><RefreshCw size={15} />Atualizar</Button></div>
    <section className="analytics-panel" aria-labelledby="conversion-title">
      <div className="analytics-panel-heading"><h3 id="conversion-title">Funil de conversão</h3><span>Base do CRM · posição atual</span></div>
      <div className="conversion-chart" role="list" aria-label="Funil de conversão">{steps.map((step, index) => <div className="conversion-step" role="listitem" key={step.label}><div className="conversion-plot"><div className={`conversion-shape conversion-tone-${index}`} style={{ height: `${total ? 28 + step.value / total * 72 : 28}%` }} /><strong>{number(step.value)}</strong></div><b>{step.label}</b><small>{step.detail}</small></div>)}</div>
      <div className="conversion-summary"><dl className="conversion-rates">{metrics.map(([label, value, formula, description]) => <div key={label}><dt>{label}<small>{formula}</small></dt><dd><strong>{percent(value)}</strong><span>{description}</span></dd></div>)}</dl><div className="conversion-ring-block"><span>Total de leads no CRM</span><div className="conversion-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" /><circle cx="60" cy="60" r="50" pathLength="100" strokeDasharray={`${conversion} 100`} /></svg><strong>{number(total)}</strong></div><small>{percent(conversion)} convertidos</small></div></div>
      <p className="analytics-note">Indicadores estimados pela etapa atual: abordados incluem todas as etapas após Base; agendados incluem Agendado e Convertido. Não representam um histórico de reuniões.</p>
    </section>
    <div className="analytics-grid">
      <section className="analytics-panel"><div className="analytics-panel-heading"><h3>Funil de leads</h3><span>{number(total)} no CRM</span></div><div className="pipeline-bars">{CRM_PIPELINE_STAGES.map(stage => <div className="pipeline-bar-row" key={stage}><span>{CRM_STAGE_LABELS[stage]}</span><div role="meter" aria-label={CRM_STAGE_LABELS[stage]} aria-valuenow={counts[stage]} aria-valuemin={0} aria-valuemax={Math.max(total, 1)}><i style={{ width: `${rate(counts[stage], total)}%` }} /></div><b>{number(counts[stage])}</b></div>)}</div><Link className="analytics-link" to="/crm">Ver CRM <ArrowUpRight size={14} /></Link></section>
      <section className="analytics-panel"><div className="analytics-panel-heading"><h3>Recomendações</h3><span>Próximos passos</span></div><div className="analytics-recommendations">{recommendations.length ? recommendations.slice(0, 3).map(item => <Link to={item.to} key={item.title}><span className="recommendation-dot" /><div><b>{item.title}</b><p>{item.text}</p></div><ArrowUpRight size={16} /></Link>) : <div className="analytics-empty">{total ? 'Nenhuma pendência identificada. Continue acompanhando seus contatos.' : 'Adicione leads ao CRM para receber recomendações.'}<Link className="analytics-link" to="/prospeccao">Encontrar empresas <ArrowUpRight size={14} /></Link></div>}</div></section>
      <section className="analytics-panel"><div className="analytics-panel-heading"><h3>Uso e atividade</h3><span>Acumulado</span></div><div className="activity-grid">{[['Empresas encontradas', data.activity.empresasEncontradas], ['Leads no CRM', total], ['Sites gerados', data.stats.sitesGerados], ['Sites publicados', data.activity.sitesPublicados], ['Mensagens enviadas', data.activity.mensagensEnviadas], ['Campanhas', data.stats.campanhas]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{number(Number(value))}</strong></div>)}</div><div className="unavailable-usage"><span>Mensagens WA geradas · Scripts de ligação · Edições de site</span><small>Contagem de uso ainda não disponível.</small></div><p className="analytics-note">Limites de plano e renovação ainda não configurados.</p><Link className="analytics-link" to="/sites">Ver meus projetos <ArrowUpRight size={14} /></Link></section>
      <section className="analytics-panel"><div className="analytics-panel-heading"><h3>Leads recentes</h3><span>Últimos adicionados ao CRM</span></div><div className="analytics-recent">{data.ultimosLeads.length ? data.ultimosLeads.map(lead => <Link to={`/leads/${lead.id}`} key={lead.id}><div><b>{lead.nome}</b><small>{[lead.categoria || lead.nicho, lead.cidade].filter(Boolean).join(' · ') || 'Localização não informada'}</small></div><span>{CRM_STAGE_LABELS[pipelineStage(lead.crmStage)]}</span></Link>) : <p className="analytics-empty">Seus próximos contatos aparecerão aqui ao entrar no CRM.</p>}</div><Link className="analytics-link" to="/crm">Ver CRM <ArrowUpRight size={14} /></Link></section>
    </div>
  </div>;
}
