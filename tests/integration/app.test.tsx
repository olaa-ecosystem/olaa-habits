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

  it('adds a template from the welcome card and checks it off in one tap', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText('Start with one small habit')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Review my notes in Olaa Note/ }));

    const check = screen.getByRole('button', { name: 'Mark done: Review my notes in Olaa Note' });
    expect(check).toHaveAttribute('aria-pressed', 'false');
    await user.click(check);
    expect(check).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 of 1 habits')).toBeInTheDocument();

    // Untick offers undo.
    await user.click(check);
    expect(check).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(check).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows Language habits as automatic with a Study now link instead of a check button', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Reach my daily goal in Olaa Language/ }));
    const row = screen.getByText('Reach my daily goal in Olaa Language').closest('li')!;
    expect(within(row).getByText('Auto · Language')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Study now' })).toHaveAttribute(
      'href',
      'https://olaa-language.web.app/',
    );
    expect(within(row).queryByRole('button', { name: /Mark done/ })).toBeNull();
  });

  it('creates a habit through the form', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/new';
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Create habit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Give the habit a name.');
    await user.type(screen.getByLabelText('Name'), 'Flashcards');
    await user.type(screen.getByLabelText(/Olaa Note notebook/), 'https://example.com/x');
    await user.click(screen.getByRole('button', { name: 'Create habit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('must be an Olaa Note address');
    await user.clear(screen.getByLabelText(/Olaa Note notebook/));
    await user.click(screen.getByRole('button', { name: 'Create habit' }));
    expect(await screen.findByRole('heading', { name: 'Flashcards' })).toBeInTheDocument();
    expect(Object.values(habitStore.getState().habits)).toHaveLength(1);
  });
});
