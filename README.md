# MYFIT

MYFIT is a gym management MVP with a Node.js/PostgreSQL backend and a Next.js frontend. The current product covers member identity, branch management, trial booking, membership activation, coach shift assignment, class check-in, basic health tracking, and billing records.

## Use cases (đặc tả tổng hợp)

Tài liệu này tổng hợp **use case theo mô hình vận hành đã chốt**:

- **Không đặt lịch trước**.
- Học viên **tự check-in theo ca (shift)**.
- Check-in **chỉ hợp lệ trong “cửa sổ thời gian”** (mở trước ca 30 phút, đóng khi hết ca).
- Check-in **kèm nhập/sync chỉ số cân sinh trắc**; lưu xong được tính là đã check-in.
- **Coach** xem được **roster** (số lượng + danh sách học viên) trong ca của mình để tránh điểm danh thủ công.
- **Manager** tập trung **POS/thu ngân** (invoice/payment) + dashboard vận hành theo ngày/ca.
- **Manager** chi nhánh có thêm module **quản lý cơ sở vật chất** (thiết bị/sự cố/bảo trì).

> Ghi chú: một số use case dưới đây là “đích đặc tả”. Nếu code hiện tại chưa đủ bảng/cột (ví dụ check-in cần gắn `shift_id`) thì đó là backlog triển khai.

### Business rules dùng chung

- **BR-ACTOR-01 (Actors)**: Hệ thống có 5 actor nghiệp vụ:
  - **Prospect/Guest (khách tiềm năng, có tài khoản)**: đăng ký/đăng nhập để đặt lịch tập thử, chat tư vấn, và theo dõi funnel (đi tập thử hay không, có mua gói hay không).
  - **Member, Coach, Manager, Admin**: các luồng nội bộ theo phân quyền.
- **BR-AUTH-01 (RBAC)**: Quyền truy cập theo vai trò áp dụng cho user đã đăng nhập (tối thiểu 4 role): `ADMIN`, `MANAGER`, `COACH`, `MEMBER`.
- **BR-SHIFT-01 (Time window check-in)**: Member chỉ được chọn ca khi:

  \[
  start\_at - W \le now \le end\_at
  \]

  Trong đó **W = 30 phút**.

- **BR-SHIFT-02 (Không check-in ca đã kết thúc)**: Nếu \(now > end\_at\) thì ca không được chọn.
- **BR-CHECKIN-01 (Anti-duplicate theo ca)**: 1 member chỉ được check-in **tối đa 1 lần / 1 shift**.
- **BR-CHECKIN-02 (Anti-duplicate theo thời điểm — khuyến nghị)**: Không cho phép member có 2 check-in thuộc 2 ca **chồng thời gian**.
- **BR-CHECKIN-03 (Check-in = biometric tối thiểu)**: Check-in chỉ thành công khi lưu được bộ dữ liệu sinh trắc tối thiểu (gợi ý: `weight_kg`, `measured_at`, `measurement_source`).
- **BR-ROSTER-01 (Roster ca)**: Vì không đặt lịch trước, **roster ca = danh sách check-in hợp lệ** trong ca đó.
- **BR-POS-01 (Thanh toán)**: `payments.status=success` là xác nhận đã thanh toán (cash/transfer/POS). Invoice “paid” khi tổng success payment \(\ge\) tổng tiền.
- **BR-PROD-01 (Catalog scope)**: Manager chỉ được tạo/sửa gói tập/giá bán thuộc **chi nhánh mình quản lý** (hoặc theo chính sách hệ thống: global catalog do Admin quản lý).
- **BR-PROD-02 (Trạng thái gói)**: gói có trạng thái `ACTIVE/INACTIVE`; chỉ gói `ACTIVE` mới được bán trên POS/hiển thị cho Guest.
- **BR-PROMO-00 (Promo scope)**: Khuyến mãi có thể là:
  - **Global** (do Admin quản lý) áp dụng toàn hệ thống, hoặc
  - **Theo chi nhánh** (do Manager quản lý) áp dụng trong branch mình.
