# MYFIT MVP System Architecture

Tai lieu nay mo ta kien truc MVP cho he thong quan ly gym MYFIT da chi nhanh, bam dung scope da chot trong [REQUIREMENTS_PHASE_PLAN.md](C:/Users/HKN/MYFIT-/REQUIREMENTS_PHASE_PLAN.md).

Muc tieu MVP:
- Go-live an toan trong 6 tuan
- Ho tro da chi nhanh
- Van hanh duoc luong kinh doanh cot loi: trial booking -> chuyen doi thanh vien -> check-in workout -> trainer theo doi theo ca -> admin quan ly
- Dam bao audit, backup, RBAC, data integrity cho du lieu suc khoe va attendance

Khong dua vao MVP:
- AI nang cao
- Ecommerce day du
- GPS/QR anti-fraud check-in day du
- Dashboard thong ke nang cao
- 2FA day du
- Session device management day du

## 0. Assumptions

Nhung gia dinh nay duoc xem la dang active cho MVP. Neu 1 gia dinh bi vo, can cap nhat lai architecture, contracts va implementation plan truoc khi code tiep.

- A-001: MVP uu tien email/password va 1 social provider. Zalo co the defer neu integration cham hoac khong on dinh trong timeline 6 tuan.
- A-002: Membership activation trong MVP cho phep xac nhan thanh toan thu cong ngoai he thong; chua bat buoc payment gateway online.
- A-003: Notification manager trong MVP uu tien email + job retry. Zalo/Facebook la future hook, khong phai hard dependency de go-live.
- A-004: Check-in anti-fraud GPS/QR chua vao MVP; workout check-in hien tai duoc bao ve bang auth, branch scope, validation va audit.
- A-005: Member chi co 1 subscription active tai 1 thoi diem.
- A-006: Trainer roster MVP hien thi theo shift va branch; chua bat buoc room-level scheduling hoac PT ownership phuc tap.
- A-007: Health data truy cap theo least privilege; manager chi thay du lieu toi thieu phuc vu van hanh, khong mac dinh thay full body metrics lich su neu khong can.

## 1. Scope MVP

Functional scope trong MVP:
- AUTH-01, AUTH-02, AUTH-03, AUTH-04
- CRM-01, CRM-02, CRM-03
- TRIAL-01, TRIAL-02, TRIAL-05
- CHECK-01, CHECK-03, CHECK-04, CHECK-05, CHECK-06
- TRAIN-01
- BRANCH-01, BRANCH-02, BRANCH-03
- ADMIN-01, ADMIN-02, ADMIN-04, ADMIN-05

Non-functional scope trong MVP:
- SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
- PERF-01, PERF-02, PERF-04, PERF-05
- AVAIL-02, AVAIL-04
- SCALE-01, SCALE-03
- USE-01, USE-02
- MAINT-01, MAINT-02, MAINT-03, MAINT-04
- COMP-01, COMP-02

## 2. Kien truc tong the

Kien truc de xuat cho MVP:
- Frontend: 1 ung dung web responsive cho Guest, Member, Trainer, Manager, Admin
- Backend: 1 modular monolith API theo domain modules
- Database: PostgreSQL
- Cache: Redis cho rate limit, session/refresh token metadata, cache du lieu it doi
- Queue/Jobs: background job runner cho email, notification va backup hooks
- Object storage: luu avatar va tai lieu neu can
- Monitoring: Sentry + application logs tap trung
- Deployment: containerized app, 1 backend service + 1 frontend service + managed Postgres + managed Redis

Ly do chon modular monolith:
- Du nhanh cho MVP 6 tuan
- Giu boundaries ro rang de sau tach module thanh services neu can
- Giam overhead distributed systems, giam rui ro van hanh ban dau

## 2.1. Light ADRs

### ADR-01: Chon modular monolith thay vi microservices cho MVP
- Decision: Dung 1 backend modular monolith theo domain modules.
- Why now: Phu hop timeline 6 tuan, giam overhead deployment, tracing, transaction phan tan va incident handling.
- Alternatives considered: Microservices som; modulith + BFF rieng.
- Consequences: Can ky luat boundary module ro rang tu dau de tranh monolith bi roi.
- When to revisit: Khi co dau hieu team tang nhanh, release bottleneck theo module, hoac can scale/ownership tach biet ro.

