# PRONT PARA LA IA DEL FRONTEND — Granova cobra de verdad (P0)

> Instrucciones para rediseñar el frontend de Granova a partir de los cambios que ya se hicieron en el backend.
> Léelo completo antes de tocar código.

---

## ROL

Eres el/la desarrollador(a) frontend de **Granova**, un e-commerce de café en grano (finca → catálogo → pedido pagado → el empleado despacha → transportadora → factura). Stack: **React + Vite + Tailwind**, paleta oscura verde:

- Fondo: `#0a1a0a` / `#0F1D13` / tarjetas `#14291B`
- Acentos: `#6FA98C`, `#9DC9B4` (verdes), `#D85A30` (naranja/alertas)
- Texto claro; bordes sutiles verdes

**No toques**: `src/services/session.js` (maneja `token_cliente` y `token_empleado` según rol), `API_URL`, catálogo, carrito (excepto el checkout), login, registro ni reseñas, salvo lo listado aquí.

---

## CONTEXTO (cambio clave)

Hoy un pedido "nace confirmado" sin cobrar. **Eso cambió.** El backend ahora maneja **`estado_pago`** separado del **`estado` logístico**, y según el método de pago el pedido **nace "pendiente"**:

| Método | `estado_pago` al nacer | Qué pasa |
|---|---|---|
| `tarjeta`, `pse`, `nequi`, `daviplata` | `pendiente` | Se redirige a la **pasarela** (simulada por ahora); al aprobarse → `pagado` + pedido `confirmado` |
| `transferencia`, `efectivo` | `pendiente_verificacion` | El **empleado** revisa y da **"Marcar pago recibido"** → `pagado` |
| `contra_entrega` | `pendiente` | Empleado le da **"Aceptar"** (→ `confirmado`) y cobra al entregar |

El pedido ya **NO** se muestra como "confirmado" al instante: primero paga o queda pendiente de pago.

---

## NUEVO CONTRATO API (JSON que debes pintar)

Todos los fetch de **cliente** llevan `Authorization: Bearer <token_cliente>`. Los del **panel** llevan `Authorization: Bearer <token_empleado>`.

### 1) Crear pedido — `POST {API_URL}/api/pedidos`
Envío:
```json
{
  "id_cliente": 5,
  "metodo_pago": "tarjeta | pse | nequi | daviplata | transferencia | efectivo | contra_entrega",
  "direccion_envio": "...",
  "ciudad_envio": "...",
  "productos": [{ "id_producto": 1, "cantidad": 2, "id_formato": 3, "precio": 20000 }],
  "codigo_cupon": "GRANOVA10"
}
```
Respuesta:
```json
{
  "ok": true,
  "data": {
    "id_pedido": 123,
    "estado": "pendiente",
    "estado_pago": "pendiente",
    "total": 44000,
    "pago": { "referencia": "SIM-xxxx" },
    "mensaje": "Pedido creado. Completa el pago para confirmarlo."
  }
}
```
- **Pasarela** (`tarjeta/pse/nequi/daviplata`) → `pago.referencia` presente: abre la pasarela simulada.
- `transferencia/efectivo` → `estado_pago: "pendiente_verificacion"`.
- `contra_entrega` → `estado_pago: "pendiente"`.

> ⚠️ Vas a encontrar que el checkout actual hace un `fetch(...)` a `/api/pedidos` **sin** incluir `Authorization`. Ese fetch ahora **requiere** el header con `token_cliente` (lo tienes en `session.js`), o el backend responderá 401.

### 2) Estado del pago — `GET {API_URL}/api/pagos/pedido/:id`
```json
{
  "ok": true,
  "data": {
    "estado_pago": "pendiente",
    "pago": { "referencia": "SIM-xxxx", "metodo_pago": "tarjeta", "monto": 44000, "estado": "pendiente", "fecha": "..." },
    "pedido": { "estado": "pendiente", "total": 44000 }
  }
}
```
Úsalo para la ruta `/pagar?ref=...` (si el cliente cerró la pasarela y vuelve a entrar) y para mostrar el estado de pago.

### 3) Procesar pago (pasarela simulada) — `POST {API_URL}/api/pagos/:referencia/procesar`
```json
{ "resultado": "aprobado" }
// o
{ "resultado": "rechazado" }
```
Respuesta:
```json
{ "ok": true, "data": { "estado_pago": "pagado", "estado": "confirmado" } }
```
- `aprobado` → `estado_pago: "pagado"`, el pedido pasa a `confirmado` (esto dispara la notificación "Pago aprobado" y los puntos de lealtad).
- `rechazado` → `estado_pago: "fallido"`, el artículo vuelve a tener stock (notifica "Pago no procesado").

### 4) Empleado marca pago — `PATCH {API_URL}/api/admin/pedidos/:id/pago`
Solo panel admin/empleado.
```json
{ "estado_pago": "pagado" }
```
Usado para `transferencia / efectivo / contra_entrega` (verificación manual o cobro al entregar). Al pasar a `pagado`, si el pedido aún estaba `pendiente`, pasa a `confirmado`.

