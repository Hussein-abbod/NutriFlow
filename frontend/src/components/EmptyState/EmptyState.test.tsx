import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/components/Button/Button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title, message and action', () => {
    render(
      <EmptyState
        title="No meals yet"
        message="Log your breakfast to get started"
        action={<Button>Add food</Button>}
      />,
    );
    expect(screen.getByRole('region', { name: 'No meals yet' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No meals yet' })).toBeInTheDocument();
    expect(screen.getByText('Log your breakfast to get started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add food' })).toBeInTheDocument();
  });

  it('works with only a title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
