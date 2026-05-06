# MYFIT — Đặc tả Use Case (đã gộp)

> **Phiên bản:** 2.0 — 2026-05-01
> **Trạng thái:** MVP scope
> **Ghi chú:** Bản này gộp lại từ phiên bản 1.0 (~40 UC) thành **19 UC** theo các nguyên tắc bên dưới. Các UC bị tách quá nhỏ (CRUD, view dashboard, review theo từng target_type, các sub-flow của facility) đã được hợp nhất.

---

## Nguyên tắc gộp

1. **UC = mục tiêu nghiệp vụ tạo giá trị quan sát được**, không phải mỗi màn hình view.
2. **CRUD trên cùng 1 domain object** → gộp 1 UC "Quản lý X".
3. **Cùng luồng nghiệp vụ chỉ khác tham số** (đánh giá ca/HLV/thiết bị/bài tập) → 1 UC với `target_type`.
4. **Tương tác kết thúc ngoài hệ thống** (redirect Zalo) không phải UC.
5. **Cơ chế kỹ thuật ẩn** (refresh token, kích hoạt tự động sau payment) gộp vào UC mà nó phục vụ, không tách riêng.
6. **Các view tra cứu của cùng 1 actor** → "Theo dõi hồ sơ cá nhân" / "Báo cáo vận hành".
7. **Admin kế thừa toàn bộ quyền Manager** → KHÔNG lặp lại các UC Manager. Admin chỉ liệt kê những UC riêng có (quản lý chi nhánh, quản lý người dùng & phân quyền).

---

## Ghi chú chung

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **[ĐK]** | Điều kiện tiên quyết |
| **[KT]** | Điều kiện kết thúc (thành công) |
| **[NL]** | Ngoại lệ |

**Actors:**
- **Guest** — Khách tiềm năng, có tài khoản, chưa mua gói
- **Member** — Học viên có gói/khoá học active
- **Coach** — Huấn luyện viên đã đăng ký ca
- **Manager** — Quản lý chi nhánh
- **Admin** — Quản trị toàn hệ thống (kế thừa toàn bộ quyền Manager trên mọi branch)

**Tổng quan 19 UC:**

| Nhóm | UC |
|---|---|
| Auth (3) | UC-AUTH-01 Đăng ký · UC-AUTH-02 Đăng nhập/Đăng xuất · UC-AUTH-03 Khôi phục mật khẩu |
| Guest (2) | UC-GUEST-01 Tìm hiểu gói · UC-GUEST-02 Đăng ký + theo dõi trial |
| Member (4) | UC-MEMBER-01 Check-in + sinh trắc · UC-MEMBER-02 Hồ sơ cá nhân · UC-MEMBER-03 Hồ sơ sức khoẻ · UC-MEMBER-04 Đánh giá dịch vụ |
| Coach (3) | UC-COACH-01 Đăng ký / Huỷ ca làm việc · UC-COACH-02 Quản lý ca đang dạy · UC-COACH-03 Hỗ trợ check-in lỗi |
| Manager (7) | UC-MGR-01 POS · UC-MGR-02 Hủy/hoàn tiền · UC-MGR-03 Catalog gói/KM · UC-MGR-04 Override check-in · UC-MGR-05 Quản lý thiết bị · UC-MGR-06 Kiểm duyệt review · UC-MGR-07 Báo cáo vận hành |
| Admin (2) | UC-ADMIN-01 Quản lý chi nhánh · UC-ADMIN-02 Quản lý người dùng & phân quyền |

---

## I. Xác thực

### UC-AUTH-01 — Đăng ký tài khoản

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Tạo tài khoản Guest để dùng các tính năng cần xác thực (đặt trial, mua gói, theo dõi hồ sơ) |
| **Tác nhân** | Khách vãng lai |

**[ĐK]** Email chưa tồn tại trong hệ thống.

**[KT]** Tài khoản Guest được tạo, email xác minh được gửi, audit `user_registered` ghi.

**Luồng chính:**
1. Khách nhập email, mật khẩu, họ tên, số điện thoại.
2. Validate định dạng + policy mật khẩu.
3. Hash mật khẩu (Argon2id), tạo `User` + `Profile` + role `GUEST`.
4. Gửi email xác minh, ghi audit event.

