const test = require('node:test');
const assert = require('node:assert/strict');
const { createEditCodeGuard, safeCodeEquals } = require('../middleware/requireEditCode');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createRequest(code = '', ip = '127.0.0.1') {
  return {
    ip,
    get(name) {
      return name === 'x-edit-code' ? code : undefined;
    },
  };
}

test('compara códigos sin exponer diferencias de longitud', () => {
  assert.equal(safeCodeEquals('codigo-seguro', 'codigo-seguro'), true);
  assert.equal(safeCodeEquals('codigo-seguro', 'incorrecto'), false);
  assert.equal(safeCodeEquals('codigo-seguro', ''), false);
});

test('rechaza escrituras cuando el código no está configurado', () => {
  const guard = createEditCodeGuard({ getCode: () => undefined });
  const response = createResponse();
  guard(createRequest('cualquiera'), response, () => assert.fail('No debe autorizar'));
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'EDIT_CODE_NOT_CONFIGURED');
});

test('autoriza el código correcto y rechaza uno incorrecto', () => {
  const guard = createEditCodeGuard({ getCode: () => 'codigo-seguro' });
  let authorized = false;
  guard(createRequest('codigo-seguro'), createResponse(), () => { authorized = true; });
  assert.equal(authorized, true);

  const response = createResponse();
  guard(createRequest('incorrecto'), response, () => assert.fail('No debe autorizar'));
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.code, 'INVALID_EDIT_CODE');
});

test('limita intentos fallidos repetidos por dirección', () => {
  let currentTime = 1_000;
  const guard = createEditCodeGuard({
    getCode: () => 'codigo-seguro',
    maxAttempts: 2,
    windowMs: 60_000,
    now: () => currentTime,
  });

  guard(createRequest('mal'), createResponse(), () => {});
  guard(createRequest('mal'), createResponse(), () => {});
  const response = createResponse();
  guard(createRequest('mal'), response, () => assert.fail('No debe autorizar'));
  assert.equal(response.statusCode, 429);
  assert.equal(response.headers['Retry-After'], '60');

  currentTime += 60_001;
  const resetResponse = createResponse();
  guard(createRequest('mal'), resetResponse, () => {});
  assert.equal(resetResponse.statusCode, 401);
});
