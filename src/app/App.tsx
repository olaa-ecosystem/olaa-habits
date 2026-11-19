import { CalendarPage } from '../features/calendar/CalendarPage';
import { HabitFormPage } from '../features/habit-management/HabitFormPage';
import { HabitsPage } from '../features/habit-management/HabitsPage';
import { TodayPage } from '../features/habit-tracking/TodayPage';
import { WelcomePage } from '../features/onboarding/WelcomePage';
import { MePage } from '../features/profile/MePage';
import { useToday } from '../hooks/useToday';
import { useAppState } from '../stores/appStore';
import { AppShell } from './AppShell';
import { parseRoute, useHash } from './router';

export function App() {
  const state = useAppState();
  const route = parseRoute(useHash());
  const today = useToday();

  if (!state.onboarded) return <WelcomePage today={today} />;

  return (
    <AppShell active={route.name}>
      {route.name === 'today' && <TodayPage today={today} />}
      {route.name === 'calendar' && <CalendarPage today={today} />}
      {route.name === 'habits' && <HabitsPage today={today} />}
      {route.name === 'habit-new' && <HabitFormPage key="new" today={today} />}
      {route.name === 'habit-edit' && (
        <HabitFormPage key={route.habitId} today={today} habitId={route.habitId} />
      )}
      {route.name === 'me' && <MePage today={today} />}
    </AppShell>
  );
}
