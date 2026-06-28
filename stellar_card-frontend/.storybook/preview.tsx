import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f1117' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Run axe-core on every story by default
      element: '#storybook-root',
    },
  },
  decorators: [
    (Story) => (
      // Apply the same CSS variable baseline the dashboard uses
      <div
        data-theme="dark"
        style={{ padding: '2rem', background: 'var(--bg)', minHeight: '100vh' }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
