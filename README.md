# Olaa Habits

Theo dõi thói quen cho học sinh, ưu tiên thói quen học tập. PRD: `olaa-platform/architecture/02-olaa-habits/requirements/PRD.md`.

## Trạng thái giao diện

**Giao diện (frontend) đã được gỡ khỏi repository ngày 2026-11-21** theo yêu cầu của chủ dự án, để import bộ giao diện mới sau. Repository hiện chỉ giữ phần logic và dữ liệu, có test. `index.html` có sẵn `<div id="root">`; `src/main.ts` chỉ khởi chạy các dịch vụ dữ liệu. Giao diện mới gắn vào `#root` và dùng các module bên dưới.

Yêu cầu giao diện: `olaa-platform/architecture/PRD/UIUX_PRD_v0.1.md` và `UI_BUTTONS_PRD_v0.1.md`.

## Phần logic còn lại

```
src/
  features/
    habit-management/        Thói quen, kiểu đo, kiểm tra hợp lệ, thói quen mẫu
    habit-tracking/          Điểm danh (xong, bỏ qua, một phần, ghi chú), tự động từ Olaa Language
    scheduling/              Lịch lặp (mỗi ngày, chọn ngày, N lần mỗi tuần)
    streaks/                 Chuỗi, tỷ lệ nhất quán, đóng băng
    calendar/                Trạng thái từng ngày
    gamification/            Huy hiệu
    data-export/             Xuất dữ liệu người dùng (JSON)
  stores/                    Trạng thái app (phiên bản 2, có chuyển đổi dữ liệu cũ) và store
  services/                  Firebase Auth/Firestore, đồng bộ, nhận sự kiện từ Olaa Language
  i18n/                      Song ngữ Việt/Anh: tr(vi, en)
  utils/                     Ngày
```

## Phát triển

Cần Node 20+ và pnpm 9.

```bash
pnpm install
pnpm test         # test phần logic
pnpm lint
pnpm typecheck
pnpm build        # dist/ (chưa có giao diện)
```

Deploy: Firebase Hosting site `olaa-habits` (project `olaa-ecosystem`), GitHub Actions deploy bản xem trước cho PR và bản chính khi merge `main` (`.github/workflows/deploy.yml`). Luật Firestore nằm ở `olaa-platform/infrastructure/firebase/`.

## Bảo mật

Xem `SECURITY.md`.
