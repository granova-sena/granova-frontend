# PRONT — IA de FRONTEND · Módulo Logística/Despacho de Granova

> **ROL DEL TOCK THIS FILE:** Eres la IA encargada SOLO del frontend (`granova-frontend`).
> **REGLA DE ORO: NO TOCAR NADA DEL BACKEND.** No modifiques ni leas para editar
> archivos de `granova-backend/` (ni rutas, controladores, middleware, SQL).
> El backend lo está construyendo en paralelo otra IA. Tú DEBES trabajar contra el
> **contrato de endpoints** que viene en este documento (sección 3) y **NO asumir
> que ya están desplegados**: hasta que el usuario redepliegue, esos endpoints
> responderán 404. Pisá sobre el contrato y probá cuando el backend esté arriba.

---

## 1. Contexto del negocio (para que la UI tenga sentido)

Los pedidos virtuales se dividen en dos tipos de operación:

- **Domicilio** (`operacion: "domicilio"`): pedidos pequeños. Los sigue manejando el
  **empleado** en el flujo actual (Confirmado → Empacando → En camino → Entregado).
- **Reparto** (`operacion: "reparto"`): pedidos grandes/empresas (mayoristas, jurídicas,
  o que superan el umbral). NO se avanzan a mano por el empleado: los gestiona un
  nuevo rol **`logistica`** (despachador) que agrupa 1..n pedidos en un **despacho**
  (una "salida" con un vehículo) para un **sector** elegido por el cliente.

El nuevo rol **`logistica`** tiene su propio panel. Su trabajo: agrupar pedidos de
reparto por sector en un despacho, asignar una transportadora/vehículo y avanzar el
despacho *Preparando → En ruta → Entregado*. Al marcarlo, TODOS los pedidos del
despacho avanzan solos y el cliente recibe notificación.

## 2. Arquitectura y convenciones (respetá EXACTAMENTE las existentes)

- Stack: **React + Vite + Tailwind v4**. NO agregues dependencias nuevas si se puede evitar.
- Cliente HTTP: el axios instance de `src/services/api.js` (export default `api`).
  Tiene `baseURL = API_URL + /api` y ya inyecta `Authorization: Bearer <token>`
  automáticamente según la ruta (`getActiveToken()`). Usá `api.get(...)`,
  `api.post(...)`, `api.patch(...)` — nunca `fetch`.
  - Ojo: `getActiveToken()` devuelve `token_empleado` para rutas que NO son de
    cliente. Las rutas del panel logística (`/panel-logistica/...`) no caen en el
    regex de rutas cliente de `src/services/session.js`, así que usará el token correcto.
- Roles y sesión: `localStorage` clave `usuario` con `{ rol: 'logistica', ... }` y
  token en `token_empleado` (lo setea `AdminLogin.jsx`). Para saber si un usuario es
  admin/empleado/logistica usá el patrón existente `esAdmin()` que ya existe en
  varias páginas (`JSON.parse(localStorage.getItem('usuario'))?.rol === ...`).
- Componentes reutilizables de panel: `src/components/ui/panel/PanelKit.jsx`
  (PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, Paginado, FilaGrupo,
  BotonPrimario). Reutilizalos.
- Etiquetas de estado de pedido: existen `EstadoPagoBadge` y estilos `estadoStyles`
  en `GestionPedidos.jsx` — copiá/movelos a un helper compartido si los necesitás en
  las páginas nuevas, sin alterar GestionPedidos más de lo pedido.
- **Responsive móvil (obligatorio)**: el patrón ya establecido en el repo es:
  tabla en escritorio `hidden md:block overflow-x-auto` + listas de tarjetas en móvil
  `md:hidden divide-y`. REPLICÁ ese patrón en las páginas nuevas.
- Paleta: verde institucional `#1D9E75` (hover `#178a64`) y ámbar `#D8A92E`.
- NO agregues comentarios de relleno al código. NO toques `panel-tema.css`,
  `index.css` ni `PanelKit.jsx`.

## 3. CONTRATO DE ENDPOINTS (base `API_URL` → `http://localhost:3000`)

Auth: header `Authorization: Bearer <token>` (lo maneja `api`). Errores: `{ ok: false, error: "..." }`.