### ADR-02: Chon PostgreSQL la source of truth
- Decision: Dung PostgreSQL cho du lieu nghiep vu, audit, attendance va subscriptions.
- Why now: Can transaction ro rang, consistency manh va query/constraint phu hop bai toan attendance + RBAC + audit.
- Alternatives considered: MongoDB; MySQL.
- Consequences: Phai giu schema va migrations chat che, nhung doi lai de dam bao data integrity tot hon.
- When to revisit: Khi xuat hien workload dac thu khong phu hop relational model hoac can analytics store rieng.

### ADR-03: Workout session la immutable sau khi tao
- Decision: Ban ghi buoi tap khong duoc sua/xoa nghiep vu sau khi xac nhan tao thanh cong; chi cho phep note/correction append-only.
- Why now: Bao ve auditability, tranh sai lech lich tap, chi so co the va sessions accounting.
- Alternatives considered: Update in place voi change history.
- Consequences: API va UI phai phan biet ro giua create moi va bo sung ghi chu/chinh sua co kiem soat.
- When to revisit: Khi nghiep vu doi hoi correction workflow phuc tap hon voi ly do va phe duyet.

### ADR-04: Branch-scoped RBAC thay vi tenant-per-db
- Decision: Dung RBAC ket hop branch scope trong cung 1 he co so du lieu.
- Why now: Don gian hoa MVP da chi nhanh ma van bao toan duoc boundary truy cap.
- Alternatives considered: Tenant-per-database; tenant-per-schema.
- Consequences: Can enforce branch filter chat o query/service layer va audit cac hanh dong cross-branch.
- When to revisit: Khi co yeu cau enterprise isolation cao hon hoac compliance bat buoc tach vat ly.

### ADR-05: Notification manager uu tien email trong MVP
- Decision: Trial notifications va ops notifications trong MVP di qua email provider + job retry.
- Why now: Giam phu thuoc vao social/chat API o dot dau.
- Alternatives considered: Zalo OA, Facebook Messaging ngay trong MVP.
- Consequences: Can giu provider adapter boundary de mo rong sau.
- When to revisit: Khi ti le response trial booking hoac operational SLA can kenh realtime hon.

## 3. So do thanh phan

```text
[Web Client]
   |
   v
[Frontend App]
   |
   v
[Backend API - Modular Monolith]
   |-- Auth & Identity Module
   |-- User/Profile Module
   |-- Branch & Access Scope Module
   |-- Membership Module
   |-- Trial Booking Module
   |-- Workout Check-in Module
   |-- Trainer Operations Module
   |-- Admin Module
   |-- Notification Module
   |-- Audit Log Module
   |
   |--> PostgreSQL
   |--> Redis
   |--> Object Storage
   |--> Email Provider
   |--> Monitoring / Logging
```

## 4. Actors va quyen MVP

### Guest
- Dang ky, dang nhap, quen mat khau
- Xem goi tap
- Tao trial booking
- Cap nhat thong tin ca nhan co ban

### Member
- Co tat ca quyen cua guest o pham vi cho phep
- Xem thong tin goi tap hien tai
- Tao workout check-in
- Xem lich tap va chi tiet buoi tap da luu

### Trainer
- Xem danh sach hoc vien da check-in theo ca duoc gan
- Xem thong tin can thiet cua hoc vien trong pham vi ca/chi nhanh duoc phan cong

### Manager
- Xem du lieu trong chi nhanh duoc phan cong
- Xac nhan nang cap guest thanh member
- Quan ly trial bookings cua chi nhanh
- Xem danh sach hoc vien/HLV trong chi nhanh

### Admin
- Quan ly user
- Quan ly goi tap
- Quan ly chi nhanh va phan cong manager
- Xem audit logs
- Cau hinh backup va van hanh he thong o muc co ban

## 5. Bounded contexts trong MVP

### 5.1 Identity and Access
Trach nhiem:
- Dang ky, dang nhap, quen mat khau
- Password hashing
- Social account linking o muc MVP-co-ban
- RBAC va branch scope
- Issue access token va refresh token

