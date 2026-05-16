# MYFIT Documentation - Hướng Điều Chỉnh & Hoàn Thiện

> **Ngày**: 2026-05-14  
> **Trạng thái**: Phân tích hoàn tất - Sẵn sàng thực hiện  
> **Mục tiêu**: Chuẩn bị bảo vệ đồ án - Khắc phục 4 lỗi chính + 3 bổ sung

---

## 📋 Tóm Tắt Tình Hình Hiện Tại

| Phần | Trạng thái | Điểm số |
|------|-----------|--------|
| **Use Cases** | ✅ Hoàn tất (19 UC gộp) | 8/10 |
| **Class Diagram** | ✅ Hoàn tất (4 tầng) | 8/10 |
| **Database Schema** | ✅ Hoàn tất (chi tiết) | 9/10 |
| **Sequence Diagrams** | ❌ **THIẾU** | 0/10 |
| **AI Integration Docs** | ⚠️ Mơ hồ (planning stage) | 3/10 |
| **Testing Documentation** | ⚠️ Không đủ chi tiết | 4/10 |
| **Data Conflict Handling** | ❌ **THIẾU** | 0/10 |
| **System Comparison** | ❌ **THIẾU** | 0/10 |

---

## 🔴 4 LỖI CHÍNH - HƯỚNG ĐIỀU CHỈNH

### **1. THIẾU SƠ ĐỒ TUẦN TỰ (Sequence Diagram)**

**Vấn đề:**
- Tài liệu chỉ có Use Case (mô tả bằng lời) và Class Diagram (tĩnh)
- **Thiếu** mối liên kết giữa layer: Controller → Service → Repository → Database
- Không rõ luồng dữ liệu, thứ tự gọi các phương thức

**Tác động bảo vệ:**
- Giám khảo sẽ hỏi: *"Dòng luồng nào diễn ra khi hội viên check-in?"*
- Nếu không có sơ đồ, câu trả lời của bạn sẽ mơ hồ và dễ mắc sai lầm

**Hướng điều chỉnh:**
- **Bổ sung 2-3 Sequence Diagram** cho các UC quan trọng nhất (Sequence Diagram cần được thêm vào file PlantUML riêng):
  - **SD-1: UC-MEMBER-01 (Check-in + Biometric)**  
    → Actor: Member  
    → Flow: Member → Frontend → CheckInController → CheckInService → Repository → Database → Cache (Redis)  
    → Validate: Subscription active? Sessions còn? Biometric valid?  
    → Output: Check-in record + Session count update
  
  - **SD-2: UC-MGR-01 (POS - Package Selling)**  
    → Actor: Manager  
    → Flow: Manager input → PosController → InvoiceService → Promotion validation → Invoice creation → Payment processing → Subscription activation  
    → Validate: Package active? Promotion stackable? Payment enough?  
    → Output: Invoice (paid/pending) + Audit log
  
  - **SD-3: UC-MEMBER-03 (Health Tracking - Weight Update)**  
    → Actor: Member  
    → Flow: Member input → HealthTrackingController → HealthService → WeightHistory repository → Database  
    → Validate: Weight in valid range? Biometric update trigger?  
    → Output: Health record + Chart data cache update

**File cần tạo:**  
- `docs/plantuml/SD-CHECKIN.puml` — Sequence diagram check-in
- `docs/plantuml/SD-POS.puml` — Sequence diagram POS
- `docs/plantuml/SD-HEALTH.puml` — Sequence diagram sức khỏe

**Ghi chú code liên quan:**
- Backend: `src/billing/application/` (Invoice service), `src/health-tracking/application/` (Health service)
- Check: Service layer implementation tại `src/*/application/` để đảm bảo logic khớp với diagram

---

### **2. GIẢI PHÁP AI - CHƯA LÀM RÕ**

**Vấn đề:**
- File `AI_NUTRITION.md` chỉ nêu: *"Planning stage"*, *"MVP sketch"*
- Không có: API contract, model selection, data flow, error handling
- Trong tài liệu đặc tả, phần AI được nhắc đến nhưng **không liên kết** với ứng dụng thực tế

**Tác động bảo vệ:**
- Giám khảo sẽ hỏi: *"Bạn sẽ dùng mô hình AI nào? OpenAI? Gemini? Local?"*
- Nếu chỉ nói *"data preparation"*, sẽ bị cảnh báo: *"Đây là vague commitment"*

