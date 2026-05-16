# MYFIT Future Roadmap - V2 & Beyond

> **Version**: 1.0  
> **Date**: 2026-05-14  
> **Status**: Planned for V2.0+ (not in MVP scope)  
> **Audience**: Thesis committee, future developers, product stakeholders

---

## Vision Statement

**MYFIT MVP (V1.0)** focuses on core gym operations: authentication, check-in, billing, and health tracking.

**MYFIT V2.0+** will evolve into an **AI-powered wellness platform** by integrating intelligent features that leverage the data foundation built in V1.

---

## V1.0 MVP - Foundation (Current Status ✅ COMPLETE)

### Core Capabilities
- ✅ User authentication + multi-role RBAC
- ✅ Member check-in with biometric capture
- ✅ Trial booking + funnel tracking
- ✅ Package management + POS billing
- ✅ Health tracking (weight, BMI, goals)
- ✅ Review & rating system
- ✅ Multi-branch management
- ✅ Comprehensive audit trail

### Data Ready for AI
- ✅ Nutrition profiles schema (ready to populate)
- ✅ Member preferences (dietary, allergies, budget)
- ✅ Health history (weight trends, body metrics)
- ✅ Engagement data (visit frequency, class attendance)

---

## V2.0 - AI Chatbot for Nutrition (Planned)

### Goal
Empower members to get **personalized nutrition guidance** powered by AI, increasing member retention and wellness outcomes.

### Features

#### 2.1 Nutrition Profile Builder
**When**: Member creates account or edits health profile  
**Data captured**:
```json
{
  "member_id": "m-123",
  "nutrition_profile": {
    "dietary_goals": "weight_loss",  // weight_loss, muscle_gain, maintenance
    "dietary_restrictions": ["vegetarian", "gluten_free"],
    "allergies": ["shellfish", "peanuts"],
    "food_preferences": ["asian_cuisine", "low_carb"],
    "budget_per_day": 200000,  // VND
    "cooking_time_available": "30_minutes",
    "meal_frequency": 3
  }
}
```

**Database**: `nutrition_profiles` table (design ready in DB schema)

---

#### 2.2 AI Meal Plan Generation Endpoint
**Endpoint**: `POST /api/v1/nutrition/generate-plan`

**Request**:
```json
{
  "nutrition_profile_id": "np-456",
  "goal_calories": 2000,
  "goal_macros": {
    "protein_g": 150,
    "carbs_g": 200,
    "fat_g": 67
  },
  "num_days": 7
}
```

**Process**:
1. **Fetch member profile** from database
2. **Call AI provider** (OpenAI GPT-4 or Google Gemini):
   ```
   "Create a 7-day meal plan for a Vietnamese member:
   - Dietary goals: weight loss
   - Restrictions: [vegetarian, gluten-free]
   - Allergies: [shellfish, peanuts]
   - Budget: 200k VND/day
   - Cooking time: 30 minutes
   - Macros: 150g protein, 200g carbs, 67g fat
   Return JSON with: meals[], nutritional_summary"
   ```
3. **Validate output** (schema + safety checks)
4. **Save plan** to `meal_plans` table
5. **Return to frontend** for member review

**Response**:
```json
{
  "id": "mp-789",
  "status": "generated",
  "start_date": "2026-05-15",
  "end_date": "2026-05-21",
  "meals": [
    {
      "day": 1,
      "meal_type": "breakfast",
      "dish": "Cơm tấm với cà chua & khoai lang luộc",
      "calories": 450,
      "macros": {"protein": 15, "carbs": 75, "fat": 8}
    },
    ...
  ],
  "daily_summary": {
    "total_calories": 2000,
    "total_protein": 150,
    "total_carbs": 200,
    "total_fat": 67
  }
}
```

**Database**: `meal_plans` table + `meal_plan_items` for detailed meals

---

#### 2.3 Plan Review & Feedback Loop
**Member can**:
- ✅ Approve plan (activate as active meal plan)
- ✅ Request regeneration (different preferences)
- ✅ Provide feedback on specific meals (too expensive, dislike)
- ✅ Rate plan (5-star rating)

**Database**: `nutrition_feedback` table

---

#### 2.4 Coach Review (Optional)
**Coach can**:
- ✅ Review member's active plan
- ✅ Suggest modifications based on fitness goals
- ✅ Approve plan before member follows

**Governance**: Add permission in `user_role_assignments` for COACH access to nutrition data

---

### Safety & Risk Mitigation

#### Why Not "MVP" Feature?
1. **Complex domain**: Nutritional science is high-stakes (allergies, medical conditions)
2. **Regulatory**: May require nutritionist certification in some jurisdictions
3. **Cost**: AI token costs variable; need budget allocation
4. **UX maturity**: Need user testing before launch
5. **MVP = Scope Control**: MVP focuses on proven core features