Entities chinh:
- User
- Credential
- SocialAuthAccount
- RoleAssignment
- RefreshSession
- PasswordResetToken

### 5.2 Branch Management
Trach nhiem:
- Quan ly chi nhanh
- Phan cong manager theo chi nhanh
- Scope truy cap theo chi nhanh

Entities chinh:
- Branch
- BranchManagerAssignment
- BranchStaffAssignment

### 5.3 Membership
Trach nhiem:
- Ho so member
- Goi tap
- Trang thai guest/member
- Nang cap thanh vien sau xac nhan thanh toan thu cong

Entities chinh:
- MemberProfile
- MembershipPlan
- Subscription
- SubscriptionStatusHistory

### 5.4 Trial Booking
Trach nhiem:
- Dang ky tap thu
- Gan chi nhanh
- Tao notification den manager
- Chuyen doi sang member

Entities chinh:
- TrialBooking
- TrialStatusHistory
- TrialNotificationLog

### 5.5 Workout Attendance
Trach nhiem:
- Tao workout check-in immutable
- Ghi body metrics
- Cap nhat so buoi da tap/con lai
- Cung cap lich tap va chi tiet ngay tap

Entities chinh:
- WorkoutSession
- BodyMeasurement
- AttendanceCounter
- WorkoutNote

### 5.6 Trainer Operations
Trach nhiem:
- Xem hoc vien da check-in theo ca
- Hien thi theo chi nhanh va ca duoc phan cong

Entities chinh:
- TrainerAssignment
- Shift
- SessionRosterView

### 5.7 Admin and Audit
Trach nhiem:
- Quan ly nguoi dung
- Quan ly goi tap
- Ghi audit va security logs
- Backup metadata va recovery procedures

Entities chinh:
- AuditLog
- SecurityEvent
- BackupRecord
- SystemConfig

### 5.8 AI Nutrition & Meal Planning (Phase 2)
Trach nhiem:
- Generate daily meal plans dua tren weight metrics va nutrition goals
- Luu tru meal plans da generate va consumption logs
- Track nutrition preferences va dietary restrictions
- Cung cap AI-generated recommendations voi guardrails ro rang

Entities chinh:
- MemberNutritionGoals
- DailyMealPlan
- Meal
- MealItem
- Recipe
- RecipeIngredient
- MealConsumptionLog
- AIMealGenerationLog

Loai context:
- Supporting AI-powered context (Phase 2)

Aggregate roots de xuat:
- DailyMealPlan
- MemberNutritionGoals

Khong bao gom:
- Medical advice hoac prescription diets
- Real-time calorie tracking integration voi wearable devices
- Advanced meal planning algorithms (deferred to Phase 3)

## 5.9. Context interaction map

```text
Identity and Access
  -> cung cap auth context + role/branch scope cho moi context khac

Trial Booking
  -> phat sinh notification request sang Notification
  -> khi convert thanh cong thi goi Membership
  -> ghi audit event sang Admin and Audit

Membership
  -> xac nhan subscription active cho Workout Attendance
  -> cap nhat role/member state thong qua Identity and Access neu can
  -> ghi status history va audit event

Workout Attendance
  -> doc subscription state tu Membership
  -> tao workout session + body metrics
  -> cung cap roster data cho Trainer Operations
  -> ghi audit/security events sang Admin and Audit

Trainer Operations
  -> doc roster projection tu Workout Attendance
  -> enforce branch/shift scope tu Identity and Access + Branch Management

Branch Management
  -> cung cap branch scope, branch metadata, manager assignment cho Membership, Trial Booking, Trainer Operations

Admin and Audit
  -> nhan audit/security events tu Identity, Membership, Trial Booking, Workout Attendance, Admin actions, AI Nutrition

AI Nutrition & Meal Planning
  -> doc weight metrics va body measurements tu Workout Attendance
  -> doc nutrition goals tu MemberNutritionGoals
  -> goi external LLM API de generate meal plans
  -> ghi AI generation logs va audit events sang Admin and Audit
  -> cung cap meal plan data cho frontend member area
```

Kieu tuong tac MVP:
- Uu tien synchronous service calls trong cung modular monolith cho validation nghiep vu cot loi.
- Dung background jobs cho email/notification va backup hooks.
- Chua dua event bus phan tan vao MVP.

