import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="bg-[#1e3a10] px-6 h-14 flex items-center relative z-40">
      
      <span
        onClick={() => navigate('/')}
        className="text-stone-100 font-serif text-lg mr-8 cursor-pointer"
      >
        Granova
      </span>

      <div className="hidden sm:flex gap-6">
        {[
          { label: 'Catálogo',   ruta: '/catalogo'    },
          { label: 'Mis pedidos', ruta: '/mis-pedidos' },
          { label: 'Promociones', ruta: null           },
          { label: 'Mi cuenta',   ruta: null           },
        ].map((item, i) => (
          <span
            key={item.label}
            onClick={() => item.ruta && navigate(item.ruta)}
            className={`text-sm pb-0.5 
              ${item.ruta ? 'cursor-pointer' : 'cursor-default'}
              ${i === 0 ? 'text-white border-white font-medium' : 'text-white/60 hover:text-white/90'}
            `}
          >
            {item.label}
          </span>
        ))}
      </div>

      <div className="ml-auto">
        <span className="text-white text-sm font-medium">Carlos Andrade</span>
      </div>

    </nav>
  )
}

export default Navbar