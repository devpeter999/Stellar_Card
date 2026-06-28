import type { Meta, StoryObj } from '@storybook/react';
import { Pill, type PillTone } from './Pill';

const TONES: PillTone[] = ['green', 'red', 'yellow', 'blue', 'purple', 'neutral'];

const meta: Meta<typeof Pill> = {
  title: 'Dashboard/UI/Pill',
  component: Pill,
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: TONES },
    pulse: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Pill>;

export const Active: Story = {
  args: { tone: 'green', children: 'Active' },
};

export const Failed: Story = {
  args: { tone: 'red', children: 'Failed' },
};

export const Pending: Story = {
  args: { tone: 'yellow', pulse: true, children: 'Pending payment' },
};

export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {TONES.map((tone) => (
        <Pill key={tone} tone={tone}>{tone}</Pill>
      ))}
    </div>
  ),
};
