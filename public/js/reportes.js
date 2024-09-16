// public/js/reportes.js

document.addEventListener('DOMContentLoaded', () => {
    cargarEstudiantesNoEntregados();
  });
  
  function cargarEstudiantesNoEntregados() {
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
      })
      .catch(err => console.error(err));
  }
  