### 5) Factura — `GET {API_URL}/api/facturas/:id_pedido`
Ahora trae datos fiscales y desglose de IVA por tasa:
```json
{
  "ok": true,
  "data": {
    "numero_factura": "FE-2026-0001",
    "fecha": "...",
    "tipo_persona": "natural | juridica",
    "numero_documento": "123456789",
    "razon_social": "John Doe",
    "email": "jhon@correo.com",
    "subtotal": 36638.66,
    "impuestos": 7361.34,
    "impuestos_por_tasa": [{ "tasa": 5, "valor": 1800 }, { "tasa": 19, "valor": 5561.34 }],
    "total": 44000,
    "estado_pago": "pagado",
    "productos": [...]
  }
}
```

---

## PANTALLAS NUEVAS / REDISEÑO

### 1) Checkout / Confirmar pedido (ConfigurarPedidoPage + paso final)

- Muestra las **7 opciones de pago con ícono**: tarjeta, PSE, Nequi, Daviplata, transferencia, efectivo, contra entrega.
- **Tarjeta / PSE / Nequi / Daviplata**: tras confirmar, **NO** navegues a "pedido confirmado". Ve a una pantalla/overlay de **PASARELA SIMULADA**:
  - Spinner "Redirigiendo a la pasarela segura..."
  - Muestra monto total, método y referencia (`SIM-...`).
  - Dos botones claros: **"Pagar (simular éxito)"** → `procesar {resultado:'aprobado'}` → pantalla de éxito (confeti) + botón "Ver mi pedido". **"Cancelar (simular fallo)"** → `{resultado:'rechazado'}` → pantalla de fallo + "Intentar de nuevo".
  - Debe existir ruta directa `/pagar?ref=...` (o equivalente) por si el cliente cierra y retoma: consulta `GET /api/pagos/pedido/:id` y si sigue `pendiente`, vuelve a mostrar la pasarela.
- **Transferencia / Efectivo**: tras confirmar → pantalla "Pedido en verificación de pago" (ámbar), mostrando los datos de tu cuenta de transferencia y un aviso de revisión por el equipo.
- **Contra entrega**: tras confirmar → pantalla "Pagas al recibir" (verde suave) + nota de que se cobra al entregar.

### 2) Estado de pedido (EstadoPedidoPage + stepper)

Pinta **DOS líneas independientes**:
- **a) Pago** (colores): `pendiente` gris → `pendiente_verificacion` ámbar → `pagado` verde / `fallido` rojo.
- **b) Entrega** (stepper actual): `pendiente → confirmado → empacando → en camino → entregado`.
- Badges separados con estos colores. Si `estado_pago === 'fallido'` o `pendiente` con método pasarela, muestra botón **"Pagar ahora"**.

### 3) Mis pedidos

- Agrega badge/columna de `estado_pago`.
- Botón contextual:
  - `pendiente` (pasarela) → **"Pagar ahora"**.
  - `pendiente_verificacion` → "En verificación" (sin acciones).
  - `pagado` → check verde. `fallido` → **"Intentar pagar"**.

### 4) Panel Gestión de pedidos (admin y empleado)

- En cada tarjeta: **badge de pago** junto al estado logístico.
- Nuevo botón **"Marcar pago recibido"** → `PATCH /admin/pedidos/:id/pago {estado_pago:'pagado'}` (para transferencia/efectivo/contra-entrega).
- Detalle/modal de pago: método, monto, referencia, fecha, estado.
- **No dejes avanzar a "Empacando"** cuando `estado_pago === 'fallido'` (muestra aviso). Contra-entrega sí avanza desde `pendiente` (se cobra al entregar).
- Agrega **filtro por estado_pago**.

### 5) Factura (modal admin + vista/descarga del cliente)

- Imprime: número `FE-NNNN`, **datos fiscales** (tipo persona, número de documento, razón social, email), **desglose de IVA por tasa** (5% café, 19% máquinas, 0% verde), total y `estado_pago`. Mantén el estilo actual de factura.

### 6) Notificaciones

- Pinta los nuevos títulos/mensajes **"Pago aprobado"** y **"Pago no procesado"** que el backend ya emite. El resto igual.

---

## REGLAS DE PINTADO

- Siempre la paleta actual; separa visualmente **PAGO** (verde/ámbar/rojo/gris) de **ENTREGA**.
- Estados de pago:
  - `pendiente` → gris `#9CAA9F`
  - `pendiente_verificacion` → ámbar `#D8A92E`
  - `pagado` → verde `#1D9E75`
  - `fallido` → rojo `#D85A30`
- El header `Authorization: Bearer <token_cliente>` es obligatorio en los fetch de cliente; el panel usa `token_empleado`. Respeta la sesión por rol (un admin en `/dashboard` jamás debe ver las pestañas/sesión de un cliente).
- **No dejes botones muertos**: todo lleva a una acción real contra estos endpoints.
- Verifica con **`npm run build`** antes de entregar.
- Si el checkout actual contradice este contrato (ej. muestra el pedido confirmado al instante), cámbialo según lo de arriba.