### Roles por endpoint
| Endpoint | Ver | Escribir |
|---|---|---|
| GET /api/despachos, GET /api/despachos/:id, GET /api/despachos/pedidos-disponibles, GET /api/despachos/sectores | admin, empleado, logistica | — |
| POST /api/despachos, PATCH /api/despachos/:id/pedidos, PATCH /api/despachos/:id/estado, PATCH /api/despachos/pedidos/:id/operacion | admin (solo ver) | **solo logistica** |
| PATCH /api/admin/pedidos/:id/pago  `{ estado_pago: 'pagado' }` | — | **empleado o logistica** (confirma cobro manual efectivo/transferencia/contra entrega) |

### 3.1 `GET /api/despachos?estado=Preparando` → listado de despachos (opcional filtro `estado`)
```json
{ "ok": true, "despachos": [
  { "id": 1, "guia": "ORV-0001",
    "id_transportadora": 3, "transportadora": "Transportes Valle", "tipo_vehiculo": "Camión",
    "sector_destino": "Norte", "fecha_programada": "2026-09-01",
    "estado": "Preparando", "total_unidades": 150, "num_pedidos": 3,
    "creado_por_nombre": "Carlos Molina", "confirmado_por_nombre": null,
    "fecha_creacion": "...", "fecha_salida": null, "fecha_entrega": null }
]}
```

### 3.2 `GET /api/despachos/sectores` → sectores disponibles (para select de checkout y despacho)
```json
{ "ok": true, "sectores": ["Norte", "Sur", "Oriente", "Occidente", "Centro"] }
```

### 3.3 `POST /api/despachos` → crear un despacho (cuerpo: id_transportadora OPCIONAL, sector, fecha, pedidos OPCIONALES)
```json
// request
{ "id_transportadora": 3, "sector_destino": "Norte", "fecha_programada": "2026-09-01", "pedidos": [12, 55] }
// response: { "ok": true, "despacho": { ...misma forma que el item del listado 3.1 } }
```
Errores: transportadora no existe; un pedido ya está en otro despacho activo o está entregado/cancelado.

### 3.4 `GET /api/despachos/:id` → detalle con sus pedidos
```json
{ "ok": true, "despacho": {
  "id": 1, "guia": "ORV-0001", "id_transportadora": 3, "transportadora": "Transportes Valle",
  "tipo_vehiculo": "Camión", "sector_destino": "Norte", "fecha_programada": "2026-09-01",
  "estado": "Preparando", "total_unidades": 150, "num_pedidos": 2,
  "fecha_creacion": "...", "fecha_salida": null, "fecha_entrega": null,
  "pedidos": [
    { "id": 12, "pedido": "#P-00012", "cliente": "Juan Perez", "email": "juan@mail.com",
      "producto": "Café tostado x500g", "cantidad": 100, "total": 1200000,
      "estado": "Confirmado", "estado_pago": "pendiente", "metodo_pago": "transferencia",
      "sector_envio": "Norte", "fecha": "..." }
  ]
}}
```
`estado` del pedido siempre viene **en bucket de presentación**: Confirmado | Empacando | En camino | Entregado | Rechazado.

### 3.5 `PATCH /api/despachos/:id/pedidos` → agregar/quitar pedidos del despacho
```json
// request
{ "agregar": [14, 55], "quitar": [12] }
// response: { "ok": true, "despacho": { ...detalle 3.4 actualizado } }
```

### 3.6 `PATCH /api/despachos/:id/estado` → avanzar el despacho
```json
// request
{ "estado": "En ruta" }
// response: { "ok": true, "despacho": { ... } }
```
**Máquina de estados** (el backend valida):
- `Preparando` → `En ruta` (requiere al menos 1 pedido) | `Novedad`
- `En ruta` → `Entregado` | `Novedad`
- `Novedad` → `En ruta` | `Entregado`
- `Entregado` = terminal (no se vuelve).

Efecto secundario del backend (la UI NO tiene que hacer nada extra):
`En ruta` → todos los pedidos pasan a "En camino" + notificación al cliente.
`Entregado` → todos los pedidos pasan a "Entregado" + notificación al cliente.

