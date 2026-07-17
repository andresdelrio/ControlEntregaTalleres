const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

function cookieFrom(response) {
  return response.headers.get('set-cookie').split(';')[0];
}

test('solo la consulta para familias es pública y el área institucional requiere sesión', async (t) => {
  process.env.EDIT_ACCESS_CODE = 'codigo-integracion';
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const publicPage = await fetch(`${baseUrl}/`);
  assert.equal(publicPage.status, 200);
  const publicHtml = await publicPage.text();
  assert.match(publicHtml, /Consulta para familias/);
  assert.doesNotMatch(publicHtml, /Talleres registrados/);

  const mountedPublicPage = await fetch(`${baseUrl}/seguimiento-talleres/`);
  assert.equal(mountedPublicPage.status, 200);
  assert.match(await mountedPublicPage.text(), /Consulta para familias/);

  for (const privatePage of ['index.html', 'cargaMasiva.html', 'reportes.html', 'plantilla_carga_talleres.csv']) {
    const response = await fetch(`${baseUrl}/${privatePage}`, { redirect: 'manual' });
    assert.equal(response.status, 302, `${privatePage} debe redirigir al acceso`);
    assert.match(response.headers.get('location'), /acceso\.html/);
  }

  for (const privateApi of [
    '/api/talleres',
    '/api/estudiantes',
    '/api/reportes/no-entregados',
    '/api/carga/carga-unificada',
  ]) {
    const response = await fetch(`${baseUrl}${privateApi}`);
    assert.equal(response.status, 401, `${privateApi} debe rechazar el acceso público`);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).code, 'ACCESS_REQUIRED');
  }

  const invalidLogin = await fetch(`${baseUrl}/api/acceso/iniciar`, {
    method: 'POST',
    headers: { 'X-Edit-Code': 'incorrecto' },
  });
  assert.equal(invalidLogin.status, 401);

  const login = await fetch(`${baseUrl}/api/acceso/iniciar`, {
    method: 'POST',
    headers: {
      'X-Edit-Code': 'codigo-integracion',
      'X-Forwarded-Proto': 'https',
    },
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert.match(setCookie, /talleres_access=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /Path=\//i);
  const cookie = cookieFrom(login);

  const mountedLogin = await fetch(`${baseUrl}/seguimiento-talleres/api/acceso/iniciar`, {
    method: 'POST',
    headers: {
      'X-Edit-Code': 'codigo-integracion',
      'X-Forwarded-Proto': 'https',
    },
  });
  assert.equal(mountedLogin.status, 200);
  assert.match(mountedLogin.headers.get('set-cookie'), /Path=\/seguimiento-talleres/i);

  const privatePage = await fetch(`${baseUrl}/index.html`, { headers: { Cookie: cookie } });
  assert.equal(privatePage.status, 200);
  assert.match(await privatePage.text(), /Seguimiento de entregas/);

  const mountedPrivatePage = await fetch(`${baseUrl}/seguimiento-talleres/reportes.html`, {
    headers: { Cookie: cookie },
  });
  assert.equal(mountedPrivatePage.status, 200);

  const sessionState = await fetch(`${baseUrl}/api/acceso/estado`, { headers: { Cookie: cookie } });
  assert.equal(sessionState.status, 200);
  assert.deepEqual(await sessionState.json(), { authenticated: true });

  const logout = await fetch(`${baseUrl}/api/acceso/cerrar`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0|Expires=/i);
});
