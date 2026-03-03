// src/contexts/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const THEMES = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-tertiary': '#f1f5f9',
    '--bg-card': '#ffffff',
    '--bg-hover': '#f1f5f9',
    '--bg-input': '#ffffff',

    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--text-white': '#ffffff',
    '--text-inverse': '#ffffff',

    '--border-color': '#e2e8f0',
    '--border-focus': '#ef4444',

    '--brand-primary': '#ef4444',
    '--brand-light': '#fef2f2',
    '--brand-dark': '#991b1b',

    '--shadow-sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
    '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.1)',
    '--shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.1)',

    '--nav-bg': 'rgba(255,255,255,0.98)',
    '--nav-border': '#ef4444',

    '--switch-off': '#cbd5e1',
    '--overlay': 'rgba(0,0,0,0.5)',
  },
  dark: {
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-tertiary': '#334155',
    '--bg-card': '#1e293b',
    '--bg-hover': '#334155',
    '--bg-input': '#1e293b',

    '--text-primary': '#f1f5f9',
    '--text-secondary': '#94a3b8',
    '--text-muted': '#64748b',
    '--text-white': '#ffffff',
    '--text-inverse': '#0f172a',

    '--border-color': '#334155',
    '--border-focus': '#ef4444',

    '--brand-primary': '#ef4444',
    '--brand-light': '#1f1010',
    '--brand-dark': '#fca5a5',

    '--shadow-sm': '0 1px 2px 0 rgba(0,0,0,0.3)',
    '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.4)',
    '--shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.5)',

    '--nav-bg': 'rgba(15,23,42,0.98)',
    '--nav-border': '#ef4444',

    '--switch-off': '#475569',
    '--overlay': 'rgba(0,0,0,0.7)',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Lire depuis localStorage ou préférence système
    const saved = localStorage.getItem('careasy-theme');
    if (saved && (saved === 'light' || saved === 'dark')) return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  // Appliquer les CSS variables et l'attribut data-theme à chaque changement
  useEffect(() => {
    const root = document.documentElement;
    const vars = THEMES[theme] || THEMES.light;

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    root.setAttribute('data-theme', theme);
    localStorage.setItem('careasy-theme', theme);
  }, [theme]);

  // Écouter la préférence système si thème = 'system'
  useEffect(() => {
    const saved = localStorage.getItem('careasy-theme');
    if (saved === 'system' || !saved) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  const changeTheme = (newTheme) => {
    if (newTheme === 'system') {
      localStorage.setItem('careasy-theme', 'system');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans ThemeProvider');
  return ctx;
}