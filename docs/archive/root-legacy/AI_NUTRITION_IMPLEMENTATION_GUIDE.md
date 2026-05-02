# AI Nutrition Advisor Implementation Guide

## Overview

This document provides a complete implementation plan for the AI-powered nutrition advisor feature in MYFIT. This feature generates personalized daily meal plans based on members' current weight metrics and health data recorded during workout check-ins.

**Phase**: Phase 2 (Post-MVP)  
**Priority**: High - Enhances member retention and provides additional value beyond gym attendance  
**Risk Level**: Medium - Requires careful guardrails to avoid medical advice liability

---

## 1. Feature Scope & Boundaries

### 1.1 What's Included (In Scope)

✅ **Core Features:**
- AI-generated daily meal plans based on user's weight metrics from same-day workout check-in
- Nutrition goals setup (calories, macros, dietary restrictions, allergies)
- Meal plan viewing with detailed breakdown (meals, ingredients, macros)
- Meal consumption logging (track actual intake vs recommended)
- Basic nutrition analytics (adherence rates, macro trends)
- Recipe database for AI reference
- User feedback collection on meal plans (ratings + comments)

✅ **AI Integration:**
- External LLM API calls (GPT-4/Claude/DeepSeek) for meal plan generation
- Structured prompts incorporating user's weight, goals, preferences
- Cost tracking per API call
- Generation logging for quality improvement

✅ **Data Privacy:**
- Same privacy level as health metrics (COMP-01, COMP-02 compliance)
- RBAC enforcement - only user can view their own nutrition data
- Audit logs for all nutrition-related actions

### 1.2 What's Excluded (Out of Scope)

❌ **Not Included in Phase 2:**
- Medical advice or prescription diets (strictly wellness guidance only)
- Real-time integration with wearable devices (Apple Watch, Fitbit, etc.)
- Advanced meal planning algorithms (meal prep for week, batch cooking optimization)
- Social sharing of meal plans
- Shopping list generation
- Restaurant menu recommendations
- Calorie counting via barcode scanning
- Photo-based food recognition

❌ **Deferred to Phase 3:**
- AI-powered recipe suggestions based on available ingredients
- Predictive analytics for weight loss/gain trajectories
- Personalized supplement recommendations
- Integration with grocery delivery services

---

## 2. Database Schema Changes

### 2.1 New Tables Added to `schema.sql`

The following tables have been added to support the nutrition feature:

#### Core Tables:

1. **`member_nutrition_goals`** - User's nutrition targets and preferences
   - Unique constraint on `user_id` (one goal set per user)
   - Stores: calories, macros, dietary restrictions, allergies, preferences
   - Goal types: weight_loss, muscle_gain, maintenance, athletic_performance
   - Activity levels: sedentary → extremely_active

2. **`daily_meal_plans`** - AI-generated daily meal plans
   - Unique constraint on `(user_id, plan_date)` - one plan per day
   - Tracks: total macros, AI model version, token usage, status
   - Status workflow: draft → approved → consumed (or rejected)
   - Includes user feedback (score 1-5 + comments)

3. **`meals`** - Individual meals within a daily plan
   - Foreign key to `daily_meal_plans` with CASCADE delete
   - Meal types: breakfast, lunch, dinner, snack, pre_workout, post_workout
   - Stores: name, description, macros, preparation time, cooking instructions
   - Source tracking: ai_generated, user_custom, recipe_database

4. **`meal_items`** - Ingredients/items within each meal
   - Foreign key to `meals` with CASCADE delete
   - Detailed breakdown: item name, quantity, unit, macros per item
   - Enables granular tracking and editing

5. **`recipes`** - Reusable recipe templates
   - Reference database for AI to draw from
   - Includes: category, cuisine type, difficulty, dietary tags
   - GIN index on `dietary_tags` for efficient filtering
   - Admin-managed (can be expanded with community recipes later)

6. **`recipe_ingredients`** - Ingredients for each recipe
   - Foreign key to `recipes` with CASCADE delete
   - Standardized ingredient data for consistency

