# 🏴‍☠️ Fincas fantasma y fincas gemelas — Apunte para Jhon (Luffy)

> Fecha: 28 ago 2026 · Autor: la desarrolladora senior
> Analogía: las fincas son como las **islas del Grand Line**. Sanji (compras fincas, Breyner) registraba una isla nueva y... era como si no existiera en el mapa. Y cuando la volvía a registrar, aparecía una isla gemela. 🌴🌴

---

## 1. Por qué la finca no aparecía (isla fantasma) 👻

El panel del empleado (`ControlEmpleado`) lista las fincas llamando a `/api/inventario/por-finca`. Ese endpoint hacía:

```sql
FROM fincas f
JOIN lotes l ON l.finca = f.nombre   -- INNER JOIN
```

Un `INNER JOIN` solo devuelve filas que matcheen en **ambas** tablas. Una finca recién creada no tiene lotes todavía → **el JOIN la filtraba**. La finca se guardaba en la DB (el INSERT sí funcionaba) pero nunca salía en el panel.

**Fix:** se cambió a `LEFT JOIN` (muestra todas las fincas aunque no tengan lotes) y en el agrupado JS se agrega `if (!row.id_lote) continue;` para no crear un "lote fantasma" con `id_lote: null`.

## 2. Por qué permitía fincas gemelas (duplicados) 🪞

- `crearFinca` no revisaba si ya existía una finca con el mismo nombre.
- La tabla `fincas` no tenía `UNIQUE` en `nombre` (y el esquema vive en Supabase, no en el repo).
- Total: se creaba el mismo nombre las veces que quisieras. Como decía Zoro: *"¿Seguro que ya apuntaste esa isla en el log?"* — no, no estaba apuntada.

**Fix:** `crearFinca` ahora consulta `SELECT id FROM fincas WHERE LOWER(nombre) = LOWER($1)` antes de insertar y responde `"Ya existe una finca con ese nombre"`.

## 3. El bug hermano: renombrar era peligroso too ✏️

`actualizarFinca` permitía:
1. Renombrar una finca a un nombre ya existente (otra salida para duplicados).
2. Renombrar y **perder el vínculo con sus lotes**, porque los lotes guardan la finca como **texto** (`lotes.finca = 'Vergel Sur'`), no como id.

**Fix en `actualizarFinca`:**
- Bloquea renombrar a un nombre que ya tenga otra finca.
- Si renombras, también actualiza `lotes.finca` al nombre nuevo (para que la relación por nombre no se rompa).
- Ahora usa una transacción y `SELECT ... FOR UPDATE` (para no chocar si dos editan a la vez). 🛡️

## 4. El arreglo de fondo: `id_finca` en lotes 🔗

La relación por nombre es frágil (comas, acentos, renombres). La solución real: relación por **id**.

- Los lotes nuevos ya guardan `id_finca` (resuelto por nombre si el frontend no lo manda).
- Los JOINs principales ahora usan:
  ```sql
  LEFT JOIN lotes l ON l.id_finca = f.id OR (l.id_finca IS NULL AND l.finca = f.nombre)
  ```
  Así funcionan con datos migrados Y con los viejos (fallback por nombre).

## 5. La query para migrar: `sql/15_lotes_id_finca.sql` 🗄️

**EJECUTAR ESTO PRIMERO, ANTES de desplegar el código nuevo.** Hace:
1. Agrega la columna `id_finca` a `lotes`.
2. **Backfill**: llena `id_finca` usando el nombre (con `MIN(id)` para ser determinista).
3. Reapunta cualquier tabla con FK hacia `fincas(id)` a la finca conservada (para que el DELETE no falle).
4. **Borra fincas duplicadas** (se queda con la de menor id). ⚠️ Destructivo, pero conserva los lotes.
5. Agrega FK `lotes.id_finca → fincas.id` (`ON DELETE SET NULL`).
6. Crea índice único `fincas_nombre_lower_uq` sobre `LOWER(nombre)`: a partir de ahí la DB misma rechaza nombres repetidos.

### Orden de despliegue
1. Correr `granova-backend/sql/15_lotes_id_finca.sql` en Supabase.
2. Subir el código del backend (usa `id_finca`).

---

> **Cierre Luffy:** "¡Una isla fantasma no tenía tesoro, y una isla gemela era la misma isla!". Ya el mapa de Granova va quedando en condiciones: toda isla que registre Sanji va a aparecer y nadie la va a clonar. 🏴‍☠️☕