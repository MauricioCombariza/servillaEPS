// frontend-admin/src/features/mensajero/EscanerPaquete.tsx
import React, { useEffect, useRef } from 'react';
import { 
  Html5Qrcode, 
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats 
} from 'html5-qrcode';
import toast from 'react-hot-toast';
// Importa tu archivo de sonido. Asegúrate de que la ruta sea correcta.
import beepSound from '../../assets/sounds/beep.mp3';

interface EscanerPaqueteProps {
  onScanSuccess: (codigo: string) => void;
}

const QRCODE_REGION_ID = "html5-qrcode-scanner-region";

const EscanerPaquete: React.FC<EscanerPaqueteProps> = ({ onScanSuccess }) => {
  // Referencia para la instancia del escáner
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Referencia para el objeto de audio, para crearlo solo una vez
  const audioRef = useRef(new Audio(beepSound));
  // Bandera para prevenir la doble inicialización en StrictMode
  const effectRan = useRef(false);

  useEffect(() => {
    // Guarda de StrictMode
    if (effectRan.current === true) {
      return;
    }
    effectRan.current = true;

    // Configuración para el constructor de la librería
    const scannerConfig = { 
        verbose: false,
        formatsToSupport: [ // Le decimos explícitamente qué formatos buscar
            Html5QrcodeSupportedFormats.CODE_128, // Muy común en logística
            Html5QrcodeSupportedFormats.EAN_13,   // Códigos de barras de productos
            Html5QrcodeSupportedFormats.QR_CODE,  // Códigos QR
        ]
      };

    // Creamos la instancia y la guardamos en la referencia
    const html5QrcodeScanner = new Html5Qrcode(QRCODE_REGION_ID, scannerConfig);
    scannerRef.current = html5QrcodeScanner;

    // Callback de éxito de escaneo
    const qrCodeSuccessCallback = (decodedText: string, _decodedResult: any) => {
      // Reproducimos el sonido de feedback
      audioRef.current.play().catch(e => console.error("Error al reproducir sonido:", e));
      
      // Llamamos a la función que nos pasaron por props
      onScanSuccess(decodedText);
      
      // Detenemos el escáner para evitar múltiples lecturas y apagar la cámara
      if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
        scannerRef.current.stop().catch(err => {
          console.error("Fallo al detener el escáner después del éxito.", err);
        });
      }
    };
    
    // Configuración para la cámara y el visor
    const config = { 
      fps: 20, // Aumentamos FPS para una detección más fluida
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const boxSize = Math.floor(minEdge * 0.8);
        return {
          width: boxSize,
          height: boxSize / 2, // Caja rectangular, optimizada para códigos de barras lineales
        };
      },
      rememberLastUsedCamera: true,
    };

    // Iniciamos el escáner
    html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback,
      undefined // No necesitamos un callback de error continuo
    ).catch((err) => {
      console.error("No se pudo iniciar el escáner:", err);
      if (err.name === 'NotAllowedError') {
        toast.error('Necesitas dar permiso para usar la cámara.');
      }
    });

    // Función de limpieza que se ejecuta cuando el componente se desmonta
    return () => {
      console.log("Limpiando el escáner.");
      // Usamos .clear() que es un alias seguro de .stop()
      scannerRef.current?.clear().catch(err => {
        console.error("Fallo al limpiar el escáner al desmontar.", err);
      });
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border">
      <div id={QRCODE_REGION_ID} style={{ width: '100%' }}></div>
    </div>
  );
};

export default EscanerPaquete;