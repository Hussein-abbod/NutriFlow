import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildTodaySummary } from '@/test/fixtures';
import { MealBreakdown } from './MealBreakdown';
import { TodaySummaryCard } from './TodaySummaryCard';

describe('TodaySummaryCard', () => {
  it('shows calories in the ring and one bar per macro', () => {
    render(<TodaySummaryCard summary={buildTodaySummary()} />);
    expect(screen.getByRole('progressbar', { name: 'Calories consumed' })).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
    expect(screen.getByText('1200 of 2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('/ 2000 kcal')).toBeInTheDocument();

    expect(screen.getByRole('progressbar', { name: 'Protein' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByRole('progressbar', { name: 'Carbs' })).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
    expect(screen.getByRole('progressbar', { name: 'Fat' })).toHaveAttribute('aria-valuenow', '62');
    expect(screen.getByText('70/140g · 50%')).toBeInTheDocument();
  });

  it('caps progress at 100% when over the target', () => {
    const summary = buildTodaySummary({
      calories_consumed: 2600,
      protein: { consumed: 200, target: 140 },
    });
    render(<TodaySummaryCard summary={summary} />);
    expect(screen.getByRole('progressbar', { name: 'Calories consumed' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByText('200/140g · 100%')).toBeInTheDocument();
  });

  it('handles an empty day', () => {
    const summary = buildTodaySummary({
      calories_consumed: 0,
      protein: { consumed: 0, target: 140 },
    });
    render(<TodaySummaryCard summary={summary} />);
    expect(screen.getByText('0 of 2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('0/140g · 0%')).toBeInTheDocument();
  });
});

describe('MealBreakdown', () => {
  it('lists the four meals and marks the ones over target', () => {
    render(<MealBreakdown meals={buildTodaySummary().meals} />);
    const meals = screen.getAllByRole('listitem');
    expect(meals.map((meal) => meal.querySelector('h3')?.textContent)).toEqual([
      'Breakfast',
      'Lunch',
      'Snack',
      'Dinner',
    ]);
    expect(meals[1]).toHaveTextContent('800 kcal');
    expect(meals[1]).toHaveTextContent('Target: 700 (over target)');
    expect(meals[0]).not.toHaveTextContent('over target');
  });

  it('shows 0 kcal for a meal missing from the response', () => {
    render(<MealBreakdown meals={{}} />);
    expect(screen.getAllByText('0 kcal')).toHaveLength(4);
  });
});
