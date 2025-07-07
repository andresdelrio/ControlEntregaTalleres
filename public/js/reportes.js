// public/js/reportes.js

document.addEventListener('DOMContentLoaded', () => {
  // Asegurarse de que Bootstrap esté cargado para usar Toast
  if (typeof bootstrap === 'undefined') {
    console.warn('Bootstrap no está cargado. Los toasts no funcionarán.');
  }
  cargarEstudiantesNoEntregados();
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

function cargarEstudiantesNoEntregados() {
  // No hay un botón específico para spinner aquí, pero se podría añadir un spinner a la tabla
  fetch('/api/reportes/no-entregados')
    .then(response => response.json())
    .then(data => {
      const tabla = document.getElementById('tabla-no-entregados').getElementsByTagName('tbody')[0];
      tabla.innerHTML = '';
      let contador = 0;

      // Ordenar los datos por grado y luego por nombre
      data.sort((a, b) => {
        // Comparar grados
        const gradoA = a.grado.toLowerCase();
        const gradoB = b.grado.toLowerCase();

        if (gradoA < gradoB) return -1;
        if (gradoA > gradoB) return 1;

        // Si los grados son iguales, ordenar por nombre
        const nombreA = a.nombre.toLowerCase();
        const nombreB = b.nombre.toLowerCase();

        if (nombreA < nombreB) return -1;
        if (nombreA > nombreB) return 1;
        return 0;
      });

      data.forEach(registro => {
        contador++;
        const fila = tabla.insertRow();
        fila.insertCell().innerText = contador;
        fila.insertCell().innerText = registro.nombre;
        fila.insertCell().innerText = registro.grado;
        fila.insertCell().innerText = registro.materias_no_entregadas;
      });
      showToast('Éxito', 'Reporte cargado exitosamente.');
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Error al cargar el reporte.', true);
    });
}