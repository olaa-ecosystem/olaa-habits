import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { appStore } from '../../src/stores/appStore';
import { toDayKey } from '../../src/utils/date';

async function go(hash: string) {
  window.location.hash = hash;
  await act(async () => {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

beforeEach(async () => {
  appStore.reset();
  window.location.hash = '';
});

describe('onboarding to first check-in', () => {
  it('creates starter habits and checks one off in a single tap', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /bắt đầu/i }));
    await user.type(screen.getByPlaceholderText(/tên của bạn/i), 'Mai');
    await user.click(screen.getByRole('button', { name: /đọc sách 10 trang/i }));
    await user.click(screen.getByRole('button', { name: /tạo 2 thói quen/i }));

    expect(screen.getByRole('heading', { name: 'Chào Mai!' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: /thói quen hôm nay/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    const check = screen.getByRole('button', { name: /đọc sách 10 trang: đánh dấu/i });
    await user.click(check);
    expect(check).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 ngày')).toBeInTheDocument();
    expect(appStore.getState().badges['first-checkin']).toBe(toDayKey(new Date()));
  });
});

describe('habit form', () => {
  beforeEach(() => {
    appStore.update((s) => ({ ...s, onboarded: true }));
  });

  it('creates a habit on chosen weekdays and validates the name', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('#/habits/new');

    await user.click(screen.getByRole('button', { name: /tạo thói quen/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/nhập tên/i);

    await user.type(screen.getByLabelText(/tên thói quen/i), 'Luyện nghe');
    await user.click(screen.getByRole('button', { name: /chọn ngày/i }));
    await user.click(screen.getByRole('button', { name: 'T2' }));
    await user.click(screen.getByRole('button', { name: /tạo thói quen/i }));

    const habit = Object.values(appStore.getState().habits)[0];
    expect(habit?.name).toBe('Luyện nghe');
    expect(habit?.schedule).toEqual({ kind: 'weekdays', days: [1, 2, 3, 4] });
  });
});

describe('automatic habit', () => {
  it('creates a Language habit with no manual check button', async () => {
    const user = userEvent.setup();
    appStore.update((s) => ({ ...s, onboarded: true }));
    render(<App />);
    await go('#/habits/new');

    await user.type(screen.getByLabelText(/tên thói quen/i), 'Học 2 bài mới');
    await user.click(screen.getByRole('button', { name: /tự động từ olaa language/i }));
    await user.click(screen.getByRole('radio', { name: /hoàn thành/i }));
    await user.selectOptions(screen.getByRole('combobox', { name: /số bài mới/i }), '2');
    await user.click(screen.getByRole('button', { name: /tạo thói quen/i }));

    const habit = Object.values(appStore.getState().habits)[0];
    expect(habit?.source).toEqual({ kind: 'language.new_lessons', count: 2 });
    await go('#/today');
    expect(screen.queryByRole('button', { name: /học 2 bài mới: đánh dấu/i })).toBeNull();
    expect(screen.getByRole('link', { name: /học ngay/i })).toHaveAttribute(
      'href',
      'https://olaa-ecosystem.web.app',
    );
  });
});

describe('freeze', () => {
  it('freezes today from the Today page and allows undo', async () => {
    const user = userEvent.setup();
    appStore.update((s) => ({ ...s, onboarded: true }));
    appStore.update((s) => ({
      ...s,
      habits: {
        a: {
          id: 'a',
          name: 'A',
          icon: '📚',
          color: 'blue',
          schedule: { kind: 'daily' },
          createdOn: '2026-01-01',
          archivedOn: null,
        },
      },
      order: ['a'],
    }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: /đóng băng hôm nay/i }));
    expect(screen.getByText(/hôm nay đã đóng băng/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /bỏ đóng băng/i }));
    expect(appStore.getState().freezes).toEqual({});
  });
});
