-- Ejecutar una sola vez en instalaciones existentes, desde phpMyAdmin o la consola MySQL.
-- Conserva el primer registro de cada asignación y evita duplicados futuros.

DELETE repetida
FROM materias_reprobadas repetida
JOIN materias_reprobadas original
  ON repetida.id_estudiante = original.id_estudiante
  AND repetida.id_materia = original.id_materia
  AND repetida.periodo = original.periodo
  AND repetida.id > original.id;

ALTER TABLE materias_reprobadas
  ADD UNIQUE KEY unique_materia_reprobada (id_estudiante, id_materia, periodo);
