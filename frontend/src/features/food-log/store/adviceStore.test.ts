import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/features/auth';
import { buildFoodLog } from '@/test/fixtures';
import { useAdviceStore } from './adviceStore';

describe('adviceStore', () => {
  it('keeps the last logged meal until it is shown', () => {
    useAdviceStore.getState().setLastSubmittedLog(buildFoodLog());
    expect(useAdviceStore.getState().lastSubmittedLog?.ai_advice).toBe(
      'Great start! Add some protein at lunch.',
    );
    useAdviceStore.getState().clearAdvice();
    expect(useAdviceStore.getState().lastSubmittedLog).toBeNull();
  });

  it('forgets the meal when the session ends (logout or expiry)', () => {
    useSessionStore.setState({ status: 'authenticated' });
    useAdviceStore.getState().setLastSubmittedLog(buildFoodLog());

    useSessionStore.getState().setAnonymous();

    expect(useAdviceStore.getState().lastSubmittedLog).toBeNull();
  });
});
