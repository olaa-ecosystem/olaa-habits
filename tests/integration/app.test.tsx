import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { setLocale } from '../../src/i18n/locale';
import { habitStore } from '../../src/stores/habitStore';

describe('Olaa Habits app', () => {
  beforeEach(() => {
    setLocale('en');
    window.location.hash = '#/';
    habitStore.resetForTests();
  });

  it('uses the shared Olaa frame: app switcher Language → Note → Habits and main navigation', () => {
    render(<App />);
    const switcher = screen.getByRole('navigation', { name: 'Olaa apps' });
    expect(within(switcher).getByRole('link', { name: 'Open Olaa Language' })).toHaveAttribute(
      'href',
      'https://olaa-language.web.app/',
    );
    expect(within(switcher).getByRole('link', { name: 'Open Olaa Note' })).toBeInTheDocument();
    expect(within(switcher).getByText('Habits')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent?.trim()),
    ).toEqual(['Today', 'Calendar', 'Habits', 'Stats', 'Me']);
  });

  it('adds a template and ticks it in one tap, with undo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Review my notes in Olaa Note/ }));
    const check = screen.getByRole('button', { name: 'Mark done: Review my notes in Olaa Note' });
    expect(check).toHaveAttribute('aria-pressed', 'false');
    await user.click(check);
    expect(check).toHaveAttribute('aria-pressed', 'true');
    await user.click(check);
    expect(check).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(check).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows Language habits as automatic with Study now', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Reach my daily goal in Olaa Language/ }));
    const check = screen.getByRole('button', {
      name: 'Ticks itself when you study in Olaa Language',
    });
    expect(check).toBeDisabled();
    expect(screen.getAllByRole('link', { name: 'Study now' })[0]).toHaveAttribute(
      'href',
      'https://olaa-language.web.app/',
    );
  });

  it('records the mood of the day', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Good' }));
    expect(Object.values(habitStore.getState().moods)).toEqual(['good']);
  });

  it('creates a habit through the form and opens it', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/new';
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Create habit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Give the habit a name.');
    await user.type(screen.getByLabelText('Name'), 'Flashcards');
    await user.type(screen.getByLabelText(/Why does this habit matter/), 'Pass the B1 exam');
    await user.type(screen.getByLabelText(/Olaa Note notebook/), 'https://example.com/x');
    await user.click(screen.getByRole('button', { name: 'Create habit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('must be an Olaa Note address');
    await user.clear(screen.getByLabelText(/Olaa Note notebook/));
    await user.click(screen.getByRole('button', { name: 'Create habit' }));
    expect(await screen.findByRole('heading', { name: 'Flashcards' })).toBeInTheDocument();
    expect(screen.getByText('Pass the B1 exam')).toBeInTheDocument();
  });
});
