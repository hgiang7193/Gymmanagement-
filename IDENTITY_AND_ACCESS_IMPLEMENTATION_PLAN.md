# Identity and Access Implementation Plan

Tai lieu nay la implementation-ready plan cho context `Identity and Access` trong Wave 1.

Nguon goc:
- [SYSTEM_ARCHITECTURE_MVP.md](C:/Users/HKN/MYFIT-/SYSTEM_ARCHITECTURE_MVP.md)
- [MVP_SECURITY_AND_AUTH.md](C:/Users/HKN/MYFIT-/MVP_SECURITY_AND_AUTH.md)
- [MVP_API_CONTRACTS.md](C:/Users/HKN/MYFIT-/MVP_API_CONTRACTS.md)
- [MVP_CONTEXT_MAP.md](C:/Users/HKN/MYFIT-/MVP_CONTEXT_MAP.md)
- [MVP_TASKS.md](C:/Users/HKN/MYFIT-/MVP_TASKS.md)

## 1. Muc tieu Wave 1 cho Identity and Access

Phai giao duoc:
- Register
- Login
- Refresh token rotation
- Logout
- Forgot password
- Reset password
- Guest role mac dinh
- Branch-scoped RBAC foundation
- Audit/security event foundation

Chua bat buoc giao ngay:
- Zalo auth
- 2FA
- Session device management UI day du

## 2. Scope boundaries

Context nay bao gom:
- credential lifecycle
- token/session lifecycle
- role assignment foundation
- auth/branch scope resolution
- password reset flow
- social auth foundation o muc MVP-co-ban

Context nay khong bao gom:
- membership activation business logic
- trial conversion business logic
- workout attendance business logic
- trainer roster logic

## 3. De xuat cau truc module backend

Neu dung modular monolith, module `identity-access` nen co cac nhom:

- `domain`
  - user
  - refresh-session
  - password-reset-token
  - role-assignment
- `application`
  - commands/use-cases
  - auth services
  - token services
  - password reset services
- `infrastructure`
  - repositories
  - crypto/hash adapter
  - email sender adapter
  - jwt/refresh provider
- `presentation`
  - controllers/routes
  - request validators
  - auth guards
  - permission/branch-scope decorators or middleware

## 4. Data model implementation order

### 4.1 Migrations can tao truoc

1. `users`
2. `profiles`
3. `roles`
4. `user_role_assignments`
5. `social_auth_accounts`
6. `refresh_sessions`
7. `password_reset_tokens`
8. `security_events`
9. `audit_logs` neu chua co module governance rieng can scaffold truoc

### 4.2 Rang buoc bat buoc

- `users.email` unique neu co
- `(provider, provider_user_id)` unique
- refresh session co status/revoked marker
- password reset token co expiry va one-time-use flag/semantics

## 5. API implementation order

### Step 1
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Step 2
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Step 3
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

### Step 4
- Social auth foundation neu timeline cho phep

Ly do thu tu:
- Register/login tao duoc auth happy path som
- Refresh/logout can token model on dinh truoc
- Forgot/reset password dung sau khi user model va email sender foundation da co

## 6. Use cases can implement

### 6.1 RegisterGuest

Input:
- email
- password
- profile fields toi thieu

Rules:
- email unique
- password dat policy
- tao user + profile + guest role
- trigger verification email
- ghi audit/security event

### 6.2 LoginWithPassword

Input:
- email
- password

Rules:
- verify credential
- check account status
- cap access token
- tao refresh session
- ghi security event thanh cong/that bai

### 6.3 RefreshAccessToken

Input:
- refresh token

Rules:
- validate token/session
- rotate refresh token
- revoke token cu
- cap access token moi
- ghi security event neu replay/reject

### 6.4 LogoutCurrentSession

Input:
- refresh token hoac session id

Rules:
- revoke current refresh session
- ghi audit/security event

### 6.5 RequestPasswordReset

Input:
- email

Rules:
- tao token reset neu account ton tai
- gui email reset
- response khong de lo account co ton tai hay khong
- ghi security event

### 6.6 ResetPassword

Input:
- reset token
- new password

Rules:
- token hop le va chua het han
- update password hash
- invalidate token
- revoke refresh sessions neu policy yeu cau
- ghi security event

## 7. Validation rules can khoa lai som

- Email: format hop le, normalize lowercase neu ap dung
- Password: policy toi thieu do dai + complexity theo security baseline team chot
- Reset token: one-time use, co expiry
- Refresh token: rotate, khong cho reuse im lang

## 8. Security controls can code ngay

- Argon2id hashing adapter
- JWT signer/verifier
- Refresh token storage/meta tracking
- Rate limit cho login/forgot/refresh
- Structured audit/security logging
- Branch scope resolver foundation

## 9. Test plan cho Identity and Access

### 9.1 Unit tests

- Password hashing service
- Token issue/verify service
- Refresh rotation logic
- Password reset token validation
- Role assignment defaults

### 9.2 Integration tests

- register happy path
- login happy path
- duplicate email register
- invalid password login
- refresh token rotation
- logout revoke session
- forgot password request
- reset password success/failure

### 9.3 Security-focused tests

- refresh token reuse bi reject
- revoked session khong refresh duoc
- locked/inactive user khong login duoc
- forgot password khong leak account existence ro rang

## 10. File plan mau cho implementation

Neu code bat dau, can mo toi thieu cac nhom file sau:

Backend:
- auth controller/routes
- auth validators
- auth application service/use cases
- user repository
- refresh session repository
- password reset repository
- jwt provider
- password hasher adapter
- audit/security event emitter
- auth/role middleware or guards
- migrations cho identity-access tables
- tests cho auth module

Frontend o Wave 1 co the song song o muc toi thieu:
- login form
- register form
- forgot password form
- reset password form

## 11. Checkpoints truoc khi qua phase tiep theo

Phai dat duoc truoc khi sang `Branch Management + Admin baseline`:
- Guest register/login chay thong
- Access token + refresh token hoat dong on dinh
- Logout revoke duoc session hien tai
- Forgot/reset password chay thong
- Guest role duoc gan mac dinh
- Security/audit events ghi duoc

Phai dat duoc truoc khi sang `Membership`:
- Role resolution foundation san sang
- Branch scope foundation co the duoc tai/resolve trong auth context

## 12. Contract gaps can khong tu y mo rong

Neu gap 1 trong cac van de sau, phai dung lai va cap nhat artifact, khong tu y thiet ke them:
- Co bat buoc social provider nao trong MVP ngoai email/password?
- Password policy can cu the den dau?
- Email verification co bat buoc truoc login hay chi bat buoc truoc thao tac nhay cam?
- Branch scope co can embed trong token hay tai qua auth context/runtime lookup?

## 13. Definition of done

Identity and Access duoc xem la implementation-ready khi:
- Team co the code theo use case order tren
- Test cases da ro rang
- Khong con nham boundary voi Membership/Trial Booking
- Moi gap chua khoa duoc dua vao `ASSUMPTIONS_AND_DECISIONS.md` truoc khi code
