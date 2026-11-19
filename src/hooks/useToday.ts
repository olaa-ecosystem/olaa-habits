import { useEffect, useState } from 'react';
import { toDayKey, type DayKey } from '../utils/date';

/** Today's local day key; updates when the day changes while the app is open. */
export function useToday(): DayKey {
  const [today, setToday] = useState(() => toDayKey(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setToday(toDayKey(new Date())), 60_000);
    const onFocus = () => setToday(toDayKey(new Date()));
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
  return today;
}