7. **`meal_consumption_logs`** - Actual consumption tracking
   - Links to planned meals (optional - allows custom meals)
   - Tracks: actual macros consumed, portion multiplier, notes
   - Enables adherence calculation (planned vs actual)

8. **`ai_meal_generation_logs`** - Audit trail for AI usage
   - Critical for cost tracking and quality monitoring
   - Stores: prompt/response text (truncated), token counts, cost USD
   - Performance metrics: generation duration, success/failure
   - Links back to generated `daily_meal_plan_id`

### 2.2 Key Indexes

```sql
-- Fast lookup of user's meal plans by date
CREATE INDEX idx_daily_meal_plans_user_date 
  ON daily_meal_plans (user_id, plan_date DESC);

-- Efficient meal retrieval for a plan
CREATE INDEX idx_meals_daily_plan_id 
  ON meals (daily_meal_plan_id);

-- Consumption history queries
CREATE INDEX idx_meal_consumption_logs_user_date 
  ON meal_consumption_logs (user_id, consumed_at DESC);

-- AI cost/performance analysis
CREATE INDEX idx_ai_meal_generation_logs_user_date 
  ON ai_meal_generation_logs (user_id, request_date DESC);

-- Recipe filtering by dietary needs
CREATE INDEX idx_recipes_dietary_tags 
  ON recipes USING GIN (dietary_tags);
```

### 2.3 Data Integrity Constraints

- **Unique constraints**: Prevent duplicate nutrition goals and duplicate daily plans
- **Foreign keys**: Ensure referential integrity with CASCADE deletes for child records
- **Check constraints** (recommended additions):
  ```sql
  ALTER TABLE daily_meal_plans 
    ADD CONSTRAINT chk_status_valid 
    CHECK (status IN ('draft', 'approved', 'consumed', 'rejected'));
  
  ALTER TABLE member_nutrition_goals 
    ADD CONSTRAINT chk_calories_range 
    CHECK (daily_calories_target BETWEEN 1200 AND 5000);
  ```

---

## 3. API Contracts

### 3.1 Member-Facing APIs

