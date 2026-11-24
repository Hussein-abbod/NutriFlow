import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildFoodLog } from '@/test/fixtures';
import { AiAdviceSheet } from './AiAdviceSheet';

function renderSheet(advice: string | null, remainingCalories = 1200) {
  const handlers = { onClose: vi.fn(), onDiscussWithCoach: vi.fn() };
  render(
    <AiAdviceSheet
      log={buildFoodLog({ ai_advice: advice, total_calories: 432.4 })}
      remainingCalories={remainingCalories}
      {...handlers}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
}

describe('AiAdviceSheet', () => {
  it('stays closed when the meal has no advice', () => {
    renderSheet(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the advice, this meal and what is left today', () => {
    renderSheet('Good protein.\nAdd veggies at dinner.');
    const sheet = screen.getByRole('dialog', { name: 'NutriFlow Advice' });
    expect(sheet).toHaveTextContent('Good protein. Add veggies at dinner.');
    expect(screen.getByText('This Meal').nextSibling).toHaveTextContent('432 kcal');
    expect(screen.getByText('Remaining').nextSibling).toHaveTextContent('1200 kcal');
  });

  it('never shows a negative remaining amount', () => {
    renderSheet('Over today.', -350);
    expect(screen.getByText('Remaining').nextSibling).toHaveTextContent('0 kcal');
  });

  it('renders AI text as plain text, never as HTML', () => {
    renderSheet('<img src=x onerror="alert(1)"><b>bold</b>');
    expect(screen.getByText('<img src=x onerror="alert(1)"><b>bold</b>')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('closes on "Got it!" and hands the meal to the coach', async () => {
    const { user, onClose, onDiscussWithCoach } = renderSheet('Try oats tomorrow.');
    await user.click(screen.getByRole('button', { name: 'Discuss with Coach AI' }));
    expect(onDiscussWithCoach).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, ai_advice: 'Try oats tomorrow.' }),
    );
    await user.click(screen.getByRole('button', { name: 'Got it!' }));
    expect(onClose).toHaveBeenCalled();
  });
});
