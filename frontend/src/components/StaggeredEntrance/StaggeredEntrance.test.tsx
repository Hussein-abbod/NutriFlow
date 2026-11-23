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

describe('StaggeredEntrance with an Interval', () => {
  it('uses index * step as the delay and the given slide offset', () => {
    render(
      <StaggeredEntrance index={3} step={0.1} span={0.5} controllerMs={1000} slidePercent={10}>
        <p>Weekly chart</p>
      </StaggeredEntrance>,
    );
    const wrapper = screen.getByText('Weekly chart').parentElement as HTMLElement;
    expect(wrapper.style.getPropertyValue('--stagger-delay')).toBe('300ms');
    expect(wrapper.style.getPropertyValue('--stagger-duration')).toBe('500ms');
    expect(wrapper.style.getPropertyValue('--stagger-offset')).toBe('10%');
  });
});
