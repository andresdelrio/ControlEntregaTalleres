// controllers/talleresController.js
const connection = require('../config/db');

const moment = require('moment');

exports.registrarEntregaEstudiante = (req, res) => {
  const { id_estudiante, id_materia, periodo, entregado } = req.body;

  const fechaEntrega = entregado ? moment().format('YYYY-MM-DD') : null;

  const checkQuery = 'SELECT * FROM talleres WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?';
  connection.query(checkQuery, [id_estudiante, id_materia, periodo], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al verificar la existencia del taller.');
    }

    if (results.length > 0) {
      // Si existe, actualizar
      const updateQuery = `
        UPDATE talleres
        SET taller_entregado_estudiante = ?, fecha_entrega_estudiante = ?
        WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?
      `;
      connection.query(updateQuery, [entregado, fechaEntrega, id_estudiante, id_materia, periodo], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al actualizar la entrega del taller por parte del estudiante.');
        }
        res.send('Entrega del taller por parte del estudiante actualizada exitosamente.');
      });
    } else {
      // Si no existe, insertar
      const insertQuery = `
        INSERT INTO talleres (id_estudiante, id_materia, periodo, taller_entregado_estudiante, fecha_entrega_estudiante)
        VALUES (?, ?, ?, ?, ?)
      `;
      connection.query(insertQuery, [id_estudiante, id_materia, periodo, entregado, fechaEntrega], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al registrar la entrega del taller por parte del estudiante.');
        }
        res.send('Entrega del taller por parte del estudiante registrada exitosamente.');
      });
    }
  });
};


exports.registrarEntregaDocente = (req, res) => {
  const { id_estudiante, id_materia, periodo, entregado } = req.body;

  const fechaEntrega = entregado ? new Date() : null;

  const checkQuery = 'SELECT * FROM talleres WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?';
  connection.query(checkQuery, [id_estudiante, id_materia, periodo], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al verificar la existencia del taller.');
    }

    if (results.length > 0) {
      // Si existe, actualizar
      const updateQuery = `
        UPDATE talleres
        SET taller_entregado_docente = ?, fecha_entrega_docente = ?
        WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?
      `;
      connection.query(updateQuery, [entregado, fechaEntrega, id_estudiante, id_materia, periodo], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al actualizar la entrega del taller al docente.');
        }
        res.send('Entrega del taller al docente actualizada exitosamente.');
      });
    } else {
      // Si no existe, insertar
      const insertQuery = `
        INSERT INTO talleres (id_estudiante, id_materia, periodo, taller_entregado_docente, fecha_entrega_docente)
        VALUES (?, ?, ?, ?, ?)
      `;
      connection.query(insertQuery, [id_estudiante, id_materia, periodo, entregado, fechaEntrega], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al registrar la entrega del taller al docente.');
        }
        res.send('Entrega del taller al docente registrada exitosamente.');
      });
    }
  });
};


exports.obtenerTalleres = (req, res) => {
  const query = `
    SELECT e.id_estudiante, e.nombre, e.numero_identificacion, e.grado, m.id_materia, m.nombre_materia, mr.periodo,
      t.taller_entregado_estudiante, t.fecha_entrega_estudiante,
      t.taller_entregado_docente, t.fecha_entrega_docente, t.observaciones
    FROM estudiantes e
    JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
    JOIN materias m ON mr.id_materia = m.id_materia
    LEFT JOIN talleres t ON e.id_estudiante = t.id_estudiante AND m.id_materia = t.id_materia AND mr.periodo = t.periodo;
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
  const { id_estudiante, id_materia, periodo, observaciones } = req.body;

  const checkQuery = 'SELECT * FROM talleres WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?';
  connection.query(checkQuery, [id_estudiante, id_materia, periodo], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al verificar la existencia del taller.');
    }

    if (results.length > 0) {
      // Si existe, actualizar
      const updateQuery = `
        UPDATE talleres
        SET observaciones = ?
        WHERE id_estudiante = ? AND id_materia = ? AND periodo = ?
      `;
      connection.query(updateQuery, [observaciones, id_estudiante, id_materia, periodo], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al actualizar las observaciones.');
        }
        res.send('Observaciones actualizadas exitosamente.');
      });
    } else {
      // Si no existe, insertar
      const insertQuery = `
        INSERT INTO talleres (id_estudiante, id_materia, periodo, observaciones)
        VALUES (?, ?, ?, ?)
      `;
      connection.query(insertQuery, [id_estudiante, id_materia, periodo, observaciones], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al registrar las observaciones.');
        }
        res.send('Observaciones registradas exitosamente.');
      });
    }
  });
};