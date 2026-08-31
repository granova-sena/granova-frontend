import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config";
import toast from "react-hot-toast";

const BENEFICIOS = [
  { icono: "💸", titulo: "10% de descuento", detalle: "En tus compras por ser cliente empresarial" },
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
            ← Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a1a0a" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-[#9DC9B4] text-sm mb-6 hover:underline">
          ← Volver al inicio
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

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="sm:w-32 h-12 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/[0.09] transition"
                    >
                      ← Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={guardando}
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
              💡 Las cuentas empresariales obtienen <span className="font-semibold">10% de descuento</span> en todas sus compras en lugar de puntos de lealtad.
            </div>
            <p className="text-center text-xs text-white/35 mt-4">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-[#9DC9B4] hover:text-white transition">
                Inicia sesión
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistroEmpresa;
