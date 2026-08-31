# 🏴‍☠️ Wompi: el cofre empieza a cobrar de verdad — Apunte para Jhon (Luffy)

> Fecha: 29 ago 2026 · Autor: la desarrolladora senior
> Analogía: Wompi es como el **banco de World Government** (o el cofre de Nami 🪙): recibe la plata del cliente y le avisa a Granova cuando el dinero entró. Antes jugábamos a cobrar (simulador); ahora Wompi cobra de verdad.

---

## 1. El "modo simulador" vs "modo wompi" 🎮➡️💰

El backend tiene una única puerta de pagos (`utils/pasarela.js`):

- `PASARELA=simulador` (default): el pago "éxito/fallo" lo decide un botón local. Sirve para la demo del SENA.
- `PASARELA=wompi`: cada pedido crea una referencia `WOMPI-XXXX` y el frontend abre el **widget** (botón de pago) de Wompi. El dinero entra de verdad.

El front le pregunta al backend: *"¿me das la config del botón?"*. Si el backend responde `checkout: null` (Wompi no configurado), la página muestra los botones de simular. Si responde con la config, muestra "Pagar ahora 🔒". Todo en el mismo archivo `PagarPage.jsx`.

## 2. La firma de integridad: tu nombre en el mensaje de Nami 🤝

El widget de Wompi no puede fiarse de cualquier página; por eso el **backend** firma la compra con la **llave de integridad**:

```
SHA256( referencia + montoEnCentavos + "COP" + llaveIntegridad )
```

- La firma se calcula **en el servidor** (funciones `firmaIntegridad()` y `wompiCheckout()` en `utils/pasarela.js`). La llave de integridad nunca viaja al navegador. 🛡️
- Si alguien intenta cambiar el monto en el clic, la firma ya no coincide y Wompi rechaza el cobro.

## 3. "Eso dice que pagó" no basta: confirmamos contra Wompi 🔍

Que el navegador diga "pagó" no es prueba. Por eso el front llama a `POST /api/pagos/wompi/confirmar` con la `transaction_id`, y el backend:

1. Consulta la transacción real en Wompi con la **llave privada** (`obtenerTransaccionWompi`). Si no existe/no se puede consultar → no confirmamos.
2. Verifica que `tx.reference` sea la referencia de ESTE pedido.
3. Verifica que `tx.amount_in_cents` coincida con el monto (para que no paguen de menos ni alteren precios).
4. Recién si `status === 'APPROVED'`, marca `pago aprobado` + `pedido pagado`.

Esto está en `controllers/pagosController.js` → `confirmarPagoWompi`. Como Nami revisando el recibo: no hay vuelta para atrás y la plata que dice estar, está. 🧾

## 4. Webhook: Wompi nos llama por serrucho (teléfono) 📡

Pasa algo feo con PSE/Nequi/Daviplata: el cliente se va al banco y **no vuelve a nuestra página**. ¿Cómo sabemos si pagó? El **webhook**: Wompi le avisa al backend cuando la transacción `transaction.updated`.

- Ruta: `POST /api/pagos/wompi/webhook` (está ANTES del middleware de token, porque Wompi no conoce nuestros JWT).
- Seguridad: cada evento trae un **checksum** (firma) que el backend valida con el **events secret** (`validarChecksumEvento`). Si la firma no cuadra, el evento se ignora. Solo Wompi (o quien tenga el events secret) puede llamar. 🛡️
- Si el pago está pendiente y el webhook dice `APPROVED` → aprobamos. Si dice `DECLINED/VOIDED/ERROR/EXPIRED` → marcamos fallido y **devolvemos el stock** (los productos vuelven al catálogo).

## 5. El ciclo completo 🌀

```
Cliente elige tarjeta/PSE/Nequi/Daviplata
   → pedido creado + pagos con referencia WOMPI-xxx
   → PagarPage pide checkout al backend
   → widget Wompi se abre (firma validada)
   → cliente paga
   → A) widuuuuuidget devuelve transaction_id → backend confirma contra Wompi
   → B) cliente se fue al banco → webhook confirma (o falla)
   → pantalla: "¡Pago exitoso! Tu pedido será enviado en menos de 2 días." 🎉
```

## 6. Botón de "Pagar" y simulador conviven

