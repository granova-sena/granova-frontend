import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function RutaProtegida({ children }) {

    const token = localStorage.getItem("token");


    if (!token) {
        return <Navigate to="/" replace />
    }

    try {

        const decodificado = jwtDecode(token);

        if(decodificado.rol !== "admin") {
            return <Navigate to="/" replace />
        }


    }
    catch (error) {
        console.error('Error en RutaProtegida:', error)
        return <Navigate to="/login" replace />
    }

    return children;
}


export default RutaProtegida;