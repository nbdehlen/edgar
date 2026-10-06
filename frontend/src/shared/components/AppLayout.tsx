import { Link, NavLink, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

export function AppLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:rounded-md focus:bg-background focus:p-4">
        {t('layout.skipToContent')}
      </a>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="font-heading text-2xl font-semibold tracking-tight">
            Edgar<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4 text-sm" aria-label={t('layout.navigation')}>
              <NavLink to="/filings" className="hover:underline aria-[current=page]:font-semibold">
                {t('layout.filings')}
              </NavLink>
              <NavLink to="/summary" className="hover:underline aria-[current=page]:font-semibold">
                {t('layout.summary')}
              </NavLink>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
