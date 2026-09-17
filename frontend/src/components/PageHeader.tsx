import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <header className="workspace-heading page-header"><div><h2>{title}</h2><p>{description}</p></div>{actions && <div className="page-header-actions">{actions}</div>}</header>;
}
