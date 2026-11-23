import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StaggeredEntrance } from './StaggeredEntrance';

describe('StaggeredEntrance', () => {
  it('sets delay and duration from the Flutter stagger interval', () => {
    render(
      <StaggeredEntrance index={2} total={3} controllerMs={1000}>
        <p>Sign up link</p>
      </StaggeredEntrance>,
    );
    const wrapper = screen.getByText('Sign up link').parentElement as HTMLElement;
    expect(wrapper.style.getPropertyValue('--stagger-delay')).toBe('400ms');
    expect(wrapper.style.getPropertyValue('--stagger-duration')).toBe('400ms');
  });
});
