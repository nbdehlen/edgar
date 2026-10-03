import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@/shared/components/ThemeProvider';
import { Button } from '@/shared/components/button';

export function ThemeToggle() {
  const { t } = useTranslation();
  const context = use(ThemeContext);
  if (!context) throw new Error('ThemeToggle requires ThemeProvider.');
  const { theme, setTheme } = context;
  const isDark = theme === 'dark';

  return (
    <Button variant="outline" aria-pressed={isDark} onClick={() => setTheme(isDark ? 'light' : 'dark')}>
      {t('layout.darkMode')}
    </Button>
  );
}
