const db = require('../config/db').promisePool;

function parseWorkshopKey(body) {
  const id_estudiante = Number(body.id_estudiante);
  const id_materia = Number(body.id_materia);
  const periodo = Number(body.periodo);

  if (![id_estudiante, id_materia, periodo].every(Number.isInteger)
      || id_estudiante <= 0 || id_materia <= 0 || periodo <= 0) {
    return null;
  }

  return { id_estudiante, id_materia, periodo };
}

async function getWorkshopState({ id_estudiante, id_materia, periodo }) {
  const [rows] = await db.query(
    `SELECT taller_entregado_estudiante, fecha_entrega_estudiante,
            taller_entregado_docente, fecha_entrega_docente, observaciones
       FROM talleres
      WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?`,
    [id_estudiante, id_materia, periodo],
  );
  return rows[0] || null;
}

function validateBoolean(value) {
  return typeof value === 'boolean';
}

exports.registrarEntregaEstudiante = async (req, res) => {
  const key = parseWorkshopKey(req.body);
  const { entregado } = req.body;

  if (!key || !validateBoolean(entregado)) {
    return res.status(400).json({ message: 'Los datos de la entrega no son válidos.' });
  }

  try {
    await db.query(
      `INSERT INTO talleres
        (id_estudiante, id_materia, periodo, taller_entregado_estudiante, fecha_entrega_estudiante)
       VALUES (?, ?, ?, ?, IF(?, CURRENT_DATE, NULL))
       ON DUPLICATE KEY UPDATE
         taller_entregado_estudiante = ?,
         fecha_entrega_estudiante = IF(?, CURRENT_DATE, NULL)`,
      [key.id_estudiante, key.id_materia, key.periodo, entregado, entregado, entregado, entregado],
    );

    return res.json({
      message: 'Entrega del estudiante guardada.',
      taller: await getWorkshopState(key),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible guardar la entrega del estudiante.' });
  }
};

exports.registrarEntregaDocente = async (req, res) => {
  const key = parseWorkshopKey(req.body);
  const { entregado } = req.body;

  if (!key || !validateBoolean(entregado)) {
    return res.status(400).json({ message: 'Los datos de la entrega no son válidos.' });
  }

  try {
    await db.query(
      `INSERT INTO talleres
        (id_estudiante, id_materia, periodo, taller_entregado_docente, fecha_entrega_docente)
       VALUES (?, ?, ?, ?, IF(?, CURRENT_DATE, NULL))
       ON DUPLICATE KEY UPDATE
         taller_entregado_docente = ?,
         fecha_entrega_docente = IF(?, CURRENT_DATE, NULL)`,
      [key.id_estudiante, key.id_materia, key.periodo, entregado, entregado, entregado, entregado],
    );

    return res.json({
      message: 'Entrega al docente guardada.',
      taller: await getWorkshopState(key),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible guardar la entrega al docente.' });
  }
};

exports.obtenerTalleres = async (req, res) => {
  const query = `
    SELECT DISTINCT e.id_estudiante, e.nombre, e.numero_identificacion, e.grado,
      m.id_materia, m.nombre_materia, mr.periodo,
      t.taller_entregado_estudiante, t.fecha_entrega_estudiante,
      t.taller_entregado_docente, t.fecha_entrega_docente, t.observaciones
    FROM estudiantes e
    JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
    JOIN materias m ON mr.id_materia = m.id_materia
    LEFT JOIN talleres t ON e.id_estudiante = t.id_estudiante
      AND m.id_materia = t.id_materia
      AND mr.periodo = t.periodo
    ORDER BY e.grado, e.nombre, m.nombre_materia, mr.periodo;
  `;

  try {
    const [results] = await db.query(query);
    res.set('Cache-Control', 'no-store');
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible obtener los talleres.' });
  }
};

exports.actualizarObservaciones = async (req, res) => {
  const key = parseWorkshopKey(req.body);
  const observaciones = typeof req.body.observaciones === 'string'
    ? req.body.observaciones.trim()
    : null;

  if (!key || observaciones === null || observaciones.length > 2000) {
    return res.status(400).json({ message: 'La observación no es válida o supera los 2.000 caracteres.' });
  }

  try {
    await db.query(
      `INSERT INTO talleres (id_estudiante, id_materia, periodo, observaciones)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE observaciones = ?`,
      [key.id_estudiante, key.id_materia, key.periodo, observaciones, observaciones],
    );

    return res.json({
      message: 'Observaciones guardadas.',
      taller: await getWorkshopState(key),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible guardar las observaciones.' });
  }
};

exports.parseWorkshopKey = parseWorkshopKey;