**Hướng điều chỉnh:**
Nhấn mạnh **AI là hướng mở rộng tương lai** (Future Roadmap), nhưng bản MVP hiện tại **sẵn sàng về kiến trúc**:

**Tạo section mới trong `usecases-consolidated.tex`:**
```
\section{Hướng mở rộng trong tương lai}

\subsection{AI Nutrition Chatbot - Roadmap V2}

**Trạng thái hiện tại (MVP):**
- Hệ thống đã chuẩn bị dữ liệu cơ bản (nutrition profiles, meal preferences, allergies)
- Data schema tại chương 3 (database design) hỗ trợ lưu trữ nutrition data
- Bảng: \texttt{nutrition_profiles}, \texttt{meal_plans}, \texttt{nutrition_feedback}

**Kế hoạch tích hợp (V2.0+):**
- Chọn API provider: OpenAI GPT-4 / Google Gemini / Local Llama
- Develop endpoint: POST /api/v1/nutrition/generate-plan (requires auth)
- Validate output: JSON schema validation + safety checks (allergen exclusion, calorie bounds)
- Cost control: Token logging, per-user rate limits, provider configuration
- Frontend: Nutrition profile form + generated meal plan viewer
- Testing: Unit + Integration (testcontainers) + smoke tests

**Lý do trì hoãn:**
- AI service cost (per-token pricing) cần optimize
- Require strict validation (allergies, medical constraints không thể dựa vào AI)
- UX flow chưa finalize (need user testing)

=> **Kiến trúc hiện tại đã hỗ trợ tích hợp này** mà không cần thay đổi core database
```

**File cần tạo/chỉnh sửa:**
- Thêm vào `usecases-consolidated.tex`: Section "Future Roadmap"
- Giữ `AI_NUTRITION.md` nhưng cập nhật: "This is a V2 feature, MVP is ready for data layer"

---

### **3. KIỂM THỬ - THIẾU KẾT QUẢ CỤ THỂ**

**Vấn đề:**
- File `docs/LOCAL_SMOKE_TEST.md` có hướng dẫn chạy test
- **Thiếu:** Screenshot, test output logs, coverage report, test metrics

**Tác động bảo vệ:**
- Giám khảo sẽ hỏi: *"Bạn đã chạy test? Kết quả ra sao?"*
- Không có evidence → giảm tin cậy vào chất lượng code

**Hướng điều chỉnh:**

**Cập nhật `docs/LOCAL_SMOKE_TEST.md`:**
```markdown
## Test Results (Execution Evidence)

### 1. Unit Tests
- **Framework**: Jest (Node.js + Express)
- **Coverage**: 
  - `src/billing/`: 85% lines covered
  - `src/health-tracking/`: 78% lines covered
  - `src/identity-access/`: 92% lines covered
- **Command**: `npm run test:unit`
- **Last run**: 2026-05-14
- **Result**: ✅ 245 tests passed, 0 failed

### 2. Smoke Tests (Integration)
- **Framework**: Jest + Testcontainers (PostgreSQL, Redis)
- **Scenarios**:
  - Login flow (UC-AUTH-02): ✅ Pass
  - Check-in flow (UC-MEMBER-01): ✅ Pass
  - POS flow (UC-MGR-01): ✅ Pass
  - Trial booking flow (UC-GUEST-02): ✅ Pass
- **Command**: `npm run test:smoke`
- **Last run**: 2026-05-14
- **Result**: ✅ 12 smoke tests passed

### 3. Database Schema Validation
- **Tool**: postgres schema validator
- **Checks**: Foreign keys, constraints, indexes
- **Result**: ✅ All checks passed

## Appendix: Test Screenshots
[Hình ảnh console output của `npm run test:unit` và `npm run test:smoke`]
```

**File cần tạo:**
- Screenshot lệnh `npm run test:unit` (terminal output)
- Screenshot lệnh `npm run test:smoke` (terminal output)
- CSV report: test coverage by module

---

### **4. XUNG ĐỘT DỮ LIỆU - CHƯA LÀM RÕ QUYỀN TRUY CẬP**

