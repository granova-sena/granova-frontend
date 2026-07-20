import { Routes, Route } from 'react-router-dom'
import Catalogo from './pages/Catalogo'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import CarritoPage from './pages/CarritoPage'
import CotizacionPage from './pages/CotizacionPage'
import ConfigurarPedidoPage from './pages/ConfigurarPedidoPage'
import MisPedidosPage from './pages/MisPedidosPage'
import EstadoPedidoPage from './pages/EstadoPedidoPage'

function App() {
  return (
    <Routes>
      <Route path="/"                   element={<Catalogo />} />
      <Route path="/dashboard"          element={<Dashboard />} />
      <Route path="/catalogo"           element={<Catalogo />} />
      <Route path="/carrito"            element={<CarritoPage />} />
      <Route path="/cotizacion"         element={<CotizacionPage />} />
      <Route path="/configurar-pedido"  element={<ConfigurarPedidoPage />} />
      <Route path="/mis-pedidos"     element={<MisPedidosPage />} />
      <Route path="/mis-pedidos/:id" element={<EstadoPedidoPage />} />
      <Route path="*"                   element={<NotFound />} />
    </Routes>
  )
}

export default App