## 6. Data flow chinh

### 6.1 Signup / Login
1. User dang ky bang email/password hoac social login
2. Backend tao `User` va `Profile`
3. Password duoc hash bang Argon2id
4. He thong gui email verification
5. Khi dang nhap thanh cong, backend tra access token ngan han + refresh token
6. Role va branch scope duoc nhung vao claims hoac tai qua auth context

### 6.2 Trial booking
1. Guest chon goi tap thu, chi nhanh, ngay gio
2. Backend tao `TrialBooking`
3. Backend ghi audit event
4. Notification job gui thong bao toi manager chi nhanh qua email
5. Manager xem danh sach trial bookings cho chi nhanh cua minh

### 6.3 Guest -> Member conversion
1. Guest den tap thu va thanh toan thu cong ngoai he thong
2. Manager xac nhan tren he thong
3. Backend tao hoac cap nhat `Subscription`
4. Role cua user duoc nang cap thanh `Member`
5. He thong ghi `SubscriptionStatusHistory` va audit log

### 6.4 Workout check-in
1. Member dang nhap va chon chi nhanh
2. Member chon ca tap
3. Member nhap day du body metrics bat buoc
4. Backend validate subscription dang active va con buoi
5. Backend tao `WorkoutSession` immutable + `BodyMeasurement`
6. Backend cap nhat `AttendanceCounter` va so buoi con lai trong transaction
7. Trainer xem roster theo ca dua tren du lieu check-in da xac nhan

## 7. Database architecture MVP

Cong nghe de xuat:
- PostgreSQL 15+
- UUID primary keys
- Timestamp co timezone
- Soft delete chi ap dung cho mot so bang quan ly; khong ap dung cho workout session immutable

### 7.1 Bang cot loi

#### users
- id
- email
- phone_number
- password_hash
- auth_provider_primary
- status
- email_verified_at
- created_at
- updated_at

#### profiles
- user_id
- full_name
- date_of_birth
- gender
- avatar_url
- address
- emergency_contact
- health_notes_basic

#### roles
- id
- code
- name

#### user_role_assignments
- id
- user_id
- role_id
- branch_id nullable
- assigned_by
- assigned_at

#### social_auth_accounts
- id
- user_id
- provider
- provider_user_id
- email_from_provider
- created_at

#### branches
- id
- code
- name
- address
- phone_number
- open_hours_json
- status

#### branch_manager_assignments
- id
- branch_id
- manager_user_id
- active_from
- active_to

#### membership_plans
- id
- code
- name
- price
- duration_days
- total_sessions
- benefits_json
- is_active

#### subscriptions
- id
- user_id
- membership_plan_id
- home_branch_id
- status
- started_at
- expires_at
- total_sessions
- sessions_used
- sessions_remaining
- activated_by
- activated_at

#### subscription_status_history
- id
- subscription_id
- from_status
- to_status
- changed_by
- reason
- created_at

#### trial_bookings
- id
- guest_user_id nullable
- full_name
- phone_number
- email
- branch_id
- trial_plan_name
- scheduled_at
- status
- notes
- created_at

#### trial_status_history
- id
- trial_booking_id
- from_status
- to_status
- changed_by
- created_at

#### trainer_assignments
- id
- trainer_user_id
- branch_id
- shift_code
- active_from
- active_to

#### workout_sessions
- id
- user_id
- subscription_id
- branch_id
- shift_code
- session_date
- check_in_at
- immutable_status
- note_append_only
- created_by
- created_at

#### body_measurements
- id
- workout_session_id
- weight_kg
- body_fat_percent
- muscle_percent
- water_percent
- waist_cm nullable
- hip_cm nullable
- recorded_at

#### audit_logs
- id
- actor_user_id nullable
- action_code
- entity_type
- entity_id
- branch_id nullable
- metadata_json
- ip_address
- user_agent
- created_at

#### security_events
- id
- user_id nullable
- event_type
- severity
- metadata_json
- created_at

#### backup_records
- id
- backup_type
- provider_ref
- started_at
- completed_at
- status

