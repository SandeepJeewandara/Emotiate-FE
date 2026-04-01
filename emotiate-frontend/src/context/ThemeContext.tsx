import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode:   ThemeMode;
  toggle: () => void;
  t:      ThemeTokens;
}

export interface ThemeTokens {
  bg:         string;
  bgAlt:      string;
  sidebar:    string;
  card:       string;
  cardHover:  string;
  border:     string;
  borderHover:string;
  text:       string;
  muted:      string;
  faint:      string;
  gold:       string;
  goldLight:  string;
  goldDark:   string;
  input:      string;
  inputFocus: string;
  tableRow:   string;
  navActive:  string;
  navHover:   string;
  shadow:     string;
  overlay:    string;
  modalBg:    string;
  statCard:   string;
  notifBg:    string;
}

const DARK: ThemeTokens = {
  bg:          '#07091A',
  bgAlt:       '#0D1021',
  sidebar:     '#090C1D',
  card:        'rgba(255,255,255,0.035)',
  cardHover:   'rgba(255,255,255,0.06)',
  border:      'rgba(196,162,99,0.14)',
  borderHover: 'rgba(196,162,99,0.32)',
  text:        '#EAE6DE',
  muted:       'rgba(234,230,222,0.5)',
  faint:       'rgba(234,230,222,0.22)',
  gold:        '#C4A263',
  goldLight:   '#E2C07C',
  goldDark:    '#A08040',
  input:       'rgba(255,255,255,0.05)',
  inputFocus:  'rgba(196,162,99,0.12)',
  tableRow:    'rgba(196,162,99,0.04)',
  navActive:   'rgba(196,162,99,0.12)',
  navHover:    'rgba(196,162,99,0.07)',
  shadow:      '0 4px 24px rgba(0,0,0,0.5)',
  overlay:     'rgba(0,0,0,0.72)',
  modalBg:     '#0D1126',
  statCard:    'rgba(255,255,255,0.035)',
  notifBg:     '#0D1126',
};

const LIGHT: ThemeTokens = {
  bg:          '#F5F2ED',
  bgAlt:       '#EDE9E2',
  sidebar:     '#FFFFFF',
  card:        '#FFFFFF',
  cardHover:   '#FDFAF5',
  border:      'rgba(168,138,73,0.18)',
  borderHover: 'rgba(168,138,73,0.38)',
  text:        '#1C1810',
  muted:       '#7A6E5E',
  faint:       '#BDB3A4',
  gold:        '#9A7230',
  goldLight:   '#7A5818',
  goldDark:    '#6B4A10',
  input:       '#FFFFFF',
  inputFocus:  'rgba(154,114,48,0.08)',
  tableRow:    'rgba(154,114,48,0.04)',
  navActive:   'rgba(154,114,48,0.1)',
  navHover:    'rgba(154,114,48,0.06)',
  shadow:      '0 4px 24px rgba(0,0,0,0.08)',
  overlay:     'rgba(28,24,16,0.6)',
  modalBg:     '#FFFFFF',
  statCard:    '#FFFFFF',
  notifBg:     '#FFFFFF',
};

const ThemeCtx = createContext<ThemeContextValue>({
  mode: 'dark',
  toggle: () => {},
  t: DARK,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('el_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('el_theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  const t = mode === 'dark' ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={{ mode, toggle, t }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
