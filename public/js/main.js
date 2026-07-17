const FILTERS_STORAGE_KEY = 'talleres_filters';

const state = {
  allTalleres: [],
  filteredTalleres: [],
  editEnabled: true,
  currentObservation: null,
  page: 1,
  pageSize: 50,
};

let observationsModal;

document.addEventListener('DOMContentLoaded', async () => {
  observationsModal = new bootstrap.Modal(document.getElementById('modalObservaciones'));
  bindEvents();
  restoreFilters();
  await loadTalleres();
});

function bindEvents() {
  const filterIds = [
    'filtroNombre',
    'filtroGrado',
    'filtroMateria',
    'filtroPeriodo',
    'filtroEntregadoEstudiante',
    'filtroEntregadoDocente',
  ];

  filterIds.forEach((id) => {
    const eventName = id === 'filtroNombre' ? 'input' : 'change';
    document.getElementById(id).addEventListener(eventName, () => applyFiltersAndRenderTable({ resetPage: true }));
  });

  document.getElementById('limpiarFiltros').addEventListener('click', clearFilters);
  document.getElementById('recargarDatos').addEventListener('click', loadTalleres);
  document.getElementById('tamanoPagina').addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderTable();
  });
  document.getElementById('paginaAnterior').addEventListener('click', () => changePage(-1));
  document.getElementById('paginaSiguiente').addEventListener('click', () => changePage(1));
  document.getElementById('cerrarSesion').addEventListener('click', closeSession);
  document.getElementById('formObservaciones').addEventListener('submit', saveObservation);
  document.getElementById('textoObservaciones').addEventListener('input', updateObservationCounter);
}

async function apiRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    if (response.status === 401) {
      window.location.replace('acceso.html?destino=index.html');
    }
    const error = new Error(payload.message || 'No fue posible completar la operación.');
    error.status = response.status;
    error.code = payload.code;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function loadTalleres() {
  setTableMessage('Cargando talleres…');
  const reloadButton = document.getElementById('recargarDatos');
  setButtonLoading(reloadButton, true, 'Actualizando…');

  try {
    const data = await apiRequest('api/talleres');
    state.allTalleres = Array.isArray(data) ? data : [];
    populateFilters();
    // Grado, materia y periodo se restauran después de crear sus opciones dinámicas.
    restoreFilters();
    updateMetrics();
    applyFiltersAndRenderTable({ resetPage: false });
  } catch (error) {
    setTableMessage('No fue posible cargar los talleres. Use “Actualizar datos” para intentar de nuevo.');
    showToast('Error al cargar', error.message, true);
  } finally {
    setButtonLoading(reloadButton, false);
  }
}

function populateFilters() {
  populateSelect('filtroGrado', uniqueValues('grado'), 'Todos');
  populateSelect('filtroMateria', uniqueValues('nombre_materia'), 'Todas');
  populateSelect('filtroPeriodo', uniqueValues('periodo', true), 'Todos');
}

function uniqueValues(property, numeric = false) {
  const values = [...new Set(state.allTalleres.map((item) => item[property]).filter((value) => value !== null && value !== ''))];
  return values.sort(numeric
    ? (a, b) => Number(a) - Number(b)
    : (a, b) => String(a).localeCompare(String(b), 'es', { numeric: true }));
}

function populateSelect(id, values, allLabel) {
  const select = document.getElementById(id);
  const selectedValue = select.value;
  select.replaceChildren(new Option(allLabel, ''));
  values.forEach((value) => select.add(new Option(value, value)));
  if ([...select.options].some((option) => option.value === selectedValue)) {
    select.value = selectedValue;
  }
}

function readFilters() {
  return {
    nombre: document.getElementById('filtroNombre').value,
    grado: document.getElementById('filtroGrado').value,
    materia: document.getElementById('filtroMateria').value,
    periodo: document.getElementById('filtroPeriodo').value,
    entregadoEstudiante: document.getElementById('filtroEntregadoEstudiante').value,
    entregadoDocente: document.getElementById('filtroEntregadoDocente').value,
  };
}

function restoreFilters() {
  try {
    const filters = JSON.parse(sessionStorage.getItem(FILTERS_STORAGE_KEY) || '{}');
    document.getElementById('filtroNombre').value = filters.nombre || '';
    document.getElementById('filtroGrado').value = filters.grado || '';
    document.getElementById('filtroMateria').value = filters.materia || '';
    document.getElementById('filtroPeriodo').value = filters.periodo || '';
    document.getElementById('filtroEntregadoEstudiante').value = filters.entregadoEstudiante || '';
    document.getElementById('filtroEntregadoDocente').value = filters.entregadoDocente || '';
  } catch (error) {
    sessionStorage.removeItem(FILTERS_STORAGE_KEY);
  }
}

function normalizeForSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function applyFiltersAndRenderTable({ resetPage = true } = {}) {
  const filters = readFilters();
  sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  const nameQuery = normalizeForSearch(filters.nombre);

  state.filteredTalleres = state.allTalleres.filter((taller) => {
    const searchableStudent = normalizeForSearch(`${taller.nombre} ${taller.numero_identificacion}`);
    return (!nameQuery || searchableStudent.includes(nameQuery))
      && (!filters.grado || String(taller.grado) === filters.grado)
      && (!filters.materia || String(taller.nombre_materia) === filters.materia)
      && (!filters.periodo || String(taller.periodo) === filters.periodo)
      && matchesBooleanFilter(taller.taller_entregado_estudiante, filters.entregadoEstudiante)
      && matchesBooleanFilter(taller.taller_entregado_docente, filters.entregadoDocente);
  }).sort(compareTalleres);

  if (resetPage) state.page = 1;
  renderTable();
  document.getElementById('contadorResultados').textContent = `${state.filteredTalleres.length} de ${state.allTalleres.length} talleres`;
}

function matchesBooleanFilter(value, filterValue) {
  if (!filterValue) return true;
  return Boolean(value) === (filterValue === 'true');
}

function compareTalleres(a, b) {
  return String(a.grado).localeCompare(String(b.grado), 'es', { numeric: true })
    || String(a.nombre).localeCompare(String(b.nombre), 'es')
    || String(a.nombre_materia).localeCompare(String(b.nombre_materia), 'es')
    || Number(a.periodo) - Number(b.periodo);
}

function clearFilters() {
  ['filtroNombre', 'filtroGrado', 'filtroMateria', 'filtroPeriodo', 'filtroEntregadoEstudiante', 'filtroEntregadoDocente']
    .forEach((id) => { document.getElementById(id).value = ''; });
  applyFiltersAndRenderTable();
  document.getElementById('filtroNombre').focus();
}

function renderTable() {
  const tbody = document.querySelector('#tabla-talleres tbody');
  tbody.replaceChildren();

  if (state.filteredTalleres.length === 0) {
    setTableMessage(state.allTalleres.length === 0
      ? 'Todavía no hay talleres cargados. Use “Cargar datos” para comenzar.'
      : 'No hay talleres que coincidan con los filtros seleccionados.');
    updatePagination();
    return;
  }

  const totalPages = Math.ceil(state.filteredTalleres.length / state.pageSize);
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const start = (state.page - 1) * state.pageSize;
  const visibleTalleres = state.filteredTalleres.slice(start, start + state.pageSize);
  const fragment = document.createDocumentFragment();
  visibleTalleres.forEach((taller) => fragment.appendChild(createWorkshopRow(taller)));
  tbody.appendChild(fragment);
  updatePagination();
}