- **BR-PROMO-01 (Thời gian hiệu lực khuyến mãi)**: khuyến mãi chỉ áp dụng khi \(now\) nằm trong \([starts\_at, ends\_at]\).
- **BR-PROMO-02 (Điều kiện áp dụng)**: khuyến mãi có thể ràng buộc theo:
  - chi nhánh
  - loại gói (membership/course/PT/fee)
  - tổng tiền tối thiểu
  - giới hạn số lượt dùng (per day / per customer / total)
- **BR-PROMO-03 (Không cộng dồn nếu không cho phép)**: mặc định **không cộng dồn** nhiều khuyến mãi trên cùng 1 hóa đơn, trừ khi bật `stackable=true`.
- **BR-POS-02 (Tính tiền sau khuyến mãi)**: tổng tiền cuối cùng = tổng line items − discount (và phải lưu snapshot để đối soát).
- **BR-CONTACT-01 (Liên hệ quản lý)**: Khách liên hệ tư vấn qua **Zalo** (deep link đến OA hoặc số Zalo của chi nhánh). Toàn bộ cuộc trò chuyện diễn ra ngoài hệ thống; MYFIT không lưu lịch sử chat.
- **BR-AI-01 (Lời khuyên sinh trắc)**: Sau mỗi lần check-in có lưu sinh trắc, hệ thống gọi AI phân tích xu hướng cân nặng và đưa lời khuyên cá nhân hóa (chế độ ăn, cường độ tập). Kết quả hiển thị cho member; không lưu log chi tiết prompt/response.
- **BR-AI-02 (Báo cáo phân tích)**: AI được dùng để tổng hợp và diễn giải dữ liệu báo cáo nội bộ (doanh thu, học viên, đánh giá) dành cho Manager và Admin. AI không tự tạo dữ liệu — chỉ phân tích dữ liệu đã có trong DB.
- **BR-AI-03 (Guardrails)**: AI không đưa ra tư vấn y tế; mọi output phải kèm disclaimer. Calorie/macro target phải qua validation trước khi hiển thị.
- **BR-FUNNEL-01 (Trial funnel tracking)**: Mỗi trial booking phải gắn được với một user (prospect) để thống kê:
  - đăng ký trial nhưng **không đến** (no_show)
  - đã trial nhưng **không mua gói** trong X ngày
- **BR-REV-01 (Review scope)**: Member có thể đánh giá/nhận xét theo các mục:
  - **Bài tập** (workout/exercise)
  - **Ca tập** (shift/session)
  - **Cơ sở vật chất/thiết bị** (facility/asset)
  - **Huấn luyện viên** (coach)
- **BR-REV-02 (Anti-spam đánh giá)**: 1 member chỉ được tạo tối đa 1 review cho mỗi “đối tượng” trong một khoảng thời gian (gợi ý: 1 review/shift, 1 review/coach/ngày, 1 review/asset/tuần), và có rate limit.
- **BR-REV-03 (Moderation)**: Review có trạng thái (gợi ý): `visible`, `hidden`, `flagged`; Manager/Admin có thể ẩn/khôi phục, và xem log.

### Use cases theo Actor

#### Prospect/Guest (khách tiềm năng – có tài khoản)

- **UC-GUEST-00 Đăng ký tài khoản**
  - Mục tiêu: tạo tài khoản prospect để theo dõi trial + chat + funnel.
- **UC-GUEST-01 Đăng nhập**
  - Mục tiêu: vào hệ thống với vai trò prospect.
- **UC-GUEST-02 Xem danh sách gói dịch vụ**
  - Mục tiêu: xem các gói (membership/course/PT/fee) và thông tin cơ bản: giá, thời hạn/buổi, quyền lợi.
- **UC-GUEST-03 Xem chi tiết 1 gói**
  - Mục tiêu: xem mô tả chi tiết, điều khoản, chi nhánh áp dụng, câu hỏi thường gặp.
- **UC-GUEST-04 Đăng ký lịch tập thử (trial booking)**
  - Luồng chính:
    - Chọn chi nhánh → chọn ngày/giờ mong muốn → nhập thông tin liên hệ → gửi đăng ký.
    - Hệ thống tạo trial booking và trả xác nhận.
  - Ràng buộc:
    - Không cho đăng ký khung giờ trong quá khứ.
    - Có thể giới hạn số trial theo slot/ngày (tuỳ chính sách).
