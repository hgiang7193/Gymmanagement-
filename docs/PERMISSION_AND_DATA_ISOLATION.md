# Permission & Data Isolation Policy - MYFIT

> **Version**: 1.0  
> **Date**: 2026-05-14  
> **Audience**: Architects, Security reviewers, QA engineers

---

## 1. Role Hierarchy & Branch Scope

### Role-Branch Assignment Model

MYFIT sử dụng **role-based access control (RBAC)** kết hợp với **branch scoping** để đảm bảo:
- ✅ Isolation giữa các chi nhánh
- ✅ Flexibility cho multi-branch setup (nếu cần sau này)
- ✅ Audit trail cho mọi cross-branch attempt

| Role | Scope | Truy cập dữ liệu | Use Case |
|------|-------|-----------------|----------|
| **Admin** | Toàn hệ thống | Tất cả branches, tất cả users | Quản lý hệ thống, phân quyền, override |
| **Manager** | Assigned branches (1+) | Chỉ dữ liệu branch được gán | UC-MGR-01 đến UC-MGR-07 |
| **Coach** | Assigned shifts + branch | Check-in/class của shift mình, review từ members | UC-COACH-01 đến UC-COACH-03 |
| **Member** | Home branch (read) + personal data (write) | Check-in history, subscription, health tracking tại home branch | UC-MEMBER-01 đến UC-MEMBER-04 |
| **Guest** | Trial booking branch | Trial booking, personal profile | UC-GUEST-01, UC-GUEST-02 |

### Database Schema: Role Assignment

```sql
-- Bảng core: user_role_assignments
CREATE TABLE user_role_assignments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  branch_id UUID REFERENCES branches(id),  -- NULL = toàn hệ thống (Admin only)
  assigned_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  
  -- Constraint: Nếu role != ADMIN, branch_id phải NOT NULL
  CONSTRAINT branch_required_for_non_admin 
    CHECK ((SELECT code FROM roles WHERE id = role_id) = 'ADMIN' OR branch_id IS NOT NULL)
);

-- Example data:
-- User: "quanly@branch1.com" → role=MANAGER, branch_id='branch-1'
-- User: "admin@system.com"  → role=ADMIN, branch_id=NULL
-- User: "coach@branch1.com" → role=COACH, branch_id='branch-1'
```

---

## 2. Data Isolation Mechanism

### 2.1 Database Level (Structural Security)

#### Pattern: Branch-scoped Foreign Keys

Mỗi table chứa business data đều có `branch_id` và **indexed**:

```sql
-- Subscriptions (Gói tập hội viên)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  membership_plan_id UUID NOT NULL REFERENCES membership_plans(id),
  home_branch_id UUID NOT NULL REFERENCES branches(id),  -- 👈 Khóa branch
  status TEXT,
  ...
  INDEX idx_subscriptions_branch_user (home_branch_id, user_id)
);

-- Invoices (Hoá đơn)
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),  -- 👈 Khóa branch
  member_id UUID NOT NULL REFERENCES users(id),
  ...
  INDEX idx_invoices_branch_date (branch_id, created_at DESC)
);

-- Check-ins
CREATE TABLE member_check_ins (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),  -- 👈 Khóa branch
  shift_id UUID NOT NULL REFERENCES shifts(id),
  ...
  INDEX idx_checkins_branch_member (branch_id, member_id)
);
```

**Lợi ích:**
- Query tự động scale với branch isolation (optimizer can use index)
- Không thể vô tình query across branches (query phải explicitly add `WHERE branch_id = $1`)

#### Constraint: Subscription & Member Consistency

```sql
-- Constraint: Nếu Member check-in, phải tại home_branch hoặc authorized_branch
CREATE TABLE member_check_ins (
  ...
  FOREIGN KEY (member_id, branch_id) 
    REFERENCES subscriptions(user_id, home_branch_id)
    ON DELETE RESTRICT
);

-- Constraint: Manager chỉ được tạo Invoice cho member tại branch của mình
-- (enforced in application layer, see 2.2)
```