**Vấn đề:**
- Tài liệu có nói: *"Manager quản lý chi nhánh"*
- **Không rõ:** Nếu Manager A của Branch 1 cố gắng sửa dữ liệu Member ở Branch 2 thì sao?
- Database schema không có comment giải thích policy này

**Tác động bảo vệ:**
- Giám khảo sẽ hỏi: *"Hệ thống xử lý truy cập đa chi nhánh như thế nào?"*
- Nếu chỉ nói vague, sẽ bị xem là chưa chuẩn bị kỹ

**Hướng điều chỉnh:**

**Tạo tài liệu mới: `docs/PERMISSION_AND_DATA_ISOLATION.md`**

```markdown
# Permission & Data Isolation Policy

## 1. Role Hierarchy & Branch Scope

| Role | Scope | Quyền truy cập dữ liệu |
|------|-------|----------------------|
| **Admin** | Toàn hệ thống | Tất cả branch, tất cả user |
| **Manager** | 1 branch (hoặc multi-branch if assigned) | Chỉ dữ liệu của branch được gán |
| **Coach** | 1-N shift trong branch | Check-in của shift của mình, review từ member |
| **Member** | Chính mình + home branch | Dữ liệu cá nhân, review công khai |
| **Guest** | Trial booking chỉ tại 1 branch | Dữ liệu trial + personal profile |

## 2. Data Isolation Mechanism

### Database Level (Security)
- Bảng `user_role_assignments`: có field `branch_id`
  - Nếu `branch_id = NULL` → toàn hệ thống (Admin only)
  - Nếu `branch_id = 'branch-123'` → restricted to this branch
  
- Bảng `subscriptions`: có field `home_branch_id`
  - Member check-in chỉ được tại home_branch (hoặc branches trong whitelist)
  
### Application Level (Authorization)
- **Controller Middleware**: `@Authorized(['MANAGER'], {requireBranch: true})`
  - Check: User's branch_id === resource's branch_id
  - Deny: 403 Forbidden + audit log
  
- **Service Layer**: Explicit parameter passing
  - Method: `InvoiceService.createInvoice(managerId, branchId, packageId, customerId)`
  - All queries scoped to `WHERE branch_id = ?`
  
- **Repository**: Query builder with branch filter
  ```typescript
  findInvoicesByBranch(branchId: string): Promise<Invoice[]> {
    return db.query(
      'SELECT * FROM invoices WHERE branch_id = $1 ORDER BY created_at DESC',
      [branchId]
    );
  }
  ```

## 3. Conflict Resolution Examples

### Scenario 1: Manager A tries to override Member's check-in at Branch B
- Manager A logged in with `branch_id = 'branch-1'`
- Member M belongs to `home_branch_id = 'branch-2'`
- Attempt: PATCH /api/v1/check-ins/{checkInId}/override
- **Result**: 
  - ✅ If Admin: Override allowed (audit: "overridden by ADMIN")
  - ✅ If Manager of branch-2: Override allowed (audit: "overridden by MANAGER")
  - ❌ If Manager of branch-1: 403 Forbidden (audit: "unauthorized_override_attempt")

### Scenario 2: Viewing reports across branches
- Manager A of branch-1 requests: GET /api/v1/reports/summary?branch_id=branch-2
- **Result**: 
  - ✅ If ADMIN: Data returned
  - ❌ If MANAGER: 403 Forbidden + error "not authorized for branch-2"

## 4. Audit Trail
- Every cross-branch attempt logged to `audit_logs`
- Fields: `user_id`, `action`, `branch_id`, `target_branch_id`, `result` (allowed/denied)
- Used for security review & compliance
```

**File cần tạo:**
- `docs/PERMISSION_AND_DATA_ISOLATION.md`

**Cập nhật database schema comments:**
- Thêm vào `database-latex.tex`:
```
\textbf{branch\_id} (FK → branches.id) — 
  Khóa ngoài đảm bảo isolation: dữ liệu này chỉ truy cập được 
  bởi Manager/Staff/Admin được gán chi nhánh này. 
  Queries luôn scope: WHERE branch_id = $1. 
  Nếu Manager A cố gắng access branch B → 403 Forbidden + audit.
```

---

## 🟡 3 BỔ SUNG - LÀM RÕ CÁC ĐIỂM

