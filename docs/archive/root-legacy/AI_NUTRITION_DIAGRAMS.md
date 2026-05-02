# AI Nutrition Feature - Data Flow & Architecture Diagrams

## 1. System Context Diagram

```mermaid
graph TB
    User[Member User] -->|Views meal plans| Frontend[Web/Mobile Frontend]
    User -->|Sets nutrition goals| Frontend
    User -->|Logs consumption| Frontend
    
    Frontend -->|API calls| Backend[Backend API<br/>Modular Monolith]
    
    Backend -->|Reads weight data| WorkoutDB[(Workout Attendance<br/>Tables)]
    Backend -->|Reads/writes nutrition data| NutritionDB[(Nutrition Tables)]
    Backend -->|Writes audit logs| AuditDB[(Audit Logs)]
    
    Backend -->|Generates meal plans| LLM[External LLM API<br/>GPT-4/Claude/DeepSeek]
    
    LLM -->|Returns structured JSON| Backend
    
    Admin[Admin User] -->|Manages recipes| Frontend
    Frontend -->|Recipe CRUD| Backend
    Backend -->|CRUD operations| RecipeDB[(Recipe Database)]
```

---

## 2. Meal Plan Generation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    participant LLM as LLM API
    participant AUDIT as Audit Log
    
    U->>FE: Click "Generate Meal Plan"
    FE->>BE: POST /meal-plans/generate<br/>{plan_date, force_regenerate}
    
    BE->>DB: Check if plan exists for date
    alt Plan exists and force_regenerate=false
        BE-->>FE: Return existing plan (409 or 200)
        FE-->>U: Show existing plan
    else Plan doesn't exist or force=true
        BE->>DB: Get user's nutrition goals
        BE->>DB: Get latest weight metrics
        
        BE->>LLM: Send structured prompt<br/>(weight + goals + preferences)
        Note over LLM: Generate meal plan<br/>(~3-10 seconds)
        LLM-->>BE: Return JSON meal plan
        
        BE->>BE: Validate response structure
        BE->>BE: Calculate totals
        
        BE->>DB: Begin transaction
        BE->>DB: Insert daily_meal_plan
        BE->>DB: Insert meals (loop)
        BE->>DB: Insert meal_items (nested loop)
        BE->>DB: Commit transaction
        
        BE->>DB: Log AI generation<br/>(tokens, cost, duration)
        BE->>AUDIT: Emit audit event<br/>meal_plan_generated
        
        BE-->>FE: Return created plan (201)
        FE-->>U: Display new meal plan
    end
```

---

## 3. Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| MEMBER_NUTRITION_GOALS : has
    USERS ||--o{ DAILY_MEAL_PLANS : creates
    USERS ||--o{ MEAL_CONSUMPTION_LOGS : logs
    USERS ||--o{ AI_MEAL_GENERATION_LOGS : triggers
    
    DAILY_MEAL_PLANS ||--|{ MEALS : contains
    MEALS ||--|{ MEAL_ITEMS : includes
    MEALS }o--|| RECIPES : "based on (optional)"
    
    RECIPES ||--|{ RECIPE_INGREDIENTS : has
    
    WORKOUT_SESSIONS ||--o{ BODY_MEASUREMENTS : records
    BODY_MEASUREMENTS ||--|| USERS : belongs to
    
    USERS {
        text id PK
        text email UK
        timestamptz created_at
    }
    
    MEMBER_NUTRITION_GOALS {
        text id PK
        text user_id FK
        integer daily_calories_target
        numeric protein_grams_target
        numeric carbs_grams_target
        numeric fat_grams_target
        jsonb dietary_restrictions
        jsonb allergies
        jsonb preferences
        text goal_type
        text activity_level
    }
    
    DAILY_MEAL_PLANS {
        text id PK
        text user_id FK
        date plan_date
        integer total_calories
        numeric total_protein
        numeric total_carbs
        numeric total_fat
        boolean generated_by_ai
        text ai_model_version
        text status
        integer user_feedback_score
    }
    
    MEALS {
        text id PK
        text daily_meal_plan_id FK
        text meal_type
        text meal_name
        integer calories
        numeric protein
        numeric carbs
        numeric fat
        text source
    }
    
    MEAL_ITEMS {
        text id PK
        text meal_id FK
        text item_name
        numeric quantity
        text unit
        numeric calories
        numeric protein
        numeric carbs
        numeric fat
    }
    
    RECIPES {
        text id PK
        text name
        text category
        text cuisine_type
        jsonb dietary_tags
        boolean is_active
    }
    
    MEAL_CONSUMPTION_LOGS {
        text id PK
        text user_id FK
        text meal_id FK
        timestamptz consumed_at
        numeric actual_calories
        numeric portion_multiplier
    }
    
    AI_MEAL_GENERATION_LOGS {
        text id PK
        text user_id FK
        date request_date
        text ai_model
        integer prompt_tokens
        integer completion_tokens
        numeric total_cost_usd
        boolean success
        text error_message
    }
```

