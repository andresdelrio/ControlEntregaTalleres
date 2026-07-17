const crypto = require('crypto');

const COOKIE_NAME = 'talleres_access';
const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function parseCookies(header = '') {
  return String(header).split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!name) return cookies;

    try {
      cookies[name] = decodeURIComponent(value);
    } catch (error) {
      cookies[name] = value;
    }
    return cookies;
  }, {});
}

function safeTextEquals(expected, received) {
  if (typeof expected !== 'string' || typeof received !== 'string') return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function createAccessSession({
  getCode = () => process.env.EDIT_ACCESS_CODE,
  now = () => Date.now(),
  randomBytes = (size) => crypto.randomBytes(size),
  maxAgeMs = DEFAULT_MAX_AGE_MS,
} = {}) {
  function getConfiguredCode() {
    const code = getCode();
    return typeof code === 'string' && code.trim().length >= 6 ? code : null;
  }

  function sign(payload, code) {
    return crypto
      .createHmac('sha256', `seguimiento-talleres:${code}`)
      .update(payload)
      .digest('base64url');
  }

  function createToken() {
    const code = getConfiguredCode();
    if (!code) return null;
    const payload = `v1.${now() + maxAgeMs}.${randomBytes(18).toString('base64url')}`;
    return `${payload}.${sign(payload, code)}`;
  }

  function isValidToken(token) {
    const code = getConfiguredCode();
    if (!code || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') return false;

    const expiresAt = Number(parts[1]);
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= now()) return false;

    const payload = parts.slice(0, 3).join('.');
    return safeTextEquals(sign(payload, code), parts[3]);
  }

  function tokenFromRequest(req) {
    return parseCookies(req.get('cookie') || '')[COOKIE_NAME] || '';
  }

  function hasAccess(req) {
    return isValidToken(tokenFromRequest(req));
  }

  function cookieOptions(req) {
    const forwardedProtocol = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
    const requestUrl = String(req.originalUrl || req.url || '');
    const apiIndex = requestUrl.indexOf('/api/');
    const cookiePath = apiIndex > 0 ? requestUrl.slice(0, apiIndex) : '/';
    return {
      httpOnly: true,
      sameSite: 'strict',
      secure: Boolean(req.secure || forwardedProtocol === 'https' || process.env.NODE_ENV === 'production'),
      path: cookiePath,
      maxAge: maxAgeMs,
    };
  }

  function issue(req, res) {
    const token = createToken();
    if (!token) return false;
    res.cookie(COOKIE_NAME, token, cookieOptions(req));
    return true;
  }

  function clear(req, res) {
    const options = cookieOptions(req);
    delete options.maxAge;
    res.clearCookie(COOKIE_NAME, options);
  }

  function requireApiAccess(req, res, next) {
    res.set('Cache-Control', 'no-store');
    if (!getConfiguredCode()) {
      return res.status(503).json({
        code: 'ACCESS_CODE_NOT_CONFIGURED',
        message: 'El acceso institucional no está disponible porque el código no ha sido configurado.',
      });
    }
    if (hasAccess(req)) return next();
    return res.status(401).json({
      code: 'ACCESS_REQUIRED',
      message: 'Debe ingresar el código de acceso institucional.',
    });
  }

  function requirePageAccess(req, res, next) {
    res.set('Cache-Control', 'no-store');
    if (hasAccess(req)) return next();
    const destination = encodeURIComponent(req.path.replace(/^\//, '') || 'index.html');
    const prefix = req.baseUrl || '';
    return res.redirect(302, `${prefix}/acceso.html?destino=${destination}`);
  }

  return {
    clear,
    createToken,
    hasAccess,
    isValidToken,
    issue,
    requireApiAccess,
    requirePageAccess,
  };
}

const accessSession = createAccessSession();

module.exports = {
  COOKIE_NAME,
  DEFAULT_MAX_AGE_MS,
  accessSession,
  createAccessSession,
  parseCookies,
};
