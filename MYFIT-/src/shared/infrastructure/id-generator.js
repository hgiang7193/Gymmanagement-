const crypto = require('node:crypto');

class IdGenerator {
  next(prefix = 'id') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
}

module.exports = { IdGenerator };
