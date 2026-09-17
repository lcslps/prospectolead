import { Button } from './ui/Button';
import { useEffect, useState, type ReactNode } from 'react';

export function initializeTheme() {
  let dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  try { const stored = localStorage.getItem('theme'); if (stored) dark = stored === 'dark'; } catch { /* Use the system preference when storage is unavailable. */ }
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* The current theme still works without storage. */ }
  }, [dark]);

  return (
    <Button variant="unstyled"
      onClick={() => setDark((v) => !v)}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label="Alternar tema"
      aria-pressed={dark}
      title={dark ? 'Modo claro' : 'Modo escuro'}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </Button>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