---

### 2.2 Application Level (Authorization)

#### Pattern: Middleware + Service-level Guards

**Step 1: Controller Middleware - Authentication + Role Check**

```typescript
// File: src/shared/security/authorization.middleware.ts

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const user = await verifyJWT(token);
    req.user = user;  // { id, email, roles: [{role_code, branch_id}] }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireBranchAccess(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const { branchId } = req.params; // or req.body
    
    // Check 1: Role allowed?
    if (!user.roles.some(r => allowedRoles.includes(r.role_code))) {
      return res.status(403).json({ error: 'Role not permitted' });
    }
    
    // Check 2: Branch scope?
    const isAdmin = user.roles.some(r => r.role_code === 'ADMIN');
    const hasAccessToBranch = isAdmin || 
      user.roles.some(r => r.branch_id === branchId);
    
    if (!hasAccessToBranch) {
      // Audit: Log unauthorized access attempt
      await auditLog.create({
        user_id: user.id,
        action: 'UNAUTHORIZED_BRANCH_ACCESS',
        target_branch_id: branchId,
        result: 'DENIED',
        timestamp: new Date()
      });
      
      return res.status(403).json({ 
        error: 'Access denied',
        reason: 'Not authorized for this branch' 
      });
    }
    
    req.branchContext = { branchId, userRole: user.roles[0] };
    next();
  };
}
```

**Usage in Controller:**

```typescript
// File: src/billing/infrastructure/express-invoice.controller.ts

@Router.post('/invoices', 
  requireAuth, 
  requireBranchAccess(['MANAGER', 'ADMIN']),
  handleRequest(createInvoiceHandler)
)
async function createInvoiceHandler(req: Request, res: Response) {
  const { branchContext } = req;  // { branchId, userRole }
  const { memberId, packageId, promotionCode } = req.body;
  
  // Pass branch context to service
  const invoice = await invoiceService.createInvoice(
    branchContext.branchId,  // Enforce: this branch only
    memberId,
    packageId,
    promotionCode
  );
  
  res.status(201).json(invoice);
}
```

---

#### Step 2: Service Layer - Data Validation + Audit

```typescript
// File: src/billing/application/InvoiceService.ts

class InvoiceService {
  constructor(
    private invoiceRepo: InvoiceRepository,
    private subscriptionRepo: SubscriptionRepository,
    private auditLog: AuditLogRepository
  ) {}

  async createInvoice(
    branchId: string,      // ← Required: from middleware
    memberId: string,
    packageId: string,
    promotionCode?: string
  ): Promise<Invoice> {
    
    // Guard 1: Validate member belongs to this branch
    const subscription = await this.subscriptionRepo.findByUserAndBranch(
      memberId, 
      branchId
    );
    
    if (!subscription) {
      throw new UnauthorizedError(
        `Member ${memberId} has no subscription in branch ${branchId}`
      );
    }
    
    // Guard 2: Validate package is active for this branch
    const package_ = await this.packageRepo.findByIdAndBranch(
      packageId, 
      branchId
    );
    
    if (!package_) {
      throw new UnauthorizedError(
        `Package ${packageId} not available in branch ${branchId}`
      );
    }
    
    // Guard 3: Validate promotion (if provided) is for this branch
    if (promotionCode) {
      const promo = await this.promotionRepo.findByCodeAndBranch(
        promotionCode, 
        branchId
      );
      if (!promo) {
        throw new UnauthorizedError(
          `Promotion ${promotionCode} not valid for branch ${branchId}`
        );
      }
    }
    
    // ✅ All checks passed: Create invoice scoped to branch
    const invoice = await this.invoiceRepo.create({
      branch_id: branchId,  // ← Always set from middleware
      member_id: memberId,
      package_id: packageId,
      promotion_id: promotionCode ? promo.id : null,
      status: 'pending',
      created_at: new Date()
    });
    
    // Audit
    await this.auditLog.create({
      user_id: req.user.id,  // ← from middleware
      action: 'INVOICE_CREATED',
      resource_id: invoice.id,
      branch_id: branchId,
      details: { memberId, packageId },
      result: 'SUCCESS',
      timestamp: new Date()
    });
    
    return invoice;
  }
}
```