### 7.2 Rang buoc du lieu quan trong
- `users.email` unique neu co
- `(provider, provider_user_id)` unique trong `social_auth_accounts`
- 1 check-in duy nhat cho 1 user trong 1 branch + 1 shift + 1 session_date
- `subscriptions.sessions_remaining >= 0`
- `workout_sessions` khong cho update cac cot nghiep vu sau khi da tao, ngoai `note_append_only`

### 7.3 Chien luoc transaction
Dac biet cho workout check-in:
- Bat transaction database
- Khoa subscription row bang `SELECT ... FOR UPDATE`
- Kiem tra subscription active va con buoi
- Insert workout session
- Insert body measurement
- Update sessions_used / sessions_remaining
- Commit

Muc tieu:
- Dam bao 100+ check-in dong thoi khong bi am so buoi
- Tranh duplicate attendance

### 7.4 Revisit triggers cho data model
- Xem lai model `subscriptions` neu business cho phep 1 member co nhieu goi active cung luc.
- Xem lai `trainer_assignments` neu can room-level scheduling, PT ownership hoac recurring calendar phuc tap.
- Xem lai `workout_sessions` correction pattern neu nghiep vu doi hoi approved adjustment records thay vi note append-only.
- Xem lai storage separation cho health metrics neu compliance/noi bo yeu cau masking/manh hoa chi tiet hon.

## 8. API architecture MVP

Pattern de xuat:
- REST API
- JSON request/response
- OpenAPI/Swagger ngay tu dau
- Versioning qua `/api/v1`

### 8.1 Auth APIs
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/social-login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/logout`

### 8.2 Profile and Membership APIs
- `GET /api/v1/me`
- `PATCH /api/v1/me/profile`
- `GET /api/v1/membership-plans`
- `GET /api/v1/me/subscription`
- `POST /api/v1/manager/memberships/activate`

### 8.3 Trial APIs
- `POST /api/v1/trials`
- `GET /api/v1/manager/trials`
- `PATCH /api/v1/manager/trials/{id}/status`
- `POST /api/v1/manager/trials/{id}/convert`

### 8.4 Workout APIs
- `POST /api/v1/member/workout-sessions`
- `GET /api/v1/member/workout-calendar`
- `GET /api/v1/member/workout-sessions/{id}`

### 8.5 Trainer APIs
- `GET /api/v1/trainer/shifts/{shiftCode}/roster`

### 8.6 Branch and Admin APIs
- `GET /api/v1/admin/branches`
- `POST /api/v1/admin/branches`
- `PATCH /api/v1/admin/branches/{id}`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/{id}/status`
- `GET /api/v1/admin/membership-plans`
- `POST /api/v1/admin/membership-plans`
- `PATCH /api/v1/admin/membership-plans/{id}`
- `GET /api/v1/admin/audit-logs`

### 8.7 API contracts can lam ro som

Ba API duoi day la business-critical, can duoc nang cap thanh contract day du truoc implementation.

#### `POST /api/v1/member/workout-sessions`
- Actor: Member co subscription active.
- Request bat buoc:
  - `branch_id`
  - `shift_code`
  - `session_date`
  - `body_measurements`: `weight_kg`, `body_fat_percent`, `muscle_percent`, `water_percent`
  - optional: `waist_cm`, `hip_cm`, `note`
- Validation:
  - subscription active, chua het han, `sessions_remaining > 0`
  - chi duoc check-in cho branch hop le theo nghiep vu
  - unique theo `user_id + branch_id + shift_code + session_date`
- Auth rules:
  - chi member chinh chu duoc tao check-in cho minh
- Audit events:
  - `workout_session_created`
  - `body_measurement_recorded`
- Error/status codes:
  - `201` tao thanh cong
  - `400` request khong hop le
  - `403` khong dung quyen/pham vi
  - `409` duplicate attendance
  - `422` subscription inactive/het buoi
- Concurrency note:
  - phai khoa subscription row va cap nhat session counters trong cung transaction

#### `POST /api/v1/manager/trials/{id}/convert`
- Actor: Manager cua branch duoc gan.
- Request bat buoc:
  - `membership_plan_id`
  - `home_branch_id`
  - `activation_notes` hoac `payment_confirmation_ref` neu co
