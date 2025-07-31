import React, { useEffect, useRef } from 'react';
import { 
  Html5Qrcode, 
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats 
} from 'html5-qrcode';
import toast from 'react-hot-toast';
import beepSound from '../../assets/sounds/scan-beep.mp3';

interface EscanerPaqueteProps {
  onScanSuccess: (codigo: string) => void;
}

const QRCODE_REGION_ID = "html5-qrcode-scanner-region";

const EscanerPaquete: React.FC<EscanerPaqueteProps> = ({ onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioRef = useRef(new Audio(beepSound));
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === true) {
      return;
    }
    effectRan.current = true;

    const scannerConfig = { 
        verbose: false,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.QR_CODE,
        ]
      };

    const html5QrcodeScanner = new Html5Qrcode(QRCODE_REGION_ID, scannerConfig);
    scannerRef.current = html5QrcodeScanner;

    const qrCodeSuccessCallback = (decodedText: string, _decodedResult: any) => {
      audioRef.current.play().catch(e => console.error("Error al reproducir sonido:", e));
      onScanSuccess(decodedText);
    };
    
    const config = { 
      fps: 20, 
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
          width: Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8),
          height: Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.4),
      }),
      rememberLastUsedCamera: true,
    };

    html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback,
      undefined
    ).catch((err: any) => { // <-- Añadimos tipo 'any' explícito al error aquí
      console.error("No se pudo iniciar el escáner:", err);
      if (err.name === 'NotAllowedError') {
        toast.error('Necesitas dar permiso para usar la cámara.');
      }
    });

    // --- LA CORRECCIÓN PRINCIPAL ESTÁ EN LA LIMPIEZA ---
    return () => {
      console.log("Limpiando el escáner.");
      
      const scanner = scannerRef.current;
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        // El método .stop() devuelve una Promise. Lo manejamos de forma segura.
        scanner.stop()
          .then(() => {
            console.log("Escáner detenido exitosamente.");
          })
          .catch((err: any) => { // <-- Añadimos tipo 'any' explícito al error
            console.error("Fallo al detener el escáner al desmontar.", err);
          });
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border">
      <div id={QRCODE_REGION_ID} style={{ width: '100%' }}></div>
    </div>
  );
};

export default EscanerPaquete;