class NoopVerificationService {
  constructor(outbox = []) {
    this.outbox = outbox;
  }

  async sendEmailVerification(payload) {
    this.outbox.push(payload);
  }
}

module.exports = { NoopVerificationService };
