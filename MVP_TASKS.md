# MYFIT MVP Tasks

Tai lieu nay chia implementation thanh tasks co the thuc thi duoc dua tren:
- [SYSTEM_ARCHITECTURE_MVP.md](C:/Users/HKN/MYFIT-/SYSTEM_ARCHITECTURE_MVP.md)
- [MVP_CONTEXT_MAP.md](C:/Users/HKN/MYFIT-/MVP_CONTEXT_MAP.md)
- [MVP_API_CONTRACTS.md](C:/Users/HKN/MYFIT-/MVP_API_CONTRACTS.md)
- [ASSUMPTIONS_AND_DECISIONS.md](C:/Users/HKN/MYFIT-/ASSUMPTIONS_AND_DECISIONS.md)

Muc tieu:
- Di tu contracts -> implementation
- Giam redesign trong luc code
- Tao checklist du nho de co the assign va review

Quy uoc:
- `[P]` = co the lam song song
- Moi task nen map vao 1 context chinh
- Test cho business-critical flow duoc dat cung module implementation, khong de cuoi cung moi viet

## 0. Execution order locked
Thu tu implementation duoc khoa lai nhu sau:
### Wave 1 - Nen tang bat buoc
1. Identity and Access
2. Branch Management + Admin baseline
3. Membership
### Wave 2 - Luong nghiep vu cot loi tren nen tang da on
4. Trial Booking
5. Workout Attendance
6. Trainer Operations
Ly do:
- Khong the lam trial conversion on dinh neu chua co auth, branch scope va membership lifecycle.
- Khong the lam workout attendance dung neu chua co membership validation va branch-scoped access.
- Trainer roster phu thuoc truc tiep vao du lieu workout attendance da duoc tao hop le.
Rule thuc thi:
- Khong implement Trial Booking business flow truoc khi xong Membership activation baseline.
- Khong implement Workout Attendance API critical truoc khi xong subscription model va branch scope enforcement.
- Khong implement Trainer roster truoc khi xong workout check-in happy path va read model can thiet.

## 1. Phase 0 - Baseline va governance

### 1.1 Architecture and contracts freeze
- [ ] Xac nhan `SYSTEM_ARCHITECTURE_MVP.md` la baseline hien tai.
- [ ] Review va khoa `ASSUMPTIONS_AND_DECISIONS.md` cho auth/social provider, membership activation, notification channel.
- [ ] Review `MVP_CONTEXT_MAP.md` de team thong nhat boundary modules.
- [ ] Review `MVP_API_CONTRACTS.md` de chot response envelope, error codes, validation style.

Checkpoint:
- Khong bat dau code API critical neu 4 artifact tren chua duoc team thong nhat.

## 2. Phase 1 - Foundation platform

### 2.1 Repository and app skeleton [P]
- [ ] Scaffold backend modular monolith skeleton theo module boundaries trong architecture.
- [ ] Scaffold frontend app skeleton theo areas: public, member, trainer, manager, admin.
- [ ] Thiet lap env config cho dev/staging/prod.

### 2.2 Core infrastructure [P]
- [ ] Thiet lap PostgreSQL connection va migration framework.
- [ ] Thiet lap Redis cho rate limit va token/session metadata.
- [ ] Thiet lap structured logging + correlation ID.
- [ ] Thiet lap Sentry hoac exception tracking.

### 2.3 Security baseline
- [ ] Thiet lap password hashing Argon2id.
- [ ] Thiet lap access token + refresh token foundation.
- [ ] Thiet lap validation layer schema-based.
- [ ] Thiet lap audit logging abstraction.

Checkpoint:
- App boot duoc o local/staging.
- Co health endpoint.
- Co migration pipeline co the chay.

## 3. Phase 2 - Identity and Access context

### 3.1 Data model
- [ ] Tao migrations cho `users`, `profiles`, `roles`, `user_role_assignments`, `social_auth_accounts`.
- [ ] Tao constraints unique cho email va social provider identity.

