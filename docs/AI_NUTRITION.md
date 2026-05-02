# AI Nutrition Planning Note

The old AI Nutrition docs were design/planning material, not active implementation. No AI nutrition routes, tables, or frontend screens are currently present in the codebase.

## Proposed Feature

AI Nutrition would generate meal plans from member profile data, goals, constraints, and feedback. A production version should include:

- Member nutrition profile: goals, dietary restrictions, allergies, food preferences, budget, cooking time, meal frequency.
- Meal plan generation: structured JSON output, calorie and macro targets, meal replacements, shopping list.
- Safety checks: allergy exclusion, medical disclaimers, invalid JSON handling, prompt injection resistance, rate limits.
- Cost controls: token logging, per-user request limits, model/provider configuration.
- Review loop: member feedback, coach/admin review if required, regeneration history.

## Suggested MVP

1. Add nutrition profile storage and validation.
2. Add one generation endpoint behind authentication.
3. Store generated plans and raw provider metadata separately.
4. Add deterministic validation after model output before saving.
5. Add frontend screens only after the API contract is stable.

## Data Model Sketch

- `nutrition_profiles`: one active profile per member.
- `meal_plans`: generated plans, status, target calories/macros, model metadata.
- `meal_plan_items`: normalized meals/ingredients if reporting or replacement logic needs SQL access.
- `nutrition_feedback`: user rating, comments, accepted/rejected meals.
- `ai_usage_logs`: provider, model, tokens, cost estimate, latency, errors.

## Implementation Notes

- Treat AI output as untrusted input.
- Require strict JSON schema validation.
- Never rely on the model to enforce allergies or medical constraints.
- Keep provider keys server-side only.
- Start with explicit user confirmation before replacing an existing active plan.

## Archive

The full legacy planning docs (diagrams, implementation guide, quick reference) are under `docs/archive/root-legacy/AI_NUTRITION_*.md`.
