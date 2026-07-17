# Seguimiento de talleres de recuperación

Aplicación Node.js, Express y MySQL para consultar, cargar y actualizar el estado de talleres escolares.

## Configuración

Únicamente la consulta individual para familias es pública. El seguimiento completo, los reportes, la carga y todas las operaciones de escritura requieren el código definido en `EDIT_ACCESS_CODE`.

El código debe tener al menos 6 caracteres. Se envía una sola vez al iniciar el acceso institucional; después, el servidor entrega una cookie firmada, `HttpOnly`, `SameSite=Strict`, con vigencia de ocho horas. La cookie se invalida automáticamente si cambia el código.

Variables utilizadas:

| Variable | Descripción | Valor local predeterminado |
| --- | --- | --- |
| `EDIT_ACCESS_CODE` | Código para habilitar toda el área institucional | Sin valor; el área privada queda deshabilitada |
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
4. Reinicie la aplicación Node.js.

Este cambio de privacidad no requiere migraciones ni modificaciones en MySQL. No ejecute scripts de `sql/` como parte de este despliegue.

Si `EDIT_ACCESS_CODE` no existe o tiene menos de 6 caracteres, la consulta para familias continúa disponible, pero el área institucional responde con un error controlado y no muestra datos.

## Carga de información

Use `public/plantilla_carga_talleres.csv` como referencia. Se admiten archivos `.xlsx` o `.csv` de hasta 5 MB con las columnas `Estudiante`, `Documento`, `Grupo`, `Periodo` y `Materia`.

La importación valida todas las filas antes de guardar y utiliza una transacción: si encuentra datos inválidos, no aplica cambios parciales.

## Verificación

```powershell
npm test
```