### 3.2 Auth flows
- [ ] Implement `POST /api/v1/auth/register`.
- [ ] Implement `POST /api/v1/auth/login`.
- [ ] Implement `POST /api/v1/auth/refresh`.
- [ ] Implement `POST /api/v1/auth/logout`.
- [ ] Implement `POST /api/v1/auth/forgot-password`.
- [ ] Implement `POST /api/v1/auth/reset-password`.

### 3.3 Tests
- [ ] Test register/login happy path.
- [ ] Test duplicate email.
- [ ] Test invalid password/login failure audit event.
- [ ] Test refresh token rotation.

Checkpoint:
- Guest co the dang ky/dang nhap.
- Audit events auth xuat hien dung.

## 4. Phase 3 - Branch Management + Admin baseline

### 4.1 Data model
- [ ] Tao migrations cho `branches`, `branch_manager_assignments` va phan branch scope can thiet.

### 4.2 Admin baseline APIs
- [ ] Implement `GET /api/v1/admin/branches`.
- [ ] Implement `POST /api/v1/admin/branches`.
- [ ] Implement `PATCH /api/v1/admin/branches/{id}`.
- [ ] Implement `GET /api/v1/admin/users`.
- [ ] Implement `PATCH /api/v1/admin/users/{id}/status`.

### 4.3 Tests
- [ ] Test admin-only access.
- [ ] Test manager khong duoc goi admin endpoints.
- [ ] Test branch scope metadata duoc luu dung.

Checkpoint:
- Branch va admin operations toi thieu chay duoc.

## 5. Phase 4 - Membership context

### 5.1 Data model
- [ ] Tao migrations cho `membership_plans`, `subscriptions`, `subscription_status_history`.
- [ ] Tao constraints cho `sessions_remaining >= 0`.

### 5.2 APIs
- [ ] Implement `GET /api/v1/membership-plans`.
- [ ] Implement `GET /api/v1/me/subscription`.
- [ ] Implement `POST /api/v1/manager/memberships/activate` theo `MVP_API_CONTRACTS.md`.

### 5.3 Tests
- [ ] Test membership activation happy path.
- [ ] Test manager cross-branch bi chan.
- [ ] Test membership conflict khi da co subscription active.
- [ ] Test audit events `membership_activated` va `subscription_status_changed`.

Checkpoint:
- Membership activation co the hoat dong doc lap truoc trial conversion.

## 6. Phase 5 - Trial Booking context

### 6.1 Data model
- [ ] Tao migrations cho `trial_bookings`, `trial_status_history`, `trial_notification_log`.

### 6.2 APIs
- [ ] Implement `POST /api/v1/trials`.
- [ ] Implement `GET /api/v1/manager/trials`.
- [ ] Implement `PATCH /api/v1/manager/trials/{id}/status`.
- [ ] Implement `POST /api/v1/manager/trials/{id}/convert` theo `MVP_API_CONTRACTS.md`.

### 6.3 Async jobs
- [ ] Implement email notification job cho trial booking moi.
- [ ] Implement retry/chot logging cho notification failures.

### 6.4 Tests
- [ ] Test tao trial booking happy path.
- [ ] Test manager chi xem trial cua branch minh.
- [ ] Test convert trial happy path.
- [ ] Test trial da convert khong convert lai duoc.
- [ ] Test audit events conversion.

Checkpoint:
- Flow `guest -> trial -> manager view -> convert` chay thong.

## 7. Phase 6 - Workout Attendance context

### 7.1 Data model
- [ ] Tao migrations cho `workout_sessions`, `body_measurements`, `attendance_counters` neu tach bang rieng, hoac xac nhan co che counter trong `subscriptions`.
- [ ] Tao unique constraint cho 1 user / 1 branch / 1 shift / 1 session_date.

### 7.2 API critical
- [ ] Implement `POST /api/v1/member/workout-sessions` theo `MVP_API_CONTRACTS.md`.
- [ ] Implement `GET /api/v1/member/workout-calendar`.
- [ ] Implement `GET /api/v1/member/workout-sessions/{id}`.

