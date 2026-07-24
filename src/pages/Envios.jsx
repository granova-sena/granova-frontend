import { useState } from 'react'

function Envios() {
  const [shipments, setShipments] = useState({
    preparando: [
      {
        id: '#ORV-0482',
        name: 'Café Molido Especial',
        weight: '1kg',
        category: 'Alajuela - Chachagua',
        image: 'https://via.placeholder.com/150'
      },
      {
        id: '#ORV-0480',
        name: 'Espresso Blend',
        weight: '2kg',
        category: 'Moravia - El Porvenir',
        image: 'https://via.placeholder.com/150'
      }
    ],
    en_transito: [
      {
        id: '#ORV-0481',
        name: 'Café Molido Wetshend',
        weight: '3kg',
        category: 'Cartago - Chachagua',
        image: 'https://via.placeholder.com/150'
      }
    ],
    entregado: [
      {
        id: '#ORV-0479',
        name: 'Granos Espresso',
        weight: '1kg',
        category: 'Barva/Isaguaes - Cartago',
        image: 'https://via.placeholder.com/150'
      }
    ],
    novedad: [
      {
        id: '#ORV-0477',
        name: 'Café Tostado',
        weight: '2kg',
        category: 'Barva/Isaguaes - Cartago',
        image: 'https://via.placeholder.com/150'
      }
    ]
  })

  const ShipmentCard = ({ item }) => (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-200 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900">{item.id}</p>
        <p className="text-xs text-gray-600 mt-1">{item.name} {item.weight}</p>
        <p className="text-xs text-gray-500 mt-1">{item.category}</p>
      </div>
    </div>
  )

  const Column = ({ title, badgeColor, items }) => (
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: badgeColor,
                color: 'white'
              }}>
          {title}
        </span>
        <span className="text-sm font-medium text-gray-600">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <ShipmentCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">Sin envíos en este estado</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Seguimiento de envios</h1>
        <p className="text-sm text-white">Rastread del estado de paquetes en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Column 
          title="Preparando" 
          badgeColor="#4CAF50"
          items={shipments.preparando} 
        />
        <Column 
          title="En tránsito" 
          badgeColor="#2196F3"
          items={shipments.en_transito} 
        />
        <Column 
          title="Entregado" 
          badgeColor="#4CAF50"
          items={shipments.entregado} 
        />
        <Column 
          title="Novedad" 
          badgeColor="#FFA500"
          items={shipments.novedad} 
        />
      </div>
    </div>
  )
}

export default Envios