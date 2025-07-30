import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

interface EscanerPaqueteProps {
  onScanSuccess: (codigo: string) => void;
}

const QRCODE_REGION_ID = "html5-qrcode-scanner-region";

const EscanerPaquete: React.FC<EscanerPaqueteProps> = ({ onScanSuccess }) => {

  useEffect(() => {
    // Declaramos la variable del escáner que será accesible en todo el efecto
    let html5QrcodeScanner: Html5Qrcode | undefined;

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    // Callback de éxito
    const qrCodeSuccessCallback = (decodedText: string, _decodedResult: any) => {
      onScanSuccess(decodedText);
    };

    // Creamos la instancia y la guardamos
    html5QrcodeScanner = new Html5Qrcode(QRCODE_REGION_ID, { verbose: false });
    
    // Iniciamos el escáner
    html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback,
      undefined
    ).catch((err) => {
      console.error("No se pudo iniciar el escáner:", err);
      if (err.name === 'NotAllowedError') {
        toast.error('Necesitas dar permiso para usar la cámara.');
      }
    });

    // Función de limpieza
    return () => {
      console.log("Desmontando... intentando detener el escáner.");
      
      // Verificamos si la instancia fue creada y si está escaneando
      if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        // El método .stop() DEVUELVE una Promise, por lo que podemos usar .catch()
        html5QrcodeScanner.stop()
          .then(() => {
            console.log("Escáner detenido exitosamente.");
          })
          .catch((err) => {
            console.error("Error al detener el escáner al desmontar.", err);
          });
      }
    };
  }, [onScanSuccess]); // El array de dependencias no cambia

  return (
    <div>
      <p className="text-center text-sm text-gray-600 mb-2">Apunta la cámara al código de barras</p>
      <div id={QRCODE_REGION_ID} style={{ width: '100%', minHeight: '300px', border: '1px solid #ccc' }}></div>
    </div>
  );
};

export default EscanerPaquete;