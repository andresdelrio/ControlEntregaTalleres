const EDIT_CODE_STORAGE_KEY = 'talleres_edit_code';

const uploadState = {
  editCode: sessionStorage.getItem(EDIT_CODE_STORAGE_KEY) || '',
  unlocked: false,
};

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('formAccesoCarga').addEventListener('submit', handleAccessSubmit);
  document.getElementById('bloquearCarga').addEventListener('click', lockUpload);
  document.getElementById('archivo-unificado').addEventListener('change', showSelectedFile);
  document.getElementById('form-carga-unificada').addEventListener('submit', uploadFile);
  setUploadEnabled(false);

  if (uploadState.editCode) {
    try {
      await verifyCode();
      setUploadEnabled(true);
    } catch (error) {
      lockUpload();
    }
  }
});

async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('X-Edit-Code', uploadState.editCode);
  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const error = new Error(payload.message || 'No fue posible completar la operación.');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function verifyCode() {
  return requestJson('api/talleres/verificar-codigo', { method: 'POST' });
}

async function handleAccessSubmit(event) {
  event.preventDefault();
  const button = document.getElementById('validarCodigoCarga');
  uploadState.editCode = document.getElementById('codigoCarga').value;
  setButtonLoading(button, true, 'Comprobando…');
  hideMessage();

  try {
    await verifyCode();
    sessionStorage.setItem(EDIT_CODE_STORAGE_KEY, uploadState.editCode);
    document.getElementById('codigoCarga').value = '';
    setUploadEnabled(true);
    showMessage('Código verificado. Ya puede seleccionar y cargar el archivo.', false);
  } catch (error) {
    uploadState.editCode = '';
    sessionStorage.removeItem(EDIT_CODE_STORAGE_KEY);
    setUploadEnabled(false);
    showMessage(error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function setUploadEnabled(enabled) {
  uploadState.unlocked = enabled;
  document.getElementById('camposCarga').disabled = !enabled;
  document.getElementById('formAccesoCarga').classList.toggle('d-none', enabled);
  document.getElementById('bloquearCarga').classList.toggle('d-none', !enabled);
  document.getElementById('indicadorAccesoCarga').classList.toggle('access-dot--enabled', enabled);
  document.getElementById('detalleAccesoCarga').textContent = enabled
    ? 'Carga habilitada durante esta pestaña.'
    : 'Ingrese el código de edición para habilitar la carga.';
}

function lockUpload() {
  uploadState.editCode = '';
  sessionStorage.removeItem(EDIT_CODE_STORAGE_KEY);
  setUploadEnabled(false);
  document.getElementById('form-carga-unificada').reset();
  document.getElementById('detalleArchivo').textContent = 'Máximo 5 MB';
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
  if (!uploadState.unlocked) {
    showMessage('Habilite la carga con el código de edición.', true);
    return;
  }

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
    if ([401, 429, 503].includes(error.status)) {
      lockUpload();
    }
    const details = error.payload?.errors?.length
      ? `${error.message} ${error.payload.errors.join(' ')}`
      : error.message;
    showMessage(details, true);
  } finally {
    setButtonLoading(button, false);
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
