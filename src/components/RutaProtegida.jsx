import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Valida que el token exista, no esté vencido y tenga el rol permitido.
function tokenValido(token, rolesPermitidos) {
  if (!token) return false;
  try {
    const decodificado = jwtDecode(token);
    // exp viene en segundos (época Unix).
    if (decodificado.exp && Date.now() / 1000 >= decodificado.exp) {
      return false;
    }
    return rolesPermitidos.includes(decodificado.rol);
  } catch {
    return false;
  }
}

function RutaProtegida({ children, rolesPermitidos = ["admin"] }) {
  const token = localStorage.getItem("token");

  if (!tokenValido(token, rolesPermitidos)) {
    // Limpiamos la sesión si el token está vencido o corrupto.
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return <Navigate to="/control-interno" replace />;
  }

  return children;
}

export default RutaProtegida;
