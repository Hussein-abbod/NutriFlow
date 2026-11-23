import { Link } from 'react-router';
import { cn } from '@/lib/utils/cn';
import styles from './AuthSwitchLink.module.css';

export interface AuthSwitchLinkProps {
  prompt: string;
  action: string;
  to: string;
  /** `accent`: primaryContainer green (login). `white`: plain white (register). */
  tone: 'accent' | 'white';
}

/** "Don't have an account? Sign Up" style TextButton under the auth forms. */
export function AuthSwitchLink({ prompt, action, to, tone }: AuthSwitchLinkProps) {
  return (
    <Link to={to} className={styles.link}>
      {prompt} <span className={cn(styles.action, styles[tone])}>{action}</span>
    </Link>
  );
}