#### Risk Mitigations for V2.0

**Risk 1: AI Model Hallucination**
- ❌ Never rely on AI alone for allergen checks
- ✅ **Mitigation**: Enforce strict validation against `nutrition_profiles.allergies`
  ```typescript
  // Validate AI output against member allergies
  const generatedMeals = parseAIResponse(aiOutput);
  const memberAllergies = member.nutrition_profile.allergies;
  
  generatedMeals.forEach(meal => {
    const intersection = findCommonIngredients(meal.ingredients, memberAllergies);
    if (intersection.length > 0) {
      throw new Error(`AI generated plan with allergens: ${intersection}`);
    }
  });
  ```

**Risk 2: Cost Overrun**
- ❌ Unlimited AI API calls
- ✅ **Mitigation**: Per-user rate limits + cost monitoring
  ```typescript
  // Rate limit: 5 generations per member per month
  const recentGenerations = await mealPlanRepo.countRecentByMember(
    memberId, 
    '30 days'
  );
  if (recentGenerations >= 5) {
    throw new RateLimitError('Max meal plans generated this month');
  }
  
  // Log costs for budget tracking
  await aiUsageLog.create({
    provider: 'openai',
    model: 'gpt-4',
    tokens_used: completion.usage.total_tokens,
    cost_usd: completion.usage.total_tokens * 0.0005,
    member_id: memberId
  });
  ```

**Risk 3: API Failures**
- ❌ Cascade failure if AI provider down
- ✅ **Mitigation**: Graceful degradation + fallback
  ```typescript
  try {
    const plan = await generateAIMealPlan(memberId);
    return plan;
  } catch (error) {
    if (error instanceof AIProviderError) {
      // Return template plan instead
      return generateTemplateHealthyMealPlan(member);
    }
    throw error;
  }
  ```

**Risk 4: Data Privacy**
- ❌ Sending raw member data to 3rd-party AI
- ✅ **Mitigation**: De-identify before sending
  ```typescript
  // Send only essential info (no names, emails)
  const prompt = `
    Member profile (pseudonymized):
    - Goal: ${member.nutrition_profile.goal}
    - Allergies: ${member.nutrition_profile.allergies}
    - Budget: ${member.nutrition_profile.budget}
    - Preferences: ${member.nutrition_profile.preferences}
    
    DO NOT include: member name, email, ID, or any PII
  `;
  ```

---

### Implementation Plan for V2.0

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **Design** | Week 1 | UX mockups, API spec, cost estimate |
| **Backend** | Weeks 2-3 | Nutrition profile API, AI integration layer, testing |
| **Frontend** | Weeks 4-5 | Nutrition profile form, meal plan viewer, feedback |
| **Testing** | Week 6 | Integration tests, user acceptance testing |
| **Launch** | Week 7 | Beta launch to 50 members, monitoring |

---

## V3.0+ - Extended AI Features (Future Consideration)

### Planned Features (Post-V2 Validation)
1. **Coach Insights Dashboard**
   - AI analysis of member progress (weight loss trajectory, adherence)
   - Auto-generated recommendations (increase protein, reduce calories)
   - Cohort benchmarking (your members vs average gym)

2. **Automated Class Recommendations**
   - Suggest classes based on member goals + attendance
   - *"Based on weight loss goal, we recommend 3x cardio classes + 2x strength"*

3. **Smart Trial Conversion**
   - Predict trial → conversion likelihood
   - Auto-send targeted follow-up (personalized based on class attended)

4. **Workout Plan Generation**
   - AI generates workout plans based on equipment available + member level
   - *"V3.0 feature: AI generates workout plans personalized for member fitness level"*

5. **Community Features**
   - Member testimonials + success stories
   - Peer nutrition challenges

---

## Data Architecture Supporting AI

### Current V1 Schema (AI-Ready)

