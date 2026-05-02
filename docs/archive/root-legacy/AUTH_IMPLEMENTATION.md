# MYFIT MVP Auth & Security

Tai lieu nay gop `MVP_SECURITY_AND_AUTH.md` va `IDENTITY_AND_ACCESS_IMPLEMENTATION_PLAN.md` thanh mot artifact duy nhat de Wave 1 implementation.

## 1. Scope

Tap trung cho MVP:
- register / login / logout / refresh / forgot-password / reset-password
- email verification
- social login o muc MVP-co-ban
- RBAC + branch scope
- audit/security events
- API protection controls

Khong cover day du trong MVP:
- 2FA full implementation
- session device management day du
- anti-fraud GPS/QR check-in
- payment security chi tiet ngoai muc khong luu raw card data

Wave 1 chua bat buoc giao:
- Zalo auth
- 2FA
- session device management full UI

## 2. Active assumptions

- A-001: MVP uu tien email/password va 1 social provider; Zalo co the defer neu cham.
- A-003: Notification manager uu tien email; khong rang buoc social messaging o Wave 1.
- A-007: Health data phai theo least privilege; manager khong mac dinh thay full body metrics lich su.

## 3. Auth model

### Supported auth methods

Bat buoc cho MVP:
- Email/password
- Refresh token rotation
- Email verification

Co the co trong MVP neu timeline cho phep:
- 1 social provider (Google hoac provider team de tich hop nhat)

### Core entities

- `User`, `Profile`, `SocialAuthAccount`
- `RoleAssignment`, `RefreshSession`
- `PasswordResetToken`, `SecurityEvent`, `AuditLog`

### Token strategy

- Access token ngan han: 15 phut
- Refresh token rotate dinh ky
- Refresh token metadata luu/tracked de co the revoke va audit
- Khong luu token thuan van trong log

## 4. Auth flows

### Register

1. Nhan email, password, thong tin profile toi thieu
2. Validate email uniqueness
3. Hash password bang Argon2id
4. Tao `User` + `Profile`
5. Tao role guest mac dinh
6. Tao event verification email
7. Ghi audit/security event

Failure cases: Duplicate email, password khong dat policy, validation fail.

### Login

1. Validate credential
2. Check account status
3. Tao access token
4. Tao/rotate refresh session
5. Ghi security event thanh cong/that bai

Failure cases: Sai mat khau, user bi khoa, email chua verify.

### Refresh token

1. Validate refresh token
2. Check session metadata con hop le
3. Rotate refresh token
4. Cap access token moi
5. Ghi security event neu co misuse/replay nghi ngo

Failure cases: Token het han, token da revoke, token replay.

### Logout

1. Xac dinh refresh session
2. Revoke session
3. Ghi audit/security event

### Forgot password / Reset password

1. Nhan email
2. Tao password reset token mot lan
3. Gui email reset
4. Khi reset: validate token, doi password, revoke token cu, revoke refresh sessions neu can
5. Ghi audit/security event

### Social login linking

- Link theo email da verify hoac explicit linking flow
- `(provider, provider_user_id)` phai unique
- Khong tu dong merge 2 account mo ho

## 5. Authorization model

### Roles MVP

- `Guest`, `Member`, `Trainer`, `Manager`, `Admin`

### Branch scope

- Manager chi thay du lieu branch duoc gan
- Trainer chi thay roster/shift-branch duoc phan cong
- Admin co quyen toan he thong
- Member chi thao tac tren du lieu chinh minh trong pham vi nghiep vu

### Least privilege cho health data

- Member: duoc xem day du du lieu cua minh
- Trainer: chi thay du lieu can thiet de huan luyen trong pham vi assignment
- Manager: chi thay du lieu toi thieu de van hanh, khong mac dinh thay tat ca chi so chi tiet lich su
- Admin: co the truy cap khi can audit/ops, nhung phai co audit log cho thao tac nhay cam

## 6. API protection controls

Bat buoc cho MVP:
- Rate limit tren: login, forgot password, refresh token, trial booking
- Validation schema-based cho moi input
- ORM/query builder an toan tranh SQL injection
- Output encoding + CSP co ban tranh XSS
- Anti-replay cho refresh token flow (bearer token)
- Structured logs, correlation ID moi request
- Khong log secrets/password/token raw

