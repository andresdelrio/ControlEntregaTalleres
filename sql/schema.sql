-- sql/schema.sql

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sistema_talleres;
USE sistema_talleres;

-- Tabla 'estudiantes'
CREATE TABLE IF NOT EXISTS estudiantes (
  id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  numero_identificacion VARCHAR(50) NOT NULL UNIQUE,
  grado VARCHAR(20) NOT NULL
);

-- Tabla 'materias'
CREATE TABLE IF NOT EXISTS materias (
  id_materia INT AUTO_INCREMENT PRIMARY KEY,
  nombre_materia VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla 'materias_reprobadas'
CREATE TABLE IF NOT EXISTS materias_reprobadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_estudiante INT NOT NULL,
  id_materia INT NOT NULL,
  periodo INT,
  FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
  FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
);

-- Tabla 'talleres' con restricción de unicidad
CREATE TABLE talleres (
  id_taller INT AUTO_INCREMENT PRIMARY KEY,
  id_estudiante INT NOT NULL,
  id_materia INT NOT NULL,
  periodo INT NOT NULL,
  taller_entregado_estudiante BOOLEAN DEFAULT FALSE,
  fecha_entrega_estudiante DATE,
  taller_entregado_docente BOOLEAN DEFAULT FALSE,
  fecha_entrega_docente DATE,
  observaciones TEXT,
  FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
  FOREIGN KEY (id_materia) REFERENCES materias(id_materia),
  UNIQUE KEY unique_estudiante_materia_periodo (id_estudiante, id_materia, periodo)
);