- **UC-GUEST-05 Liên hệ tư vấn qua Zalo**
  - Mục tiêu: khách muốn tư vấn trực tiếp với quản lý chi nhánh.
  - Luồng chính: nhấn “Liên hệ tư vấn” → hệ thống hiển thị link/số Zalo chi nhánh → redirect sang Zalo. Không xử lý trong hệ thống.
- **UC-GUEST-07 Theo dõi trạng thái trial của tôi**
  - Mục tiêu: xem lịch trial, trạng thái (đã xác nhận/đã đến/no-show), và lời nhắc.

#### Member (học viên)

- **UC-MEMBER-01 Đăng nhập**
  - Mục tiêu: vào hệ thống để check-in/health.
- **UC-MEMBER-02 Xem danh sách ca có thể check-in**
  - Mục tiêu: chỉ hiển thị ca hợp lệ theo **BR-SHIFT-01**.
- **UC-MEMBER-03 Tự check-in theo ca + nhập/sync sinh trắc**
  - Luồng chính:
    - Chọn “Check in” → chọn ca hợp lệ → nhập/sync số liệu → “Lưu”.
    - Hệ thống validate sinh trắc → lưu log sinh trắc → ghi nhận check-in cho ca.
  - Ngoại lệ:
    - Ca chưa tới cửa sổ 30 phút / ca đã kết thúc (BR-SHIFT-01/02).
    - Đã check-in ca này (BR-CHECKIN-01).
    - Ca chồng thời gian với check-in khác (BR-CHECKIN-02).
    - Thiếu dữ liệu tối thiểu (BR-CHECKIN-03).
- **UC-MEMBER-04 Xem lịch sử check-in**
  - Mục tiêu: tự đối soát mình đã check-in ca nào/ngày nào.
- **UC-MEMBER-05 Xem gói đã mua (membership/subscription)**
  - Mục tiêu: xem gói hiện tại, hạn sử dụng, số buổi còn lại, quyền lợi cơ bản.
- **UC-MEMBER-06 Xem lịch sử hóa đơn / thanh toán**
  - Mục tiêu: xem các invoice đã tạo, trạng thái paid/pending, lịch sử payment.
- **UC-MEMBER-07 Yêu cầu hỗ trợ khi check-in lỗi (optional)**
  - Mục tiêu: gửi yêu cầu hỗ trợ đến manager/nhân viên khi app/thiết bị gặp sự cố.
- **UC-HEALTH-01 Cập nhật hồ sơ sức khỏe**
- **UC-HEALTH-02 Xem tiến trình sức khỏe**
- **UC-REV-01 Đánh giá/nhận xét ca tập**
  - Mục tiêu: sau khi tham gia ca, member để lại rating/comment (1–5 sao) và tag.
- **UC-REV-02 Đánh giá/nhận xét huấn luyện viên**
  - Mục tiêu: phản hồi chất lượng coaching.
- **UC-REV-03 Đánh giá/nhận xét cơ sở vật chất/thiết bị**
  - Mục tiêu: phản ánh hỏng hóc/độ sạch sẽ/chất lượng thiết bị.
- **UC-REV-04 Đánh giá/nhận xét bài tập**
  - Mục tiêu: phản hồi bài tập (độ khó, hiệu quả, phù hợp).

#### Coach (huấn luyện viên)

- **UC-COACH-01 Xem ca của tôi hôm nay**
  - Mục tiêu: biết mình dạy ca nào (theo phân công/assignment).
- **UC-COACH-02 Xem roster ca (số lượng + danh sách học viên đã check-in)**
  - Mục tiêu: tránh phải điểm danh thủ công.
  - Output tối thiểu:
    - Tổng số check-in hợp lệ trong ca.
    - Danh sách học viên + thời điểm check-in + trạng thái sinh trắc (đã lưu/thiếu).
- **UC-COACH-03 Xem chi tiết 1 học viên trong ca**
  - Mục tiêu: xem nhanh thông tin và số liệu mới nhất.
