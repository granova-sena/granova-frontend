# ☕ Revisión senior del Frontend de Granova — Apunte para Jhon (Luffy) 🏴‍☠️

> Fecha: 23 ago 2026 · Autor: la desarrolladora senior
> Analogía general: este proyecto es como el **Sunny** (el barco de los Sombrero de Paja). Se ve bonito por fuera y navega, pero si no tapamos las goteras, se nos hunde con la tripulación adentro. Tú eres Luffy: entusiasta y con buena tripulación, pero hay que parchear el barco antes de ir al Nuevo Mundo. 🌊

---

## 1. Los "frutos del diablo" que dan poderes falsos (problemas de SEGURIDAD) 🔒

Estos son los más graves. Como dice Zoro (seguridad): *"Si vas a dejar la espada desenvainada, al menos sabes dónde está."*

### 1.1 El carrito manda los precios desde el navegador — manipulación de precio 💸
En `src/context/CarritoContext.jsx:60` al confirmar pedido se envía:
```js
precio_unitario: Math.round(p.precio * (1 - DESCUENTO)),
```
Nami (el dinero) gritaría: **el precio se calcula y se envía desde el cliente**. Cualquiera con DevTools puede abrir la consola, cambiar el precio a `$1` y comprar café como si fuera regalado. El servidor debe **recalcular el precio con la base de datos**, NO confiar en lo que llega del navegador.

**Lección Luffy:** el frontend es un mapa del tesoro, no la caja fuerte. La caja fuerte (precios, descuentos, totales) siempre debe estar en el backend.

### 1.2 `id_cliente` viene del cuerpo del request — robo de identidad 🎭
Igual en `CarritoContext.jsx:44`: se lee `id_cliente` del `localStorage` y se manda en el JSON. Si el backend no valida que ese cliente sea el dueño del token, un atacante puede hacer pedidos **a nombre de otro cliente** (o ver los pedidos de otros).

**Lección:** el backend debe sacar el `id_cliente` del **token** (Bearer), no del body. Esto aplica a `MisPedidos.jsx:144`, `EstadoPedidoPage.jsx:28`, `MiCuenta.jsx:81`, etc.

### 1.3 Facturas sin autenticación — fuga de datos (IDOR) 🧾
En `MisPedidos.jsx:10` se llama a:
```js
await fetch(`${API_URL}/api/facturas`, { ... })   // ¡sin Authorization!
fetch(`${API_URL}/api/facturas/${id_pedido}`)     // ¡tampoco!
```
No se manda el token. Si el backend no exige auth, **cualquiera puede descargar la factura de cualquier pedido** probando IDs. Es como si Robin (documentación) dejara los mapas del tesoro en la entrada del barco para que todos los lean.

### 1.4 Token en `localStorage` + sin interceptor de 401 ⏳
- El token vive en `localStorage` (expuesto a XSS). No es ideal, pero es lo común en proyectos pequeños.
- **Lo grave:** no hay ningún interceptor de respuesta en `src/services/api.js:8` que detecte `401` y cierre sesión / redirija a login. Si el token expira, la app muestra errores raros en vez de mandarte a iniciar sesión. Y `RutaProtegida.jsx:6` **no revisa la expiración** del JWT (solo lo decodifica), así que puedes entrar a la UI con un token vencido.
- 💡 **Mejora:** agregar un interceptor de respuesta que, ante `401`, borre el token y redirija a login.

### 1.5 El asistente IA es un endpoint público que cuesta dinero 🤖
En `AsistenteWidgetCliente.jsx:106` y `AsistenteWidget.jsx:103` se llama a `/asistente/chat-cliente` y `/asistente/chat` **sin token**, solo con un `idCliente`/`idAdmin` que el usuario puede inventar. Como detrás hay un LLM (cuesta plata por llamada), un bot podría spamear el endpoint y **generarte una factura gorda de n8n/OpenAI**. Es como si Doflamingo (cliente tramposo) encontrara un grifo de dinero abierto.

---

## 2. La tripulación está confundida (consistencia y lógica) 🧭

### 2.1 El prefijo `/api` es una lotería 🎰
Hay DOS maneras de llamar al backend mezcladas:
- Con `/api`: axios en `api.js:9` (baseURL `.../api`), y los `fetch` de `CarritoContext.jsx:64`, `MisPedidos.jsx:144`, `MiCuenta.jsx:81`.
- **Sin** `/api`: `EstadoPedidoPage.jsx:28` (`${API_URL}/pedidos/${id}`), `Users.jsx:48` (`${API_URL}/usuarios`), `Login.jsx:52` (`${API_URL}/auth/login`).

