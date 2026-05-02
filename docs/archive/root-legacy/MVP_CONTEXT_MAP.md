# MYFIT MVP Context Map

Tai lieu nay tach rieng context map cho MVP de cac phase sau co the dung lai khi thiet ke data model, security va API contracts.

Nguon goc:
- [SYSTEM_ARCHITECTURE_MVP.md](C:/Users/HKN/MYFIT-/SYSTEM_ARCHITECTURE_MVP.md)
- Section `5. Bounded contexts trong MVP`
- Section `5.8. Context interaction map`

## 1. Muc tieu

- Xac dinh boundary ro rang giua cac context
- Giam viec 1 module om qua nhieu trach nhiem
- Lam nen cho implementation theo modular monolith
- Tao diem tham chieu de review scope creep

## 2. Context catalog

### 2.1 Identity and Access

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

Loai context:
- Core supporting context cho toan he thong

Aggregate roots de xuat:
- User
- RefreshSession
- PasswordResetToken

Khong bao gom:
- Membership lifecycle
- Trainer roster
- Trial conversion business logic

### 2.2 Branch Management

Trach nhiem:
- Quan ly chi nhanh
- Phan cong manager theo chi nhanh
- Scope truy cap theo chi nhanh

Entities chinh:
- Branch
- BranchManagerAssignment
- BranchStaffAssignment

Loai context:
- Supporting context

Aggregate roots de xuat:
- Branch
- BranchManagerAssignment

Khong bao gom:
- Attendance records
- Membership accounting

### 2.3 Membership

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

Loai context:
- Core business context

Aggregate roots de xuat:
- Subscription
- MembershipPlan
- MemberProfile

Khong bao gom:
- Trial scheduling chi tiet
- Workout session creation

### 2.4 Trial Booking

Trach nhiem:
- Dang ky tap thu
- Gan chi nhanh
- Tao notification den manager
- Chuyen doi sang member

Entities chinh:
- TrialBooking
- TrialStatusHistory
- TrialNotificationLog

Loai context:
- Core acquisition context

Aggregate roots de xuat:
- TrialBooking

Khong bao gom:
- Full membership accounting
- Trainer roster

### 2.5 Workout Attendance

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

Loai context:
- Core operations context

Aggregate roots de xuat:
- WorkoutSession
- AttendanceCounter

Khong bao gom:
- Membership plan pricing
- Trial conversion

### 2.6 Trainer Operations

Trach nhiem:
- Xem hoc vien da check-in theo ca
- Hien thi theo chi nhanh va ca duoc phan cong

Entities chinh:
- TrainerAssignment
- Shift
- SessionRosterView

Loai context:
- Supporting operations context

Aggregate roots de xuat:
- TrainerAssignment
- Shift

Khong bao gom:
- Tao workout session
- Sua membership

### 2.7 Admin and Audit

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

Loai context:
- Generic/supporting governance context

Aggregate roots de xuat:
- AuditLog
- SecurityEvent
- BackupRecord

Khong bao gom:
- Core member workout flow logic

### 2.8 AI Nutrition & Meal Planning (Phase 2)

Trach nhiem:
- Generate daily meal plans dua tren weight metrics va nutrition goals
- Luu tru meal plans da generate va consumption logs
- Track nutrition preferences va dietary restrictions
- Cung cap AI-generated recommendations voi guardrails ro rang
- Log AI API calls cho cost tracking va quality improvement

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

## 3. Context interaction map

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

AI Nutrition & Meal Planning (Phase 2)
  -> doc weight metrics va body measurements tu Workout Attendance context
  -> doc nutrition goals tu MemberNutritionGoals aggregate
  -> goi external LLM API de generate meal plans
  -> ghi AI generation logs va audit events sang Admin and Audit
  -> cung cap meal plan data cho frontend member area
```

## 4. Interaction rules

### 4.1 Synchronous interactions trong MVP

Uu tien synchronous service calls trong cung modular monolith cho:
- Membership validation truoc workout check-in
- Branch scope validation cho manager/trainer actions
- Role/scope resolution tu Identity and Access

### 4.2 Async/background interactions trong MVP

Dung background jobs cho:
- Email notifications
- Backup hooks
- Co the them retryable notification dispatch sau nay

### 4.3 Khong dua vao MVP

- Event bus phan tan
- Distributed saga orchestration
- Separate read-store rieng cho tung context

## 5. Integration contracts can khoa lai som

### 5.1 Trial Booking -> Membership

Command/business action:
- `convert_trial_to_member`

Input toi thieu:
- `trial_booking_id`
- `membership_plan_id`
- `home_branch_id`
- `manager_user_id`

Ket qua mong doi:
- Tao subscription moi
- Nang role/member state hop le
- Ghi audit event

### 5.2 Membership -> Workout Attendance

Validation contract:
- Subscription phai active
- Chua het han
- Con sessions remaining

Ket qua mong doi:
- Cho phep hoac tu choi tao workout session

### 5.3 Workout Attendance -> Trainer Operations

Read model/projection contract:
- Trainer roster doc du lieu check-in da tao thanh cong
- Scope theo branch + shift

Ket qua mong doi:
- Trainer khong can doc truc tiep business logic membership/trial

## 6. Boundary rules cho implementation

- Khong dat logic subscription accounting trong controller/frontend.
- Khong de Trainer Operations sua Workout Attendance records.
- Khong de Branch Management chua business rule workout sessions.
- Khong de Admin and Audit tro thanh noi chua logic nghiep vu cot loi.
- Neu can read-model cho roster, uu tien projection/noi suy trong cung backend thay vi de frontend tu join du lieu.

## 7. Review checkpoints

Truoc khi implement bat ky module nao, can kiem tra:
- Module do thuoc context nao?
- Aggregate root nao so huu rule nghiep vu?
- Co dang doc/sua xuyen boundary khong can thiet khong?
- Co emit audit event dung context khong?
- Co nho branch scope tu Identity/Branch Management khong?

## 8. Definition of done

Context map nay duoc xem la du dung cho MVP khi:
- Moi module implementation co the map ro vao 1 context chinh
- Khong con nham lan giua `Membership`, `Trial Booking`, `Workout Attendance`
- FE/BE va architecture review co cung 1 diem tham chieu ve boundary
