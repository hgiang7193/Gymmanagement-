# AI Nutrition Feature - Developer Quick Reference

## 🚀 Getting Started Checklist

### Before You Start Coding
- [ ] Read `AI_NUTRITION_IMPLEMENTATION_GUIDE.md` (full implementation guide)
- [ ] Review updated `schema.sql` for new tables
- [ ] Check API contracts in `MVP_API_CONTRACTS.md` Section 9
- [ ] Obtain LLM API credentials (OpenAI/Anthropic/DeepSeek)
- [ ] Set up environment variables for API keys
- [ ] Configure budget alerts for AI API costs

---

## 📊 Database Schema Quick Reference

### Core Tables (8 total)

| Table | Purpose | Key Fields | Constraints |
|-------|---------|------------|-------------|
| `member_nutrition_goals` | User's nutrition targets | user_id, calories, macros, restrictions | UNIQUE(user_id) |
| `daily_meal_plans` | Generated meal plans | user_id, plan_date, status, totals | UNIQUE(user_id, plan_date) |
| `meals` | Individual meals | daily_meal_plan_id, meal_type, macros | FK → daily_meal_plans |
| `meal_items` | Ingredients per meal | meal_id, item_name, quantity, unit | FK → meals |
| `recipes` | Recipe templates | name, category, dietary_tags, is_active | GIN index on tags |
| `recipe_ingredients` | Recipe components | recipe_id, ingredient_name, quantity | FK → recipes |
| `meal_consumption_logs` | Actual intake tracking | user_id, meal_id, consumed_at, actual_macros | FK → users, meals |
| `ai_meal_generation_logs` | AI cost/performance tracking | user_id, ai_model, tokens, cost_usd, success | FK → users, daily_meal_plans |

### Critical Indexes
```sql
-- Fast plan lookup by user and date
idx_daily_meal_plans_user_date ON daily_meal_plans (user_id, plan_date DESC)

-- Efficient meal retrieval
idx_meals_daily_plan_id ON meals (daily_meal_plan_id)

-- Consumption history
idx_meal_consumption_logs_user_date ON meal_consumption_logs (user_id, consumed_at DESC)

-- Cost analysis
idx_ai_meal_generation_logs_user_date ON ai_meal_generation_logs (user_id, request_date DESC)

-- Recipe filtering
idx_recipes_dietary_tags ON recipes USING GIN (dietary_tags)
```

---

## 🔌 API Endpoints Summary

### Member APIs (7 endpoints)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/v1/member/nutrition/goals` | Get nutrition goals | Bearer token |
| POST | `/api/v1/member/nutrition/goals` | Create/update goals | Bearer token |
| GET | `/api/v1/member/meal-plans/today` | Get today's plan | Bearer token |
| POST | `/api/v1/member/meal-plans/generate` | ⭐ Trigger AI generation | Bearer token |
| PATCH | `/api/v1/member/meal-plans/{id}` | Edit draft plan | Bearer token |
| POST | `/api/v1/member/meal-consumption` | Log actual intake | Bearer token |
| GET | `/api/v1/member/nutrition/analytics` | View trends | Bearer token |

### Admin APIs (2 endpoints)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/v1/admin/recipes` | List recipes | Admin role |
| POST | `/api/v1/admin/recipes` | Add recipe | Admin role |

### Feedback API (1 endpoint)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/v1/member/meal-plans/{id}/feedback` | Rate meal plan | Bearer token |

---

## 🤖 AI Integration Cheat Sheet

### Recommended Prompt Structure

```typescript
const prompt = `
You are a professional nutritionist creating a personalized daily meal plan.

USER PROFILE:
- Current weight: ${weight_kg} kg
- Goal: ${goal_type}
- Daily calorie target: ${calories_target} kcal
- Macro targets: Protein ${protein_g}g, Carbs ${carbs_g}g, Fat ${fat_g}g
- Dietary restrictions: ${restrictions.join(', ')}
- Allergies: ${allergies.join(', ')}
- Cuisine preferences: ${cuisine_types.join(', ')}
- Activity level: ${activity_level}

REQUIREMENTS:
1. Create exactly 4-6 meals (breakfast, lunch, dinner, 1-3 snacks)
2. Total calories must be within ±5% of target
3. Macros must be within ±10% of targets
4. Avoid all allergens and respect dietary restrictions
5. Each meal should have 3-6 ingredients
6. Use metric units (grams, ml)

OUTPUT FORMAT (JSON only):
{
  "meals": [
    {
      "meal_type": "breakfast",
      "meal_name": "...",
      "description": "...",
      "calories": 450,
      "protein": 15.2,
      "carbs": 68.5,
      "fat": 12.3,
      "preparation_time_minutes": 10,
      "cooking_instructions": "...",
      "items": [...]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations.
`;
```

### LLM API Call Example

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateMealPlanWithAI(prompt: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
    timeout: 30000, // 30 seconds
    response_format: { type: 'json_object' } // Ensure JSON output
  });
  
  return {
    content: response.choices[0].message.content,
    usage: {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens
    }
  };
}
```

### Cost Calculation

```typescript
// GPT-4-turbo pricing (as of 2024)
const COST_PER_1K_INPUT = 0.01;   // $0.01 per 1K input tokens
const COST_PER_1K_OUTPUT = 0.03;  // $0.03 per 1K output tokens

function calculateCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1000) * COST_PER_1K_INPUT;
  const outputCost = (completionTokens / 1000) * COST_PER_1K_OUTPUT;
  return inputCost + outputCost;
}

