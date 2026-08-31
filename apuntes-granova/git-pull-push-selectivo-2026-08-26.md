# Git: Pull + Push selectivo en `feature/jhon` (solo empleado/admin)

> 📅 2026-08-26 · **Luffy (Jhon)**, hoy fuimos marineros cuidadosos: **Zoro** nos ayudó a no tocar lo que no debíamos y **Robin** (docs) tomó nota de cada movimiento. Ni un pedacito del tesoro de user se subió sin permiso.

## Qué pasó (resumen de la travesía)

1. Estábamos en la rama `feature/jhon` con un montón de cambios sin commitear.
2. El usuario quería **subir solo lo de empleado y admin**, NADA de user (cliente).
3. Al intentar el `pull` explotó: en el remoto había **25 commits de user** (Catálogo gigante, Favoritos, Foros, SimuladorCompra...) que chocaban con archivos de user modificados localmente.
4. **Plan ganador** (como la estrategia de Luffy con el Gomu Gomu):
   - `git stash push` → guardar los 13 archivos de **user** que bloqueaban el merge (recuperables, sin commitearlos).
   - `git add` **solo 11 archivos** de empleado/admin (sin `git add .`).
   - `git commit` → nuestro commit de empleado/admin.
   - `git pull` → se trajo los 25 commits de user y **auto-mergeó `App.jsx` sin conflictos** (rutas de user + rutas de empleado conviven).
   - `git push` → todo al remoto.

## Los comandos clave (para el cofre de Jhon)

```bash
# 1. Guardar temporalmente solo los archivos que bloquean (user)
git stash push -m "wip-user-antes-pull" -- <archivo1> <archivo2> ...

# 2. Add selectivo (NUNCA git add .)
git add src/App.jsx src/layouts/EmpleadoLayout.jsx src/pages/CosechasPlaneadas.jsx ...

# 3. Commit
git commit -m "feat: mejoras panel empleado/admin - cosechas planeadas, transportadoras, envios y manejo de sesion 401"

# 4. Pull (ya sin bloqueos)
git pull origin feature/jhon

# 5. Push
git push origin feature/jhon
```

## Qué se subió (el botín de Franky/Roosbel + empleados)

| Archivo | Rol |
|---|---|
| `src/App.jsx` | Rutas nuevas del panel empleado (cosechas, transportadoras, envíos) + merge con rutas de user |
| `src/layouts/EmpleadoLayout.jsx` | Menú empleado ampliado + toggle modo oscuro |
| `src/pages/CosechasPlaneadas.jsx` | **NUEVO** — página de cosechas planeadas |
| `src/pages/ControlLotes.jsx` | Control de lotes |
| `src/pages/GestionPedidos.jsx` | Gestión de pedidos |
| `src/pages/RegistroDeVentas.jsx` | Registro de ventas |
| `src/pages/Transportadoras.jsx` | **Franky** estaría orgulloso: transportadoras |
| `src/pages/Envios.jsx` | Envíos |
| `src/pages/ControlStock.jsx` | Inventario (admin) |
| `src/components/RutaProtegida.jsx` | Guard de rutas admin/empleado |
| `src/services/api.js` | Interceptor 401 de sesión (todos los roles) |

Commit: `6ed80d1` · Merge: `93027eb` → push `d6025a6..93027eb`

## Qué NO se subió (para que Zoro vigile el perímetro)

- ❌ **Archivos de user/cliente**: quedaron en el working tree (WIP) y 13 de ellos están guardados en el stash `wip-user-antes-pull` (recuperables con `git stash list` / `git stash pop`).
- ❌ **`apuntes-granova/`**: apuntes son LOCALES, nunca se commitean ni se pushean. Como Nami cuida el dinero, nosotros cuidamos que esto no se vaya al remoto.
- ❌ **`Empleados.jsx`, `ControlEmpleado.jsx`, `Inventario.jsx`, `DashboardHome.jsx`**: solo tenían cambios de fin de línea (LF/CRLF), sin contenido real → no valía la pena subirlos.

## La lección de hoy (como el Gear 5 del git)

- **`git pull` se niega a machacar cambios locales sin commitear** en archivos que el remoto también tocó. No es por fastidiar, es porque git no quiere perderte el trabajo (como Zoro no pierde una espada).
- **`git add .` es peligroso**: sube TODO (incluido lo que no quieres y hasta los apuntes). Mejor **add selectivo por archivo/carpeta**.
- **`git stash push -- <archivos>`** te deja guardar solo ciertos archivos y seguir con el resto. Es el truco del "guardo esto en la bodega del Sunny mientras arreglo lo otro".
- **Un merge limpio en `App.jsx`** cuando dos ramas tocan archivos distintos = git junta solito. Solo hay que verificar que las rutas de ambos lados sigan ahí (favoritos/simulador/foros de user + cosechas/transportadoras/envios de empleado). ✅

> **One Piece tip**: si alguna vez ves "Your local changes to the following files would be overwritten by merge", no entres en pánico ni hagas `git reset --hard` a lo bruto. Primero pregunta "¿este archivo es de user, de empleado o compartido?" y decide si stash, commit o descartar. Ese análisis vale más que el One Piece.
