// public/js/consultaPadres.js

document.getElementById('form-consulta').addEventListener('submit', (e) => {
    e.preventDefault();
    const numero_identificacion = document.getElementById('numero_identificacion').value;
    
    fetch(`/api/padres/consultar-talleres?numero_identificacion=${numero_identificacion}`)
      .then(response => response.json())
      .then(data => {
        const resultadosDiv = document.getElementById('resultados');
        const tablaBody = resultadosDiv.querySelector('tbody');
        const tablaHead = resultadosDiv.querySelector('thead');
        
        // Limpiar el contenido actual de la tabla
        tablaBody.innerHTML = '';

        if (data.length === 0) {
          resultadosDiv.innerText = 'No se encontraron registros para este estudiante.';
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
            <td>${taller.taller_entregado_estudiante ? 'Sí' : 'No'}</td>
            <td>${taller.fecha_entrega_estudiante ? new Date(taller.fecha_entrega_estudiante).toLocaleDateString() : ''}</td>
            <td>${taller.taller_entregado_docente ? 'Sí' : 'No'}</td>
            <td>${taller.fecha_entrega_docente ? new Date(taller.fecha_entrega_docente).toLocaleDateString() : ''}</td>
            <td>${taller.observaciones || ''}</td>
          `;
  
          tablaBody.appendChild(fila);
          
        });
  
        // Seleccionar la primera tabla que se encuentre en el documento
let table = resultadosDiv.querySelector('table');

// Recorrer todas las filas de la tabla
for (let i = 0; i < table.rows.length; i++) {
  let row = table.rows[i]; // Obtener la fila actual

  // Recorrer todas las celdas de la fila
  for (let j = 0; j < row.cells.length; j++) {
    let cell = row.cells[j]; // Obtener la celda actual
    
    // Aplicar estilos dependiendo del contenido de la celda
    if (cell.textContent.trim() === 'Sí') {
      cell.style.backgroundColor = '#17c3b2';
      cell.style.color = 'black';
    } else if (cell.textContent.trim() === 'No') {
      cell.style.backgroundColor = '#ef233c';
      cell.style.color = 'black';
    }
  }
}
      })
      .catch(err => console.error(err));
  });