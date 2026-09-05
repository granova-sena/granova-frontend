import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL, TURNSTILE_SITE_KEY } from "../config";
import { leerParametro } from "../services/parametros";
import toast from "react-hot-toast";

// ═══════════════════════════════════════════════════════════════
// CLOUDFLARE TURNSTILE — Configuración
// ═══════════════════════════════════════════════════════════════
// Para obtener tu Site Key:
// 1. Crea cuenta gratis en https://dash.cloudflare.com/sign-up
// 2. Ve a Turnstile → Manage Widgets → Create Widget
// 3. Copia la "Site Key" y pégala en tu .env como VITE_TURNSTILE_SITE_KEY
// 4. La "Secret Key" va en el backend (.env → TURNSTILE_SECRET_KEY)
// ═══════════════════════════════════════════════════════════════
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
// ═══════════════════════════════════════════════════════════════

const BENEFICIOS = [
  { icono: "💸", titulo: "Descuento automático", detalle: "En todas tus compras por ser cliente empresarial" },
  { icono: "🧾", titulo: "Facturación a tu empresa", detalle: "Razón social y NIT en tus facturas" },
  { icono: "📦", titulo: "Pedidos por volumen", detalle: "Precios especiales según kilogramos" },
];

// Fuerza de la contraseña 0-4: longitud, mayúscula, número, carácter especial
function fuerzaContraseña(pwd) {
  let fuerza = 0;
  if (!pwd) return 0;
  if (pwd.length >= 6) fuerza++;
  if (/[A-Z]/.test(pwd)) fuerza++;
  if (/[0-9]/.test(pwd)) fuerza++;
  if (/[^A-Za-z0-9]/.test(pwd)) fuerza++;
  return fuerza;
}

const ETIQUETAS_FUERZA = ["", "Muy débil", "Débil", "Buena", "Excelente"];
const COLORES_FUERZA = ["", "#D85A30", "#D8A230", "#9DC9B4", "#6FA98C"];

const transicionPaso = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] };

