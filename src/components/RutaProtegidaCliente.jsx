import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getActiveToken, clearClienteToken } from '../services/session'

function tokenClienteValido(token) {
  if (!token) return false;
  try {
    const decodificado = jwtDecode(token);
    // Token de panel (trae `rol`) no es sesión de cliente.
    if (decodificado.rol) return false;
    if (decodificado.exp && Date.now() / 1000 >= decodificado.exp) {
      return false;
    }
    return Boolean(decodificado.id);
  } catch {
    return false;
  }
}

function RutaProtegidaCliente({ children }) {

    const token = getActiveToken();

    if (!tokenClienteValido(token)) {
        clearClienteToken();
        return <Navigate to="/login" replace />
    }

    return children;
}

export default RutaProtegidaCliente;