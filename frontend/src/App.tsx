import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { ProspeccaoPage } from './pages/Prospeccao';
import { LeadsPage } from './pages/Leads';
import { LeadDetailPage } from './pages/LeadDetail';
import { CRMPage } from './pages/CRM';
import { CampaignsPage } from './pages/Campaigns';
import { TemplatesPage } from './pages/Templates';
import { SettingsPage } from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/prospeccao" element={<ProspeccaoPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/crm" element={<CRMPage />} />
        <Route path="/campanhas" element={<CampaignsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}