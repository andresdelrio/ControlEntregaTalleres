let allTalleresData = [];
let filteredTalleresData = [];

let modal;
let closeButton;
let guardarButton;
let idEstudianteActual;
let idMateriaActual;
let periodoActual;

document.addEventListener('DOMContentLoaded', () => {
  cargarTalleres();
  inicializarModal();
  inicializarFiltros();
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
    // Restaurar el texto original del botón (esto puede requerir almacenar el texto original)
    // Por simplicidad, aquí solo se quita el spinner y se habilita.
    if (buttonId === 'guardarObservaciones') {
      button.innerHTML = 'Guardar';
    } else if (buttonId === 'form-carga-unificada-btn') { // Asumiendo un ID para el botón de carga masiva
      button.innerHTML = 'Cargar';
    }
    button.disabled = false;
  }
}

function cargarTalleres() {
  fetch('/api/talleres')
    .then(response => response.json())
    .then(data => {
      allTalleresData = data; // Almacenar todos los datos
      populateFilters(); // Llenar los selectores de filtro
      applyFiltersAndRenderTable(); // Aplicar filtros y renderizar la tabla inicial
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Error al cargar los talleres.', true);
    });
}

function populateFilters() {
  const grados = new Set();
  const materias = new Set();
  const periodos = new Set();

  allTalleresData.forEach(taller => {
    grados.add(taller.grado);
    materias.add(taller.nombre_materia);
    periodos.add(taller.periodo);
  });

  const filtroGrado = document.getElementById('filtroGrado');
  const filtroMateria = document.getElementById('filtroMateria');
  const filtroPeriodo = document.getElementById('filtroPeriodo');

  // Limpiar y poblar Grados
  filtroGrado.innerHTML = '<option value="">Todos</option>';
  Array.from(grados).sort().forEach(grado => {
    const option = document.createElement('option');
    option.value = grado;
    option.innerText = grado;
    filtroGrado.appendChild(option);
  });

  // Limpiar y poblar Materias
  filtroMateria.innerHTML = '<option value="">Todas</option>';
  Array.from(materias).sort().forEach(materia => {
    const option = document.createElement('option');
    option.value = materia;
    option.innerText = materia;
    filtroMateria.appendChild(option);
  });

  // Limpiar y poblar Periodos
  filtroPeriodo.innerHTML = '<option value="">Todos</option>';
  Array.from(periodos).sort((a, b) => a - b).forEach(periodo => {
    const option = document.createElement('option');
    option.value = periodo;
    option.innerText = periodo;
    filtroPeriodo.appendChild(option);
  });
}

function inicializarFiltros() {
  document.getElementById('filtroNombre').addEventListener('input', applyFiltersAndRenderTable);
  document.getElementById('filtroGrado').addEventListener('change', applyFiltersAndRenderTable);
  document.getElementById('filtroMateria').addEventListener('change', applyFiltersAndRenderTable);
  document.getElementById('filtroPeriodo').addEventListener('change', applyFiltersAndRenderTable);
  document.getElementById('filtroEntregadoEstudiante').addEventListener('change', applyFiltersAndRenderTable);
  document.getElementById('filtroEntregadoDocente').addEventListener('change', applyFiltersAndRenderTable);
}