En `PagarPage.jsx` hay **polling** cada 5s mientras el pago esté `pendiente`: así, si el cliente cerró el widget sin volver, la página termina enterándose vía webhook que el pago ya llegó. Y si Wompi no está configurado, la página cae sola en los botones de simular (ningún error, ninguna pantalla rota).

## 7. Cómo activarlo de verdad (para el despliegue real) 🚀

1. En el panel de Wompi (cuenta de Daniel): registrar el webhook apuntando a
   `https://<dominio-del-backend>/api/pagos/wompi/webhook` (evento `transaction.updated`).
2. En `granova-backend/.env` llenar: `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_KEY`, `WOMPI_EVENTS_SECRET`, y `WOMPI_SANDBOX=false` (ya en prod).
3. Cambiar `PASARELA=wompi`.
4. Probar primero con `WOMPI_SANDBOX=true` (tarjeta de prueba del panel Wompi).

> **"¡No existe el dinero gratis en el Grand Line!"** — la sorpresa de Stussy: nadie puede autoaprobarte la plata. El backend revisa el recibo real en Wompi con la llave privada. Seguro, serio y a prueba de Doflamingo (cliente tramposo). 🏴‍☠️☕

---

## 📌 Bonus: el bug de los reportes que "desaparecían" 👻

Aparte de Wompi, se arregló un bug en `Empleados.jsx`:

- **Síntoma:** el admin abría el detalle de un empleado y sus reportes no cargaban; o respondía el empleado y el admin no veía la respuesta.
- **Causa:** en React, `setSeleccionado(emp)` **no actualiza la variable de inmediato**. `abrirDetalle` llamaba a `refrescarDetalle()` que leía `seleccionado` del **closure viejo**, todavía `null`, y salía sin hacer nada.
- **Fix:** `refrescarDetalle(id)` ahora recibe el `id_usuario` por parámetro (se pasa explícito desde `abrirDetalle` y desde las acciones de reportes). Nunca más depende de un estado que aún no existe.

Como Zoro diría: *"No confíes en que el mapa esté actualizado; pasa la coordenada exacta."* 🗺️

---

## 🛍️ Ajustes de la venta al estilo "página real" (29 ago, segunda pasada)

Jhon, esto fue lo que dijo el capitán (Daniel) para que el checkout se sienta como Nequi/MercadoLibre y que la venta quede clara:

### 1. Botones de método de pago de pasarela real 💳
En `ConfigurarPedidoPage.jsx` (paso 2), cada método en línea (Tarjeta, PSE, Nequi, Daviplata) ahora es una tarjeta con su **color de marca** y, al seleccionarla, aparece un botón **"💳 Pagar con {método}"** en ese color. Darle clic **crea el pedido y abre el medio de pago al instante** (sin pasar por el paso de confirmación). La lógica se sacó a una función `confirmarYProcesar()`, que es la misma que usa el paso 3 — así no hay código duplicado.

> Analogía: cada isla tiene su bandera. Antes todos los métodos eran un botón genérico verde; ahora Nequi trae el morado de Nequi, Daviplata su rojo, así el cliente sabe a quién le va a pagar. 🏴☠️

### 2. El medio de pago se abre solito 🪄
En `PagarPage.jsx` hay un `useEffect` que, al llegar con un pago de pasarela pendiente y con la config del widget lista, **abre el widget de Wompi automáticamente** (`widgetAbierto = useRef(false)` evita que se abra dos veces). El cliente no tiene que buscar el botón: le cae el cofre en la cara.

### 3. "Se crea pendiente, se paga → Pagado" ✅
- Al crear el pedido: `estado = 'pendiente'` (sin pagar).
- Al confirmarse el pago: `estado_pago = 'pagado'` y en la BD interna `estado = 'confirmado'` (la constraint `pedidos_estado_check` NO acepta `'pagado'`, así que "pagado" vive en `estado_pago`).
- En lo que ve el cliente (`MisPedidos`, `EstadoPedidoPage`, `OrderStepper`) cuando `estado_pago === 'pagado'` se muestra la etiqueta **"Pagado"** en verde, en vez de "Confirmado". 💚

