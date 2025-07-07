// public/js/consultaPadres.js

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
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Consultando...';
    button.disabled = true;
  } else {
    button.innerHTML = 'Consultar';
    button.disabled = false;
  }
}

document.getElementById('form-consulta').addEventListener('submit', (e) => {
    e.preventDefault();
    const numero_identificacion_input = document.getElementById('numero_identificacion');
    const numero_identificacion = numero_identificacion_input.value.trim();

    // Limpiar validaciones previas
    numero_identificacion_input.classList.remove('is-invalid', 'is-valid');
    const feedbackDiv = numero_identificacion_input.nextElementSibling; // Asumiendo que el feedback está justo después
    if (feedbackDiv && (feedbackDiv.classList.contains('invalid-feedback') || feedbackDiv.classList.contains('valid-feedback'))) {
      feedbackDiv.remove();
    }

    // Validación básica del campo de identificación
    if (numero_identificacion === '') {
      showToast('Error', 'Por favor, ingrese un número de identificación.', true);
      numero_identificacion_input.classList.add('is-invalid');
      const newFeedbackDiv = document.createElement('div');
      newFeedbackDiv.classList.add('invalid-feedback');
      newFeedbackDiv.innerText = 'Este campo no puede estar vacío.';
      numero_identificacion_input.parentNode.insertBefore(newFeedbackDiv, numero_identificacion_input.nextSibling);
      return;
    } else {
      numero_identificacion_input.classList.add('is-valid');
      const newFeedbackDiv = document.createElement('div');
      newFeedbackDiv.classList.add('valid-feedback');
      newFeedbackDiv.innerText = 'Campo válido.';
      numero_identificacion_input.parentNode.insertBefore(newFeedbackDiv, numero_identificacion_input.nextSibling);
    }

    showSpinner('form-consulta-btn', true); // Mostrar spinner
    
    fetch(`/api/padres/consultar-talleres?numero_identificacion=${numero_identificacion}`)
      .then(response => {
        if (!response.ok) {
          // Si la respuesta no es OK (ej. 404), intentar leer el mensaje de error del backend
          return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
      })
      .then(data => {
        const resultadosDiv = document.getElementById('resultados');
        const tablaBody = resultadosDiv.querySelector('tbody');
        const tablaHead = resultadosDiv.querySelector('thead');
        
        // Limpiar el contenido actual de la tabla
        tablaBody.innerHTML = '';

        if (data.length === 0) {
          resultadosDiv.innerText = 'No se encontraron registros para este estudiante.';
          showToast('Información', 'No se encontraron registros para este estudiante.');
          return;
        }
        
        // Actualizar o crear el encabezado del estudiante
        let h1Estudiante = document.getElementById('nombre-estudiante-grado');
        if (!h1Estudiante) {
          h1Estudiante = document.createElement('h2');
          h1Estudiante.id = 'nombre-estudiante-grado';
          resultadosDiv.insertBefore(h1Estudiante, resultadosDiv.firstChild);
        }
        h1Estudiante.innerText = data[0].nombre +' - ' + data[0].grado;

        // Asegurarse de que el thead esté visible y correcto
        tablaHead.style.display = ''; // Mostrar el thead si estaba oculto

        data.forEach(taller => {
          const fila = document.createElement('tr');
  
          fila.innerHTML = `
            <td>${taller.nombre_materia}</td>
            <td>${taller.periodo}</td>
            <td class="${taller.taller_entregado_estudiante ? 'status-si' : 'status-no'}">${taller.taller_entregado_estudiante ? 'Sí' : 'No'}</td>
            <td>${taller.fecha_entrega_estudiante ? new Date(taller.fecha_entrega_estudiante).toLocaleDateString() : ''}</td>
            <td class="${taller.taller_entregado_docente ? 'status-si' : 'status-no'}">${taller.taller_entregado_docente ? 'Sí' : 'No'}</td>
            <td>${taller.fecha_entrega_docente ? new Date(taller.fecha_entrega_docente).toLocaleDateString() : ''}</td>
            <td>${taller.observaciones || ''}</td>
          `;
  
          tablaBody.appendChild(fila);
          
        });
        showToast('Éxito', 'Consulta realizada exitosamente.');
      })
      .catch(err => {
        console.error(err);
        showToast('Error', 'Error al consultar talleres: ' + err.message, true);
      })
      .finally(() => {
        showSpinner('form-consulta-btn', false); // Ocultar spinner
      });
  });