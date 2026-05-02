# MYFIT Requirements Phasing

Tai lieu nay tach toan bo Functional Requirements (FR) va Non-Functional Requirements (NFR) thanh 3 giai doan:
- MVP: bat buoc de co the go-live an toan va co gia tri kinh doanh som
- Phase 2: nen lam ngay sau go-live de hoan thien van hanh va trai nghiem
- Phase 3: nang cao, toi uu hoa, hoac phu thuoc du lieu/van hanh thuc te sau khi he thong da on dinh

Nguyen tac phan loai:
- Uu tien dong tien som, van hanh duoc, va compliance toi thieu
- Cat bot tinh nang co phu thuoc cao vao ben thu ba hoac AI nang cao kho kiem chung
- Giu kien truc MVP du mo rong duoc cho da chi nhanh, AI va ecommerce sau nay

## Functional Requirements

| Ma | Chuc nang | Phase | Ly do |
|---|---|---|---|
| AUTH-01 | Dang ky tai khoan | MVP | Cot loi de co nguoi dung moi; chi nen MVP voi email/password va it nhat 1 social login, de san mo rong Google/Zalo day du. |
| AUTH-02 | Dang nhap | MVP | Bat buoc cho moi actor; QR login co the de trong pham vi toi thieu hoac rollout sau neu tang do phuc tap. |
| AUTH-03 | Quen mat khau | MVP | Bat buoc de van hanh thuc te; lien quan truc tiep den support va bao mat tai khoan. |
| AUTH-04 | Phan quyen truy cap | MVP | Nen tang cua he thong da vai tro va da chi nhanh. |
| AUTH-05 | Quan ly phien dang nhap | Phase 2 | Quan trong nhung khong can chan go-live neu da co access token + refresh token an toan. |
| AUTH-06 | Xac thuc hai yeu to (2FA) | Phase 2 | Nen uu tien som cho Manager/Admin nhung co the sau MVP neu timeline 6 tuan chat. |
| CRM-01 | Quan ly thong tin ca nhan | MVP | Can de quan ly thanh vien, trial, va thong tin lien he. |
| CRM-02 | Quan ly goi tap | MVP | Can de ban goi, trial, va nang cap thanh vien. |
| CRM-03 | Nang cap trang thai thanh vien | MVP | Luong kinh doanh cot loi Guest -> Member. |
| CRM-04 | Gia han va bao luu goi tap | Phase 2 | Nghiep vu quan trong nhung co nhieu rule; co the xu ly tay trong giai doan dau. |
| CRM-05 | Lich su giao dich | Phase 2 | Co ich cho minh bach va CSKH, nhung khong can xay day du de go-live. |
| CRM-06 | Thong bao va nhac nho | Phase 2 | Gia tang retention; khong can hoan chinh trong MVP. |
| TRIAL-01 | Dang ky tap thu | MVP | Kenh dau vao kinh doanh quan trong. |
| TRIAL-02 | Gui thong bao den quan ly | MVP | Can de quy trinh tap thu hoat dong; co the MVP qua email/webhook, roi mo rong Zalo/Facebook sau. |
| TRIAL-03 | Xac nhan lich hen | Phase 2 | Nen co, nhung co phu thuoc SMS/email workflow chi tiet. |
| TRIAL-04 | Danh gia sau tap thu | Phase 3 | Khong anh huong luong van hanh chinh. |
| TRIAL-05 | Chuyen doi thanh vien | MVP | Core revenue flow sau trial. |
| CHECK-01 | Check-in buoi tap | MVP | Chuc nang cot loi cua member va trainer. |
| CHECK-02 | Xac thuc check-in GPS/QR | Phase 2 | Giam gian lan tot nhung tang phuc tap mobile/location/device. |
| CHECK-03 | Khong the xoa du lieu buoi tap | MVP | Rule nghiep vu va data integrity quan trong. |
| CHECK-04 | Hien thi lich tap | MVP | Gia tri nguoi dung cao, phuc tap vua phai. |
| CHECK-05 | Xem chi tiet ngay tap | MVP | Di cung voi lich tap va lich su buoi tap. |
| CHECK-06 | Diem danh tu dong so buoi da tap/con lai | MVP | Can de kiem soat goi tap va trainer/manager theo doi. |
| TRAIN-01 | Xem danh sach hoc vien theo ca | MVP | Core cho trainer van hanh tai phong tap. |
| TRAIN-02 | Xem lich tap ca nhan | Phase 2 | Nen co nhung co the thay bang danh sach ca ban dau. |
| TRAIN-03 | Theo doi tien trinh hoc vien | Phase 2 | Gia tri cao nhung phu thuoc du lieu va dashboard. |
| TRAIN-04 | Ghi chu va nhan xet | Phase 2 | Huu ich nhung khong can cho phien ban dau. |
| TRAIN-05 | Quan ly lich day | Phase 2 | Co do phuc tap scheduling/doi ca; de sau MVP. |
| TRAIN-06 | Thong ke hieu suat | Phase 3 | Can du lieu tich luy va KPI ro hon sau go-live. |
| STAT-01 | Thong ke ca nhan member | Phase 2 | Co gia tri, nhung MVP co the chi can lich su va bang don gian. |
| STAT-02 | Thong ke theo ca tap | Phase 2 | Quan trong cho Manager sau go-live. |
| STAT-03 | Thong ke theo chi nhanh | Phase 2 | Da chi nhanh nen co, nhung dashboard day du co the lam sau. |
| STAT-04 | Thong ke doanh thu | Phase 2 | Can sau khi giao dich va don hang da on dinh. |
| STAT-05 | Bao cao xuat Excel | Phase 3 | Tinh nang ho tro van hanh, co the bo sung sau. |
| STAT-06 | Dashboard truc quan | Phase 2 | Nen co sau khi du lieu on dinh, MVP co the dung bang/list don gian. |
| AI-01 | Chatbot hoi dap | Phase 2 | Gia tri tot nhung khong phai luong revenue/ops cot loi. |
| AI-02 | Tu van dinh duong ca nhan hoa | MVP+ | AI generate meal plans dua tren weight metrics ngay hom do; can guardrails va audit chat che. |
| AI-03 | Goi y bai tap | Phase 3 | Can mo hinh domain va guardrail ro hon. |
| AI-04 | Phan tich xu huong suc khoe | Phase 3 | Can du lieu lich su va logic canh bao chac chan. |
| AI-05 | Nhac nho thong minh | Phase 3 | Phu thuoc du lieu hanh vi va AI layer. |
| SHOP-01 | Xem danh sach san pham | Phase 2 | Nen mo rong sau khi flow gym core chay on. |
| SHOP-02 | Gio hang | Phase 2 | Di kem module ban hang; khong phai core release dau. |
| SHOP-03 | Thanh toan | Phase 2 | Nhanh phat sinh phuc tap compliance/payment integration. |
| SHOP-04 | Quan ly don hang | Phase 2 | Can neu co commerce, nhung khong bat buoc cho gym-core MVP. |
| SHOP-05 | Quan ly san pham | Phase 2 | Thuoc module commerce, de sau khi core on dinh. |
| SHOP-06 | Thong ke ban hang | Phase 3 | Can sau khi commerce co du lieu. |
| BRANCH-01 | Quan ly chi nhanh | MVP | Bat buoc vi he thong da chi nhanh. |
| BRANCH-02 | Phan cong quan ly | MVP | Can cho RBAC theo chi nhanh. |
| BRANCH-03 | Xem du lieu theo chi nhanh | MVP | Rule scope quan trong cho Manager/Admin. |
| BRANCH-04 | Chuyen chi nhanh tap | Phase 2 | Co nhieu quy tac nghiep vu; chua can cho go-live. |
| BRANCH-05 | Thong ke so sanh chi nhanh | Phase 3 | Dashboard nang cao sau khi co du lieu. |
| ADMIN-01 | Quan ly nguoi dung | MVP | Bat buoc cho van hanh, khoa/mo khoa, reset tai khoan. |
| ADMIN-02 | Quan ly goi tap | MVP | Core cho kinh doanh va CRM. |
| ADMIN-03 | Cau hinh he thong | Phase 2 | Can nhung co the de config file/admin seed ban dau. |
| ADMIN-04 | Nhat ky hoat dong | MVP | Bat buoc cho security va truy vet. |
| ADMIN-05 | Sao luu va phuc hoi | MVP | NFR reliability quan trong; co the bat dau bang co che backup managed. |
| ADMIN-06 | Quan ly thong bao | Phase 2 | Huu ich nhung chua can he thong hoan chinh trong dot dau. |
| NUTRI-01 | Xem weight metrics ngay hom do | Phase 2 | Can de AI generate meal plans dua tren du lieu real-time. |
| NUTRI-02 | Generate daily meal plan bang AI | Phase 2 | Core feature cua nutrition advisor; can guardrails va audit. |
| NUTRI-03 | Xem meal plan da generate | Phase 2 | Member xem thuc don duoc de xuat cho ngay. |
| NUTRI-04 | Danh gia/phan hoi meal plan | Phase 2 | Thu thap feedback de cai thien AI recommendations. |
| NUTRI-05 | Nutrition goals va preferences | Phase 2 | User set muc tieu dinh duong (calories, macros, dietary restrictions). |
| NUTRI-06 | Meal consumption tracking | Phase 2 | Theo doi actual intake vs recommended plan. |