- **UC-COACH-04 Xử lý ngoại lệ “học viên có mặt nhưng chưa check-in”**
  - Mục tiêu: vận hành không bị “kẹt” khi có sự cố kỹ thuật.
  - Mặc định: coach **không** check-in hộ; coach hướng dẫn học viên thao tác lại.
  - Optional feature (có thể bật/tắt): **coach check-in hộ** khi có sự cố kỹ thuật và bắt buộc:
    - xác thực lại danh tính học viên
    - ghi audit log đầy đủ (actor, lý do, thời điểm, ca)

#### Manager (quản lý chi nhánh / thu ngân)

**A. Vận hành check-in theo ngày**

- **UC-MGR-01 Dashboard vận hành theo ngày/chi nhánh**
  - Mục tiêu: tổng số check-in theo ca + tổng ngày.
- **UC-MGR-02 Xem roster theo ca/ngày**
  - Mục tiêu: hỗ trợ vận hành/giải quyết khiếu nại.
- **UC-MGR-03 Xem thống kê funnel trial của chi nhánh**
  - Mục tiêu: theo dõi số prospect đăng ký trial, tỷ lệ đến, tỷ lệ chuyển đổi mua gói.
  - Chi tiết gợi ý:
    - theo thời gian (ngày/tuần/tháng)
    - theo chi nhánh (mặc định branch của manager)
    - theo nguồn (source/campaign) nếu có tracking
    - các trạng thái: registered / confirmed / attended / no_show / converted
- **UC-MGR-04 Can thiệp khi check-in lỗi (support override)**
  - Mục tiêu: xử lý sự cố kỹ thuật (app/kiosk/cân sinh trắc) nhưng vẫn đảm bảo dữ liệu chính xác.
  - Yêu cầu: bắt buộc audit log + lý do + người thực hiện.

**B. POS/Thanh toán (giống hệ thống bán hàng)**

- **UC-POS-01 Tạo hóa đơn**
  - Mục tiêu: tạo invoice bán gói/dịch vụ (membership/course/PT/fee).
  - Kết quả: invoice `pending` + line item snapshot.
- **UC-POS-02 Ghi nhận thanh toán thành công**
  - Mục tiêu: xác nhận “đã trả tiền” cho cash/transfer/POS.
  - Kết quả: payment `success`, invoice chuyển `paid` khi đủ tiền.
- **UC-POS-03 Kích hoạt quyền sử dụng sau thanh toán**
  - Mục tiêu: paid xong member dùng được gói (auto-activate theo chính sách).
- **UC-POS-04 Đối soát giao dịch trong ngày**
  - Mục tiêu: lọc theo ngày/branch/method/status.
- **UC-POS-05 Hủy hóa đơn / hoàn tiền (có điều kiện)**
  - Mục tiêu: xử lý giao dịch sai hoặc khách đổi ý theo chính sách.
  - Rule gợi ý:
    - chỉ manager/admin có quyền
    - bắt buộc lý do + audit log
    - phân biệt “hủy invoice chưa paid” vs “refund invoice đã paid”

**C. Quản lý gói tập (catalog)**

- **UC-PROD-01 Tạo gói tập/sản phẩm bán**
  - Mục tiêu: tạo gói để bán trên POS và/hoặc hiển thị cho Guest.
  - Ví dụ: membership plan, course package, PT package, phụ phí.
- **UC-PROD-02 Cập nhật thông tin/giá gói**
  - Mục tiêu: đổi tên/mô tả/giá/hiệu lực.
  - Ràng buộc: nếu gói đã được bán, cần lưu snapshot tại invoice (không “đè” vào hóa đơn cũ).
- **UC-PROD-03 Bật/tắt gói**
  - Mục tiêu: đưa gói về `INACTIVE` để ngừng bán/ẩn khỏi Guest.
  - Rule: gói `INACTIVE` không được chọn trong POS (**BR-PROD-02**).

**D. Quản lý khuyến mãi**

- **UC-PROMO-01 Tạo khuyến mãi**
  - Mục tiêu: tạo chương trình giảm giá theo thời gian/điều kiện.
  - Các kiểu phổ biến:
    - giảm % (vd 10%)
    - giảm số tiền cố định
    - “mua gói X tặng Y” (nếu có hỗ trợ)
