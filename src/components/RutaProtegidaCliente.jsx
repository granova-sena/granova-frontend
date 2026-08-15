import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Protege las vistas de cliente (catálogo, pedidos, cuenta, etc).
// A diferencia de RutaProtegida (admin), aquí NO se exige rol === "admin":
// los tokens de cliente no traen "rol", solo id y email.
function RutaProtegidaCliente({ children }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />
    }

    try {
        const decodificado = jwtDecode(token);

        // Si el token es de un admin (trae rol), lo mandamos a su propio dashboard
        // en vez de dejarlo entrar a las vistas de cliente.
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
