# MYFIT Assumptions and Decisions

Tai lieu nay dung de khoa cac gia dinh va quyet dinh kien truc trong suot vong doi MVP.
Moi thay doi scope hoac implementation anh huong den architecture/contracts phai cap nhat file nay truoc hoac cung luc.

## 1. Active assumptions

| ID | Assumption | Why now | Risk if wrong | Owner | Review trigger |
|---|---|---|---|---|---|
| A-001 | MVP uu tien email/password va 1 social provider; Zalo co the defer neu integration cham. | Giam rui ro timeline 6 tuan. | Auth UX va social acquisition bi anh huong. | TBD | Khi auth implementation bat dau |
| A-002 | Membership activation trong MVP co the xac nhan thanh toan thu cong. | Giu core revenue flow ma chua can payment gateway online. | Van hanh thu cong tang tai cho manager. | TBD | Khi mo rong sang ecommerce/payment |
| A-003 | Notification manager trong MVP uu tien email; Zalo/Facebook la future hook. | Giam rui ro third-party integration. | Trial response time co the kem hon kenh chat. | TBD | Khi trial volume tang |
| A-004 | Check-in anti-fraud GPS/QR chua vao MVP, chi giu extension hook. | Giu check-in flow don gian va on dinh. | Co the co abuse nhe trong giai doan dau. | TBD | Khi co dau hieu gian lan |
| A-005 | Member chi co 1 subscription active tai 1 thoi diem. | Don gian hoa validation va attendance accounting. | Can migrate rule neu business cho chong goi. | TBD | Khi co yeu cau bundle/stacked plans |

## 2. Decisions log

| ID | Decision | Why now | Alternatives considered | Consequences | Revisit trigger |
|---|---|---|---|---|---|
| D-001 | Chon modular monolith cho MVP. | Toi uu toc do giao hang va giam overhead van hanh. | Microservices, modulith + BFF. | Don gian hon cho MVP, can ky luat boundary. | Khi team va traffic tang ro rang |
| D-002 | Chon PostgreSQL la source of truth. | Phu hop giao dich, audit, consistency. | MongoDB, MySQL. | Schema va transaction ro rang hon. | Khi workload thay doi dang ke |
| D-003 | Workout session la immutable sau khi tao. | Bao ve data integrity va auditability. | Update in place. | Can co append-only note/correction pattern. | Khi nghiep vu yeu cau corrections phuc tap |
| D-004 | Branch-scoped RBAC thay vi tenant-per-database. | MVP da chi nhanh nhung chua den muc multi-tenant tach vat ly. | Tenant-per-db, tenant-per-schema. | Don gian hon, can guard chat query scope. | Khi compliance/enterprise demand tang |
| D-005 | Audit events la bat buoc cho auth, conversion, attendance, admin changes. | Health data va operations nhay cam. | Logging toi thieu. | Tang chi phi logging nhung de truy vet. | Khi retention va compliance can dieu chinh |

## 3. Open questions

| ID | Question | Impacted artifact | Needed by phase |
|---|---|---|---|
| Q-001 | Co bat buoc Zalo auth trong MVP hay chi can Google + email/password? | Security/Auth contract | Before auth build |
| Q-002 | Membership co cho bao luu/gia han ngay trong MVP khong? | Data model, API contracts | Before membership contract |
| Q-003 | Health data nao trainer duoc xem day du, data nao phai mask? | Security/Auth contract | Before RBAC matrix |
| Q-004 | Trainer roster co can filter theo room/pt-specific assignment hay chi shift? | API contracts | Before trainer module |

## 4. Update rules

- Moi assumption phai co `review trigger`.
- Neu assumption bi vo, cap nhat lai architecture/contracts truoc khi code tiep.
- Moi decision phai co `alternatives considered` va `revisit trigger`.
- Khong dung file nay de viet backlog; file nay chi de khoa ly do va boundary.
