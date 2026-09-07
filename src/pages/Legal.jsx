import { Link } from 'react-router-dom'

function seccion({ titulo, contenido }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-[#1C3A0A] mb-3">{titulo}</h2>
      {contenido.map((parrafo, i) => (
        <p key={i} className="text-sm text-gray-700 leading-relaxed mb-3">{parrafo}</p>
      ))}
    </div>
  )
}

function ContenidoTerminos() {
  const bloques = [
    seccion({
      titulo: '1. Información general',
      contenido: [
        'Estos Términos y Condiciones regulan el acceso y uso del sitio web y de la tienda en línea de GRANOVA, comercializadora de café y productos agroalimentarios de origen colombiano con domicilio en Colombia. Al navegar, crear una cuenta o realizar un pedido, el usuario acepta de forma expresa e inequívoca los presentes términos.',
        'En caso de no estar de acuerdo con alguno de ellos, el usuario deberá abstenerse de utilizar el servicio.',
      ],
    }),
    seccion({
      titulo: '2. Registro de cuenta',
      contenido: [
        'Para comprar en la tienda es necesario crear una cuenta proporcionando información veraz, completa y actualizada. El usuario es responsable de custodiar sus credenciales de acceso y de toda actividad realizada con ellas.',
        'GRANOVA podrá suspender o cancelar cuentas que contengan datos falsos o que incurran en un uso indebido de la plataforma.',
      ],
    }),
    seccion({
      titulo: '3. Productos, precios e impuestos',
      contenido: [
        'Los precios publicados están expresados en pesos colombianos (COP) e incluyen el IVA y demás impuestos aplicables, salvo indicación contraria. GRANOVA se reserva el derecho de modificar precios y el catálogo de productos en cualquier momento, sin que ello afecte pedidos ya confirmados.',
        'Las imágenes de los productos son ilustrativas y pueden no corresponder exactamente al producto final.',
      ],
    }),
    seccion({
      titulo: '4. Pedidos y pagos',
      contenido: [
        'Al confirmar un pedido, el cliente formula una oferta de compra que GRANOVA podrá aceptar o rechazar. La aceptación se produce al confirmar el pedido y, en su caso, al verificarse el pago.',
        'Los pagos se procesan a través de la pasarela Wompi (PSE, tarjeta débito/crédito, Nequi y Daviplata) o por medios manuales (transferencia, efectivo y contra entrega) según lo pactado. GRANOVA no almacena ni tiene acceso a las credenciales financieras del cliente.',
        'El incumplimiento del pago o la no verificación de una transferencia puede dar lugar a la cancelación del pedido.',
      ],
    }),
    seccion({
      titulo: '5. Envíos y entregas',
      contenido: [
        'Los tiempos de entrega son estimados y pueden variar según la disponibilidad del producto, la ubicación y la capacidad de entrega (domicilio o reparto por sectores). GRANOVA no se hace responsable por retrasos atribuibles a terceros transportadores ni por circunstancias de fuerza mayor.',
        'El cliente debe verificar la dirección y datos de contacto registrados; los cambios de último momento pueden modificar las condiciones de entrega.',
      ],
    }),
    seccion({
      titulo: '6. Devoluciones y retracto',
      contenido: [
        'Conforme a la Ley 1480 de 2011 (Estatuto del Consumidor), el cliente podrá solicitar el retracto de la compra dentro de los cinco (5) días hábiles siguientes a la entrega, cuando el producto se encuentre en condiciones originales y sin signos de manipulación, siempre que no sea un producto perecedero conforme a lo previsto en la ley.',
        'Para gestionar una devolución, el cliente debe contactarse por los canales habilitados dentro de este plazo. En los productos perecederos (café tostado y molido, entre otros) aplican las excepciones legales al derecho de retracto.',
      ],
    }),
    seccion({
      titulo: '7. Programa de lealtad',
      contenido: [
        'Los puntos de lealtad se acreditan según las condiciones vigentes del programa. Los puntos no son canjeables por dinero en efectivo, tienen vigencia definida y no son transferibles.',
        'GRANOVA puede modificar o suspender el programa con aviso previo por los canales habituales.',
      ],
    }),
    seccion({
      titulo: '8. Protección de datos personales',
      contenido: [
        'Los datos personales suministrados serán tratados de conformidad con la Política de Privacidad de GRANOVA y la normatividad vigente, en especial la Ley 1581 de 2012 y sus decretos reglamentarios.',
        'Consulta nuestra Política de Privacidad completa para conocer el detalle del tratamiento de tus datos.',
      ],
    }),
    seccion({
      titulo: '9. Propiedad intelectual',
      contenido: [
        'Los contenidos del sitio (marcas, logos, textos, imágenes y código) son titularidad de GRANOVA o de sus licenciantes y están protegidos por la legislación colombiana sobre propiedad intelectual. Queda prohibida su reproducción o uso sin autorización previa y escrita.',
      ],
    }),
    seccion({
      titulo: '10. Uso del servicio',
      contenido: [
        'El usuario se compromete a usar la plataforma de forma lícita y respetuosa. Está prohibido el uso fraudulento, la suplantación de identidad, la alteración del funcionamiento del sitio y cualquier actividad que afecte la integridad del servicio o de otros usuarios.',
      ],
    }),
    seccion({
      titulo: '11. Limitación de responsabilidad',
      contenido: [
        'GRANOVA no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del servicio. La responsabilidad total de GRANOVA frente a un cliente se limitará, en todo caso, al valor pagado por el pedido objeto de la reclamación.',
      ],
    }),
    seccion({
      titulo: '12. Modificaciones y vigencia',
      contenido: [
        'GRANOVA podrá actualizar estos términos en cualquier momento, publicando la versión vigente en este sitio con su fecha de última actualización. El uso continuado del servicio implica la aceptación de los términos publicados.',
      ],
    }),
    seccion({
      titulo: '13. Ley aplicable y contacto',
      contenido: [
        'Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia será sometida a la jurisdicción ordinaria de Colombia y, de forma preventiva, queda a disposición de los consumidores la Superintendencia de Industria y Comercio (SIC).',
        'Para consultas o reclamos, escríbenos por los canales de contacto publicados en nuestra web.',
      ],
    }),
  ]
  return <>{bloques}</>
}