### 4. Si no se puede confirmar el pago → se rechaza la venta ❌
En `pagosController.js`, `fallarPagoEnBD` ahora:
```sql
UPDATE pedidos SET estado_pago = 'fallido', estado = 'cancelado',
       motivo_rechazo = 'Pago no confirmado' WHERE id_pedido = $1;
```
- Se devuelve el stock (los productos vuelven al catálogo).
- En el reporte/panel sale como "Rechazado" y **no cuenta como ingreso** (los reportes y el dashboard ya excluyen `cancelado`).
- El cliente en la pantalla de fallo ve: "No pudimos confirmar tu pago, así que tu pedido fue cancelado" + botones "Volver a la tienda" / "Ver mis pedidos" (ya no ofrece "reintentar" porque esa venta murió).
- Por eso también se quitó el "💳 Pagar ahora" de los pedidos fallidos en `MisPedidos` y `EstadoPedidoPage`: si la venta fue rechazada, se hace una compra nueva.

> Analogía: si Nami no confirma la moneda, la isla no se vende. Antes los pedidos fallidos quedaban flotando como barcos fantasma en "pendiente"; ahora el barco se hunde y el tesoro (stock) vuelve a la bóveda. 🚢💀

> **PD:** `PASARELA=wompi` ya está activo en modo prueba (`WOMPI_SANDBOX=true`) con tus llaves. Cuando pases a producción solo cambia `WOMPI_SANDBOX=false`.

---

## 🐛 Fix: las ventas rechazadas seguían saliendo en "Registro de ventas" (29 ago, noche)

Jhon, Daniel vio que al recargar la página **seguía apareciendo el pedido rechazado en Ventas**. Resultado de la investigación:

- **Los cambios del frontend SÍ estaban** (los confirmé en `ConfigurarPedidoPage`, `PagarPage`, `MisPedidos`, etc.) y el servidor de Vite los sirve en caliente.
- **El problema real era el BACKEND viejo**: el `server.js` llevaba corriendo desde las 9:14 AM con `node server.js` (sin recarga), o sea antes de que Godoy tocara `pagosController.js` a las 10:46 AM. Al recargar el navegador solo se actualiza el frontend; el backend se quedaba con el código anterior. Por eso **"seguía saliendo"**.

### Lo que se arregló en `granova-backend/controllers/admin/ventasController.js`

El "Registro de ventas" (`GET /ventas/listado` y `/ventas/resumen`) consultaba **todos** los pedidos, sin importar el estado. O sea que un pedido **rechazado** (`fallarPagoEnBD` pone `estado='cancelado'`) seguía:
- apareciendo en la tabla de ventas, y
- **contando en "Ventas del mes" y "Kg vendidos"** 💰

Eso contradecía al resto del sistema: `dashboardController` y `pedidosController` ya excluyen `cancelado/rechazado`. Ahora `ventasController` también lo hace:

```sql
WHERE lower(estado) NOT IN ('cancelado', 'rechazado')
```

(en el resumen, en el conteo de kg y en el listado).

> Analogía: **el mapa de Nami** registraba también los barcos hundidos como tesoro. Ahora si la isla no se vendió (pago no confirmado), no aparece en el mapa ni suma a las «Ventas del mes». Si Doflamingo no paga, su compra no ensucia las cuentas. 🗺️💰

### Recuerda para el futuro ⚓
- **Node plano no recarga solo**: si cambias archivos del backend (`.js`), hay que reiniciar `server.js`. Vite (frontend) sí recarga solo. El `node` detrás de mí reinició el backend ya con todos los cambios — confírmalo viendo que pida "Servidor corriendo en el puerto 3000".

> "Un cocinero sabe cuándo el caldo ya cambió; el resto solo mira el reloj." — Sanji, probablemente. 👨‍🍳

---

## 🛒 "Nueva venta" (mostrador): se quitó el campo Estado y se estilizó el método de pago (29 ago, noche)

Jhon, Daniel señaló que en **Registro de ventas → "Nueva venta"** seguía saliendo el selector **"Estado"** (Pendiente/Confirmado) que solo estorbaba, y que el **método de pago** se veía viejo. Cambios:

