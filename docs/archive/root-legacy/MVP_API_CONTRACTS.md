# MYFIT MVP API Contracts

Tai lieu nay tach rieng API contracts business-critical cho MVP de frontend va backend co the implement doc lap ma khong tu dien giai lai scope.

Nguon goc:
- [SYSTEM_ARCHITECTURE_MVP.md](C:/Users/HKN/MYFIT-/SYSTEM_ARCHITECTURE_MVP.md)
- Section `8.7 API contracts can lam ro som`

Nguyen tac chung:
- REST API
- JSON request/response
- Versioning qua `/api/v1`
- Moi endpoint duoi day la contract uu tien cao, can duoc dong bang truoc implementation
- Bat ky thay doi nao vao contract phai cap nhat lai `SYSTEM_ARCHITECTURE_MVP.md` va `ASSUMPTIONS_AND_DECISIONS.md` neu anh huong den architecture/business rule

## 1. Contract conventions

### 1.1 Response envelope

Frontend va backend nen thong nhat 1 response envelope don gian cho MVP:

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
    "code": "SUBSCRIPTION_INACTIVE",
    "message": "Subscription is inactive"
  },
  "meta": {}
}
```

### 1.2 Common rules

- `Content-Type`: `application/json`
- Auth: `Bearer` access token
- Time format: ISO 8601 co timezone
- IDs: UUID string
- Moi endpoint manager phai enforce branch scope o backend, khong tin frontend filter
- Moi endpoint thay doi nghiep vu phai emit audit event

### 1.3 Error code catalog cho 3 contract critical

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `RESOURCE_NOT_FOUND`
- `DUPLICATE_ATTENDANCE`
- `SUBSCRIPTION_INACTIVE`
- `SUBSCRIPTION_CONFLICT`
- `TRIAL_ALREADY_CONVERTED`
- `CROSS_BRANCH_ACCESS`
- `SHIFT_NOT_FOUND`
- `SHIFT_ALREADY_STARTED`
- `SHIFT_ASSIGNMENT_EXISTS`
- `SHIFT_COACH_CAPACITY_REACHED`
- `SHIFT_REQUIRES_AT_LEAST_ONE_COACH`
- `COACH_NOT_ALLOWED_FOR_BRANCH`

## 2. POST /api/v1/member/workout-sessions

### 2.1 Muc dich

Tao 1 workout session immutable cho member va dong thoi ghi body measurements, cap nhat attendance counters trong cung transaction.

### 2.2 Actor

- `Member`

### 2.3 Authorization rules

- Chi member dang dang nhap duoc tao check-in cho chinh minh.
- Member phai co subscription active hop le.
- Backend phai validate branch theo rule nghiep vu duoc cho phep.

### 2.4 Request schema

```json
{
  "branch_id": "uuid",
  "shift_code": "MORNING_1",
  "session_date": "2026-03-27",
  "body_measurements": {
    "weight_kg": 72.5,
    "body_fat_percent": 18.2,
    "muscle_percent": 41.1,
    "water_percent": 55.3,
    "waist_cm": 82,
    "hip_cm": 95
  },
  "note": "optional string"
}
```

### 2.5 Field validation

- `branch_id`: bat buoc, phai ton tai.
- `shift_code`: bat buoc, thuoc danh sach shift hop le.
- `session_date`: bat buoc, dinh dang ngay hop le.
- `body_measurements.weight_kg`: bat buoc, so duong.
- `body_measurements.body_fat_percent`: bat buoc, so hop le theo range domain.
- `body_measurements.muscle_percent`: bat buoc, so hop le theo range domain.
- `body_measurements.water_percent`: bat buoc, so hop le theo range domain.
- `body_measurements.waist_cm`: optional, neu co phai la so duong.
- `body_measurements.hip_cm`: optional, neu co phai la so duong.
- `note`: optional, chuoi ngan, khong dung de sua body metrics da ghi.

### 2.6 Business validations

- Subscription active, chua het han, `sessions_remaining > 0`.
- Khong ton tai workout session trung `user_id + branch_id + shift_code + session_date`.
- Session phai duoc tao trong 1 database transaction voi update counters.

### 2.7 Success response

Status: `201 Created`

```json
{
  "data": {
    "workout_session_id": "uuid",
    "user_id": "uuid",
    "subscription_id": "uuid",
    "branch_id": "uuid",
    "shift_code": "MORNING_1",
    "session_date": "2026-03-27",
    "check_in_at": "2026-03-27T08:15:00+07:00",
    "body_measurements": {
      "weight_kg": 72.5,
      "body_fat_percent": 18.2,
      "muscle_percent": 41.1,
      "water_percent": 55.3,
      "waist_cm": 82,
      "hip_cm": 95
    },
    "attendance_counter": {
      "sessions_used": 5,
      "sessions_remaining": 19
    }
  },
  "error": null,
  "meta": {}
}
```

### 2.8 Error responses

- `400 Bad Request`
  - `VALIDATION_ERROR`
- `403 Forbidden`
  - `FORBIDDEN`
- `409 Conflict`
  - `DUPLICATE_ATTENDANCE`
- `422 Unprocessable Entity`
  - `SUBSCRIPTION_INACTIVE`

### 2.9 Audit events

- `workout_session_created`
- `body_measurement_recorded`

### 2.10 Concurrency/idempotency notes

- Backend phai `SELECT ... FOR UPDATE` tren row subscription truoc khi insert session.
- Duplicate attendance phai bi chan o ca 2 tang:
  - unique constraint
  - service validation

## 3. POST /api/v1/manager/trials/{id}/convert

### 3.1 Muc dich

Chuyen 1 trial booking thanh member/subscription sau khi manager xac nhan trial hop le va thanh toan thu cong da duoc xu ly ngoai he thong.

### 3.2 Actor

- `Manager`

### 3.3 Authorization rules

- Manager chi convert trial trong branch cua minh.
- Backend phai enforce branch scope, khong dua vao filter tu client.

### 3.4 Request schema

```json
{
  "membership_plan_id": "uuid",
  "home_branch_id": "uuid",
  "activation_notes": "optional string",
  "payment_confirmation_ref": "optional string"
}
```

### 3.5 Field validation

- `membership_plan_id`: bat buoc, phai ton tai, dang active.
- `home_branch_id`: bat buoc, phai thuoc branch manager dang quan ly.
- `activation_notes`: optional, chuoi ngan.
- `payment_confirmation_ref`: optional, chuoi tham chieu cho quy trinh back-office.

### 3.6 Business validations

- Trial booking ton tai.
- Trial booking thuoc branch manager dang quan ly.
- Trial booking chua duoc convert truoc do.
- Membership plan dang active.
- User/member target hop le de nang cap.

### 3.7 Success response

Status: `201 Created` hoac `200 OK` tuy cach team chot convention.

```json
{
  "data": {
    "trial_booking_id": "uuid",
    "subscription_id": "uuid",
    "user_id": "uuid",
    "membership_plan_id": "uuid",
    "home_branch_id": "uuid",
    "role": "MEMBER",
    "status": "ACTIVE"
  },
  "error": null,
  "meta": {}
}
```

### 3.8 Error responses

- `403 Forbidden`
  - `CROSS_BRANCH_ACCESS`
- `404 Not Found`
  - `RESOURCE_NOT_FOUND`
- `409 Conflict`
  - `TRIAL_ALREADY_CONVERTED`
- `422 Unprocessable Entity`
  - `VALIDATION_ERROR`

### 3.9 Audit events

- `trial_converted_to_member`
- `subscription_created`
- `role_assignment_changed`

### 3.10 Idempotency notes

- Trial conversion phai co guard tranh convert lap lai.
- Neu request bi gui lai, backend phai tra conflict hoac idempotent success theo convention team chot, nhung khong duoc tao them subscription moi.

## 4. POST /api/v1/manager/memberships/activate

### 4.1 Muc dich

Tao va activate membership cho 1 user trong branch manager phu trach.

### 4.2 Actor

- `Manager`

### 4.3 Authorization rules

- Manager chi duoc activate membership trong branch duoc gan.
- Backend phai validate role + branch scope.

### 4.4 Request schema

```json
{
  "user_id": "uuid",
  "membership_plan_id": "uuid",
  "home_branch_id": "uuid",
  "activated_at": "2026-03-27T10:00:00+07:00"
}
```

### 4.5 Field validation

- `user_id`: bat buoc, phai ton tai.
- `membership_plan_id`: bat buoc, phai ton tai, dang active.
- `home_branch_id`: bat buoc, thuoc branch manager phu trach.
- `activated_at`: optional neu backend tu set; neu client gui thi phai la ISO 8601 hop le.

### 4.6 Business validations

- User ton tai va o trang thai hop le de activate membership.
- Khong co subscription active xung dot.
- Membership plan dang active.
- Home branch hop le voi manager.

### 4.7 Success response

Status: `201 Created`

```json
{
  "data": {
    "subscription_id": "uuid",
    "user_id": "uuid",
    "membership_plan_id": "uuid",
    "home_branch_id": "uuid",
    "status": "ACTIVE",
    "activated_at": "2026-03-27T10:00:00+07:00"
  },
  "error": null,
  "meta": {}
}
```

### 4.8 Error responses

- `403 Forbidden`
  - `CROSS_BRANCH_ACCESS`
- `409 Conflict`
  - `SUBSCRIPTION_CONFLICT`
- `422 Unprocessable Entity`
  - `VALIDATION_ERROR`

### 4.9 Audit events

- `membership_activated`
- `subscription_status_changed`

## 5. Backend implementation notes

- Validation schema nen duoc dong bo voi API contract nay, khong tu phat minh field ngoai contract.
- Moi service method cho 3 API critical phai co audit emission ro rang.
- Moi endpoint phai co test cho:
  - validation fail
  - branch scope fail
  - business conflict
  - happy path
- `POST /member/workout-sessions` phai co test concurrency.

## 6. Frontend integration notes

- Frontend chi duoc dua vao contract nay de tao form model va xu ly status/error states.
- Khong duoc tu giam nhe auth/branch rules trong UI roi xem nhu backend se xu ly sau.
- Cac state UI toi thieu can co:
  - loading
  - success
  - validation error
  - forbidden / cross-branch
  - duplicate/conflict
  - inactive subscription

## 7. Definition of done

Contract nay duoc xem la dong bang cho MVP khi:
- frontend co the tao request/response typings tu file nay
- backend co the viet validators va tests tu file nay
- 3 API critical khong con field mo ho hoac business rule xung dot voi `SYSTEM_ARCHITECTURE_MVP.md`

---

## 8. Coach (HLV) scheduling contracts

### 8.1 Muc dich

Cho phep HLV xem lich ca tap theo ngay va tu chon/huy ca day trong pham vi branch duoc phep, voi cac rang buoc:

- Moi ca (`shift`) toi da **3** HLV.
- Moi ca phai co **it nhat 1** HLV (toi thieu) tai moi thoi diem (khong cho huy neu se ve 0).
- Sau khi **qua thoi gian bat dau** cua ca (hoac qua thoi gian ket thuc, tuy convention team chot), HLV **khong duoc thay doi** (dang ky/huy) ca do.

> MVP default: khoa thay doi khi `now >= start_at` (bat dau ca).

### 8.2 Actor

- `Coach` (HLV)

### 8.3 Role va authorization rules (RBAC)

- User dang nhap phai co `role = COACH`.
- Coach chi duoc thao tac tren `branch_id` duoc gan/quyen truy cap (backend enforce, khong tin client).
- Khi coach thao tac tren shift, backend phai validate `shift.branch_id` thuoc branch coach duoc phep.

### 8.4 Shift definition (khung ca mac dinh)

1 ngay co 6 ca co dinh:

- Sang:
  - `MORNING_1`: 05:30-06:30
  - `MORNING_2`: 06:30-07:30
- Chieu:
  - `AFTERNOON_1`: 16:30-17:30
  - `AFTERNOON_2`: 17:30-18:30
- Toi:
  - `EVENING_1`: 18:30-19:30
  - `EVENING_2`: 19:30-20:30

`shift_code` duoc dung thong nhat cho member check-in va coach scheduling.

### 8.5 GET /api/v1/coach/shifts

#### 8.5.1 Muc dich

Lay danh sach ca theo ngay/branch de coach xem lich va trang thai phan bo HLV.

#### 8.5.2 Query params

- `branch_id` (required): uuid
- `date` (required): `YYYY-MM-DD` (local date theo timezone branch)

#### 8.5.3 Business rules

- Backend phai tra ve day du 6 ca mac dinh cua ngay (ke ca chua co HLV duoc assign).
- Moi ca can tra ve:
  - so luong HLV da assign
  - coach da assign cho ca do hay chua (is_assigned)
  - ca con trong capacity hay khong (is_full)
  - ca da bi khoa thay doi hay chua (is_locked)

#### 8.5.4 Success response

Status: `200 OK`

```json
{
  "data": {
    "branch_id": "uuid",
    "date": "2026-04-24",
    "timezone": "Asia/Ho_Chi_Minh",
    "shifts": [
      {
        "shift_id": "uuid",
        "shift_code": "MORNING_1",
        "start_at": "2026-04-24T05:30:00+07:00",
        "end_at": "2026-04-24T06:30:00+07:00",
        "coach_capacity": 3,
        "coach_count": 2,
        "is_full": false,
        "is_locked": false,
        "is_assigned": true
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

#### 8.5.5 Error responses

- `400 Bad Request`
  - `VALIDATION_ERROR`
- `403 Forbidden`
  - `COACH_NOT_ALLOWED_FOR_BRANCH`

### 8.6 POST /api/v1/coach/shifts/{shift_id}/assign

#### 8.6.1 Muc dich

Coach dang ky day 1 ca.

#### 8.6.2 Authorization rules

- Chi `COACH` duoc goi.
- Branch scope enforced.

#### 8.6.3 Request schema

Body rong (MVP) hoac cho phep ghi chu:

```json
{
  "note": "optional string"
}
```

#### 8.6.4 Business validations

- `shift_id` ton tai (`SHIFT_NOT_FOUND` neu khong).
- Coach duoc phep trong branch cua shift (`COACH_NOT_ALLOWED_FOR_BRANCH` neu khong).
- Khoa thay doi neu `now >= shift.start_at` (`SHIFT_ALREADY_STARTED`).
- Coach khong duoc assign trung lap (`SHIFT_ASSIGNMENT_EXISTS`).
- Ca toi da 3 coach:
  - Neu `coach_count >= 3` thi reject (`SHIFT_COACH_CAPACITY_REACHED`).
- Phai co concurrency guard o DB (unique + transaction) de tranh vuot capacity khi nhieu coach chon cung luc.

#### 8.6.5 Success response

Status: `201 Created`

```json
{
  "data": {
    "shift_id": "uuid",
    "coach_id": "uuid",
    "assigned_at": "2026-04-24T10:05:00+07:00",
    "coach_count": 3,
    "coach_capacity": 3,
    "is_full": true
  },
  "error": null,
  "meta": {}
}
```

#### 8.6.6 Error responses

- `400 Bad Request`
  - `VALIDATION_ERROR`
- `403 Forbidden`
  - `COACH_NOT_ALLOWED_FOR_BRANCH`
- `404 Not Found`
  - `SHIFT_NOT_FOUND`
- `409 Conflict`
  - `SHIFT_ASSIGNMENT_EXISTS`
  - `SHIFT_COACH_CAPACITY_REACHED`
- `422 Unprocessable Entity`
  - `SHIFT_ALREADY_STARTED`

#### 8.6.7 Audit events

- `coach_shift_assigned`

### 8.7 DELETE /api/v1/coach/shifts/{shift_id}/assign

#### 8.7.1 Muc dich

Coach huy dang ky day 1 ca.

#### 8.7.2 Business validations

- `shift_id` ton tai (`SHIFT_NOT_FOUND` neu khong).
- Coach duoc phep trong branch cua shift (`COACH_NOT_ALLOWED_FOR_BRANCH`).
- Khoa thay doi neu `now >= shift.start_at` (`SHIFT_ALREADY_STARTED`).
- Coach phai dang assigned vao ca do, neu khong thi tra `404` (MVP don gian) hoac `200` idempotent (team chot).
- Moi ca phai co it nhat 1 coach:
  - Neu coach hien tai dang la nguoi cuoi cung (coach_count == 1) thi reject (`SHIFT_REQUIRES_AT_LEAST_ONE_COACH`).

#### 8.7.3 Success response

Status: `200 OK`

```json
{
  "data": {
    "shift_id": "uuid",
    "coach_id": "uuid",
    "unassigned_at": "2026-04-24T10:10:00+07:00",
    "coach_count": 2,
    "coach_capacity": 3,
    "is_full": false
  },
  "error": null,
  "meta": {}
}
```

#### 8.7.4 Error responses

- `403 Forbidden`
  - `COACH_NOT_ALLOWED_FOR_BRANCH`
- `404 Not Found`
  - `SHIFT_NOT_FOUND`
- `409 Conflict`
  - `SHIFT_REQUIRES_AT_LEAST_ONE_COACH`
- `422 Unprocessable Entity`
  - `SHIFT_ALREADY_STARTED`

#### 8.7.5 Audit events

- `coach_shift_unassigned`

---

## 9. AI Nutrition & Meal Planning APIs (Phase 2)

### 9.1 GET /api/v1/member/nutrition/goals

#### 9.1.1 Muc dich
Lay nutrition goals va preferences cua member hien tai.

#### 9.1.2 Actor
- `Member`

#### 9.1.3 Authorization rules
- Chi member dang dang nhap duoc xem goals cua chinh minh.

#### 9.1.4 Success response
Status: `200 OK`

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "daily_calories_target": 2200,
    "protein_grams_target": 165.0,
    "carbs_grams_target": 247.5,
    "fat_grams_target": 73.3,
    "dietary_restrictions": ["vegetarian"],
    "allergies": ["peanuts"],
    "preferences": {
      "cuisine_types": ["asian", "mediterranean"],
      "avoid_ingredients": ["mushrooms"]
    },
    "goal_type": "muscle_gain",
    "activity_level": "moderately_active"
  },
  "error": null,
  "meta": {}
}
```

#### 9.1.5 Error responses
- `404 Not Found` - Neu user chua set nutrition goals

### 9.2 POST /api/v1/member/nutrition/goals

#### 9.2.1 Muc dich
Tao hoac cap nhat nutrition goals va preferences.

#### 9.2.2 Request schema

```json
{
  "daily_calories_target": 2200,
  "protein_grams_target": 165.0,
  "carbs_grams_target": 247.5,
  "fat_grams_target": 73.3,
  "dietary_restrictions": ["vegetarian"],
  "allergies": ["peanuts"],
  "preferences": {
    "cuisine_types": ["asian", "mediterranean"],
    "avoid_ingredients": ["mushrooms"]
  },
  "goal_type": "muscle_gain",
  "activity_level": "moderately_active"
}
```

#### 9.2.3 Field validation
- `daily_calories_target`: bat buoc, integer > 0, range 1200-5000
- `protein_grams_target`: bat buoc, numeric > 0
- `carbs_grams_target`: bat buoc, numeric > 0
- `fat_grams_target`: bat buoc, numeric > 0
- `goal_type`: bat buoc, enum ['weight_loss', 'muscle_gain', 'maintenance', 'athletic_performance']
- `activity_level`: bat buoc, enum ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']

#### 9.2.4 Success response
Status: `201 Created` hoac `200 OK` (upsert)

### 9.3 GET /api/v1/member/meal-plans/today

#### 9.3.1 Muc dich
Lay meal plan cho ngay hom nay. Neu chua co, tra ve empty.

#### 9.3.2 Actor
- `Member`

#### 9.3.3 Success response
Status: `200 OK`

```json
{
  "data": {
    "id": "uuid",
    "plan_date": "2026-04-24",
    "total_calories": 2180,
    "total_protein": 163.5,
    "total_carbs": 245.0,
    "total_fat": 72.8,
    "status": "approved",
    "meals": [
      {
        "id": "uuid",
        "meal_type": "breakfast",
        "meal_name": "Oatmeal with Berries and Almonds",
        "calories": 450,
        "protein": 15.2,
        "carbs": 68.5,
        "fat": 12.3,
        "preparation_time_minutes": 10,
        "items": [
          {
            "item_name": "Rolled oats",
            "quantity": 80,
            "unit": "g",
            "calories": 300,
            "protein": 10.0,
            "carbs": 54.0,
            "fat": 5.0
          }
        ]
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

### 9.4 POST /api/v1/member/meal-plans/generate

#### 9.4.1 Muc dich
Trigger AI generate meal plan cho ngay chi dinh (mac dinh la today). Chi generate neu chua ton tai plan cho ngay do.

#### 9.4.2 Request schema

```json
{
  "plan_date": "2026-04-24",
  "force_regenerate": false
}
```

#### 9.4.3 Business validations
- User phai co nutrition goals da set.
- Neu `force_regenerate = false` va plan da ton tai, return existing plan hoac error.
- Backend phai:
  1. Lay weight metrics gan nhat tu workout check-in
  2. Lay nutrition goals
  3. Goi external LLM API voi prompt structured
  4. Parse response va luu daily_meal_plan + meals + meal_items
  5. Ghi ai_meal_generation_log
  6. Emit audit event

#### 9.4.4 Success response
Status: `201 Created`

```json
{
  "data": {
    "daily_meal_plan_id": "uuid",
    "plan_date": "2026-04-24",
    "status": "draft",
    "generation_duration_ms": 3200,
    "ai_model": "gpt-4-turbo"
  },
  "error": null,
  "meta": {}
}
```

#### 9.4.5 Error responses
- `422 Unprocessable Entity` - Neu user chua set nutrition goals
- `409 Conflict` - Neu plan da ton tai va `force_regenerate = false`
- `502 Bad Gateway` - Neu external AI API fail

#### 9.4.6 Audit events
- `meal_plan_generated`
- `ai_api_call_logged`

### 9.5 PATCH /api/v1/member/meal-plans/{id}

#### 9.5.1 Muc dich
Cap nhat meal plan (edit meals, adjust portions) truoc khi approve.

#### 9.5.2 Business validations
- Chi edit duoc khi status = 'draft'
- Sau khi approve, khong sua duoc nua (immutable pattern giong workout sessions)

### 9.6 POST /api/v1/member/meal-consumption

#### 9.6.1 Muc dich
Log actual meal consumption (what user actually ate).

#### 9.6.2 Request schema

```json
{
  "meal_id": "uuid", // optional, null if custom meal
  "consumed_at": "2026-04-24T08:30:00+07:00",
  "actual_calories": 480,
  "actual_protein": 16.5,
  "actual_carbs": 70.2,
  "actual_fat": 13.1,
  "portion_multiplier": 1.05,
  "notes": "Added extra honey"
}
```

#### 9.6.3 Success response
Status: `201 Created`

### 9.7 GET /api/v1/member/nutrition/analytics?start_date=&end_date=

#### 9.7.1 Muc dich
Xem nutrition analytics trong khoang thoi gian (calories consumed vs target, macro breakdown trends).

#### 9.7.2 Query params
- `start_date`: required, YYYY-MM-DD
- `end_date`: required, YYYY-MM-DD

#### 9.7.3 Success response
Status: `200 OK`

```json
{
  "data": {
    "period": {
      "start_date": "2026-04-17",
      "end_date": "2026-04-24"
    },
    "averages": {
      "daily_calories_consumed": 2150,
      "daily_calories_target": 2200,
      "adherence_percentage": 97.7,
      "avg_protein": 160.5,
      "avg_carbs": 242.3,
      "avg_fat": 71.8
    },
    "daily_logs": [
      {
        "date": "2026-04-24",
        "calories_consumed": 2180,
        "calories_target": 2200,
        "meals_logged": 4
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

### 9.8 GET /api/v1/admin/recipes

#### 9.8.1 Muc dich
Admin quan ly recipe database (CRUD recipes).

#### 9.8.2 Actor
- `Admin`

### 9.9 POST /api/v1/admin/recipes

#### 9.9.1 Muc dich
Them recipe moi vao database de AI co the reference.

### 9.10 POST /api/v1/member/meal-plans/{id}/feedback

#### 9.10.1 Muc dich
User danh gia meal plan sau khi consume (1-5 stars + comments).

#### 9.10.2 Request schema

```json
{
  "feedback_score": 4,
  "feedback_text": "Good variety but lunch was too heavy"
}
```

#### 9.10.3 Business validations
- Chi submit feedback khi status = 'consumed' hoac 'approved'
- Feedback duoc dung de improve future AI recommendations