**[NL]:**
- Email đã tồn tại → trả lỗi chung không tiết lộ.
- Mật khẩu yếu → trả lỗi chi tiết policy.
- Email server lỗi → vẫn tạo tài khoản, hiển thị "gửi lại email".

---

### UC-AUTH-02 — Đăng nhập / Đăng xuất

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Bắt đầu và kết thúc phiên xác thực. Refresh token rotate ngầm trong phiên (cơ chế kỹ thuật, không phải UC riêng) |
| **Tác nhân** | Guest, Member, Coach, Manager, Admin |

**[ĐK]** Tài khoản tồn tại + ACTIVE (đăng nhập).

**[KT]**
- *Đăng nhập:* access token (15') + refresh token được cấp, audit `login_success`, điều hướng theo role.
- *Đăng xuất:* refresh session bị revoke, token client bị xoá.

**Luồng chính (đăng nhập):** nhập email + mật khẩu → verify hash → cấp token + audit → frontend tự rotate refresh token khi sắp hết hạn.

**Luồng chính (đăng xuất):** người dùng nhấn đăng xuất → revoke session + audit → xoá token + redirect `/login`.

**[NL]:**
- Sai mật khẩu → ghi `login_failed`, trả lỗi chung.
- Tài khoản bị khoá → `USER_INACTIVE`.
- Vượt rate limit → HTTP 429.
- Refresh token bị replay → revoke toàn bộ phiên, force login lại.

---

### UC-AUTH-03 — Khôi phục mật khẩu

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Lấy lại quyền truy cập khi quên mật khẩu, đồng thời revoke toàn bộ phiên đang mở |
| **Tác nhân** | Bất kỳ actor có tài khoản |

**[ĐK]** Email tồn tại (response không tiết lộ để tránh user-enumeration).

**[KT]** Mật khẩu được đổi, toàn bộ refresh session bị revoke, audit `password_reset_completed`.

**Luồng chính:**
1. Nhập email.
2. Hệ thống tạo reset token một lần (TTL 24h), gửi email.
3. Click link, nhập mật khẩu mới.
4. Validate token, cập nhật hash, revoke toàn bộ phiên.

**[NL]:**
- Token hết hạn / đã dùng → yêu cầu gửi lại.
- Mật khẩu mới không đạt policy → trả lỗi chi tiết.

---

## II. Khách hàng (Guest)

### UC-GUEST-01 — Tìm hiểu gói dịch vụ

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Cho khách duyệt catalog, so sánh và xem chi tiết các gói tập (gộp *xem danh sách* + *xem chi tiết 1 gói*) |
| **Tác nhân** | Guest (không cần đăng nhập) |

**[ĐK]** Có tối thiểu 1 gói `ACTIVE`.

**[KT]** Khách thấy được catalog hoặc chi tiết 1 gói, có CTA đặt trial / liên hệ Zalo (Zalo là redirect ngoài, không thuộc phạm vi UC).

**Luồng chính:**
1. Mở trang gói dịch vụ.
2. Hệ thống trả danh sách `ACTIVE` (lọc theo loại / chi nhánh).
3. Click 1 gói → hiển thị mô tả, điều khoản, chi nhánh áp dụng, FAQ.

**[NL]:** Không có gói `ACTIVE` → trạng thái rỗng + CTA liên hệ tư vấn.

---

### UC-GUEST-02 — Đăng ký và theo dõi lịch tập thử

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Cho Guest trải nghiệm 1 buổi tập thử và tự kiểm tra trạng thái booking (gộp *đặt trial* + *theo dõi trial*) |
| **Tác nhân** | Guest đã đăng nhập |

**[ĐK]** Chưa có trial booking đang `registered`/`confirmed`; chi nhánh có slot trống.

**[KT]** `trial_booking` `registered` được tạo, email xác nhận được gửi, funnel data ghi; Guest xem được trạng thái sau đó.

**Luồng chính:**
1. Chọn chi nhánh + ngày + khung giờ còn slot.
2. Hệ thống tạo `trial_booking`, ghi funnel, gửi email.
3. Guest mở "Trial của tôi" để xem trạng thái (`registered → confirmed → attended/no_show → converted`).

**[NL]:**
- Ngày quá khứ → block UI + backend reject.
- Slot hết → gợi ý khung khác.
- Đã có trial active → điều hướng đến trang theo dõi.

---

## III. Thành viên (Member)

### UC-MEMBER-01 — Check-in ca tập kèm sinh trắc

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Ghi nhận member có mặt + lưu cân nặng trong cùng 1 transaction atomic (gộp *xem ca khả dụng* + *check-in* + *yêu cầu hỗ trợ khi lỗi*) |
| **Tác nhân** | Member |

**[ĐK]** Subscription/enrollment `ACTIVE` với `sessions_remaining > 0`; ca trong cửa sổ `[start - 30', end]`; chưa check-in ca này.

**[KT]** `class_attendance` + `member_weight_logs` tạo trong 1 transaction; trigger DB trừ `sessions_remaining`; audit ghi.

**Luồng chính:**
1. Member mở "Check-in" → hệ thống lọc các ca trong cửa sổ hợp lệ và chưa check-in.
2. Chọn ca, nhập cân nặng (kg).
3. Validate: ca hợp lệ, không trùng giờ, sessions còn.
4. Transaction: lưu sinh trắc + tạo attendance + decrement sessions + audit.

**[NL]:**
- Ca đóng cửa sổ → `SHIFT_CHECKIN_CLOSED`.
- Trùng check-in → `DUPLICATE_CHECKIN`.
- Hết session → gợi ý gia hạn.
- Cân hỏng → fallback nhập tay.
- Không tự thao tác được → nhấn "Cần hỗ trợ" → Manager xử lý qua UC-MGR-04.

---

### UC-MEMBER-02 — Theo dõi hồ sơ cá nhân

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Member tự kiểm tra dữ liệu của mình: lịch sử tập, gói/quota, hoá đơn, tiến trình sức khoẻ (gộp 4 view UC riêng lẻ) |
| **Tác nhân** | Member |

**[ĐK]** Đã đăng nhập.

**[KT]** Hồ sơ cá nhân được hiển thị theo các tab.

**Luồng chính:**
1. Vào "Hồ sơ của tôi".
2. Chọn tab:
   - (a) Lịch sử check-in (ngày, ca, chi nhánh, sinh trắc)
   - (b) Gói đang dùng (loại, hạn, số buổi còn)
   - (c) Hoá đơn & thanh toán (chi tiết line items, payments)
   - (d) Tiến trình sức khoẻ (biểu đồ cân nặng theo thời gian)
3. Mỗi tab có CTA tương ứng (gia hạn, tải hoá đơn, đặt mục tiêu).

**[NL]:** Tab nào trống → trạng thái rỗng + CTA phù hợp.

---

### UC-MEMBER-03 — Cập nhật hồ sơ sức khoẻ

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Lưu thông tin sức khoẻ nền (chiều cao, mục tiêu, dị ứng, bệnh nền) làm input cho tư vấn và cảnh báo sinh trắc |
| **Tác nhân** | Member |

**[ĐK]** Đã đăng nhập.

**[KT]** Hồ sơ sức khoẻ được lưu, audit `health_profile_updated`.

**Luồng chính:** Vào "Hồ sơ sức khoẻ" → nhập/cập nhật → lưu.

**[NL]:** Dữ liệu phi lý (chiều cao âm…) → validate trả lỗi cụ thể.

---

### UC-MEMBER-04 — Đánh giá dịch vụ

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Thu thập phản hồi của member về 1 đối tượng dịch vụ (ca tập, HLV, thiết bị, bài tập). **Gộp 4 UC review-* của bản cũ** — cùng entity `reviews`, cùng luồng tạo, chỉ khác `target_type` và rate-limit |
| **Tác nhân** | Member |

**[ĐK]** Đã có tương tác hợp lệ với target (đã check-in ca / đã tập với HLV / đã ở chi nhánh chứa thiết bị / đã thực hiện bài tập).

**[KT]** Bản ghi `reviews` với `status = visible` được tạo.

**Luồng chính:**
1. Chọn loại đánh giá (ca/HLV/thiết bị/bài tập).
2. Chọn target từ danh sách lịch sử tương tác.
3. Chọn rating 1–5 + comment + tags (optional).
4. Hệ thống enforce rate limit theo `target_type`:
   - ca = 1 review/shift
   - HLV = 1 review/coach/ngày
   - thiết bị = 1 review/asset/tuần
   - bài tập = không giới hạn
5. Lưu review.

**[NL]:**
- Vượt rate limit → `REVIEW_RATE_LIMITED`.
- Không đủ điều kiện tương tác → `REVIEW_NOT_ALLOWED`.
- Nội dung vi phạm → auto-flag vào hàng đợi (UC-MGR-06).

---

## IV. Huấn luyện viên (Coach)

### UC-COACH-01 — Đăng ký / Huỷ ca làm việc

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | HLV tự đăng ký vào các ca còn slot và chủ động huỷ nếu cần — kiểm soát lịch làm việc của bản thân mà không phụ thuộc Manager phân ca |
| **Tác nhân** | Coach |

**[ĐK]** Coach thuộc branch có ca; ca chưa đủ HLV (cho luồng đăng ký).

**[KT]**
- *Đăng ký:* `trainer_assignments` được tạo, audit `coach_self_assigned`.
- *Huỷ:* `cancelled_at` được ghi, audit cập nhật.

**Luồng chính:**

**(a) Đăng ký ca:**
1. HLV mở "Ca trống" → hệ thống hiển thị danh sách ca chưa đủ HLV trong branch và khoảng thời gian.
2. Chọn ca, xác nhận.
3. Hệ thống validate không trùng giờ và còn slot HLV → tạo `trainer_assignments`.

**(b) Huỷ ca:**
1. HLV mở danh sách ca đã đăng ký.
2. Chọn ca muốn huỷ → hệ thống kiểm tra ca chưa bắt đầu.
3. Ghi `cancelled_at`.

**[NL]:**
- Đăng ký ca trùng giờ → `SHIFT_TIME_OVERLAP`.
- Ca đã đủ HLV → `SHIFT_FULL`.
- Huỷ sau khi ca đã bắt đầu → `SHIFT_ALREADY_STARTED`.
- Truy cập ca ngoài branch → `FORBIDDEN`.

---

### UC-COACH-02 — Quản lý ca đang dạy

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | HLV theo dõi lịch làm việc theo ngày và xem thông tin học viên real-time trong ca đang diễn ra, phục vụ hỗ trợ tập luyện |
| **Tác nhân** | Coach đã được phân công ca (`trainer_assignments` active) |

**[ĐK]** Tồn tại ít nhất 1 `trainer_assignments` active của Coach trong ngày.

**[KT]** HLV thấy danh sách ca theo ngày; trong từng ca thấy roster real-time và chi tiết tối thiểu của từng học viên (least privilege).

**Luồng chính:**
1. HLV mở màn hình chính → hệ thống lấy danh sách ca theo ngày từ `trainer_assignments`.
2. HLV chọn 1 ca → hiển thị roster real-time từ `class_attendance`: tổng check-in, tên, giờ check-in, sinh trắc hôm nay.
3. HLV click vào 1 học viên → hiển thị chi tiết: tên, ảnh, cân nặng hôm nay, số buổi còn lại.

**[NL]:**
- Truy cập ca không thuộc assignment của Coach → `FORBIDDEN`.
- Ca chưa có học viên check-in → hiển thị roster rỗng.

---

### UC-COACH-03 — Hỗ trợ học viên check-in lỗi

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Khi học viên có mặt nhưng không tự check-in được, HLV xử lý tại chỗ thay vì chờ Manager |
| **Tác nhân** | Coach |

**[ĐK]** Đang được phân công ca; ca trong cửa sổ `[start - 30', end]` (không có grace period sau `end` — đó là quyền Manager); học viên có sub/enrollment ACTIVE và sessions còn.

**[KT]** Hoặc học viên check-in lại được, hoặc HLV proxy check-in: tạo `class_attendance` với `proxy_checkin = true`, `override_actor = coach`, `override_reason` bắt buộc; audit `attendance_proxy_coach`.

**Luồng chính:**
1. Học viên báo lỗi với HLV.
2. HLV hướng dẫn thử lại.
3. Nếu vẫn lỗi: HLV xác minh danh tính, nhập lý do bắt buộc, xác nhận proxy check-in.
4. Hệ thống chạy transaction tạo attendance + audit.
5. Nếu sự cố vượt thẩm quyền (ngoài cửa sổ ca, học viên không có gói active), HLV chuyển sang Manager (UC-MGR-04).

**[NL]:**
- Coach không thuộc assignment → `COACH_NOT_ASSIGNED_TO_SHIFT`.
- Ngoài cửa sổ ca → `SHIFT_NOT_STARTED`/`SHIFT_ALREADY_ENDED`.
- Trùng check-in → `DUPLICATE_CHECKIN`.
- Thiếu lý do → `OVERRIDE_REASON_REQUIRED`.

---

## V. Quản lý chi nhánh (Manager)

### UC-MGR-01 — Bán gói tại quầy (POS)

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Bán 1 gói cho khách: tạo hoá đơn → áp khuyến mãi → ghi nhận thanh toán → tự động kích hoạt quyền sử dụng. **Gộp UC-POS-01/02/03 + UC-PROMO-03** — đây là 1 business flow nguyên khối; kích hoạt subscription là hệ quả tự động |
| **Tác nhân** | Manager (branch scope) |

**[ĐK]** Khách có tài khoản; gói chọn `ACTIVE`; manager thuộc branch của giao dịch.

**[KT]** `invoice` `paid`, `payment` `success`, `subscription`/`course_enrollment` `ACTIVE` với `sessions_remaining`, audit `membership_activated_via_payment`. Khách nhận thông báo.

**Luồng chính:**
1. Manager chọn khách + gói (chỉ ACTIVE), snapshot giá vào line items.
2. Áp khuyến mãi nếu có: validate hiệu lực `[starts_at, ends_at]`, điều kiện gói/tổng tiền/lượt dùng, quy tắc `stackable`.
3. Tạo `invoice` `pending`.
4. Chọn phương thức thanh toán, nhập số tiền nhận.
5. Hệ thống tích luỹ payment so với tổng invoice — đủ tiền → `paid` và tự động kích hoạt sub/enrollment + audit; thiếu tiền → giữ `pending` (cho phép trả nhiều lần).

**[NL]:**
- Gói INACTIVE giữa luồng → refresh catalog.
- KM hết hạn / không đủ điều kiện → thông báo cụ thể.
- Số tiền vượt invoice → `PAYMENT_EXCEEDS_INVOICE`.
- Khách đã có sub cùng loại còn active → skip kích hoạt với `ALREADY_ACTIVE`.
- Manager khác branch → `CROSS_BRANCH_ACCESS`.

---

### UC-MGR-02 — Hủy hoá đơn / hoàn tiền

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Đảo trạng thái 1 giao dịch theo chính sách (giao dịch sai, khách đổi ý) |
| **Tác nhân** | Manager (branch scope) |

**[ĐK]** Invoice tồn tại; manager thuộc branch.

**[KT]**
- *Hủy* (invoice `pending`): chuyển `cancelled`, audit.
- *Hoàn tiền* (invoice `paid`): tạo refund record; nếu full refund → deactivate sub/enrollment tương ứng (`status = CANCELLED`, `expires_at = now`); audit.

**Luồng chính:**
1. Mở invoice.
2. Chọn hành động: hủy (chỉ `pending`) hoặc hoàn tiền (chỉ `paid`), nhập lý do bắt buộc và số tiền hoàn.
3. Transaction: cập nhật invoice/payment + scan line items để deactivate gói/khoá học + audit.

**[NL]:**
- Invoice đã `cancelled`/`refunded` → chặn lặp.
- Member đã sử dụng nhiều buổi → chính sách hoàn tiền theo số buổi đã dùng.
- Manager khác branch → `CROSS_BRANCH_ACCESS`.

---

### UC-MGR-03 — Quản lý catalog gói & khuyến mãi

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | CRUD và bật/tắt gói + khuyến mãi (gộp UC-PROD-01/02/03 + UC-PROMO-01/02 — cùng pattern "quản lý catalog kinh doanh") |
| **Tác nhân** | Manager (branch scope) |

**[ĐK]** Có quyền quản lý catalog của branch.

**[KT]** Gói/KM được tạo, sửa hoặc đổi trạng thái `ACTIVE/INACTIVE`. Invoice cũ không bị ảnh hưởng (giá đã snapshot).

**Luồng chính:**
1. Mở "Quản lý gói" hoặc "Quản lý khuyến mãi".
2. Tạo mới (mặc định INACTIVE) hoặc sửa (tên/mô tả/giá/quyền lợi/loại discount/điều kiện áp dụng/thời hạn/`stackable`).
3. Toggle ACTIVE/INACTIVE để bật/tắt khả dụng cho POS và trang khách.

**[NL]:**
- Sửa giá khi gói ACTIVE → cảnh báo "giá mới chỉ áp dụng cho hoá đơn mới".
- Thiếu trường bắt buộc → validate trả lỗi.

---

### UC-MGR-04 — Can thiệp check-in (override)

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Đảm bảo dữ liệu attendance chính xác khi member không tự check-in được. Phân biệt với UC-COACH-03: manager có thẩm quyền rộng hơn (grace period, mọi ca trong branch) |
| **Tác nhân** | Manager (branch scope) |

**[ĐK]** Manager thuộc branch của ca; member có mặt thực tế; có lý do hợp lệ.

**[KT]** `class_attendance` với `override = true`, `override_actor = manager`, `override_reason`; audit `attendance_override`.

**Luồng chính:**
1. Manager nhận thông báo từ member (UC-MEMBER-01) hoặc HLV (UC-COACH-03).
2. Xác minh danh tính + tình trạng có mặt.
3. Chọn member + ca, nhập lý do bắt buộc.
4. Transaction tạo attendance + audit.

**[NL]:**
- Member đã check-in → chặn ghi đè.
- Ca kết thúc quá lâu → yêu cầu Admin confirm.
- Thiếu lý do → `OVERRIDE_REASON_REQUIRED`.

---

### UC-MGR-05 — Quản lý thiết bị

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | CRUD danh mục loại thiết bị tại branch và cập nhật số lượng/tình trạng. **Quy mô gym nhỏ không cần phiếu sự cố hay lịch bảo trì định kỳ** — manager xử lý trực tiếp khi có vấn đề |
| **Tác nhân** | Manager (branch scope) |

**[ĐK]** Manager thuộc branch.

**[KT]** Loại thiết bị được tạo/sửa/xoá; số lượng và tình trạng được cập nhật.

**Luồng chính:**
1. Mở "Quản lý thiết bị".
2. *Thêm loại thiết bị:* nhập tên, mô tả, số lượng ban đầu, tình trạng mặc định `ACTIVE`.
3. *Cập nhật số lượng:* sửa khi mua thêm hoặc loại bỏ.
4. *Cập nhật tình trạng:* chuyển giữa `ACTIVE / MAINTENANCE / BROKEN / RETIRED`; nếu cân InBody bị BROKEN → check-in tự bật fallback nhập tay.
5. *Xoá:* chỉ cho phép khi số lượng = 0 hoặc tình trạng `RETIRED`.

**[NL]:**
- Số lượng âm → `INVALID_QUANTITY`.
- Trạng thái không hợp lệ → `INVALID_ASSET_STATUS`.
- Xoá khi còn dùng → chặn, yêu cầu chuyển `RETIRED` trước.

---

### UC-MGR-06 — Kiểm duyệt đánh giá

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Xử lý các review bị flag (auto hoặc do manager phát hiện) — ẩn nội dung vi phạm hoặc khôi phục. Phần *xem tổng hợp đánh giá theo branch* thuộc UC-MGR-07, không lặp ở đây |
| **Tác nhân** | Manager (branch scope) |

**[ĐK]** Có review thuộc branch và đang `visible` hoặc `flagged`.

**[KT]** Trạng thái review được đổi (`visible`/`flagged`/`hidden`) kèm `review_moderation_logs` ghi lý do.

**Luồng chính:**
1. Mở hàng đợi kiểm duyệt.
2. Xem chi tiết review, đổi trạng thái với lý do bắt buộc.

**[NL]:** Đổi sang trạng thái không hợp lệ → `INVALID_REVIEW_STATUS`.

---

### UC-MGR-07 — Theo dõi & báo cáo vận hành

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Cung cấp toàn bộ view tổng hợp về vận hành branch để manager ra quyết định và đối soát cuối ngày. **UC duy nhất mang tính "xem báo cáo"** — gộp dashboard ngày, roster theo ca, funnel trial, đối soát thu ngân, tổng hợp đánh giá. Các UC action khác KHÔNG lặp lại các view này |
| **Tác nhân** | Manager (branch scope) |

**[ĐK]** Manager đã đăng nhập, thuộc branch.

**[KT]** Báo cáo được hiển thị; có thể export hoặc ghi nhận đối soát ca.

**Luồng chính:**
1. Mở "Báo cáo vận hành".
2. Chọn loại view:
   - (a) Tổng quan ngày — số check-in, doanh thu POS, trial tạo mới
   - (b) Roster theo ca — danh sách check-in chi tiết để xử lý khiếu nại
   - (c) Funnel trial — `registered → confirmed → attended → converted` kèm tỷ lệ
   - (d) Đối soát thu ngân — tổng hoá đơn, tổng thu theo phương thức, refund
   - (e) Tổng hợp đánh giá — số lượng và rating trung bình theo `target_type`, top target được review nhiều nhất
3. Có thể export hoặc xác nhận đối soát ca cuối ngày (audit `shift_reconciled`).

**[NL]:** Không có dữ liệu trong khoảng chọn → trạng thái rỗng.

---

## VI. Quản trị viên (Admin)

> **Lưu ý:** Admin **kế thừa toàn bộ quyền của Manager** (UC-MGR-01 đến UC-MGR-07) trên **tất cả các chi nhánh** thay vì chỉ branch được gán. Phần dưới đây chỉ liệt kê những UC **Manager không có** — gồm phân quyền hệ thống, quản lý mọi tài khoản và quản lý chi nhánh.

---

### UC-ADMIN-01 — Quản lý chi nhánh

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | CRUD chi nhánh và cấu hình thông tin liên hệ (Zalo/hotline/email). Đây là việc Manager không làm được vì Manager chỉ có scope trong branch đã có |
| **Tác nhân** | Admin |

**[ĐK]** Admin có role hợp lệ.

**[KT]** Branch được tạo/sửa/đóng; thông tin liên hệ cập nhật trên trang public.

**Luồng chính:**
1. Mở "Chi nhánh".
2. Tạo branch (tên, địa chỉ, giờ mở/đóng) hoặc sửa thông tin (`zalo_link`, `zalo_phone`, `contact_email`).
3. Đóng branch (soft) khi ngừng hoạt động.

**[NL]:** Đóng branch còn member active → cảnh báo và yêu cầu chuyển branch.

---

### UC-ADMIN-02 — Quản lý người dùng & phân quyền

| Trường | Nội dung |
|--------|---------|
| **Mục đích** | Quản lý vòng đời và phân quyền cho **mọi tài khoản** trong hệ thống — gồm tạo nhân sự nội bộ (Coach/Manager), gán/gỡ role, gán Manager phụ trách branch, vô hiệu hoá tài khoản. **Đây là điểm khác biệt chính giữa Admin và Manager** |
| **Tác nhân** | Admin |

**[ĐK]** Admin có role hợp lệ.

**[KT]**
- *Tạo nhân sự:* `user` (`PENDING_PASSWORD_RESET`) + `profile` + `staff_profile` + `user_role_assignments` + `password_reset_tokens` (24h) trong 1 transaction; audit `staff_registered`; email "đặt mật khẩu lần đầu" được gửi.
- *Phân quyền:* role được gán/gỡ; với role `MANAGER`, branch được gán qua `branch_manager_assignments`.
- *Vô hiệu hoá:* tài khoản chuyển `INACTIVE`, các phiên bị revoke.

**Luồng chính:**
1. Mở "Người dùng" → thấy toàn bộ tài khoản (Member/Coach/Manager/Admin) với bộ lọc theo role/branch/trạng thái.
2. *Tạo nhân sự:* nhập email, họ tên, SĐT, vai trò, branch chính, employee code. Hệ thống chạy transaction tạo records và gửi email.
3. *Phân quyền:* chọn user → gán/gỡ role; với MANAGER thì gán branch quản lý.
4. *Vô hiệu hoá / khôi phục:* toggle trạng thái tài khoản.

**[NL]:**
- Email đã tồn tại → `EMAIL_ALREADY_EXISTS`.
- Employee code trùng → `EMPLOYEE_CODE_ALREADY_EXISTS`.
- Vai trò không hợp lệ → `INVALID_STAFF_ROLE`.
- Vô hiệu hoá Admin cuối cùng → chặn để tránh khoá hệ thống.
