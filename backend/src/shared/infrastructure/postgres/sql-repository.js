class SqlRepository {
  constructor(pool) {
    this.pool = pool;
  }

  mapRow(row) {
    if (!row) return row;
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()),
        value,
      ])
    );
  }

  async one(query, params) {
    const result = await this.pool.query(query, params);
    return result.rows[0] ?? null;
  }

  async many(query, params) {
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async execute(query, params) {
    await this.pool.query(query, params);
  }

  async oneMapped(query, params) {
    return this.mapRow(await this.one(query, params));
  }

  async manyMapped(query, params) {
    const rows = await this.many(query, params);
    return rows.map((row) => this.mapRow(row));
  }
}

module.exports = { SqlRepository };
