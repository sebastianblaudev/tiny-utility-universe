interface ComandaData {
  mesa: string;
  numeroPedido: number;
  mesero: string;
  fecha: string;
  items: Array<{
    nombre: string;
    cantidad: number;
    notas: string;
  }>;
}

interface ComandaTicketProps {
  receiptData: ComandaData;
}

export function ComandaTicket({ receiptData }: ComandaTicketProps) {
  if (!receiptData) return null;

  return (
    <div className="max-w-sm mx-auto bg-white p-4 font-mono text-sm">
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">COMANDA DE COCINA</h1>
        <div className="border-b border-gray-300 my-2"></div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between">
          <span>Mesa:</span>
          <span className="font-bold">{receiptData.mesa}</span>
        </div>
        <div className="flex justify-between">
          <span>Pedido #:</span>
          <span className="font-bold">{receiptData.numeroPedido}</span>
        </div>
        <div className="flex justify-between">
          <span>Mesero:</span>
          <span>{receiptData.mesero}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha:</span>
          <span>{receiptData.fecha}</span>
        </div>
      </div>

      <div className="border-b border-gray-300 my-2"></div>

      <div className="mb-4">
        <h2 className="font-bold text-center mb-2">PRODUCTOS A PREPARAR</h2>
        {receiptData.items.map((item, index) => (
          <div key={index} className="mb-3 border-b border-gray-200 pb-2">
            <div className="flex justify-between items-start">
              <span className="font-bold flex-1">{item.nombre}</span>
              <span className="font-bold ml-2">x{item.cantidad}</span>
            </div>
            {item.notas && (
              <div className="text-xs text-gray-600 mt-1 italic">
                Nota: {item.notas}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-b border-gray-300 my-2"></div>

      <div className="text-center text-xs">
        <p>*** COMANDA DE COCINA ***</p>
        <p>Verificar pedido completo antes de servir</p>
      </div>
    </div>
  );
}