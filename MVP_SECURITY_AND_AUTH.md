# MYFIT MVP Security and Auth

Tai lieu nay tach rieng security va auth contract cho MVP de Wave 1 implementation bam chac hon vao 1 artifact duy nhat.

Nguon goc:
- [SYSTEM_ARCHITECTURE_MVP.md](C:/Users/HKN/MYFIT-/SYSTEM_ARCHITECTURE_MVP.md)
- [ASSUMPTIONS_AND_DECISIONS.md](C:/Users/HKN/MYFIT-/ASSUMPTIONS_AND_DECISIONS.md)
- [MVP_API_CONTRACTS.md](C:/Users/HKN/MYFIT-/MVP_API_CONTRACTS.md)

## 1. Scope cua tai lieu nay

Tap trung cho MVP:
- register/login/logout/refresh/forgot-password/reset-password
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

## 2. Active assumptions lien quan security/auth

- A-001: MVP uu tien email/password va 1 social provider; Zalo co the defer neu cham.
- A-003: Notification manager uu tien email; khong rang buoc social messaging o Wave 1.
- A-007: Health data phai theo least privilege; manager khong mac dinh thay full body metrics lich su.

## 3. Auth model MVP

### 3.1 Supported auth methods

Bat buoc cho MVP:
- Email/password
- Refresh token rotation
- Email verification

Co the co trong MVP neu timeline cho phep:
- 1 social provider (Google hoac provider team de tich hop nhat)

Deferred:
- Zalo neu integration khong kip
- 2FA day du
- session device dashboard

### 3.2 Core entities

- `User`
- `Profile`
- `SocialAuthAccount`
- `RoleAssignment`
- `RefreshSession`
- `PasswordResetToken`
- `SecurityEvent`
- `AuditLog`

### 3.3 Token strategy

- Access token ngan han: `15 phut`
- Refresh token rotate dinh ky
- Refresh token metadata luu/tracked de co the revoke va audit
- Khong luu token thuan van trong log

## 4. Auth flows

### 4.1 Register

Muc tieu:
- Tao tai khoan guest moi bang email/password

Flow:
1. Nhan email, password, thong tin profile toi thieu
2. Validate email uniqueness
3. Hash password bang Argon2id
4. Tao `User` + `Profile`
5. Tao role guest mac dinh
6. Tao event verification email
7. Ghi audit/security event

Failure cases:
- Duplicate email
- Password khong dat policy
- Validation fail

### 4.2 Login

Muc tieu:
- Dang nhap va cap access token + refresh token

Flow:
1. Validate credential
2. Check account status
3. Tao access token
4. Tao/rotate refresh session
5. Ghi security event thanh cong/that bai

Failure cases:
- Sai mat khau
- User bi khoa
- Email chua verify neu business action can verify

### 4.3 Refresh token

Muc tieu:
- Gia han session theo co che rotation an toan

Flow:
1. Validate refresh token
2. Check session metadata con hop le
3. Rotate refresh token
4. Cap access token moi
5. Ghi security event neu co misuse/replay nghi ngo

Failure cases:
- Token het han
- Token da revoke
- Token replay

### 4.4 Logout

Muc tieu:
- Vo hieu hoa refresh session hien tai

Flow:
1. Xac dinh refresh session
2. Revoke session
3. Ghi audit/security event

### 4.5 Forgot password / Reset password

Flow:
1. Nhan email
2. Tao password reset token mot lan
3. Gui email reset
4. Khi reset: validate token, doi password, revoke token cu, revoke refresh sessions neu can
5. Ghi audit/security event

### 4.6 Social login linking

Nguyen tac MVP:
- Link theo email da verify hoac explicit linking flow
- `(provider, provider_user_id)` phai unique
- Khong tu dong merge 2 account mo ho neu bang chung identity khong du ro

## 5. Authorization model

### 5.1 Roles MVP

- `Guest`
- `Member`
- `Trainer`
- `Manager`
- `Admin`

### 5.2 Branch scope

- Manager chi thay du lieu branch duoc gan
- Trainer chi thay roster/du lieu shift-branch duoc phan cong
- Admin co quyen toan he thong
- Member chi thao tac tren du lieu cua chinh minh trong pham vi nghiep vu duoc cho phep

### 5.3 Least privilege cho health data

- Member: duoc xem day du du lieu cua minh
- Trainer: chi thay du lieu can thiet de huan luyen trong pham vi assignment
- Manager: chi thay du lieu toi thieu de van hanh, khong mac dinh thay tat ca chi so chi tiet lich su
- Admin: co the truy cap khi can audit/ops, nhung phai co audit log cho thao tac nhay cam

## 6. API protection controls

### 6.1 Bat buoc cho MVP

- Rate limit tren:
  - login
  - forgot password
  - refresh token
  - trial booking
- Validation schema-based cho moi input
- ORM/query builder an toan tranh SQL injection
- Output encoding + CSP co ban tranh XSS
- CSRF protection neu dung cookie auth
- Neu dung bearer token: bo sung anti-replay cho refresh token flow

### 6.2 Logging va observability

- Structured logs
- Correlation ID moi request
- Tach `security` logs khoi logs nghiep vu thong thuong neu can
- Khong log secrets/password/token raw

## 7. Audit and security event catalog

### 7.1 Security events bat buoc

- `login_success`
- `login_failed`
- `password_reset_requested`
- `password_reset_completed`
- `refresh_token_rotated`
- `refresh_token_rejected`
- `social_login_linked`
- `user_locked` / `user_unlocked`

### 7.2 Audit events bat buoc

- `role_assignment_changed`
- `trial_converted_to_member`
- `membership_activated`
- `subscription_status_changed`
- `workout_session_created`
- `body_measurement_recorded`
- `branch_created`
- `branch_updated`
- `membership_plan_created`
- `membership_plan_updated`

## 8. Data protection rules

- TLS cho moi traffic
- Encryption at rest cho database va object storage
- Khong luu raw card data
- Han che health data theo least privilege
- Privacy notice + consent cho health data collection trong MVP

## 9. Wave 1 implementation contract

Wave 1 bat buoc phai giao duoc:
- register/login/logout/refresh/forgot-password/reset-password
- role guest mac dinh
- branch-scoped RBAC foundation
- audit/security event abstraction
- validator foundation
- access token + refresh token strategy

Wave 1 chua bat buoc giao:
- Zalo auth
- 2FA
- session device management full UI

## 10. Verification checklist

Truoc khi xem auth/security la xong o MVP, can verify:
- Dang ky guest thanh cong
- Dang nhap cap access + refresh token dung format
- Refresh token rotate duoc va token cu khong reuse duoc
- Logout revoke session duoc
- Forgot/reset password chay thong
- Manager cross-branch bi chan
- Security events va audit events duoc ghi dung
- Khong co log password/token raw

## 11. Definition of done

Tai lieu nay du dung cho implementation khi:
- Backend co the viet auth module ma khong hoi lai scope lon
- QA/test co the derive test cases tu cac flow va checklist tren
- Security review co 1 noi de doi chieu controls, events va assumptions
