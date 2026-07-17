#!/usr/bin/env node
/**
 * UI Framework Migration Script
 * ─────────────────────────────
 * Automated migration of inline styles to .ui-* CSS utility classes.
 * 
 * Usage:
 *   node scripts/migrate-ui.mjs --dry-run          # Preview changes
 *   node scripts/migrate-ui.mjs --apply            # Apply changes
 *   node scripts/migrate-ui.mjs --apply --module=finance  # Single module
 *   node scripts/migrate-ui.mjs --report           # Generate compliance report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.join(ROOT, 'apps', 'web', 'app', '(dashboard)');

// ─── CLI Arguments ───
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const APPLY = args.includes('--apply');
const REPORT = args.includes('--report');
const MODULE_FILTER = args.find(a => a.startsWith('--module='))?.split('=')[1];

if (!DRY_RUN && !APPLY && !REPORT) {
  console.log('Usage: node scripts/migrate-ui.mjs [--dry-run | --apply | --report] [--module=name]');
  process.exit(0);
}

// ─── Style-to-Class Mapping Rules ───
// Each rule: { pattern (regex matching style={{...}}), replacement (className string), description }
// These are ordered by specificity — most specific first.

const STYLE_REPLACEMENTS = [
  // ── Layout Composites (most common — 216+200+160+162+138+135 occurrences) ──
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-6\)'\s*\}\}/g,
    className: 'ui-stack-6',
    desc: 'flex-col gap-6 → ui-stack-6'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-6\)',\s*animation:\s*'fadeInUp 0\.4s ease-out'\s*\}\}/g,
    className: 'ui-stack-6 ui-animate-in',
    desc: 'flex-col gap-6 animate → ui-stack-6 ui-animate-in'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-stack-4',
    desc: 'flex-col gap-4 → ui-stack-4'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-3\)'\s*\}\}/g,
    className: 'ui-stack-3',
    desc: 'flex-col gap-3 → ui-stack-3'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'ui-stack-2',
    desc: 'flex-col gap-2 → ui-stack-2'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-1\)'\s*\}\}/g,
    className: 'ui-stack-1',
    desc: 'flex-col gap-1 → ui-stack-1'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'ui-hstack-2',
    desc: 'flex items-center gap-2 → ui-hstack-2'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'var\(--space-3\)'\s*\}\}/g,
    className: 'ui-hstack-3',
    desc: 'flex items-center gap-3 → ui-hstack-3'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center'\s*\}\}/g,
    className: 'ui-flex-between',
    desc: 'flex justify-between items-center → ui-flex-between'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'center',\s*padding:\s*'var\(--space-12\)'\s*\}\}/g,
    className: 'ui-center-pad',
    desc: 'flex center padding-12 → ui-center-pad'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*gap:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'ui-flex ui-gap-2',
    desc: 'flex gap-2 → ui-flex ui-gap-2'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'flex-end'\s*\}\}/g,
    className: 'ui-flex-end',
    desc: 'flex justify-end → ui-flex-end'
  },
  {
    pattern: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*'var\(--space-3\)'\s*\}\}/g,
    className: 'ui-grid-2 ui-gap-3',
    desc: 'grid 2-col gap-3 → ui-grid-2 ui-gap-3',
    removeGapFromGrid: true
  },
  {
    pattern: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-grid-2',
    desc: 'grid 2-col gap-4 → ui-grid-2'
  },
  {
    pattern: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(auto-fit,\s*minmax\(200px,\s*1fr\)\)',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-grid-auto',
    desc: 'grid auto-fit 200px → ui-grid-auto'
  },

  // ── Text Composites (173+102+75+92+68 occurrences) ──
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-text-xs-muted',
    desc: 'text-xs text-secondary → ui-text-xs-muted'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*fontWeight:\s*'var\(--weight-semibold\)',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-text-xs-label',
    desc: 'text-xs semibold secondary → ui-text-xs-label'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*color:\s*'var\(--color-text-tertiary\)'\s*\}\}/g,
    className: 'ui-text-xs-tertiary',
    desc: 'text-xs tertiary → ui-text-xs-tertiary'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-sm\)',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-text-sm-muted',
    desc: 'text-sm text-secondary → ui-text-sm-muted'
  },
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-text-secondary\)',\s*fontSize:\s*'var\(--text-sm\)'\s*\}\}/g,
    className: 'ui-text-sm-muted',
    desc: 'text-secondary text-sm → ui-text-sm-muted (reversed)'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'11px',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-text-caption',
    desc: '11px text-secondary → ui-text-caption'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'10px',\s*color:\s*'var\(--color-text-tertiary\)'\s*\}\}/g,
    className: 'ui-text-micro',
    desc: '10px text-tertiary → ui-text-micro'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-lg\)',\s*fontWeight:\s*'var\(--weight-bold\)'\s*\}\}/g,
    className: 'ui-heading-lg',
    desc: 'text-lg bold → ui-heading-lg'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'var\(--weight-semibold\)',\s*fontSize:\s*'var\(--text-base\)'\s*\}\}/g,
    className: 'ui-heading-base',
    desc: 'semibold text-base → ui-heading-base'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'var\(--weight-semibold\)',\s*fontSize:\s*'var\(--text-sm\)'\s*\}\}/g,
    className: 'ui-heading-sm',
    desc: 'semibold text-sm → ui-heading-sm'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-sm\)',\s*fontWeight:\s*'var\(--weight-medium\)'\s*\}\}/g,
    className: 'ui-heading-sm',
    desc: 'text-sm weight-medium → ui-heading-sm'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*fontWeight:\s*'var\(--weight-semibold\)'\s*\}\}/g,
    className: 'ui-text-xs-label',
    desc: 'text-xs semibold → ui-text-xs-label'
  },

  // ── Single Property Styles (high frequency) ──
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-primary\)'\s*\}\}/g,
    className: 'ui-text-primary',
    desc: 'color primary → ui-text-primary'
  },
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-text-muted',
    desc: 'color text-secondary → ui-text-muted'
  },
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-text-tertiary\)'\s*\}\}/g,
    className: 'ui-text-tertiary',
    desc: 'color text-tertiary → ui-text-tertiary'
  },
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-success\)'\s*\}\}/g,
    className: 'ui-text-success',
    desc: 'color success → ui-text-success'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'var\(--weight-semibold\)'\s*\}\}/g,
    className: 'font-semibold',
    desc: 'weight semibold → font-semibold'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-sm\)'\s*\}\}/g,
    className: 'text-sm',
    desc: 'text-sm → text-sm'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)'\s*\}\}/g,
    className: 'text-xs',
    desc: 'text-xs → text-xs'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-5\)'\s*\}\}/g,
    className: 'p-5',
    desc: 'padding space-5 → p-5'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'p-4',
    desc: 'padding space-4 → p-4'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-6\)'\s*\}\}/g,
    className: 'p-6',
    desc: 'padding space-6 → p-6'
  },
  {
    pattern: /style=\{\{\s*flex:\s*1\s*\}\}/g,
    className: 'flex-1',
    desc: 'flex: 1 → flex-1'
  },
  {
    pattern: /style=\{\{\s*margin:\s*0\s*\}\}/g,
    className: 'm-0',
    desc: 'margin: 0 → m-0'
  },

  // ── Second-tier patterns (from re-scan of remaining styles) ──
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-danger\)'\s*\}\}/g,
    className: 'ui-text-danger',
    desc: 'color danger → ui-text-danger'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-sm\)',\s*fontWeight:\s*'var\(--weight-semibold\)'\s*\}\}/g,
    className: 'ui-heading-sm',
    desc: 'text-sm semibold → ui-heading-sm'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'var\(--weight-medium\)'\s*\}\}/g,
    className: 'font-medium',
    desc: 'weight medium → font-medium'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'var\(--weight-bold\)'\s*\}\}/g,
    className: 'font-bold',
    desc: 'weight bold → font-bold'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*600\s*\}\}/g,
    className: 'font-semibold',
    desc: 'fontWeight 600 → font-semibold'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-2xl\)',\s*fontWeight:\s*'var\(--weight-bold\)'\s*\}\}/g,
    className: 'text-2xl',
    desc: 'text-2xl bold → text-2xl'
  },
  {
    pattern: /style=\{\{\s*borderBottom:\s*'1px solid var\(--color-border\)'\s*\}\}/g,
    className: 'border-b',
    desc: 'border-bottom → border-b'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*gap:\s*'var\(--space-2\)',\s*justifyContent:\s*'flex-end'\s*\}\}/g,
    className: 'ui-flex-end ui-gap-2',
    desc: 'flex gap-2 justify-end → ui-flex-end ui-gap-2'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'flex-end',\s*gap:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'ui-flex-end ui-gap-2',
    desc: 'flex justify-end gap-2 → ui-flex-end ui-gap-2'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'flex-end',\s*gap:\s*'var\(--space-2\)',\s*marginTop:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'ui-flex-end ui-gap-2 mt-2',
    desc: 'flex justify-end gap-2 mt-2 → composites'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*marginBottom:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-flex-between mb-4',
    desc: 'flex between mb-4 → ui-flex-between mb-4'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*marginBottom:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'ui-flex-between mb-2',
    desc: 'flex between mb-2 → ui-flex-between mb-2'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'flex-start'\s*\}\}/g,
    className: 'ui-flex-between ui-items-start',
    desc: 'flex between items-start → composites'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between'\s*\}\}/g,
    className: 'ui-flex-between',
    desc: 'flex space-between → ui-flex-between'
  },
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-text-secondary\)',\s*marginTop:\s*'var\(--space-1\)'\s*\}\}/g,
    className: 'ui-text-muted mt-1',
    desc: 'text-secondary mt-1 → ui-text-muted mt-1'
  },
  {
    pattern: /style=\{\{\s*textAlign:\s*'center',\s*padding:\s*'var\(--space-12\)',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-empty-state',
    desc: 'text-center pad-12 secondary → ui-empty-state'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'p-2',
    desc: 'padding space-2 → p-2'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-3\)'\s*\}\}/g,
    className: 'p-3',
    desc: 'padding space-3 → p-3'
  },
  {
    pattern: /style=\{\{\s*width:\s*'100%'\s*\}\}/g,
    className: 'w-full',
    desc: 'width 100% → w-full'
  },
  {
    pattern: /style=\{\{\s*overflowX:\s*'auto'\s*\}\}/g,
    className: 'builder-table-wrapper',
    desc: 'overflowX auto → builder-table-wrapper'
  },
  {
    pattern: /style=\{\{\s*position:\s*'relative'\s*\}\}/g,
    className: 'relative',
    desc: 'position relative → relative (utility)'
  },
  {
    pattern: /style=\{\{\s*marginRight:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'mr-2',
    desc: 'marginRight space-2 → mr-2 (need to add utility)'
  },
  {
    pattern: /style=\{\{\s*fontFamily:\s*'monospace'\s*\}\}/g,
    className: 'font-mono',
    desc: 'fontFamily monospace → font-mono (need to add utility)'
  },
  {
    pattern: /style=\{\{\s*fontFamily:\s*'monospace',\s*fontSize:\s*'0\.75rem'\s*\}\}/g,
    className: 'font-mono text-xs',
    desc: 'monospace 0.75rem → font-mono text-xs'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-6\)',\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-5\)'\s*\}\}/g,
    className: 'p-6 ui-stack-5',
    desc: 'p-6 flex-col gap-5 → p-6 ui-stack-5'
  },

  // ── Third-tier patterns (from deep re-scan of remaining ~10K styles) ──

  // Card-like containers (42+17 occurrences)
  {
    pattern: /style=\{\{\s*background:\s*'var\(--color-bg-elevated\)',\s*border:\s*'1px solid var\(--color-border\)',\s*borderRadius:\s*'var\(--radius-lg\)',\s*padding:\s*'var\(--space-5\)'\s*\}\}/g,
    className: 'ui-card p-5',
    desc: 'card pattern p-5 → ui-card p-5'
  },
  {
    pattern: /style=\{\{\s*background:\s*'var\(--color-bg-elevated\)',\s*border:\s*'1px solid var\(--color-border\)',\s*borderRadius:\s*'var\(--radius-lg\)',\s*padding:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-card p-4',
    desc: 'card pattern p-4 → ui-card p-4'
  },

  // Ghost / unstyled buttons (38+23+15+13 occurrences)
  {
    pattern: /style=\{\{\s*background:\s*'none',\s*border:\s*'none',\s*cursor:\s*'pointer',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-btn-icon ui-text-muted',
    desc: 'ghost btn secondary → ui-btn-icon ui-text-muted'
  },
  {
    pattern: /style=\{\{\s*border:\s*'none',\s*background:\s*'none',\s*cursor:\s*'pointer',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-btn-icon ui-text-muted',
    desc: 'ghost btn secondary (alt) → ui-btn-icon ui-text-muted'
  },
  {
    pattern: /style=\{\{\s*background:\s*'none',\s*border:\s*'none',\s*cursor:\s*'pointer',\s*color:\s*'var\(--color-danger\)'\s*\}\}/g,
    className: 'ui-btn-icon ui-text-danger',
    desc: 'ghost btn danger → ui-btn-icon ui-text-danger'
  },
  {
    pattern: /style=\{\{\s*background:\s*'none',\s*border:\s*'none',\s*cursor:\s*'pointer'\s*\}\}/g,
    className: 'ui-btn-icon',
    desc: 'ghost btn → ui-btn-icon'
  },

  // Heading composites
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-2xl\)',\s*fontWeight:\s*'var\(--weight-bold\)',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'var\(--space-2\)'\s*\}\}/g,
    className: 'text-2xl ui-hstack-2',
    desc: 'text-2xl bold flex gap-2 → text-2xl ui-hstack-2'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-3xl\)',\s*fontWeight:\s*'var\(--weight-bold\)'\s*\}\}/g,
    className: 'text-3xl',
    desc: 'text-3xl bold → text-3xl'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-base\)',\s*fontWeight:\s*'var\(--weight-semibold\)'\s*\}\}/g,
    className: 'ui-heading-base',
    desc: 'text-base semibold → ui-heading-base'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'var\(--weight-bold\)',\s*fontSize:\s*'var\(--text-sm\)'\s*\}\}/g,
    className: 'ui-heading-sm font-bold',
    desc: 'bold text-sm → ui-heading-sm font-bold'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'var\(--weight-bold\)',\s*fontSize:\s*'var\(--text-lg\)'\s*\}\}/g,
    className: 'ui-heading-lg',
    desc: 'bold text-lg (reversed) → ui-heading-lg'
  },
  {
    pattern: /style=\{\{\s*fontWeight:\s*'bold'\s*\}\}/g,
    className: 'font-bold',
    desc: 'fontWeight bold string → font-bold'
  },

  // Padding composites
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-3\) var\(--space-4\)'\s*\}\}/g,
    className: 'py-3 px-4',
    desc: 'padding 3/4 → py-3 px-4'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-5\)',\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'p-5 ui-stack-4',
    desc: 'p-5 flex-col gap-4 → p-5 ui-stack-4'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-8\)',\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-6\)'\s*\}\}/g,
    className: 'p-8 ui-stack-6',
    desc: 'p-8 flex-col gap-6 → p-8 ui-stack-6'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-8\)',\s*display:\s*'flex',\s*justifyContent:\s*'center'\s*\}\}/g,
    className: 'p-8 ui-flex-center',
    desc: 'p-8 flex center → p-8 ui-flex-center'
  },

  // Color utilities
  {
    pattern: /style=\{\{\s*color:\s*'var\(--color-warning\)'\s*\}\}/g,
    className: 'ui-text-warning',
    desc: 'color warning → ui-text-warning'
  },

  // Flex variants
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*gap:\s*'var\(--space-1\)'\s*\}\}/g,
    className: 'ui-flex ui-gap-1',
    desc: 'flex gap-1 → ui-flex ui-gap-1'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*gap:\s*'var\(--space-3\)'\s*\}\}/g,
    className: 'ui-flex ui-gap-3',
    desc: 'flex gap-3 → ui-flex ui-gap-3'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-hstack-4',
    desc: 'flex items-center gap-4 → ui-hstack-4'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'var\(--space-1\)'\s*\}\}/g,
    className: 'ui-flex ui-items-center ui-gap-1',
    desc: 'flex items-center gap-1 → composites'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*justifyContent:\s*'space-between'\s*\}\}/g,
    className: 'ui-flex-between',
    desc: 'flex items-center between (alt order) → ui-flex-between'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column'\s*\}\}/g,
    className: 'ui-flex-col',
    desc: 'flex column (no gap) → ui-flex-col'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'4px'\s*\}\}/g,
    className: 'ui-stack-1',
    desc: 'flex-col gap-4px → ui-stack-1'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'16px'\s*\}\}/g,
    className: 'ui-stack-4',
    desc: 'flex-col gap-16px → ui-stack-4'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*4\s*\}\}/g,
    className: 'ui-flex ui-items-center ui-gap-1',
    desc: 'flex items-center gap-4px → composites'
  },

  // Grid variants
  {
    pattern: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*'var\(--space-6\)'\s*\}\}/g,
    className: 'ui-grid-2 ui-gap-6',
    desc: 'grid 2-col gap-6 → ui-grid-2 ui-gap-6'
  },
  {
    pattern: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(auto-fit,\s*minmax\(180px,\s*1fr\)\)',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-grid-auto-sm',
    desc: 'grid auto-fit 180px → ui-grid-auto-sm'
  },

  // Form label patterns
  {
    pattern: /style=\{\{\s*display:\s*'block',\s*marginBottom:\s*4,\s*fontWeight:\s*600,\s*fontSize:\s*'var\(--text-sm\)',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-label',
    desc: 'block label pattern → ui-label'
  },
  {
    pattern: /style=\{\{\s*display:\s*'block',\s*fontSize:\s*'var\(--text-xs\)',\s*fontWeight:\s*'var\(--weight-bold\)',\s*marginBottom:\s*'var\(--space-1\)'\s*\}\}/g,
    className: 'ui-label',
    desc: 'block label xs bold → ui-label'
  },
  {
    pattern: /style=\{\{\s*display:\s*'block',\s*marginBottom:\s*'var\(--space-1\)',\s*fontSize:\s*'var\(--text-sm\)',\s*fontWeight:\s*'var\(--weight-medium\)'\s*\}\}/g,
    className: 'ui-label',
    desc: 'block label sm medium → ui-label'
  },

  // Section header patterns
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-base\)',\s*fontWeight:\s*'var\(--weight-semibold\)',\s*marginBottom:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-heading-base mb-4',
    desc: 'section header base mb-4 → ui-heading-base mb-4'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-sm\)',\s*fontWeight:\s*'var\(--weight-bold\)',\s*marginBottom:\s*'var\(--space-3\)'\s*\}\}/g,
    className: 'ui-section-header',
    desc: 'section header sm bold mb-3 → ui-section-header'
  },

  // Misc high-frequency
  {
    pattern: /style=\{\{\s*marginBottom:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'mb-4',
    desc: 'marginBottom space-4 → mb-4'
  },
  {
    pattern: /style=\{\{\s*textAlign:\s*'right'\s*\}\}/g,
    className: 'text-right',
    desc: 'textAlign right → text-right'
  },
  {
    pattern: /style=\{\{\s*textAlign:\s*'center',\s*padding:\s*'var\(--space-12\)'\s*\}\}/g,
    className: 'text-center p-12',
    desc: 'text-center pad-12 → text-center p-12'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'center',\s*padding:\s*'var\(--space-8\)'\s*\}\}/g,
    className: 'ui-flex-center p-8',
    desc: 'flex center pad-8 → ui-flex-center p-8'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-5\)',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'p-5 ui-hstack-4',
    desc: 'p-5 flex items-center gap-4 → p-5 ui-hstack-4'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*fontSize:\s*'var\(--text-xs\)'\s*\}\}/g,
    className: 'ui-flex-between text-xs',
    desc: 'flex between text-xs → composites'
  },
  {
    pattern: /style=\{\{\s*marginRight:\s*6\s*\}\}/g,
    className: 'mr-2',
    desc: 'marginRight: 6 → mr-2'
  },
  {
    pattern: /style=\{\{\s*marginRight:\s*4\s*\}\}/g,
    className: 'mr-1',
    desc: 'marginRight: 4 → mr-1'
  },
  {
    pattern: /style=\{\{\s*flex:\s*1,\s*minWidth:\s*0\s*\}\}/g,
    className: 'flex-1 overflow-hidden',
    desc: 'flex-1 minWidth-0 → flex-1 overflow-hidden'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*color:\s*'var\(--color-text-secondary\)',\s*marginTop:\s*'var\(--space-1\)'\s*\}\}/g,
    className: 'ui-text-xs-muted mt-1',
    desc: 'text-xs secondary mt-1 → ui-text-xs-muted mt-1'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*11,\s*color:\s*'var\(--color-text-tertiary\)'\s*\}\}/g,
    className: 'ui-text-caption ui-text-tertiary',
    desc: 'fontSize-11 tertiary → ui-text-caption ui-text-tertiary'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'11px',\s*color:\s*'var\(--color-text-tertiary\)'\s*\}\}/g,
    className: 'ui-text-caption ui-text-tertiary',
    desc: '11px tertiary → ui-text-caption ui-text-tertiary'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'10px',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-text-micro ui-text-muted',
    desc: '10px secondary → ui-text-micro ui-text-muted'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*color:\s*'var\(--color-text-secondary\)',\s*margin:\s*0\s*\}\}/g,
    className: 'ui-text-xs-muted m-0',
    desc: 'text-xs secondary m-0 → composites'
  },
  {
    pattern: /style=\{\{\s*margin:\s*0,\s*fontSize:\s*'var\(--text-xs\)',\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g,
    className: 'ui-text-xs-muted m-0',
    desc: 'm-0 text-xs secondary → composites'
  },
  {
    pattern: /style=\{\{\s*margin:\s*0,\s*fontWeight:\s*'var\(--weight-semibold\)'\s*\}\}/g,
    className: 'm-0 font-semibold',
    desc: 'm-0 semibold → m-0 font-semibold'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'20px'\s*\}\}/g,
    className: 'p-5',
    desc: 'padding 20px → p-5'
  },

  // ── Phase 4.2 rules (exact-copy classes; see utilities.css "Phase 4.2 migration") ──
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*width:\s*'100%',\s*borderRadius:\s*'var\(--radius-md\)',\s*border:\s*'1px solid var\(--color-border\)',\s*paddingInline:\s*'var\(--space-3\)',\s*paddingBlock:\s*'var\(--space-2\)',\s*fontSize:\s*'var\(--text-sm\)'\s*\}\}/g,
    className: 'ui-field-line',
    desc: 'flex full input line → ui-field-line'
  },
  {
    pattern: /style=\{\{\s*width:\s*'100%',\s*padding:\s*'var\(--space-2\)',\s*borderRadius:\s*'var\(--radius-md\)',\s*border:\s*'1px solid var\(--color-border\)',\s*background:\s*'var\(--color-bg\)',\s*color:\s*'var\(--color-text\)'\s*\}\}/g,
    className: 'ui-field-box',
    desc: 'full bordered field → ui-field-box'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*color:\s*'var\(--color-text-muted\)'\s*\}\}/g,
    className: 'ui-text-xs-soft',
    desc: 'text-xs muted-token → ui-text-xs-soft'
  },
  {
    pattern: /style=\{\{\s*fontSize:\s*'var\(--text-xs\)',\s*color:\s*'var\(--color-text-secondary\)',\s*fontWeight:\s*'bold'\s*\}\}/g,
    className: 'ui-text-xs-bold-muted',
    desc: 'text-xs secondary bold → ui-text-xs-bold-muted'
  },
  {
    pattern: /style=\{\{\s*margin:\s*'0 auto var\(--space-4\) auto',\s*opacity:\s*0\.3\s*\}\}/g,
    className: 'ui-hr-faded',
    desc: 'centered faded divider → ui-hr-faded'
  },
  {
    pattern: /style=\{\{\s*position:\s*'absolute',\s*left:\s*'var\(--space-3\)',\s*top:\s*'50%',\s*transform:\s*'translateY\(-50%\)',\s*color:\s*'var\(--color-text-tertiary\)'\s*\}\}/g,
    className: 'ui-input-icon-abs',
    desc: 'absolute left-inset input icon → ui-input-icon-abs'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-4\)',\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-3\)'\s*\}\}/g,
    className: 'p-4 ui-stack-3',
    desc: 'p-4 flex-col gap-3 → p-4 ui-stack-3'
  },
  {
    pattern: /style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'var\(--space-2\)',\s*marginBottom:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'ui-hstack-2 mb-4',
    desc: 'flex items-center gap-2 mb-4 → ui-hstack-2 mb-4'
  },
  {
    pattern: /style=\{\{\s*padding:\s*'var\(--space-6\)',\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*gap:\s*'var\(--space-4\)'\s*\}\}/g,
    className: 'p-6 ui-stack-4',
    desc: 'p-6 flex-col gap-4 → p-6 ui-stack-4'
  },
];

// ─── className Merger ───
// When we replace style={{...}} with a className, we need to handle
// the case where className already exists on the element.
function replaceStyleWithClass(content, pattern, newClass) {
  let changeCount = 0;
  
  const result = content.replace(pattern, (match, offset) => {
    changeCount++;
    
    // Look backward from the match to find if there's already a className on this element
    const before = content.substring(Math.max(0, offset - 500), offset);
    
    // Check if this tag already has a className attribute before the style
    // We look for the pattern: className="..." or className={`...`} before style=
    const classNameBeforePattern = /className=["'{`]([^"'`]*)["'`}]\s*$/;
    const classNameBeforeMatch = before.match(classNameBeforePattern);
    
    if (classNameBeforeMatch) {
      // className exists before style - we need to merge
      // Return empty string for the style (it will be removed)
      // But we can't modify the className from here - we'll handle this differently
      return `className="${newClass}"`;
    }
    
    // No existing className before this style - simple replacement
    return `className="${newClass}"`;
  });
  
  return { result, changeCount };
}

// ─── Advanced className Merger ───
// Handles merging when className already exists
function mergeClassNames(content, pattern, newClass) {
  let changeCount = 0;
  
  // Strategy: For each match, check if the JSX element has an existing className
  // If so, merge the classes. If not, just replace.
  const result = content.replace(pattern, (match) => {
    changeCount++;
    return `className="${newClass}"`;
  });
  
  // Now handle the case where the element had BOTH className and style
  // Pattern: className="existing-classes" className="new-class"
  // This is invalid JSX — merge them
  const mergeResult = result.replace(
    /className="([^"]+)"\s+className="([^"]+)"/g,
    (_, cls1, cls2) => `className="${cls1} ${cls2}"`
  );
  
  // Also handle template literal classNames
  const mergeResult2 = mergeResult.replace(
    /className=\{`([^`]+)`\}\s+className="([^"]+)"/g,
    (_, cls1, cls2) => `className={\`${cls1} ${cls2}\`}`
  );
  
  return { result: mergeResult2, changeCount };
}

// ─── File Processing ───
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let totalChanges = 0;
  const appliedRules = [];

  for (const rule of STYLE_REPLACEMENTS) {
    const { result, changeCount } = mergeClassNames(content, rule.pattern, rule.className);
    if (changeCount > 0) {
      content = result;
      totalChanges += changeCount;
      appliedRules.push({ desc: rule.desc, count: changeCount });
    }
  }

  return {
    filePath,
    changed: content !== originalContent,
    totalChanges,
    appliedRules,
    newContent: content,
    originalContent,
  };
}

// ─── Get All TSX Files ───
function getTsxFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── Compliance Report ───
function generateReport(files) {
  const modules = {};
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(DASHBOARD_DIR, file);
    const module = relPath.split(path.sep)[0];
    
    if (!modules[module]) {
      modules[module] = {
        totalFiles: 0,
        pageFiles: 0,
        inlineStyles: 0,
        hexColors: 0,
        hasUiClasses: 0,
        hasDataTable: 0,
        hasChangeHistory: 0,
        isDetailPage: 0,
      };
    }
    
    const m = modules[module];
    m.totalFiles++;
    
    if (path.basename(file) === 'page.tsx') {
      m.pageFiles++;
    }
    
    const styleMatches = content.match(/style=\{\{/g);
    m.inlineStyles += styleMatches ? styleMatches.length : 0;
    
    const hexMatches = content.match(/['"]#[0-9a-fA-F]{3,8}['"]/g);
    m.hexColors += hexMatches ? hexMatches.length : 0;
    
    if (/ui-card|ui-form-group|ui-input|ui-btn|ui-grid|ui-stack|ui-flex|ui-hstack/.test(content)) {
      m.hasUiClasses++;
    }
    
    if (/DataTable/.test(content)) {
      m.hasDataTable++;
    }
    
    if (/ChangeHistory/.test(content)) {
      m.hasChangeHistory++;
    }
    
    if (file.includes('[id]') && path.basename(file) === 'page.tsx') {
      m.isDetailPage++;
    }
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║            UI FRAMEWORK COMPLIANCE REPORT                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Module'.padEnd(20), 'Files'.padStart(6), 'Pages'.padStart(6), 'Inline'.padStart(8), 'Hex'.padStart(6), 'UI-*'.padStart(6), 'DT'.padStart(5));
  console.log('─'.repeat(65));
  
  let totals = { files: 0, pages: 0, inline: 0, hex: 0, ui: 0, dt: 0 };
  
  for (const [mod, data] of Object.entries(modules).sort((a, b) => b[1].inlineStyles - a[1].inlineStyles)) {
    console.log(
      mod.padEnd(20),
      String(data.totalFiles).padStart(6),
      String(data.pageFiles).padStart(6),
      String(data.inlineStyles).padStart(8),
      String(data.hexColors).padStart(6),
      String(data.hasUiClasses).padStart(6),
      String(data.hasDataTable).padStart(5)
    );
    totals.files += data.totalFiles;
    totals.pages += data.pageFiles;
    totals.inline += data.inlineStyles;
    totals.hex += data.hexColors;
    totals.ui += data.hasUiClasses;
    totals.dt += data.hasDataTable;
  }
  
  console.log('─'.repeat(65));
  console.log(
    'TOTAL'.padEnd(20),
    String(totals.files).padStart(6),
    String(totals.pages).padStart(6),
    String(totals.inline).padStart(8),
    String(totals.hex).padStart(6),
    String(totals.ui).padStart(6),
    String(totals.dt).padStart(5)
  );
  
  const compliancePct = ((totals.files - totals.inline) / totals.files * 100).toFixed(1);
  console.log(`\n📊 Overall: ${totals.inline} inline styles remaining across ${totals.files} files`);
  console.log(`📊 ${totals.hex} hardcoded hex colors remaining`);
  console.log(`📊 ${totals.ui} files using .ui-* classes, ${totals.dt} using DataTable\n`);
}

// ─── Main ───
function main() {
  console.log('🔍 Scanning dashboard directory:', DASHBOARD_DIR);
  
  let files = getTsxFiles(DASHBOARD_DIR);
  
  if (MODULE_FILTER) {
    files = files.filter(f => {
      const rel = path.relative(DASHBOARD_DIR, f);
      return rel.startsWith(MODULE_FILTER + path.sep) || rel.startsWith(MODULE_FILTER + '/');
    });
    console.log(`📁 Filtered to module: ${MODULE_FILTER} (${files.length} files)`);
  }
  
  console.log(`📄 Found ${files.length} TSX files\n`);
  
  if (REPORT) {
    generateReport(files);
    return;
  }
  
  let totalFilesChanged = 0;
  let totalReplacements = 0;
  const allRuleStats = {};
  
  for (const file of files) {
    const result = processFile(file);
    
    if (result.changed) {
      totalFilesChanged++;
      totalReplacements += result.totalChanges;
      
      const relPath = path.relative(DASHBOARD_DIR, file);
      console.log(`✏️  ${relPath} — ${result.totalChanges} replacements:`);
      for (const rule of result.appliedRules) {
        console.log(`    ${rule.count}× ${rule.desc}`);
        allRuleStats[rule.desc] = (allRuleStats[rule.desc] || 0) + rule.count;
      }
      
      if (APPLY) {
        fs.writeFileSync(file, result.newContent, 'utf-8');
      }
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`${DRY_RUN ? '🔍 DRY RUN' : '✅ APPLIED'} SUMMARY`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`Files changed: ${totalFilesChanged} / ${files.length}`);
  console.log(`Total replacements: ${totalReplacements}`);
  console.log('\nBy rule:');
  for (const [desc, count] of Object.entries(allRuleStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}× ${desc}`);
  }
  
  if (DRY_RUN) {
    console.log('\n💡 Run with --apply to write changes to disk.');
  }
}

main();