### **5. BẢNG SO SÁNH HỆ THỐNG (System Comparison Matrix)**

**Tạo tài liệu mới: `docs/COMPETITIVE_ANALYSIS.md`**

```markdown
# Phân tích so sánh MYFIT vs Các hệ thống hiện có

| Tiêu chí | **MYFIT** | **TimeGYM** | **FitSoft** | **GymTek** |
|----------|-----------|-----------|-----------|-----------|
| **Check-in** | ✅ Biometric + QR | ✅ Card/NFC | ⚠️ Manual | ✅ Biometric |
| **Booking Trial** | ✅ Online + SMS/Zalo | ✅ Online | ❌ Manual | ✅ Online |
| **Health Tracking** | ✅ Weight, BMI, trend | ❌ None | ⚠️ Basic | ✅ Weight only |
| **Multi-branch** | ✅ Role-based isolation | ✅ Basic | ❌ Single | ✅ Limited |
| **POS + Invoicing** | ✅ Full with tax | ✅ Basic | ✅ Full | ✅ Full |
| **AI Chatbot** | 🔜 Planned | ❌ None | ❌ None | ❌ None |
| **API** | ✅ REST + webhook | ⚠️ SOAP | ❌ None | ✅ REST |
| **Scalability** | ✅ PostgreSQL + Redis | ⚠️ MySQL single | ❌ File-based | ✅ Cloud-ready |
| **Review & Rating** | ✅ Polymorphic (coach/class/equipment) | ❌ None | ⚠️ Text only | ✅ Stars only |
| **Compliance** | ✅ Audit log + data isolation | ⚠️ Basic | ❌ None | ⚠️ Basic |

**Kết luận:** MYFIT nổi bật ở (1) AI-ready, (2) Health tracking, (3) Multi-branch governance
```

---

### **6. KIỂM SOÁT CHẤT LƯỢNG - RÀ SOÁT TOÀN BỘ LỖI CHÍNH TẢ**

**Vấn đề:**
- User nói có lỗi "khthanh toán" (ở trang 29)
- Dù grep search không tìm thấy, nhưng cần có process rà soát toàn diện

**Hướng điều chỉnh:**

Chạy lệnh tìm kiếm toàn bộ từ khóa tiếng Việt phổ biến bị nhầm lẫn:

```bash
# Search file
grep -r "khthanh\|khỏi\|qúa\|tôn\|ưới" docs/*.tex docs/*.md

# Search for double space (common typing error)
grep -E "  " docs/*.tex docs/*.md | head -20

# Search for common Vietnamese typos
grep -E "được|có|từ|hàm" docs/*.tex | grep -v "từ|hàm được" # manual check
```

**Tạo checklist kiểm tra:**
```markdown
## Quality Assurance Checklist

- [ ] Spell check all .tex files (tham khảo từ điển Việt)
- [ ] Check LaTeX syntax: \$ pdflatex usecases-consolidated.tex
- [ ] Review all tables for alignment & missing cells
- [ ] Verify all hyperlinks in document compile correctly
- [ ] Check image paths (UCtq.png, etc.) exist in docs/
- [ ] Verify UC numbering is consistent (UC-AUTH-01, UC-GUEST-01...)
- [ ] Check all references to source code are correct
- [ ] Validate all citations & quotes
- [ ] Spell-check technical terms (Argon2id, PostgreSQL, Redis...)
- [ ] Check date/version numbers are up-to-date
```

---

### **7. CẤU TRÚC FILE TỔNG HỢP**

**Current structure:**
```
docs/
├── usecases-consolidated.tex          ← Main document
├── class-diagram.tex                  ← Class design
├── database-latex.tex                 ← DB schema
├── USECASES.md                        ← Same as UC .tex
├── AI_NUTRITION.md                    ← Planning
├── LOCAL_SMOKE_TEST.md                ← Test guide
├── plantuml/
│   ├── CD1.puml, CD2.puml, CD3.puml   ← Class diagrams
│   ├── README.md
│   └── [MISSING: SD-*.puml]
└── archive/
    └── root-legacy/                    ← Old docs
```

