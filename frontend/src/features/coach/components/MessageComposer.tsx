import { zodResolver } from '@hookform/resolvers/zod';
import { useId, type KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from '@/components';
import {
  COACH_MESSAGE_MAX_LENGTH,
  coachMessageSchema,
  type CoachMessageForm,
  type CoachMessageValues,
} from '../schemas/coachSchemas';
import styles from './MessageComposer.module.css';

/** The character count appears once a message gets close to the limit. */
const COUNTER_FROM = COACH_MESSAGE_MAX_LENGTH - 200;

export interface MessageComposerProps {
  /** The coach is answering: sending waits (Flutter disables the send button). */
  busy: boolean;
  /** `restore` puts the text back into the field, e.g. when sending failed. */
  onSend: (message: string, restore: () => void) => void;
}

/** Input area of coach_ai_tab.dart: rounded field + send button. Enter sends. */
export function MessageComposer({ busy, onSend }: MessageComposerProps) {
  const errorId = useId();
  const { register, handleSubmit, reset, setValue, getValues, watch, formState } = useForm<
    CoachMessageForm,
    unknown,
    CoachMessageValues
  >({ resolver: zodResolver(coachMessageSchema), defaultValues: { message: '' } });
  const length = watch('message').length;
  const error = formState.errors.message?.message;

  const submit = handleSubmit(({ message }) => {
    if (busy) return;
    reset({ message: '' });
    onSend(message, () => {
      if (getValues('message') === '') setValue('message', message);
    });
  });

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <form className={styles.composer} onSubmit={(event) => void submit(event)} noValidate>
      <div className={styles.fieldWrap}>
        <label className="visually-hidden" htmlFor={`${errorId}-input`}>
          Message Coach AI
        </label>
        <textarea
          id={`${errorId}-input`}
          className={styles.field}
          rows={1}
          placeholder="Ask about nutrition, meals, goals..."
          autoCapitalize="sentences"
          enterKeyHint="send"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onKeyDown={onKeyDown}
          {...register('message')}
        />
        {error && length > 0 && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {length >= COUNTER_FROM && !error && (
          <p className={styles.counter} aria-live="polite">
            {length} / {COACH_MESSAGE_MAX_LENGTH}
          </p>
        )}
      </div>
      <button
        type="submit"
        className={styles.send}
        disabled={busy || length === 0}
        aria-label="Send message"
      >
        <Icon name="sendRounded" size={20} />
      </button>
    </form>
  );
}
