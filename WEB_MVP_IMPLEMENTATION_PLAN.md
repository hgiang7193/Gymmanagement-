# MYFIT Web MVP Implementation Plan

Tai lieu nay chuyen hoa plan web MVP thanh ban co the giao viec va thuc thi ngay.
Muc tieu la dua web frontend len staging/production tren nen backend hien co trong `MYFIT-/`.

## 1. Scope deploy target

Deploy target cua dot nay la:

- Frontend Next.js cho cac man hinh MVP hien da co backend ho tro
- Tich hop voi backend Node.js trong `MYFIT-/`
- Hoan tat deploy end-to-end cho:
  - Public membership plans
  - Login
  - Admin branches/users
  - Manager branches/trials/membership activation
  - Member current subscription

Khong nam trong dot nay:

- Workout attendance web flow
- Trainer operations web flow
- Cac module backend ngoai pham vi man hinh tren

## 2. Technical decisions

- Frontend path: `c:\Users\HKN\MYFIT-\frontend`
- Framework: Next.js App Router + TypeScript
- Styling: Tailwind CSS
- Component kit: shadcn/ui
- Data fetching: TanStack Query
- Auth strategy:
  - Access token luu trong memory
  - Refresh token luu trong `localStorage` trong dot MVP nay vi backend hien tai tra token dang JSON, chua set HttpOnly cookie
  - Tu dong rotate token qua `POST /api/v1/auth/refresh`
- API response envelope:
  - `{ data, error, meta }`
- Error UX:
  - Map ma loi backend ra thong bao UI co the doc duoc

## 3. Phase plan

### Phase 0. Contract Freeze

Muc tieu:

- Dong bang contract backend thuc te truoc khi viet frontend

Inputs:

- `MVP_API_CONTRACTS.md`
- `MYFIT-/src/app.js`
- `MYFIT-/src/identity-access/application/*`
- `MYFIT-/src/server.js`
- `MYFIT-/DEPLOY_SUPABASE.md`

Deliverables:

- Tai lieu contract freeze cho frontend
- Auth strategy da chot
- Danh sach route su dung trong web MVP
- Gap list giua docs va backend thuc te

Definition of done:

- Co danh sach endpoint web MVP co the goi that
- Co response shape thuc te cho login/refresh/logout
- Co danh sach ma loi quan trong cho UI

### Phase 1. Frontend Bootstrap

Muc tieu:

- Tao app Next.js co cau truc san sang de tich hop API that

Deliverables:

- Frontend Next.js duoc scaffold
- Cau truc route skeleton:
  - `/`
  - `/login`
  - `/admin/branches`
  - `/admin/users`
  - `/manager/branches`
  - `/manager/trials`
  - `/manager/memberships`
  - `/member/subscription`
- Shared layout
- API client base
- Auth provider skeleton
- Query provider
- Toast system

Definition of done:

- `npm run build` pass
- Tat ca route skeleton render duoc
- Co base layout va navigation theo role

### Phase 2. Auth + Guards

Muc tieu:

- Hoan tat login, token rotation, logout, role guard

Deliverables:

- Login form goi API that
- Auth store/provider
- Fetch wrapper hoac client co auto refresh token
- Route guards cho admin/manager/member
- Redirect khi khong du quyen

Definition of done:

- Login thanh cong voi account that
- Refresh token tu dong chay khi access token het han
- Logout xoa session client dung cach
- User sai role khong vao duoc route khong hop le

### Phase 3. Core Screens

Muc tieu:

- Dung cac man hinh MVP su dung API that

Deliverables:

- Public membership plans
- Admin branches list/create
- Admin users list/update status
- Admin assign manager cho branch
- Manager list managed branches
- Manager list/update/convert trials
- Manager activate membership
- Member current subscription

Definition of done:

- Moi screen co loading, empty, error, success state
- Cac thao tac chinh goi API that thanh cong
- Toast thong bao dung cho loi va thanh cong

### Phase 4. Staging Deploy

Muc tieu:

- Dua frontend va backend len moi truong staging co domain/URL truy cap duoc

Deliverables:

- Frontend deploy
- Backend deploy theo Docker + Supabase/VPS
- Env staging cho ca 2 ben
- CORS cho domain frontend

Definition of done:

- Frontend goi duoc backend staging
- Dang nhap duoc bang account staging
- Cac flow chinh pass tren staging

### Phase 5. Go-live Hardening

Muc tieu:

- Chot dieu kien go-live production

Deliverables:

- Smoke test checklist
- Account that thay cho seed mac dinh
- Password/secret production
- Rollback notes

Definition of done:

- Smoke test pass
- Khong con dung seed password yeu
- Co rollback/runbook toi thieu

## 4. Workstreams

### WS-1 Backend contract owner

Trach nhiem:

- Xac nhan contract that cho frontend
- Xac nhan auth flow, route scope, error codes

File can doc truoc:

- `MVP_API_CONTRACTS.md`
- `MYFIT-/src/app.js`
- `MYFIT-/src/identity-access/application/login-with-password.js`
- `MYFIT-/src/identity-access/application/refresh-access-token.js`
- `MYFIT-/src/identity-access/application/logout-current-session.js`

### WS-2 Frontend platform owner

Trach nhiem:

- Scaffold Next.js
- Shared providers, routing, layout, theme, UI base

File can doc truoc:

- `WEB_MVP_PHASE_0_CONTRACT_FREEZE.md`
- `frontend/package.json`
- `frontend/src/app/*`

### WS-3 Admin screens owner

Trach nhiem:

- Branches, users, assign manager

Route/backend can nam:

- `GET /api/v1/admin/branches`
- `POST /api/v1/admin/branches`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/status`
- `POST /api/v1/admin/branches/:id/managers`

### WS-4 Manager screens owner

Trach nhiem:

- Managed branches, trials, convert, activate membership

Route/backend can nam:

- `GET /api/v1/manager/branches`
- `GET /api/v1/manager/trials`
- `PATCH /api/v1/manager/trials/:id/status`
- `POST /api/v1/manager/trials/:id/convert`
- `POST /api/v1/manager/memberships/activate`

### WS-5 Member/public owner

Trach nhiem:

- Public plans
- Member current subscription

Route/backend can nam:

- `GET /api/v1/membership-plans`
- `GET /api/v1/me/subscription`

### WS-6 Deploy/release owner

Trach nhiem:

- Build frontend
- Deploy backend + frontend
- CORS + env + smoke verification

File can doc truoc:

- `MYFIT-/Dockerfile`
- `MYFIT-/DEPLOY_SUPABASE.md`
- `MYFIT-/.env.example`

## 5. Risks

- Backend docs va route thuc te co the lech nhau
- Backend hien tai khong dung refresh cookie; neu doi sang cookie sau nay can cap nhat auth client
- Co the can bo sung health endpoint hoac CORS config truoc deploy production
- Response login hien tai chi tra token, chua tra user profile

## 6. Immediate next actions

1. Tao frontend Next.js trong `frontend/`
2. Viet `WEB_MVP_PHASE_0_CONTRACT_FREEZE.md`
3. Cai dat TanStack Query va shadcn/ui
4. Tao route skeleton + providers
5. Bat dau auth client