## Non-Functional Requirements

| Ma | Yeu cau | Phase | Ly do |
|---|---|---|---|
| SEC-01 | Ma hoa du lieu | MVP | Bat buoc ngay tu dau vi co tai khoan va du lieu suc khoe. |
| SEC-02 | Xac thuc da kenh | MVP | Toi thieu can email/password va mo rong social auth som; 2FA day du co the rollout ngay sau MVP neu can. |
| SEC-03 | Phan quyen truy cap | MVP | Khong the de sau vi lien quan den an toan du lieu. |
| SEC-04 | Bao ve API | MVP | Bat buoc cho production-facing system. |
| SEC-05 | Chong tan cong | MVP | Phan nen secure coding khong duoc tri hoan. |
| SEC-06 | Nhat ky an ninh | MVP | Can cho truy vet su co va compliance. |
| PERF-01 | Thoi gian tai trang < 2 giay | MVP | Muc tieu nen dat tu dau o cac luong chinh. |
| PERF-02 | API p95 < 300ms | MVP | Dat target cho luong chinh ngay tu phase dau. |
| PERF-03 | 500+ user dong thoi | Phase 2 | Nen kiem chung sau khi co traffic va baseline. |
| PERF-04 | 100+ check-in dong thoi | MVP | Rat lien quan gio cao diem tai phong tap; can thiet ke transaction/idempotency tu dau. |
| PERF-05 | Toi uu database | MVP | Can tu dau de tranh no ky thuat. |
| AVAIL-01 | Uptime 99.5% | Phase 2 | Co the huong toi ngay tu dau, nhung SLA chinh thuc thuong sau khi van hanh on dinh. |
| AVAIL-02 | Sao luu du lieu | MVP | Bat buoc ngay tu release dau. |
| AVAIL-03 | RTO < 4h, RPO < 1h | Phase 2 | Can quy trinh DR va van hanh truong thanh hon. |
| AVAIL-04 | Xu ly loi than thien | MVP | Quan trong cho UX va support. |
| SCALE-01 | Mo rong chi nhanh | MVP | Can tu dau vi bai toan da chi nhanh. |
| SCALE-02 | Scale ngang | Phase 2 | Kien truc nen ho tro san, nhung trien khai day du de sau. |
| SCALE-03 | Modular, de them tinh nang | MVP | Quy tac kien truc can dat tu dau. |
| USE-01 | Responsive | MVP | Nguoi dung gym se dung mobile nhieu. |
| USE-02 | UI truc quan | MVP | Anh huong truc tiep adoption. |
| USE-03 | Da ngon ngu | Phase 2 | MVP co the uu tien tieng Viet, them tieng Anh sau. |
| USE-04 | Accessibility WCAG 2.1 AA | Phase 2 | Nen huong toi ngay tu dau, nhung compliance day du can them thoi gian polish. |
| USE-05 | Onboarding | Phase 2 | Huu ich, nhung co the de sau khi luong chinh on dinh. |
| MAINT-01 | Ma nguon sach | MVP | Nen tang cho phat trien ben vung. |
| MAINT-02 | Tai lieu API va trien khai | MVP | Can cho team phat trien, test, va van hanh. |
| MAINT-03 | Logging tap trung | MVP | Can cho debug va van hanh. |
| MAINT-04 | Monitoring | MVP | Toi thieu can error tracking va alert can ban truoc go-live. |
| COMP-01 | Bao ve du lieu ca nhan | MVP | Bat buoc do xu ly PII va health data tai Viet Nam. |
| COMP-02 | Han che truy cap du lieu suc khoe | MVP | Rule cot loi cua he thong. |
| COMP-03 | Thanh toan qua cong hop phap | Phase 2 | Kich hoat khi bat dau module thanh toan online. |