---

#### Step 3: Repository Layer - Query Scoping

```typescript
// File: src/billing/infrastructure/repository/InvoiceRepository.ts

class InvoiceRepository {
  async findByIdAndBranch(invoiceId: string, branchId: string): Promise<Invoice | null> {
    // ✅ Always scope to branch
    const query = `
      SELECT * FROM invoices 
      WHERE id = $1 AND branch_id = $2
    `;
    return db.query(query, [invoiceId, branchId]);
  }

  async findAllByBranch(branchId: string, filters?: {status?: string}): Promise<Invoice[]> {
    // ✅ Always scope to branch
    let query = 'SELECT * FROM invoices WHERE branch_id = $1';
    const params: any[] = [branchId];
    
    if (filters?.status) {
      query += ' AND status = $2';
      params.push(filters.status);
    }
    
    query += ' ORDER BY created_at DESC';
    return db.query(query, params);
  }

  // ❌ NEVER allow:
  // async findAll(): Promise<Invoice[]> {
  //   return db.query('SELECT * FROM invoices');  // BUG: No branch scope!
  // }
}
```

---

### 2.3 API Endpoint Examples

#### ✅ Valid Request (Manager A, Branch 1)
```
GET /api/v1/invoices?branch_id=branch-1

Headers:
  Authorization: Bearer <token-for-manager-branch1>

Response: 200 OK
  [
    { id: "inv-001", branch_id: "branch-1", member_id: "m-123", ... },
    { id: "inv-002", branch_id: "branch-1", member_id: "m-456", ... }
  ]
```

#### ❌ Unauthorized Request (Manager A, trying Branch 2)
```
GET /api/v1/invoices?branch_id=branch-2

Headers:
  Authorization: Bearer <token-for-manager-branch1>

Response: 403 Forbidden
  {
    "error": "Access denied",
    "reason": "Not authorized for this branch"
  }

Audit Log:
  {
    user_id: "user-mgr-a",
    action: "UNAUTHORIZED_BRANCH_ACCESS",
    target_branch_id: "branch-2",
    result: "DENIED",
    timestamp: "2026-05-14T10:30:00Z"
  }
```

#### ✅ Valid Admin Override
```
GET /api/v1/invoices?branch_id=branch-2

Headers:
  Authorization: Bearer <token-for-admin>

Response: 200 OK
  [invoices from branch-2]

Audit Log:
  {
    user_id: "user-admin",
    action: "CROSS_BRANCH_ACCESS",
    target_branch_id: "branch-2",
    result: "ALLOWED (ADMIN)",
    timestamp: "2026-05-14T10:30:00Z"
  }
```

---

## 3. Conflict Resolution Scenarios

### Scenario 1: Manager A tries to override Member's check-in at Branch B

**Context:**
- Manager A: Assigned to Branch 1, role=MANAGER
- Member M: home_branch_id=Branch 2
- Attempt: Override M's check-in with reason "biometric error"

**Data:**
```sql
SELECT * FROM member_check_ins 
WHERE id = 'checkin-123' AND branch_id = 'branch-2';  -- Exists

-- Trying to update with:
UPDATE member_check_ins SET status = 'OVERRIDE' WHERE id = 'checkin-123';
```

**Resolution Flow:**

1. **Controller Middleware** checks:
   - Is Manager A authenticated? ✅ Yes
   - Does Manager A have MANAGER role? ✅ Yes
   - Is `branch_id=branch-2` in request? ✅ Yes
   - Does Manager A have access to branch-2? ❌ No (assigned only branch-1)
   
2. **Deny with 403 Forbidden**
   ```json
   {
     "error": "Access denied for cross-branch override",
     "userBranch": "branch-1",
     "targetBranch": "branch-2"
   }
   ```