Si el backend monta rutas sin `/api` (como dice el comentario en CarritoContext) y otras con `/api`, algunas pantallas **van a dar 404** sin que nadie lo note hasta que un usuario real las toque. Además `EstadoPedidoPage.jsx:28` pide `/pedidos/${id}` mientras el carrito crea en `/api/pedidos` → muy probable que el detalle de pedido falle.

**Lección:** UNA sola convención. Lo ideal: dejar que el interceptor de `api.js` ponga el prefijo y **siempre usar el cliente axios** en vez de `fetch` suelto (que además ya inyecta el token solo).

### 2.2 La lógica "admin vs empleado" parece invertida 🪞
En varios lados los botones de crear/editar se muestran con `!esAdmin()`:
- `ControlStock.jsx:184` → "+ Nuevo producto" SOLO para no-admin.
- `RegistroDeVentas.jsx:227` → "+ Nueva venta" SOLO para no-admin.
- `GestionPedidos.jsx:61` → el admin ve "Solo lectura" y el empleado puede aceptar/rechazar.

Si es a propósito (el admin solo supervisa y los empleados operan) perfecto, pero **hay que confirmarlo** porque lo normal sería al revés. Un error aquí daría acceso a alguien que no debe.

### 2.3 `Envios.jsx` y `Transportadoras.jsx` son maquetas con datos falsos 🗑️
- `Envios.jsx:11`: todo hardcodeado y encima con **fincas de Costa Rica** ("Alajuela - Chachagua", "Cartago"...) — claramente copiado de otro proyecto. No llama a ninguna API.
- `Transportadoras.jsx:1`: datos estáticos de Coordinadora/Servientrega/Deprisa y el botón "+ Agregar aliada" **no hace nada**.

Son pantallas "de maqueta" que están enrutadas. Si esto va en producción, es como un mapa de una isla que no existe.

### 2.4 El carrito no se limpia ni se guarda 🛒
- **No se limpia**: `confirmarPedido` (CarritoContext.jsx:42) crea el pedido pero **nunca hace `setProductos([])`**. Después de comprar, si vuelves al carrito, siguen los productos.
- **No se persiste**: el carrito vive solo en memoria del Context. Si refrescas la página, se pierde todo. Nami lloraría.
- En `CarritoPage.jsx:49` la imagen de TODOS los productos es un placeholder `placehold.co` — no se muestra la foto real.

### 2.5 `ConfigurarPedidoPage` no manda los datos del cliente 📮
`confirmarPedido` (CarritoContext.jsx:50) solo envía `direccion_envio`, `ciudad_envio`, `metodo_pago` y productos. El formulario recoge nombre, correo, teléfono y observaciones... que **se quedan sin enviar**. El pedido queda sin datos de contacto del cliente.

---

## 3. Código muerto y "bodega llena de chatarra" 🗄️

Hay archivos que NO se usan en ninguna ruta (código muerto que confunde):
- `src/pages/main.jsx` — duplicado de `src/main.jsx` pero SIN `CarritoProvider`. Si alguien lo enruta por error, el carrito revienta.
- `Users.jsx` (859 líneas), `Empresas.jsx`, `Inventario.jsx`, `Pedidos.jsx`, `Dashboard.jsx`, `AnalisisClientes.jsx`, `MapaBase.jsx` — **ninguno está importado en `App.jsx`**.
- `src/utils/resueltasHoy.js` — usa `module.exports` (CommonJS) pero el proyecto es ESM (`"type": "module"`). Es un archivo de backend que quedó mal ubicado en el frontend. Si alguien lo importa, truena.

💡 **Mejora:** borrarlos o moverlos, para que la próxima persona no pierda tiempo leyendo código que no corre.

---

## 4. Calidad de código y React (detalles que hacen la diferencia) 🧹