function ContenidoPrivacidad() {
  const bloques = [
    seccion({
      titulo: '1. Responsable del tratamiento',
      contenido: [
        'GRANOVA actúa como responsable del tratamiento de los datos personales que recolecta a través de su sitio web y tienda en línea. El tratamiento se realiza de conformidad con la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas complementarias.',
      ],
    }),
    seccion({
      titulo: '2. Datos que recolectamos',
      contenido: [
        'Recolectamos los siguientes datos personales, siempre de forma voluntaria y con su autorización: nombre, apellido, correo electrónico, número de teléfono, dirección y sector de entrega, datos de facturación y, en el caso de clientes empresariales, información de la persona natural que actúa como contacto.',
        'También recolectamos de forma automática información de navegación (dirección IP, dispositivo y páginas visitadas) a través de cookies y tecnologías similares.',
      ],
    }),
    seccion({
      titulo: '3. Finalidades del tratamiento',
      contenido: [
        'Los datos son tratados con las siguientes finalidades: (i) gestionar cuentas, pedidos, pagos, envíos y entregas; (ii) facturación y cumplimiento de obligaciones tributarias; (iii) atender consultas, PQRS y ejercer derechos de garantía; (iv) enviar notificaciones de pedido y comunicaciones relacionadas; (v) administrar el programa de lealtad y las promociones; (vi) mejorar productos y servicios mediante análisis estadísticos; y (vii) enviar comunicaciones comerciales, cuando el titular lo haya autorizado.',
      ],
    }),
    seccion({
      titulo: '4. Legitimación y tratamiento de datos sensibles',
      contenido: [
        'La base del tratamiento es la autorización del titular, la relación contractual derivada de la compra y el cumplimiento de obligaciones legales. GRANOVA no requiere datos sensibles para operar la tienda y desaconseja el suministro de datos biométricos, de salud o relacionados.',
      ],
    }),
    seccion({
      titulo: '5. Derechos de los titulares',
      contenido: [
        'De conformidad con la Ley 1581 de 2012, usted tiene derecho a: conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización otorgada; ser informado sobre el uso dado a sus datos; presentar quejas ante la SIC; revocar la autorización o solicitar la supresión de sus datos cuando proceda; y acceder en forma gratuita a sus datos.',
        'Estos derechos se ejercen mediante petición dirigida a los canales de contacto de GRANOVA, quien responderá en los términos y plazos legales.',
      ],
    }),
    seccion({
      titulo: '6. Compartición con terceros',
      contenido: [
        'Los datos podrán ser compartidos con proveedores que prestan servicios a GRANOVA (pasarelas de pago, transporte, plataformas de correo y análisis), únicamente para las finalidades autorizadas y con obligación de confidencialidad. GRANOVA no vende ni cede datos personales a terceros para fines comerciales ajenos.',
      ],
    }),
    seccion({
      titulo: '7. Seguridad de la información',
      contenido: [
        'GRANOVA adopta medidas técnicas, administrativas y físicas razonables para proteger los datos contra pérdida, uso indebido y acceso no autorizado. No obstante, ningún sistema es completamente infalible.',
      ],
    }),
    seccion({
      titulo: '8. Conservación',
      contenido: [
        'Los datos se conservan mientras se mantenga la relación contractual y, después de ella, por el tiempo requerido para cumplir obligaciones legales, fiscales y contables o para atender reclamaciones.',
      ],
    }),
    seccion({
      titulo: '9. Transferencias y contacto',
      contenido: [
        'Para el ejercicio de derechos, consultas o reclamos, contáctanos por los canales publicados en el sitio web. La Superintendencia de Industria y Comercio (SIC) es la autoridad competente para conocer los reclamos que no sean atendidos.',
        'Última actualización: Septiembre 2026.',
      ],
    }),
  ]
  return <>{bloques}</>
}

