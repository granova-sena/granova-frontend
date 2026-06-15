import logo from '../assets/logo.png'
import coffeeBg from '../assets/coffee-bg.jpg'

function Login() {
  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-10 relative overflow-hidden"
        style={{backgroundImage: `url(${coffeeBg})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
      >
        {/* Overlay menos oscuro */}
        <div className="absolute inset-0 bg-[#1a2e1a]/55"></div>

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <img src={logo} alt="Granova logo" className="w-14 h-14 object-contain object-top" />
          <span className="text-[#E1F5EE] text-2xl font-medium tracking-tight">Granova</span>
        </div>

        {/* Texto central */}
        <div className="z-10">
          <h1 className="text-[#E1F5EE] text-4xl font-medium leading-tight tracking-tight mb-4">
            El mejor café<br />colombiano,<br />
            <span className="text-[#5DCAA5]">en un solo lugar.</span>
          </h1>
          <p className="text-[#E1F5EE]/80 text-sm leading-relaxed max-w-xs">
            Gestiona tu negocio cafetero con herramientas diseñadas para productores y compradores.
          </p>
        </div>

        {/* Estadísticas */}
        <div className="flex gap-10 z-10">
          <div>
            <p className="text-[#E1F5EE] text-2xl font-medium">+500</p>
            <p className="text-[#E1F5EE]/70 text-xs mt-1">Productos</p>
          </div>
          <div>
            <p className="text-[#E1F5EE] text-2xl font-medium">+1.2K</p>
            <p className="text-[#E1F5EE]/70 text-xs mt-1">Clientes</p>
          </div>
          <div>
            <p className="text-[#E1F5EE] text-2xl font-medium">100%</p>
            <p className="text-[#E1F5EE]/70 text-xs mt-1">Colombiano</p>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 bg-[#f8f9f8]">
        <div className="max-w-sm w-full mx-auto">

          <h2 className="text-2xl font-medium text-gray-900 mb-1">Bienvenido de nuevo</h2>
          <p className="text-sm text-gray-500 mb-8">Inicia sesión en tu cuenta de Granova</p>

          {/* Botón Google */}
          <button className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white hover:bg-gray-50 transition mb-6">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">o continúa con tu correo</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Campos */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1D9E75] focus:bg-white transition"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1.5">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1D9E75] focus:bg-white transition"
            />
          </div>

          <p className="text-right text-xs text-[#1D9E75] mb-6 cursor-pointer">¿Olvidaste tu contraseña?</p>

          {/* Botón login */}
          <button className="w-full py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-medium hover:bg-[#0F6E56] transition mb-6">
            Iniciar sesión
          </button>

          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <span className="text-[#1D9E75] cursor-pointer hover:underline">Regístrate aquí</span>
          </p>

        </div>
      </div>

    </div>
  )
}

export default Login

export default Login