### Frontend — `Granova-Frontend/src/components/VentaModal.jsx`
- ❌ **Eliminado el campo "Estado"** (el `<select>` de Pendiente/Confirmado). Se borró el state `estado` y ya no se manda `estado` al POST `/ventas`.
- 🎨 **Método de pago estilizado como página real**: Nequi ahora usa su morado oficial `#9C0BBA` y Tarjeta el azul `#2F5CD0` (los mismos colores de marca del checkout de la tienda). Al seleccionar se ilumina el borde y el fondo en el color de la marca.

### Backend — `granova-backend/controllers/admin/ventasController.js`
- `crearVenta` ya no recibe `estado`. Como la venta de mostrador se cobra y se entrega al momento, se registra **directamente como `confirmado`** (`estadoFinal = 'confirmado'`) con `estado_pago='pagado'`. Nada de "pedidos pendientes" de mostrador que haya que confirmar después.

> Analogía: antes, vender en el mostrador era como **sembrar y esperar a que la planta creciera** (Pendiente → Confirmar). Ahora la venta de mostrador es como **Luffy mordiendo la fruta**: se paga y se confirma en el mismo instante, y el selector de "Estado" sobra. Solo las ventas online pasan por su flujo de pago. 🏴☠️👒

> **Recordatorio:** cambié el backend, y `node server.js` no recarga solo → **se reinició el servidor** (ya quedó "Servidor corriendo en el puerto 3000"). Si ves archivos viejos, Ctrl+F5. Si algo se ve raro después, revisa `UpTime` del proceso o dime. ⚓

---

## ⚖️ Campo de cantidad en "Nueva venta": solo kg válidos (29 ago, noche)

Jhon, Daniel pidió que la cantidad de productos en **"Nueva venta"** se comporte como debe en kg:

- **Unidad visible**: al seleccionar un producto, debajo del recuadro de cantidad aparece **"kg"** (o "unid." si el producto es máquina). Antes solo lo insinuaba el placeholder.
- **Sin letras ni símbolos**: el `onKeyDown={bloquearNoNumerico}` + `normalizarNumerico` bloquean letras, `e`, `+/-` y símbolos; solo dejan pasar dígitos y un punto decimal. Si pegas basura, se limpia solo.
- **Mínimo 1**: si quedó vacío, borraste todo o escribiste 0, al salir del campo se pone **1**.
- **Máximo = stock**: si escribes más de lo que hay disponible, se **recorta al stock** al instante y al salir del campo se fija en el máximo (la vuelta de seguridad en `guardar()` sigue ahí por si acaso).

> Analogía: la báscula de Sanji no deja que le pongas letras ni más gramos de los que hay en la despensa; si intentas pesar "abc" no pasa nada, y si pones 9999 kg de café cuando hay 20, te devuelve los 20 que hay. ⚖️👨‍🍳

---

## 🔐 Auditoría de validaciones en panel admin + empleado (29 ago, noche)

Jhon, Daniel pidió una revisión senior de TODOS los campos numéricos de ventas/inventario/lotes/envíos/transportadoras/promociones/empleados. Reglas aplicadas:

### 1. Utilidad nueva en `src/utils/validacion.js` 🧰
- **`bloquearEntero`** / **`normalizarEntero`** / **`manejarEntero`**: para campos que deben ser **enteros** (sin decimales). Bloquean letras y símbolos, y también el punto/coma; dejan SOLO dígitos.
- **`normalizarNumerico` quedó reforzado**: ahora **quita los ceros a la izquierda** (`000000` → `0`, `000123` → `123`) y no permite que queden valores mutilados tipo `1.....9`, `1.,.2` o `1,1` (un solo separador decimal, coma→punto). Antes "0000" pasaba tal cual.

### 2. Campos que AHORA son ENTEROS (antes aceptaban decimales) 🔢
| Pantalla | Campo |
|---|---|
| Control de inventario | Altitud (msnm) |
| Control de inventario | Repartos (unidades) |
| Control de inventario | Valor estimado del reparto ($) |
| Control de lotes / entregas | Valor a pagar ($) |
| Transportadoras | Teléfono (máx 10 dígitos, sin espacios) |
| Transportadoras | N° vehículos |
| Promociones | % descuento (si te pasas de 100 se corta; mínimo 1) |
| Producto (máquinas) | Garantía (meses) |
| Producto (máquinas) | Precio, Costo, Precio mayorista ($) |
| Producto (máquinas/stock unidades) | Stock si es máquina → entero |