// ── REGISTRO EMPRESA (público, dinámico por pasos) ─────────
// Paso 1: datos de la empresa (razón social, NIT, dígito).
// Paso 2: contacto (nombre, correo, contraseña con medidor de fuerza).
// Crea una cuenta NUEVA como persona jurídica directo en la BD.
function RegistroEmpresa() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);

  const [razonSocial, setRazonSocial] = useState("");
  const [nit, setNit] = useState("");
  const [digito, setDigito] = useState("");

  const [nombreContacto, setNombreContacto] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [modalTerminosAbierto, setModalTerminosAbierto] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  // ── Cloudflare Turnstile: cargar y renderizar en el Paso 2 ──
  useEffect(() => {
    if (paso !== 2) return;
    if (turnstileWidgetId.current) return;

    function onTurnstileReady() {
      if (!turnstileRef.current || !window.turnstile) return;
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token),
        "error-callback": () => setTurnstileToken(""),
        theme: "dark",
        size: "normal",
      });
    }

    if (window.turnstile) {
      onTurnstileReady();
    } else {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.onload = onTurnstileReady;
      document.head.appendChild(script);
    }

    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch {}
        turnstileWidgetId.current = null;
        setTurnstileToken("");
      }
    };
  }, [paso]);

  const fuerza = fuerzaContraseña(contraseña);

  function validarPaso1() {
    if (razonSocial.trim().length < 3) {
      toast.error("Escribe la razón social de tu empresa", { id: "emp-err" });
      return false;
    }
    if (nit.trim().length < 5) {
      toast.error("El NIT debe tener al menos 5 dígitos", { id: "emp-err" });
      return false;
    }
    if (digito.trim().length === 0) {
      toast.error("El dígito de verificación es obligatorio", { id: "emp-err" });
      return false;
    }
    return true;
  }

  function validarPaso2() {
    if (nombreContacto.trim().length < 3) {
      toast.error("Escribe tu nombre completo (contacto de la empresa)", { id: "emp-err" });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Escribe un correo válido", { id: "emp-err" });
      return false;
    }
    if (fuerza < 4) {
      toast.error("La contraseña debe tener mínimo 6 caracteres, una mayúscula, un número y un carácter especial", { id: "emp-err" });
      return false;
    }
    if (contraseña !== confirmar) {
      toast.error("Las contraseñas no coinciden", { id: "emp-err" });
      return false;
    }
    return true;
  }

  async function registrar(e) {
    e.preventDefault();
    if (!validarPaso2()) return;

    if (!aceptaTerminos) {
      toast.error("Debes aceptar los Términos y Condiciones", { id: "emp-err" });
      return;
    }

    if (!turnstileToken) {
      toast.error("Completa la verificación anti-bot", { id: "emp-err" });
      return;
    }

    const [nombre, ...resto] = nombreContacto.trim().split(" ");
    const apellido = resto.join(" ");

    setGuardando(true);
    try {
      const respuesta = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          email: email.trim(),
          contraseña,
          tipo_persona: "juridica",
          tipo_documento: "NIT",
          numero_documento: nit.trim(),
          digito_verificacion: digito.trim(),
          razon_social: razonSocial.trim(),
          turnstileToken,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        toast.error(datos.error || "Error al registrar la empresa", { id: "emp-err" });
        setGuardando(false);
        return;
      }

      setRegistrado(true);
      toast.success("Cuenta empresarial creada 🎉");
    } catch {
      toast.error("No se pudo conectar con el servidor", { id: "emp-err" });
      setGuardando(false);
    }
  }

  // ── Éxito: revisa tu correo ──
  if (registrado) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-white" style={{ background: "#0a1a0a" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transicionPaso}
          className="max-w-md w-full rounded-2xl p-8 sm:p-10 text-center bg-white/[0.06] backdrop-blur-xl border border-white/15"
        >
          <p className="text-5xl mb-4">🏢</p>
          <h1 className="text-2xl font-semibold">¡Tu cuenta empresarial está creada!</h1>
          <p className="text-white/55 text-sm mt-3 leading-relaxed">
            Te enviamos un correo a <span className="text-[#9DC9B4] font-medium">{email}</span> para activar tu cuenta.
            Una vez confirmado el correo, tu 10% de descuento quedará activo en todas tus compras.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-8 w-full h-12 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition"
          >
            Ir a iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-3 w-full h-11 rounded-xl text-white/60 text-sm hover:text-white transition"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a1a0a" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <button type="button" onClick={() => navigate("/")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-[#9DC9B4] text-sm mb-6 hover:bg-white/[0.06] active:scale-[0.97] transition">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
          </svg>
          Volver al inicio
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-[#14291B] border border-[#6FA98C]/25 flex items-center justify-center text-xl">🏢</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Registro empresarial
            </h1>
            <p className="text-sm text-white/40 mt-0.5">Crea tu cuenta como empresa y obtén beneficios exclusivos</p>
          </div>
        </div>

        {/* Beneficios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="rounded-2xl bg-[#0F1D13] border border-white/[0.08] p-5 h-full">
              <p className="text-2xl">{b.icono}</p>
              <p className="text-white text-sm font-semibold mt-3">{b.titulo}</p>
              <p className="text-white/40 text-xs mt-1 leading-relaxed">{b.detalle}</p>
            </div>
          ))}
        </div>

        {/* Formulario por pasos */}
        <form onSubmit={registrar} className="mt-8 rounded-2xl bg-[#0F1D13] border border-white/[0.08] p-6 sm:p-8 max-w-2xl">
          {/* Indicador de pasos */}
          <div className="flex items-center gap-3 mb-7">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-3 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${paso === n ? "bg-[#6FA98C] text-white" : paso > n ? "bg-[#6FA98C]/30 text-[#9DC9B4]" : "bg-[#14291B] border border-white/10 text-white/40"}`}
                  >
                    {paso > n ? "✓" : n}
                  </span>
                  <span className={`text-xs font-medium ${paso === n ? "text-white" : "text-white/40"}`}>
                    {n === 1 ? "Tu empresa" : "Tu contacto"}
                  </span>
                </div>
                {n === 1 && <div className={`h-px flex-1 transition-colors ${paso > 1 ? "bg-[#6FA98C]/50" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {paso === 1 ? (
              <motion.div
                key="paso-1"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={transicionPaso}
              >
                <p className="text-white text-sm font-semibold mb-1">Datos de tu empresa</p>
                <p className="text-white/40 text-xs mb-6">Esta información quedará registrada en tu facturación y activa tu 10% de descuento.</p>

                <div className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="razon-social" className="text-xs text-white/50 mb-1.5 block font-medium">Razón social *</label>
                    <input
                      id="razon-social"
                      type="text"
                      value={razonSocial}
                      onChange={e => setRazonSocial(e.target.value)}
                      placeholder="Ej: Café de Origen Granova S.A.S."
                      className={`w-full h-11 px-4 rounded-xl bg-[#14291B] text-sm outline-none placeholder-white/25 transition border ${razonSocial.trim().length >= 3 ? "border-[#6FA98C]/50" : "border-white/10"} focus:border-[#6FA98C]`}
                    />
                    {razonSocial.length > 0 && razonSocial.trim().length < 3 && (
                      <p className="text-[11px] text-[#D85A30]/80 mt-1">Mínimo 3 caracteres</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-5">
                    <div>
                      <label htmlFor="nit" className="text-xs text-white/50 mb-1.5 block font-medium">NIT *</label>
                      <input
                        id="nit"
                        type="text"
                        inputMode="numeric"
                        value={nit}
                        onChange={e => setNit(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="900123456"
                        className={`w-full h-11 px-4 rounded-xl bg-[#14291B] text-sm outline-none placeholder-white/25 transition border ${nit.length >= 5 ? "border-[#6FA98C]/50" : "border-white/10"} focus:border-[#6FA98C]`}
                      />
                    </div>
                    <div>
                      <label htmlFor="digito" className="text-xs text-white/50 mb-1.5 block font-medium">Dígito *</label>
                      <input
                        id="digito"
                        type="text"
                        maxLength={1}
                        value={digito}
                        onChange={e => setDigito(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="5"
                        className={`w-full h-11 px-4 rounded-xl bg-[#14291B] text-sm outline-none placeholder-white/25 transition border ${digito.length > 0 ? "border-[#6FA98C]/50" : "border-white/10"} focus:border-[#6FA98C]`}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { if (validarPaso1()) setPaso(2); }}
                    className="h-12 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] active:scale-[0.98] transition"
                  >
                    Continuar →
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="paso-2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={transicionPaso}
              >
                <p className="text-white text-sm font-semibold mb-1">Contacto de la empresa</p>
                <p className="text-white/40 text-xs mb-6">La persona encargada de administrar esta cuenta.</p>

                <div className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="contacto" className="text-xs text-white/50 mb-1.5 block font-medium">Nombre completo *</label>
                    <input
                      id="contacto"
                      type="text"
                      value={nombreContacto}
                      onChange={e => setNombreContacto(e.target.value)}
                      placeholder="Ej: Ana María Pérez"
                      className="w-full h-11 px-4 rounded-xl bg-[#14291B] border border-white/10 text-sm outline-none placeholder-white/25 focus:border-[#6FA98C]/50 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="email-empresa" className="text-xs text-white/50 mb-1.5 block font-medium">Correo electrónico *</label>
                    <input
                      id="email-empresa"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="compras@tuempresa.com"
                      className="w-full h-11 px-4 rounded-xl bg-[#14291B] border border-white/10 text-sm outline-none placeholder-white/25 focus:border-[#6FA98C]/50 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="pwd-empresa" className="text-xs text-white/50 mb-1.5 block font-medium">Contraseña *</label>
                      <input
                        id="pwd-empresa"
                        type="password"
                        value={contraseña}
                        onChange={e => setContraseña(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 px-4 rounded-xl bg-[#14291B] border border-white/10 text-sm outline-none placeholder-white/25 focus:border-[#6FA98C]/50 transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="pwd2-empresa" className="text-xs text-white/50 mb-1.5 block font-medium">Confirmar contraseña *</label>
                      <input
                        id="pwd2-empresa"
                        type="password"
                        value={confirmar}
                        onChange={e => setConfirmar(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-11 px-4 rounded-xl bg-[#14291B] text-sm outline-none placeholder-white/25 transition border ${confirmar && confirmar === contraseña ? "border-[#6FA98C]/50" : confirmar ? "border-[#D85A30]/50" : "border-white/10"} focus:border-[#6FA98C]`}
                      />
                    </div>
                  </div>

                  {/* Medidor de fuerza */}
                  {contraseña && (
                    <div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                            style={{ background: fuerza >= n ? COLORES_FUERZA[fuerza] : "rgba(255,255,255,0.08)" }}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: COLORES_FUERZA[fuerza] }}>
                        {ETIQUETAS_FUERZA[fuerza]}{fuerza < 4 ? " — mínimo 6 caracteres, una mayúscula, un número y un carácter especial" : " ✓"}
                      </p>
                    </div>
                  )}

                  {/* Cloudflare Turnstile — verificación anti-bot */}
                  <div>
                    <p className="text-xs text-white/40 mb-2">Verificación de seguridad</p>
                    <div ref={turnstileRef} className="flex justify-center" />
                    {!turnstileToken && (
                      <p className="text-[11px] text-white/30 mt-1.5 text-center">Esperando verificación...</p>
                    )}
                  </div>

                  {/* Términos y Condiciones */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={aceptaTerminos}
                      onChange={(e) => setAceptaTerminos(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#6FA98C] cursor-pointer"
                    />
                    <span className="text-xs text-white/60 leading-relaxed group-hover:text-white/80 transition">
                      Acepto los{" "}
                      <button
                        type="button"
                        onClick={() => setModalTerminosAbierto(true)}
                        className="text-[#9DC9B4] underline underline-offset-2 hover:text-white transition"
                      >
                        Términos y Condiciones
                      </button>{" "}
                      y la Política de Privacidad
                    </span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="sm:w-32 h-12 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/[0.09] inline-flex items-center justify-center gap-2 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
                      </svg>
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={guardando || !aceptaTerminos || !turnstileToken}
                      className="flex-1 h-12 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {guardando ? "Creando cuenta..." : "Crear cuenta empresarial"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-7 pt-5 border-t border-white/[0.07]">
            <div className="rounded-xl bg-[#6FA98C]/[0.08] border border-[#6FA98C]/20 px-4 py-3 text-xs text-[#9DC9B4]">
              💡 Las cuentas empresariales obtienen <span className="font-semibold">{leerParametro('descuento_empresa_pct', 15)}% de descuento</span> en todas sus compras en lugar de puntos de lealtad.
            </div>
            <p className="text-center text-xs text-white/35 mt-4">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-[#9DC9B4] hover:text-white transition">
                Inicia sesión
              </button>
            </p>
          </div>
        </form>

        {/* Modal de Términos y Condiciones */}
        {modalTerminosAbierto && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setModalTerminosAbierto(false)}
          >
            <div
              className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "#0F1D13", border: "1px solid rgba(255,255,255,0.12)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Términos y Condiciones</h3>
                <button
                  type="button"
                  onClick={() => setModalTerminosAbierto(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 text-xs text-white/60 leading-relaxed space-y-4">
                <p><strong className="text-white/80">1. Aceptación de los Términos</strong><br />
                Al crear una cuenta empresarial en Granova, usted acepta estos Términos y Condiciones de uso. Si no está de acuerdo, por favor no utilice nuestro servicio.</p>

                <p><strong className="text-white/80">2. Registro Empresarial</strong><br />
                Para acceder a nuestros servicios empresariales, usted debe proporcionar información veraz y actualizada de su empresa (razón social, NIT y dígito de verificación). Usted es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>

                <p><strong className="text-white/80">3. Descuento Empresarial</strong><br />
                Las cuentas empresariales obtienen un descuento automático sobre sus compras según el porcentaje vigente. Este beneficio puede ser modificado por Granova con aviso previo.</p>

                <p><strong className="text-white/80">4. Productos y Precios</strong><br />
                Todos los precios mostrados incluyen los impuestos aplicables salvo indicación contraria. Los precios pueden cambiar sin previo aviso. Nos reservamos el derecho de modificar el catálogo de productos en cualquier momento.</p>

                <p><strong className="text-white/80">5. Pedidos y Pagos</strong><br />
                Al realizar un pedido, usted está realizando una oferta de compra. Nos reservamos el derecho de aceptar o rechazar cualquier pedido. Los pagos se procesan de forma segura a través de nuestras pasarelas de pago habilitadas.</p>

                <p><strong className="text-white/80">6. Facturación</strong><br />
                Los datos de facturación (razón social, NIT y dígito de verificación) se utilizan para generar sus facturas según la normatividad colombiana vigente (DIAN).</p>

                <p><strong className="text-white/80">7. Protección de Datos</strong><br />
                Sus datos serán tratados de conformidad con nuestra Política de Privacidad y la normatividad vigente en materia de protección de datos personales (Ley 1581 de 2012 en Colombia).</p>

                <p><strong className="text-white/80">8. Uso del Servicio</strong><br />
                Usted se compromete a utilizar el servicio de manera lícita y respetuosa. Está prohibido el uso fraudulento, la suplantación de identidad o cualquier actividad que pueda dañar la integridad del servicio.</p>

                <p><strong className="text-white/80">9. Limitación de Responsabilidad</strong><br />
                Granova no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de nuestro servicio. Nuestra responsabilidad máxima será limitada al valor del último pedido realizado.</p>

                <p className="text-white/40 italic">Última actualización: Septiembre 2026</p>
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalTerminosAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 transition"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => { setAceptaTerminos(true); setModalTerminosAbierto(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#6FA98C] text-white text-sm font-medium hover:bg-[#4F8A70] transition"
                >
                  Acepto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegistroEmpresa;
