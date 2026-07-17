document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cerrarSesion').addEventListener('click', closeSession);
  document.getElementById('archivo-unificado').addEventListener('change', showSelectedFile);
  document.getElementById('form-carga-unificada').addEventListener('submit', uploadFile);
});

async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    if (response.status === 401) {
      window.location.replace('acceso.html?destino=cargaMasiva.html');
    }
    const error = new Error(payload.message || 'No fue posible completar la operación.');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function showSelectedFile(event) {
  const file = event.target.files[0];
  document.getElementById('detalleArchivo').textContent = file
    ? `${file.name} · ${formatFileSize(file.size)}`
    : 'Máximo 5 MB';
  document.getElementById('resultadoCarga').classList.add('d-none');
}

async function uploadFile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = document.getElementById('form-carga-unificada-btn');
  setButtonLoading(button, true, 'Validando y cargando…');
  hideMessage();
  document.getElementById('resultadoCarga').classList.add('d-none');

  try {
    const payload = await requestJson('api/carga/carga-unificada', {
      method: 'POST',
      body: new FormData(form),
    });
    renderSummary(payload.summary);
    form.reset();
    document.getElementById('detalleArchivo').textContent = 'Máximo 5 MB';
    showMessage(payload.message, false);
  } catch (error) {
    const details = error.payload?.errors?.length
      ? `${error.message} ${error.payload.errors.join(' ')}`
      : error.message;
    showMessage(details, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function closeSession() {
  const button = document.getElementById('cerrarSesion');
  setButtonLoading(button, true, 'Cerrando…');
  try {
    await fetch('api/acceso/cerrar', { method: 'POST' });
  } finally {
    window.location.replace('consultaPadres.html');
  }
}

function renderSummary(summary = {}) {
  document.getElementById('resProcesados').textContent = summary.processed ?? 0;
  document.getElementById('resCreados').textContent = summary.created ?? 0;
  document.getElementById('resExistentes').textContent = summary.alreadyExisting ?? 0;
  document.getElementById('resDuplicados').textContent = summary.duplicatesInFile ?? 0;
  document.getElementById('resultadoCarga').classList.remove('d-none');
}

function showMessage(message, isError) {
  const element = document.getElementById('mensajeCarga');
  element.textContent = message;
  element.className = isError ? 'alert alert-danger' : 'alert alert-success';
}

function hideMessage() {
  document.getElementById('mensajeCarga').className = 'alert d-none';
}

function setButtonLoading(button, loading, loadingText) {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