### 3. Campos que SIGUEN DECIMALES ✔️
Kg perdido, kg a liberar, kg en lotes, kg entregados, peso de envíos, reabastecer stock, stock de café, precios por kg, cantidades de venta en kg, latitud/longitud. → estos usan el `normalizarNumerico` reforzado (sin ceros raros y sin más de un punto).

> Analogía: los **enteros son los doblones que Nami cuenta** (cantidades, $, vehículos, %). Los **decimales son los cafés de Sanji que se pesan** (kg, precios por kg). Ahora la caja registradora distingue: para contar doblones no deja ni punto ni coma (¿`1,5` vehículos? jamás), y para pesar café no deja que escriban `1....5` ni `1,1,1`. 🏴☠️💰

> **Pendiente a futuro (no tocado):** los campos de texto libre (motivos de rechazo, respuestas a reportes, descripciones de eventos, destinatario de envíos, nombre/apellido de empleados) no tienen filtro `normalizarTexto` — solo los de búsqueda se dejaron libres a propósito para que funcionen con `@` en emails. Si Daniel quiere validarlos también, se aplica el mismo patrón en una pasada de texto.

---

## 🛒 "Nueva venta": layout vertical del producto (29 ago, noche)

Jhon, Daniel pidió que al agregar un producto en **"Nueva venta"** la cantidad quedara **debajo del selector** y no al lado. Ahora cada producto es un bloque apilado (vertical):

1. **Selector del producto** (arriba).
2. **Debajo, la cantidad**, con la unidad **kg** (o "unid." si es máquina) a la derecha. Siguen las reglas de antes: solo dígitos, sin letras ni símbolos, mínimo 1, máximo el stock disponible.
3. **Debajo, el botón "+ Agregar producto"** para sumar la siguiente fila, y el "×" para quitar esa fila.

> Analogía: era un mapa en horizontal donde el tesoro quedaba al lado del islote; ahora cada islote (producto) tiene su caja de monedas (kg) debajo y su flecha para seguir al siguiente. Como decía Robin: "un buen pergamino se lee de arriba hacia abajo". 🗺️☕

---

## 🚨 Los errores ahora son "carta de Den Den Mushi" (ventana emergente) — 29 ago, noche

Jhon, Daniel pidió que los errores del panel admin/empleado **dejen de mostrarse como texto rojo arriba** y aparezcan en una **ventana emergente** que describa el problema. Así se hizo:

### 1. Nuevo componente `src/components/ui/ErrorModal.jsx` 🪟
- Ventana emergente con título **"Ocurrió un error"**, el mensaje y un botón **"Entendido"**.
- Se cierra con: clic en "Entendido", clic fuera de la ventana o tecla `Escape`. (Igual que `ConfirmDialog.jsx`.)
- Estilo en rojo (`#B3261E`) para que se distinga del éxito verde.

### 2. Se reemplazó en TODAS las pantallas de admin/empleado 📝
Se quitó el `{error && <div className="...red-600...">✕</div>}` (banner rojo con X) y se puso `<ErrorModal mensaje={error} onClose={() => setError(null)} />` en:

| Pantalla / Modal | Antes |
|---|---|
| Control de inventario (empleado) | banner rojo arriba |
| Cosechas planeadas | banner rojo arriba |
| Control de lotes / entregas | banner rojo arriba |
| Envíos (página + modal crear/editar) | banner rojo arriba + dentro del modal |
| Transportadoras (página + modal) | banner rojo arriba + dentro del modal |
| Promociones (admin) | banner rojo arriba |
| Moderación de reseñas | banner rojo arriba |
| ProductoModal (crear/editar) | texto rojo dentro del formulario |
| VentaModal (Nueva venta) | texto rojo dentro del formulario |
| FacturaModal (ver factura) | texto rojo en el modal |

> Analogía: antes los errores eran papelitos rojos pegados en la cubierta del barco que cualquiera ignoraba (o daba "X" y listo). Ahora es la **Den Den Mushi de Doflamingo**: suena, abre la ventana y te dice exactamente qué pasó; la cierras con "Entendido" cuando la leíste. Como diría Luffy: "¡si no lo leo, no se cierra!" 🐙📢