---

## 4. Context Boundary Diagram (DDD)

```mermaid
graph LR
    subgraph Identity_Access["Identity & Access Context"]
        UA[User Authentication]
        RBAC[Role-Based Access Control]
    end
    
    subgraph Workout_Attendance["Workout Attendance Context"]
        WS[Workout Sessions]
        BM[Body Measurements]
        WC[Weight Check-ins]
    end
    
    subgraph AI_Nutrition["AI Nutrition Context ⭐"]
        NG[Nutrition Goals]
        MP[Meal Plans]
        ML[Meal Logging]
        RC[Recipe Database]
        AG[AI Generation]
    end
    
    subgraph Admin_Audit["Admin & Audit Context"]
        AL[Audit Logs]
        GL[Generation Logs]
        AC[Cost Tracking]
    end
    
    Identity_Access -->|Provides auth context| AI_Nutrition
    Workout_Attendance -->|Provides weight data| AI_Nutrition
    AI_Nutrition -->|Writes audit events| Admin_Audit
    AI_Nutrition -->|Logs AI costs| Admin_Audit
    
    style AI_Nutrition fill:#e1f5ff
    style AG fill:#fff4e1
```

---

## 5. AI Prompt Engineering Flow

```mermaid
flowchart TD
    Start[User Requests Meal Plan] --> A[Fetch User Profile]
    A --> B[Get Nutrition Goals]
    B --> C[Get Latest Weight Metrics]
    C --> D[Get Dietary Preferences]
    
    D --> E[Build Structured Prompt]
    
    E --> F{Validate Input Data}
    F -->|Missing goals| G[Return Error 422]
    F -->|Valid| H[Call LLM API]
    
    H --> I{API Response}
    I -->|Timeout| J[Retry with backoff]
    I -->|Error| K[Log failure, return 502]
    I -->|Success| L[Parse JSON Response]
    
    J -->|Max retries exceeded| K
    J -->|Success| L
    
    L --> M{Validate Structure}
    M -->|Invalid JSON| N[Log parsing error]
    M -->|Missing fields| O[Attempt auto-fix]
    M -->|Valid| P[Calculate Macro Totals]
    
    O -->|Fix successful| P
    O -->|Fix failed| N
    
    P --> Q{Totals Within Range?}
    Q -->|No| R[Flag for manual review]
    Q -->|Yes| S[Save to Database]
    
    R --> S
    S --> T[Log AI Generation]
    T --> U[Emit Audit Event]
    U --> V[Return Success 201]
    
    N --> W[Return Error 500]
    G --> X[End]
    K --> X
    V --> X
    W --> X
```

---

## 6. Security & Privacy Flow

```mermaid
flowchart TD
    Request[API Request Received] --> A{Authenticated?}
    A -->|No| B[Return 401 Unauthorized]
    A -->|Yes| C{Requester ID == Resource Owner ID?}
    
    C -->|Yes| D[Allow Access]
    C -->|No| E{Requester is Admin?}
    
    E -->|No| F[Return 403 Forbidden]
    E -->|Yes| G{Has Audit Purpose?}
    
    G -->|No| F
    G -->|Yes| H[Log Admin Access Event]
    H --> I[Allow Read-Only Access]
    
    D --> J[Process Request]
    I --> J
    
    J --> K{Contains Health Data?}
    K -->|Yes| L[Apply Extra Encryption]
    K -->|No| M[Standard Processing]
    
    L --> N[Return Response]
    M --> N
    
    B --> O[End]
    F --> O
    N --> O
    
    style L fill:#ffe1e1
    style H fill:#fff4e1
```

---

## 7. Cost Tracking & Monitoring Flow

```mermaid
flowchart LR
    A[AI API Call Made] --> B[Capture Response Metadata]
    B --> C[Extract Token Counts]
    C --> D[Calculate Cost USD]
    
    D --> E[Log to ai_meal_generation_logs]
    E --> F[Update Daily Cost Counter]
    
    F --> G{Daily Cost > Threshold?}
    G -->|No| H[Continue Normal Operation]
    G -->|Yes| I[Trigger Alert]
    
    I --> J[Notify DevOps Team]
    J --> K{Cost > Critical Threshold?}
    K -->|No| L[Monitor Closely]
    K -->|Yes| M[Disable Feature Temporarily]
    
    M --> N[Send User Notification]
    N --> O[Investigate Root Cause]
    
    L --> P[Aggregate Metrics]
    H --> P
    
    P --> Q[Update Dashboard]
    Q --> R[Store in Time-Series DB]
    
    style I fill:#ffe1e1
    style M fill:#ffcccc
```

---

## 8. User Journey: First-Time Nutrition Feature Use