```sql
-- Member nutrition preferences (captured in V1)
CREATE TABLE nutrition_profiles (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL UNIQUE REFERENCES users(id),
  dietary_goals TEXT,          -- 'weight_loss', 'muscle_gain', 'maintenance'
  dietary_restrictions TEXT[],  -- ['vegetarian', 'vegan', 'gluten_free']
  allergies TEXT[],             -- ['shellfish', 'peanuts']
  food_preferences TEXT[],      -- ['asian_cuisine', 'low_carb']
  budget_per_day NUMERIC,       -- VND
  cooking_time_available TEXT,  -- '30_minutes', '60_minutes'
  meal_frequency INT,           -- 2, 3, 4, 5
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- AI-generated meal plans (V2 feature)
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY,
  nutrition_profile_id UUID NOT NULL REFERENCES nutrition_profiles(id),
  status TEXT,                  -- 'draft', 'generated', 'active', 'completed'
  start_date DATE,
  end_date DATE,
  goal_calories INT,
  goal_macros JSONB,            -- {"protein_g": 150, "carbs_g": 200, "fat_g": 67}
  generated_by TEXT,            -- 'openai-gpt4', 'gemini-pro', 'template'
  ai_metadata JSONB,            -- {"model": "gpt-4", "tokens": 1234, "cost": 0.05}
  created_at TIMESTAMP,
  approved_at TIMESTAMP,        -- When member/coach approved
  activated_at TIMESTAMP        -- When member activated plan
);

-- Individual meals within a plan (V2)
CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id),
  day INT,
  meal_type TEXT,               -- 'breakfast', 'lunch', 'snack', 'dinner'
  dish_name TEXT,
  description TEXT,
  calories INT,
  macros JSONB,                 -- {"protein": 30, "carbs": 50, "fat": 10}
  ingredients TEXT[],           -- ['chicken', 'rice', 'vegetables']
  preparation_notes TEXT
);

-- Member feedback on generated plans (V2)
CREATE TABLE nutrition_feedback (
  id UUID PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id),
  feedback_type TEXT,           -- 'meal_dislike', 'too_expensive', 'general_rating'
  rating INT,                   -- 1-5 stars
  comment TEXT,
  created_at TIMESTAMP
);

-- AI usage tracking (cost + performance) (V2)
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES users(id),
  provider TEXT,                -- 'openai', 'gemini'
  model TEXT,                   -- 'gpt-4', 'gpt-3.5-turbo', 'gemini-pro'
  tokens_input INT,
  tokens_output INT,
  total_tokens INT,
  cost_usd NUMERIC,
  latency_ms INT,
  status TEXT,                  -- 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMP
);
```

### Current V1 Captures (MVP)
- ✅ User profiles (name, phone, DOB, avatar)
- ✅ Health data (height, weight, BMI, goals)
- ✅ Check-in frequency (engagement proxy)
- ✅ Subscription history (member longevity)

### V2 Adds
- ✅ Nutrition preferences (from profile form)
- ✅ Meal plans (AI-generated)
- ✅ Member feedback (on plans + meals)
- ✅ AI usage metrics (cost, latency, errors)

---

## Success Metrics (V2.0)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Adoption** | 30% of members generate ≥1 plan | Count `meal_plans` with `activated_at IS NOT NULL` |
| **Satisfaction** | 4.0+ stars avg rating | Average `nutrition_feedback.rating` |
| **Retention Impact** | 10% increase in renewal rate | Compare renewal rate before/after V2 launch |
| **Cost Control** | <$0.10 per meal plan generation | Monitor `ai_usage_logs.cost_usd` |
| **Performance** | <5 second generation time | Monitor `ai_usage_logs.latency_ms` |

---

## Decision Criteria for Proceeding to V2

**Before greenlight V2.0, validate:**

- ✅ MVP V1.0 stable in production (>30 days)
- ✅ User feedback: "Would you want AI meal plans?" (>60% "yes")
- ✅ Business case: Revenue impact (e.g., +5% ARPU through wellness tier)
- ✅ Technical: AI provider selection complete (OpenAI vs Gemini cost/quality)
- ✅ Compliance: Nutritionist review of generated plans (if required in jurisdiction)

---

## Competitive Advantage Post-V2

| Aspect | V1 Position | V2 Position |
|--------|-----------|-----------|
| **AI readiness** | "Planning" | "Launched & validated" |
| **Member wellness focus** | "Weight tracking" | "Personalized nutrition plans" |
| **Market differentiation** | Medium | **HIGH** ⭐ |
| **Retention lever** | Billing + community | **Wellness outcomes** |

---

## Communication Strategy for Thesis Defense

### When Asked: "Why no AI in MVP?"

> **Answer**: *"AI chatbot is V2 feature because:*
> 1. *MVP scope = proven core features (check-in, billing, health tracking)*
> 2. *Data foundation ready = `nutrition_profiles` schema prepared in DB*
> 3. *No over-scoping = focus on quality MVP instead of rushed AI*
> 4. *Roadmap clear = detailed V2 plan with safety guardrails*
> 5. *Competitors have zero AI plans = MYFIT differentiator is real*
> 
> *Bottom line: We're building the RIGHT foundation so V2 AI is fast & reliable."*

### When Asked: "How do you ensure AI safety?"

> **Answer**: *"Three-layer validation:*
> 1. *Database level: Enforce allergen lists (no AI can override)*
> 2. *JSON schema: Validate AI output structure before saving*
> 3. *Human in loop: Coach review before member follows (optional governance)*
> 
> *We never trust AI alone for medical/nutrition decisions."*

---

## Document Version: 1.0 | Last Updated: 2026-05-14 | Status: Ready for Defense ✅