> **Nota:** los errores de cliente (Compra/Pago/Login) y las páginas huérfanas (Inventario, Users, Dashboard) no se tocaron: solo se ajustó lo que pidió Daniel para admin/empleado. Se puede extender igual si hacen falta.

---

## 🌱 ¡El café ya no se fabrica de la nada! Arreglo completo del flujo finca → lote → catálogo (29 ago, noche)

Jhon, este fue el arreglo grande del día: **"Procesar lote" inventaba café**. Confirmabas el proceso y en vez de gastar la capacidad real del lote, creaba una "entrega" que metía kg de más en el catálogo. ¡Café gratis! (Nami lloraba). Esto se corrigió de raíz:

### 1. La migración importante 📦
`granova-backend/sql/18_flujo_lotes_origen.sql` le agrega a `cosechas_planeadas` la columna **`origen`** (`'cosecha'` = llegó café de la finca; `'proceso-lote'` = se generó al **macerar/liberar un lote**). Las filas viejas quedan `'cosecha'` solas. **HAY QUE CORRER ESTE SCRIPT EN LA BASE DE DATOS.** ⚠️

### 2. Backend: `confirmarCosecha` ahora discrimina 🧠
En `cosechasController.js` (la función `confirmarCosecha`):
- Si la cosecha es **de proceso de lote** (`origen='proceso-lote'`):
  - **NO** se crea entrega falsa en `entregas_finca`. ❌
  - **NO** se suma kg al catálogo de la nada.
  - Se **DESCUENTA** la capacidad real del lote: `cantidad_kg = GREATEST(cantidad_kg - kgConsumido, 0)` y `kg_en_proceso = GREATEST(kg_en_proceso - kgConsumido, 0)`, donde `kgConsumido = Σ(cantidad × kg_equivalente)` de la presentación elegida. (El ___se cocina y se come en la misma olla___.)
  - Se guarda en `procesamientos_lote` **el kg consumido real** (sin la doble merma: el frontend ya manda kg netos).
- Si la cosecha es **de finca** (`origen='cosecha'`, las viejas también): se mantiene el flujo original para no romper nada.

### 3. Cancelación justa 🔄
`cancelarCosecha` ahora es transaccional: si cancela una cosecha de proceso-lote, **devuelve** los `kg_en_proceso` al lote (el café regresa a la bóveda de Sanji). Si era de finca, cancela la entrega también.

### 4. El lote se respeta: no se edita `cantidad_kg` a mano ✋
En `lotesController.js`, `actualizarLote` ya **NO acepta editar `cantidad_kg`** (responde 400 con mensaje claro). La capacidad del lote SOLO cambia con entregas de finca o con procesamientos. El estado sigue siendo `disponible`/`agotado`.

### 5. El procesar-lote huérfano quedó muerto de una vez 💀
`procesamientoLoteController.js`:
- `procesarLote` (esa ruta vieja que escribía `tipo_cafe='pergamino'` y no existía en el catálogo) ahora responde **410 Gone** con mensaje claro. Nadie lo llama desde el frontend.
- `liberarProceso` se **bloquea** (400) si el lote todavía tiene una cosecha planeada de proceso pendiente: así no se libera manual y luego se confirma (doble conteo de kg). A Luffy le gusta el orden.

### 6. Inventario: % y estado en las mismas unidades ⚖️
En `inventarioController.js` y `alertasController.js` el **% / estado** ahora se calculan en **kg equivalentes** (bolsas × `kg_equivalente`), no mezclando bolsas con kg del lote. Antes "el lote tiene 100 kg" se comparaba con "tengo 50 bolsas" → errores de % y de alertas.

### 7. Frontend `CosechasPlaneadas` y `ControlEmpleado` 🌾
- La bandeja distingue por `origen`: "**Agregar a catálogo**" (proceso) vs "**Ya llegó el café — confirmar**" (finca); badges "En proceso — listo para el catálogo" vs "Esperando que llegue".
- `ControlEmpleado` manda `kg_estimados` en kg **netos** y la celda de stock muestra **"N bolsas" + "(X.XX kg)"** (bolsas × kg_equivalente). Se acabó el "N kg" que eran bolsas.