1. **`useEffect` sin dependencias limpias**: en `useModalBehavior.js:5`, `onClose` está en el array de dependencias. Si pasan una función inline (`onClose={() => setX(false)}`), el efecto se re-ejecuta en CADA render (vuelve a bloquear el scroll y re-registra el listener). Usar `useCallback` o quitar `onClose` de las deps.
2. **`key={i}` por todos lados** (30+ casos). Está bien para listas estáticas, pero en listas que se reordenan/borran (mensajes del chat, pedidos, productos) causa bugs de estado. Mejor usar IDs reales.
3. **`console.log` de depuración sueltos**: `Landing.jsx:54` (`console.log('One Tap notification'...)`). Limpiar antes de producción.
4. **`alert()` / `confirm()` para errores** en `CotizacionPage.jsx:122`, `MisPedidos.jsx:88`, `RegistroDeVentas.jsx:156`. Ya usan `react-hot-toast` en el resto: unificar.
5. **`window.location.reload()`** en `MiCuenta.jsx:107` tras actualizar — recarga toda la app. Mejor actualizar el estado/localStorage y ya.
6. **`obtenerTipoCliente()` se ejecuta en cada render** dentro de `CarritoContext.jsx:114` (lee `localStorage` en cada render del provider). Cachearlo o leerlo una sola vez.
7. **`VITE_GOOGLE_CLIENT_ID` sin fallback**: `Landing.jsx:29`. Si la variable no está en el `.env`, One Tap truena en silencio. Y el fallback de `config.js:1` apunta a `localhost:3000`, lo que en producción rompería TODO si no configuran la variable de entorno.
8. **PWA a medias**: existen `manifest.webmanifest`, iconos y `sw.js`, pero en `index.html` **no hay `<link rel="manifest">`** ni se registra el service worker en `main.jsx`. El `sw.js` actual es solo un "kill switch" para borrar SW viejos. O se termina el PWA o se limpia.

---

## 5. Lo que está bien hecho (no todo es malo, capitán) ✅

- **Buenas prácticas de UX**: skeletons de carga, estados vacíos bien hechos, validación de formularios con mensajes claros (Register es un ejemplo sólido), botón de ver contraseña, bloqueo de `e`/`+`/`-` en inputs numéricos.
- **Patrón "cancelado" en fetch** para no actualizar estado tras desmontar (en `ClienteInicio.jsx:62`, `MapaFincas.jsx:148`, `MisPedidos.jsx:139`). 👏
- **Error Boundary en el catálogo** (`Catalogo.jsx:252`): evita pantalla en blanco. Excelente idea.
- **Búsqueda tolerante a typos** con Levenshtein en `ControlEmpleado.jsx:19`. Bonito detalle.
- **Filtrado de duplicados** de productos antes de renderizar en `Catalogo.jsx:94`.
- **Debounce en búsquedas** (300ms) en ControlStock/RegistroDeVentas.
- Comentarios en español explicando el "porqué" (no solo el "qué"). Se agradece, Robin estaría orgullosa. 📚

---

## 6. Plan de acción priorizado (nuestro "One Piece") 🎯

| Prioridad | Tarea | Dónde |
|---|---|---|
| 🔴 CRÍTICA | Validar precios/descuentos/total en el backend | `CarritoContext.jsx:60` |
| 🔴 CRÍTICA | Sacar `id_cliente` del token (no del body) | backend + `CarritoContext.jsx:44` |
| 🔴 CRÍTICA | Proteger facturas y pedidos con auth | `MisPedidos.jsx:10` |
| 🟠 ALTA | Unificar convención `/api` y usar siempre el axios | todos los `fetch` |
| 🟠 ALTA | Agregar interceptor de 401 + validar expiración del JWT | `api.js:8`, `RutaProtegida.jsx:6` |
| 🟠 ALTA | Limpiar carrito tras confirmar + persistir en localStorage | `CarritoContext.jsx:42` |
| 🟠 ALTA | Verificar lógica admin/empleado (¿está invertida?) | `ControlStock.jsx:184` |
| 🟡 MEDIA | Rehacer Envíos/Transportadoras con datos reales o quitarlas | `Envios.jsx:1` |
| 🟡 MEDIA | Enviar datos de contacto en el pedido | `CarritoContext.jsx:50` |
| 🟡 MEDIA | Borrar código muerto (Users, Empresas, Inventario, Pedidos, Dashboard, AnalisisClientes, MapaBase, main.jsx, resueltasHoy.js) | `src/pages/*`, `src/utils/*` |
| 🟢 BAJA | Limpiar console.log, alert(), key={i}, variable de Google, terminar/limpiar PWA | varios |

---

> **Cierre (como diría Luffy):** "No quiero conquistar el mundo... ¡quiero que este barco esté en buen estado para llegar a todas las islas!". Con estos parches, el Sunny de Granova aguanta el Grand Line. 🏴‍☠️☕
