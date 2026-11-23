import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders children and leaves the Flutter defaults to CSS', () => {
    render(<GlassCard data-testid="glass">Form</GlassCard>);
    const card = screen.getByTestId('glass');
    expect(card).toHaveTextContent('Form');
    expect(card).toHaveClass('glass', 'auto');
    expect(card.style.getPropertyValue('--glass-padding')).toBe('');
    expect(card.style.getPropertyValue('--glass-opacity')).toBe('');
  });

  it('accepts custom padding, blur, opacity and tone', () => {
    render(
      <GlassCard data-testid="glass" padding={28} blurAmount={20} opacity={0.15} tone="onGradient">
        Form
      </GlassCard>,
    );
    const card = screen.getByTestId('glass');
    expect(card).toHaveClass('onGradient');
    expect(card.style.getPropertyValue('--glass-padding')).toBe('28px');
    expect(card.style.getPropertyValue('--glass-blur')).toBe('20px');
    expect(card.style.getPropertyValue('--glass-opacity')).toBe('0.15');
  });
});