#### GET `/api/v1/member/nutrition/goals`
Retrieve user's current nutrition goals and preferences.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "daily_calories_target": 2200,
    "protein_grams_target": 165.0,
    "carbs_grams_target": 247.5,
    "fat_grams_target": 73.3,
    "dietary_restrictions": ["vegetarian"],
    "allergies": ["peanuts"],
    "preferences": {
      "cuisine_types": ["asian", "mediterranean"]
    },
    "goal_type": "muscle_gain",
    "activity_level": "moderately_active"
  }
}
```

#### POST `/api/v1/member/nutrition/goals`
Create or update nutrition goals (upsert pattern).

**Validation:**
- Calories: 1200-5000 range
- Macros: positive numbers
- Enums validated for goal_type and activity_level

#### GET `/api/v1/member/meal-plans/today`
Get today's meal plan. Returns empty if not yet generated.

**Response includes:**
- Plan totals (calories, macros)
- List of meals with items and macros
- Status (draft/approved/consumed)

#### POST `/api/v1/member/meal-plans/generate` ⭐ **CRITICAL ENDPOINT**
Trigger AI meal plan generation for specified date.

**Business Logic:**
1. Check if user has nutrition goals set (return 422 if not)
2. Fetch latest weight metrics from workout check-in (same day or most recent)
3. Construct structured prompt for LLM API
4. Call external AI service (with timeout and retry logic)
5. Parse AI response into structured meal plan
6. Save to database in transaction (plan + meals + items)
7. Log AI call details (tokens, cost, duration)
8. Emit audit events

**Request:**
```json
{
  "plan_date": "2026-04-24",
  "force_regenerate": false
}
```

**Error Handling:**
- `422` - No nutrition goals set
- `409` - Plan already exists (unless force_regenerate=true)
- `502` - External AI API failure
- `504` - Timeout (set 30s timeout for AI calls)

#### PATCH `/api/v1/member/meal-plans/{id}`
Edit meal plan before approval (only when status='draft').

**Immutable Pattern:**
- Once status changes to 'approved', no further edits allowed
- Similar to workout session immutability (ADR-03)

#### POST `/api/v1/member/meal-consumption`
Log actual meal consumption.

**Flexibility:**
- Can link to planned meal (`meal_id`) or log custom meal
- Portion multiplier allows partial consumption tracking (0.5 = half portion)

#### GET `/api/v1/member/nutrition/analytics`
View nutrition trends and adherence metrics.

**Query params:** `start_date`, `end_date`

**Response includes:**
- Average daily consumption vs targets
- Adherence percentage
- Daily breakdown for charting

#### POST `/api/v1/member/meal-plans/{id}/feedback`
Submit rating and comments on meal plan.

**Use Case:**
- Feedback used to improve future AI recommendations
- Can adjust prompt engineering based on common complaints

### 3.2 Admin-Facing APIs

#### GET/POST/PATCH `/api/v1/admin/recipes`
Manage recipe database.

**Admin Capabilities:**
- Add/edit/delete recipes
- Bulk import recipes from CSV/JSON
- Tag recipes with dietary categories
- Activate/deactivate recipes

---

## 4. AI Integration Strategy

### 4.1 Architecture Decision: External LLM API

**Decision (D-006):** Use external LLM API (GPT-4/Claude/DeepSeek) instead of self-hosted model.

**Rationale:**
- ✅ Faster time-to-market (no ML infrastructure needed)
- ✅ Lower initial complexity
- ✅ Access to state-of-the-art models
- ❌ Dependency on third-party availability
- ❌ Ongoing API costs (~$0.01-0.03 per meal plan generation)

**When to Revisit:**
- When scale increases (10k+ daily generations)
- When data sovereignty requirements emerge
- When cost of API calls exceeds self-hosted infrastructure

### 4.2 Recommended LLM Provider Comparison

| Provider | Model | Cost/1K tokens | Pros | Cons |
|----------|-------|----------------|------|------|
| OpenAI | GPT-4-turbo | $0.01 input / $0.03 output | Best instruction following, reliable JSON output | Higher cost |
| Anthropic | Claude-3-opus | $0.015 input / $0.075 output | Excellent reasoning, longer context | Most expensive |
| DeepSeek | deepseek-chat | $0.00014 input / $0.00028 output | Very cheap, good performance | Less tested for structured output |

**Recommendation for Phase 2:** Start with **GPT-4-turbo** for reliability, monitor costs, consider DeepSeek for cost optimization if volume increases.

### 4.3 AI Prompt Design

#### Sample Prompt Template:

```
You are a professional nutritionist creating a personalized daily meal plan.

USER PROFILE:
- Current weight: {weight_kg} kg
- Goal: {goal_type} (e.g., muscle_gain)
- Daily calorie target: {calories_target} kcal
- Macro targets: Protein {protein_g}g, Carbs {carbs_g}g, Fat {fat_g}g
- Dietary restrictions: {restrictions}
- Allergies: {allergies}
- Cuisine preferences: {cuisine_types}
- Activity level: {activity_level}

REQUIREMENTS:
1. Create exactly 4-6 meals (breakfast, lunch, dinner, 1-3 snacks)
2. Total calories must be within ±5% of target
3. Macros must be within ±10% of targets
4. Avoid all allergens and respect dietary restrictions
5. Include diverse cuisine types from preferences
6. Each meal should have 3-6 ingredients
7. Provide simple cooking instructions (max 3 steps per meal)
8. Use metric units (grams, ml)