### 3.7 `GET /api/despachos/pedidos-disponibles?search=` → pedidos de reparto disponibles para asignar
```json
{ "ok": true, "pedidos": [
  { "id": 55, "pedido": "#P-00055", "cliente": "Industrias XYZ", "email": "compras@xyz.com",
    "producto": "Café molido x1kg", "cantidad": 50, "total": 2500000,
    "estado": "Confirmado", "estado_pago": "pendiente_verificacion", "metodo_pago": "transferencia",
    "sector_envio": "Sur", "fecha": "...", "operacion": "reparto" }
]}
```
Regla: SOLO trae pedidos `operacion === "reparto"`, no entregados/cancelados y que no estén
ya dentro de un despacho activo (Preparando/En ruta/Novedad). Usá esto para el buscador
del modal "Agregar pedidos" (filtro `search` por cliente/producto/pedido).

### 3.8 `PATCH /api/despachos/pedidos/:id/operacion` → reclasificar un pedido (reparto ↔ domicilio)
```json
// request
{ "operacion": "domicilio" }
// response: { "ok": true }
```

### 3.9 Endpoints existentes que el backend MODIFICA (adaptá el frontend)
- `GET /api/admin/pedidos?...` → cada pedido ahora incluye **`operacion`** ("domicilio"|"reparto")
  y **`sector_envio`** (string|null). Usado por GestionPedidos.
- `POST /api/pedidos` (checkout cliente) → acepta ahora **`sector_envio`** opcional (string) y la
  respuesta incluye `operacion` y `sector_envio`.
- `GET /api/pedidos/cliente/:id` → cada pedido del cliente incluye **`operacion`** y **`sector_envio`**.

## 4. TAREAS DE FRONTEND (en orden)

### T1. Rol logistica: login + ruta protegida + creación de usuarios
- `src/pages/AdminLogin.jsx:55` → cambiar el redirect:
  `navigate(datos.usuario.rol === 'empleado' ? '/panel-empleado' : datos.usuario.rol === 'logistica' ? '/panel-logistica' : '/dashboard')`.
- `src/App.jsx` → agregar bloque de rutas nuevo (clon del `panel-empleado`):
  ```jsx
  <Route path="/panel-logistica" element={
    <RutaProtegida rolesPermitidos={["logistica"]}><LogisticaLayout /></RutaProtegida>
  }>
    <Route index element={<Despachos />} />
    <Route path="despachos" element={<Despachos />} />
    <Route path="reparto" element={<PedidosReparto />} />
    <Route path="transportadoras" element={<Transportadoras />} />
  </Route>
  ```
- Si `Users.jsx` (panel admin) tiene una lista `ROLES_DISPONIBLES`, agregá `'logistica'`.
- IMPORTANTE: `RutaProtegida` ya es genérica (recibe `rolesPermitidos`), no la edites.

### T2. Layout nuevo: `src/layouts/LogisticaLayout.jsx`
- CLONALO de `EmpleadoLayout.jsx`, cambiando nombres de sección (`TITULOS_NAV`) y el
  texto de bienvenida ("Panel logística"). Mantené la misma estructura visual/logout
  exactos. Navegación: Despacho, Pedidos de reparto, Transportadoras.

### T3. Página `src/pages/Despachos.jsx` — el corazón del módulo
- Resumen con `StatCard`: Preparando / En ruta / Entregado / Novedad (podés calcularlso
  client-side desde el GET de listado).
- Listado (tabla escritorio + tarjetas móviles) con columnas: Guía (`ORV-0001`),
  Vehículo (transportadora + tipo_vehiculo), Sector, Fecha programada, N° pedidos,
  Unidades, Estado (badge), acciones.
- **Botón "Nueva salida"** (solo rol logistica): modal con:
  - select de Transportadoras activas (GET /api/logistica/transportadoras, ya existe),
  - select de Sector (GET /api/despachos/sectores),
  - input fecha programada (date),
  - buscador de pedidos disponibles (GET /api/despachos/pedidos-disponibles) con
    checkboxes para agregar (multi) → POST /api/despachos.
- **Detalle** (modal o sección expandible): pedidos del despacho, botones según estado:
  - Preparando: "Agregar pedidos" (mismo buscador/checkbox del modal de crear),
    "Quitar" por pedido, "Marcar En ruta", "Marcar Novedad".
  - En ruta: "Marcar Entregado" (confirmación), "Marcar Novedad".
  - Novedad: "Marcar En ruta" / "Marcar Entregado".
  - Entregado: solo lectura.
  - Mostrar fecha salida/entrega y quién confirmó (`confirmado_por_nombre`).
- Badges de estado propuestos: Preparando → ámbar `#D8A92E`, En ruta → azul, Entregado → verde `#1D9E75`, Novedad → rojo.
- Ocultá/deshabilitá botones de escritura si el rol NO es `logistica` (patrón `esAdmin()` pero con `logistica`).

