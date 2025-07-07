// public/js/cargaMasiva.js

document.addEventListener('DOMContentLoaded', () => {
  // Asegurarse de que Bootstrap esté cargado para usar Toast
  if (typeof bootstrap === 'undefined') {
    console.warn('Bootstrap no está cargado. Los toasts no funcionarán.');
  }
});

function showToast(header, message, isError = false) {
  const toastLiveExample = document.getElementById('liveToast');
  const toastHeader = document.getElementById('toastHeader');
  const toastBody = document.getElementById('toastBody');

  toastHeader.textContent = header;
  toastBody.textContent = message;

  if (isError) {
    toastHeader.classList.add('text-danger');
    toastHeader.classList.remove('text-success');
  } else {
    toastHeader.classList.add('text-success');
    toastHeader.classList.remove('text-danger');
  }

  const toast = new bootstrap.Toast(toastLiveExample);
  toast.show();
}

function showSpinner(buttonId, show) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  if (show) {
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
    button.disabled = true;
  } else {
    button.innerHTML = 'Cargar'; // Restaurar texto original del botón de carga masiva
    button.disabled = false;
  }
}

document.getElementById('form-carga-unificada').addEventListener('submit', (e) => {
    e.preventDefault();
    showSpinner('form-carga-unificada-btn', true); // Mostrar spinner
    const formData = new FormData(e.target);
    
    fetch('/api/carga/carga-unificada', {
      method: 'POST',
      body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.errores.join('\n'));
            });
        }
        return response.text();
    })
    .then(msg => {
        showToast('Éxito', msg);
    })
    .catch(err => {
        showToast('Error', 'Error: \n' + err.message, true);
        console.error(err);
    })
    .finally(() => {
      showSpinner('form-carga-unificada-btn', false); // Ocultar spinner
    });
});