function ContenidoCookies() {
  const bloques = [
    seccion({
      titulo: '1. ¿Qué son las cookies?',
      contenido: [
        'Las cookies son pequeños archivos de texto que el sitio web guarda en su dispositivo para recordar preferencias, mantener la sesión y mejorar la experiencia de navegación.',
      ],
    }),
    seccion({
      titulo: '2. Tipos de cookies que utilizamos',
      contenido: [
        'Cookies técnicas o esenciales: necesarias para el funcionamiento del sitio (autenticación, carrito de compras y persistencia de sesión). No pueden desactivarse sin afectar el servicio.',
        'Cookies de preferencias: recuerdan opciones como sector de entrega, moneda o presentación del sitio.',
        'Cookies de análisis y rendimiento: nos permiten conocer cómo se usa la tienda para mejorarla (por ejemplo, páginas visitadas y tiempo de navegación).',
        'Cookies de terceros: provienen de servicios externos integrados, como la pasarela de pago Wompi y los servicios de verificación antifraude (por ejemplo, Cloudflare Turnstile), y responden a las políticas de privacidad de esos proveedores.',
      ],
    }),
    seccion({
      titulo: '3. Gestión y desactivación',
      contenido: [
        'Usted puede configurar su navegador para bloquear o eliminar cookies en cualquier momento desde los ajustes de privacidad. En Google Chrome, Mozilla Firefox, Safari y Microsoft Edge esta opción se encuentra en configuración > privacidad y seguridad.',
        'Al desactivar las cookies técnicas, algunas funcionalidades de la tienda (como el inicio de sesión o el carrito) podrían dejar de operar correctamente.',
      ],
    }),
    seccion({
      titulo: '4. Más información',
      contenido: [
        'Para cualquier duda sobre el uso de cookies, consulte nuestra Política de Privacidad o contáctenos por los canales habilitados en el sitio. Última actualización: Septiembre 2026.',
      ],
    }),
  ]
  return <>{bloques}</>
}

const SECCIONES = {
  terminos: { titulo: 'Términos y Condiciones', descripcion: 'Condiciones de uso de la tienda en línea de Granova y de sus servicios.', contenido: <ContenidoTerminos /> },
  privacidad: { titulo: 'Política de Privacidad', descripcion: 'Tratamiento de datos personales conforme a la Ley 1581 de 2012 (Colombia).', contenido: <ContenidoPrivacidad /> },
  cookies: { titulo: 'Política de Cookies', descripcion: 'Uso de cookies y tecnologías de seguimiento en nuestro sitio.', contenido: <ContenidoCookies /> },
}

export function PaginaLegal({ seccion: seccionKey }) {
  const cfg = SECCIONES[seccionKey] || SECCIONES.terminos
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#1C3A0A] py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-white font-bold text-lg tracking-wide">GRANOVA</Link>
          <span className="text-[#D4C49A] text-xs uppercase tracking-wider">Documento legal</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <nav className="text-xs text-gray-500 mb-4">
          <Link to="/" className="hover:text-[#1C3A0A] underline">Inicio</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{cfg.titulo}</span>
        </nav>
        <h1 className="text-3xl font-bold text-[#1C3A0A] mb-1">{cfg.titulo}</h1>
        <p className="text-sm text-gray-500 mb-8">{cfg.descripcion}</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
          {cfg.contenido}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 Granova · Todos los derechos reservados. Hecho en Colombia.
        </p>
      </main>
    </div>
  )
}

export const TerminosYCondiciones = () => <PaginaLegal seccion="terminos" />
export const PoliticaPrivacidad = () => <PaginaLegal seccion="privacidad" />
export const PoliticaCookies = () => <PaginaLegal seccion="cookies" />