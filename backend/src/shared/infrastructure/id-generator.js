const crypto = require('node:crypto');

class IdGenerator {
  next(prefix = 'id') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  generate() {
    return crypto.randomUUID();
  }
}

module.exports = { IdGenerator };
