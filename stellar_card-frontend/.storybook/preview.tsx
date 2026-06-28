import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#050505' },
        { name: 'light', value: '#fafaf7' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '2rem',
          background: '#050505',
          color: '#f4f4f4',
          minHeight: '100vh',
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
