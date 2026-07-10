import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CarritoPage from './pages/CarritoPage'
import CotizacionPage from './pages/CotizacionPage'
import ConfigurarPedidoPage from './pages/ConfigurarPedidoPage'

function App() {
  return (
    <div className="min-h-screen bg-[#F7F2E8]">
      <Navbar />
      <Routes>
        <Route path="/" element={<CarritoPage />} />
        <Route path="/cotizacion" element={<CotizacionPage />} />
        <Route path="/configurar-pedido" element={<ConfigurarPedidoPage />} />
      </Routes>
    </div>
  )
}

export default App