```mermaid
journey
    title User Journey: AI Nutrition Advisor
    section Onboarding
      Discover feature in app: 5: User
      Read feature explanation: 4: User
      Click "Get Started": 5: User
    section Setup
      Set nutrition goals: 3: User
      Input dietary restrictions: 4: User
      Select cuisine preferences: 4: User
      Confirm activity level: 3: User
    section First Use
      View today's weight from check-in: 5: User
      Click "Generate Meal Plan": 5: User
      Wait for AI generation ~5s: 2: User
      View generated meal plan: 5: User
    section Interaction
      Review breakfast suggestion: 4: User
      Edit lunch portion size: 3: User
      Approve final meal plan: 5: User
    section Consumption
      Log breakfast consumed: 4: User
      Add note about taste: 3: User
      Track adherence throughout day: 4: User
    section Feedback
      Rate meal plan 1-5 stars: 4: User
      Provide written feedback: 3: User
      See improved plan next day: 5: User
```

---

## 9. Error Handling & Retry Strategy

```mermaid
flowchart TD
    A[Initiate Meal Plan Generation] --> B[Call LLM API]
    
    B --> C{Response Status}
    C -->|200 Success| D[Parse Response]
    C -->|429 Rate Limit| E[Wait exponential backoff]
    C -->|500 Server Error| F[Retry with same model]
    C -->|503 Unavailable| G[Fallback to cheaper model]
    C -->|Timeout| H[Retry up to 3 times]
    
    E --> I{Retry count < 3?}
    I -->|Yes| B
    I -->|No| J[Return error to user]
    
    F --> K{Retry count < 2?}
    K -->|Yes| B
    K -->|No| G
    
    G --> L[Call fallback model<br/>e.g., GPT-3.5-turbo]
    L --> M{Success?}
    M -->|Yes| D
    M -->|No| J
    
    H --> N{Retry count < 3?}
    N -->|Yes| B
    N -->|No| J
    
    D --> O{Valid JSON?}
    O -->|Yes| P[Validate business rules]
    O -->|No| Q[Attempt JSON repair]
    
    Q --> R{Repair successful?}
    R -->|Yes| P
    R -->|No| J
    
    P --> S{Passes validation?}
    S -->|Yes| T[Save to database]
    S -->|No| U[Flag for manual review]
    
    T --> V[Return success]
    U --> W[Return partial success<br/>with warning]
    J --> X[Return error with message]
    
    style J fill:#ffe1e1
    style X fill:#ffe1e1
    style V fill:#e1ffe1
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph Production Environment
        LB[Load Balancer]
        
        subgraph Application Tier
            FE1[Frontend Instance 1]
            FE2[Frontend Instance 2]
            BE1[Backend Instance 1]
            BE2[Backend Instance 2]
        end
        
        subgraph Data Tier
            PG[(PostgreSQL Primary)]
            PGR[(PostgreSQL Replica)]
            RD[(Redis Cache)]
        end
        
        subgraph External Services
            LLM[LLM API<br/>OpenAI/Anthropic/DeepSeek]
            EMAIL[Email Service]
            MON[Sentry Monitoring]
        end
        
        LB --> FE1
        LB --> FE2
        FE1 --> BE1
        FE2 --> BE2
        
        BE1 --> PG
        BE2 --> PG
        PG -.->|Replication| PGR
        
        BE1 --> RD
        BE2 --> RD
        
        BE1 --> LLM
        BE2 --> LLM
        
        BE1 --> EMAIL
        BE2 --> EMAIL
        
        BE1 --> MON
        BE2 --> MON
    end
    
    subgraph Monitoring
        DASH[Grafana Dashboard]
        ALERT[Alert Manager]
        LOGS[Log Aggregator]
        
        MON --> DASH
        MON --> ALERT
        BE1 --> LOGS
        BE2 --> LOGS
    end
    
    style LLM fill:#fff4e1
    style PG fill:#e1f5ff
```

---

## Key Insights from Diagrams

### 1. **Data Flow Complexity**
- Simple read from workout attendance → complex AI processing → multiple writes
- Transaction boundaries clearly defined (meal plan + meals + items in one transaction)
- Audit logging happens after successful commit (don't block user experience)

### 2. **Security Boundaries**
- Strict ownership model (user can only access own data)
- Admin access requires explicit audit purpose and is logged
- Health data receives extra encryption layer

### 3. **Cost Management**
- Real-time cost tracking per API call
- Automatic alerts at thresholds
- Fallback strategy to cheaper models if primary fails or budget exceeded

### 4. **Error Resilience**
- Multiple retry strategies (exponential backoff, model fallback)
- Graceful degradation (show cached plan if generation fails)
- Clear error messages to users (avoid technical jargon)

### 5. **User Experience**
- Onboarding flow guides users through setup
- Generation time ~5 seconds (manage expectations with loading state)
- Immediate feedback loop (rate plans to improve future recommendations)

---

**Diagram Version**: 1.0  
**Created**: 2026-04-24  
**Tools Used**: Mermaid.js for all diagrams  
**Recommended Viewer**: GitHub, GitLab, or any Mermaid-compatible markdown viewer
