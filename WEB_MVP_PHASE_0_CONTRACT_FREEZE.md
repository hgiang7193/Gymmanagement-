# MYFIT Web MVP Phase 0 Contract Freeze

Tai lieu nay khoa lai contract frontend se dua vao de implementation.
Neu backend thay doi, phai cap nhat tai lieu nay truoc hoac cung luc.

## 1. Auth strategy da chot

- `POST /api/v1/auth/login`
  - Request:
    - `email`
    - `password`
  - Response `200`:
    - `data.accessToken`
    - `data.refreshToken`
- `POST /api/v1/auth/refresh`
  - Request:
    - `refreshToken`
  - Response `200`:
    - `data.accessToken`
    - `data.refreshToken`
- `POST /api/v1/auth/logout`
  - Request:
    - `refreshToken`
  - Response `200`:
    - `data.success = true`

Ket luan:

- Backend dang dung JSON token flow
- Khong co bang chung runtime cho refresh token HttpOnly cookie trong dot nay
- Frontend MVP se implement auth theo JSON token flow

## 2. Response envelope

Tat ca request frontend phai parse theo envelope:

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

Khi loi:

```json
{
  "data": null,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message"
  },
  "meta": {}
}
```

## 3. Route scope cho web MVP

### Public

- `GET /api/v1/membership-plans`

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

### Admin

- `GET /api/v1/admin/branches`
- `POST /api/v1/admin/branches`
- `POST /api/v1/admin/branches/:id/managers`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/status`

### Manager

- `GET /api/v1/manager/branches`
- `GET /api/v1/manager/trials`
- `PATCH /api/v1/manager/trials/:id/status`
- `POST /api/v1/manager/trials/:id/convert`
- `POST /api/v1/manager/memberships/activate`

### Member

- `GET /api/v1/me/subscription`
- Alias backward-compatible:
  - `GET /api/v1/memberships/me`

## 4. Error codes frontend can map ngay

- `UNAUTHORIZED`
- `FORBIDDEN`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`
- `USER_INACTIVE`
- `INVALID_REFRESH_TOKEN`
- `SESSION_NOT_FOUND`
- `BRANCH_CODE_ALREADY_EXISTS`
- `SUBSCRIPTION_CONFLICT`
- `TRIAL_ALREADY_CONVERTED`
- `MEMBERSHIP_PLAN_NOT_AVAILABLE`

## 5. UI assumptions duoc phep

- Sau login, frontend co the suy ra role tu access token claims neu can, nhung uu tien luu session state tu login flow
- Khong dua vao frontend de enforce branch scope
- Frontend phai xu ly `401` bang refresh token rotation mot lan truoc khi day user ve `/login`

## 6. Known gaps / follow-up

- Login response hien tai khong tra user profile object
- Chua co contract frontend rieng cho healthcheck endpoint
- CORS production config can verify trong phase deploy
