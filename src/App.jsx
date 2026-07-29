import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Auth
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import AdminLogin from './pages/AdminLogin'
import OlvidePassword from './pages/OlvidePassword'
import OlvidePasswordAdmin from './pages/OlvidePasswordAdmin'
import ResetPassword from './pages/Reset-Password'
import ResetPasswordAdmin from './pages/ResetPasswordAdmin'
import VerificarCuenta from './pages/VerificarCuenta'

// Landing
import Landing from './pages/Landing'

// Rutas protegidas
import RutaProtegida from './components/RutaProtegida'
import RutaProtegidaCliente from './components/RutaProtegidaCliente'

// Layouts
import ClienteLayout from './layouts/ClienteLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Páginas cliente
import ClienteInicio from './pages/ClienteInicio'
import Catalogo from './pages/Catalogo'
import MiCuenta from './pages/MiCuenta'
import Promociones from './pages/Promociones'

// Módulo carrito (tuyo)
import CarritoPage from './pages/CarritoPage'
import CotizacionPage from './pages/CotizacionPage'
import ConfigurarPedidoPage from './pages/ConfigurarPedidoPage'
import MisPedidosPage from './pages/MisPedidosPage'
import EstadoPedidoPage from './pages/EstadoPedidoPage'

// Dashboard admin
import DashboardHome from './pages/DashboardHome'
import Users from './pages/Users'
import RegistroDeVentas from './pages/RegistroDeVentas'
import ReportesVentas from './pages/ReportesVentas'
import AnalisisClientes from './pages/AnalisisClientes'
import GestionPedidos from './pages/GestionPedidos'
import Envios from './pages/Envios'
import Transportadoras from './pages/Transportadoras'
import ControlStock from './pages/ControlStock'
import AlertasDeStock from './pages/AlertasDeStock'

// NotFound
import NotFound from './pages/NotFound'

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#F0F0EA',
            color: '#17140F',
            border: '1px solid rgba(23,20,15,0.12)',
          },
          error: {
            iconTheme: { primary: '#B5451F', secondary: '#F0F0EA' },
          },
          success: {
            iconTheme: { primary: '#17140F', secondary: '#F0F0EA' },
          },
        }}
      />
      <Routes>
        {/* Públicas */}
        <Route path="/"                      element={<Landing />} />
        <Route path="/login"                 element={<Login />} />
        <Route path="/register"              element={<Register />} />
        <Route path="/auth/callback"         element={<AuthCallback />} />
        <Route path="/control-interno"       element={<AdminLogin />} />
        <Route path="/reset-password"        element={<ResetPassword />} />
        <Route path="/olvide-password"       element={<OlvidePassword />} />
        <Route path="/olvide-password-admin" element={<OlvidePasswordAdmin />} />
        <Route path="/reset-password-admin"  element={<ResetPasswordAdmin />} />
        <Route path="/verificar-cuenta"      element={<VerificarCuenta />} />

        {/* Área cliente — protegida */}
        <Route path="/cliente" element={
          <RutaProtegidaCliente>
            <ClienteLayout />
          </RutaProtegidaCliente>
        }>
          <Route index                element={<ClienteInicio />} />
          <Route path="catalogo"      element={<Catalogo />} />
          <Route path="cuenta"        element={<MiCuenta />} />
          <Route path="promociones"   element={<Promociones />} />

          {/* Módulo carrito */}
          <Route path="carrito"           element={<CarritoPage />} />
          <Route path="cotizacion"        element={<CotizacionPage />} />
          <Route path="configurar-pedido" element={<ConfigurarPedidoPage />} />
          <Route path="pedidos"           element={<MisPedidosPage />} />
          <Route path="pedidos/:id"       element={<EstadoPedidoPage />} />
        </Route>

        {/* Compatibilidad rutas viejas */}
        <Route path="/catalogo" element={<Navigate to="/cliente/catalogo" replace />} />

        {/* Dashboard admin — protegido */}
        <Route path="/dashboard" element={
          <RutaProtegida>
            <DashboardLayout />
          </RutaProtegida>
        }>
          <Route index                      element={<DashboardHome />} />
          <Route path="usuarios"            element={<Users />} />
          <Route path="ventas"              element={<RegistroDeVentas />} />
          <Route path="reportes"            element={<ReportesVentas />} />
          <Route path="clientes"            element={<AnalisisClientes />} />
          <Route path="pedidos"             element={<GestionPedidos />} />
          <Route path="envios"              element={<Envios />} />
          <Route path="transportadoras"     element={<Transportadoras />} />
          <Route path="inventario"          element={<ControlStock />} />
          <Route path="inventario/alertas"  element={<AlertasDeStock />} />
          
        </Route>
        <Route path="/test-pdf" element={<CotizacionPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App