- **UC-PROMO-02 Kích hoạt/tạm dừng khuyến mãi**
  - Mục tiêu: bật/tắt nhanh theo chiến dịch.
- **UC-PROMO-03 Áp khuyến mãi khi tạo hóa đơn**
  - Mục tiêu: POS tự gợi ý hoặc manager chọn khuyến mãi hợp lệ.
  - Ràng buộc:
    - chỉ áp khi còn hiệu lực (**BR-PROMO-01**)
    - không cộng dồn mặc định (**BR-PROMO-03**)
    - phải lưu snapshot discount để đối soát (**BR-POS-02**)

**C. Quản lý cơ sở vật chất (facility management) — theo chi nhánh**

- **UC-FAC-01 Quản lý khu vực (Area/Zone)**
  - Mục tiêu: tạo danh mục khu vực để gắn thiết bị.
- **UC-FAC-02 Thêm thiết bị/tài sản**
  - Mục tiêu: đăng ký thiết bị; cấp `asset_code` (QR/Barcode) theo branch.
- **UC-FAC-03 Cập nhật thông tin thiết bị**
- **UC-FAC-04 Cập nhật trạng thái thiết bị**
  - Trạng thái gợi ý: `ACTIVE`, `MAINTENANCE`, `BROKEN`, `RETIRED`.
- **UC-FAC-05 Tạo phiếu sự cố / yêu cầu sửa chữa**
- **UC-FAC-06 Cập nhật tiến độ xử lý sự cố**
  - Trạng thái gợi ý: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`.
- **UC-FAC-07 Lập lịch bảo trì định kỳ**
- **UC-FAC-08 Dashboard cơ sở vật chất**
  - Mục tiêu: số thiết bị theo trạng thái + ticket mở + lịch bảo trì sắp tới.

> Liên hệ check-in sinh trắc: cân InBody nên là 1 “asset”; nếu `BROKEN/MAINTENANCE` thì check-in phải cho phép **fallback nhập tay**.

**E. Tổng hợp đánh giá/nhận xét**

- **UC-MGR-REV-01 Xem tổng hợp đánh giá theo ca/HLV/thiết bị**
  - Mục tiêu: dashboard rating trung bình, số review, xu hướng theo thời gian.
- **UC-MGR-REV-02 Xử lý review bị báo cáo (moderation)**
  - Mục tiêu: ẩn/khôi phục review, ghi lý do, theo dõi khiếu nại.

**F. Quản lý nhân sự & ca (staff & shift assignment)**

- **UC-MGR-STAFF-01 Xem danh sách nhân sự của chi nhánh**
  - Mục tiêu: xem danh sách coach/thu ngân/nhân viên theo branch.
- **UC-MGR-STAFF-02 Thêm/vô hiệu hóa nhân sự (coach, thu ngân)**
  - Mục tiêu: onboarding/offboarding nhân sự tại chi nhánh.
  - Rule: vô hiệu hóa không xóa lịch sử; cần audit.
- **UC-MGR-STAFF-03 Phân công ca cho coach**
  - Mục tiêu: gán coach vào shift để coach xem “ca của tôi hôm nay”.
- **UC-MGR-STAFF-04 Xem lịch làm việc của coach**
  - Mục tiêu: xem timeline ca đã phân công để tránh trùng lịch/thiếu người.

#### Admin (quản trị hệ thống)

- **UC-ADMIN-01 Quản lý organization**
- **UC-ADMIN-02 Quản lý chi nhánh (branch)**
- **UC-ADMIN-03 Quản lý users (xem + đổi status)**
- **UC-ADMIN-04 Gán manager cho branch**
- **UC-ADMIN-05 Đăng ký staff (tạo staff profile + role)**
- **UC-ADMIN-06 Quản lý lịch ca (shift management)**
  - Mục tiêu: đảm bảo có shift để member check-in theo ngày/branch.
- **UC-ADMIN-07 Quản lý khuyến mãi toàn hệ thống (global promo)**
  - Mục tiêu: tạo/chỉnh global promo áp dụng nhiều chi nhánh.
- **UC-ADMIN-08 Cấu hình tham số hệ thống**
  - Mục tiêu: cấu hình các tham số và policy, ví dụ:
    - cửa sổ check-in \(W = 30\) phút (BR-SHIFT-01)
    - rate limit chat (BR-CHAT-02)
    - anti-spam review (BR-REV-02)
- **UC-ADMIN-REV-01 Xem báo cáo đánh giá toàn hệ thống**
  - Mục tiêu: tổng hợp rating theo chi nhánh, theo HLV, theo loại thiết bị.
- **UC-ADMIN-REV-02 Thiết lập chính sách review**
  - Mục tiêu: cấu hình rule anti-spam, moderation, ẩn từ khóa nhạy cảm (nếu cần).

## Active Docs

- [Project brief](docs/PROJECT_BRIEF.md): product scope, architecture, API groups, data model, current status, and next work.
- [Backend README](MYFIT-/README.md): backend setup, database workflow, migrations, tests, and deployment notes.
- [Frontend README](frontend/README.md): frontend setup and route map.
- [AI Nutrition note](docs/AI_NUTRITION.md): condensed planning note for the AI nutrition feature. This feature is not in the current codebase yet.
- [DeepSeek note](docs/DEEPSEEK.md): short local AI helper setup. Optional for development.

Older long-form Markdown files were consolidated and moved under `docs/archive/` or `MYFIT-/docs/archive/` so the root stays readable.

## Repository Layout

```text
MYFIT-/
  MYFIT-/        Backend service: Node.js HTTP API, PostgreSQL schema, tests, scripts
  frontend/      Next.js app for admin, manager, coach, and member workflows
  docs/          Compact project docs and archived legacy docs
  .agents/       Local agent/skill tooling data; not project documentation
