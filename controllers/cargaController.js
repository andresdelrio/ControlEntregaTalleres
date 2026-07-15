const db = require('../config/db').promisePool;
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const REQUIRED_COLUMNS = ['estudiante', 'documento', 'grupo', 'periodo', 'materia'];

const parseFile = async (filePath, fileExtension) => {
  if (fileExtension === '.xlsx') {
    try {
      const rows = await readXlsxFile(filePath);
      if (rows.length === 0) return [];
      const [headers, ...dataRows] = rows;
      return dataRows
        .filter((row) => row.some((value) => value !== null && value !== ''))
        .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
    } catch (error) {
      const parseError = new Error('No se pudo leer el archivo Excel. Verifique que no esté dañado.');
      parseError.status = 400;
      throw parseError;
    }
  }

  if (fileExtension === '.csv') {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', () => {
          const parseError = new Error('No se pudo leer el archivo CSV.');
          parseError.status = 400;
          reject(parseError);
        });
    });
  }

  const formatError = new Error('Formato de archivo no soportado.');
  formatError.status = 400;
  throw formatError;
};

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeRows(data) {
  const errors = [];
  const recordsByKey = new Map();

  data.forEach((row, index) => {
    const normalizedRow = Object.entries(row).reduce((normalized, [key, value]) => {
      normalized[normalizeText(key).toLowerCase()] = value;
      return normalized;
    }, {});

    const missingColumns = REQUIRED_COLUMNS.filter((column) => !(column in normalizedRow));
    if (missingColumns.length > 0) {
      errors.push(`Fila ${index + 2}: faltan las columnas ${missingColumns.join(', ')}.`);
      return;
    }

    const nombre = normalizeText(normalizedRow.estudiante);
    const numero_identificacion = normalizeText(normalizedRow.documento);
    const grado = normalizeText(normalizedRow.grupo);
    const nombre_materia = normalizeText(normalizedRow.materia);
    const periodo = Number(normalizedRow.periodo);

    if (!nombre || !numero_identificacion || !grado || !nombre_materia
        || !Number.isInteger(periodo) || periodo <= 0 || periodo > 10) {
      errors.push(`Fila ${index + 2}: revise estudiante, documento, grupo, periodo y materia.`);
      return;
    }

    const record = { nombre, numero_identificacion, grado, periodo, nombre_materia };
    const key = `${numero_identificacion.toLowerCase()}|${nombre_materia.toLowerCase()}|${periodo}`;
    recordsByKey.set(key, record);
  });

  return {
    errors,
    records: Array.from(recordsByKey.values()),
    duplicates: data.length - errors.length - recordsByKey.size,
  };
}

exports.cargaMasivaUnificada = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'Seleccione un archivo .xlsx o .csv.' });
  }

  const filePath = file.path;
  const fileExtension = path.extname(file.originalname).toLowerCase();
  let connection;

  try {
    const data = await parseFile(filePath, fileExtension);
    if (data.length === 0) {
      return res.status(400).json({ message: 'El archivo no contiene registros para cargar.' });
    }

    const { errors, records, duplicates } = normalizeRows(data);
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'El archivo contiene datos que deben corregirse.',
        errors: errors.slice(0, 50),
        totalErrors: errors.length,
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    let createdAssignments = 0;
    for (const record of records) {
      const [studentResult] = await connection.query(
        `INSERT INTO estudiantes (nombre, numero_identificacion, grado)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           id_estudiante = LAST_INSERT_ID(id_estudiante),
           nombre = VALUES(nombre),
           grado = VALUES(grado)`,
        [record.nombre, record.numero_identificacion, record.grado],
      );

      const [subjectResult] = await connection.query(
        `INSERT INTO materias (nombre_materia)
         VALUES (?)
         ON DUPLICATE KEY UPDATE id_materia = LAST_INSERT_ID(id_materia)`,
        [record.nombre_materia],
      );

      const [assignmentResult] = await connection.query(
        `INSERT INTO materias_reprobadas (id_estudiante, id_materia, periodo)
         SELECT ?, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM materias_reprobadas
           WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?
         )`,
        [
          studentResult.insertId,
          subjectResult.insertId,
          record.periodo,
          studentResult.insertId,
          subjectResult.insertId,
          record.periodo,
        ],
      );
      createdAssignments += assignmentResult.affectedRows;
    }

    await connection.commit();
    return res.json({
      message: 'Carga completada.',
      summary: {
        processed: records.length,
        created: createdAssignments,
        alreadyExisting: records.length - createdAssignments,
        duplicatesInFile: Math.max(0, duplicates),
      },
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error(err);
    return res.status(err.status || 500).json({
      message: err.status ? err.message : 'No fue posible procesar el archivo.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
    fs.promises.unlink(filePath).catch(() => {});
  }
};

exports.normalizeRows = normalizeRows;
