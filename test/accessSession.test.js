const test = require('node:test');
const assert = require('node:assert/strict');
const { createAccessSession, parseCookies } = require('../middleware/accessSession');

test('interpreta cookies sin aceptar valores mal codificados', () => {
  assert.deepEqual(parseCookies('a=uno; talleres_access=abc%2E123'), {
    a: 'uno',
    talleres_access: 'abc.123',
  });
  assert.equal(parseCookies('valor=%E0%A4%A').valor, '%E0%A4%A');
});

test('genera una sesión firmada, expira y se invalida si cambia el código', () => {
  let currentTime = 1_000;
  let configuredCode = 'codigo-seguro';
  const session = createAccessSession({
    getCode: () => configuredCode,
    now: () => currentTime,
    maxAgeMs: 10_000,
    randomBytes: () => Buffer.alloc(18, 7),
  });

  const token = session.createToken();
  assert.equal(session.isValidToken(token), true);

  currentTime = 11_001;
  assert.equal(session.isValidToken(token), false);

  currentTime = 1_000;
  configuredCode = 'codigo-distinto';
  assert.equal(session.isValidToken(token), false);
});

test('rechaza tokens manipulados o cuando no hay código configurado', () => {
  const configured = createAccessSession({
    getCode: () => 'codigo-seguro',
    now: () => 1_000,
    randomBytes: () => Buffer.alloc(18, 3),
  });
  const token = configured.createToken();
  assert.equal(configured.isValidToken(`${token}alterado`), false);

  const disabled = createAccessSession({ getCode: () => '' });
  assert.equal(disabled.createToken(), null);
  assert.equal(disabled.isValidToken(token), false);
});
