// controllers/reportesController.js
const db = require('../config/db');

exports.obtenerEstudiantesNoEntregados = async (req, res) => {
    const query = `
      SELECT 
        e.id_estudiante,
        e.nombre,
        e.grado,
        GROUP_CONCAT(CONCAT(m.nombre_materia, ' (Periodo ', mr.periodo, ')') SEPARATOR ', ') AS materias_no_entregadas
      FROM estudiantes e
      JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
      JOIN materias m ON mr.id_materia = m.id_materia
      LEFT JOIN talleres t ON e.id_estudiante = t.id_estudiante AND m.id_materia = t.id_materia AND mr.periodo = t.periodo
      WHERE t.taller_entregado_estudiante IS NULL OR t.taller_entregado_estudiante = FALSE
      GROUP BY e.id_estudiante, e.nombre, e.grado
      ORDER BY e.nombre;
    `;
  
    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error al obtener la lista de estudiantes que no han entregado talleres.');
    }
  };