> Analogía: antes era como si Sanji cocinara 10 kg de arroz y el barco dijera "ahora hay 10 kg más de provisiones" **sin que el arroz salga de la cocina**. Ahora: lo que sale del lote se resta del lote; lo que se confirma al catálogo es lo que realmente pasó por la prueba. Luffy come, Sanji cuenta, Nami cobra, todos en paz. 👒☕

### ⚠️ Para que funcione
1. **Correr `sql/18_flujo_lotes_origen.sql`** en la BD (las tablas `cosechas_planeadas.origen` deben existir).
2. **Reiniciar el backend** (`node server.js`) — Node no recarga solo, lo sabes de la batalla de ayer.
3. Ctrl+F5 en el frontend.

---

## ⚖️ Segunda pasada: las unidades "kg" que eran bolsas (29 ago, madrugada)

Jhon, Daniel pidió revisar "detalles que se nos pudieron haber pasado". Apareció UN tema: **el stock de café se guarda en BOLSAS, pero varias pantallas decían "kg"**. Se alineó TODO a bolsas/unidades:

| Pantalla | Antes | Ahora |
|---|---|---|
| Nueva venta (VentaModal) | cantidad en **kg** (paso 0.01) | cantidad en **bolsas** (entero), etiqueta "/bolsa" y "bolsas disp." |
| Inventario (ControlStock) | "N stock kg", cabecera "Stock (kg)", export "Stock (kg)" | "N bolsas/unid.", "Stock (unid.)", "Precio" |
| Factura (FacturaModal, PDF y pantalla) | "2 kg" | "2 bolsa(s)" (o "unid." para máquinas) |
| Alertas de stock | "N kg disponibles", "% del stock máximo" | "N bolsas dispon.", "% de la capacidad del lote" |
| Crear producto (ProductoModal) | "Stock inicial (kg)", "Precio/Costo por kg" | "Stock inicial (bolsas)", "Precio/Costo (por bolsa)", stock entero |
| Catálogo destacado y Cliente Inicio | "N kg" / "/kg" | "N bolsas" / "/bolsa" |

- **Por qué es correcto:** las ventas descuentan **unidades** (`stock - cantidad`), los formatos son bolsas (250g, 500g, 1kg, etc.) y el costo del catálogo se calcula `costoKg × kg_equivalente` (o sea POR BOLSA). Etiquetar eso como "kg" hacía que un empleado escribiera 0.5 "kg" y el sistema le restara media bolsa de un stock de 32. 🥴
- **Kg de verdad se quedan donde son kg:** capacidad del lote, kg perdidos, kg en proceso, kg equivalentes (bolsa × kg_equiv), entregas de finca. Esos sí siguen en kg.

> Analogía: Nami cuenta **doblones** (unidades: bolsas, máquinas). Sanji pesa **harina** (kg: lote, proceso, pérdidas). El problema era que en varios mapas le decían "kg" a los doblones. Ahora cada mapa dice la verdad, y el error de volver a escribir "me ponen 0.5 kg de café" descontando media bolsa desapareció. 🪙⚖️

> **Pendiente a decidir con Daniel (no se tocó):** en el catálogo, cuando un café NO tiene formatos (bolsas), el precio base se muestra como "por kg" (línea "por bolsa"/precio base). Es el caso raro (casi todos los cafés tienen sus formatos), pero el precio base de `productos` es por bolsa. Si queremos vender "por kg" de verdad ahí, hay que cambiar la lógica del precio base en `Catalogo.jsx` — mejor hablarlo antes de tocarlo. 🤝

> Y como diría Robin: "cuando el mapa miente, los navegantes se pierden. Ahora el mapa dice bolsas cuando son bolsas." 📜☕

---

## 🧹 Tercera pasada: limpieza de datos de inventario (fincas, lotes, catálogo)

Jhon, Daniel pidió "acomodar los productos, fincas y lotes de la BD para que todo quede funcionando" — o sea, que el **recorrido** finca → lote → cosechas planeadas → catálogo quedara con datos coherentes. La BD parecía un barco con varios motines: se ejecutó `sql/19_limpieza_inventario.sql` (idempotente, se puede re-correr sin romper nada).

