import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
export const SITES_DIR = path.join(DATA_DIR, 'sites');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SITES_DIR)) fs.mkdirSync(SITES_DIR, { recursive: true });
}

function emptyDb() {
  return { leads: [], usage: { month: '', used: 0 } };
}

function readDb() {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) return emptyDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { leads: Array.isArray(parsed.leads) ? parsed.leads : [], usage: parsed.usage || { month: '', used: 0 } };
  } catch {
    return emptyDb();
  }
}

function writeDb(db) {
  ensureDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getUsage() {
  const db = readDb();
  const month = currentMonthKey();
  if (db.usage.month !== month) return { month, used: 0 };
  return { month, used: db.usage.used || 0 };
}

export function incrementUsage(amount) {
  const db = readDb();
  const month = currentMonthKey();
  const used = db.usage.month === month ? (db.usage.used || 0) + amount : amount;
  db.usage = { month, used };
  writeDb(db);
  return { month, used };
}

export function listLeads(filters = {}) {
  const db = readDb();
  let leads = db.leads;

  if (filters.q) {
    const q = filters.q.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.niche?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.phone?.includes(q)
    );
  }
  if (filters.stage) leads = leads.filter((l) => l.stage === filters.stage);
  if (filters.tier) leads = leads.filter((l) => l.tier === filters.tier);
  if (filters.hasSite === 'false') leads = leads.filter((l) => !l.hasSite);
  if (filters.hasSite === 'true') leads = leads.filter((l) => l.hasSite);
  if (filters.hasPhone === 'true') leads = leads.filter((l) => Boolean(l.phone));
  if (filters.minScore) leads = leads.filter((l) => (l.score || 0) >= Number(filters.minScore));

  leads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return leads;
}

export function getLead(id) {
  const db = readDb();
  return db.leads.find((l) => l.id === id) || null;
}

export function upsertLeadsFromSearch(rawLeads) {
  const db = readDb();
  const now = new Date().toISOString();
  const saved = [];

  for (const raw of rawLeads) {
    const existing = raw.placeId ? db.leads.find((l) => l.placeId === raw.placeId) : null;
    if (existing) {
      saved.push(existing);
      continue;
    }
    const lead = {
      id: crypto.randomUUID(),
      placeId: raw.placeId || null,
      name: raw.name || 'Sem nome',
      niche: raw.niche || '',
      city: raw.city || '',
      state: raw.state || '',
      address: raw.address || '',
      phone: raw.phone || '',
      email: raw.email || '',
      hasSite: Boolean(raw.hasSite),
      websiteUrl: raw.websiteUrl || '',
      rating: raw.rating ?? null,
      reviewCount: raw.reviewCount || 0,
      googleMapsUri: raw.googleMapsUri || '',
      score: raw.score ?? 0,
      tier: raw.tier || 'Frio',
      stage: 'Base',
      status: 'Em aberto',
      notes: '',
      siteUrl: null,
      siteGeneratedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    db.leads.push(lead);
    saved.push(lead);
  }

  writeDb(db);
  return saved;
}

export function createManualLead(data) {
  const db = readDb();
  const now = new Date().toISOString();
  const lead = {
    id: crypto.randomUUID(),
    placeId: null,
    name: data.name || 'Sem nome',
    niche: data.niche || '',
    city: data.city || '',
    state: data.state || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    hasSite: Boolean(data.hasSite),
    websiteUrl: data.websiteUrl || '',
    rating: data.rating ?? null,
    reviewCount: data.reviewCount || 0,
    googleMapsUri: '',
    score: data.score ?? 50,
    tier: data.tier || 'Morno',
    stage: 'Base',
    status: 'Em aberto',
    notes: data.notes || '',
    siteUrl: null,
    siteGeneratedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db.leads.push(lead);
  writeDb(db);
  return lead;
}

export function updateLead(id, patch) {
  const db = readDb();
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  db.leads[idx] = { ...db.leads[idx], ...patch, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db.leads[idx];
}

export function deleteLead(id) {
  const db = readDb();
  const before = db.leads.length;
  const target = db.leads.find((l) => l.id === id);
  db.leads = db.leads.filter((l) => l.id !== id);
  writeDb(db);
  if (target?.siteUrl) {
    try {
      const filePath = path.join(SITES_DIR, `${id}.html`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignora erro ao remover arquivo do site
    }
  }
  return db.leads.length < before;
}

export function listSites() {
  const db = readDb();
  return db.leads
    .filter((l) => Boolean(l.siteUrl))
    .filter((l) => {
      try {
        return fs.existsSync(path.join(SITES_DIR, `${l.id}.html`));
      } catch {
        return true;
      }
    })
    .sort((a, b) => {
      const da = a.siteGeneratedAt ? new Date(a.siteGeneratedAt).getTime() : 0;
      const dbb = b.siteGeneratedAt ? new Date(b.siteGeneratedAt).getTime() : 0;
      return dbb - da;
    });
}

export function deleteLeadSite(id) {
  const db = readDb();
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  try {
    const filePath = path.join(SITES_DIR, `${id}.html`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignora erro ao remover arquivo
  }
  db.leads[idx] = {
    ...db.leads[idx],
    siteUrl: null,
    siteGeneratedAt: null,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.leads[idx];
}

export function duplicateLeadSite(id) {
  const db = readDb();
  const source = db.leads.find((l) => l.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const newId = crypto.randomUUID();
  const copy = {
    ...source,
    id: newId,
    placeId: null,
    name: `${source.name} (cópia)`,
    stage: 'Base',
    status: 'Em aberto',
    notes: '',
    siteUrl: source.siteUrl ? `/sites/${newId}.html` : null,
    siteGeneratedAt: source.siteUrl ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  db.leads.push(copy);
  writeDb(db);
  if (source.siteUrl) {
    try {
      const src = path.join(SITES_DIR, `${id}.html`);
      const dst = path.join(SITES_DIR, `${newId}.html`);
      if (fs.existsSync(src)) fs.copyFileSync(src, dst);
    } catch {
      // se a cópia do arquivo falhar, mantém o lead mesmo assim
    }
  }
  return copy;
}

export function stageCounts() {
  const db = readDb();
  const stages = ['Base', 'Abordado', 'Agendado', 'Follow Up', 'Convertido', 'Perdido'];
  const counts = Object.fromEntries(stages.map((s) => [s, 0]));
  for (const l of db.leads) {
    if (counts[l.stage] !== undefined) counts[l.stage] += 1;
  }
  return counts;
}