OUTPUT FORMAT (JSON only, no markdown):
{
  "meals": [
    {
      "meal_type": "breakfast",
      "meal_name": "Oatmeal with Berries",
      "description": "Quick and nutritious...",
      "calories": 450,
      "protein": 15.2,
      "carbs": 68.5,
      "fat": 12.3,
      "preparation_time_minutes": 10,
      "cooking_instructions": "1. Boil water... 2. Add oats...",
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
}

IMPORTANT: Return ONLY valid JSON. Do not include explanations or markdown formatting.
```

### 4.4 Response Parsing & Validation

**Critical Step:** AI responses must be validated before saving to database.

```typescript
// Pseudo-code for response handling
async function generateMealPlan(userId: string, date: Date) {
  const startTime = Date.now();
  
  try {
    // 1. Gather user data
    const goals = await getNutritionGoals(userId);
    const latestWeight = await getLatestWeightMetrics(userId);
    
    // 2. Build prompt
    const prompt = buildPrompt(goals, latestWeight);
    
    // 3. Call AI API
    const aiResponse = await callLLMAPI(prompt, {
      model: 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 2000,
      timeout: 30000 // 30s timeout
    });
    
    // 4. Parse and validate JSON
    const parsedPlan = JSON.parse(aiResponse.content);
    validateMealPlanStructure(parsedPlan); // Custom validation
    
    // 5. Calculate totals
    const totals = calculateTotals(parsedPlan.meals);
    
    // 6. Save to database (transaction)
    const plan = await db.transaction(async (tx) => {
      const dailyPlan = await tx.dailyMealPlans.create({
        userId,
        planDate: date,
        ...totals,
        status: 'draft',
        aiModelVersion: 'gpt-4-turbo-2024-04-09',
        aiPromptTokens: aiResponse.usage.prompt_tokens,
        aiCompletionTokens: aiResponse.usage.completion_tokens
      });
      
      // Insert meals and items
      for (const meal of parsedPlan.meals) {
        const savedMeal = await tx.meals.create({
          dailyMealPlanId: dailyPlan.id,
          ...meal
        });
        
        for (const item of meal.items) {
          await tx.mealItems.create({
            mealId: savedMeal.id,
            ...item
          });
        }
      }
      
      return dailyPlan;
    });
    
    // 7. Log success
    await logAIGeneration({
      userId,
      requestDate: date,
      aiModel: 'gpt-4-turbo',
      promptText: truncate(prompt, 5000),
      responseText: truncate(aiResponse.content, 10000),
      promptTokens: aiResponse.usage.prompt_tokens,
      completionTokens: aiResponse.usage.completion_tokens,
      totalCostUSD: calculateCost(aiResponse.usage),
      generationDurationMs: Date.now() - startTime,
      success: true,
      dailyMealPlanId: plan.id
    });
    
    // 8. Emit audit event
    await auditLog.logEvent({
      actorUserId: userId,
      actionCode: 'meal_plan_generated',
      entityType: 'daily_meal_plan',
      entityId: plan.id,
      metadataJson: {
        aiModel: 'gpt-4-turbo',
        totalCalories: totals.totalCalories,
        generationDurationMs: Date.now() - startTime
      }
    });
    
    return plan;
    
  } catch (error) {
    // Log failure
    await logAIGeneration({
      userId,
      requestDate: date,
      aiModel: 'gpt-4-turbo',
      success: false,
      errorMessage: error.message,
      generationDurationMs: Date.now() - startTime
    });
    
    throw error;
  }
}
```

### 4.5 Cost Management

**Estimated Costs:**
- Average prompt: ~800 tokens
- Average response: ~1500 tokens
- Cost per generation (GPT-4-turbo): ~$0.053
- If 100 users generate daily: ~$5.30/day = ~$160/month

**Cost Optimization Strategies:**
1. **Cache meal plans**: Only generate once per day per user
2. **Batch similar requests**: Users with identical profiles can share base plan
3. **Use cheaper models for retries**: Fallback to GPT-3.5-turbo if GPT-4 fails
4. **Monitor and alert**: Set budget alerts at $50, $100, $200/month
5. **Consider DeepSeek**: If costs exceed budget, switch to DeepSeek (99% cheaper)

---

## 5. Integration with Existing Contexts

### 5.1 Data Flow Diagram

```
┌─────────────────────┐
│  Workout Attendance │
│  Context            │
│                     │
│  - Body measurements│
│  - Weight logs      │
└──────────┬──────────┘
           │ (reads)
           ▼
┌─────────────────────┐
│  AI Nutrition       │
│  Context            │
│                     │
│  1. Get weight      │◄── From workout check-in
│  2. Get goals       │◄── From nutrition goals table
│  3. Call AI API     │──► External LLM Service
│  4. Save plan       │
│  5. Log generation  │
└──────────┬──────────┘
           │ (writes)
           ▼
┌─────────────────────┐
│  Admin & Audit      │
│  Context            │
│                     │
│  - AI generation    │
│    logs             │
│  - Audit events     │
└─────────────────────┘
```

### 5.2 Cross-Context Interactions

**Read Dependencies:**
- `Workout Attendance`: Latest weight metrics, body composition
- `Membership`: Verify user is active member (optional - could allow trial users too)

**Write Dependencies:**
- `Admin & Audit`: AI generation logs, audit events

**No Direct Dependencies On:**
- Trial Booking
- Trainer Operations
- Branch Management (nutrition is user-specific, not branch-scoped)

---

## 6. Security & Compliance

### 6.1 Data Privacy (COMP-01, COMP-02)

**Nutrition data classification:** Health-related personal data  
**Protection level:** Same as body measurements and health profiles

**Implementation:**
```typescript
// RBAC enforcement example
async function getMealPlan(userId: string, requesterId: string) {
  // Only the user themselves can view their nutrition data
  if (userId !== requesterId) {
    // Exception: Admin with explicit audit purpose (logged)
    if (!await isAdminWithAuditPurpose(requesterId)) {
      throw new ForbiddenError('Cannot access other user\'s nutrition data');
    }
    
    // Log admin access
    await auditLog.logEvent({
      actorUserId: requesterId,
      actionCode: 'admin_accessed_nutrition_data',
      entityType: 'daily_meal_plan',
      entityId: planId,
      metadataJson: { accessedUserId: userId }
    });
  }
  
  return db.dailyMealPlans.findByUserId(userId);
}
```

### 6.2 Guardrails for AI Output

**Critical Safety Measures:**

1. **Disclaimer on all meal plans:**
   ```
   "This meal plan is for wellness guidance only and is not medical advice. 
   Consult a healthcare professional before making significant dietary changes."
   ```

2. **Content filtering:**
   - Reject plans containing allergens listed in user profile
   - Validate calorie ranges (reject if <1200 or >5000 without manual review flag)
   - Flag extreme macro ratios for review (e.g., <10% fat)

3. **Human-in-the-loop for edge cases:**
   - If user has medical conditions noted in health profile, add warning
   - Allow users to report inappropriate recommendations

4. **No prescription language:**
   - AI must NOT use terms like "prescribed", "treatment", "cure"
   - Use "recommended", "suggested", "may help with"

### 6.3 Audit Requirements

**Events to Log:**
- `nutrition_goals_created` / `nutrition_goals_updated`
- `meal_plan_generated` (with AI model, cost, duration)
- `meal_plan_viewed`
- `meal_plan_edited`
- `meal_consumption_logged`
- `meal_plan_feedback_submitted`
- `admin_accessed_nutrition_data` (if applicable)

---

## 7. Implementation Phases

### Phase 2A: Foundation (Week 1-2)

**Tasks:**
1. ✅ Database schema migration (tables created)
2. Implement nutrition goals CRUD APIs
3. Build basic meal plan viewing UI
4. Set up AI API integration (OpenAI SDK)
5. Implement prompt template and response parser
6. Add AI generation logging

**Deliverable:** Users can set goals and manually trigger meal plan generation

### Phase 2B: Enhancement (Week 3-4)

**Tasks:**
1. Implement meal consumption logging
2. Build nutrition analytics dashboard
3. Add recipe database (seed with 50-100 common recipes)
4. Implement meal plan editing (draft status only)
5. Add user feedback mechanism
6. Optimize AI prompts based on initial feedback

**Deliverable:** Complete nutrition tracking loop with analytics

### Phase 2C: Polish (Week 5-6)

**Tasks:**
1. Automated daily generation (cron job at 6 AM)
2. Smart defaults (auto-calculate macros from weight/goals)
3. Improve meal variety (avoid repetition across days)
4. Performance optimization (cache frequently used recipes)
5. Error handling improvements (retry logic, fallback models)
6. User onboarding flow for nutrition feature

**Deliverable:** Polished, automated nutrition advisor ready for production

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Test Cases:**
- Nutrition goals validation (ranges, required fields)
- Meal plan structure validation (macros sum correctly)
- AI response parsing (handle malformed JSON gracefully)
- Cost calculation accuracy
- Portion multiplier calculations

### 8.2 Integration Tests

**Test Scenarios:**
- End-to-end meal plan generation (mock AI API)
- Transaction rollback on AI failure
- Concurrent generation requests (idempotency)
- Cross-context data flow (weight metrics → meal plan)

### 8.3 AI-Specific Tests

**Quality Checks:**
- Generated plans respect dietary restrictions (100 test cases)
- No allergens present in meals
- Calorie totals within ±5% of target
- Macro ratios within ±10% of target
- Meal names and descriptions are coherent
- Cooking instructions are actionable

**Sample Test:**
```typescript
test('AI meal plan respects vegetarian restriction', async () => {
  const user = await createUser({
    nutritionGoals: {
      dietaryRestrictions: ['vegetarian'],
      dailyCaloriesTarget: 2000
    }
  });
  
  const plan = await generateMealPlan(user.id, today);
  
  // Check no meat products
  const allItems = await getAllMealItems(plan.id);
  const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'bacon'];
  
  allItems.forEach(item => {
    meatKeywords.forEach(meat => {
      expect(item.itemName.toLowerCase()).not.toContain(meat);
    });
  });
});
```

### 8.4 Load Testing

**Targets:**
- Support 100 concurrent meal plan generations
- AI API timeout handling (30s timeout)
- Database query performance (<100ms for meal plan retrieval)
- Analytics queries for 90-day periods (<500ms)

---

## 9. Monitoring & Observability

### 9.1 Key Metrics to Track

**Business Metrics:**
- Daily active users using nutrition feature
- Meal plan generation rate (plans generated / eligible users)
- User feedback scores (average rating)
- Adherence rate (actual consumption / planned)

**Technical Metrics:**
- AI API latency (p50, p95, p99)
- AI API success rate (target: >98%)
- Cost per day / cost per user
- Generation failure reasons (timeout, parsing error, validation fail)

**Quality Metrics:**
- Percentage of plans requiring user edits
- Common feedback themes (NLP analysis of comments)
- Plans rejected due to allergen violations

### 9.2 Alerts

**Set Up Alerts For:**
- AI API success rate < 95% (5-minute window)
- Daily cost exceeds $20 (unexpected spike)
- Generation latency p95 > 15 seconds
- More than 10% of plans receive negative feedback (<3 stars)

### 9.3 Dashboards

**Admin Dashboard:**
- Total users with nutrition goals
- Daily meal plan generations (chart)
- Average user satisfaction score
- Top requested cuisines / dietary restrictions
- Cost trend over time

**User Dashboard:**
- Weekly adherence rate
- Macro breakdown pie chart
- Weight trend vs nutrition adherence correlation
- Favorite meals (most consumed)

---

## 10. Migration Strategy

### 10.1 Database Migration

```sql
-- Migration file: 20260424_add_nutrition_tables.sql

BEGIN;

-- Create all nutrition tables (from schema.sql section above)
-- ...

-- Seed initial recipe database (optional)
INSERT INTO recipes (id, name, category, ...) VALUES
  ('recipe-001', 'Greek Yogurt Parfait', 'breakfast', ...),
  ('recipe-002', 'Grilled Chicken Salad', 'lunch', ...);

COMMIT;
```

### 10.2 Backfill Strategy

**For existing users:**
1. Auto-create default nutrition goals based on profile data
   - Calculate TDEE from weight, height, activity level
   - Set default macro split (40% carbs, 30% protein, 30% fat)
2. Send welcome email introducing nutrition feature
3. Offer guided setup wizard on first login post-deployment

### 10.3 Rollback Plan

**If issues arise:**
1. Disable meal plan generation endpoint (feature flag)
2. Keep existing data intact (don't drop tables)
3. Revert frontend UI changes
4. Investigate root cause
5. Re-enable when fixed

---

## 11. Future Enhancements (Phase 3+)

### 11.1 Advanced Features

- **Smart shopping lists**: Aggregate ingredients from weekly meal plan
- **Restaurant integration**: Suggest nearby restaurants matching macro goals
- **Photo food logging**: AI-powered food recognition from photos
- **Wearable sync**: Auto-import calories burned from Apple Watch/Fitbit
- **Social features**: Share meal plans with trainer or friends
- **Meal prep mode**: Generate batch-cooking friendly plans
- **Budget optimization**: Suggest meals based on grocery prices

### 11.2 AI Improvements

- **Fine-tuned model**: Train custom model on user feedback data
- **Preference learning**: AI learns from user edits and ratings
- **Seasonal adjustments**: Incorporate seasonal ingredient availability
- **Cultural adaptation**: Better support for Vietnamese cuisine specifics

### 11.3 Business Opportunities

- **Premium tier**: Advanced analytics, unlimited regenerations, custom recipes
- **Trainer collaboration**: Trainers can review and approve client meal plans
- **Partnership integrations**: Grocery delivery, supplement brands
- **Corporate wellness**: B2B offering for company wellness programs

---

## 12. Risk Mitigation

### 12.1 Identified Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI gives unsafe dietary advice | High | Low | Strict guardrails, disclaimers, content filtering |
| High API costs | Medium | Medium | Budget alerts, caching, fallback to cheaper models |
| Poor meal plan quality | Medium | Medium | User feedback loop, continuous prompt improvement |
| User data privacy breach | High | Low | Same security as health data, RBAC, encryption |
| AI API downtime | Medium | Low | Retry logic, cached plans, graceful degradation |
| Regulatory compliance issues | High | Low | Legal review, clear disclaimers, no medical claims |

### 12.2 Compliance Checklist

- [ ] Legal review of disclaimers and terms of service
- [ ] Privacy policy updated to include nutrition data
- [ ] User consent obtained for AI processing of health data
- [ ] Data retention policy defined (how long to keep meal plans)
- [ ] Right to deletion implemented (GDPR/PDPA compliance)
- [ ] Audit trail complete for all nutrition data access

---

## 13. Success Criteria

### 13.1 Launch Criteria (Phase 2 Go-Live)

- [ ] 80% of meal plans pass automated validation (macros, allergens)
- [ ] Average user feedback score ≥ 3.5/5.0
- [ ] AI API success rate ≥ 98%
- [ ] Generation latency p95 < 15 seconds
- [ ] Zero critical security or privacy incidents
- [ ] Cost per user < $0.10/month

### 13.2 Success Metrics (3 Months Post-Launch)

- [ ] 40% of active members use nutrition feature weekly
- [ ] Average adherence rate ≥ 70% (actual vs planned calories)
- [ ] User retention 15% higher for nutrition feature users
- [ ] Net Promoter Score (NPS) for nutrition feature ≥ 30
- [ ] Monthly cost per active user < $0.08

---

## 14. Team Responsibilities

### Backend Team
- Database schema implementation
- API development and validation
- AI integration and prompt engineering
- Security and RBAC enforcement
- Performance optimization

### Frontend Team
- Nutrition goals setup UI
- Meal plan display (mobile-first)
- Consumption logging interface
- Analytics dashboard
- Feedback submission flow

### DevOps Team
- AI API credential management (secrets)
- Cost monitoring and alerts
- Deployment automation
- Backup strategy for nutrition data

### Product/QA Team
- User acceptance testing
- AI output quality validation
- Compliance review
- User feedback collection and analysis

---

## 15. Appendix

### 15.1 Glossary

- **TDEE**: Total Daily Energy Expenditure
- **Macros**: Macronutrients (protein, carbohydrates, fat)
- **Macro Split**: Percentage distribution of calories from each macro
- **Adherence Rate**: Percentage of planned calories actually consumed
- **Portion Multiplier**: Factor applied to planned portion (0.5 = half, 1.5 = 1.5x)

### 15.2 References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/claude/docs)
- [DeepSeek API](https://platform.deepseek.com/api-docs)
- [MyFitnessPal Macro Calculator](https://www.myfitnesspal.com/account/goals)
- [USDA FoodData Central](https://fdc.nal.usda.gov/) - for nutritional data

### 15.3 Contact

For questions or clarifications on this implementation guide:
- Technical Lead: [Name]
- Product Owner: [Name]
- Security Review: [Name]

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-24  
**Next Review**: After Phase 2 launch
