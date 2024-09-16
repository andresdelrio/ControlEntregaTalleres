// controllers/cargaController.js
const connection = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

exports.cargaMasivaEstudiantes = (req, res) => {
  const file = req.file;
  const workbook = xlsx.readFile(file.path);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const errores = [];
  const estudiantes = [];

  data.forEach((row, index) => {
    const { nombre, numero_identificacion, grado } = row;

    if (!nombre || !numero_identificacion || !grado) {
      errores.push(`Fila ${index + 2}: Datos incompletos.`);
    } else {
      estudiantes.push([nombre, numero_identificacion, grado]);
    }
  });

  if (errores.length > 0) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ errores });
  }

  const query = 'INSERT INTO estudiantes (nombre, numero_identificacion, grado) VALUES ?';
  connection.query(query, [estudiantes], (err) => {
    fs.unlinkSync(file.path);
    if (err) {
      console.error(err);
      return res.status(500).send('Error al insertar los estudiantes.');
    }
    res.send('Estudiantes cargados exitosamente.');
  });
};

exports.cargaMasivaMateriasReprobadas = (req, res) => {
  const file = req.file;
  const workbook = xlsx.readFile(file.path);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const errores = [];
  const materiasReprobadas = [];
  const materiasNuevas = new Set();

  data.forEach((row, index) => {
    const { numero_identificacion, nombre_materia } = row;

    if (!numero_identificacion || !nombre_materia) {
      errores.push(`Fila ${index + 2}: Datos incompletos.`);
    } else {
      materiasNuevas.add(nombre_materia);
      materiasReprobadas.push({ numero_identificacion, nombre_materia });
    }
  });

  if (errores.length > 0) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ errores });
  }

  // Insertar materias nuevas
  const materiasArray = Array.from(materiasNuevas).map((nombre) => [nombre]);
  const queryMaterias = 'INSERT IGNORE INTO materias (nombre_materia) VALUES ?';
  connection.query(queryMaterias, [materiasArray], (err) => {
    if (err) {
      fs.unlinkSync(file.path);
      console.error(err);
      return res.status(500).send('Error al insertar las materias.');
    }

    // Obtener IDs de estudiantes y materias
    const promesas = materiasReprobadas.map((item) => {
      return new Promise((resolve, reject) => {
        connection.query(
          `SELECT e.id_estudiante, m.id_materia FROM estudiantes e, materias m WHERE e.numero_identificacion = ? AND m.nombre_materia = ?`,
          [item.numero_identificacion, item.nombre_materia],
          (err, results) => {
            if (err) reject(err);
            else if (results.length === 0) {
              errores.push(`No se encontró estudiante o materia en la fila con identificación ${item.numero_identificacion} y materia ${item.nombre_materia}.`);
              resolve(null);
            } else {
              resolve([results[0].id_estudiante, results[0].id_materia]);
            }
          }
        );
      });
    });

    Promise.all(promesas)
      .then((resultados) => {
        const registros = resultados.filter((r) => r !== null);
        if (errores.length > 0) {
          fs.unlinkSync(file.path);
          return res.status(400).json({ errores });
        }

        const queryReprobadas = 'INSERT INTO materias_reprobadas (id_estudiante, id_materia) VALUES ?';
        connection.query(queryReprobadas, [registros], (err) => {
          fs.unlinkSync(file.path);
          if (err) {
            console.error(err);
            return res.status(500).send('Error al insertar las materias reprobadas.');
          }
          res.send('Materias reprobadas cargadas exitosamente.');
        });
      })
      .catch((err) => {
        fs.unlinkSync(file.path);
        console.error(err);
        res.status(500).send('Error al procesar los datos.');
      });
  });
};
