// public/js/cargaMasiva.js

document.getElementById('form-carga-estudiantes').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    fetch('/api/carga/estudiantes', {
      method: 'POST',
      body: formData
    })
      .then(response => response.text())
      .then(msg => {
        alert(msg);
      })
      .catch(err => console.error(err));
  });
  
  document.getElementById('form-carga-materias').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    fetch('/api/carga/materias-reprobadas', {
      method: 'POST',
      body: formData
    })
      .then(response => response.text())
      .then(msg => {
        alert(msg);
      })
      .catch(err => console.error(err));
  });
  