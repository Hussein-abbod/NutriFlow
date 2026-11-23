import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildWeekly } from '@/test/fixtures';
import { WeeklyProgressCard } from './WeeklyProgressCard';

describe('WeeklyProgressCard', () => {
  it('shows "Not enough data yet" without data', () => {
    render(<WeeklyProgressCard weekly={[]} calorieTarget={2000} />);
    expect(screen.getByText('Not enough data yet')).toBeInTheDocument();
  });

  it('describes every day in an accessible table, flagging days over target', () => {
    render(<WeeklyProgressCard weekly={buildWeekly()} calorieTarget={2000} />);
    const table = screen.getByRole('table', { name: /Calories in the last 7 days/ });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      'Mon1800 kcal',
      'Tue2100 kcal (over target)',
      'Wed0 kcal',
      'Thu1500 kcal',
      'Fri2500 kcal (over target)',
      'Sat1900 kcal',
      'Sun1200 kcal',
    ]);
  });

  it('draws one gradient bar per logged day', async () => {
    // jsdom has no layout; give the responsive container a phone-sized box.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 320, height: 200 }),
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200);
    const { container } = render(
      <WeeklyProgressCard weekly={buildWeekly()} calorieTarget={2000} />,
    );
    const bars = await waitFor(() => {
      const found = container.querySelectorAll('.recharts-bar-rectangle path');
      expect(found.length).toBeGreaterThan(0);
      return found;
    });
    expect(bars.length).toBeGreaterThanOrEqual(6);
    const fills = [...bars].map((bar) => bar.getAttribute('fill'));
    expect(fills.filter((fill) => fill?.endsWith('-over)'))).toHaveLength(2);
  });
});
