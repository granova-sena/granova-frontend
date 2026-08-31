import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getActiveToken } from '../services/session'

function RutaProtegidaCliente({ children }) {

    const token = getActiveToken();

    if (!token) {
        return <Navigate to="/login" replace />
    }

    try {
        const decodificado = jwtDecode(token);

        if (decodificado.rol === "admin") {
            return <Navigate to="/dashboard" replace />
        }
    } catch (error) {
        console.error('Error en RutaProtegidaCliente:', error)
        return <Navigate to="/login" replace />
    }

    return children;
}

export default RutaProtegidaCliente;