- Validation:
  - trial booking ton tai, thuoc branch manager dang quan ly
  - trial chua duoc convert truoc do
  - membership plan dang active
- Auth rules:
  - manager chi convert trial trong branch cua minh
- Audit events:
  - `trial_converted_to_member`
  - `subscription_created`
  - `role_assignment_changed`
- Error/status codes:
  - `200` hoac `201` tuy cach model response
  - `403` cross-branch access
  - `404` khong tim thay trial
  - `409` trial da convert
- Idempotency note:
  - nen co guard tranh manager convert lap lai cung 1 trial

#### `POST /api/v1/manager/memberships/activate`
- Actor: Manager duoc gan branch.
- Request bat buoc:
  - `user_id`
  - `membership_plan_id`
  - `home_branch_id`
  - `activated_at` neu can back-office support, neu khong thi backend tu set
- Validation:
  - user ton tai
  - khong co subscription active xung dot
  - plan dang active
  - branch hop le voi manager
- Auth rules:
  - manager chi activate membership trong branch phu trach
- Audit events:
  - `membership_activated`
  - `subscription_status_changed`
- Error/status codes:
  - `201` thanh cong
  - `403` cross-branch access
  - `409` membership conflict
  - `422` invalid activation state

## 9. Frontend architecture MVP

Frontend structure de xuat:
- Public area: Home, Membership Plans, Trial Booking, Login/Register/Forgot Password
- Member area: Dashboard, Workout Calendar, Workout Check-in, Session Detail, Profile
- Trainer area: Shift Roster
- Manager area: Trial Management, Member Activation, Branch-scoped lists
- Admin area: Users, Plans, Branches, Audit Logs

Route guards:
- Public routes
- Authenticated routes
- Role-scoped routes
- Branch-scoped data fetch thong qua backend, khong trust frontend filters

UI principles:
- Mobile-first cho member workout flow
- Form ngan gon cho check-in
- Lich thang de xem attendance nhanh
- Trang tri toi gian, uu tien toc do va ro rang

## 10. Security architecture MVP

### 10.1 Authentication
- Password hash: Argon2id
- Access token ngan han: 15 phut
- Refresh token rotate dinh ky
- Email verification bat buoc truoc mot so thao tac nhay cam
- Social login duoc link theo email da verify hoac explicit linking flow

### 10.2 Authorization
- RBAC ket hop branch scoping
- Manager chi thay du lieu branch duoc gan
- Trainer chi thay roster o shift/branch duoc phan cong
- Admin co quyen toan he thong
- Health data chi user, trainer lien quan, manager theo pham vi nghiep vu toi thieu, va admin khi can audit/ops co kiem soat

### 10.3 API protection
- Rate limiting tren login, forgot password, refresh token, trial booking
- Input validation schema-based
- ORM/query builder an toan tranh SQL injection
- Output encoding + CSP co ban tranh XSS
- CSRF protection neu dung cookie-based auth; neu dung bearer token thi bo sung same-site va anti-replay cho refresh token flow

### 10.4 Audit and security logging
Bat buoc log:
- Dang nhap that bai/thanh cong
- Reset mat khau
- Thay doi role
- Guest -> Member conversion
- Tao workout check-in
- Sua trang thai user
- Tao/sua/xoa branch va membership plan

### 10.5 Data protection
- TLS cho moi traffic
- Ma hoa at-rest cho database va object storage
- Giam hien thi health data theo least privilege
- Khong luu raw card data

## 11. Performance va scalability strategy MVP

De dap ung muc tieu MVP:
- SSR hoac static optimization cho public pages de giu load nhanh
- Pagination cho danh sach admin/manager
- Index cho email, branch_id, user_id, session_date, shift_code, status
- Redis cho rate limit va cache membership plans/branch config
- Background jobs cho email va notification, tranh block request
- Doc/write pattern don gian, tranh premature microservices

Hot paths can toi uu ngay tu dau:
- Login
- Trial booking create
- Workout check-in create
- Trainer roster query
- Admin user search

## 12. Logging, monitoring, backup

Logging:
- Structured JSON logs
- Correlation ID cho moi request
- Muc log: info, warn, error, security

Monitoring:
- Sentry cho exception tracking
- Health endpoint cho app va dependencies
- Alert cho error rate, DB connection saturation, job queue failures

