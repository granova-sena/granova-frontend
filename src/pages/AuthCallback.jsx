import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
    const navigate = useNavigate();
    const yaProcesado = useRef(false);

    useEffect(() => {
        if (yaProcesado.current) return;
        yaProcesado.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const clienteData = params.get('cliente');
        const error = params.get('error');

        // Caso éxito: se lo pasamos a la ventana que abrió el popup.
        // Se publica con '*' porque FRONTEND_URL configurado (env) y el host
        // real pueden diferir (www vs no-www, puerto en local); la ventana
        // receptora valida el origen con comparación tolerante.
        if (token && clienteData && window.opener) {
            window.opener.postMessage(
                { token, cliente: clienteData },
                '*'
            );
            window.close();
            return;
        }

        // Caso error (ej: correo de admin intentando entrar como cliente):
        // también se lo avisamos a la ventana principal, en vez de mostrar
        // el login dentro del popup.
        if (error && window.opener) {
            window.opener.postMessage(
                { error },
                '*'
            );
            window.close();
            return;
        }

        // Fallback sin opener: el popup y la ventana principal viven en el
        // mismo origen (www.granovaoficial.com), así que podemos comunicarnos
        // a través de localStorage + evento "storage" en lugar de opener.
        // Esto cubre el caso en que el navegador purga window.opener cuando el
        // popup atraviesa dominios de terceros (api + accounts.google.com).
        if (token && clienteData) {
            localStorage.setItem('google_login_result', JSON.stringify({
                token,
                cliente: clienteData,
                ok: true,
            }));
            window.close();
            return;
        }

        if (error) {
            localStorage.setItem('google_login_result', JSON.stringify({
                error,
                ok: false,
            }));
            window.close();
            return;
        }

        // Si no hay opener (se abrió esta URL directo, sin popup), navegamos normal.
        navigate('/login');
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a1a0a]">
            <p className="text-white/60 text-sm">Completando inicio de sesión...</p>
        </div>
    );
}

export default AuthCallback