// Example: 800 input + 1500 output = $0.053
```

---

## ⚠️ Common Pitfalls & Solutions

### Pitfall 1: AI Returns Invalid JSON
**Problem**: LLM sometimes returns markdown-formatted JSON or extra text

**Solution**:
```typescript
// Strip markdown code blocks
let jsonStr = aiResponse.content;
if (jsonStr.startsWith('```json')) {
  jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
}

// Validate before parsing
try {
  const parsed = JSON.parse(jsonStr);
  validateMealPlanStructure(parsed); // Custom validation
} catch (e) {
  logger.error('Invalid JSON from AI', { response: jsonStr });
  throw new Error('AI returned invalid JSON');
}
```

### Pitfall 2: Meal Plan Exceeds Calorie Target
**Problem**: AI doesn't always hit exact calorie targets

**Solution**:
```typescript
function validateMacroTotals(meals: Meal[], targetCalories: number): boolean {
  const actualCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const variance = Math.abs(actualCalories - targetCalories) / targetCalories;
  return variance <= 0.05; // Allow ±5% variance
}

if (!validateMacroTotals(parsedPlan.meals, goals.dailyCaloriesTarget)) {
  logger.warn('Meal plan exceeds calorie tolerance', {
    target: goals.dailyCaloriesTarget,
    actual: calculateTotalCalories(parsedPlan.meals)
  });
  // Option 1: Reject and retry
  // Option 2: Accept with warning flag
}
```

### Pitfall 3: Allergens Slip Through
**Problem**: AI includes allergenic ingredients despite instructions

**Solution**:
```typescript
function checkForAllergens(meals: Meal[], userAllergies: string[]): string[] {
  const violations: string[] = [];
  const allergenKeywords = {
    peanuts: ['peanut', 'peanuts', 'groundnut'],
    shellfish: ['shrimp', 'crab', 'lobster', 'prawn'],
    // ... more mappings
  };
  
  meals.forEach(meal => {
    meal.items.forEach(item => {
      const itemNameLower = item.item_name.toLowerCase();
      userAllergies.forEach(allergy => {
        const keywords = allergenKeywords[allergy] || [allergy];
        if (keywords.some(keyword => itemNameLower.includes(keyword))) {
          violations.push(`${allergy} found in ${meal.meal_name}`);
        }
      });
    });
  });
  
  return violations;
}

const violations = checkForAllergens(parsedPlan.meals, user.allergies);
if (violations.length > 0) {
  throw new Error(`Allergen violation: ${violations.join(', ')}`);
}
```

### Pitfall 4: Concurrent Generation Requests
**Problem**: User clicks "Generate" multiple times quickly

**Solution**:
```typescript
// Database-level constraint prevents duplicates
// UNIQUE(user_id, plan_date) on daily_meal_plans

