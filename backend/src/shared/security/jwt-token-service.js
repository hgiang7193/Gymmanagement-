const jwt = require('jsonwebtoken');

class JwtTokenService {
  constructor(options) {
    this.accessTokenSecret = options.accessTokenSecret;
    this.refreshTokenSecret = options.refreshTokenSecret;
    this.accessTokenTtl = options.accessTokenTtl;
    this.refreshTokenTtl = options.refreshTokenTtl;
  }

  async issueAccessToken(payload) {
    return jwt.sign(
      {
        sub: payload.userId,
        primaryRole: payload.primaryRole,
        branchIds: payload.branchIds ?? [],
        type: 'access',
      },
      this.accessTokenSecret,
      { expiresIn: this.accessTokenTtl }
    );
  }

  async issueRefreshToken(payload) {
    return jwt.sign(
      {
        sub: payload.userId,
        sessionId: payload.sessionId,
        type: 'refresh',
      },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenTtl }
    );
  }

  parseAccessToken(token) {
    try {
      const claims = jwt.verify(String(token || ''), this.accessTokenSecret);
      if (claims.type !== 'access') return null;
      return {
        userId: claims.sub,
        primaryRole: claims.primaryRole,
        branchIds: Array.isArray(claims.branchIds) ? claims.branchIds : [],
      };
    } catch {
      return null;
    }
  }
}

module.exports = { JwtTokenService };
