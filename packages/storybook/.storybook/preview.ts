import type { Preview } from '@storybook/react';
import '../../ui-tokens/src/index.css';
import '../../ui/src/styles/globals.css';

const THEMES = ['light', 'dark', 'enterprise', 'modern', 'minimal', 'classic', 'compact', 'high-contrast'];

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'UniERP Design System theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: THEMES,
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme ?? 'light');
      return Story();
    },
  ],
};

export default preview;
