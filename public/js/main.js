let idMateriaActual;
let periodoActual;

// Esperar a que el DOM cargue
document.addEventListener('DOMContentLoaded', () => {
  cargarTalleres();
  inicializarModal();
});

function inicializarModal() {
  modal = document.getElementById('modalObservaciones');
  closeButton = document.querySelector('.close-button');
  guardarButton = document.getElementById('guardarObservaciones');

  closeButton.addEventListener('click', cerrarModal);
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      cerrarModal();
    }
  });

  guardarButton.addEventListener('click', () => {
    const observacion = document.getElementById('textoObservaciones').value;
    actualizarObservaciones(idEstudianteActual, idMateriaActual, periodoActual, observacion);
    cerrarModal();
  });
}

function abrirModal(observacionActual, idEstudiante, idMateria, periodo) {
  document.getElementById('textoObservaciones').value = observacionActual || '';
  idEstudianteActual = idEstudiante;
  idMateriaActual = idMateria;
  periodoActual = periodo;
  modal.style.display = 'block';
}

function cerrarModal() {
  modal.style.display = 'none';
}

// public/js/main.js

function cargarTalleres() {
  fetch('/api/talleres')
    .then(response => response.json())
    .then(data => {
      const tabla = document.getElementById('tabla-talleres').getElementsByTagName('tbody')[0];
      tabla.innerHTML = '';

      // Ordenar los datos por grado y luego por nombre de estudiante
      data.sort((a, b) => {
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

      data.forEach(taller => {
        const fila = tabla.insertRow();
        let nombreFormateado = taller.nombre
        .toLowerCase() // Primero convertir todo a minúsculas
        .split(' ') // Separar por espacio para obtener cada palabra
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)) // Convertir la primera letra de cada palabra a mayúscula
        .join(' '); // Volver a unir las palabras

        fila.insertCell().innerText = nombreFormateado;
        fila.insertCell().innerText = taller.grado;
        fila.insertCell().innerText = taller.nombre_materia;
        fila.insertCell().innerText = taller.periodo;

        // Entregado por Estudiante
        const celdaEntregaEstudiante = fila.insertCell();
        const checkboxEstudiante = document.createElement('input');
        checkboxEstudiante.type = 'checkbox';
        checkboxEstudiante.checked = !!taller.taller_entregado_estudiante;
        checkboxEstudiante.addEventListener('change', () => {
          registrarEntregaEstudiante(taller.id_estudiante, taller.id_materia, taller.periodo, checkboxEstudiante.checked);
        });
        celdaEntregaEstudiante.appendChild(checkboxEstudiante);

        // Fecha Entrega Estudiante
        fila.insertCell().innerText = taller.fecha_entrega_estudiante ? new Date(taller.fecha_entrega_estudiante).toLocaleDateString() : '';

        // Entregado al Docente
        const celdaEntregaDocente = fila.insertCell();
        const checkboxDocente = document.createElement('input');
        checkboxDocente.type = 'checkbox';
        checkboxDocente.checked = !!taller.taller_entregado_docente;
        checkboxDocente.addEventListener('change', () => {
          registrarEntregaDocente(taller.id_estudiante, taller.id_materia, taller.periodo, checkboxDocente.checked);
        });
        celdaEntregaDocente.appendChild(checkboxDocente);

        // Fecha Entrega Docente
        fila.insertCell().innerText = taller.fecha_entrega_docente ? new Date(taller.fecha_entrega_docente).toLocaleDateString() : '';

        // Observaciones
        const celdaObservaciones = fila.insertCell();
        const botonObservaciones = document.createElement('button');
        botonObservaciones.innerText = 'Editar';
        botonObservaciones.addEventListener('click', () => {
          abrirModal(taller.observaciones, taller.id_estudiante, taller.id_materia, taller.periodo);
        });
        celdaObservaciones.appendChild(botonObservaciones);

        // Mostrar la observación actual
        const celdaTextoObservaciones = fila.insertCell();
        celdaTextoObservaciones.innerText = taller.observaciones || '';
      });
    })
    .catch(err => console.error(err));
}


function actualizarObservaciones(id_estudiante, id_materia, periodo, observaciones) {
  fetch('/api/talleres/actualizar-observaciones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_estudiante, id_materia, periodo, observaciones })
  })
    .then(response => response.text())
    .then(msg => {
      alert(msg);
      cargarTalleres();
    })
    .catch(err => console.error(err));
}

function registrarEntregaEstudiante(id_estudiante, id_materia, periodo, entregado) {
  console.log('Entregado:', entregado);
  fetch('/api/talleres/entrega-estudiante', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_estudiante, id_materia, periodo, entregado })
  })
    .then(response => response.text())
    .then(msg => {
      console.log(msg);
      cargarTalleres();
    })
    .catch(err => console.error(err));
}

function registrarEntregaDocente(id_estudiante, id_materia, periodo, entregado) {
  fetch('/api/talleres/entrega-docente', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_estudiante, id_materia, periodo, entregado })
  })
    .then(response => response.text())
    .then(msg => {
      console.log(msg);
      cargarTalleres();
    })
    .catch(err => console.error(err));
}

