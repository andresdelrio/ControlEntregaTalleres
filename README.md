# Seguimiento de talleres de recuperación

Aplicación Node.js, Express y MySQL para consultar, cargar y actualizar el estado de talleres escolares.

## Configuración

La consulta de datos es pública. Las operaciones que modifican información requieren el código definido en `EDIT_ACCESS_CODE`. El código debe tener al menos 6 caracteres y nunca se envía al frontend desde el servidor.

Variables utilizadas:

| Variable | Descripción | Valor local predeterminado |
| --- | --- | --- |
| `EDIT_ACCESS_CODE` | Código para habilitar edición y carga | Sin valor; las escrituras quedan deshabilitadas |
| `APP_BASE_PATH` | Prefijo público asignado por cPanel | `/seguimiento-talleres` |
| `DB_HOST` | Servidor MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña MySQL | `toor` |
| `DB_NAME` | Base de datos | `sistema_talleres` |
| `PORT` | Puerto HTTP asignado por el hosting | `3000` |

En desarrollo con PowerShell:

```powershell
$env:EDIT_ACCESS_CODE='un-codigo-seguro'
$env:DB_PASSWORD='contrasena-local'
npm start
```

## Despliegue en cPanel

La URL pública de esta instalación es `https://sanjosebetulia.edu.co/seguimiento-talleres/`. Las llamadas del navegador usan rutas relativas y Express acepta tanto `/api` en desarrollo como `/seguimiento-talleres/api` en cPanel. Si cambia la URI pública, actualice `APP_BASE_PATH`.

1. En **Setup Node.js App**, use `/seguimiento-talleres` como URL de la aplicación y seleccione `app.js` como archivo de inicio.
2. Configure `EDIT_ACCESS_CODE` y las variables `DB_*` en **Environment variables**. No suba un archivo `.env` con secretos.
3. Ejecute `npm install --omit=dev` desde la terminal o la acción de instalación de cPanel.
4. Para una base existente, ejecute una vez [la migración de duplicados](sql/migrations/2026-07-14_evitar_materias_duplicadas.sql) desde phpMyAdmin.
5. Reinicie la aplicación Node.js.

Si `EDIT_ACCESS_CODE` no existe o tiene menos de 6 caracteres, la aplicación sigue mostrando los datos pero responde con error controlado a cualquier intento de edición o carga.

## Carga de información

Use `public/plantilla_carga_talleres.csv` como referencia. Se admiten archivos `.xlsx` o `.csv` de hasta 5 MB con las columnas `Estudiante`, `Documento`, `Grupo`, `Periodo` y `Materia`.

La importación valida todas las filas antes de guardar y utiliza una transacción: si encuentra datos inválidos, no aplica cambios parciales.

## Verificación

```powershell
npm test
```
