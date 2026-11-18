# Module Inventory — Olaa Habits

Danh sách module chuẩn của nhánh 02. Nguồn duy nhất: [`MODULE_REGISTRY.md`](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/MODULE_REGISTRY.md) trong `olaa-platform`. Đặc tả chi tiết (14 trường: input, output, interface, database ownership, permissions, events, errors, tests…) nằm trong `olaa-platform`; file này chỉ là chỉ mục, không sao chép đặc tả.

Thêm, đổi hoặc bỏ module: sửa trong `olaa-platform` trước, rồi cập nhật file này.

| Module ID | Module | Đặc tả | Trạng thái |
|---|---|---|---|
| 02.01 | habit-management | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.01-habit-management.md) | NOT STARTED |
| 02.02 | scheduling | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.02-scheduling.md) | NOT STARTED |
| 02.03 | habit-tracking | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.03-habit-tracking.md) | NOT STARTED |
| 02.04 | streaks | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.04-streaks.md) | NOT STARTED |
| 02.05 | goals | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.05-goals.md) | NOT STARTED |
| 02.06 | routines | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.06-routines.md) | NOT STARTED |
| 02.07 | calendar | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.07-calendar.md) | NOT STARTED |
| 02.08 | reminders | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.08-reminders.md) | NOT STARTED |
| 02.09 | statistics | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.09-statistics.md) | NOT STARTED |
| 02.10 | gamification | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.10-gamification.md) | NOT STARTED |
| 02.11 | insights | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.11-insights.md) | NOT STARTED |
| 02.12 | habits-settings | [spec](https://github.com/olaa-ecosystem/olaa-platform/blob/main/architecture/02-olaa-habits/modules/02.12-habits-settings.md) | NOT STARTED |

## Đối chiếu với danh sách cũ

Bản placeholder trước đây dùng tên khác. Bảng dưới cho biết mỗi mục cũ thuộc module nào.

| Mục cũ | Module mới |
|---|---|
| Habit Management | 02.01 |
| Daily Weekly Routines | 02.06, 02.02 |
| Goals Milestones | 02.05 |
| Streaks | 02.04 |
| Calendar | 02.07 |
| Reminders | 02.08 |
| Statistics Analytics | 02.09 |
| Learning Integration | Chưa có module — tích hợp qua contract nhánh 20; cần quyết định |
| Sync | 05.07 sync-service (`olaa-platform`); phần client chưa có module |
