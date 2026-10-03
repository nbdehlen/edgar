import { createContext, useEffect, useState, type PropsWithChildren } from 'react';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem('edgar-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // The theme still works when browser storage is unavailable.
  }
  return null;
}

export const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState(getSavedTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const theme = preference ?? systemTheme;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemTheme(getSystemTheme());
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function setTheme(nextTheme: Theme) {
    setPreference(nextTheme);
    try {
      localStorage.setItem('edgar-theme', nextTheme);
    } catch {
      // Keep the in-memory preference if storage is unavailable.
    }
  }

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}