// Application-level idempotency
async function generateMealPlan(userId: string, date: Date, forceRegenerate = false) {
  // Check if plan already exists
  const existingPlan = await db.dailyMealPlans.findOne({
    where: { userId, planDate: date }
  });
  
  if (existingPlan && !forceRegenerate) {
    throw new ConflictError('Meal plan already exists for this date');
  }
  
  // Use database transaction to prevent race conditions
  return await db.transaction(async (tx) => {
    // ... generation logic ...
  });
}
```

### Pitfall 5: AI API Timeout
**Problem**: LLM API takes too long (>30 seconds)

**Solution**:
```typescript
// Implement retry with exponential backoff
async function callLLMWithRetry(prompt: string, maxRetries = 3): Promise<AIResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callLLMAPI(prompt, { timeout: 30000 });
    } catch (error) {
      if (error.code === 'ETIMEDOUT' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        logger.warn(`AI API timeout, retrying in ${delay}ms`, { attempt });
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}

// Fallback to cheaper model if primary fails
async function generateWithFallback(prompt: string): Promise<AIResponse> {
  try {
    return await callLLMWithRetry(prompt, { model: 'gpt-4-turbo' });
  } catch (primaryError) {
    logger.warn('Primary model failed, trying fallback', { error: primaryError });
    return await callLLMWithRetry(prompt, { model: 'gpt-3.5-turbo' });
  }
}
```

---

## 🧪 Testing Checklist

### Unit Tests to Write

- [ ] Nutrition goals validation (ranges, required fields)
- [ ] Meal plan structure validation (macros sum correctly)
- [ ] AI response parser (handle malformed JSON)
- [ ] Cost calculation accuracy
- [ ] Portion multiplier calculations
- [ ] Allergen detection function
- [ ] Macro variance validation (±5% tolerance)

### Integration Tests to Write

- [ ] End-to-end meal plan generation (mock AI API)
- [ ] Transaction rollback on AI failure
- [ ] Concurrent generation requests (idempotency)
- [ ] Cross-context data flow (weight → meal plan)
- [ ] RBAC enforcement (user can't access other user's data)

### AI-Specific Tests

- [ ] Generated plans respect vegetarian restriction (100 test cases)
- [ ] No allergens present in meals (test all user allergies)
- [ ] Calorie totals within ±5% of target
- [ ] Macro ratios within ±10% of target
- [ ] Meal names are coherent (not gibberish)
- [ ] Cooking instructions are actionable (not empty)

### Load Tests

- [ ] 100 concurrent meal plan generations
- [ ] AI API timeout handling
- [ ] Database query performance (<100ms for plan retrieval)
- [ ] Analytics queries for 90-day periods (<500ms)

---

## 🔒 Security Checklist

- [ ] RBAC enforced on all nutrition endpoints
- [ ] Only user can view their own nutrition data
- [ ] Admin access logged with audit purpose
- [ ] AI prompts don't include sensitive PII (only necessary data)
- [ ] AI responses validated before saving to database
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize meal descriptions/instructions)
- [ ] Rate limiting on generation endpoint (prevent abuse)
- [ ] API keys stored in secrets manager (not in code)
- [ ] TLS enabled for all external API calls

---

## 📈 Monitoring Checklist

### Metrics to Track

- [ ] AI API latency (p50, p95, p99)
- [ ] AI API success rate (target: >98%)
- [ ] Daily cost per user
- [ ] Generation failure reasons (timeout, parsing error, validation fail)
- [ ] User feedback scores (average rating)
- [ ] Adherence rate (actual vs planned calories)
- [ ] Plans requiring user edits (%)

### Alerts to Configure

- [ ] AI API success rate < 95% (5-minute window)
- [ ] Daily cost exceeds $20 (unexpected spike)
- [ ] Generation latency p95 > 15 seconds
- [ ] More than 10% of plans receive negative feedback (<3 stars)
- [ ] Allergen violation detected in generated plan

### Dashboards to Build

- [ ] Cost tracking dashboard (daily/weekly/monthly spend)
- [ ] User engagement (active users, generation frequency)
- [ ] Quality metrics (feedback scores, adherence rates)
- [ ] Technical health (latency, error rates, uptime)

---

## 🚦 Deployment Checklist

### Pre-Deployment

- [ ] Database migration tested on staging
- [ ] API keys configured in production secrets manager
- [ ] Budget alerts set up ($50, $100, $200 thresholds)
- [ ] Monitoring dashboards configured
- [ ] Rollback plan documented and tested
- [ ] Legal review of disclaimers completed
- [ ] Privacy policy updated

### Deployment Day

- [ ] Deploy database migration first
- [ ] Deploy backend API changes
- [ ] Deploy frontend UI changes
- [ ] Verify AI API connectivity from production
- [ ] Test meal plan generation end-to-end
- [ ] Monitor error logs for first hour
- [ ] Check cost tracking is working

### Post-Deployment (First 48 Hours)

- [ ] Monitor AI API success rate hourly
- [ ] Check user feedback for issues
- [ ] Review generation logs for errors
- [ ] Verify audit events are being logged
- [ ] Confirm cost tracking accuracy
- [ ] Respond to user support tickets promptly

---

## 📞 Support Resources

### Documentation
- Full Implementation Guide: `AI_NUTRITION_IMPLEMENTATION_GUIDE.md`
- API Contracts: `MVP_API_CONTRACTS.md` Section 9
- Database Schema: `MYFIT-/src/db/schema.sql` (lines 294-461)
- Architecture Diagrams: `AI_NUTRITION_DIAGRAMS.md`

### External Resources
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com/claude/docs)
- [DeepSeek API Docs](https://platform.deepseek.com/api-docs)
- [USDA FoodData Central](https://fdc.nal.usda.gov/) - Nutritional data

### Team Contacts
- Backend Lead: [Name]
- Frontend Lead: [Name]
- DevOps: [Name]
- Product Owner: [Name]

---

## 🎯 Success Metrics

### Week 1 Targets
- [ ] AI API success rate ≥ 95%
- [ ] Average generation time < 10 seconds
- [ ] Zero critical bugs reported
- [ ] Cost per generation < $0.06

### Month 1 Targets
- [ ] 30% of active members use nutrition feature
- [ ] Average feedback score ≥ 3.5/5.0
- [ ] Adherence rate ≥ 65%
- [ ] Monthly cost per user < $0.10

### Month 3 Targets
- [ ] 40% of active members use feature weekly
- [ ] Average feedback score ≥ 4.0/5.0
- [ ] Adherence rate ≥ 70%
- [ ] User retention 15% higher for nutrition users

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2026-04-24  
**Next Update**: After Phase 2 launch based on learnings
