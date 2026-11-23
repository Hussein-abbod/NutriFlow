import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders children with default border and padding', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveTextContent('Content');
    expect(card).toHaveClass('card', 'bordered', 'padding-md');
  });

  it('supports borderless cards with custom padding and attributes', () => {
    render(
      <Card bordered={false} padding="lg" aria-label="Summary" role="region">
        Body
      </Card>,
    );
    const card = screen.getByRole('region', { name: 'Summary' });
    expect(card).not.toHaveClass('bordered');
    expect(card).toHaveClass('padding-lg');
  });
});