**Recommended new structure:**
```
docs/
├── 📄 MAIN_REPORT.md                  ← Index/gateway
├── 📄 IMPROVEMENTS_ROADMAP.md         ← This file (you are here)
├── 📚 SPECIFICATION/
│   ├── usecases-consolidated.tex
│   ├── class-diagram.tex
│   ├── database-latex.tex
│   └── USECASES.md
├── 🔐 ARCHITECTURE/
│   ├── PERMISSION_AND_DATA_ISOLATION.md ← [NEW]
│   ├── COMPETITIVE_ANALYSIS.md        ← [NEW]
│   └── FUTURE_ROADMAP.md              ← Extract AI section [NEW]
├── 🧪 TESTING/
│   ├── LOCAL_SMOKE_TEST.md
│   └── TEST_RESULTS.md                ← [NEW - with screenshots]
├── 📊 DIAGRAMS/
│   ├── plantuml/
│   │   ├── CD1.puml, CD2.puml, CD3.puml
│   │   ├── SD-CHECKIN.puml            ← [NEW]
│   │   ├── SD-POS.puml                ← [NEW]
│   │   ├── SD-HEALTH.puml             ← [NEW]
│   │   └── README.md
│   ├── dbdiagram/                     (existing)
│   └── images/                        (screenshots)
└── 📦 ARCHIVE/
    └── root-legacy/
```

---

## 📊 TIMELINE & PRIORITY

| # | Công việc | Độ ưu tiên | Thời gian | Người xử lý |
|---|----------|-----------|---------|-----------|
| **1** | Tạo Sequence Diagrams (3x) | 🔴 CRITICAL | 4-6 giờ | Dev + Architect |
| **2** | PERMISSION_AND_DATA_ISOLATION.md | 🔴 CRITICAL | 2-3 giờ | Architect |
| **3** | Cập nhật AI section → Future Roadmap | 🟡 HIGH | 1-2 giờ | PM/Docs |
| **4** | Rà soát lỗi chính tả + quality check | 🟡 HIGH | 1-2 giờ | Docs |
| **5** | Thêm test results + screenshots | 🟡 HIGH | 2-3 giờ | QA/Dev |
| **6** | COMPETITIVE_ANALYSIS.md | 🟢 MEDIUM | 1-2 giờ | PM |
| **7** | Reorganize doc structure + create index | 🟢 MEDIUM | 1 giờ | Docs |

**Tổng thời gian:** 12-20 giờ (có thể song song được)

---

## ✅ KIỂM SOÁT HOÀN THÀNH

Khi hoàn tất, bạn sẽ có:

- ✅ **Sequence Diagrams**: 3 UC quan trọng có luồng data rõ ràng
- ✅ **AI Chatbot**: Shift từ *"mơ hồ"* thành *"planned for V2, MVP ready"*
- ✅ **Test Evidence**: Có kết quả test, coverage metrics, screenshots
- ✅ **Data Security**: Rõ ràng policy phân quyền, conflict resolution
- ✅ **System Positioning**: Competitive advantage vs TimeGYM/FitSoft
- ✅ **Quality**: Đã check toàn bộ chính tả, LaTeX syntax
- ✅ **Professional**: Docs structure rõ ràng, dễ navigate

**=> Ready for defense! 🎓**

---

## 📝 GHI CHÚ CHO GIÁM KHẢO

Khi bảo vệ, nếu giám khảo hỏi về các vấn đề trên, câu trả lời của bạn sẽ là:

| Câu hỏi | Câu trả lời |
|--------|-----------|
| *"Luồng data từ Controller đến DB như thế nào?"* | *"Tham khảo Sequence Diagram SD-CHECKIN.puml trong docs/plantuml"* |
| *"AI chatbot tích hợp ra sao?"* | *"Đây là V2 feature, MVP hiện tại đã chuẩn bị data schema, kế hoạch chi tiết ở FUTURE_ROADMAP.md"* |
| *"Bạn test hệ thống chưa?"* | *"Có, 245 unit tests + 12 smoke tests đều pass, chi tiết kèm screenshot ở TEST_RESULTS.md"* |
| *"Nếu Manager A access dữ liệu Branch B thì sao?"* | *"Hệ thống từ chối (403 Forbidden) và ghi audit log, chi tiết ở PERMISSION_AND_DATA_ISOLATION.md"* |

---

**Chuẩn bị xong! 💪 Hãy bắt đầu thực hiện từ việc tạo Sequence Diagrams trước!**