```

## Quick Start

Backend:

```powershell
cd MYFIT-
npm install
npm run db:up
npm run db:bootstrap
npm run db:seed
npm start
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:3000`. Configure the API base URL in `frontend/.env.local` if the backend is not running on the expected local address.

## Verification

```powershell
cd MYFIT-
npm test
npm run runtime:check
npm run test:smoke

cd ..\frontend
npm run lint
npm run build
```

## Deployment (docker compose, full stack)

The repository ships a top-level `docker-compose.yml` that builds and runs **postgres + backend (Express) + frontend (Next.js standalone)** with a shared schema bootstrap.

### 1. Configure secrets

```bash
cp .env.example .env
# Edit .env and set strong ACCESS_TOKEN_SECRET / REFRESH_TOKEN_SECRET / POSTGRES_PASSWORD.
# Generate secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
```

### 2. Build & launch

```bash
docker compose up -d --build
docker compose ps              # wait for postgres healthy + backend listening
docker compose logs -f backend # tail logs to confirm startup preflight passes
```

Default ports:

| Service   | Port |
|-----------|------|
| Frontend  | 3001 |
| Backend   | 3000 |
| Postgres  | 5432 |

Override via `FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT` in `.env`.

### 3. Seed initial data (first run only)

```bash
docker compose exec backend node src/db/seed.js
```

This creates the seed admin (`admin@myfit.local` / `AdminPass123` — change immediately) and a sample branch + membership plan.

### 4. Smoke test

```bash
# Health check via login
curl -s http://localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@myfit.local","password":"AdminPass123"}' | jq

# Open the frontend
open http://localhost:3001
```

### 5. Updates

```bash
git pull
docker compose up -d --build  # rebuilds both images
```

### Production checklist

- [ ] Replace `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` with 64-byte random values.
- [ ] Replace `POSTGRES_PASSWORD`.
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` to your public API origin (HTTPS).
- [ ] Place a TLS reverse proxy (Caddy / Nginx / Traefik) in front of `backend` (3000) and `frontend` (3001). Do not expose Postgres publicly.
- [ ] Rotate the seeded admin password and remove the seed script from production runs.
- [ ] Replace the noop verification service ([noop-verification-service.js](MYFIT-/src/shared/infrastructure/noop-verification-service.js)) with a real SMTP/transactional sender before going live (auth flows currently no-op email).
- [ ] Configure a backup strategy for the `myfit-postgres-data` volume.

### Local dev without Docker

If you prefer running services on the host (faster reloads), keep `docker compose up -d postgres` for the database only and run backend/frontend with `npm` as in the Quick Start section.

