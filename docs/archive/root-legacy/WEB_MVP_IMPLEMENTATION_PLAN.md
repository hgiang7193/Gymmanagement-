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

Muc tieu: Dong bang contract backend thuc te truoc khi viet frontend.

#### Auth strategy da chot

- `POST /api/v1/auth/login`
  - Request: `email`, `password`
  - Response `200`: `data.accessToken`, `data.refreshToken`
- `POST /api/v1/auth/refresh`
  - Request: `refreshToken`
  - Response `200`: `data.accessToken`, `data.refreshToken`
- `POST /api/v1/auth/logout`
  - Request: `refreshToken`
  - Response `200`: `data.success = true`

Backend dang dung JSON token flow (khong co HttpOnly cookie trong MVP).
Frontend MVP implement auth theo JSON token flow.
Frontend xu ly `401` bang refresh token rotation mot lan truoc khi redirect `/login`.

#### Response envelope

```json
{ "data": {}, "error": null, "meta": {} }
```

Khi loi:

```json
{ "data": null, "error": { "code": "SOME_CODE", "message": "..." }, "meta": {} }
```

#### Route scope cho web MVP

**Public:**
- `GET /api/v1/membership-plans`

**Auth:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

**Admin:**
- `GET /api/v1/admin/branches`
- `POST /api/v1/admin/branches`
- `POST /api/v1/admin/branches/:id/managers`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/status`

**Manager:**
- `GET /api/v1/manager/branches`
- `GET /api/v1/manager/trials`
- `PATCH /api/v1/manager/trials/:id/status`
- `POST /api/v1/manager/trials/:id/convert`
- `POST /api/v1/manager/memberships/activate`

**Member:**
- `GET /api/v1/me/subscription`
- Alias: `GET /api/v1/memberships/me`

#### Error codes frontend can map ngay

- `UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`, `USER_INACTIVE`, `INVALID_REFRESH_TOKEN`, `SESSION_NOT_FOUND`
- `BRANCH_CODE_ALREADY_EXISTS`, `SUBSCRIPTION_CONFLICT`, `TRIAL_ALREADY_CONVERTED`, `MEMBERSHIP_PLAN_NOT_AVAILABLE`

#### Known gaps

- Login response hien tai khong tra user profile object
- Chua co contract frontend rieng cho healthcheck endpoint
- CORS production config can verify trong phase deploy

### Phase 1. Frontend Bootstrap

Muc tieu: Tao app Next.js co cau truc san sang de tich hop API that.

Deliverables:
- Route skeleton: `/`, `/login`, `/admin/branches`, `/admin/users`, `/manager/branches`, `/manager/trials`, `/manager/memberships`, `/member/subscription`
- Shared layout, API client base, auth provider skeleton, query provider, toast system

Definition of done: `npm run build` pass, tat ca route skeleton render duoc.

### Phase 2. Auth + Guards

Muc tieu: Hoan tat login, token rotation, logout, role guard.

Deliverables:
- Login form goi API that
- Auth store/provider
- Fetch wrapper co auto refresh token
- Route guards cho admin/manager/member
- Redirect khi khong du quyen

Definition of done: Login thanh cong, refresh token tu dong chay, logout xoa session dung cach.

### Phase 3. Core Screens

Muc tieu: Dung cac man hinh MVP su dung API that.

Deliverables:
- Public membership plans
- Admin: branches list/create, users list/update status, assign manager cho branch
- Manager: list managed branches, list/update/convert trials, activate membership
- Member: current subscription

Definition of done: Moi screen co loading/empty/error/success state, cac thao tac chinh goi API that thanh cong, toast thong bao dung.

### Phase 4. Staging Deploy

Muc tieu: Dua frontend va backend len staging co domain/URL truy cap duoc.

Deliverables: Frontend + backend deploy, env staging, CORS config.

### Phase 5. Go-live Hardening

Muc tieu: Chot dieu kien go-live production.

Deliverables: Smoke test checklist, account that thay seed mac dinh, password/secret production, rollback notes.

## 4. Workstreams

### WS-1 Backend contract owner
Xac nhan contract that cho frontend (auth flow, route scope, error codes).
Files: `MVP_API_CONTRACTS.md`, `MYFIT-/src/app.js`, `MYFIT-/src/identity-access/application/login-with-password.js`

### WS-2 Frontend platform owner
Scaffold Next.js, shared providers, routing, layout, theme, UI base.
Files: `frontend/package.json`, `frontend/src/app/*`

### WS-3 Admin screens owner
Branches, users, assign manager.
Routes: `GET/POST /api/v1/admin/branches`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id/status`, `POST /api/v1/admin/branches/:id/managers`

### WS-4 Manager screens owner
Managed branches, trials, convert, activate membership.
Routes: `GET /api/v1/manager/branches`, `GET /api/v1/manager/trials`, `PATCH/POST /api/v1/manager/trials/:id/*`, `POST /api/v1/manager/memberships/activate`

### WS-5 Member/public owner
Public plans, member current subscription.
Routes: `GET /api/v1/membership-plans`, `GET /api/v1/me/subscription`

### WS-6 Deploy/release owner
Build frontend, deploy backend + frontend, CORS + env + smoke verification.
Files: `MYFIT-/Dockerfile`, `MYFIT-/DEPLOY_SUPABASE.md`, `MYFIT-/.env.example`

## 5. Risks

- Backend docs va route thuc te co the lech nhau
- Backend hien tai khong dung refresh cookie; neu doi sang cookie sau nay can cap nhat auth client
- Co the can bo sung health endpoint hoac CORS config truoc deploy production
- Response login hien tai chi tra token, chua tra user profile
