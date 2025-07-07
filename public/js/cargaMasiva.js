// public/js/cargaMasiva.js

document.getElementById('form-carga-unificada').addEventListener('submit', (e) => {
    e.preventDefault();
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
        alert(msg);
    })
    .catch(err => {
        alert('Error: \n' + err.message);
        console.error(err);
    });
});
  