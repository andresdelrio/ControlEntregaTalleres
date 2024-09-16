// public/js/consultaPadres.js

document.getElementById('form-consulta').addEventListener('submit', (e) => {
    e.preventDefault();
    const numero_identificacion = document.getElementById('numero_identificacion').value;
    
    fetch(`/api/padres/consultar-talleres?numero_identificacion=${numero_identificacion}`)
      .then(response => response.json())
      .then(data => {
        const resultadosDiv = document.getElementById('resultados');
        resultadosDiv.innerHTML = '';
  
        if (data.length === 0) {
          resultadosDiv.innerText = 'No se encontraron registros para este estudiante.';
          return;
        }
        
        let h1 = document.createElement('h2');
        h1.innerText = data[0].nombre +' - ' + data[0].grado
        const tabla = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        thead.innerHTML = `

            <th>Materia</th>
            <th>Entregado por el Estudiante</th>
            <th>Entregado al Docente</th>
            <th>Observaciones</th>
          </tr>
        `;
  
        data.forEach(taller => {
          const fila = document.createElement('tr');
  
          fila.innerHTML = `

            
            <td>${taller.nombre_materia}</td>
            <td>${taller.taller_entregado_estudiante ? 'Sí' : 'No'}</td>
            <td>${taller.taller_entregado_docente ? 'Sí' : 'No'}</td>
            <td>${taller.observaciones || ''}</td>
          `;
  
          tbody.appendChild(fila);
          
        });
  
        tabla.appendChild(thead);
        tabla.appendChild(tbody);
        resultadosDiv.appendChild(h1);
        resultadosDiv.appendChild(tabla);

        // Seleccionar la primera tabla que se encuentre en el documento
let table = document.querySelector('table');

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

