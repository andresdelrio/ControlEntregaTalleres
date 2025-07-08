// controllers/cargaController.js
const db = require('../config/db').promisePool;
const xlsx = require('xlsx');
const fs = require('fs');
const csv = require('csv-parser');

// Función auxiliar para parsear archivos, devuelve una promesa
const parseFile = (filePath, fileExtension) => {
  return new Promise((resolve, reject) => {
    if (fileExtension === 'xlsx') {
      try {
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel.'));
      }
    } else if (fileExtension === 'csv') {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(new Error('Error al leer el archivo CSV.')));
    } else {
      reject(new Error('Formato de archivo no soportado.'));
    }
  });
};

exports.cargaMasivaUnificada = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const filePath = file.path;
  const fileExtension = file.originalname.split('.').pop().toLowerCase();

  if (!['xlsx', 'csv'].includes(fileExtension)) {
    fs.unlinkSync(filePath); // Eliminar archivo no soportado
    return res.status(400).send('Formato de archivo no soportado. Por favor, suba un archivo .xlsx o .csv.');
  }

  try {
    const data = await parseFile(filePath, fileExtension);
    const errores = [];
    const registros = [];

    // 1. Validar y normalizar datos del archivo
    data.forEach((row, index) => {
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }

      const { estudiante, documento, grupo, periodo, materia } = normalizedRow;

      if (!estudiante || !documento || !grupo || !periodo || !materia) {
        errores.push(`Fila ${index + 2}: Datos incompletos. Asegúrese de que todas las columnas (Estudiante, Documento, Grupo, Periodo, Materia) estén presentes.`);
      } else {
        registros.push({
          nombre: estudiante,
          numero_identificacion: documento,
          grado: grupo,
          periodo: periodo,
          nombre_materia: materia,
        });
      }
    });

    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    // 2. Procesar registros en la base de datos
    for (const registro of registros) {
      // Usar el pool de conexiones directamente con await
      const queryEstudiante = 'INSERT IGNORE INTO estudiantes (nombre, numero_identificacion, grado) VALUES (?, ?, ?)';
      await db.query(queryEstudiante, [registro.nombre, registro.numero_identificacion, registro.grado]);

      const queryMateria = 'INSERT IGNORE INTO materias (nombre_materia) VALUES (?)';
      await db.query(queryMateria, [registro.nombre_materia]);

      const [estudianteResult] = await db.query('SELECT id_estudiante FROM estudiantes WHERE numero_identificacion = ?', [registro.numero_identificacion]);
      const [materiaResult] = await db.query('SELECT id_materia FROM materias WHERE nombre_materia = ?', [registro.nombre_materia]);

      if (estudianteResult.length > 0 && materiaResult.length > 0) {
        const id_estudiante = estudianteResult[0].id_estudiante;
        const id_materia = materiaResult[0].id_materia;

        const queryReprobada = 'INSERT IGNORE INTO materias_reprobadas (id_estudiante, id_materia, periodo) VALUES (?, ?, ?)';
        await db.query(queryReprobada, [id_estudiante, id_materia, registro.periodo]);
      } else {
        errores.push(`No se pudo encontrar el ID para el estudiante con documento ${registro.numero_identificacion} o la materia ${registro.nombre_materia}.`);
      }
    }

    if (errores.length > 0) {
        return res.status(400).json({ errores });
    }

    res.send('Carga masiva completada exitosamente.');

  } catch (err) {
    console.error(err);
    res.status(500).send('Error durante el procesamiento del archivo o la carga de datos.');
  } finally {
    // 3. Asegurar que el archivo se elimine
    fs.unlinkSync(filePath);
  }
};