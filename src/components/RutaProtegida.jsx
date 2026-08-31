import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getActiveToken, clearEmpleadoToken } from '../services/session'

function tokenValido(token, rolesPermitidos) {
  if (!token) return false;
  try {
    const decodificado = jwtDecode(token);
    if (decodificado.exp && Date.now() / 1000 >= decodificado.exp) {
      return false;
    }
    return rolesPermitidos.includes(decodificado.rol);
  } catch {
    return false;
  }
}

function RutaProtegida({ children, rolesPermitidos = ["admin"] }) {
  const token = getActiveToken();

  if (!tokenValido(token, rolesPermitidos)) {
    clearEmpleadoToken();
    return <Navigate to="/control-interno" replace />;
  }

  return children;
}

export default RutaProtegida;
