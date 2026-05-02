create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  status text not null,
  email_verified_at timestamptz null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists profiles (
  id text primary key,
  user_id text not null references users(id),
  full_name text null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists roles (
  id text primary key,
  code text unique not null,
  name text not null
);

create table if not exists user_role_assignments (
  id text primary key,
  user_id text not null references users(id),
  role_id text not null references roles(id),
  branch_id text null,
  assigned_at timestamptz not null
);

create table if not exists refresh_sessions (
  id text primary key,
  user_id text not null references users(id),
  token text unique not null,
  revoked_at timestamptz null,
  created_at timestamptz not null
);

create table if not exists password_reset_tokens (
  id text primary key,
  user_id text not null references users(id),
  token text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null
);

create table if not exists organizations (
  id text primary key,
  name text not null,
  tax_id text null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists branches (
  id text primary key,
  organization_id text null references organizations(id),
  code text unique not null,
  name text not null,
  address text not null,
  phone_number text null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists branch_manager_assignments (
  id text primary key,
  branch_id text not null references branches(id),
  manager_user_id text not null references users(id),
  active_from timestamptz not null,
  active_to timestamptz null,
  created_at timestamptz not null
);

create unique index if not exists uq_branch_manager_assignment_active
  on branch_manager_assignments (branch_id, manager_user_id)
  where active_to is null;

create table if not exists membership_plans (
  id text primary key,
  code text unique not null,
  name text not null,
  price bigint not null,
  duration_days integer not null,
  total_sessions integer not null,
  is_active boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id text primary key,
  user_id text not null references users(id),
  membership_plan_id text not null references membership_plans(id),
  home_branch_id text not null references branches(id),
  status text not null,
  started_at timestamptz not null,
  expires_at timestamptz not null,
  total_sessions integer not null,
  sessions_used integer not null,
  sessions_remaining integer not null,
  activated_by text not null references users(id),
  activated_at timestamptz not null
);

create table if not exists subscription_status_history (
  id text primary key,
  subscription_id text not null references subscriptions(id),
  from_status text null,
  to_status text not null,
  changed_by text not null references users(id),
  reason text null,
  created_at timestamptz not null
);

create table if not exists trial_bookings (
  id text primary key,
  guest_user_id text null references users(id),
  full_name text not null,
  phone_number text not null,
  email text not null,
  branch_id text not null references branches(id),
  trial_plan_name text not null,
  scheduled_at timestamptz not null,
  status text not null,
  notes text null,
  converted_subscription_id text null references subscriptions(id),
  converted_at timestamptz null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_trial_bookings_branch_scheduled
  on trial_bookings (branch_id, scheduled_at desc);

create table if not exists trial_status_history (
  id text primary key,
  trial_booking_id text not null references trial_bookings(id),
  from_status text null,
  to_status text not null,
  changed_by text not null references users(id),
  created_at timestamptz not null
);

create table if not exists audit_logs (
  id text primary key,
  actor_user_id text null references users(id),
  action_code text not null,
  entity_type text null,
  entity_id text null,
  branch_id text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null
);

create table if not exists security_events (
  id text primary key,
  user_id text null references users(id),
  event_type text not null,
  severity text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null
);

-- ==========================================
-- STAFF & OPERATIONS
-- ==========================================

create table if not exists staff_profiles (
  id text primary key,
  user_id text not null references users(id),
  employee_code text unique not null,
  job_title text not null,
  primary_branch_id text not null references branches(id),
  hire_date date not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index if not exists uq_staff_profiles_user_id
  on staff_profiles (user_id);

create table if not exists member_check_ins (
  id text primary key,
  user_id text not null references users(id),
  branch_id text not null references branches(id),
  subscription_id text null references subscriptions(id),
  check_in_time timestamptz not null,
  created_by text null references users(id),
  created_at timestamptz not null
);

-- ==========================================
-- PT & TRAINING
-- ==========================================

create table if not exists pt_packages (
  id text primary key,
  code text unique not null,
  name text not null,
  price bigint not null,
  total_sessions integer not null,
  is_active boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists pt_sessions (
  id text primary key,
  member_user_id text not null references users(id),
  trainer_user_id text not null references users(id),
  pt_package_id text null references pt_packages(id),
  branch_id text not null references branches(id),
  scheduled_at timestamptz not null,
  status text not null, -- scheduled, completed, cancelled, no_show
  attended_at timestamptz null,
  notes text null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- ==========================================
-- BILLING & PAYMENTS
-- ==========================================

create table if not exists invoices (
  id text primary key,
  invoice_number text unique not null,
  user_id text not null references users(id),
  branch_id text not null references branches(id),
  total_amount bigint not null,
  status text not null, -- pending, paid, cancelled
  due_date timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists payments (
  id text primary key,
  invoice_id text not null references invoices(id),
  amount bigint not null,
  payment_method text not null, -- cash, transfer, pos
  status text not null, -- success, failed
  transaction_ref text null,
  processed_at timestamptz not null,
  created_by text not null references users(id)
);

-- ==========================================
-- MEMBER PROGRESS & HEALTH TRACKING
-- ==========================================

create table if not exists member_health_profiles (
  id text primary key,
  user_id text not null references users(id),
  date_of_birth date null,
  gender text null,
  height_cm numeric(5, 2) null,
  primary_goal text null,
  medical_conditions text null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index if not exists uq_member_health_profiles_user_id
  on member_health_profiles (user_id);

create table if not exists member_weight_logs (
  id text primary key,
  user_id text not null references users(id),
  weight_kg numeric(5, 2) not null,
  measured_at timestamptz not null,
  measurement_source text not null, -- 'manual', 'inbody', etc.
  device_id text null,
  note text null,
  created_by text not null references users(id),
  created_at timestamptz not null
);

create table if not exists member_body_measurements (
  id text primary key,
  user_id text not null references users(id),
  measurement_type text not null, -- 'waist', 'chest', 'body_fat_percentage', etc.
  value numeric(6, 2) not null,
  unit text not null, -- 'cm', '%', etc.
  measured_at timestamptz not null,
  measurement_source text not null,
  created_by text not null references users(id),
  created_at timestamptz not null
);

-- ==========================================
-- AI NUTRITION & MEAL PLANNING (Phase 2)
-- ==========================================

create table if not exists member_nutrition_goals (
  id text primary key,
  user_id text not null references users(id),
  daily_calories_target integer not null,
  protein_grams_target numeric(6,2) not null,
  carbs_grams_target numeric(6,2) not null,
  fat_grams_target numeric(6,2) not null,
  dietary_restrictions jsonb not null default '[]'::jsonb, -- ['vegetarian', 'vegan', 'gluten_free', etc.]
  allergies jsonb not null default '[]'::jsonb, -- ['peanuts', 'shellfish', etc.]
  preferences jsonb not null default '{}'::jsonb, -- {'cuisine_types': ['asian', 'mediterranean'], 'avoid_ingredients': [...]}
  goal_type text not null, -- 'weight_loss', 'muscle_gain', 'maintenance', 'athletic_performance'
  activity_level text not null, -- 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
  created_by text not null references users(id),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index if not exists uq_member_nutrition_goals_user_id
  on member_nutrition_goals (user_id);

create table if not exists daily_meal_plans (
  id text primary key,
  user_id text not null references users(id),
  plan_date date not null,
  total_calories integer not null,
  total_protein numeric(6,2) not null,
  total_carbs numeric(6,2) not null,
  total_fat numeric(6,2) not null,
  generated_by_ai boolean not null default true,
  ai_model_version text null, -- e.g., 'gpt-4-turbo-2024-04-09', 'claude-3-opus'
  ai_prompt_tokens integer null,
  ai_completion_tokens integer null,
  status text not null, -- 'draft', 'approved', 'consumed', 'rejected'
  user_feedback text null, -- user's rating or comments
  user_feedback_score integer null, -- 1-5 stars
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint uq_daily_meal_plan_unique unique (user_id, plan_date)
);

create index if not exists idx_daily_meal_plans_user_date
  on daily_meal_plans (user_id, plan_date desc);

create table if not exists meals (
  id text primary key,
  daily_meal_plan_id text not null references daily_meal_plans(id) on delete cascade,
  meal_type text not null, -- 'breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'
  meal_name text not null,
  description text null,
  calories integer not null,
  protein numeric(6,2) not null,
  carbs numeric(6,2) not null,
  fat numeric(6,2) not null,
  preparation_time_minutes integer null,
  cooking_instructions text null,
  source text not null, -- 'ai_generated', 'user_custom', 'recipe_database'
  recipe_id text null, -- reference to recipe if based on template
  sort_order integer not null default 0,
  created_at timestamptz not null
);

create index if not exists idx_meals_daily_plan_id
  on meals (daily_meal_plan_id);

create table if not exists meal_items (
  id text primary key,
  meal_id text not null references meals(id) on delete cascade,
  item_name text not null,
  quantity numeric(8,2) not null,
  unit text not null, -- 'g', 'ml', 'cup', 'piece', etc.
  calories numeric(8,2) not null,
  protein numeric(8,2) not null,
  carbs numeric(8,2) not null,
  fat numeric(8,2) not null,
  notes text null,
  created_at timestamptz not null
);

create index if not exists idx_meal_items_meal_id
  on meal_items (meal_id);

create table if not exists recipes (
  id text primary key,
  name text not null,
  description text null,
  category text not null, -- 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'
  cuisine_type text null, -- 'vietnamese', 'asian', 'western', 'mediterranean', etc.
  difficulty_level text not null, -- 'easy', 'medium', 'hard'
  preparation_time_minutes integer not null,
  cooking_time_minutes integer not null,
  servings integer not null default 1,
  calories_per_serving integer not null,
  protein_per_serving numeric(6,2) not null,
  carbs_per_serving numeric(6,2) not null,
  fat_per_serving numeric(6,2) not null,
  dietary_tags jsonb not null default '[]'::jsonb, -- ['vegetarian', 'high_protein', 'low_carb', etc.]
  is_active boolean not null default true,
  created_by text not null references users(id),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_recipes_category
  on recipes (category);

create index if not exists idx_recipes_dietary_tags
  on recipes using gin (dietary_tags);

create table if not exists recipe_ingredients (
  id text primary key,
  recipe_id text not null references recipes(id) on delete cascade,
  ingredient_name text not null,
  quantity numeric(8,2) not null,
  unit text not null,
  calories numeric(8,2) not null,
  protein numeric(8,2) not null,
  carbs numeric(8,2) not null,
  fat numeric(8,2) not null,
  notes text null,
  sort_order integer not null default 0,
  created_at timestamptz not null
);

create index if not exists idx_recipe_ingredients_recipe_id
  on recipe_ingredients (recipe_id);

create table if not exists meal_consumption_logs (
  id text primary key,
  user_id text not null references users(id),
  meal_id text null references meals(id), -- null if custom meal not from plan
  consumed_at timestamptz not null,
  actual_calories numeric(8,2) null,
  actual_protein numeric(8,2) null,
  actual_carbs numeric(8,2) null,
  actual_fat numeric(8,2) null,
  portion_multiplier numeric(4,2) not null default 1.0, -- 0.5 = half portion, 1.5 = 1.5x portion
  notes text null,
  logged_by text not null references users(id),
  created_at timestamptz not null
);

create index if not exists idx_meal_consumption_logs_user_date
  on meal_consumption_logs (user_id, consumed_at desc);

create table if not exists ai_meal_generation_logs (
  id text primary key,
  user_id text not null references users(id),
  request_date date not null,
  ai_model text not null, -- 'gpt-4', 'claude-3', 'deepseek-chat', etc.
  prompt_text text null, -- truncated prompt sent to AI
  response_text text null, -- raw AI response before parsing
  prompt_tokens integer null,
  completion_tokens integer null,
  total_cost_usd numeric(10,6) null, -- cost of this API call
  generation_duration_ms integer null,
  success boolean not null,
  error_message text null,
  daily_meal_plan_id text null references daily_meal_plans(id),
  created_at timestamptz not null
);

create index if not exists idx_ai_meal_generation_logs_user_date
  on ai_meal_generation_logs (user_id, request_date desc);