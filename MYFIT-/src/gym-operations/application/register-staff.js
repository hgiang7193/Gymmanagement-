// UC-ADMIN-05: Đăng ký hồ sơ nhân viên.
// Flow đầy đủ: tạo user (nếu chưa có) + profile + staff_profile + gán role + gửi email đặt mật khẩu lần đầu.
class RegisterStaffUseCase {
  constructor(deps) {
    this.deps = deps;
    this.pool = deps.pool;
  }

  async execute(payload) {
    const {
      email, fullName, phoneNumber, staffRole, branchId, employeeCode, jobTitle, hireDate,
      actorUserId,
    } = payload || {};

    if (!email?.trim()) throw new Error('EMAIL_REQUIRED');
    if (!fullName?.trim()) throw new Error('FULL_NAME_REQUIRED');
    if (!staffRole) throw new Error('STAFF_ROLE_REQUIRED');
    if (!branchId) throw new Error('BRANCH_ID_REQUIRED');
    const allowedRoles = ['COACH', 'MANAGER', 'RECEPTIONIST'];
    if (!allowedRoles.includes(staffRole)) throw new Error('INVALID_STAFF_ROLE');

    const branch = await this.deps.branchRepository.findById(branchId);
    if (!branch) throw new Error('BRANCH_NOT_FOUND');

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.deps.userRepository.findByEmail(normalizedEmail);
    if (existingUser) throw new Error('EMAIL_ALREADY_EXISTS');

    // Role lookup. RECEPTIONIST → MANAGER role (system roles MVP).
    const roleCode = staffRole === 'RECEPTIONIST' ? 'MANAGER' : staffRole;
    const role = await this.deps.roleRepository.findByCode(roleCode);
    if (!role) throw new Error('ROLE_NOT_FOUND');

    const finalEmployeeCode = (employeeCode?.trim()) || `${staffRole.slice(0, 3)}-${Date.now()}`;
    const existingByCode = await this.deps.staffProfileRepository.findByEmployeeCode(finalEmployeeCode);
    if (existingByCode) throw new Error('EMPLOYEE_CODE_ALREADY_EXISTS');

    const now = this.deps.clock.now();
    const userId = this.deps.idGenerator.next('user');
    const profileId = this.deps.idGenerator.next('profile');
    const staffId = this.deps.idGenerator.next ? this.deps.idGenerator.next('staff') : this.deps.idGenerator.generate();

    // Random password hash để user không thể login đến khi reset.
    const tempPassword = `${this.deps.idGenerator.next ? this.deps.idGenerator.next('temp') : this.deps.idGenerator.generate()}-${Date.now()}`;
    const passwordHash = await this.deps.passwordHasher.hash(tempPassword);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `insert into users (id, email, password_hash, status, email_verified_at, created_at, updated_at)
         values ($1,$2,$3,'PENDING_PASSWORD_RESET',null,$4,$4)`,
        [userId, normalizedEmail, passwordHash, now]
      );

      await client.query(
        `insert into profiles (id, user_id, full_name, phone_number, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$5)`,
        [profileId, userId, fullName.trim(), phoneNumber?.trim() || null, now]
      );

      await client.query(
        `insert into staff_profiles (id, user_id, employee_code, job_title, primary_branch_id, hire_date, status, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$7)`,
        [staffId, userId, finalEmployeeCode, jobTitle?.trim() || staffRole, branchId,
         hireDate || now.toISOString().slice(0, 10), now]
      );

      await client.query(
        `insert into user_role_assignments (id, user_id, role_id, branch_id, assigned_at)
         values ($1,$2,$3,$4,$5)`,
        [this.deps.idGenerator.next ? this.deps.idGenerator.next('role-assignment') : this.deps.idGenerator.generate(),
         userId, role.id, branchId, now]
      );

      // Token đặt mật khẩu lần đầu (24h).
      const resetToken = this.deps.idGenerator.next ? this.deps.idGenerator.next('reset-token') : this.deps.idGenerator.generate();
      await client.query(
        `insert into password_reset_tokens (id, user_id, token, expires_at, used_at, created_at)
         values ($1,$2,$3,$4,null,$5)`,
        [this.deps.idGenerator.next ? this.deps.idGenerator.next('password-reset') : this.deps.idGenerator.generate(),
         userId, resetToken, new Date(now.getTime() + 86400000), now]
      );

      await client.query(
        `insert into audit_logs (id, actor_user_id, action_code, entity_type, entity_id, branch_id, metadata_json, created_at)
         values ($1,$2,'staff_registered','user',$3,$4,$5,$6)`,
        [this.deps.idGenerator.generate(), actorUserId || null, userId, branchId,
         JSON.stringify({ staffRole, employeeCode: finalEmployeeCode }), now]
      );

      await client.query('COMMIT');

      // Gửi email đặt mật khẩu (NoOp đẩy vào outbox; production sẽ thay bằng email service thật).
      await this.deps.verificationService.sendEmailVerification({
        userId, email: normalizedEmail, kind: 'staff_first_password_setup', resetToken,
      });

      return {
        userId,
        staffId,
        email: normalizedEmail,
        fullName: fullName.trim(),
        staffRole,
        branchId,
        employeeCode: finalEmployeeCode,
        passwordSetupTokenIssued: true,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = { RegisterStaffUseCase };
