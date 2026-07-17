import type React from 'react';

/** A single sidebar entry. A header groups child `items` under a label. */
export interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  isHeader?: boolean;
  items?: SidebarItem[];
  /** Short "what does this page do?" hint, shown as a hover tooltip. */
  description?: string;
}

/** The resolved navigation for the active module (sidebar title + entries). */
export interface ModuleNav {
  title: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  items: SidebarItem[];
}

/** A top-level application shown in the app switcher. */
export interface AppDefinition {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  installed: boolean;
}

/** A folder grouping of apps in the switcher. */
export interface SwitcherFolder {
  id: string;
  name: string;
  color: string;
  appIds: string[];
}