Backup:
- Backup Postgres hang ngay qua managed provider
- Luu toi thieu 30 ngay
- Ghi `backup_records` de theo doi lan backup
- Kiem tra restore drill dinh ky sau MVP hoac cuoi MVP

## 13. Compliance guidance cho MVP

Do he thong xu ly du lieu ca nhan va du lieu suc khoe:
- Thu thap toi thieu du lieu can thiet
- Tach basic profile va health metrics ro rang
- Han che truy cap health data theo vai tro va pham vi branch
- Co privacy notice va consent cho thu thap thong tin suc khoe
- Audit cac thao tac xem/sua du lieu nhay cam quan trong
- Chuan bi quy trinh xu ly yeu cau truy cap/chinh sua du lieu ca nhan

## 14. Deployment topology MVP

Moi truong toi thieu:
- 1 frontend web app
- 1 backend API app
- 1 managed PostgreSQL
- 1 managed Redis
- 1 object storage bucket
- 1 email provider
- 1 monitoring stack

Environment separation:
- dev
- staging
- production

CI/CD:
- lint
- unit tests
- migration check
- build
- deploy staging
- smoke tests
- deploy production co approval

## 14.1 Future extension hooks

Nhung hook nay khong nam trong MVP baseline, nhung nen duoc giu boundary tu dau de sau nay mo rong ma khong dap vo core.

- Auth provider adapter:
  - Them Zalo hoac provider khac ma khong doi lai core identity model.
- Notification provider adapter:
  - Them Zalo/Facebook/WhatsApp sau email provider.
- Check-in verification adapter:
  - Them GPS/QR anti-fraud o layer validation/verification rieng.
- AI context service boundary:
  - Sau nay co the them AI FAQ/RAG va wellness guidance ma khong tron vao core membership/workout modules.
- Commerce module boundary:
  - Danh rieng cho products/orders/payments neu Phase 2 kick in.
- Analytics/read-model boundary:
  - Tach dashboard/statistics ra read models/materialized projections khi can.

## 15. Rui ro chinh va giam thieu

### Rui ro 1: MVP bi over-scope
Giam thieu:
- Khong dua ecommerce va AI nang cao vao dot dau
- Dung modular monolith thay vi microservices

### Rui ro 2: Loi data integrity trong check-in
Giam thieu:
- Transaction + row lock
- Unique constraints
- Immutable session records

### Rui ro 3: Lo du lieu suc khoe
Giam thieu:
- RBAC + branch scope + audit
- Encryption at rest
- Masking du lieu o man hinh khong can day du

### Rui ro 4: Tich hop social auth/Zalo cham
Giam thieu:
- Uu tien email/password + 1 social provider o MVP neu can
- Thiet ke adapter cho auth providers

### Rui ro 5: Notification den manager khong on dinh
Giam thieu:
- MVP uu tien email provider + job retry
- Zalo/Facebook de Phase 2

## 15.1 Revisit triggers

Nhung dau hieu sau la trigger de xem lai kien truc, contracts hoac scope:

- Auth provider roadmap doi, bat buoc co Zalo trong MVP.
- Business cho phep nhieu subscription active cho 1 member.
- Trial volume tang den muc email notification khong dap ung SLA.
- Can room-based scheduling, trainer ownership hoac roster phuc tap hon shift-level view.
- Compliance/noi bo bat buoc tach quyen xem health data chi tiet chat hon hien tai.
- Check-in abuse tang, can dua GPS/QR anti-fraud vao Phase 2 som.
- Team/backend throughput khong con phu hop voi modular monolith.

## 16. Kien nghi cong nghe cu the

Neu can stack cu the de khoi dong nhanh:
- Frontend: Next.js
- Backend: NestJS hoac ASP.NET Core
- ORM: Prisma hoac EF Core
- Database: PostgreSQL
- Cache: Redis
- Auth: JWT access + refresh token rotation
- Validation: Zod / FluentValidation / class-validator
- Observability: Sentry + structured logs

Neu doi uu tien la toc do giao MVP:
- Chon 1 stack team da quen
- Khong doi cong nghe vi trend
- Dat thang boundaries module, migrations, auth, audit va tests tu dau