### 🚨 Qué estaba mal
| Problema | Ejemplo |
|---|---|
| **`kg_en_proceso` fantasma** en lotes que no tenían nada en proceso | Lote 3 con **5400 kg en proceso** ¡y solo pesa 1850 kg! Imposible, era basura de corridas viejas |
| **Productos de prueba / duplicados** conviviendo con los reales | `Cafe Prueba` (precio raro), `Cafe AAA` (costo 500.000 😱), `LOTE-HOLA` y lote `LOTE` sin finca real |
| **Cafés de la vieja era** (sin `id_presentacion`, sin formatos) | Existían a la vez los viejos "Café Castillo - Finca La Grecia" y los nuevos "Castillo · 250 g · Finca La Grecia" (duplicados) |
| **Precios en 0** | Productos creados confirmando cosechas de lotes sin costo base |
| **Una entrega con `kg_netos` NULL** | La del lote 7 (Tabi) |

### ✅ Qué se hizo
1. **Lotes**: `kg_en_proceso` de los lotes 3, 7 y 9 → 0; estado recalculado con `disponible = cantidad − perdido − en_proceso`; se borraron el lote `LOTE-HOLA`, el lote `LOTE` y la finca `Finca` (sin ninguna referencia).
2. **Catálogo canónico**: 8 lotes × 3 presentaciones (250g/500g/1kg) con **precio, costo y formato** coherentes por variedad: Bourbon Rosado 52.000, Caturra 28.000, Geisha 85.000, Castillo 30.000, Tabi 48.000, Colombia 34.000. Nombres iguales a los que crea `confirmarCosecha` (ej. `Castillo · 250 g · Finca La Grecia`).
3. **Viejos y de prueba → `inactivo`** (no se borran: las reseñas y pedidos antiguos los referencian; el catálogo los oculta).
4. **Precios**: los canónicos 86/87/89/90/91 pasaron de 0 a su precio real y sus formatos se sincronizaron.
5. **Entrega del lote 7**: `kg_netos` = 155.8 (190 × 0.82, la merma de tostado que usa el sistema).

> Analogía: Zoro encontró un mapa del tesoro con los doblones de más contados dos veces y "5400" escrito con la punta del sable en un barril de 1850 litros. Reordenó el almacén: cada lote tiene sus 3 bolsas con precio real, lo falso se mandó al sótano (inactivo) sin quemarse (para no romper el diario de a bordo), y ahora cuando Luffy confirma una cosecha, **el lote resta kg de verdad y el catálogo suma bolsas de verdad**. 🗺️⚔️

> **Pendiente que sigue en pie (no se tocó):** el precio base "por kg" vs "por bolsa" en catálogo para cafés SIN formatos (decisión con Daniel).

### ⚠️ Bea: la limpieza dejó el catálogo sin fotos ni ofertas — se corrigió con `sql/20_imagenes_promos.sql`

¿Qué pasó? La pasada 1 inactivó los cafés viejos pero **los canónicos nuevos nacieron SIN `imagen_url`** y las ofertas seguían apuntando a los viejos. Resultado: catálogo con tarjetas verdes sin foto y descuentos "desaparecidos". 🫣

Se ejecutó `sql/20_imagenes_promos.sql` (idempotente):
1. **Imágenes**: cada canónico copió la foto del producto viejo **del mismo lote y la presentación más cercana en peso** (250g/500g/1kg), con fallback por lote. Quedan 24/24 cafés con imagen y 0 activos sin foto.
2. **Ofertas**: `promocion_productos` se re-apuntó a los canónicos activos del mismo lote (6→lote 3, 7→lote 5, 8→lote 4, 10→la 500g del lote 4). Las Bourbon/Geisha ya estaban vencidas por fecha, así que sólo se ven las vigentes (Caturra 10%, "todo a 30", "todo a 10" en la cafetera, "todo al 20").

> Analogía: hiciste inventario del almacén, mandaste los barriles viejos al sótano (inactivo) y les pusiste etiquetas nuevas (canónicos)... pero a las etiquetas se les olvidó pegarles la foto del producto y Nami el mapa de "qué oferta aplica dónde". Zorro fue y las pegó: cada barril nuevo tiene su foto de siempre y el letrero del descuento volvió a su lugar. 📸🏷️

> **Recuerda del flujo:** reiniciar `node server.js` y Ctrl+F5 en el navegador si el catálogo sigue raro (datos nuevos no son problema, pero el proceso viejo sí).