function applyFiltersAndRenderTable() {
  const filtroNombre = document.getElementById('filtroNombre').value.toLowerCase();
  const filtroGrado = document.getElementById('filtroGrado').value;
  const filtroMateria = document.getElementById('filtroMateria').value;
  const filtroPeriodo = document.getElementById('filtroPeriodo').value;
  const filtroEntregadoEstudiante = document.getElementById('filtroEntregadoEstudiante').value;
  const filtroEntregadoDocente = document.getElementById('filtroEntregadoDocente').value;

  filteredTalleresData = allTalleresData.filter(taller => {
    // Filtrar por nombre de estudiante
    const nombreMatch = taller.nombre.toLowerCase().includes(filtroNombre);

    // Filtrar por grado
    const gradoMatch = filtroGrado === '' || taller.grado === filtroGrado;

    // Filtrar por materia
    const materiaMatch = filtroMateria === '' || taller.nombre_materia === filtroMateria;

    // Filtrar por periodo
    const periodoMatch = filtroPeriodo === '' || taller.periodo == filtroPeriodo; // Usar == para comparar string con number

    // Filtrar por entregado por estudiante
    let entregadoEstudianteMatch = true;
    if (filtroEntregadoEstudiante !== '') {
      entregadoEstudianteMatch = (filtroEntregadoEstudiante === 'true' && !!taller.taller_entregado_estudiante) ||
                                 (filtroEntregadoEstudiante === 'false' && !taller.taller_entregado_estudiante);
    }

    // Filtrar por entregado al docente
    let entregadoDocenteMatch = true;
    if (filtroEntregadoDocente !== '') {
      entregadoDocenteMatch = (filtroEntregadoDocente === 'true' && !!taller.taller_entregado_docente) ||
                              (filtroEntregadoDocente === 'false' && !taller.taller_entregado_docente);
    }

    return nombreMatch && gradoMatch && materiaMatch && periodoMatch && entregadoEstudianteMatch && entregadoDocenteMatch;
  });

  renderTable(filteredTalleresData);
}

function renderTable(dataToRender) {
  const tabla = document.getElementById('tabla-talleres').getElementsByTagName('tbody')[0];
  tabla.innerHTML = '';

  // Ordenar los datos por grado y luego por nombre de estudiante
  dataToRender.sort((a, b) => {
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

  dataToRender.forEach(taller => {
    const fila = tabla.insertRow();
    let nombreFormateado = taller.nombre
    .toLowerCase() 
    .split(' ') 
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)) 
    .join(' '); 

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

    // Celda de Observaciones combinada
    const celdaObservaciones = fila.insertCell();
    celdaObservaciones.className = 'observaciones-cell'; // Añadir una clase para estilizar

    const textoObservacion = document.createElement('span');
    textoObservacion.innerText = taller.observaciones || 'Sin observaciones';
    celdaObservaciones.appendChild(textoObservacion);

    const botonObservaciones = document.createElement('button');
    botonObservaciones.innerText = 'Editar';
    botonObservaciones.className = 'btn btn-sm btn-secondary ms-2'; // Clases de Bootstrap
    botonObservaciones.addEventListener('click', () => {
      abrirModal(taller.observaciones, taller.id_estudiante, taller.id_materia, taller.periodo);
    });
    celdaObservaciones.appendChild(botonObservaciones);
  });
}

function actualizarObservaciones(id_estudiante, id_materia, periodo, observaciones) {
  showSpinner('guardarObservaciones', true);
  fetch('/api/talleres/actualizar-observaciones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_estudiante, id_materia, periodo, observaciones })
  })
    .then(response => response.text())
    .then(msg => {
      showToast('Éxito', msg);
      cargarTalleres(); 
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Error al actualizar observaciones.', true);
    })
    .finally(() => {
      showSpinner('guardarObservaciones', false);
    });
}

function registrarEntregaEstudiante(id_estudiante, id_materia, periodo, entregado) {
  // No hay un botón específico para spinner aquí, se podría añadir un spinner en la celda del checkbox
  fetch('/api/talleres/entrega-estudiante', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_estudiante, id_materia, periodo, entregado })
  })
    .then(response => response.text())
    .then(msg => {
      showToast('Éxito', msg);
      cargarTalleres();
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Error al registrar entrega de estudiante.', true);
    });
}

function registrarEntregaDocente(id_estudiante, id_materia, periodo, entregado) {
  // No hay un botón específico para spinner aquí
  fetch('/api/talleres/entrega-docente', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_estudiante, id_materia, periodo, entregado })
  })
    .then(response => response.text())
    .then(msg => {
      showToast('Éxito', msg);
      cargarTalleres();
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Error al registrar entrega a docente.', true);
    });
}