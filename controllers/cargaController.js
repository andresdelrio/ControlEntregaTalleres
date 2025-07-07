// controllers/cargaController.js
const connection = require('../config/db');
const xlsx = require('xlsx');
const fs = require('fs');
const csv = require('csv-parser');

exports.cargaMasivaUnificada = (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }

  const filePath = file.path;
  const fileExtension = file.originalname.split('.').pop().toLowerCase();

  let dataPromise;

  if (fileExtension === 'xlsx') {
    dataPromise = new Promise((resolve, reject) => {
      try {
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel.'));
      }
    });
  } else if (fileExtension === 'csv') {
    dataPromise = new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(new Error('Error al leer el archivo CSV.'));
        });
    });
  } else {
    fs.unlinkSync(filePath);
    return res.status(400).send('Formato de archivo no soportado. Por favor, suba un archivo .xlsx o .csv.');
  }

  dataPromise.then(data => {
    const errores = [];
    const registros = [];

    data.forEach((row, index) => {
      // Normalizar los nombres de las columnas para que sean insensibles a mayúsculas/minúsculas y espacios
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }

      const Estudiante = normalizedRow.estudiante;
      const Documento = normalizedRow.documento;
      const Grupo = normalizedRow.grupo;
      const Periodo = normalizedRow.periodo;
      const Materia = normalizedRow.materia;

      if (!Estudiante || !Documento || !Grupo || !Periodo || !Materia) {
        errores.push(`Fila ${index + 2}: Datos incompletos. Asegúrese de que todas las columnas (Estudiante, Documento, Grupo, Periodo, Materia) estén presentes.`);
      } else {
        registros.push({
          nombre: Estudiante,
          numero_identificacion: Documento,
          grado: Grupo,
          periodo: Periodo,
          nombre_materia: Materia,
        });
      }
    });

    if (errores.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ errores });
    }

    const procesarRegistros = async () => {
      try {
        for (const registro of registros) {
          // 1. Insertar estudiante (o ignorar si ya existe)
          const queryEstudiante = 'INSERT IGNORE INTO estudiantes (nombre, numero_identificacion, grado) VALUES (?, ?, ?)';
          await connection.promise().query(queryEstudiante, [registro.nombre, registro.numero_identificacion, registro.grado]);

          // 2. Insertar materia (o ignorar si ya existe)
          const queryMateria = 'INSERT IGNORE INTO materias (nombre_materia) VALUES (?)';
          await connection.promise().query(queryMateria, [registro.nombre_materia]);

          // 3. Obtener IDs
          const [estudianteResult] = await connection.promise().query('SELECT id_estudiante FROM estudiantes WHERE numero_identificacion = ?', [registro.numero_identificacion]);
          const [materiaResult] = await connection.promise().query('SELECT id_materia FROM materias WHERE nombre_materia = ?', [registro.nombre_materia]);

          if (estudianteResult.length > 0 && materiaResult.length > 0) {
            const id_estudiante = estudianteResult[0].id_estudiante;
            const id_materia = materiaResult[0].id_materia;

            // 4. Insertar en materias_reprobadas
            const queryReprobada = 'INSERT INTO materias_reprobadas (id_estudiante, id_materia, periodo) VALUES (?, ?, ?)';
            await connection.promise().query(queryReprobada, [id_estudiante, id_materia, registro.periodo]);
          } else {
            errores.push(`No se pudo encontrar el ID para el estudiante con documento ${registro.numero_identificacion} o la materia ${registro.nombre_materia}.`);
          }
        }

        if (errores.length > 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ errores });
        }

        res.send('Carga masiva completada exitosamente.');
      } catch (err) {
        console.error(err);
        res.status(500).send('Error durante el procesamiento de los datos en la base de datos.');
      } finally {
        fs.unlinkSync(filePath);
      }
    };

    procesarRegistros();

  }).catch(error => {
    fs.unlinkSync(filePath);
    console.error(error);
    res.status(500).send(error.message);
  });
};

