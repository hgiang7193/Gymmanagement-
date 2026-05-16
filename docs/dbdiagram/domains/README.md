# MYFIT Domain DBML

Generated from `docs/dbdiagram/myfit-domain-erd.dbml`.
Domain structure mirrors the LaTeX database specification (13 nhóm).

## Files

| File | Nhóm | Tables | Internal refs | Cross-domain refs |
|------|------|--------|---------------|-------------------|
| 01-auth-user.dbml | Nhóm 1: Người dùng & phân quyền | 8 | 7 | 47 (commented) |
| 02-org-branches.dbml | Nhóm 2: Tổ chức & chi nhánh | 4 | 3 | 20 (commented) |
| 03-membership.dbml | Nhóm 3: Gói tập hội viên | 4 | 3 | 8 (commented) |
| 04-course.dbml | Nhóm 4: Gói tập theo buổi | 2 | 1 | 4 (commented) |
| 05-shifts-attendance.dbml | Nhóm 5: Ca tập & điểm danh | 3 | 2 | 9 (commented) |
| 06-trial.dbml | Nhóm 6: Tập thử & chuyển đổi | 2 | 1 | 4 (commented) |
| 07-pt.dbml | Nhóm 7: Huấn luyện viên riêng (PT) | 3 | 2 | 5 (commented) |
| 08-billing.dbml | Nhóm 8: Thanh toán & hóa đơn | 5 | 4 | 7 (commented) |
| 09-health.dbml | Nhóm 9: Sức khỏe & chỉ số cơ thể | 3 | 0 | 6 (commented) |
| 10-feedback.dbml | Nhóm 10: Đánh giá & hỗ trợ | 4 | 1 | 9 (commented) |
| 11-facility.dbml | Nhóm 11: Cơ sở vật chất | 5 | 5 | 10 (commented) |

## Design decisions

- Each file is standalone for dbdiagram.io — cross-domain refs are commented out.
- `class_attendance.branch_id` removed (redundant via `enrollment_id → course_enrollments.branch_id`).
- `trainer_assignments.branch_id` removed (redundant via `shift_id → shifts.branch_id`).
- `pt_enrollments` added to track sessions_remaining at enrollment level (mirrors course pattern).
- `invoice_items` added to enable billing traceability per product.
- Meal/nutrition AI tables (Phase 2) are excluded from these diagrams.
