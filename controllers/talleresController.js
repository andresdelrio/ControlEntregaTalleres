// controllers/talleresController.js
const db = require('../config/db').promisePool;
const moment = require('moment');

exports.registrarEntregaEstudiante = async (req, res) => {
  const { id_estudiante, id_materia, periodo, entregado } = req.body;
  const fechaEntrega = entregado ? moment().format('YYYY-MM-DD') : null;

  try {
    const checkQuery = 'SELECT * FROM talleres WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?';
    const [results] = await db.query(checkQuery, [id_estudiante, id_materia, periodo]);

    if (results.length > 0) {
      const updateQuery = `
        UPDATE talleres
        SET taller_entregado_estudiante = ?, fecha_entrega_estudiante = ?
        WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?
      `;
      await db.query(updateQuery, [entregado, fechaEntrega, id_estudiante, id_materia, periodo]);
      res.send('Entrega del taller por parte del estudiante actualizada exitosamente.');
    } else {
      const insertQuery = `
        INSERT INTO talleres (id_estudiante, id_materia, periodo, taller_entregado_estudiante, fecha_entrega_estudiante)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.query(insertQuery, [id_estudiante, id_materia, periodo, entregado, fechaEntrega]);
      res.send('Entrega del taller por parte del estudiante registrada exitosamente.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en la operación de base de datos.');
  }
};

exports.registrarEntregaDocente = async (req, res) => {
  const { id_estudiante, id_materia, periodo, entregado } = req.body;
  const fechaEntrega = entregado ? new Date() : null;

  try {
    const checkQuery = 'SELECT * FROM talleres WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?';
    const [results] = await db.query(checkQuery, [id_estudiante, id_materia, periodo]);

    if (results.length > 0) {
      const updateQuery = `
        UPDATE talleres
        SET taller_entregado_docente = ?, fecha_entrega_docente = ?
        WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?
      `;
      await db.query(updateQuery, [entregado, fechaEntrega, id_estudiante, id_materia, periodo]);
      res.send('Entrega del taller al docente actualizada exitosamente.');
    } else {
      const insertQuery = `
        INSERT INTO talleres (id_estudiante, id_materia, periodo, taller_entregado_docente, fecha_entrega_docente)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.query(insertQuery, [id_estudiante, id_materia, periodo, entregado, fechaEntrega]);
      res.send('Entrega del taller al docente registrada exitosamente.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en la operación de base de datos.');
  }
};

exports.obtenerTalleres = async (req, res) => {
  const query = `
    SELECT e.id_estudiante, e.nombre, e.numero_identificacion, e.grado, m.id_materia, m.nombre_materia, mr.periodo,
      t.taller_entregado_estudiante, t.fecha_entrega_estudiante,
      t.taller_entregado_docente, t.fecha_entrega_docente, t.observaciones
    FROM estudiantes e
    JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
    JOIN materias m ON mr.id_materia = m.id_materia
    LEFT JOIN talleres t ON e.id_estudiante = t.id_estudiante AND m.id_materia = t.id_materia AND mr.periodo = t.periodo;
  `;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los talleres.');
  }
};

exports.actualizarObservaciones = async (req, res) => {
  const { id_estudiante, id_materia, periodo, observaciones } = req.body;

  try {
    const checkQuery = 'SELECT * FROM talleres WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?';
    const [results] = await db.query(checkQuery, [id_estudiante, id_materia, periodo]);

    if (results.length > 0) {
      const updateQuery = `
        UPDATE talleres
        SET observaciones = ?
        WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?
      `;
      await db.query(updateQuery, [observaciones, id_estudiante, id_materia, periodo]);
      res.send('Observaciones actualizadas exitosamente.');
    } else {
      const insertQuery = `
        INSERT INTO talleres (id_estudiante, id_materia, periodo, observaciones)
        VALUES (?, ?, ?, ?)
      `;
      await db.query(insertQuery, [id_estudiante, id_materia, periodo, observaciones]);
      res.send('Observaciones registradas exitosamente.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en la operación de base de datos.');
  }
};
