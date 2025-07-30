// frontend-admin/src/pages/Mensajero/PaginaEscaner.tsx
import React from 'react';
import EscanerPaquete from '../../features/mensajero/EscanerPaquete';

const PaginaEscaner: React.FC = () => {
  
  const handleScanSuccess = (codigoEscaneado: string) => {
    // Aquí irá la lógica para verificar el código y llamar a la API
    console.log(`Código recibido en la página: ${codigoEscaneado}`);
    alert(`Paquete escaneado: ${codigoEscaneado}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Escanear Paquete</h1>
      <div className="p-4 bg-white rounded-lg shadow">
        <EscanerPaquete onScanSuccess={handleScanSuccess} />
      </div>
      <p className="text-sm text-center text-gray-500">
        Apunta la cámara al código de barras del paquete.
      </p>
    </div>
  );
};

export default PaginaEscaner;