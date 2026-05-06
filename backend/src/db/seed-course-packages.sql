-- Seed course packages with 3 options
-- Pricing strategy: More sessions = lower price per session (volume discount)

INSERT INTO course_packages (id, code, name, total_sessions, price_per_session, total_price, description, is_active)
VALUES
  (
    'pkg-course-30',
    'COURSE-30',
    'Gói 30 buổi',
    30,
    150000, -- 150k/buổi
    4500000, -- Tổng 4.5 triệu
    'Gói cơ bản dành cho người mới bắt đầu. Giá 150,000đ/buổi.',
    true
  ),
  (
    'pkg-course-60',
    'COURSE-60',
    'Gói 60 buổi',
    60,
    120000, -- 120k/buổi (giảm 20%)
    7200000, -- Tổng 7.2 triệu
    'Gói tiêu chuẩn với ưu đãi 20%. Giá 120,000đ/buổi. Tiết kiệm 1,800,000đ so với gói 30.',
    true
  ),
  (
    'pkg-course-90',
    'COURSE-90',
    'Gói 90 buổi',
    90,
    100000, -- 100k/buổi (giảm 33% so với 30)
    9000000, -- Tổng 9 triệu
    'Gói cao cấp với ưu đãi tốt nhất - giảm 33%. Giá 100,000đ/buổi. Tiết kiệm 4,500,000đ so với gói 30.',
    true
  )
ON CONFLICT (code) DO UPDATE
SET 
  price_per_session = EXCLUDED.price_per_session,
  total_price = EXCLUDED.total_price,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify insertion
SELECT 
  code,
  name,
  total_sessions,
  price_per_session,
  total_price,
  description
FROM course_packages
ORDER BY total_sessions ASC;
