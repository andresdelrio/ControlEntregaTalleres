const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

test('la aplicación sirve la interfaz y protege las rutas de escritura', async (t) => {
  process.env.EDIT_ACCESS_CODE = 'codigo-integracion';
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const pageResponse = await fetch(`${baseUrl}/index.html`);
  assert.equal(pageResponse.status, 200);
  assert.match(await pageResponse.text(), /Habilitar edición/);

  const mountedPageResponse = await fetch(`${baseUrl}/seguimiento-talleres/`);
  assert.equal(mountedPageResponse.status, 200);
  assert.match(await mountedPageResponse.text(), /Seguimiento de talleres/);

  const rejectedResponse = await fetch(`${baseUrl}/api/talleres/verificar-codigo`, {
    method: 'POST',
    headers: { 'X-Edit-Code': 'incorrecto' },
  });
  assert.equal(rejectedResponse.status, 401);

  const acceptedResponse = await fetch(`${baseUrl}/api/talleres/verificar-codigo`, {
    method: 'POST',
    headers: { 'X-Edit-Code': 'codigo-integracion' },
  });
  assert.equal(acceptedResponse.status, 200);

  const mountedAcceptedResponse = await fetch(`${baseUrl}/seguimiento-talleres/api/talleres/verificar-codigo`, {
    method: 'POST',
    headers: { 'X-Edit-Code': 'codigo-integracion' },
  });
  assert.equal(mountedAcceptedResponse.status, 200);

  const protectedUploadResponse = await fetch(`${baseUrl}/api/carga/carga-unificada`, {
    method: 'POST',
    headers: { 'X-Edit-Code': 'incorrecto' },
  });
  assert.equal(protectedUploadResponse.status, 401);
});
