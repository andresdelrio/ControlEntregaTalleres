const ALLOWED_DESTINATIONS = new Set(['index.html', 'cargaMasiva.html', 'reportes.html']);

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('formAcceso').addEventListener('submit', startSession);

  try {
    const response = await fetch('api/acceso/estado', { cache: 'no-store' });
    if (response.ok) window.location.replace(getDestination());
  } catch (error) {
    // La pantalla de acceso continúa disponible si el servidor estaba iniciando.
  }
});

function getDestination() {
  const requested = new URLSearchParams(window.location.search).get('destino');
  return ALLOWED_DESTINATIONS.has(requested) ? requested : 'index.html';
}

async function startSession(event) {
  event.preventDefault();
  const button = document.getElementById('iniciarSesion');
  const errorElement = document.getElementById('errorAcceso');
  const codeInput = document.getElementById('codigoAcceso');
  errorElement.classList.add('d-none');
  setButtonLoading(button, true);

  try {
    const response = await fetch('api/acceso/iniciar', {
      method: 'POST',
      headers: { 'X-Edit-Code': codeInput.value },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'No fue posible habilitar el acceso.');
    codeInput.value = '';
    window.location.replace(getDestination());
  } catch (error) {
    codeInput.value = '';
    errorElement.textContent = error.message;
    errorElement.classList.remove('d-none');
    codeInput.focus();
  } finally {
    setButtonLoading(button, false);
  }
}

function setButtonLoading(button, loading) {
  button.disabled = loading;
  button.textContent = loading ? 'Comprobando…' : 'Ingresar';
}
