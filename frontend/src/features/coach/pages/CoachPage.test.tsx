import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { sessionHandlers } from '@/test/authHandlers';
import { buildCoachMessage, coachServer, type CoachServerOptions } from '@/test/coachHandlers';
import { buildUser, TEST_API } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';
import type { CoachMessageDto } from '@/types/api';

const user = buildUser({ is_profile_complete: true });

function renderCoach(
  history: CoachMessageDto[] = [],
  options?: CoachServerOptions,
  state?: unknown,
) {
  const coach = coachServer(history, options);
  server.use(...sessionHandlers(user), ...coach.handlers);
  return { ...renderApp('/coach', state), coach, userEvents: userEvent.setup() };
}

const conversation = () => screen.findByRole('list', { name: 'Conversation with Coach AI' });
const input = () => screen.getByRole('textbox', { name: 'Message Coach AI' });
const sendButton = () => screen.getByRole('button', { name: 'Send message' });

describe('CoachPage', () => {
  it('greets with suggestions while the chat is empty', async () => {
    renderCoach();
    expect(await screen.findByRole('heading', { name: 'Coach AI' })).toBeInTheDocument();
    expect(await screen.findByText('Say hi to your Coach AI!')).toBeInTheDocument();
    const suggestions = screen.getByRole('list', { name: 'Suggested questions' });
    expect(
      within(suggestions)
        .getAllByRole('button')
        .map((chip) => chip.textContent),
    ).toEqual(['Meal ideas', 'Analyze my diet', 'Low calorie snacks']);
    expect(screen.getByRole('button', { name: 'New Chat' })).toBeDisabled();
    expect(sendButton()).toBeDisabled();
  });

  it('shows the stored conversation, oldest first', async () => {
    renderCoach([
      buildCoachMessage('user', 'Is rice ok?', 1),
      buildCoachMessage('assistant', 'Yes, in **moderate** portions.', 2),
    ]);
    const list = await conversation();
    const bubbles = within(list).getAllByRole('listitem');
    expect(bubbles.map((bubble) => bubble.textContent)).toEqual([
      'You: Is rice ok?',
      'Coach AI: Yes, in moderate portions.',
    ]);
    expect(within(list).getByText('moderate').tagName).toBe('STRONG');
    expect(screen.queryByRole('list', { name: 'Suggested questions' })).not.toBeInTheDocument();
  });

  it('sends a message: it appears at once, the coach types, then answers', async () => {
    const { coach, userEvents } = renderCoach([], { replyDelay: 50 });
    await screen.findByText('Say hi to your Coach AI!');

    await userEvents.type(input(), '  What about dinner?  ');
    await userEvents.click(sendButton());

    expect(input()).toHaveValue('');
    const list = await conversation();
    expect(list).toHaveTextContent('What about dinner?');
    expect(within(list).getByRole('status')).toHaveTextContent('Coach AI is typing…');
    expect(screen.getByRole('button', { name: 'New Chat' })).toBeDisabled();

    expect(await within(list).findByText('Coach reply to: What about dinner?')).toBeVisible();
    expect(within(list).queryByRole('status')).not.toBeInTheDocument();
    expect(coach.requests).toEqual([{ message: 'What about dinner?' }]);
  });

  it('sends with Enter and adds a new line with Shift+Enter', async () => {
    const { coach, userEvents } = renderCoach();
    await screen.findByText('Say hi to your Coach AI!');

    await userEvents.type(input(), 'Line one{Shift>}{Enter}{/Shift}Line two');
    expect(coach.requests).toEqual([]);
    await userEvents.keyboard('{Enter}');
    await waitFor(() => expect(coach.requests).toEqual([{ message: 'Line one\nLine two' }]));
  });

  it('asks a suggested question with one tap', async () => {
    const { coach, userEvents } = renderCoach();
    await userEvents.click(await screen.findByRole('button', { name: 'Low calorie snacks' }));
    expect(
      await within(await conversation()).findByText(/Coach reply to: Suggest some/),
    ).toBeVisible();
    expect(coach.requests).toEqual([{ message: 'Suggest some low calorie snacks' }]);
  });

  it('takes the question back and keeps the text when the coach is unavailable', async () => {
    const { userEvents } = renderCoach([buildCoachMessage('assistant', 'Hello!', 1)]);
    server.use(
      http.post(`${TEST_API}/coach/message`, () =>
        HttpResponse.json(
          { detail: 'Coach AI is unavailable right now. Please try again in a moment.' },
          { status: 503 },
        ),
      ),
    );
    await conversation();
    await userEvents.type(input(), 'Are you there?');
    await userEvents.click(sendButton());

    expect(await screen.findByText(/Coach AI is unavailable right now/)).toBeVisible();
    expect(input()).toHaveValue('Are you there?');
    const list = await conversation();
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });

  it('rejects messages over 2000 characters without sending', async () => {
    const { coach, userEvents } = renderCoach();
    await screen.findByText('Say hi to your Coach AI!');
    await userEvents.click(input());
    await userEvents.paste('x'.repeat(2001));
    expect(screen.queryByText('2001 / 2000')).toBeInTheDocument();
    await userEvents.click(sendButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Messages can be at most 2000 characters.',
    );
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(coach.requests).toEqual([]);
  });

  it('starts a new chat only after confirmation', async () => {
    const { coach, userEvents } = renderCoach([buildCoachMessage('user', 'Hi', 1)]);
    await conversation();

    await userEvents.click(screen.getByRole('button', { name: 'New Chat' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Start a new chat?' });
    await userEvents.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(coach.messages).toHaveLength(1);

    await userEvents.click(screen.getByRole('button', { name: 'New Chat' }));
    await userEvents.click(screen.getByRole('button', { name: 'Clear chat' }));
    expect(await screen.findByText('Say hi to your Coach AI!')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(coach.messages).toHaveLength(0);
  });

  it('shows an error with Retry when the history cannot load', async () => {
    let fail = true;
    server.use(
      ...sessionHandlers(user),
      http.get(`${TEST_API}/coach/history`, () =>
        fail
          ? HttpResponse.json({ detail: 'Database unavailable.' }, { status: 500 })
          : HttpResponse.json([buildCoachMessage('assistant', 'Welcome back!', 1)]),
      ),
    );
    renderApp('/coach');
    expect(await screen.findByText('Database unavailable.')).toBeVisible();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await within(await conversation()).findByText('Welcome back!')).toBeVisible();
  });

  it('renders coach text as text, never as HTML', async () => {
    renderCoach([buildCoachMessage('assistant', '<img src=x onerror="alert(1)">', 1)]);
    expect(await within(await conversation()).findByText(/<img src=x/)).toBeVisible();
    expect(document.querySelector('img')).toBeNull();
  });

  it('ignores malformed "discuss" state in the history entry', async () => {
    const { coach } = renderCoach([], {}, { coachContext: { foodLogId: 'x', advice: 1 } });
    await screen.findByText('Say hi to your Coach AI!');
    expect(coach.requests).toEqual([]);
  });

  it('removes the meal advice again when the coach cannot discuss it', async () => {
    const coach = coachServer();
    server.use(
      http.post(`${TEST_API}/coach/message`, () =>
        HttpResponse.json({ detail: 'Food log not found' }, { status: 404 }),
      ),
      ...sessionHandlers(user),
      ...coach.handlers,
    );
    renderApp('/coach', { coachContext: { foodLogId: 9, advice: 'Old advice' } });
    expect(await screen.findByText('Food log not found')).toBeVisible();
    expect(await screen.findByText('Say hi to your Coach AI!')).toBeInTheDocument();
  });
});
