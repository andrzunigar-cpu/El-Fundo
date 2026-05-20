import React, { useState } from 'react'
import { Printer, Cloud, Database, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export function SettingsView() {
  const testPrint = async () => {
    const api = (window as any).posAPI
    await api.printer.testPrint()
    toast.success('Test enviado a impresora')
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-950 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold mb-4">Configuración</h1>

        <SettingsCard icon={Printer} title="Impresora térmica">
          <p className="text-sm text-gray-400 mb-3">Imprime tickets de venta en impresora ESC/POS (USB o IP).</p>
          <button onClick={testPrint} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
            Imprimir test
          </button>
          <p className="text-xs text-gray-500 mt-2">Configuración avanzada disponible en próxima versión.</p>
        </SettingsCard>

        <SettingsCard icon={Cloud} title="Sincronización con la nube">
          <p className="text-sm text-gray-400 mb-3">
            Cada 5 minutos el sistema intenta enviar las ventas al servidor de la nube.
            Si no hay internet, las ventas quedan en cola y se envían cuando vuelve la conexión.
          </p>
          <p className="text-xs text-gray-500">Estado: Modo local activo</p>
        </SettingsCard>

        <SettingsCard icon={Database} title="Base de datos local">
          <p className="text-sm text-gray-400">
            Toda la información (productos, ventas, stock, clientes) se guarda en SQLite localmente.
            Funciona sin internet y respalda automáticamente.
          </p>
        </SettingsCard>

        <SettingsCard icon={Info} title="Acerca de">
          <p className="text-sm text-gray-400">El Fundo POS · v1.0.0</p>
          <p className="text-xs text-gray-500 mt-1">Sistema offline-first para carnicería</p>
        </SettingsCard>
      </div>
    </div>
  )
}

function SettingsCard({ icon: Icon, title, children }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-red-500" />
        <h3 className="font-bold">{title}</h3>
      </div>
      {children}
    </div>
  )
}