## 7. Audit and security event catalog

### Security events bat buoc

- `login_success`, `login_failed`
- `password_reset_requested`, `password_reset_completed`
- `refresh_token_rotated`, `refresh_token_rejected`
- `social_login_linked`
- `user_locked`, `user_unlocked`

### Audit events bat buoc

- `role_assignment_changed`
- `trial_converted_to_member`
- `membership_activated`, `subscription_status_changed`
- `workout_session_created`, `body_measurement_recorded`
- `branch_created`, `branch_updated`
- `membership_plan_created`, `membership_plan_updated`

## 8. Data protection rules

- TLS cho moi traffic
- Encryption at rest cho database va object storage
- Khong luu raw card data
- Han che health data theo least privilege
- Privacy notice + consent cho health data collection trong MVP

## 9. Implementation plan (Wave 1)

### Module structure

Module `identity-access` gom cac nhom:
- `domain`: user, refresh-session, password-reset-token, role-assignment
- `application`: commands/use-cases, auth services, token services, password reset services
- `infrastructure`: repositories, crypto/hash adapter, email sender adapter, jwt/refresh provider
- `presentation`: controllers/routes, request validators, auth guards, permission/branch-scope middleware

### Data model — migration order

1. `users`
2. `profiles`
3. `roles`
4. `user_role_assignments`
5. `social_auth_accounts`
6. `refresh_sessions`
7. `password_reset_tokens`
8. `security_events`
9. `audit_logs`

Rang buoc bat buoc:
- `users.email` unique
- `(provider, provider_user_id)` unique
- refresh session co status/revoked marker
- password reset token co expiry va one-time-use

### API implementation order

**Step 1:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
**Step 2:** `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
**Step 3:** `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
**Step 4:** Social auth foundation neu timeline cho phep

### Use cases can implement

**RegisterGuest** — email + password + profile; tao user + guest role + audit event

**LoginWithPassword** — verify credential + account status; cap access + refresh token; ghi security event

**RefreshAccessToken** — validate token/session; rotate refresh token; revoke token cu; cap access token moi

**LogoutCurrentSession** — revoke current refresh session; ghi audit/security event

**RequestPasswordReset** — tao token reset; gui email reset; response khong de lo account ton tai hay khong; ghi security event

**ResetPassword** — validate token; update password hash; invalidate token; revoke refresh sessions; ghi security event

### Security controls can code ngay

- Argon2id hashing adapter
- JWT signer/verifier
- Refresh token storage/meta tracking
- Rate limit cho login/forgot/refresh
- Structured audit/security logging
- Branch scope resolver foundation

## 10. Test plan

### Unit tests
- Password hashing service
- Token issue/verify service
- Refresh rotation logic
- Password reset token validation
- Role assignment defaults

### Integration tests
- register happy path
- login happy path
- duplicate email register
- invalid password login
- refresh token rotation
- logout revoke session
- forgot password request
- reset password success/failure

### Security-focused tests
- refresh token reuse bi reject
- revoked session khong refresh duoc
- locked/inactive user khong login duoc
- forgot password khong leak account existence ro rang

## 11. Checkpoints

Phai dat duoc truoc khi sang `Branch Management + Admin baseline`:
- Guest register/login chay thong
- Access token + refresh token hoat dong on dinh
- Logout revoke duoc session hien tai
- Forgot/reset password chay thong
- Guest role duoc gan mac dinh
- Security/audit events ghi duoc
- Khong co log password/token raw
- Manager cross-branch bi chan

Phai dat duoc truoc khi sang `Membership`:
- Role resolution foundation san sang
- Branch scope foundation co the duoc tai/resolve trong auth context

## 12. Contract gaps can khong tu y mo rong

Neu gap 1 trong cac van de sau, phai dung lai va cap nhat artifact:
- Co bat buoc social provider nao trong MVP ngoai email/password?
- Password policy can cu the den dau?
- Email verification co bat buoc truoc login hay chi truoc thao tac nhay cam?
- Branch scope co can embed trong token hay tai qua auth context/runtime lookup?
