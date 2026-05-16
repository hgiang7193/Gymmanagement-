const { SqlRepository } = require('./sql-repository');

class PostgresUserRepository extends SqlRepository {
  async findByEmail(email) {
    return this.oneMapped('select * from users where email = $1', [email]);
  }

  async findById(id) {
    return this.oneMapped('select * from users where id = $1', [id]);
  }

  async save(user) {
    await this.execute(
      `insert into users (id, email, password_hash, status, email_verified_at, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, user.email, user.passwordHash, user.status, user.emailVerifiedAt, user.createdAt, user.updatedAt]
    );
    return user;
  }

  async update(user) {
    await this.execute(
      `update users
       set email = $2, password_hash = $3, status = $4, email_verified_at = $5, updated_at = $6
       where id = $1`,
      [user.id, user.email, user.passwordHash, user.status, user.emailVerifiedAt, user.updatedAt]
    );
    return user;
  }

  async list() {
    return this.many(`
      SELECT
        u.id, u.email, u.status, u.created_at,
        p.full_name,
        sp.employee_code,
        COALESCE(
          (SELECT r.code FROM user_role_assignments ura
           JOIN roles r ON r.id = ura.role_id
           WHERE ura.user_id = u.id
           ORDER BY CASE r.code
             WHEN 'ADMIN' THEN 1 WHEN 'MANAGER' THEN 2
             WHEN 'COACH' THEN 3 WHEN 'MEMBER' THEN 4 ELSE 5 END
           LIMIT 1),
          'GUEST'
        ) AS primary_role,
        (SELECT b.name FROM user_role_assignments ura
         JOIN roles r ON r.id = ura.role_id
         JOIN branches b ON b.id = ura.branch_id
         WHERE ura.user_id = u.id AND ura.branch_id IS NOT NULL
         ORDER BY CASE r.code
           WHEN 'ADMIN' THEN 1 WHEN 'MANAGER' THEN 2
           WHEN 'COACH' THEN 3 WHEN 'MEMBER' THEN 4 ELSE 5 END
         LIMIT 1) AS branch_name,
        (u.status = 'ACTIVE'
          AND (SELECT COUNT(*) FROM user_role_assignments ura2
               JOIN roles r2 ON r2.id = ura2.role_id
               JOIN users u2 ON u2.id = ura2.user_id
               WHERE r2.code = 'ADMIN' AND u2.status = 'ACTIVE') = 1
          AND EXISTS (SELECT 1 FROM user_role_assignments ura3
               JOIN roles r3 ON r3.id = ura3.role_id
               WHERE ura3.user_id = u.id AND r3.code = 'ADMIN')
        ) AS is_last_admin
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      ORDER BY u.created_at ASC
    `);
  }
}

module.exports = { PostgresUserRepository };
