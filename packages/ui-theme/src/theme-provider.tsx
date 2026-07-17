'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import { THEMES, type ThemeName } from '@unerp/ui-tokens';

/** 'system' resolves to light or dark from the OS preference. */
export type ThemeSetting = ThemeName | 'system';

export interface BrandingTokens {
  /** CSS custom properties, e.g. { '--color-primary': '#0055aa' }. */
  [cssVar: `--${string}`]: string;
}

interface ThemeContextValue {
  /** The user's chosen setting (may be 'system'). */
  setting: ThemeSetting;
  /** The concrete theme currently applied to <html data-theme>. */
  resolvedTheme: ThemeName;
  setTheme: (setting: ThemeSetting) => void;
  /** Inject customer-branding tokens at runtime (CSS vars on <html>). */
  applyBranding: (tokens: BrandingTokens) => void;
  clearBranding: () => void;
  themes: readonly ThemeName[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'unerp.theme';
const BRANDING_KEY = 'unerp.branding';

function systemTheme(): ThemeName {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function isThemeSetting(value: string | null): value is ThemeSetting {
  return value === 'system' || (THEMES as readonly string[]).includes(value ?? '');
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial setting when nothing is persisted. Defaults to 'system'. */
  defaultSetting?: ThemeSetting;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children, defaultSetting = 'system' }) => {
  const [setting, setSetting] = useState<ThemeSetting>(defaultSetting);
  const [resolvedTheme, setResolvedTheme] = useState<ThemeName>(
    defaultSetting === 'system' ? 'light' : defaultSetting,
  );

  // Hydrate persisted setting + branding on mount.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemeSetting(stored)) setSetting(stored);
    const branding = window.localStorage.getItem(BRANDING_KEY);
    if (branding) {
      try {
        const tokens = JSON.parse(branding) as BrandingTokens;
        for (const [key, value] of Object.entries(tokens)) {
          if (key.startsWith('--')) document.documentElement.style.setProperty(key, value);
        }
      } catch {
        window.localStorage.removeItem(BRANDING_KEY);
      }
    }
  }, []);

  // Apply the resolved theme and track OS preference while on 'system'.
  useEffect(() => {
    const apply = () => {
      const next = setting === 'system' ? systemTheme() : setting;
      setResolvedTheme(next);
      document.documentElement.setAttribute('data-theme', next);
    };
    apply();
    if (setting !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [setting]);

  const setTheme = useCallback((next: ThemeSetting) => {
    setSetting(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const applyBranding = useCallback((tokens: BrandingTokens) => {
    for (const [key, value] of Object.entries(tokens)) {
      if (key.startsWith('--')) document.documentElement.style.setProperty(key, value);
    }
    window.localStorage.setItem(BRANDING_KEY, JSON.stringify(tokens));
  }, []);

  const clearBranding = useCallback(() => {
    const branding = window.localStorage.getItem(BRANDING_KEY);
    if (branding) {
      try {
        const tokens = JSON.parse(branding) as BrandingTokens;
        for (const key of Object.keys(tokens)) {
          document.documentElement.style.removeProperty(key);
        }
      } catch {
        /* already unparseable — nothing applied */
      }
    }
    window.localStorage.removeItem(BRANDING_KEY);
  }, []);

  const value = useMemo(
    () => ({ setting, resolvedTheme, setTheme, applyBranding, clearBranding, themes: THEMES }),
    [setting, resolvedTheme, setTheme, applyBranding, clearBranding],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}
