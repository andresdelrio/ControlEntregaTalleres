const crypto = require('crypto');

const HEADER_NAME = 'x-edit-code';

function safeCodeEquals(expectedCode, receivedCode) {
  if (typeof expectedCode !== 'string' || typeof receivedCode !== 'string') {
    return false;
  }

  const expectedHash = crypto.createHash('sha256').update(expectedCode).digest();
  const receivedHash = crypto.createHash('sha256').update(receivedCode).digest();
  return crypto.timingSafeEqual(expectedHash, receivedHash);
}

function createEditCodeGuard({
  getCode = () => process.env.EDIT_ACCESS_CODE,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  now = () => Date.now(),
} = {}) {
  const failedAttempts = new Map();

  return function requireEditCode(req, res, next) {
    const configuredCode = getCode();

    if (typeof configuredCode !== 'string' || configuredCode.trim().length < 6) {
      return res.status(503).json({
        code: 'EDIT_CODE_NOT_CONFIGURED',
        message: 'La edición no está disponible porque el código de acceso no ha sido configurado.',
      });
    }

    const receivedCode = req.get(HEADER_NAME) || '';
    const clientKey = req.ip || req.socket?.remoteAddress || 'unknown';
    const currentTime = now();
    const attempt = failedAttempts.get(clientKey);

    if (safeCodeEquals(configuredCode, receivedCode)) {
      failedAttempts.delete(clientKey);
      return next();
    }

    if (attempt && currentTime - attempt.startedAt < windowMs && attempt.count >= maxAttempts) {
      const retryAfterSeconds = Math.ceil((windowMs - (currentTime - attempt.startedAt)) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        code: 'EDIT_CODE_RATE_LIMITED',
        message: 'Demasiados intentos. Espere unos minutos antes de volver a intentarlo.',
      });
    }

    const nextAttempt = !attempt || currentTime - attempt.startedAt >= windowMs
      ? { count: 1, startedAt: currentTime }
      : { ...attempt, count: attempt.count + 1 };
    failedAttempts.set(clientKey, nextAttempt);

    return res.status(401).json({
      code: 'INVALID_EDIT_CODE',
      message: 'El código de edición no es correcto.',
    });
  };
}

module.exports = {
  HEADER_NAME,
  createEditCodeGuard,
  safeCodeEquals,
};
