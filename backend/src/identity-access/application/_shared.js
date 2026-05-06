class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
  }
}

function requireField(value, code) {
  if (value === undefined || value === null || value === '') {
    throw new DomainError(code);
  }
}

module.exports = {
  DomainError,
  requireField,
};