function changePage(direction) {
  const totalPages = Math.max(1, Math.ceil(state.filteredTalleres.length / state.pageSize));
  state.page = Math.min(totalPages, Math.max(1, state.page + direction));
  renderTable();
  document.querySelector('.table-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updatePagination() {
  const total = state.filteredTalleres.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  const start = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const end = Math.min(state.page * state.pageSize, total);
  document.getElementById('resumenPagina').textContent = total === 0
    ? 'Sin resultados'
    : `${start}–${end} de ${total} · Página ${state.page} de ${totalPages}`;
  document.getElementById('paginaAnterior').disabled = state.page <= 1 || total === 0;
  document.getElementById('paginaSiguiente').disabled = state.page >= totalPages || total === 0;
}

function createWorkshopRow(taller) {
  const row = document.createElement('tr');
  row.appendChild(textCell(formatStudentName(taller.nombre), 'student-name'));
  row.appendChild(textCell(taller.grado));
  row.appendChild(textCell(taller.nombre_materia));
  row.appendChild(textCell(taller.periodo, 'text-center'));
  row.appendChild(createStatusCell(taller, 'estudiante'));
  row.appendChild(textCell(formatDate(taller.fecha_entrega_estudiante), 'date-cell'));
  row.appendChild(createStatusCell(taller, 'docente'));
  row.appendChild(textCell(formatDate(taller.fecha_entrega_docente), 'date-cell'));
  row.appendChild(createObservationCell(taller));
  return row;
}

function textCell(value, className = '') {
  const cell = document.createElement('td');
  cell.textContent = value ?? '';
  if (className) cell.className = className;
  return cell;
}

function createStatusCell(taller, type) {
  const isStudent = type === 'estudiante';
  const property = isStudent ? 'taller_entregado_estudiante' : 'taller_entregado_docente';
  const cell = document.createElement('td');
  cell.className = 'status-cell';
  const label = document.createElement('label');
  label.className = 'status-control';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(taller[property]);
  checkbox.disabled = !state.editEnabled;
  checkbox.setAttribute('aria-label', `${isStudent ? 'Recibido del estudiante' : 'Entregado al docente'}: ${taller.nombre}`);
  const text = document.createElement('span');
  text.textContent = checkbox.checked ? 'Sí' : 'No';
  text.className = checkbox.checked ? 'status-yes' : 'status-no';
  checkbox.addEventListener('change', () => saveDeliveryStatus(taller, type, checkbox));
  label.append(checkbox, text);
  cell.appendChild(label);
  return cell;
}

function createObservationCell(taller) {
  const cell = document.createElement('td');
  cell.className = 'observation-cell';
  const content = document.createElement('div');
  content.className = 'observation-content';
  const text = document.createElement('span');
  text.className = taller.observaciones ? 'observation-text' : 'observation-text observation-text--empty';
  text.textContent = taller.observaciones || 'Sin observaciones';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-sm btn-outline-primary';
  button.textContent = taller.observaciones ? 'Editar' : 'Agregar';
  button.disabled = !state.editEnabled;
  button.addEventListener('click', () => openObservationModal(taller));
  content.append(text, button);
  cell.appendChild(content);
  return cell;
}

async function saveDeliveryStatus(taller, type, checkbox) {
  checkbox.disabled = true;
  const endpoint = type === 'estudiante' ? 'entrega-estudiante' : 'entrega-docente';

  try {
    const payload = await apiRequest(`api/talleres/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_estudiante: taller.id_estudiante,
        id_materia: taller.id_materia,
        periodo: taller.periodo,
        entregado: checkbox.checked,
      }),
    });
    Object.assign(taller, payload.taller);
    updateMetrics();
    applyFiltersAndRenderTable({ resetPage: false });
    showToast('Cambio guardado', payload.message);
  } catch (error) {
    handleProtectedError(error);
    renderTable();
  }
}

function openObservationModal(taller) {
  state.currentObservation = taller;
  document.getElementById('contextoObservacion').textContent = `${formatStudentName(taller.nombre)} · ${taller.nombre_materia} · Periodo ${taller.periodo}`;
  document.getElementById('textoObservaciones').value = taller.observaciones || '';
  updateObservationCounter();
  observationsModal.show();
}

async function saveObservation(event) {
  event.preventDefault();
  const taller = state.currentObservation;
  if (!taller) return;

  const button = document.getElementById('guardarObservaciones');
  setButtonLoading(button, true, 'Guardando…');
  try {
    const payload = await apiRequest('api/talleres/actualizar-observaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_estudiante: taller.id_estudiante,
        id_materia: taller.id_materia,
        periodo: taller.periodo,
        observaciones: document.getElementById('textoObservaciones').value,
      }),
    });
    Object.assign(taller, payload.taller);
    observationsModal.hide();
    applyFiltersAndRenderTable({ resetPage: false });
    showToast('Observación guardada', payload.message);
  } catch (error) {
    handleProtectedError(error);
  } finally {
    setButtonLoading(button, false);
  }
}

function updateObservationCounter() {
  document.getElementById('contadorObservacion').textContent = document.getElementById('textoObservaciones').value.length;
}

function handleProtectedError(error) {
  showToast('No se guardó el cambio', error.message, true);
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

function updateMetrics() {
  document.getElementById('totalTalleres').textContent = state.allTalleres.length;
  document.getElementById('totalEntregadosEstudiante').textContent = state.allTalleres.filter((item) => Boolean(item.taller_entregado_estudiante)).length;
  document.getElementById('totalEntregadosDocente').textContent = state.allTalleres.filter((item) => Boolean(item.taller_entregado_docente)).length;
  document.getElementById('totalPendientes').textContent = state.allTalleres.filter((item) => !item.taller_entregado_estudiante).length;
}

function setTableMessage(message) {
  const tbody = document.querySelector('#tabla-talleres tbody');
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 9;
  cell.className = 'table-message';
  cell.textContent = message;
  row.appendChild(cell);
  tbody.replaceChildren(row);
}

function formatStudentName(name) {
  return String(name || '').toLocaleLowerCase('es').replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase('es'));
}

function formatDate(value) {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}

function setButtonLoading(button, loading, loadingText = 'Cargando…') {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function showToast(header, message, isError = false) {
  const toastElement = document.getElementById('liveToast');
  const toastHeader = document.getElementById('toastHeader');
  toastHeader.textContent = header;
  toastHeader.className = isError ? 'me-auto text-danger' : 'me-auto text-success';
  document.getElementById('toastBody').textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastElement).show();
}