3. **Audit Log Created**
   ```sql
   INSERT INTO audit_logs (user_id, action, resource_id, branch_id, result)
   VALUES ('user-mgr-a', 'CHECK_IN_OVERRIDE_ATTEMPT', 'checkin-123', 'branch-2', 'DENIED');
   ```

---

### Scenario 2: Admin Override (Legitimate)

**Context:** Admin needs to fix check-in error across branches

**Flow:**
1. Admin is authenticated and has ADMIN role (branch_id=NULL in assignment)
2. Middleware passes all checks (Admin can access any branch)
3. Service validates: Check-in exists, member exists, reason is valid
4. **Update succeeds** with clear audit trail

```sql
UPDATE member_check_ins SET status = 'OVERRIDE_BY_ADMIN' WHERE id = 'checkin-123';

INSERT INTO audit_logs (user_id, action, reason, created_at)
VALUES ('admin-user', 'CHECK_IN_OVERRIDE', 'Biometric sensor malfunction', now());
```

---

### Scenario 3: Member tries to view other Member's health data

**Context:**
- Member A: user_id='m-123'
- Member B: user_id='m-456'
- Attempt: GET /api/v1/health-tracking/m-456

**Resolution:**
1. Middleware checks: Member A only has access to self
2. Service validates: Can only return data where user_id = current_user.id
3. **Deny with 403 Forbidden**

```typescript
async getHealthTracking(memberId: string, currentUser: User): Promise<HealthTracking> {
  // Guard: Can only access own data
  if (memberId !== currentUser.id && !currentUser.hasRole('ADMIN')) {
    throw new UnauthorizedError('Cannot access other member health data');
  }
  
  return healthTrackingRepo.findByMemberId(memberId);
}
```

---

## 4. Audit Trail & Monitoring

### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50),  -- e.g., 'INVOICE_CREATED', 'UNAUTHORIZED_ACCESS'
  resource_type VARCHAR(50),  -- e.g., 'INVOICE', 'CHECK_IN'
  resource_id UUID,
  branch_id UUID REFERENCES branches(id),
  details JSONB,  -- Additional context
  result VARCHAR(20),  -- 'SUCCESS', 'DENIED', 'ERROR'
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  INDEX idx_audit_user_date (user_id, timestamp DESC),
  INDEX idx_audit_action_date (action, timestamp DESC),
  INDEX idx_audit_branch_date (branch_id, timestamp DESC)
);
```

### Monitoring Examples

**Detect Unauthorized Access Patterns:**
```sql
-- Users trying to access branches they shouldn't have access to
SELECT user_id, target_branch_id, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'UNAUTHORIZED_BRANCH_ACCESS'
  AND timestamp > now() - INTERVAL '7 days'
GROUP BY user_id, target_branch_id
HAVING COUNT(*) > 5;
```

**Track Cross-Branch Access (Admin):**
```sql
-- When admins access specific branches (for compliance)
SELECT user_id, branch_id, COUNT(*) as access_count
FROM audit_logs
WHERE action IN ('CROSS_BRANCH_ACCESS', 'INVOICE_CREATED')
  AND EXISTS (
    SELECT 1 FROM user_role_assignments
    WHERE user_id = audit_logs.user_id AND role_id = (
      SELECT id FROM roles WHERE code = 'ADMIN'
    )
  )
  AND timestamp > now() - INTERVAL '30 days'
ORDER BY access_count DESC;
```

---

## 5. Checklist for Security Review

- ✅ Every API endpoint enforces branch scope via middleware
- ✅ Service layer validates branch-resource relationship
- ✅ Repository layer ALWAYS queries with `WHERE branch_id = $N`
- ✅ Database constraints prevent orphaned data
- ✅ Audit logs capture all authorization attempts (success + failure)
- ✅ Admin override logged separately for compliance
- ✅ Role-branch assignments validated before creating users
- ✅ Rate limiting on auth endpoints to prevent brute force
- ✅ Cross-branch access attempts trigger alerts

---

**Document Version**: 1.0 | **Last Updated**: 2026-05-14 | **Status**: Ready for Defense