### 7.3 Business logic
- [ ] Enforce immutable workout session.
- [ ] Enforce body metrics bat buoc.
- [ ] Enforce transaction boundary va row lock tren subscription.
- [ ] Emit audit events cho workout session create.

### 7.4 Tests
- [ ] Test check-in happy path.
- [ ] Test subscription inactive.
- [ ] Test duplicate attendance.
- [ ] Test concurrency cho `sessions_remaining` khong bi am.
- [ ] Test member khong tao check-in cho nguoi khac duoc.

Checkpoint:
- Flow workout check-in chay o mobile-first UI va du data cho trainer roster.

## 8. Phase 7 - Trainer Operations context

### 8.1 Data model
- [ ] Tao migrations cho `trainer_assignments`, `shifts` neu chua co.

### 8.2 API
- [ ] Implement `GET /api/v1/trainer/shifts/{shiftCode}/roster`.

### 8.3 Tests
- [ ] Test trainer roster chi hien thi branch/shift duoc phan cong.
- [ ] Test trainer khong thay roster branch khac.
- [ ] Test roster lay tu workout attendance da tao thanh cong.

Checkpoint:
- Trainer thay duoc hoc vien check-in theo shift.

## 9. Phase 8 - Frontend integration

### 9.1 Public + auth [P]
- [ ] Login/Register/Forgot Password screens.
- [ ] Trial Booking screen.
- [ ] Membership Plans listing.

### 9.2 Member area [P]
- [ ] Workout Check-in form theo contract.
- [ ] Workout Calendar view.
- [ ] Session Detail view.
- [ ] Profile view.

### 9.3 Manager area [P]
- [ ] Trial Management list.
- [ ] Trial convert action.
- [ ] Membership activation form.

### 9.4 Trainer area [P]
- [ ] Shift roster screen.

### 9.5 Admin area [P]
- [ ] Branches screen.
- [ ] Users screen.
- [ ] Membership plans CRUD screen.
- [ ] Audit logs screen.

Checkpoint:
- FE biet xu ly dung loading/error/conflict states theo contract.

## 10. Phase 9 - Hardening va release prep

### 10.1 Security and compliance
- [ ] Review rate limit cho login, refresh, forgot password, trial booking.
- [ ] Review least privilege cho health data views.
- [ ] Review audit coverage cho auth, conversion, attendance, admin changes.

### 10.2 Reliability
- [ ] Verify backups hang ngay.
- [ ] Verify restore drill checklist.
- [ ] Verify logging + alerting hot paths.

### 10.3 Testing
- [ ] Unit tests cho domain rules quan trong.
- [ ] Integration tests cho auth, trial conversion, workout check-in.
- [ ] E2E smoke tests cho 4 flows cot loi:
  - guest register/login
  - trial booking
  - trial convert/member activation
  - workout check-in

### 10.4 Release gate
- [ ] Chot assumptions con mo.
- [ ] Chot migration strategy.
- [ ] Chot env vars va secrets.
- [ ] Chot smoke test checklist production.

## 11. Top dependencies

- Auth foundation truoc branch-scoped APIs.
- Branch Management truoc manager/trainer scoped modules.
- Membership truoc workout attendance.
- Trial conversion phu thuoc Membership + Identity/Role assignment.
- Workout Attendance truoc Trainer roster.
- API contracts freeze truoc frontend integration.

## 12. Do not do trong implementation

- Khong redesign architecture trong luc code.
- Khong them commerce day du vao MVP tasks hien tai.
- Khong dua AI/RAG vao implementation backlog dot nay.
- Khong dat logic branch scope o frontend nhu nguon su that.
- Khong bo qua audit cho 3 luong nghiep vu critical.

## 13. Definition of done

MVP task plan nay du dung khi:
- Moi task co the giao cho dev/agent ma khong can suy doan them artifact goc.
- Cac API critical deu co implementation task va test task rieng.
- Thu tu dependency giup team code ma khong pha boundary context.



