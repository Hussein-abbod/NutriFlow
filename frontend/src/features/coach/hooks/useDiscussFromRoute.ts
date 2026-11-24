import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { readCoachContext, type CoachContext } from '../navigation';

/**
 * Starts the chat about a meal when the tab was opened with "Discuss with Coach AI", once
 * per navigation: the state is then removed so a reload or Back does not ask again.
 */
export function useDiscussFromRoute(discuss: (context: CoachContext) => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const handledKey = useRef<string | null>(null);

  useEffect(() => {
    const context = readCoachContext(location.state);
    if (!context || handledKey.current === location.key) return;
    handledKey.current = location.key;
    void navigate(location.pathname, { replace: true, state: null });
    discuss(context);
  }, [location, navigate, discuss]);
}
