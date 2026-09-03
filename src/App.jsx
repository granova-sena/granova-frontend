import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import AdminLogin from './pages/AdminLogin'
import RutaProtegida from './components/RutaProtegida'
import RutaProtegidaCliente from './components/RutaProtegidaCliente'
import NotFound from './pages/NotFound'
import DashboardLayout from './layouts/DashboardLayout'
import EmpleadoLayout from './layouts/EmpleadoLayout'
import ControlEmpleado from './pages/ControlEmpleado'
import ControlLotes from './pages/ControlLotes'
import CosechasPlaneadas from './pages/CosechasPlaneadas'
import DashboardHome from './pages/DashboardHome'
import Empleados from './pages/Empleados'
import { Toaster } from 'react-hot-toast'
import ResetPassword from './pages/Reset-Password'
import OlvidePassword from './pages/OlvidePassword'
import Landing from './pages/Landing'
import OlvidePasswordAdmin from './pages/OlvidePasswordAdmin'
import ResetPasswordAdmin from './pages/ResetPasswordAdmin'
import AlertasDeStock from './pages/AlertasDeStock'
import ControlStock from './pages/ControlStock'
import Envios from './pages/Envios'
import GestionPedidos from './pages/GestionPedidos'
import RegistroDeVentas from './pages/RegistroDeVentas'
import ReportesVentas from './pages/ReportesVentas'
import Transportadoras from './pages/Transportadoras'
import Catalogo from './pages/Catalogo'
import Favoritos from './pages/Favoritos'
import SimuladorCompra from './pages/SimuladorCompra'
import Foros from './pages/Foros'
import RegistroEmpresa from './pages/RegistroEmpresa'
import PromocionesAdmin from './pages/PromocionesAdmin'
import ResenasAdmin from './pages/ResenasAdmin'
import VerificarCuenta from './pages/VerificarCuenta'
import ClienteLayout from './layouts/ClienteLayout'
import ClienteInicio from './pages/ClienteInicio'
import MiCuenta from './pages/MiCuenta'
import MisPedidos from './pages/MisPedidos'
import Promociones from './pages/Promociones'
import CarritoPage from './pages/CarritoPage'
import CotizacionPage from './pages/CotizacionPage'
import ConfigurarPedidoPage from './pages/ConfigurarPedidoPage'
import EstadoPedidoPage from './pages/EstadoPedidoPage'
import TrazabilidadLotePage from './pages/TrazabilidadLotePage'
import ComparacionPage from './pages/ComparacionPage'
import Empresas from './pages/Empresas'
import MisCotizaciones from './pages/MisCotizacionesPage'

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
            iconTheme: {
              primary: '#B5451F',
              secondary: '#F0F0EA',
            },
          },
          success: {
            iconTheme: {
              primary: '#17140F',
              secondary: '#F0F0EA',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registro-empresa" element={<RegistroEmpresa />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/control-interno" element={<AdminLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/olvide-password-admin" element={<OlvidePasswordAdmin />} />
        <Route path="/reset-password-admin" element={<ResetPasswordAdmin />} />
        <Route path="/verificar-cuenta" element={<VerificarCuenta />} />

        <Route path="/cliente" element={
          <RutaProtegidaCliente>
            <ClienteLayout />
          </RutaProtegidaCliente>
        }>
          <Route index element={<ClienteInicio />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="favoritos" element={<Favoritos />} />
          <Route path="simulador" element={<SimuladorCompra />} />
          <Route path="foros" element={<Foros />} />
          <Route path="pedidos" element={<MisPedidos />} />
          <Route path='cotizaciones' element ={<MisCotizaciones/>}/>
          <Route path='cotizaciones/:id' element = {<CotizacionPage/>}/>
          <Route path="pedidos/:id" element={<EstadoPedidoPage />} />
          <Route path="promociones" element={<Promociones />} />
          <Route path="cuenta" element={<MiCuenta />} />
          <Route path="carrito" element={<CarritoPage />} />
          <Route path="cotizacion" element={<CotizacionPage />} />
          <Route path="configurar-pedido" element={<ConfigurarPedidoPage />} />
          <Route path="trazabilidad/:id" element={<TrazabilidadLotePage />} />
          <Route path="comparar" element={<ComparacionPage />} />
          <Route path="empresas" element={<Empresas />} />
        </Route>

        {/* Compatibilidad: cualquier link viejo a /catalogo cae en la vista nueva */}
        <Route path="/catalogo" element={<Navigate to="/cliente/catalogo" replace />} />

        <Route path="/panel-empleado" element={
          <RutaProtegida rolesPermitidos={["empleado"]}>
            <EmpleadoLayout />
          </RutaProtegida>
        }>
          <Route index element={<ControlEmpleado />} />
          <Route path="cosechas" element={<CosechasPlaneadas />} />
          <Route path="lotes" element={<ControlLotes />} />
          <Route path="pedidos" element={<GestionPedidos />} />
          <Route path="ventas" element={<RegistroDeVentas />} />
          <Route path="transportadoras" element={<Transportadoras />} />
          <Route path="envios" element={<Envios />} />
        </Route>

        <Route path="/dashboard" element={
          <RutaProtegida rolesPermitidos={["admin"]}>
            <DashboardLayout />
          </RutaProtegida>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="empleados" element={<Empleados />} />

          {/* Ventas */}
          <Route path="ventas" element={<RegistroDeVentas />} />
          <Route path="reportes" element={<ReportesVentas />} />

          {/* Pedidos y envíos */}
          <Route path="pedidos" element={<GestionPedidos />} />
          <Route path="envios" element={<Envios />} />
          <Route path="transportadoras" element={<Transportadoras />} />
          <Route path="promociones" element={<PromocionesAdmin />} />
          <Route path="resenas" element={<ResenasAdmin />} />

          {/* Inventario */}
          <Route path="inventario" element={<ControlStock />} />
          <Route path="inventario/alertas" element={<AlertasDeStock />} />
        </Route>

        {/* Catch-all: siempre al final por claridad, aunque en RR v6 el orden no cambia la prioridad del wildcard */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App