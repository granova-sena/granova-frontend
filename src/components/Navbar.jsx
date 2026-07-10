import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="bg-[#1C3A0A] px-8 py-4 flex items-center justify-between">
      
      <span
        onClick={() => navigate('/')}
        className="text-white font-bold text-xl tracking-wide cursor-pointer"
      >
        GRANOVA
      </span>

      <ul className="flex gap-8 list-none">
        {['Inicio', 'Catalogo', 'Promociones', 'Nosotros', 'Contacto'].map(l => (
          <li key={l}>
            <a href="#" className="text-white text-sm hover:text-[#D4C49A] transition-colors">
              {l}
            </a>
          </li>
        ))}
      </ul>

      <span className="text-white text-sm font-medium">Carlos Andrade</span>

    </nav>
  )
}

export default Navbar