### T4. Página `src/pages/PedidosReparto.jsx`
- Listado de pedidos `operacion === 'reparto'` (usa `GET /api/admin/pedidos` con filtro
  client-side, o el helpers que tengas) mostrando: Pedido, Cliente, Producto, Cantidad,
  Total, Estado (badge), Pago, Sector.
- Acciones (solo logistica): "Reclasificar a domicilio" (PATCH /api/despachos/pedidos/:id/operacion).
- **Acción "💵 Marcar pagado"** (ya implementada): para pedidos con método manual
  (`transferencia`/`efectivo`/`contra_entrega`) y `estado_pago !== 'pagado'` se muestra un botón
  que llama `PATCH /api/admin/pedidos/:id/pago { estado_pago: 'pagado' }` (permiso: empleado o
  logistica). No mostrar para estados Rechazado/Cancelado ni para pasarela (tarjeta/pse/nequi/daviplata).
- Si el pedido ya está asignado a un despacho, mostrá aviso "Ya está en la salida ORV-xxxx"
  (podés detectarlo porque NO aparece en `/api/despachos/pedidos-disponibles`).

### T5. Transportadoras con vehículo (`src/pages/Transportadoras.jsx`)
- El backend ya soporta en las transportadoras **`tipo_vehiculo`** (texto: "Moto", "Carro",
  "Camión", etc.) y **`capacidad_kg`** (número).
- Agregá ambos campos al formulario "Agregar/Editar transportadora" y muestra `tipo_vehiculo`
  en la tabla/tarjetas. Todo contra los endpoints existentes de `/api/logistica/transportadoras`.

### T6. GestionPedidos (`src/pages/GestionPedidos.jsx`) — adaptar al split domicilio/reparto
- Mostrar badge de **Operación** junto al estado: "Domicilio" (verde) / "Reparto" (ámbar),
  y el sector si existe.
- **Para pedidos `reparto`: OCULTAR los botones de acción manual** (Aceptar/Rechazar/
  avanzar/Marcar pago). Mostrar solo "Ver detalle" + aviso "Reparto — lo coordina el
  módulo de Despacho". Aplica tanto a la fila de escritorio como a la tarjeta móvil.
  (El backend rechaza el avance manual de reparto; la UI debe evitarlo ANTES.)
- Agregar un chip de filtro "Reparto / Domicilio" si queda limpio (opcional).

### T7. Checkout cliente: sector de envío
- En la página donde se envían los datos del pedido (*revisá `PagarPage.jsx` /
  `ConfigurarPedidoPage.jsx` / `CarritoPage.jsx`* para ver dónde ocurre el `POST /api/pedidos`):
  - Cargá los sectores (`GET /api/despachos/sectores`) — el token de cliente vale.
  - Agregá un `<select>` "Sector de entrega" (además de dirección/ciudad que ya existen).
  - Enviá `sector_envio` en el body del POST.
- `MisPedidos.jsx` / `EstadoPedidoPage.jsx`: mostrar badge "Reparto"/"Domicilio" y el sector.

## 5. Cómo probar
1. Backend local corriendo (puerto 3000) o desplegado; verificar que responde
   `GET /api/despachos` (si 404 → aún no está back; coordinás con el usuario).
2. Creá un usuario rol **logistica** en el panel admin (o directamente en BD dev)
   y entrá por `/control-interno`: debe redirigir a `/panel-logistica`.
3. Flujo completo: pedido reparto (cliente mayorista/jurídica en checkout con sector)
   → aparece en PedidosReparto y en el buscador de la salida → crear salida con vehículo
   → marcar En ruta (pedidos pasan a "En camino") → Entregado (pedidos pasan a "Entregado").
4. Móvil (device toolbar ~375px): tablas → tarjetas, sin desbordes.

## 6. Restricciones del frontend
- NO toques código backend ni SQL bajo ninguna excusa (aunque el backend "falle", reportalo, no lo arregles).
- NO crees archivos fuera de `granova-frontend`.
- NO cambies estilos globales (`index.css`/`panel-tema.css`) ni `PanelKit.jsx`.
- Mantené consistencia con Tailwind v4 y el dark mode ya configurado.
- El rol admin se mantiene SOLO LECTURA en todo el panel (excepto ofertas y reseñas que ya tiene).