## Tong hop theo phase

### MVP

Muc tieu:
- Go-live an toan cho nghiep vu cot loi: auth, quan ly goi tap, trial booking, guest-to-member conversion, workout check-in immutable, trainer xem hoc vien theo ca, admin van hanh co ban, da chi nhanh, audit, backup.

FR trong MVP:
- AUTH-01, AUTH-02, AUTH-03, AUTH-04
- CRM-01, CRM-02, CRM-03
- TRIAL-01, TRIAL-02, TRIAL-05
- CHECK-01, CHECK-03, CHECK-04, CHECK-05, CHECK-06
- TRAIN-01
- BRANCH-01, BRANCH-02, BRANCH-03
- ADMIN-01, ADMIN-02, ADMIN-04, ADMIN-05

NFR trong MVP:
- SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
- PERF-01, PERF-02, PERF-04, PERF-05
- AVAIL-02, AVAIL-04
- SCALE-01, SCALE-03
- USE-01, USE-02
- MAINT-01, MAINT-02, MAINT-03, MAINT-04
- COMP-01, COMP-02

### Phase 2

Muc tieu:
- Hoan thien trai nghiem van hanh, thong ke, social/notification flow day du, va module commerce co kiem soat.

FR trong Phase 2:
- AUTH-05, AUTH-06
- CRM-04, CRM-05, CRM-06
- TRIAL-03
- CHECK-02
- TRAIN-02, TRAIN-03, TRAIN-04, TRAIN-05
- STAT-01, STAT-02, STAT-03, STAT-04, STAT-06
- AI-01
- NUTRI-01, NUTRI-02, NUTRI-03, NUTRI-04, NUTRI-05, NUTRI-06
- SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05
- BRANCH-04
- ADMIN-03, ADMIN-06

