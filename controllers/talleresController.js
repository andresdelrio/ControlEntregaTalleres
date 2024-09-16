// controllers/talleresController.js
const connection = require('../config/db');

const moment = require('moment');

exports.registrarEntregaEstudiante = (req, res) => {
  const { id_estudiante, id_materia, entregado } = req.body;

  const fechaEntrega = entregado ? moment().format('YYYY-MM-DD') : null;

  const query = `
    INSERT INTO talleres (id_estudiante, id_materia, taller_entregado_estudiante, fecha_entrega_estudiante)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      taller_entregado_estudiante = VALUES(taller_entregado_estudiante),
      fecha_entrega_estudiante = VALUES(fecha_entrega_estudiante)
  `;

  connection.query(query, [id_estudiante, id_materia, entregado, fechaEntrega], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al actualizar la entrega del taller por parte del estudiante.');
    }
    res.send('Entrega del taller por parte del estudiante actualizada exitosamente.');
  });
};


exports.registrarEntregaDocente = (req, res) => {
  const { id_estudiante, id_materia, entregado } = req.body;

  const query = `
    INSERT INTO talleres (id_estudiante, id_materia, taller_entregado_docente, fecha_entrega_docente)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      taller_entregado_docente = VALUES(taller_entregado_docente),
      fecha_entrega_docente = VALUES(fecha_entrega_docente)
  `;

  const fechaEntrega = entregado ? new Date() : null;

  connection.query(query, [id_estudiante, id_materia, entregado, fechaEntrega], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al actualizar la entrega del taller al docente.');
    }
    res.send('Entrega del taller al docente actualizada exitosamente.');
  });
};


exports.obtenerTalleres = (req, res) => {
  const query = `
    SELECT e.id_estudiante, e.nombre, e.numero_identificacion, e.grado, m.id_materia, m.nombre_materia,
      t.taller_entregado_estudiante, t.fecha_entrega_estudiante,
      t.taller_entregado_docente, t.fecha_entrega_docente, t.observaciones
    FROM estudiantes e
    JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
    JOIN materias m ON mr.id_materia = m.id_materia
    LEFT JOIN talleres t ON e.id_estudiante = t.id_estudiante AND m.id_materia = t.id_materia;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener los talleres.');
    }
    res.json(results);
  });
};

exports.actualizarObservaciones = (req, res) => {
  const { id_estudiante, id_materia, observaciones } = req.body;

  const query = `
    INSERT INTO talleres (id_estudiante, id_materia, observaciones)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      observaciones = VALUES(observaciones)
  `;

  connection.query(query, [id_estudiante, id_materia, observaciones], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al actualizar las observaciones.');
    }
    res.send('Observaciones actualizadas exitosamente.');
  });
};