NFR trong Phase 2:
- PERF-03
- AVAIL-01, AVAIL-03
- SCALE-02
- USE-03, USE-04, USE-05
- COMP-03

### Phase 3

Muc tieu:
- AI nang cao, dashboard va reporting chuyen sau, toi uu hoa doanh thu va du lieu.

FR trong Phase 3:
- TRIAL-04
- TRAIN-06
- STAT-05
- AI-02, AI-03, AI-04, AI-05
- SHOP-06
- BRANCH-05

NFR trong Phase 3:
- Khong co NFR nao nen de den Phase 3 de moi bat dau; Phase 3 chu yeu la nang muc do truong thanh va toi uu van hanh dua tren du lieu thuc te.

## Ghi chu quan trong

- AUTH-01 va AUTH-02 trong MVP nen uu tien email/password + 1 social login truoc; Google va Zalo co the rollout lech pha neu team bi gioi han thoi gian.
- SHOP-03 khong nen dua vao MVP neu chua chot cong thanh toan va quy trinh doi soat; tranh mo rong compliance qua som.
- AI-02 (nutrition advisor) duoc move len Phase 2 voi scope han che: chi generate meal plans dua tren weight metrics, khong phai medical advice. Can them guardrails, disclaimers, va audit logs chat che.
- AI-03 den AI-05 khong nen dua som vi can governance cho du lieu suc khoe, chat luong goi y, va telemetry danh gia.
- CHECK-02 co the bat dau bang QR code noi bo o Phase 2; GPS thuong onhieu device/browser edge case hon.
- AVAIL-01 va SCALE-02 nen duoc thiet ke san trong kien truc MVP, nhung chi can dau tu day du sau khi co traffic that.
